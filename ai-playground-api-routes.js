// AI Playground API Routes
// Server-side implementation for secure API key management and rate limiting

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { HfInference } from '@huggingface/inference';
import OpenAI from 'openai';
import * as mindee from 'mindee';
import fetch from 'node-fetch';

// ============================================
// Configuration
// ============================================

const config = {
  huggingface: {
    apiKey: process.env.HUGGINGFACE_API_KEY,
    models: {
      text: 'microsoft/DialoGPT-medium',
      image: 'stabilityai/stable-diffusion-2-1',
      embedding: 'sentence-transformers/all-MiniLM-L6-v2',
    },
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-3.5-turbo',
  },
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL',
  },
  mindee: {
    apiKey: process.env.MINDEE_API_KEY,
  },
  voiceflow: {
    apiKey: process.env.VOICEFLOW_API_KEY,
    projectId: process.env.VOICEFLOW_PROJECT_ID,
  },
};

// ============================================
// Rate Limiting Setup
// ============================================

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 requests per hour
  analytics: true,
});

// IP-based rate limiting for free tier
const freeRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, '1 h'), // 50 requests per hour for free tier
});

// ============================================
// Service Clients
// ============================================

const hf = new HfInference(config.huggingface.apiKey);
const openai = new OpenAI({ apiKey: config.openai.apiKey });
const mindeeClient = new mindee.Client({ apiKey: config.mindee.apiKey });

// ============================================
// Utility Functions
// ============================================

async function checkRateLimit(req, isPremium = false) {
  const identifier = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const limiter = isPremium ? ratelimit : freeRatelimit;
  
  const { success, limit, reset, remaining } = await limiter.limit(identifier);
  
  return {
    success,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': new Date(reset).toISOString(),
    },
  };
}

function sanitizeInput(input) {
  // Remove any potential harmful content
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 1000); // Limit input length
}

async function cacheResult(key, value, ttl = 3600) {
  await redis.setex(key, ttl, JSON.stringify(value));
}

async function getCached(key) {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

// ============================================
// API Routes
// ============================================

// Text Generation Endpoint
export async function POST_generateText(req, res) {
  try {
    // Rate limiting
    const { success, headers } = await checkRateLimit(req);
    Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
    
    if (!success) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }

    const { prompt, service = 'huggingface', options = {} } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const sanitizedPrompt = sanitizeInput(prompt);
    const cacheKey = `text:${service}:${Buffer.from(sanitizedPrompt).toString('base64')}`;
    
    // Check cache
    const cached = await getCached(cacheKey);
    if (cached) {
      return res.json({ text: cached, cached: true });
    }

    let result;
    
    switch (service) {
      case 'huggingface':
        result = await hf.textGeneration({
          model: config.huggingface.models.text,
          inputs: sanitizedPrompt,
          parameters: {
            max_new_tokens: options.maxTokens || 150,
            temperature: options.temperature || 0.7,
            top_p: options.topP || 0.9,
            do_sample: true,
          },
        });
        break;
        
      case 'openai':
        const completion = await openai.chat.completions.create({
          model: config.openai.model,
          messages: [{ role: 'user', content: sanitizedPrompt }],
          max_tokens: options.maxTokens || 150,
          temperature: options.temperature || 0.7,
        });
        result = { generated_text: completion.choices[0].message.content };
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid service specified' });
    }

    const generatedText = result.generated_text || result;
    await cacheResult(cacheKey, generatedText);
    
    res.json({ text: generatedText, cached: false });
  } catch (error) {
    console.error('Text generation error:', error);
    res.status(500).json({ error: 'Text generation failed' });
  }
}

