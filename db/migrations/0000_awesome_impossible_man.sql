CREATE TYPE "public"."domain_status" AS ENUM('active', 'paused', 'removed');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."plan_slug" AS ENUM('trial', 'lite', 'starter', 'growth', 'scale');--> statement-breakpoint
CREATE TYPE "public"."sub_status" AS ENUM('trialing', 'active', 'past_due', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('superadmin', 'publisher');--> statement-breakpoint
CREATE TABLE "domains" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" text NOT NULL,
	"domain" text NOT NULL,
	"status" "domain_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"slug" "plan_slug" PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"price_monthly" integer,
	"max_domains" integer,
	"max_mau_per_domain" integer,
	"max_gates" integer,
	"trial_days" integer DEFAULT 0,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publisher_members" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publishers" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" text NOT NULL,
	"plan_slug" "plan_slug" NOT NULL,
	"status" "sub_status" DEFAULT 'trialing' NOT NULL,
	"razorpay_sub_id" text,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" DEFAULT 'publisher' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publisher_members" ADD CONSTRAINT "publisher_members_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publisher_members" ADD CONSTRAINT "publisher_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "domains_domain_idx" ON "domains" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "domains_publisher_idx" ON "domains" USING btree ("publisher_id");--> statement-breakpoint
CREATE INDEX "prt_user_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "publisher_members_unique_idx" ON "publisher_members" USING btree ("publisher_id","user_id");--> statement-breakpoint
CREATE INDEX "publisher_members_publisher_idx" ON "publisher_members" USING btree ("publisher_id");--> statement-breakpoint
CREATE INDEX "publisher_members_user_idx" ON "publisher_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "publishers_slug_idx" ON "publishers" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "subscriptions_publisher_idx" ON "subscriptions" USING btree ("publisher_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");