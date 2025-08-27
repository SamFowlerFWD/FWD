import type { APIRoute } from 'astro';

export const prerender = false;

const SYSTEM_PROMPTS = {
  email: "Write professional customer service email responses in exactly 30 tokens. Be helpful, empathetic, and solution-focused."
};

const EMAIL_TEMPLATES = {
  inquiry: "Thank you for contacting us! I'll review your question and respond within 24 hours with helpful information and solutions.",
  order: "Your order has been received and is being processed. You'll receive tracking information within 24 hours via email.",
  refund: "I understand your concern. Your refund request is being processed and will be completed within 3-5 business days.",
  complaint: "I sincerely apologize for your experience. I'm escalating this to our team lead for immediate resolution today.",
  shipping: "Your order shipped today! Tracking number and delivery details have been sent to your email. Thank you for your patience.",
  confirmation: "Perfect! Your request has been confirmed and processed. You'll receive a confirmation email shortly with all details."
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { context, tone = 'professional' } = await request.json();
    
    if (!context || typeof context !== 'string') {
      return new Response(JSON.stringify({ 
        error: 'Please provide email context.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKey = import.meta.env.OPENAI_API_KEY;
    
    // Use template if no API key or demo mode
    if (!apiKey || apiKey === 'demo') {
      const template = selectEmailTemplate(context);
      return new Response(JSON.stringify({ 
        content: template,
        tokens: 30
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Call OpenAI with strict 30 token limit
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.email },
          { role: 'user', content: `Context: ${context}. Tone: ${tone}` }
        ],
        max_tokens: 30,
        temperature: 0.3
      })
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const data = await openAIResponse.json();
    const content = data.choices[0]?.message?.content || '';
    const tokens = data.usage?.completion_tokens || 30;
    
    return new Response(JSON.stringify({ 
      content,
      tokens
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Email generation error:', error);
    
    // Return fallback template
    return new Response(JSON.stringify({ 
      content: EMAIL_TEMPLATES.inquiry,
      tokens: 30
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

function selectEmailTemplate(context: string): string {
  const lower = context.toLowerCase();
  
  if (lower.includes('order') || lower.includes('purchase') || lower.includes('bought')) {
    return EMAIL_TEMPLATES.order;
  }
  if (lower.includes('refund') || lower.includes('return') || lower.includes('money back')) {
    return EMAIL_TEMPLATES.refund;
  }
  if (lower.includes('complaint') || lower.includes('unhappy') || lower.includes('disappointed')) {
    return EMAIL_TEMPLATES.complaint;
  }
  if (lower.includes('shipping') || lower.includes('delivery') || lower.includes('tracking')) {
    return EMAIL_TEMPLATES.shipping;
  }
  if (lower.includes('confirm') || lower.includes('received') || lower.includes('process')) {
    return EMAIL_TEMPLATES.confirmation;
  }
  
  return EMAIL_TEMPLATES.inquiry;
}