// Document OCR Endpoint
export async function POST_processDocument(req, res) {
  try {
    const { success, headers } = await checkRateLimit(req);
    Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
    
    if (!success) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    const { document, type = 'invoice' } = req.body;
    
    if (!document) {
      return res.status(400).json({ error: 'Document is required' });
    }

    let apiResponse;
    
    switch (type) {
      case 'invoice':
        apiResponse = await mindeeClient.docFromBase64(
          document,
          'invoice',
          { includeWords: true }
        );
        
        const prediction = apiResponse.document.inference.prediction;
        
        return res.json({
          invoiceNumber: prediction.invoice_number?.value,
          date: prediction.date?.value,
          dueDate: prediction.due_date?.value,
          total: prediction.total_amount?.value,
          tax: prediction.total_tax?.value,
          supplier: prediction.supplier?.value,
          customer: prediction.customer?.value,
          lineItems: prediction.line_items?.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            total: item.line_total,
          })),
          confidence: prediction.invoice_number?.confidence,
        });
        
      case 'receipt':
        apiResponse = await mindeeClient.docFromBase64(
          document,
          'expense_receipts',
          { includeWords: true }
        );
        
        const receiptData = apiResponse.document.inference.prediction;
        
        return res.json({
          merchant: receiptData.supplier?.value,
          date: receiptData.date?.value,
          total: receiptData.total_amount?.value,
          tax: receiptData.total_tax?.value,
          category: receiptData.category?.value,
          paymentMethod: receiptData.payment_method?.value,
        });
        
      default:
        return res.status(400).json({ error: 'Invalid document type' });
    }
  } catch (error) {
    console.error('Document processing error:', error);
    res.status(500).json({ error: 'Document processing failed' });
  }
}

// Text-to-Speech Endpoint
export async function POST_generateSpeech(req, res) {
  try {
    const { success, headers } = await checkRateLimit(req);
    Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
    
    if (!success) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    const { text, voice = 'rachel', modelId = 'eleven_monolingual_v1' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const sanitizedText = sanitizeInput(text);
    
    // ElevenLabs API call
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${config.elevenlabs.voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': config.elevenlabs.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: sanitizedText,
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error('ElevenLabs API error');
    }

    const audioBuffer = await response.buffer();
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audioBuffer);
  } catch (error) {
    console.error('Speech generation error:', error);
    res.status(500).json({ error: 'Speech generation failed' });
  }
}

// Image Generation Endpoint
export async function POST_generateImage(req, res) {
  try {
    const { success, headers } = await checkRateLimit(req);
    Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
    
    if (!success) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    const { prompt, style = 'realistic', size = '512x512' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const sanitizedPrompt = sanitizeInput(prompt);
    const cacheKey = `image:${Buffer.from(sanitizedPrompt + style + size).toString('base64')}`;
    
    // Check cache
    const cached = await getCached(cacheKey);
    if (cached) {
      return res.json({ image: cached, cached: true });
    }

    // Use Hugging Face for image generation
    const result = await hf.textToImage({
      model: config.huggingface.models.image,
      inputs: `${sanitizedPrompt}, ${style} style`,
      parameters: {
        negative_prompt: 'blurry, bad quality, low resolution',
        width: parseInt(size.split('x')[0]),
        height: parseInt(size.split('x')[1]),
      },
    });

    // Convert blob to base64
    const buffer = await result.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const imageUrl = `data:image/png;base64,${base64}`;
    
    await cacheResult(cacheKey, imageUrl, 7200); // Cache for 2 hours
    
    res.json({ image: imageUrl, cached: false });
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: 'Image generation failed' });
  }
}

// Email Generation Endpoint
export async function POST_generateEmail(req, res) {
  try {
    const { success, headers } = await checkRateLimit(req);
    Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
    
    if (!success) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    const { context, tone = 'professional', type = 'response' } = req.body;
    
    if (!context) {
      return res.status(400).json({ error: 'Context is required' });
    }

    const prompt = `Write a ${tone} email ${type} for the following context: ${context}. 
                   Make it concise, clear, and appropriate for business communication.`;

    const result = await hf.textGeneration({
      model: config.huggingface.models.text,
      inputs: sanitizeInput(prompt),
      parameters: {
        max_new_tokens: 200,
        temperature: 0.7,
        top_p: 0.9,
      },
    });

    res.json({ 
      email: result.generated_text,
      metadata: {
        tone,
        type,
        wordCount: result.generated_text.split(' ').length,
      },
    });
  } catch (error) {
    console.error('Email generation error:', error);
    res.status(500).json({ error: 'Email generation failed' });
  }
}

