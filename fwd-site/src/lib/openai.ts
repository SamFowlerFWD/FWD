interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  message: string;
  service?: string;
  savings?: number;
  error?: string;
}

// Cache for common questions to reduce API calls
const responseCache = new Map<string, ChatResponse>();

// Rate limiting
const rateLimiter = new Map<string, number[]>();
const RATE_LIMIT = 10; // 10 requests per minute
const RATE_WINDOW = 60000; // 1 minute in ms

export function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const requests = rateLimiter.get(clientId) || [];
  
  // Remove old requests outside the window
  const validRequests = requests.filter(time => now - time < RATE_WINDOW);
  
  if (validRequests.length >= RATE_LIMIT) {
    return false;
  }
  
  validRequests.push(now);
  rateLimiter.set(clientId, validRequests);
  return true;
}

// System prompt optimized for minimal tokens
const SYSTEM_PROMPT = `You are FWD's AI assistant. In 50 words or less, help identify business problems and suggest solutions from: automation (£799), websites (£799), apps (£1,299), or hosting (£99/mo). Be direct and specific. Format: Brief analysis. Recommendation: [service]. Estimated savings: £[amount]/year.`;

// Fallback responses for when API fails
const FALLBACK_RESPONSES: Record<string, ChatResponse> = {
  'retail': {
    message: "Retail businesses typically lose 20+ hours weekly on inventory and customer management. Recommendation: Business Process Automation. Estimated savings: £31,200/year.",
    service: "automation",
    savings: 31200
  },
  'hospitality': {
    message: "Hospitality venues waste 30+ hours weekly on bookings and staff scheduling. Recommendation: Custom App Development. Estimated savings: £46,800/year.",
    service: "app",
    savings: 46800
  },
  'service': {
    message: "Service businesses spend 25+ hours weekly on scheduling and invoicing. Recommendation: Business Process Automation. Estimated savings: £39,000/year.",
    service: "automation",
    savings: 39000
  },
  'default': {
    message: "Most businesses can save 20+ hours weekly through automation. Recommendation: Business Process Automation. Estimated savings: £31,200/year.",
    service: "automation",
    savings: 31200
  }
};

export async function chatWithAI(
  messages: ChatMessage[],
  apiKey: string,
  clientId: string
): Promise<ChatResponse> {
  // Check rate limit
  if (!checkRateLimit(clientId)) {
    return {
      message: "Rate limit exceeded. Please wait a moment before trying again.",
      error: "rate_limit"
    };
  }

  // Check cache for common questions
  const lastUserMessage = messages[messages.length - 1]?.content.toLowerCase() || '';
  const cacheKey = lastUserMessage.slice(0, 50);
  
  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey)!;
  }

  // If no API key, use fallback
  if (!apiKey || apiKey === 'demo') {
    const businessType = detectBusinessType(lastUserMessage);
    return FALLBACK_RESPONSES[businessType] || FALLBACK_RESPONSES.default;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages
        ],
        max_tokens: 150,
        temperature: 0.3,
        top_p: 0.9,
        frequency_penalty: 0.5,
        presence_penalty: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || '';
    
    // Parse the response to extract service and savings
    const result = parseAIResponse(aiMessage);
    
    // Cache the response
    responseCache.set(cacheKey, result);
    
    // Clear cache after 15 minutes
    setTimeout(() => responseCache.delete(cacheKey), 900000);
    
    return result;
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Return intelligent fallback based on context
    const businessType = detectBusinessType(lastUserMessage);
    return FALLBACK_RESPONSES[businessType] || FALLBACK_RESPONSES.default;
  }
}

function detectBusinessType(message: string): string {
  const lower = message.toLowerCase();
  
  if (lower.includes('retail') || lower.includes('shop') || lower.includes('store')) {
    return 'retail';
  }
  if (lower.includes('restaurant') || lower.includes('hotel') || lower.includes('hospitality')) {
    return 'hospitality';
  }
  if (lower.includes('service') || lower.includes('consulting') || lower.includes('agency')) {
    return 'service';
  }
  
  return 'default';
}

function parseAIResponse(message: string): ChatResponse {
  const result: ChatResponse = { message };
  
  // Extract service recommendation
  if (message.includes('automation') || message.includes('Automation')) {
    result.service = 'automation';
  } else if (message.includes('website') || message.includes('Website')) {
    result.service = 'website';
  } else if (message.includes('app') || message.includes('App')) {
    result.service = 'app';
  } else if (message.includes('hosting') || message.includes('Hosting')) {
    result.service = 'hosting';
  }
  
  // Extract savings estimate
  const savingsMatch = message.match(/£([\d,]+)/);
  if (savingsMatch) {
    result.savings = parseInt(savingsMatch[1].replace(',', ''));
  }
  
  return result;
}

// Pre-written templates for quick demos (no API needed)
export const DEMO_TEMPLATES = {
  email: {
    professional: "Thank you for your inquiry. I'll review this and respond within 24 hours with detailed information.",
    friendly: "Hi there! Thanks for reaching out. I'd love to help with this. Let me look into it and get back to you shortly.",
    urgent: "I've received your urgent request and am prioritizing it immediately. You can expect a response within 2 hours."
  },
  product: {
    tech: "This cutting-edge solution leverages AI to streamline your workflow, reducing manual tasks by 90% while improving accuracy.",
    retail: "Premium quality meets everyday affordability. Crafted with attention to detail and backed by our satisfaction guarantee.",
    service: "Expert solutions tailored to your unique needs. We handle the complexity so you can focus on growth."
  }
};