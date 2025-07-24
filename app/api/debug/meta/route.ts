import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ogImage: '/og-image.png?v=2',
    twitterImage: '/og-image.png?v=2',
    themeColor: '#ffebb5',
    fullOgImageUrl: 'https://brownstrawhat.com/og-image.png?v=2',
    fullTwitterImageUrl: 'https://brownstrawhat.com/og-image.png?v=2',
    timestamp: new Date().toISOString(),
    note: 'These are the current meta tag values being served'
  })
}