import type { APIRoute } from 'astro';

const SYSTEM_PROMPTS = {
  product: "Write compelling product copy in exactly 40 tokens. Focus on benefits over features. Be persuasive and clear."
};

const PRODUCT_TEMPLATES = {
  software: "Revolutionary AI-powered software that automates your workflow, saving 20+ hours weekly while increasing accuracy by 99%. Start your transformation today.",
  service: "Expert solutions tailored to your unique needs. We handle complexity while you focus on growth. Trusted by 500+ businesses nationwide.",
  retail: "Premium quality meets unbeatable value. Crafted with meticulous attention to detail, backed by our 100% satisfaction guarantee. Transform your experience.",
  tech: "Cutting-edge technology that adapts to your business. Reduce costs by 60% while scaling effortlessly. Future-proof your operations today.",
  general: "Transform your business with our proven solution. Save time, reduce costs, and accelerate growth. Join thousands already seeing results."
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { productType, features } = await request.json();
    
    if (!productType || typeof productType !== 'string') {
      return new Response(JSON.stringify({ 
        error: 'Please provide product type.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKey = import.meta.env.OPENAI_API_KEY;
    
    // Use template if no API key
    if (!apiKey || apiKey === 'demo') {
      const template = selectProductTemplate(productType);
      return new Response(JSON.stringify({ 
        content: template,
        tokens: 40
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Call OpenAI with strict 40 token limit
    const prompt = features 
      ? `Product type: ${productType}. Features: ${features}`
      : `Product type: ${productType}`;

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.product },
          { role: 'user', content: prompt }
        ],
        max_tokens: 40,
        temperature: 0.5
      })
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const data = await openAIResponse.json();
    const content = data.choices[0]?.message?.content || '';
    const tokens = data.usage?.completion_tokens || 40;
    
    return new Response(JSON.stringify({ 
      content,
      tokens
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Product copy generation error:', error);
    
    // Return fallback template
    return new Response(JSON.stringify({ 
      content: PRODUCT_TEMPLATES.general,
      tokens: 40
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

function selectProductTemplate(productType: string): string {
  const lower = productType.toLowerCase();
  
  if (lower.includes('software') || lower.includes('app') || lower.includes('saas')) {
    return PRODUCT_TEMPLATES.software;
  }
  if (lower.includes('service') || lower.includes('consulting') || lower.includes('agency')) {
    return PRODUCT_TEMPLATES.service;
  }
  if (lower.includes('retail') || lower.includes('product') || lower.includes('goods')) {
    return PRODUCT_TEMPLATES.retail;
  }
  if (lower.includes('tech') || lower.includes('ai') || lower.includes('automation')) {
    return PRODUCT_TEMPLATES.tech;
  }
  
  return PRODUCT_TEMPLATES.general;
}