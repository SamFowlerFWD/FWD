import type { APIRoute } from 'astro';

const SYSTEM_PROMPTS = {
  analyzer: "You are a business consultant. In 50 tokens maximum: 1) Identify the core problem 2) Recommend ONE solution from: automation/websites/apps/hosting 3) State a specific metric. Format: [Problem]. Solution: [service]. Savings: £[amount]/year."
};

// Simple in-memory rate limiter
const rateLimiter = new Map<string, number[]>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60000;

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const requests = rateLimiter.get(clientId) || [];
  const validRequests = requests.filter(time => now - time < RATE_WINDOW);
  
  if (validRequests.length >= RATE_LIMIT) {
    return false;
  }
  
  validRequests.push(now);
  rateLimiter.set(clientId, validRequests);
  return true;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const clientId = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    if (!checkRateLimit(clientId)) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Please wait before trying again.' 
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { problem } = await request.json();
    
    if (!problem || typeof problem !== 'string') {
      return new Response(JSON.stringify({ 
        error: 'Please provide a business problem description.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKey = import.meta.env.OPENAI_API_KEY;
    
    // Use fallback if no API key
    if (!apiKey || apiKey === 'demo') {
      const response = analyzeProblemFallback(problem);
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Call OpenAI API with strict token limit
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.analyzer },
          { role: 'user', content: problem }
        ],
        max_tokens: 75,
        temperature: 0.3,
        top_p: 0.9
      })
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const data = await openAIResponse.json();
    const message = data.choices[0]?.message?.content || '';
    
    const result = parseAnalysis(message);
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(JSON.stringify({ 
      error: 'Unable to analyze problem. Please try again.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

function analyzeProblemFallback(problem: string) {
  const lower = problem.toLowerCase();
  
  if (lower.includes('email') || lower.includes('customer') || lower.includes('support')) {
    return {
      problem: 'Customer communication inefficiency',
      solution: 'automation',
      service: 'Business Process Automation',
      savings: 31200,
      message: 'Manual customer communications waste 20+ hours weekly. Solution: automation. Savings: £31,200/year.'
    };
  }
  
  if (lower.includes('website') || lower.includes('online') || lower.includes('presence')) {
    return {
      problem: 'Poor online presence',
      solution: 'website',
      service: 'AI-Powered Website',
      savings: 24000,
      message: 'Outdated website losing customers daily. Solution: AI-powered website. Savings: £24,000/year in lost revenue.'
    };
  }
  
  if (lower.includes('inventory') || lower.includes('scheduling') || lower.includes('booking')) {
    return {
      problem: 'Manual process inefficiency',
      solution: 'app',
      service: 'Custom App Development',
      savings: 46800,
      message: 'Manual scheduling wastes 30+ hours weekly. Solution: custom app. Savings: £46,800/year.'
    };
  }
  
  // Default response
  return {
    problem: 'Manual business processes',
    solution: 'automation',
    service: 'Business Process Automation',
    savings: 31200,
    message: 'Manual processes waste 20+ hours weekly. Solution: automation. Savings: £31,200/year.'
  };
}

function parseAnalysis(message: string) {
  const result: any = { message };
  
  // Extract solution type
  if (message.toLowerCase().includes('automation')) {
    result.solution = 'automation';
    result.service = 'Business Process Automation';
  } else if (message.toLowerCase().includes('website')) {
    result.solution = 'website';
    result.service = 'AI-Powered Website';
  } else if (message.toLowerCase().includes('app')) {
    result.solution = 'app';
    result.service = 'Custom App Development';
  } else if (message.toLowerCase().includes('hosting')) {
    result.solution = 'hosting';
    result.service = 'AI Hosting & Maintenance';
  }
  
  // Extract savings
  const savingsMatch = message.match(/£([\d,]+)/);
  if (savingsMatch) {
    result.savings = parseInt(savingsMatch[1].replace(',', ''));
  }
  
  return result;
}