"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  bio?: string
  avatarUrl?: string
  languages: string[]
  unreadMessages: number
  unreadMessagesCount?: number
}

interface UserContextType {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    if (!session?.user?.id) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const [userResponse, unreadResponse] = await Promise.all([
        fetch('/api/users/me'),
        fetch('/api/users/unread-conversations')
      ])
      
      if (userResponse.ok && unreadResponse.ok) {
        const userData = await userResponse.json()
        const unreadData = await unreadResponse.json()
        
        // Transform the API response to match our User interface
        const user = {
          ...userData.user,
          unreadMessages: userData.user._count?.messagesReceived || 0,
          unreadMessagesCount: unreadData.unreadCount || 0
        }
        setUser(user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    
    fetchUser()
  }, [session?.user?.id, status])

  const refreshUser = async () => {
    await fetchUser()
  }

  return (
    <UserContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}