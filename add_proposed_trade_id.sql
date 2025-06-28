-- Check if column exists first
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='messages' 
        AND column_name='proposed_trade_id'
    ) THEN
        -- Add column
        ALTER TABLE "messages" ADD COLUMN "proposed_trade_id" UUID;
        
        -- Create index
        CREATE INDEX "idx_messages_proposed_trade" ON "messages"("proposed_trade_id");
        
        -- Add foreign key
        ALTER TABLE "messages" ADD CONSTRAINT "messages_proposed_trade_id_fkey" 
        FOREIGN KEY ("proposed_trade_id") REFERENCES "proposed_trades"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;