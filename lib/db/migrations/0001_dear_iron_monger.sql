CREATE TABLE "model_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"conversation_id" uuid,
	"message_id" uuid,
	"purpose" text NOT NULL,
	"role" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"status" text DEFAULT 'started' NOT NULL,
	"request_id" text,
	"response_id" text,
	"input_tokens" bigint,
	"cached_input_tokens" bigint,
	"cache_write_input_tokens" bigint,
	"output_tokens" bigint,
	"reasoning_tokens" bigint,
	"total_tokens" bigint,
	"finish_reason" text,
	"error_code" text,
	"latency_ms" integer,
	"time_to_first_token_ms" integer,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "model_usage_purpose_check" CHECK ("model_usage"."purpose" in ('conversation_turn', 'conversation_title')),
	CONSTRAINT "model_usage_role_check" CHECK ("model_usage"."role" in ('conversation', 'background')),
	CONSTRAINT "model_usage_status_check" CHECK ("model_usage"."status" in ('started', 'completed', 'cancelled', 'failed'))
);
--> statement-breakpoint
DROP INDEX "messages_conversation_created_idx";--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "last_message_at" timestamp with time zone;--> statement-breakpoint
UPDATE "conversations" SET "last_message_at" = "updated_at";--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "last_message_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "last_message_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "provider" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "status" text DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "client_turn_id" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "finish_reason" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "error_code" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "provider_response_id" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "messages"
		WHERE
			(
				jsonb_typeof("content") = 'array'
				AND EXISTS (
					SELECT 1
					FROM jsonb_array_elements("content") AS item(value)
					WHERE jsonb_typeof(item.value) <> 'object'
						OR item.value->>'type' <> 'text'
						OR jsonb_typeof(item.value->'text') <> 'string'
				)
			)
			OR (
				jsonb_typeof("content") = 'object'
				AND NOT (
					"content"->>'version' = '1'
					AND jsonb_typeof("content"->'blocks') = 'array'
					AND NOT EXISTS (
						SELECT 1
						FROM jsonb_array_elements("content"->'blocks') AS item(value)
						WHERE jsonb_typeof(item.value) <> 'object'
							OR item.value->>'type' <> 'text'
							OR jsonb_typeof(item.value->'text') <> 'string'
					)
				)
			)
			OR jsonb_typeof("content") NOT IN ('array', 'object')
	) THEN
		RAISE EXCEPTION 'Phase 2 migration found an unsupported messages.content shape';
	END IF;
END $$;--> statement-breakpoint
UPDATE "messages"
SET "content" = jsonb_build_object('version', 1, 'blocks', "content")
WHERE jsonb_typeof("content") = 'array';--> statement-breakpoint
ALTER TABLE "model_usage" ADD CONSTRAINT "model_usage_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_usage" ADD CONSTRAINT "model_usage_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_usage" ADD CONSTRAINT "model_usage_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "model_usage_owner_started_idx" ON "model_usage" USING btree ("owner_id","started_at");--> statement-breakpoint
CREATE INDEX "model_usage_conversation_started_idx" ON "model_usage" USING btree ("conversation_id","started_at");--> statement-breakpoint
CREATE INDEX "model_usage_message_idx" ON "model_usage" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "conversations_owner_last_message_idx" ON "conversations" USING btree ("owner_id","last_message_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "messages_owner_conversation_created_idx" ON "messages" USING btree ("owner_id","conversation_id","created_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "messages_conversation_turn_role_unique" ON "messages" USING btree ("conversation_id","client_turn_id","role");--> statement-breakpoint
CREATE INDEX "messages_conversation_created_idx" ON "messages" USING btree ("conversation_id","created_at","id");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_status_check" CHECK ("messages"."status" in ('pending', 'streaming', 'completed', 'interrupted', 'failed'));
