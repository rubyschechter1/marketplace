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

  const user = await prisma.travelers.findUnique({
    where: { id: session.user.id }
  })

  if (!user) {
    redirect("/")
  }

  return (
    <AuthLayout>
      <main className="p-6 max-w-md mx-auto">
        <div className="flex justify-end mb-8">
          <SignOutButton />
        </div>

        <div className="space-y-8">
          {/* Profile Avatar and Name */}
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 bg-gray/20 rounded-full flex items-center justify-center mb-4 text-4xl">
              {user.firstName[0].toUpperCase()}
            </div>
            <h1 className="text-header font-normal">{user.firstName} {user.lastName[0]}.</h1>
          </div>

          {/* Profile Info */}
          <div className="space-y-6">
            <div>
              <p className="text-body text-gray mb-1">Email</p>
              <p className="text-body text-black">{user.email}</p>
            </div>

            {user.bio && (
              <div>
                <p className="text-body text-gray mb-1">Bio</p>
                <p className="text-body text-black">{user.bio}</p>
              </div>
            )}

            <div>
              <p className="text-body text-gray mb-1">Member since</p>
              <p className="text-body text-black">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                  month: 'numeric',
                  day: 'numeric', 
                  year: 'numeric'
                }) : "Unknown"}
              </p>
            </div>
          </div>

          {/* Edit Profile Button */}
          <button className="w-full bg-tan border border-black rounded-sm py-3 text-button text-black hover:bg-white transition-colors">
            Edit Profile
          </button>
        </div>
      </main>
    </AuthLayout>
  )
}