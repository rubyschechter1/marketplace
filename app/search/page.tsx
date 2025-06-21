import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import AuthLayout from "@/components/AuthLayout"
import { Search as SearchIcon } from "lucide-react"

export default async function SearchPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/")
  }

  return (
    <AuthLayout>
      <main className="p-6 max-w-md mx-auto">
        <h1 className="text-header font-normal mb-6">Search</h1>
        
        {/* Search Input */}
        <div className="relative mb-8">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray" size={20} />
          <input
            type="text"
            placeholder="Search for items..."
            className="w-full pl-10 pr-4 py-3 border border-black rounded-sm text-body placeholder-gray focus:outline-none focus:ring-1 focus:ring-black bg-tan"
          />
        </div>

        {/* Filter Options */}
        <div className="mb-8">
          <p className="text-body text-gray mb-3">Filters</p>
          <div className="flex gap-2 flex-wrap">
            <button className="px-4 py-2 border border-black rounded-sm text-body hover:bg-white transition-colors">
              All Items
            </button>
            <button className="px-4 py-2 border border-thin rounded-sm text-body text-gray hover:border-black hover:text-black transition-colors">
              Camping
            </button>
            <button className="px-4 py-2 border border-thin rounded-sm text-body text-gray hover:border-black hover:text-black transition-colors">
              Travel
            </button>
            <button className="px-4 py-2 border border-thin rounded-sm text-body text-gray hover:border-black hover:text-black transition-colors">
              Electronics
            </button>
          </div>
        </div>

        {/* Search Results Placeholder */}
        <div className="space-y-4">
          <p className="text-body text-gray text-center py-12">
            Start searching to find items near you
          </p>
        </div>
      </main>
    </AuthLayout>
  )
}