# AI Playground Setup Guide

## Overview
The AI Playground is a streamlined demonstration platform that allows potential customers to experience FWD's AI solutions directly on the website, with a focus on minimal token usage and problem discovery.

## Key Features Implemented

### 1. **Business Problem Analyzer** (Main Demo)
- Location: `/src/components/playground/AIAssistant.tsx`
- API Endpoint: `/api/playground/analyze`
- Users describe their business challenge in 1-2 sentences
- AI identifies problem category and suggests relevant FWD service
- Token usage: Max 75 tokens per response
- Includes fallback responses when API is unavailable

### 2. **Quick Win Demos**
Located in `/src/components/playground/`:

#### a. Email Draft Generator
- Component: Part of `QuickDemos.tsx`
- API: `/api/playground/email`
- Generates professional responses in 30 tokens

#### b. Product Description Writer
- Component: Part of `QuickDemos.tsx`
- API: `/api/playground/product`
- Creates selling copy in 40 tokens

#### c. AI Chatbot
- Component: `ChatbotDemo.tsx`
- API: `/api/playground/chat`
- Shows instant customer service in 20 tokens

#### d. Data Extractor
- Component: `DataExtractorDemo.tsx`
- Simulates invoice processing (mock data, no API)

#### e. Time Savings Calculator
- Component: `SavingsCalculator.tsx`
- Calculates ROI and savings potential

### 3. **Value Counter**
- Component: `ValueCounter.tsx`
- Tracks user engagement metrics
- Shows cumulative value generated across demos

## API Structure

All API endpoints are located in `/src/pages/api/playground/`:

```
/api/playground/
├── analyze.ts    - Problem analyzer endpoint (75 tokens)
├── email.ts      - Email generation (30 tokens)
├── product.ts    - Product descriptions (40 tokens)
└── chat.ts       - Chatbot responses (20 tokens)
```

## Security Features

### Rate Limiting
- 10 requests per minute per IP address
- Implemented in-memory for simplicity
- Can be upgraded to Redis for production

### Caching
- Common responses cached for 15 minutes
- Reduces API calls and costs
- Improves response time

### Fallback Responses
- All endpoints have intelligent fallbacks
- Works even without OpenAI API key
- Ensures demo always functions

## Environment Setup

1. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

2. Add your OpenAI API key:
```
OPENAI_API_KEY=your_key_here
```

3. Or use demo mode (no API required):
```
OPENAI_API_KEY=demo
```

## Token Usage Optimization

### Strict Limits Per Endpoint:
- Analyzer: 75 tokens (comprehensive analysis)
- Email: 30 tokens (concise responses)
- Product: 40 tokens (compelling copy)
- Chat: 20 tokens (quick support)

### System Prompts Optimized for Brevity:
- Direct, specific instructions
- Format requirements included
- No unnecessary context

### Cost Estimates:
- GPT-3.5-turbo: ~$0.002 per 1K tokens
- Average session: ~200 tokens total
- Cost per user: < $0.001

## Performance Metrics

### Page Load:
- Static generation for fast initial load
- React components hydrate on interaction
- Lazy loading for demo components

### Response Times:
- Cached responses: < 50ms
- New API calls: < 1 second
- Fallback activation: instant

## Tracking & Analytics

The playground tracks:
- Demo completion rates
- Total tokens used
- Time saved calculations
- Potential savings identified
- Conversion to consultation

Metrics stored in sessionStorage and displayed via ValueCounter component.

## Mobile Responsiveness

All components are fully responsive:
- Touch-friendly interfaces
- Adaptive layouts
- Optimized for mobile performance

## Testing the Playground

1. Start development server:
```bash
npm run dev
```

2. Visit http://localhost:4321/playground

3. Test each demo:
   - Problem Analyzer
   - Email Generator
   - Product Descriptions
   - Chatbot
   - Data Extractor
   - Savings Calculator

## Deployment Considerations

1. **Environment Variables**
   - Set OPENAI_API_KEY in production environment
   - Consider using secrets management service

2. **Rate Limiting**
   - Upgrade to Redis or database-backed solution
   - Implement user-based limits if authenticated

3. **Monitoring**
   - Track API usage and costs
   - Monitor error rates
   - Set up alerts for high usage

4. **Caching**
   - Consider CDN caching for API responses
   - Implement proper cache invalidation

## Future Enhancements

1. **Additional Demos**
   - Code generation example
   - Report summarization
   - Language translation

2. **Personalization**
   - Industry-specific demos
   - Saved results for users
   - Email follow-up integration

3. **Advanced Features**
   - Multi-step workflows
   - File upload capabilities
   - Real-time collaboration demos

## Support

For issues or questions about the playground:
1. Check browser console for errors
2. Verify API key is set correctly
3. Test with demo mode first
4. Review rate limiting if requests fail