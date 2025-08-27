import type { APIRoute } from 'astro';

export const prerender = false;

const SYSTEM_PROMPTS = {
  product: "Write compelling e-commerce product descriptions in exactly 40 tokens. Focus on benefits, quality, and value. Be persuasive and engaging."
};

const PRODUCT_TEMPLATES = {
  electronics: "Premium quality tech with cutting-edge features. Free shipping, 2-year warranty, and 30-day returns. Trusted by thousands of satisfied customers.",
  clothing: "Stylish, comfortable, and sustainably made. Perfect fit guaranteed with free returns. Express yourself with confidence and quality.",
  home: "Transform your space with elegant design and superior craftsmanship. Durable materials, easy assembly, satisfaction guaranteed.",
  beauty: "Professional-grade formula with natural ingredients. Visible results in days, dermatologist tested, cruelty-free. Your skin will thank you.",
  sports: "Performance-engineered for serious athletes. Lightweight, durable, and designed to help you achieve your personal best.",
  general: "Premium quality meets unbeatable value. Fast shipping, easy returns, and our famous customer service. Shop with confidence today."
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { productName, productType, features } = await request.json();
    
    if (!productName || typeof productName !== 'string') {
      return new Response(JSON.stringify({ 
        error: 'Please provide product name.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKey = import.meta.env.OPENAI_API_KEY;
    
    // Use template if no API key
    if (!apiKey || apiKey === 'demo') {
      const template = selectProductTemplate(productType || productName);
      return new Response(JSON.stringify({ 
        content: template,
        tokens: 40
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Call OpenAI with strict 40 token limit
    const prompt = `Product: ${productName}${productType ? `, Type: ${productType}` : ''}${features ? `, Features: ${features}` : ''}`;

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
  
  if (lower.includes('electronic') || lower.includes('phone') || lower.includes('laptop') || lower.includes('gadget')) {
    return PRODUCT_TEMPLATES.electronics;
  }
  if (lower.includes('clothing') || lower.includes('shirt') || lower.includes('dress') || lower.includes('fashion')) {
    return PRODUCT_TEMPLATES.clothing;
  }
  if (lower.includes('home') || lower.includes('furniture') || lower.includes('decor') || lower.includes('kitchen')) {
    return PRODUCT_TEMPLATES.home;
  }
  if (lower.includes('beauty') || lower.includes('skincare') || lower.includes('makeup') || lower.includes('cosmetic')) {
    return PRODUCT_TEMPLATES.beauty;
  }
  if (lower.includes('sport') || lower.includes('fitness') || lower.includes('gym') || lower.includes('athletic')) {
    return PRODUCT_TEMPLATES.sports;
  }
  
  return PRODUCT_TEMPLATES.general;
}