"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Star } from "lucide-react"
import ReactCrop, { Crop, PixelCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"

interface ProfileHeaderProps {
  user: {
    id: string
    firstName: string
    lastName?: string
    avatarUrl?: string | null
    createdAt?: string
  }
  isOwnProfile: boolean
  reputationScore?: {
    totalReviews: number
    averageRating: number | string
  }
}

export default function ProfileHeader({ user, isOwnProfile, reputationScore }: ProfileHeaderProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  
  // Image cropping states
  const [isEditingAvatar, setIsEditingAvatar] = useState(false)
  const [imageSrc, setImageSrc] = useState<string>("")
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const imgRef = useRef<HTMLImageElement>(null)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be less than 5MB")
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed")
      return
    }

    setError("")
    setCrop(undefined) // Makes crop preview update between images
    const reader = new FileReader()
    reader.addEventListener("load", () =>
      setImageSrc(reader.result?.toString() || "")
    )
    reader.readAsDataURL(file)
    setIsEditingAvatar(true)
  }

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    // Calculate the size to make a square crop centered in the image
    const size = Math.min(width, height)
    const x = (width - size) / 2
    const y = (height - size) / 2
    
    setCrop({
      unit: "px",
      width: size * 0.8, // 80% of the smaller dimension
      height: size * 0.8,
      x: x + (size * 0.1), // Center with 10% margin
      y: y + (size * 0.1),
    })
  }, [])

  const getCroppedImg = useCallback(
    (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("No 2d context")
      }

      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height
      
      // Set canvas size to the crop dimensions
      canvas.width = crop.width
      canvas.height = crop.height

      // Draw the cropped portion of the image to fill the entire canvas
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      )

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            throw new Error("Canvas is empty")
          }
          resolve(blob)
        }, "image/jpeg", 0.9)
      })
    },
    []
  )

  const uploadCroppedImage = async () => {
    if (!imgRef.current || !completedCrop) return

    try {
      setUploading(true)
      setError("")
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop)
      
      // Create FormData for upload
      const formData = new FormData()
      formData.append("file", croppedBlob, "avatar.jpg")
      
      // Upload to avatar endpoint
      const uploadResponse = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      })
      
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image")
      }
      
      const { url } = await uploadResponse.json()
      
      // Update profile with new avatar URL
      const profileRes = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url })
      })

      if (!profileRes.ok) {
        throw new Error("Failed to update profile")
      }

      // Close modal and refresh
      setIsEditingAvatar(false)
      setImageSrc("")
      setCrop(undefined)
      setCompletedCrop(undefined)
      router.refresh()
    } catch (error) {
      console.error("Error uploading avatar:", error)
      setError("Failed to upload avatar")
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

      {/* Image Cropping Modal */}
      {isEditingAvatar && imageSrc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-tan p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg mb-4 text-center">Crop your photo</h3>
            <div className="mb-4">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                className="[&_.ReactCrop__crop-selection]:rounded-md"
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imageSrc}
                  style={{ transform: `scale(1) rotate(0deg)` }}
                  onLoad={onImageLoad}
                  className="max-w-full h-auto"
                />
              </ReactCrop>
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={uploadCroppedImage}
                disabled={uploading || !completedCrop}
                className="text-sm bg-tan text-black px-4 py-2 rounded-lg border border-black hover:bg-black hover:text-tan transition-colors disabled:opacity-50"
              >
                {uploading ? "Saving..." : "Save Photo"}
              </button>
              <button
                onClick={() => {
                  setIsEditingAvatar(false)
                  setImageSrc("")
                  setCrop(undefined)
                  setCompletedCrop(undefined)
                  setError("")
                }}
                disabled={uploading}
                className="text-sm bg-tan text-black px-4 py-2 rounded-lg border border-black hover:bg-black hover:text-tan transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
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

          {/* Hat Rating - Only show if there are reviews */}
          {reputationScore && reputationScore.totalReviews > 0 && (
            <div className="flex items-center gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <img
                  key={star}
                  src={star <= Math.round(Number(reputationScore.averageRating)) 
                    ? '/images/brownhat.png' 
                    : '/images/hat_full_empty.png'
                  }
                  alt={star <= Math.round(Number(reputationScore.averageRating)) ? 'Selected hat' : 'Empty hat'}
                  className="w-5 h-5 object-contain"
                />
              ))}
              <span className="text-sm ml-1">
                {Number(reputationScore.averageRating).toFixed(1)} ({reputationScore.totalReviews})
              </span>
            </div>
          )}

          {/* Member Since */}
          <div className="mb-2">
            <p className="text-sm text-gray">
              Member since {user.createdAt ? new Date(user.createdAt).getFullYear() : "Unknown"}
            </p>
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