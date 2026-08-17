ALTER TABLE "constitutional_amendments" ADD COLUMN "proposed_sections" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "constitutional_amendments" ADD COLUMN "evaluation_evidence" text;