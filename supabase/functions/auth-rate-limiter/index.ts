// Rate limiting edge function for authentication endpoints
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RateLimit {
  count: number;
  windowStart: number;
  isBlocked: boolean;
}

// In-memory rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, RateLimit>();

const RATE_LIMITS = {
  login: { requests: 5, window: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  register: { requests: 3, window: 60 * 60 * 1000 }, // 3 requests per hour
  passwordReset: { requests: 3, window: 60 * 60 * 1000 }, // 3 requests per hour
};

function getClientIP(request: Request): string {
  return request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         'unknown';
}

function isRateLimited(ip: string, action: keyof typeof RATE_LIMITS): boolean {
  const key = `${ip}:${action}`;
  const now = Date.now();
  const limit = RATE_LIMITS[action];
  
  let record = rateLimitStore.get(key);
  
  if (!record || now - record.windowStart > limit.window) {
    // New window or expired window
    record = {
      count: 1,
      windowStart: now,
      isBlocked: false
    };
    rateLimitStore.set(key, record);
    return false;
  }
  
  record.count++;
  
  if (record.count > limit.requests) {
    record.isBlocked = true;
    rateLimitStore.set(key, record);
    return true;
  }
  
  rateLimitStore.set(key, record);
  return false;
}

function logSecurityEvent(event: any) {
  console.log(`[SECURITY] ${JSON.stringify({
    timestamp: new Date().toISOString(),
    ...event
  })}`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email, metadata } = await req.json();
    const clientIP = getClientIP(req);
    
    // Rate limiting check
    if (isRateLimited(clientIP, action)) {
      logSecurityEvent({
        type: 'RATE_LIMIT_EXCEEDED',
        ip: clientIP,
        action,
        email: email?.slice(0, 3) + '***' // Partial email for privacy
      });
      
      return new Response(
        JSON.stringify({
          error: 'Too many requests. Please try again later.',
          rateLimited: true
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Log successful security check
    logSecurityEvent({
      type: 'AUTH_REQUEST_ALLOWED',
      ip: clientIP,
      action,
      email: email?.slice(0, 3) + '***'
    });

    return new Response(
      JSON.stringify({ success: true, allowed: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Rate limiting error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});