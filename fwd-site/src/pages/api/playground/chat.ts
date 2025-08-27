import type { APIRoute } from 'astro';

export const prerender = false;

const SYSTEM_PROMPTS = {
  chat: "You are an online retail customer service assistant. Help with orders, refunds, shipping, and product questions. Respond in exactly 20 tokens. Be friendly and helpful."
};

const CHAT_TEMPLATES = {
  greeting: "Hello! Welcome to our store. How can I help with your order today?",
  help: "I'd be happy to help! Do you need assistance with an order or product?",
  order: "I can track your order. Please provide your order number or email address.",
  refund: "I'll help process your refund. Can you provide your order number please?",
  shipping: "Standard shipping takes 3-5 days. Express options are available at checkout.",
  product: "I'll help you find the perfect product. What are you looking for today?",
  general: "Thanks for shopping with us! How can I assist you today?"
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { message, conversationHistory = [] } = await request.json();
    
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

    // Build messages array with conversation history
    const messages = [
      { role: 'system', content: SYSTEM_PROMPTS.chat },
      ...conversationHistory.slice(-4), // Keep last 4 messages for context
      { role: 'user', content: message }
    ];

    // Call OpenAI with strict 20 token limit
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
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
  if (lower.includes('track') || lower.includes('order') || lower.includes('where is')) {
    return CHAT_TEMPLATES.order;
  }
  if (lower.includes('refund') || lower.includes('return') || lower.includes('money back')) {
    return CHAT_TEMPLATES.refund;
  }
  if (lower.includes('shipping') || lower.includes('delivery') || lower.includes('how long')) {
    return CHAT_TEMPLATES.shipping;
  }
  if (lower.includes('product') || lower.includes('item') || lower.includes('looking for')) {
    return CHAT_TEMPLATES.product;
  }
  
  return CHAT_TEMPLATES.general;
}