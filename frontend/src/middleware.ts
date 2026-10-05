import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Content-Security-Policy', "frame-ancestors 'none';");
  response.headers.delete('Server');

  // Secure cookies in the response
  const setCookieHeaders = response.headers.getSetCookie();
  if (setCookieHeaders.length > 0) {
    const secureCookies = setCookieHeaders.map(cookie => {
      let newCookie = cookie;
      if (!newCookie.toLowerCase().includes('secure')) {
        newCookie += '; Secure';
      }
      if (!newCookie.toLowerCase().includes('httponly')) {
        newCookie += '; HttpOnly';
      }
      return newCookie;
    });
    // Remove the old ones and set the new ones
    response.headers.delete('set-cookie');
    secureCookies.forEach(cookie => {
      response.headers.append('set-cookie', cookie);
    });
  }
  
  // Also, we can just enforce Secure and HttpOnly on any cookies the request came with 
  // by writing them back to the response, but that might be overkill if they aren't meant to be updated.
  // The vulnerability says "Cookie: rzp_unified_session_id" is missing Secure and HttpOnly.
  // We can just explicitly set it in the response to force those attributes.
  if (request.cookies.has('rzp_unified_session_id')) {
    const val = request.cookies.get('rzp_unified_session_id')?.value;
    if (val) {
      response.cookies.set('rzp_unified_session_id', val, {
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
      });
    }
  }

  return response;
}

export const config = {
  matcher: '/(.*)',
};