// Chatbot Conversation Endpoint
export async function POST_chatbotConverse(req, res) {
  try {
    const { success, headers } = await checkRateLimit(req);
    Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
    
    if (!success) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    const { message, sessionId, context = {} } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Store conversation context in Redis
    const sessionKey = `chat:${sessionId}`;
    let conversationHistory = await getCached(sessionKey) || [];
    
    conversationHistory.push({ role: 'user', content: message });
    
    // Keep only last 10 messages for context
    if (conversationHistory.length > 10) {
      conversationHistory = conversationHistory.slice(-10);
    }

    const systemPrompt = `You are a helpful AI assistant for a business automation platform. 
                         Be concise, friendly, and focus on how AI can help businesses save time and money.
                         Context: ${JSON.stringify(context)}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 150,
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content;
    conversationHistory.push({ role: 'assistant', content: reply });
    
    // Cache conversation for 1 hour
    await cacheResult(sessionKey, conversationHistory, 3600);

    res.json({ 
      reply,
      sessionId,
      conversationLength: conversationHistory.length,
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: 'Chatbot conversation failed' });
  }
}

// Analytics Endpoint
export async function POST_trackDemo(req, res) {
  try {
    const { demoId, action, metadata = {} } = req.body;
    
    if (!demoId || !action) {
      return res.status(400).json({ error: 'Demo ID and action are required' });
    }

    const analyticsKey = `analytics:${new Date().toISOString().split('T')[0]}`;
    const event = {
      demoId,
      action,
      timestamp: new Date().toISOString(),
      metadata,
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    // Store in Redis for analytics processing
    await redis.rpush(analyticsKey, JSON.stringify(event));
    await redis.expire(analyticsKey, 2592000); // Keep for 30 days

    // Update demo statistics
    const statsKey = `stats:demo:${demoId}`;
    const stats = await getCached(statsKey) || {
      views: 0,
      completions: 0,
      totalTime: 0,
      avgRating: 0,
    };

    switch (action) {
      case 'view':
        stats.views++;
        break;
      case 'complete':
        stats.completions++;
        if (metadata.timeSpent) {
          stats.totalTime += metadata.timeSpent;
        }
        break;
      case 'rate':
        if (metadata.rating) {
          stats.avgRating = (stats.avgRating * stats.completions + metadata.rating) / (stats.completions + 1);
        }
        break;
    }

    await cacheResult(statsKey, stats, 86400); // Cache for 24 hours

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to track demo analytics' });
  }
}

// Get Demo Statistics
export async function GET_demoStats(req, res) {
  try {
    const { demoId } = req.query;
    
    if (!demoId) {
      return res.status(400).json({ error: 'Demo ID is required' });
    }

    const statsKey = `stats:demo:${demoId}`;
    const stats = await getCached(statsKey) || {
      views: 0,
      completions: 0,
      totalTime: 0,
      avgRating: 0,
    };

    const conversionRate = stats.views > 0 ? (stats.completions / stats.views * 100).toFixed(2) : 0;
    const avgTimeSpent = stats.completions > 0 ? Math.floor(stats.totalTime / stats.completions) : 0;

    res.json({
      ...stats,
      conversionRate: `${conversionRate}%`,
      avgTimeSpent: `${avgTimeSpent}s`,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
}

// Health Check Endpoint
export async function GET_health(req, res) {
  try {
    // Check Redis connection
    await redis.ping();
    
    // Check API keys are configured
    const services = {
      huggingface: !!config.huggingface.apiKey,
      openai: !!config.openai.apiKey,
      elevenlabs: !!config.elevenlabs.apiKey,
      mindee: !!config.mindee.apiKey,
    };

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services,
      redis: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
}

// ============================================
// Middleware
// ============================================

export function corsMiddleware(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
}

export function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}

// ============================================
// Export Routes Map
// ============================================

export const routes = {
  '/api/ai/generate': { POST: POST_generateText },
  '/api/ocr/process': { POST: POST_processDocument },
  '/api/tts/generate': { POST: POST_generateSpeech },
  '/api/image/generate': { POST: POST_generateImage },
  '/api/email/generate': { POST: POST_generateEmail },
  '/api/chat/converse': { POST: POST_chatbotConverse },
  '/api/analytics/track': { POST: POST_trackDemo },
  '/api/analytics/stats': { GET: GET_demoStats },
  '/api/health': { GET: GET_health },
};

export default routes;