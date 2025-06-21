import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import AuthLayout from "@/components/AuthLayout"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function MessagesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/")
  }

  // Get conversations (unique offer/user combinations)
  const conversations = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id },
        { recipientId: session.user.id }
      ]
    },
    include: {
      sender: true,
      recipient: true,
      offer: {
        include: {
          item: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    distinct: ['offerId']
  })

  return (
    <AuthLayout>
      <main className="p-4 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>

        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No conversations yet</p>
            <p className="text-sm text-gray-400">
              Start a conversation by browsing offers
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((message) => {
              const otherUser = message.senderId === session.user.id 
                ? message.recipient 
                : message.sender
              
              return (
                <div
                  key={message.id}
                  className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-gray-600">
                        {otherUser?.displayName?.[0]?.toUpperCase() || otherUser?.username[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {otherUser?.displayName || otherUser?.username}
                          </p>
                          <p className="text-sm text-gray-500">
                            Re: {message.offer?.item?.name || message.offer?.title}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {message.createdAt ? new Date(message.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </AuthLayout>
  )
}