CREATE TYPE "public"."ad_provider" AS ENUM('google_adsense', 'google_ad_manager');--> statement-breakpoint
CREATE TYPE "public"."ad_source_type" AS ENUM('direct', 'network');--> statement-breakpoint
CREATE TYPE "public"."device_type" AS ENUM('mobile', 'desktop', 'tablet');--> statement-breakpoint
CREATE TYPE "public"."gate_event_type" AS ENUM('gate_shown', 'step_shown', 'gate_passed', 'ad_start', 'ad_complete', 'ad_skip', 'subscription_cta_click', 'subscription_cta_skip', 'one_time_unlock_start', 'one_time_unlock_complete', 'one_time_unlock_skip');--> statement-breakpoint
CREATE TYPE "public"."match_type" AS ENUM('path_glob', 'content_type');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "public"."pg_mode" AS ENUM('platform', 'own');--> statement-breakpoint
CREATE TYPE "public"."pg_provider" AS ENUM('razorpay');--> statement-breakpoint
CREATE TYPE "public"."reader_segment" AS ENUM('new', 'casual', 'regular', 'power_user');--> statement-breakpoint
CREATE TYPE "public"."step_action" AS ENUM('proceed', 'next_step');--> statement-breakpoint
CREATE TYPE "public"."step_type" AS ENUM('ad', 'subscription_cta', 'one_time_unlock');--> statement-breakpoint
CREATE TYPE "public"."unlock_type" AS ENUM('ad_completion', 'one_time_payment', 'subscription');--> statement-breakpoint
CREATE TYPE "public"."visit_frequency" AS ENUM('unknown', 'one_time', 'occasional', 'weekly', 'daily');--> statement-breakpoint
CREATE TABLE "ad_units" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" text NOT NULL,
	"name" text NOT NULL,
	"source_type" "ad_source_type" NOT NULL,
	"weight" integer DEFAULT 1 NOT NULL,
	"relevant_categories" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"media_type" "media_type",
	"storage_key" text,
	"cdn_url" text,
	"cta_label" text,
	"cta_url" text,
	"skip_after_seconds" integer,
	"ad_network_id" text,
	"network_config" jsonb,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "analytics_rollups" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" text NOT NULL,
	"gate_id" text,
	"date" date NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"step_completions" integer DEFAULT 0 NOT NULL,
	"gate_passes" integer DEFAULT 0 NOT NULL,
	"unique_readers" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_classifications" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"categories" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"confidence" real DEFAULT 0 NOT NULL,
	"classified_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gate_events" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" text NOT NULL,
	"gate_id" text NOT NULL,
	"step_id" text,
	"reader_id" text,
	"event_type" "gate_event_type" NOT NULL,
	"ad_unit_id" text,
	"content_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gate_rules" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gate_id" text NOT NULL,
	"pattern" text NOT NULL,
	"match_type" "match_type" DEFAULT 'path_glob' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gate_steps" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gate_id" text NOT NULL,
	"step_order" integer NOT NULL,
	"step_type" "step_type" NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"trigger_conditions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"on_skip" "step_action" DEFAULT 'proceed' NOT NULL,
	"on_decline" "step_action" DEFAULT 'proceed' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gate_unlocks" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reader_id" text NOT NULL,
	"gate_id" text NOT NULL,
	"content_id" text,
	"unlock_type" "unlock_type" NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gates" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" text NOT NULL,
	"name" text NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"trigger_conditions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pg_webhook_events" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" text,
	"provider" "pg_provider" NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publisher_ad_networks" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" text NOT NULL,
	"provider" "ad_provider" NOT NULL,
	"credentials" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publisher_pg_configs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" text NOT NULL,
	"mode" "pg_mode" DEFAULT 'platform' NOT NULL,
	"provider" "pg_provider" DEFAULT 'razorpay' NOT NULL,
	"key_id" text,
	"key_secret" text,
	"webhook_secret" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reader_page_visits" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reader_id" text NOT NULL,
	"domain_id" text NOT NULL,
	"url" text NOT NULL,
	"content_category" text,
	"read_time_seconds" integer,
	"scroll_depth_pct" integer,
	"device_type" "device_type",
	"referrer" text,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reader_profiles" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reader_id" text NOT NULL,
	"segment" "reader_segment" DEFAULT 'new' NOT NULL,
	"engagement_score" real DEFAULT 0 NOT NULL,
	"ad_completion_rate" real DEFAULT 0 NOT NULL,
	"monetization_probability" real DEFAULT 0 NOT NULL,
	"topic_interests" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"visit_frequency" "visit_frequency" DEFAULT 'unknown' NOT NULL,
	"total_visits" integer DEFAULT 0 NOT NULL,
	"total_domains" integer DEFAULT 0 NOT NULL,
	"last_computed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reader_tokens" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reader_id" text NOT NULL,
	"domain_id" text NOT NULL,
	"token" text NOT NULL,
	"visit_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "readers" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fingerprint" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "domains" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "domains" ADD COLUMN "site_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "domains" ADD COLUMN "embed_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "domains" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "domains" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "publishers" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "publishers" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "publishers" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "ad_units" ADD CONSTRAINT "ad_units_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_units" ADD CONSTRAINT "ad_units_ad_network_id_publisher_ad_networks_id_fk" FOREIGN KEY ("ad_network_id") REFERENCES "public"."publisher_ad_networks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_rollups" ADD CONSTRAINT "analytics_rollups_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_rollups" ADD CONSTRAINT "analytics_rollups_gate_id_gates_id_fk" FOREIGN KEY ("gate_id") REFERENCES "public"."gates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_events" ADD CONSTRAINT "gate_events_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_events" ADD CONSTRAINT "gate_events_gate_id_gates_id_fk" FOREIGN KEY ("gate_id") REFERENCES "public"."gates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_events" ADD CONSTRAINT "gate_events_step_id_gate_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."gate_steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_events" ADD CONSTRAINT "gate_events_reader_id_readers_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."readers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_events" ADD CONSTRAINT "gate_events_ad_unit_id_ad_units_id_fk" FOREIGN KEY ("ad_unit_id") REFERENCES "public"."ad_units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_rules" ADD CONSTRAINT "gate_rules_gate_id_gates_id_fk" FOREIGN KEY ("gate_id") REFERENCES "public"."gates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_steps" ADD CONSTRAINT "gate_steps_gate_id_gates_id_fk" FOREIGN KEY ("gate_id") REFERENCES "public"."gates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_unlocks" ADD CONSTRAINT "gate_unlocks_reader_id_readers_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."readers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gate_unlocks" ADD CONSTRAINT "gate_unlocks_gate_id_gates_id_fk" FOREIGN KEY ("gate_id") REFERENCES "public"."gates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gates" ADD CONSTRAINT "gates_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg_webhook_events" ADD CONSTRAINT "pg_webhook_events_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publisher_ad_networks" ADD CONSTRAINT "publisher_ad_networks_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publisher_pg_configs" ADD CONSTRAINT "publisher_pg_configs_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reader_page_visits" ADD CONSTRAINT "reader_page_visits_reader_id_readers_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."readers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reader_page_visits" ADD CONSTRAINT "reader_page_visits_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reader_profiles" ADD CONSTRAINT "reader_profiles_reader_id_readers_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."readers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reader_tokens" ADD CONSTRAINT "reader_tokens_reader_id_readers_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."readers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reader_tokens" ADD CONSTRAINT "reader_tokens_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ad_units_publisher_idx" ON "ad_units" USING btree ("publisher_id");--> statement-breakpoint
