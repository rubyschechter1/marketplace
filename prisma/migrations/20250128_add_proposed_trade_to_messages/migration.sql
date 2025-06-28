-- AlterTable
ALTER TABLE "messages" ADD COLUMN "proposed_trade_id" UUID;

-- CreateIndex
CREATE INDEX "idx_messages_proposed_trade" ON "messages"("proposed_trade_id");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_proposed_trade_id_fkey" FOREIGN KEY ("proposed_trade_id") REFERENCES "proposed_trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;