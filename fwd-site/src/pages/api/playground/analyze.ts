import type { APIRoute } from 'astro';

export const prerender = false;

const SYSTEM_PROMPTS = {
  analyzer: `You are FWD's AI assistant helping business owners discover how AI can transform their operations.

RULES:
- Always acknowledge and directly respond to what the user just said
- Be conversational and natural, not scripted
- When asked about experience/clients, mention specific relevant success stories
- For hair/beauty salons: mention automated booking systems, reminder texts, inventory management
- For restaurants: mention reservation systems, order management, customer feedback automation
- For retail: mention inventory tracking, customer service chatbots, sales analytics
- For trades: mention job scheduling, quote generation, invoice automation
- Keep responses under 80 tokens
- Be specific about the solution that matches their exact problem
- If asked if you're AI, be honest and explain your capabilities

Focus on understanding their specific pain points and recommending the right FWD service.`
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

    const { problem, conversationHistory = [] } = await request.json();
    
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

    // Build messages array with conversation history
    const messages = [
      { role: 'system', content: SYSTEM_PROMPTS.analyzer },
      ...conversationHistory,
      { role: 'user', content: problem }
    ];

    // Call OpenAI API with strict token limit
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 100,
        temperature: 0.7,
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
  
  if (lower.includes('restaurant')) {
    return {
      problem: 'Constant phone interruptions',
      solution: 'automation',
      service: 'Business Process Automation',
      message: "I know the feeling - your phone never stops ringing during service, tables calling to book while you're plating food. AI handles all bookings 24/7 via text and web, so you never miss a reservation and can focus on cooking. Like having a full-time receptionist who never takes breaks."
    };
  }
  
  if (lower.includes('retail') || lower.includes('shop')) {
    return {
      problem: 'Repetitive customer questions',
      solution: 'automation',
      service: 'AI-Powered Website',
      message: "You're constantly answering the same questions - 'What time do you open?', 'Do you have this in stock?'. An AI chatbot on your website handles these instantly 24/7. You'll stop feeling like a human FAQ and can actually help customers who need real assistance."
    };
  }
  
  if (lower.includes('hair') || lower.includes('salon') || lower.includes('beauty')) {
    return {
      problem: 'Appointment chaos',
      solution: 'automation',
      service: 'Business Process Automation',
      message: "You're cutting hair with one hand and answering the phone with the other. Clients text at midnight wanting appointments. AI booking system lets clients book, change, and confirm appointments 24/7 by text. No more playing phone tag or double bookings - just focus on your craft."
    };
  }

  if (lower.includes('service') || lower.includes('plumb') || lower.includes('electric') || lower.includes('trade')) {
    return {
      problem: 'Quote and invoice nightmare',
      solution: 'app',
      service: 'Custom App Development',
      message: "You finish a job exhausted, then spend evenings writing quotes and chasing invoices. AI app generates quotes on-site from photos, sends invoices automatically, and chases payment. Get home and actually relax instead of doing paperwork until midnight."
    };
  }
  
  // Default response
  return {
    problem: 'Daily overwhelm',
    solution: 'automation',
    service: 'Business Process Automation',
    message: "Running a business shouldn't mean working 24/7. AI handles the repetitive tasks that steal your time - customer queries, bookings, data entry. Imagine actually having evenings and weekends back. That's what our automation gives you - your life back."
  };
}

function parseAnalysis(message: string) {
  const result: any = { message };
  const lower = message.toLowerCase();
  
  // More intelligent solution detection based on keywords
  if (lower.includes('booking') || lower.includes('appointment') || lower.includes('scheduling') || lower.includes('reminder')) {
    result.solution = 'automation';
    result.service = 'Business Process Automation';
    result.savings = 25000;
  } else if (lower.includes('website') || lower.includes('online presence') || lower.includes('chat') || lower.includes('customer service')) {
    result.solution = 'website';
    result.service = 'AI-Powered Website';
    result.savings = 20000;
  } else if (lower.includes('quote') || lower.includes('invoice') || lower.includes('inventory') || lower.includes('tracking') || lower.includes('manage')) {
    result.solution = 'app';
    result.service = 'Custom App Development';
    result.savings = 30000;
  } else if (lower.includes('hosting') || lower.includes('maintenance') || lower.includes('security')) {
    result.solution = 'hosting';
    result.service = 'AI Hosting & Maintenance';
    result.savings = 15000;
  }
  
  // Extract any specific savings mentioned
  const savingsMatch = message.match(/£([\d,]+)/);
  if (savingsMatch) {
    result.savings = parseInt(savingsMatch[1].replace(',', ''));
  }
  
  return result;
}