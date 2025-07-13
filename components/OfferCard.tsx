import Link from "next/link"
import ProfileThumbnail from "./ProfileThumbnail"
import { MapPin } from "lucide-react"

interface OfferCardProps {
  offer: {
    id: string
    type?: string
    title?: string
    item?: {
      name: string
      imageUrl?: string | null
    }
    askDescription?: string | null
    traveler: {
      id: string
      firstName: string
      lastName?: string
      avatarUrl?: string | null
    }
    lookingFor?: string[]
    _count?: {
      messages: number
      proposedTrades: number
    }
    displayLocation?: string | null
    distance?: number
  }
  currentUserId: string
}

export default function OfferCard({ offer, currentUserId }: OfferCardProps) {
  const isOwnOffer = offer.traveler.id === currentUserId
  const hasActivity = (offer._count?.messages || 0) > 0 || (offer._count?.proposedTrades || 0) > 0

  return (
    <div className="flex items-start gap-3">
      {/* Profile Thumbnail - outside the card */}
      <ProfileThumbnail 
        user={offer.traveler}
        size="sm"
        clickable={true}
      />

      {/* Card content */}
      <Link 
        href={`/offers/${offer.id}`}
        className="flex-1 bg-tan border border-black rounded-xl p-4 pb-8 block relative"
      >
        <div className="flex items-start gap-3">
          {/* Content */}
          <div className="flex-1">
            {offer.type === 'ask' ? (
              <>
                <p className="text-body mb-2">
                  {isOwnOffer ? 'You are' : `${offer.traveler.firstName} is`} asking for{' '}
                  <span className="italic">{offer.title || 'item'}</span>
                </p>
                {offer.askDescription && (
                  <p className="text-sm text-gray mb-2">{offer.askDescription}</p>
                )}
              </>
            ) : (
              <p className="text-body mb-2">
                {isOwnOffer ? 'You are' : `${offer.traveler.firstName} is`} offering{' '}
                <span className="italic">{offer.item?.name || 'item'}</span>
              </p>
            )}

            {/* Looking for section (for offers) or Offering section (for asks) */}
            {offer.lookingFor && offer.lookingFor.length > 0 && (
              <div className="mb-3">
                <p className="text-sm text-gray mb-2">
                  {offer.type === 'ask' ? 'Can offer:' : 'Looking for:'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {offer.lookingFor.map((item, index) => (
                    <span 
                      key={index}
                      className="bg-tan border border-black rounded-xl px-3 py-1 text-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Activity indicator */}
            {hasActivity && isOwnOffer && (
              <div className="text-sm">
                {offer._count?.proposedTrades ? (
                  <span className="text-black">{offer._count.proposedTrades} trade{offer._count.proposedTrades !== 1 ? 's' : ''} proposed</span>
                ) : offer._count?.messages ? (
                  <span className="text-black">{offer._count.messages} message{offer._count.messages !== 1 ? 's' : ''}</span>
                ) : null}
              </div>
            )}
          </div>

          {/* Item image - only for offers */}
          {offer.type !== 'ask' && offer.item?.imageUrl && (
            <img 
              src={offer.item.imageUrl}
              alt={offer.item.name}
              className="w-16 h-16 object-cover rounded-xl border border-black"
            />
          )}
        </div>

        {/* Location display - positioned at bottom right */}
        {offer.displayLocation && (
          <div className="absolute bottom-3 right-4 text-xs text-gray flex items-center">
            <MapPin size={12} className="mr-1" />
            <span>
              {offer.displayLocation}
              {offer.distance !== undefined && ` (${offer.distance}km)`}
            </span>
          </div>
        )}
      </Link>
    </div>
  )
}