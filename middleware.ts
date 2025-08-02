import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  // Only check auth on protected routes
  const protectedPaths = ['/profile', '/offers/new', '/asks/new', '/messages', '/inventory']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))
  
  if (!isProtectedPath) {
    return NextResponse.next()
  }

  try {
    // Try to get the token
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    })

    // If we have a token, verify it has the required fields
    if (token) {
      // Check if token has user ID
      if (!token.sub && !token.uid) {
        console.log('Invalid token structure - missing user ID')
        return clearAuthAndRedirect(request)
      }
      
      // Token is valid, continue
      return NextResponse.next()
    } else {
      // No token on protected route
      console.log('No token found for protected route')
      return clearAuthAndRedirect(request)
    }
  } catch (error) {
    console.error('Middleware auth error:', error)
    // If there's any error validating the token, clear it
    return clearAuthAndRedirect(request)
  }
}

function clearAuthAndRedirect(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/', request.url))
  
  // Clear all auth-related cookies
  const cookiesToClear = [
    'next-auth.session-token',
    'next-auth.csrf-token',
    'next-auth.callback-url',
    '__Secure-next-auth.session-token',
    '__Secure-next-auth.csrf-token',
    '__Secure-next-auth.callback-url',
    '__Host-next-auth.csrf-token',
  ]
  
  cookiesToClear.forEach(cookieName => {
    response.cookies.set(cookieName, '', {
      expires: new Date(0),
      path: '/',
    })
  })
  
  return response
}

export const config = {
  matcher: ['/profile/:path*', '/offers/new', '/asks/new', '/messages/:path*', '/inventory/:path*']
}