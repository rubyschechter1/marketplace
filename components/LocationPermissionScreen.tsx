"use client"

import { MapPin } from "lucide-react"
import { useLocation } from "@/contexts/LocationContext"

export default function LocationPermissionScreen() {
  const { location, requestPermission } = useLocation()

  const getErrorMessage = () => {
    if (!location.error) return null
    
    // Check for specific error types
    if (location.error.includes("denied")) {
      return "Location access is required to use Brownhat. Please enable location in your browser settings and refresh the page."
    } else if (location.error.includes("unavailable")) {
      return "Unable to determine your location. Please ensure location services are enabled on your device."
    } else if (location.error.includes("timeout")) {
      return "Location request timed out. Please try again."
    }
    
    return "Unable to access your location. Please check your settings and try again."
  }

  return (
    <div className="min-h-screen bg-tan flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border-2 border-black rounded-sm p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin size={32} className="text-tan" />
          </div>
          <h1 className="text-header font-normal mb-4">Location Required</h1>
          
          {location.error ? (
            <div className="mb-6">
              <p className="text-body text-red-600 mb-4">
                {getErrorMessage()}
              </p>
              {location.error.includes("denied") && (
                <div className="text-sm text-gray space-y-2">
                  <p className="font-semibold">How to enable location:</p>
                  <p>Chrome/Edge: Click the lock icon in the address bar → Site settings → Location → Allow</p>
                  <p>Safari: Safari → Settings → Websites → Location → Allow</p>
                  <p>Firefox: Click the lock icon → Clear permissions and try again</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-body mb-6">
              Brownhat needs your location to show nearby travelers and calculate distances to offers.
            </p>
          )}
        </div>

        <button
          onClick={requestPermission}
          disabled={location.loading}
          className="w-full bg-tan text-black border-2 border-black p-4 rounded-sm hover:bg-black hover:text-tan transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {location.loading ? "Requesting Location..." : "Enable Location"}
        </button>

        {location.error?.includes("denied") && (
          <p className="text-sm text-gray mt-4">
            After updating your browser settings, refresh this page to try again.
          </p>
        )}
      </div>
    </div>
  )
}