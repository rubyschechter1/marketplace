import Link from "next/link"
import { formatDisplayName } from "@/lib/formatName"

interface ProfileThumbnailProps {
  user: {
    id: string
    firstName: string
    lastName?: string
    avatarUrl?: string | null
  }
  size?: 'sm' | 'md' | 'lg'
  clickable?: boolean
  className?: string
  fromPage?: string
}

export default function ProfileThumbnail({ 
  user, 
  size = 'sm', 
  clickable = true,
  className = "",
  fromPage
}: ProfileThumbnailProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-24 h-24 text-3xl'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const baseClasses = `${sizeClasses[size]} bg-gray/20 rounded-lg flex items-center justify-center flex-shrink-0`
  const hoverClasses = clickable ? 'cursor-pointer hover:bg-gray/40 hover:scale-105 transition-all duration-200' : ''
  const combinedClasses = `${baseClasses} ${hoverClasses}`.trim()

  const avatarContent = user.avatarUrl ? (
    <img 
      src={user.avatarUrl} 
      alt={`${user.firstName}'s avatar`}
      className={`${sizeClasses[size]} rounded-lg object-cover`}
    />
  ) : (
    <span>{user.firstName[0].toUpperCase()}</span>
  )

  const profileContent = (
    <div className={`flex flex-col items-center ${className}`}>
      <div className={combinedClasses}>
        {avatarContent}
      </div>
      <span className={`${textSizeClasses[size]} text-gray mt-1 text-center`}>
        {formatDisplayName(user.firstName, user.lastName)}
      </span>
    </div>
  )

  if (clickable) {
    const profileUrl = fromPage 
      ? `/profile?id=${user.id}&from=${encodeURIComponent(fromPage)}`
      : `/profile?id=${user.id}`
    
    return (
      <Link href={profileUrl} className="block">
        {profileContent}
      </Link>
    )
  }

  return profileContent
}