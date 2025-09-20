import type { APIRoute } from 'astro';
import { getRateLimiter, getClientId } from '../../../middleware/rateLimiter';
import { validateInput, sanitizeString, commonSchemas } from '../../../middleware/validator';

export const prerender = false;

// Initialize rate limiter (10 requests per minute for social media - for testing)
const checkRateLimit = getRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: 'Too many social media generation requests. Please try again later.'
});

const SYSTEM_PROMPT = `You are a social media expert who creates engaging, platform-optimized content. 
Generate posts that are authentic, engaging, and tailored to each platform's best practices.`;

interface PostTemplate {
  [key: string]: {
    [tone: string]: string;
  };
}

const generateHashtags = (platform: string, topic: string, postType: string): string[] => {
  const baseHashtags: { [key: string]: string[] } = {
    twitter: ['#Innovation', '#BusinessGrowth', '#AI', '#Automation', '#Tech'],
    instagram: ['#BusinessSuccess', '#EntrepreneurLife', '#SmallBusiness', '#Innovation', '#GrowYourBusiness', '#TechSolutions', '#DigitalTransformation'],
    linkedin: ['#BusinessInnovation', '#DigitalTransformation', '#Leadership', '#FutureOfWork', '#TechTrends'],
    facebook: ['#SmallBusinessLove', '#LocalBusiness', '#Innovation', '#Success']
  };

  const typeHashtags: { [key: string]: string[] } = {
    'Product Launch': ['#NewProduct', '#LaunchDay', '#Innovation'],
    'Company Update': ['#CompanyNews', '#TeamUpdate', '#Growth'],
    'Customer Success': ['#CustomerSuccess', '#Testimonial', '#HappyCustomers'],
    'Educational Content': ['#LearnSomethingNew', '#Tips', '#HowTo']
  };

  const hashtags = [...(baseHashtags[platform] || [])];
  const additionalTags = typeHashtags[postType] || [];
  
  return [...new Set([...hashtags.slice(0, 3), ...additionalTags.slice(0, 2)])];
};

const getBestPostingTime = (platform: string): string => {
  const times: { [key: string]: string } = {
    twitter: '9:00 AM & 3:00 PM',
    instagram: '11:00 AM & 7:00 PM',
    linkedin: '7:30 AM & 5:30 PM Tuesday-Thursday',
    facebook: '1:00 PM & 8:00 PM'
  };
  return times[platform] || '12:00 PM';
};

export const POST: APIRoute = async ({ request }) => {
  // Security headers
  const headers = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };

  try {
    // Rate limiting
    const clientId = getClientId(request);
    const rateLimitResult = checkRateLimit(clientId);
    
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ 
        error: rateLimitResult.message,
        retryAfter: rateLimitResult.retryAfter 
      }), {
        status: 429,
        headers: {
          ...headers,
          'Retry-After': String(rateLimitResult.retryAfter || 60)
        }
      });
    }

    // Check request size (limit to 1MB)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1024 * 1024) {
      return new Response(JSON.stringify({ 
        error: 'Request too large' 
      }), {
        status: 413,
        headers
      });
    }

    // Parse and validate input
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body' 
      }), {
        status: 400,
        headers
      });
    }

    // Validate inputs
    let validated;
    try {
      validated = validateInput(body, commonSchemas.socialMediaPost);
    } catch (validationError) {
      return new Response(JSON.stringify({ 
        error: validationError instanceof Error ? validationError.message : 'Invalid input' 
      }), {
        status: 400,
        headers
      });
    }

    const { platforms, postType, topic, tone } = validated;
    
    // Additional platform validation
    const validPlatforms = ['twitter', 'instagram', 'linkedin', 'facebook'];
    const invalidPlatforms = platforms.filter((p: string) => !validPlatforms.includes(p));
    if (invalidPlatforms.length > 0) {
      return new Response(JSON.stringify({ 
        error: `Invalid platforms: ${invalidPlatforms.join(', ')}` 
      }), {
        status: 400,
        headers
      });
    }

    // Get API key from server-side environment only
    const apiKey = process.env.OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;
    
    // Generate posts for each platform
    const posts = await Promise.all(platforms.map(async (platform) => {
      let content = '';
      
      if (apiKey && apiKey !== 'demo') {
        // Use OpenAI to generate content
        try {
          // Sanitize inputs for prompt
          const safeTopic = sanitizeString(topic, 500);
          const prompt = `Create a ${tone} ${platform} post about: ${safeTopic}. 
            Post type: ${postType}. 
            Keep it under ${platform === 'twitter' ? '280' : platform === 'instagram' ? '500' : '1000'} characters.
            Make it engaging and platform-appropriate.`;

          const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: prompt }
              ],
              max_tokens: 150,
              temperature: tone === 'excited' ? 0.8 : tone === 'casual' ? 0.6 : 0.4
            })
          });

          if (openAIResponse.ok) {
            const data = await openAIResponse.json();
            content = data.choices[0]?.message?.content || '';
          }
        } catch (error) {
          // Log error without exposing details
          console.error('OpenAI error:', error instanceof Error ? error.message : 'Unknown error');
        }
      }
      
      // Fallback to templates if no API or error
      if (!content) {
        content = generateTemplateContent(platform, postType, topic, tone);
      }

      const hashtags = generateHashtags(platform, topic, postType);
      const hashtagString = hashtags.join(' ');
      
      // Add hashtags if not already included
      if (!content.includes('#')) {
        content = `${content}\n\n${hashtagString}`;
      }

      return {
        platform: getPlatformName(platform),
        content,
        hashtags,
        bestTime: getBestPostingTime(platform),
        estimatedReach: Math.floor(Math.random() * 8000 + 2000),
        engagement: Math.floor(Math.random() * 20 + 5)
      };
    }));

    return new Response(JSON.stringify({ 
      success: true,
      posts,
      tokensUsed: platforms.length * 50
    }), {
      status: 200,
      headers
    });
    
  } catch (error) {
    // Log error without exposing sensitive details
    console.error('Social media generation error:', error instanceof Error ? error.message : 'Unknown error');
    
    return new Response(JSON.stringify({ 
      error: 'Failed to generate social media posts. Please try again.'
    }), {
      status: 200,
      headers
    });
  }
};

