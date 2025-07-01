import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import AuthLayout from "@/components/AuthLayout"
import SignOutButton from "@/components/SignOutButton"
import ProfileEditor from "@/components/ProfileEditor"
import ProfileHeader from "@/components/ProfileHeader"
import { PrismaClient } from "@prisma/client"
import { Star, Check } from "lucide-react"

const prisma = new PrismaClient()

async function getUserWithOffers(userId: string) {
  const user = await prisma.travelers.findUnique({
    where: { id: userId },
    include: {
      offers: {
        where: { status: 'active' },
        include: {
          item: true
        }
      }
    }
  })
  return user
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const session = await getServerSession(authOptions)
  const params = await searchParams
  
  // Determine which user to display
  const userId = params.id || session?.user?.id
  
  // If no userId available (not logged in and no id param), redirect to home
  if (!userId) {
    redirect("/")
  }

  const user = await getUserWithOffers(userId)

  if (!user) {
    redirect("/")
  }
  
  // Check if viewing own profile
  const isOwnProfile = session?.user?.id === user.id

  // Get list of offered items
  const offeredItems = user.offers.map(offer => offer.item?.name).filter(Boolean)

  return (
    <AuthLayout>
      <main className="p-6 max-w-md mx-auto">
        {/* Profile Header Component */}
        <ProfileHeader user={user} isOwnProfile={isOwnProfile} />

        {/* Email Section - Only show for own profile */}
        {isOwnProfile && (
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <p className="text-sm">Email: {user.email}</p>
            </div>
          </div>
        )}

        {/* Profile Editor Component - Only for own profile */}
        {isOwnProfile ? (
          <ProfileEditor user={{
            id: user.id,
            bio: user.bio,
            languages: user.languages
          }} />
        ) : (
          <>
            {/* Read-only About Section for other users */}
            {user.bio && (
              <div className="mb-6">
                <h2 className="text-lg mb-3">About</h2>
                <div className="border border-black rounded-sm p-4">
                  <p className="text-sm whitespace-pre-line">
                    {user.bio}
                  </p>
                </div>
              </div>
            )}

            {/* Read-only Languages Section for other users */}
            {user.languages && user.languages.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg mb-3">
                  Speaks {user.languages.join(', ')}
                </h2>
              </div>
            )}
          </>
        )}

        {/* Offered Items Section */}
        <div className="mb-6">
          <h2 className="text-lg mb-2">Has offered {user.offers.length} items</h2>
          <p className="text-sm text-gray italic">
            {offeredItems.length > 0 
              ? offeredItems.join(', ')
              : "No items offered yet"
            }
          </p>
        </div>

        {/* Member Since */}
        <div className="mb-8">
          <p className="text-sm">
            Member since {user.createdAt ? new Date(user.createdAt).getFullYear() : "Unknown"}
          </p>
        </div>

        {/* Sign Out Button - Only for own profile */}
        {isOwnProfile && (
          <div className="w-full">
            <SignOutButton className="w-full bg-tan text-black border border-black rounded-sm py-3 text-sm hover:bg-black hover:text-tan transition-colors" />
          </div>
        )}
      </main>
    </AuthLayout>
  )
}