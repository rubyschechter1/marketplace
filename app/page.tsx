export default function Home() {
  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Marketplace</h1>
      <p className="text-gray-600 mb-8">Barter with fellow travelers</p>
      
      <div className="space-y-4">
        <button className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors">
          Browse Nearby Offers
        </button>
        
        <button className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition-colors">
          Create an Offer
        </button>
        
        <button className="w-full border border-gray-300 p-3 rounded-lg hover:bg-gray-50 transition-colors">
          Sign In
        </button>
      </div>
    </main>
  );
}