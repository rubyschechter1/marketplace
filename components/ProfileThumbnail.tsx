import Link from "next/link"

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
}

export default function ProfileThumbnail({ 
  user, 
  size = 'sm', 
  clickable = true,
  className = ""
}: ProfileThumbnailProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-24 h-24 text-3xl'
  }

  const baseClasses = `${sizeClasses[size]} bg-gray/20 rounded-xl flex items-center justify-center flex-shrink-0 ${className}`
  const hoverClasses = clickable ? 'hover:bg-gray/30 transition-colors' : ''
  const combinedClasses = `${baseClasses} ${hoverClasses}`.trim()

  const content = user.avatarUrl ? (
    <img 
      src={user.avatarUrl} 
      alt={`${user.firstName}'s avatar`}
      className={`${sizeClasses[size]} rounded-xl object-cover`}
    />
  ) : (
    <span>{user.firstName[0].toUpperCase()}</span>
  )

  if (clickable) {
    return (
      <Link href={`/profile?id=${user.id}`} className={combinedClasses}>
        {content}
      </Link>
    )
  }

  return (
    <div className={combinedClasses}>
      {content}
    </div>
  )
}