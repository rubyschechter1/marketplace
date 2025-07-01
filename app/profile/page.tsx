import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import AuthLayout from "@/components/AuthLayout"
import SignOutButton from "@/components/SignOutButton"
import ProfileEditor from "@/components/ProfileEditor"
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

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/")
  }

  const user = await getUserWithOffers(session.user.id)

  if (!user) {
    redirect("/")
  }

  // Get list of offered items
  const offeredItems = user.offers.map(offer => offer.item?.name).filter(Boolean)

  return (
    <AuthLayout>
      <main className="p-6 max-w-md mx-auto">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-6">
          {/* Avatar */}
          {user.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={`${user.firstName}'s avatar`}
              className="w-20 h-20 rounded-full object-cover mb-3"
            />
          ) : (
            <div className="w-20 h-20 bg-gray/20 rounded-full flex items-center justify-center mb-3 text-2xl">
              {user.firstName[0].toUpperCase()}
            </div>
          )}
          
          {/* Name with Verified Badge */}
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-normal">{user.firstName} {user.lastName}</h1>
            <span className="text-sm text-gray italic">Verified</span>
          </div>

          {/* Star Rating */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={16} className="fill-black text-black" />
            ))}
            <span className="text-sm ml-1">5.0</span>
          </div>
        </div>

        {/* Email Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm">Email: {user.email}</p>
            {/* <button className="text-sm bg-tan px-3 py-1 rounded-sm border border-black hover:bg-white transition-colors">
              Change email
            </button> */}
          </div>
        </div>

        {/* Profile Editor Component */}
        <ProfileEditor user={user} />

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

        {/* Sign Out Button */}
        <div className="w-full">
          <SignOutButton className="w-full bg-tan text-black border border-black rounded-sm py-3 text-sm hover:bg-black hover:text-tan transition-colors" />
        </div>
      </main>
    </AuthLayout>
  )
}