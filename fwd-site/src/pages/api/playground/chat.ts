import type { APIRoute } from 'astro';

const SYSTEM_PROMPTS = {
  chat: "You are a helpful customer service chatbot. Respond in exactly 20 tokens. Be friendly, direct, and solution-focused."
};

const CHAT_TEMPLATES = {
  greeting: "Hello! I'm here to help. What can I assist you with today?",
  help: "I'd be happy to help! Can you tell me more about what you need?",
  technical: "Let me check that for you. I'll have an answer in just a moment.",
  order: "I can help with your order. Please provide your order number to proceed.",
  general: "Thanks for reaching out! How can I make your day better?"
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { message } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ 
        error: 'Please provide a message.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKey = import.meta.env.OPENAI_API_KEY;
    
    // Use template if no API key
    if (!apiKey || apiKey === 'demo') {
      const template = selectChatTemplate(message);
      return new Response(JSON.stringify({ 
        content: template,
        tokens: 20
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Call OpenAI with strict 20 token limit
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.chat },
          { role: 'user', content: message }
        ],
        max_tokens: 20,
        temperature: 0.4
      })
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const data = await openAIResponse.json();
    const content = data.choices[0]?.message?.content || '';
    const tokens = data.usage?.completion_tokens || 20;
    
    return new Response(JSON.stringify({ 
      content,
      tokens
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Chat response error:', error);
    
    // Return fallback template
    return new Response(JSON.stringify({ 
      content: CHAT_TEMPLATES.general,
      tokens: 20
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

function selectChatTemplate(message: string): string {
  const lower = message.toLowerCase();
  
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return CHAT_TEMPLATES.greeting;
  }
  if (lower.includes('help') || lower.includes('assist') || lower.includes('support')) {
    return CHAT_TEMPLATES.help;
  }
  if (lower.includes('error') || lower.includes('problem') || lower.includes('issue')) {
    return CHAT_TEMPLATES.technical;
  }
  if (lower.includes('order') || lower.includes('purchase') || lower.includes('buy')) {
    return CHAT_TEMPLATES.order;
  }
  
  return CHAT_TEMPLATES.general;
}