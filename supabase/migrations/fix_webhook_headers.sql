-- Add missing headers column to Webhook table
ALTER TABLE "Webhook" ADD COLUMN IF NOT EXISTS headers JSONB;
