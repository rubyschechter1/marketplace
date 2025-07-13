import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { put } from "@vercel/blob"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      )
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 5MB)" },
        { status: 400 }
      )
    }

    // Generate unique filename for avatar with user ID
    const uniqueFilename = `avatars/${session.user.id}-${crypto.randomUUID()}.jpg`
    
    // Upload to Vercel Blob
    const blob = await put(uniqueFilename, file, {
      access: 'public',
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("Avatar upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    )
  }
}