CREATE INDEX "ad_units_network_idx" ON "ad_units" USING btree ("ad_network_id");--> statement-breakpoint
CREATE UNIQUE INDEX "analytics_rollups_unique_idx" ON "analytics_rollups" USING btree ("domain_id","gate_id","date");--> statement-breakpoint
CREATE INDEX "analytics_rollups_domain_idx" ON "analytics_rollups" USING btree ("domain_id");--> statement-breakpoint
CREATE UNIQUE INDEX "content_classifications_url_idx" ON "content_classifications" USING btree ("url");--> statement-breakpoint
CREATE INDEX "gate_events_domain_idx" ON "gate_events" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "gate_events_gate_idx" ON "gate_events" USING btree ("gate_id");--> statement-breakpoint
CREATE INDEX "gate_events_occurred_idx" ON "gate_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "gate_rules_gate_idx" ON "gate_rules" USING btree ("gate_id");--> statement-breakpoint
CREATE INDEX "gate_steps_gate_idx" ON "gate_steps" USING btree ("gate_id");--> statement-breakpoint
CREATE INDEX "gate_unlocks_reader_gate_idx" ON "gate_unlocks" USING btree ("reader_id","gate_id");--> statement-breakpoint
CREATE INDEX "gate_unlocks_gate_idx" ON "gate_unlocks" USING btree ("gate_id");--> statement-breakpoint
CREATE INDEX "gates_domain_idx" ON "gates" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "gates_priority_idx" ON "gates" USING btree ("domain_id","priority");--> statement-breakpoint
CREATE UNIQUE INDEX "pg_webhook_events_unique_idx" ON "pg_webhook_events" USING btree ("provider","publisher_id","event_id");--> statement-breakpoint
CREATE INDEX "pg_webhook_events_publisher_idx" ON "pg_webhook_events" USING btree ("publisher_id");--> statement-breakpoint
CREATE UNIQUE INDEX "publisher_ad_networks_unique_idx" ON "publisher_ad_networks" USING btree ("publisher_id","provider");--> statement-breakpoint
CREATE INDEX "publisher_ad_networks_publisher_idx" ON "publisher_ad_networks" USING btree ("publisher_id");--> statement-breakpoint
CREATE UNIQUE INDEX "publisher_pg_configs_publisher_idx" ON "publisher_pg_configs" USING btree ("publisher_id");--> statement-breakpoint
CREATE INDEX "reader_page_visits_reader_idx" ON "reader_page_visits" USING btree ("reader_id");--> statement-breakpoint
CREATE INDEX "reader_page_visits_domain_idx" ON "reader_page_visits" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "reader_page_visits_occurred_idx" ON "reader_page_visits" USING btree ("occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reader_profiles_reader_idx" ON "reader_profiles" USING btree ("reader_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reader_tokens_token_idx" ON "reader_tokens" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "reader_tokens_reader_domain_idx" ON "reader_tokens" USING btree ("reader_id","domain_id");--> statement-breakpoint
CREATE INDEX "reader_tokens_domain_idx" ON "reader_tokens" USING btree ("domain_id");--> statement-breakpoint
CREATE UNIQUE INDEX "readers_fingerprint_idx" ON "readers" USING btree ("fingerprint");--> statement-breakpoint
CREATE UNIQUE INDEX "domains_site_key_idx" ON "domains" USING btree ("site_key");