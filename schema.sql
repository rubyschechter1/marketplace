-- Database schema for Marketplace barter app

-- Travelers (user profiles)
CREATE TABLE travelers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Items catalog
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    condition VARCHAR(50), -- new, like-new, good, fair
    image_url VARCHAR(500),
    created_by UUID REFERENCES travelers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Offers (the actual barter posts)
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    traveler_id UUID REFERENCES travelers(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled
    
    -- Location using PostGIS extension (or simple lat/lng)
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location_name VARCHAR(200), -- "Downtown Austin" or "Near Central Park"
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Create spatial index for nearby queries
    CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
    CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180)
);

-- Messages between travelers
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES travelers(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES travelers(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure sender and recipient are different
    CONSTRAINT different_users CHECK (sender_id != recipient_id)
);

-- Indexes for performance
CREATE INDEX idx_offers_location ON offers(latitude, longitude);
CREATE INDEX idx_offers_traveler ON offers(traveler_id);
CREATE INDEX idx_offers_item ON offers(item_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_messages_offer ON messages(offer_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id, is_read);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_travelers_updated_at
    BEFORE UPDATE ON travelers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();