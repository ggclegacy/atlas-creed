CREATE TABLE "canon_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canonical_id" text NOT NULL,
	"title" text NOT NULL,
	"version" text,
	"status" text NOT NULL,
	"effective_date" date,
	"authority" text NOT NULL,
	"source" text NOT NULL,
	"source_reference" text NOT NULL,
	"source_checksum" text NOT NULL,
	"normalized_checksum" text NOT NULL,
	"sensitivity" text NOT NULL,
	"provenance" text NOT NULL,
	"ingested_at" timestamp with time zone NOT NULL,
	"supersedes_canonical_id" text,
	"superseded_by_canonical_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "canon_documents_status_check" CHECK ("canon_documents"."status" in ('active', 'draft', 'retired'))
);
--> statement-breakpoint
CREATE TABLE "canon_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"canonical_section_id" text NOT NULL,
	"ordinal" integer NOT NULL,
	"title" text NOT NULL,
	"normalized_text" text NOT NULL,
	"checksum" text NOT NULL,
	"information_state" text DEFAULT 'CANONICAL' NOT NULL,
	"trust_class" text DEFAULT 'SYSTEM_CONSTITUTIONAL_INSTRUCTION' NOT NULL,
	"authority_class" text DEFAULT 'PROTECTED_CONSTITUTION' NOT NULL,
	"sensitivity" text NOT NULL,
	"token_estimate" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conflict_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"project_id" uuid,
	"summary" text NOT NULL,
	"source_ids" jsonb NOT NULL,
	"relevant_passages" jsonb NOT NULL,
	"authority_levels" jsonb NOT NULL,
	"reason" text NOT NULL,
	"blocks_task" boolean DEFAULT true NOT NULL,
	"recommended_resolution" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"resolution" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conflict_records_status_check" CHECK ("conflict_records"."status" in ('open', 'resolved', 'dismissed'))
);
--> statement-breakpoint
CREATE TABLE "constitutional_amendments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"old_document_id" uuid NOT NULL,
	"proposed_title" text NOT NULL,
	"proposed_version" text NOT NULL,
	"proposed_normalized_text" text NOT NULL,
	"rationale" text NOT NULL,
	"diff" text NOT NULL,
	"impact_analysis" text NOT NULL,
	"status" text DEFAULT 'proposed' NOT NULL,
	"approval_phrase_hash" text,
	"approved_by_owner_id" uuid,
	"approved_at" timestamp with time zone,
	"effective_date" date,
	"activated_document_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "constitutional_amendments_status_check" CHECK ("constitutional_amendments"."status" in ('proposed', 'approved', 'rejected', 'activated'))
);
--> statement-breakpoint
CREATE TABLE "context_trace_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trace_id" uuid NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text NOT NULL,
	"source_version" text,
	"title" text NOT NULL,
	"information_state" text NOT NULL,
	"trust_class" text NOT NULL,
	"authority_class" text NOT NULL,
	"sensitivity" text NOT NULL,
	"included" boolean NOT NULL,
	"reason" text NOT NULL,
	"token_estimate" integer NOT NULL,
	"rank" integer,
	"source_reference" text NOT NULL,
	"provenance" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "context_traces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"conversation_id" uuid,
	"message_id" uuid,
	"project_id" uuid,
	"task_category" text NOT NULL,
	"kernel_id" text NOT NULL,
	"kernel_version" text NOT NULL,
	"kernel_checksum" text NOT NULL,
	"model_provider" text NOT NULL,
	"model" text NOT NULL,
	"estimated_input_tokens" integer NOT NULL,
	"retrieved_item_count" integer NOT NULL,
	"excluded_item_count" integer NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"key" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"information_state" text NOT NULL,
	"trust_class" text NOT NULL,
	"authority_class" text NOT NULL,
	"sensitivity" text NOT NULL,
	"confidence" integer,
	"source_type" text NOT NULL,
	"source_reference" text NOT NULL,
	"provenance" text NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_to" timestamp with time zone,
	"last_verified_at" timestamp with time zone,
	"superseded_by" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "model_usage" ADD COLUMN "context_trace_id" uuid;--> statement-breakpoint
