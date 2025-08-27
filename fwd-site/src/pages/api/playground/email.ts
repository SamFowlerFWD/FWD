import type { APIRoute } from 'astro';

const SYSTEM_PROMPTS = {
  email: "Write a professional email response in exactly 30 tokens. Be direct, actionable, and polite."
};

const EMAIL_TEMPLATES = {
  inquiry: "Thank you for your inquiry. I'll review this carefully and respond within 24 hours with detailed information and next steps.",
  meeting: "I'd be happy to discuss this further. I'm available Tuesday or Thursday afternoon. Please let me know what works best for you.",
  followup: "Following up on our conversation. I've prepared the requested information and attached it here. Let me know if you need anything else.",
  apology: "I apologize for the delay. I've prioritized your request and will have a comprehensive response to you by end of day tomorrow.",
  confirmation: "Perfect, I've confirmed your request and begun processing it. You'll receive an update within 2 business days with the results."
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
  
  if (lower.includes('sorry') || lower.includes('delay') || lower.includes('apologize')) {
    return EMAIL_TEMPLATES.apology;
  }
  if (lower.includes('meeting') || lower.includes('discuss') || lower.includes('call')) {
    return EMAIL_TEMPLATES.meeting;
  }
  if (lower.includes('follow') || lower.includes('previous') || lower.includes('earlier')) {
    return EMAIL_TEMPLATES.followup;
  }
  if (lower.includes('confirm') || lower.includes('received') || lower.includes('process')) {
    return EMAIL_TEMPLATES.confirmation;
  }
  
  return EMAIL_TEMPLATES.inquiry;
}