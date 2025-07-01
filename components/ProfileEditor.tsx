"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface ProfileEditorProps {
  user: {
    id: string
    bio: string | null
    languages: string[]
  }
}

export default function ProfileEditor({ user }: ProfileEditorProps) {
  const router = useRouter()
  const [isAddingLanguage, setIsAddingLanguage] = useState(false)
  const [bio, setBio] = useState(user.bio || "")
  const [originalBio, setOriginalBio] = useState(user.bio || "")
  const [newLanguage, setNewLanguage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const bioHasChanged = bio !== originalBio

  const updateProfile = async (data: any) => {
    setLoading(true)
    setError("")
    
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update profile")
      }
      
      router.refresh()
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBio = async () => {
    const success = await updateProfile({ bio })
    if (success) {
      setOriginalBio(bio)
    }
  }
  
  const handleCancelBio = () => {
    setBio(originalBio)
    setError("")
  }

  const handleAddLanguage = async () => {
    if (!newLanguage.trim()) return
    
    const updatedLanguages = [...user.languages, newLanguage.trim()]
    const success = await updateProfile({ languages: updatedLanguages })
    if (success) {
      setNewLanguage("")
      setIsAddingLanguage(false)
    }
  }

  return (
    <>
      {/* About Section */}
      <div className="mb-6">
        <h2 className="text-lg mb-3">About</h2>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className={`w-full border border-black rounded-sm p-4 mb-3 text-sm min-h-[100px] focus:outline-none focus:ring-1 focus:ring-black resize-none bg-tan placeholder-gray ${
            !bio ? 'text-gray' : 'text-black'
          }`}
          placeholder="No bio yet. Tell other travelers about yourself!"
          maxLength={500}
        />
        {bioHasChanged && (
          <div className="flex gap-2">
            <button
              onClick={handleSaveBio}
              disabled={loading}
              className="text-sm bg-tan text-black px-4 py-2 rounded-sm border border-black hover:bg-black hover:text-tan transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancelBio}
              disabled={loading}
              className="text-sm bg-tan text-black px-4 py-2 rounded-sm border border-black hover:bg-black hover:text-tan transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Languages Section */}
      <div className="mb-6">
        <h2 className="text-lg mb-3">
          {user.languages && user.languages.length > 0 
            ? `Speaks ${user.languages.join(', ')}`
            : 'Languages'
          }
        </h2>
        {isAddingLanguage ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              placeholder="Enter language (e.g., English)"
              className="flex-1 px-3 py-2 border border-black rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-black bg-tan placeholder-gray"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddLanguage()
                }
              }}
            />
            <button
              onClick={handleAddLanguage}
              disabled={loading || !newLanguage.trim()}
              className="text-sm bg-tan text-black px-4 py-2 rounded-sm border border-black hover:bg-black hover:text-tan transition-colors disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add"}
            </button>
            <button
              onClick={() => {
                setNewLanguage("")
                setIsAddingLanguage(false)
                setError("")
              }}
              disabled={loading}
              className="text-sm bg-tan text-black px-4 py-2 rounded-sm border border-black hover:bg-black hover:text-tan transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingLanguage(true)}
            className="text-sm bg-tan text-black px-4 py-2 rounded-sm border border-black hover:bg-black hover:text-tan transition-colors"
          >
            Add language
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm text-sm text-red-600">
          {error}
        </div>
      )}
    </>
  )
}