ALTER TABLE "canon_sections" ADD CONSTRAINT "canon_sections_document_id_canon_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."canon_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conflict_records" ADD CONSTRAINT "conflict_records_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conflict_records" ADD CONSTRAINT "conflict_records_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "constitutional_amendments" ADD CONSTRAINT "constitutional_amendments_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "constitutional_amendments" ADD CONSTRAINT "constitutional_amendments_old_document_id_canon_documents_id_fk" FOREIGN KEY ("old_document_id") REFERENCES "public"."canon_documents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "constitutional_amendments" ADD CONSTRAINT "constitutional_amendments_approved_by_owner_id_owners_id_fk" FOREIGN KEY ("approved_by_owner_id") REFERENCES "public"."owners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "constitutional_amendments" ADD CONSTRAINT "constitutional_amendments_activated_document_id_canon_documents_id_fk" FOREIGN KEY ("activated_document_id") REFERENCES "public"."canon_documents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_trace_items" ADD CONSTRAINT "context_trace_items_trace_id_context_traces_id_fk" FOREIGN KEY ("trace_id") REFERENCES "public"."context_traces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_traces" ADD CONSTRAINT "context_traces_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_traces" ADD CONSTRAINT "context_traces_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_traces" ADD CONSTRAINT "context_traces_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_traces" ADD CONSTRAINT "context_traces_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_records" ADD CONSTRAINT "knowledge_records_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_records" ADD CONSTRAINT "knowledge_records_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "canon_documents_revision_unique" ON "canon_documents" USING btree ("canonical_id","normalized_checksum");--> statement-breakpoint
CREATE INDEX "canon_documents_active_idx" ON "canon_documents" USING btree ("canonical_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "canon_sections_document_section_unique" ON "canon_sections" USING btree ("document_id","canonical_section_id");--> statement-breakpoint
CREATE INDEX "canon_sections_document_ordinal_idx" ON "canon_sections" USING btree ("document_id","ordinal");--> statement-breakpoint
CREATE INDEX "canon_sections_search_idx" ON "canon_sections" USING gin (to_tsvector('english', coalesce("title", '') || ' ' || coalesce("normalized_text", '')));--> statement-breakpoint
CREATE INDEX "conflict_records_owner_status_idx" ON "conflict_records" USING btree ("owner_id","status");--> statement-breakpoint
CREATE INDEX "constitutional_amendments_owner_status_idx" ON "constitutional_amendments" USING btree ("owner_id","status");--> statement-breakpoint
CREATE INDEX "context_trace_items_trace_idx" ON "context_trace_items" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "context_traces_owner_created_idx" ON "context_traces" USING btree ("owner_id","created_at");--> statement-breakpoint
CREATE INDEX "context_traces_conversation_created_idx" ON "context_traces" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_records_owner_project_key_unique" ON "knowledge_records" USING btree ("owner_id","project_id","key");--> statement-breakpoint
CREATE INDEX "knowledge_records_owner_project_state_idx" ON "knowledge_records" USING btree ("owner_id","project_id","information_state");--> statement-breakpoint
CREATE INDEX "knowledge_records_search_idx" ON "knowledge_records" USING gin (to_tsvector('english', coalesce("title", '') || ' ' || coalesce("content", '')));--> statement-breakpoint
CREATE UNIQUE INDEX "projects_owner_slug_unique" ON "projects" USING btree ("owner_id","slug");--> statement-breakpoint
CREATE INDEX "projects_owner_active_idx" ON "projects" USING btree ("owner_id","active");--> statement-breakpoint
ALTER TABLE "model_usage" ADD CONSTRAINT "model_usage_context_trace_id_context_traces_id_fk" FOREIGN KEY ("context_trace_id") REFERENCES "public"."context_traces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "model_usage_context_trace_idx" ON "model_usage" USING btree ("context_trace_id");