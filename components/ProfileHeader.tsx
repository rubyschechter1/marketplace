"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Star } from "lucide-react"

interface ProfileHeaderProps {
  user: {
    id: string
    firstName: string
    lastName?: string
    avatarUrl?: string | null
  }
  isOwnProfile: boolean
}

export default function ProfileHeader({ user, isOwnProfile }: ProfileHeaderProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be less than 5MB")
      return
    }

    setUploading(true)
    setError("")

    try {
      // Upload to blob storage
      const formData = new FormData()
      formData.append("file", file)

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })

      if (!uploadRes.ok) {
        throw new Error("Failed to upload photo")
      }

      const { url } = await uploadRes.json()

      // Update user profile with new avatar URL
      const profileRes = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url })
      })

      if (!profileRes.ok) {
        throw new Error("Failed to update profile")
      }

      // Refresh the page to show new avatar
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to upload photo")
    } finally {
      setUploading(false)
    }
  }

  const handleAvatarClick = () => {
    if (isOwnProfile && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <>
      {/* Hidden file input */}
      {isOwnProfile && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />
      )}

      {/* Profile Header */}
      <div className="flex gap-4 mb-6">
        {/* Avatar - Left side */}
        <div className="flex-shrink-0">
          {user.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={`${user.firstName}'s avatar`}
              className={`w-20 h-20 rounded-md object-cover ${
                isOwnProfile ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
              }`}
              onClick={handleAvatarClick}
            />
          ) : (
            <div 
              className={`w-20 h-20 bg-gray/20 rounded-md flex items-center justify-center text-2xl ${
                isOwnProfile ? 'cursor-pointer hover:bg-gray/30 transition-colors' : ''
              }`}
              onClick={handleAvatarClick}
            >
              {user.firstName[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Name and details - Right side */}
        <div className="flex-1">
          {/* Name with Verified Badge */}
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-normal">{user.firstName} {user.lastName}</h1>
            <span className="text-sm text-gray italic">Verified</span>
          </div>

          {/* Star Rating */}
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={16} className="fill-black text-black" />
            ))}
            <span className="text-sm ml-1">5.0</span>
          </div>

          {/* Upload photo button - Only show for own profile when no avatar */}
          {isOwnProfile && !user.avatarUrl && (
            <button 
              onClick={handleAvatarClick}
              disabled={uploading}
              className="text-sm bg-tan text-black px-3 py-1 rounded-sm border border-black hover:bg-black hover:text-tan transition-colors disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload photo"}
            </button>
          )}

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </div>
      </div>
    </>
  )
}