function getPlatformName(platform: string): string {
  const names: { [key: string]: string } = {
    twitter: 'Twitter/X',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    facebook: 'Facebook'
  };
  return names[platform] || platform;
}

function generateTemplateContent(platform: string, postType: string, topic: string, tone: string): string {
  const topicText = topic || 'our latest innovation';
  
  const templates: { [key: string]: PostTemplate } = {
    twitter: {
      professional: `🚀 Introducing ${topicText} - transforming how businesses operate with intelligent automation. Experience the future of efficiency today.`,
      casual: `Just launched: ${topicText}! 🎉 Making work easier, one automation at a time. Who's ready to save some serious time?`,
      excited: `🔥 GAME CHANGER ALERT! ${topicText} is HERE! Say goodbye to manual tasks and hello to your new superpower! 💪`
    },
    instagram: {
      professional: `We're proud to introduce ${topicText} ✨\n\nKey benefits:\n📈 Boost productivity by 10x\n⏰ Save 20+ hours weekly\n💰 Reduce operational costs by 60%\n🎯 Scale your business effortlessly\n\nTransform your business today. Link in bio.`,
      casual: `New drop! 📢 ${topicText} is here to make your life easier.\n\nNo more:\n❌ Endless manual tasks\n❌ Missed opportunities\n❌ Wasted time\n\nJust pure efficiency 🚀`,
      excited: `THIS. CHANGES. EVERYTHING! 🎊\n\n${topicText} is LIVE and it's absolutely incredible!\n\n💥 Mind-blowing features\n💥 Insane time savings\n💥 Happy customers everywhere\n\nDon't walk, RUN to our link in bio!`
    },
    linkedin: {
      professional: `I'm excited to share ${topicText} with our professional network.\n\nIn today's competitive landscape, automation isn't optional—it's essential. This solution addresses key challenges:\n\n✅ Streamlines complex workflows\n✅ Reduces human error by 99%\n✅ Scales with your business growth\n✅ Delivers measurable ROI within 30 days\n\nLet's connect to discuss how this can transform your operations.`,
      casual: `Big news! ${topicText} is here 🎉\n\nAfter months of development and incredible feedback from beta users, we're ready to help more businesses automate their success.\n\nWhat manual tasks are stealing your time? Let's talk solutions!`,
      excited: `🚀 ANNOUNCEMENT TIME! ${topicText} is revolutionizing business automation!\n\nForget everything you thought you knew about efficiency. This is next-level.\n\n🔥 10x productivity boost\n🔥 Instant implementation\n🔥 Guaranteed results\n\nWho's ready to transform their business?`
    },
    facebook: {
      professional: `We're thrilled to announce ${topicText} - designed to help businesses thrive in the digital age.\n\nLearn how automation can transform your operations and accelerate growth. Visit our website for more details.`,
      casual: `Hey friends! ${topicText} just launched and it's pretty amazing 😊\n\nIf you're tired of doing the same tasks over and over, this is for you. Drop a comment if you want to learn more!`,
      excited: `🎊 WOW! ${topicText} is HERE and it's INCREDIBLE!\n\nThis is going to change how you work forever! Like this post if you're ready for the automation revolution! 🚀`
    }
  };

  const platformTemplates = templates[platform] || templates.twitter;
  return platformTemplates[tone] || platformTemplates.professional;
}