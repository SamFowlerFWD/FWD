// Rate limiting middleware for API protection
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 10; // 10 requests per minute per IP
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Clean up old entries every 5 minutes

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, CLEANUP_INTERVAL);

export function getRateLimiter(options?: {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
}) {
  const windowMs = options?.windowMs || WINDOW_MS;
  const maxRequests = options?.maxRequests || MAX_REQUESTS;
  const message = options?.message || 'Too many requests, please try again later.';

  return (clientId: string): { allowed: boolean; message?: string; retryAfter?: number } => {
    const now = Date.now();
    
    if (!store[clientId] || store[clientId].resetTime < now) {
      store[clientId] = {
        count: 1,
        resetTime: now + windowMs
      };
      return { allowed: true };
    }
    
    store[clientId].count++;
    
    if (store[clientId].count > maxRequests) {
      const retryAfter = Math.ceil((store[clientId].resetTime - now) / 1000);
      return { 
        allowed: false, 
        message,
        retryAfter 
      };
    }
    
    return { allowed: true };
  };
}

// Helper to get client identifier from request
export function getClientId(request: Request): string {
  // Try to get real IP from various headers (for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Fallback to a generic identifier if no IP is available
  // In production, you should always have an IP
  return 'anonymous-' + new Date().toISOString().split('T')[0];
}