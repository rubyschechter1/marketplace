import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import AuthLayout from "@/components/AuthLayout"
import SignOutButton from "@/components/SignOutButton"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/")
  }

  const user = await prisma.traveler.findUnique({
    where: { id: session.user.id }
  })

  if (!user) {
    redirect("/")
  }

  return (
    <AuthLayout>
      <main className="p-4 max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Profile</h1>
          <SignOutButton />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-2xl text-gray-600">
                {user.displayName?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user.displayName || user.username}</h2>
              <p className="text-gray-600">@{user.username}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-500">Email</span>
              <p className="font-medium">{user.email}</p>
            </div>
            
            {user.bio && (
              <div>
                <span className="text-sm text-gray-500">Bio</span>
                <p className="font-medium">{user.bio}</p>
              </div>
            )}

            <div>
              <span className="text-sm text-gray-500">Member since</span>
              <p className="font-medium">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
              </p>
            </div>
          </div>

          <button className="w-full bg-gray-100 text-gray-700 p-3 rounded-lg hover:bg-gray-200 transition-colors text-center">
            Edit Profile
          </button>
        </div>
      </main>
    </AuthLayout>
  )
}