import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ogImage: '/images/linkimage.jpg?v=1',
    twitterImage: '/images/linkimage.jpg?v=1',
    themeColor: '#ffebb5',
    fullOgImageUrl: 'https://brownstrawhat.com/images/linkimage.jpg?v=1',
    fullTwitterImageUrl: 'https://brownstrawhat.com/images/linkimage.jpg?v=1',
    timestamp: new Date().toISOString(),
    note: 'Now using linkimage.jpg for social media previews'
  })
}