import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  date,
  real,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum        = pgEnum("user_role",        ["superadmin", "publisher"])
export const memberRoleEnum      = pgEnum("member_role",      ["owner", "admin", "member"])
export const planSlugEnum        = pgEnum("plan_slug",        ["trial", "lite", "starter", "growth", "scale"])
export const subStatusEnum       = pgEnum("sub_status",       ["trialing", "active", "past_due", "cancelled", "suspended"])
export const domainStatusEnum    = pgEnum("domain_status",    ["active", "paused", "removed"])
export const stepTypeEnum        = pgEnum("step_type",        ["ad", "subscription_cta", "one_time_unlock"])
export const stepActionEnum      = pgEnum("step_action",      ["proceed", "next_step"])
export const matchTypeEnum       = pgEnum("match_type",       ["path_glob", "content_type"])
export const deviceTypeEnum      = pgEnum("device_type",      ["mobile", "desktop", "tablet"])
export const unlockTypeEnum      = pgEnum("unlock_type",      ["ad_completion", "one_time_payment", "subscription"])
export const readerSegmentEnum   = pgEnum("reader_segment",   ["new", "casual", "regular", "power_user"])
export const visitFrequencyEnum  = pgEnum("visit_frequency",  ["unknown", "one_time", "occasional", "weekly", "daily"])
export const adProviderEnum      = pgEnum("ad_provider",      ["google_adsense", "google_ad_manager"])
export const adSourceTypeEnum    = pgEnum("ad_source_type",   ["direct", "network"])
export const mediaTypeEnum       = pgEnum("media_type",       ["image", "video"])
export const pgModeEnum          = pgEnum("pg_mode",          ["platform", "own", "manual"])
export const pgProviderEnum      = pgEnum("pg_provider",      ["razorpay"])
export const gateEventTypeEnum   = pgEnum("gate_event_type",  [
  "gate_shown", "step_shown", "gate_passed",
  "ad_start", "ad_complete", "ad_skip",
  "subscription_cta_click", "subscription_cta_skip",
  "one_time_unlock_start", "one_time_unlock_complete", "one_time_unlock_skip",
])

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id:           text("id").primaryKey().default(sql`gen_random_uuid()`),
  email:        text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  name:         text("name").notNull(),
  role:         userRoleEnum("role").notNull().default("publisher"),
  avatarUrl:    text("avatar_url"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
  updatedAt:    timestamp("updated_at").notNull().defaultNow(),
  deletedAt:    timestamp("deleted_at"),
}, t => [
  uniqueIndex("users_email_idx").on(t.email),
])

// ─── Publishers ───────────────────────────────────────────────────────────────

export const publishers = pgTable("publishers", {
  id:        text("id").primaryKey().default(sql`gen_random_uuid()`),
  name:      text("name").notNull(),
  slug:      text("slug").notNull(),
  logoUrl:   text("logo_url"),
  currency:  text("currency").notNull().default("INR"),
  timezone:  text("timezone").notNull().default("Asia/Kolkata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, t => [
  uniqueIndex("publishers_slug_idx").on(t.slug),
])

export const publisherMembers = pgTable("publisher_members", {
  id:          text("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: text("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  userId:      text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role:        memberRoleEnum("role").notNull().default("member"),
  joinedAt:    timestamp("joined_at").notNull().defaultNow(),
}, t => [
  uniqueIndex("publisher_members_unique_idx").on(t.publisherId, t.userId),
  index("publisher_members_publisher_idx").on(t.publisherId),
  index("publisher_members_user_idx").on(t.userId),
])

// ─── Brands ───────────────────────────────────────────────────────────────────

export const brands = pgTable("brands", {
  id:          text("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: text("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  name:        text("name").notNull(),
  slug:        text("slug").notNull(),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
  updatedAt:   timestamp("updated_at").notNull().defaultNow(),
}, t => [
  uniqueIndex("brands_publisher_slug_idx").on(t.publisherId, t.slug),
  index("brands_publisher_idx").on(t.publisherId),
])

// ─── Domains ──────────────────────────────────────────────────────────────────

export const domains = pgTable("domains", {
  id:               text("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId:      text("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  brandId:          text("brand_id").references(() => brands.id, { onDelete: "cascade" }),
  name:             text("name").notNull(),
  domain:           text("domain").notNull(),
  siteKey:          text("site_key").notNull(),
  embedEnabled:          boolean("embed_enabled").notNull().default(false),
  status:                domainStatusEnum("status").notNull().default("active"),
  whitelistedPaths:      jsonb("whitelisted_paths").notNull().default(sql`'[]'::jsonb`),
  logoutWidgetEnabled:   boolean("logout_widget_enabled").notNull().default(true),
  logoutWidgetPosition:  text("logout_widget_position").notNull().default("bottom"),
  createdAt:        timestamp("created_at").notNull().defaultNow(),
  updatedAt:        timestamp("updated_at").notNull().defaultNow(),
  deletedAt:        timestamp("deleted_at"),
}, t => [
  uniqueIndex("domains_domain_idx").on(t.domain),
  uniqueIndex("domains_site_key_idx").on(t.siteKey),
  index("domains_publisher_idx").on(t.publisherId),
  index("domains_brand_idx").on(t.brandId),
])

// ─── Gates ────────────────────────────────────────────────────────────────────

export const gates = pgTable("gates", {
  id:                text("id").primaryKey().default(sql`gen_random_uuid()`),
  domainId:          text("domain_id").notNull().references(() => domains.id, { onDelete: "cascade" }),
  name:              text("name").notNull(),
  priority:          integer("priority").notNull().default(0),
  enabled:           boolean("enabled").notNull().default(true),
  triggerConditions: jsonb("trigger_conditions").notNull().default(sql`'{}'::jsonb`),
  createdAt:         timestamp("created_at").notNull().defaultNow(),
  updatedAt:         timestamp("updated_at").notNull().defaultNow(),
  deletedAt:         timestamp("deleted_at"),
}, t => [
  index("gates_domain_idx").on(t.domainId),
  index("gates_priority_idx").on(t.domainId, t.priority),
])

export const gateRules = pgTable("gate_rules", {
  id:        text("id").primaryKey().default(sql`gen_random_uuid()`),
  gateId:    text("gate_id").notNull().references(() => gates.id, { onDelete: "cascade" }),
  pattern:   text("pattern").notNull(),
  matchType: matchTypeEnum("match_type").notNull().default("path_glob"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, t => [
  index("gate_rules_gate_idx").on(t.gateId),
])

export const gateSteps = pgTable("gate_steps", {
  id:                text("id").primaryKey().default(sql`gen_random_uuid()`),
  gateId:            text("gate_id").notNull().references(() => gates.id, { onDelete: "cascade" }),
  stepOrder:         integer("step_order").notNull(),
  stepType:          stepTypeEnum("step_type").notNull(),
  config:            jsonb("config").notNull().default(sql`'{}'::jsonb`),
  triggerConditions: jsonb("trigger_conditions").notNull().default(sql`'{}'::jsonb`),
  onSkip:            stepActionEnum("on_skip").notNull().default("proceed"),
  onDecline:         stepActionEnum("on_decline").notNull().default("proceed"),
  createdAt:         timestamp("created_at").notNull().defaultNow(),
  updatedAt:         timestamp("updated_at").notNull().defaultNow(),
}, t => [
  index("gate_steps_gate_idx").on(t.gateId),
])

// ─── Plans ────────────────────────────────────────────────────────────────────

export const plans = pgTable("plans", {
  slug:              planSlugEnum("slug").primaryKey(),
  name:              text("name").notNull(),
  priceMonthly:      integer("price_monthly"),
  maxBrands:         integer("max_brands"),
  maxDomains:        integer("max_domains"),
  maxMauPerDomain:   integer("max_mau_per_domain"),
  maxGates:          integer("max_gates"),
  trialDays:         integer("trial_days").default(0),
  active:            boolean("active").notNull().default(true),
  razorpayPlanId:    text("razorpay_plan_id"),
})

// ─── Subscriptions ────────────────────────────────────────────────────────────

export const subscriptions = pgTable("subscriptions", {
  id:                 text("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId:        text("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  planSlug:           planSlugEnum("plan_slug").notNull(),
  status:             subStatusEnum("status").notNull().default("trialing"),
  razorpaySubId:      text("razorpay_sub_id"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd:   timestamp("current_period_end"),
  cancelledAt:        timestamp("cancelled_at"),
  cancelAtCycleEnd:   boolean("cancel_at_cycle_end").notNull().default(false),
  dunningStartedAt:   timestamp("dunning_started_at"),
  createdAt:          timestamp("created_at").notNull().defaultNow(),
  updatedAt:          timestamp("updated_at").notNull().defaultNow(),
}, t => [
  index("subscriptions_publisher_idx").on(t.publisherId),
  index("subscriptions_status_idx").on(t.status),
])

// ─── Readers ──────────────────────────────────────────────────────────────────

export const readers = pgTable("readers", {
  id:          text("id").primaryKey().default(sql`gen_random_uuid()`),
  fingerprint: text("fingerprint").notNull(),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
  lastSeenAt:  timestamp("last_seen_at").notNull().defaultNow(),
}, t => [
  uniqueIndex("readers_fingerprint_idx").on(t.fingerprint),
])

export const readerTokens = pgTable("reader_tokens", {
  id:         text("id").primaryKey().default(sql`gen_random_uuid()`),
  readerId:   text("reader_id").notNull().references(() => readers.id, { onDelete: "cascade" }),
  domainId:   text("domain_id").notNull().references(() => domains.id, { onDelete: "cascade" }),
  token:      text("token").notNull(),
  visitCount: integer("visit_count").notNull().default(0),
  expiresAt:  timestamp("expires_at"),
  createdAt:  timestamp("created_at").notNull().defaultNow(),
  updatedAt:  timestamp("updated_at").notNull().defaultNow(),
}, t => [
  uniqueIndex("reader_tokens_token_idx").on(t.token),
  uniqueIndex("reader_tokens_reader_domain_idx").on(t.readerId, t.domainId),
  index("reader_tokens_domain_idx").on(t.domainId),
])

export const gateUnlocks = pgTable("gate_unlocks", {
  id:         text("id").primaryKey().default(sql`gen_random_uuid()`),
  readerId:   text("reader_id").notNull().references(() => readers.id, { onDelete: "cascade" }),
  gateId:     text("gate_id").notNull().references(() => gates.id, { onDelete: "cascade" }),
  contentId:  text("content_id"),
  unlockType: unlockTypeEnum("unlock_type").notNull(),
  expiresAt:  timestamp("expires_at"),
  createdAt:  timestamp("created_at").notNull().defaultNow(),
}, t => [
  index("gate_unlocks_reader_gate_idx").on(t.readerId, t.gateId),
  index("gate_unlocks_gate_idx").on(t.gateId),
])

// ─── Reader intelligence ──────────────────────────────────────────────────────

export const readerPageVisits = pgTable("reader_page_visits", {
  id:               text("id").primaryKey().default(sql`gen_random_uuid()`),
  readerId:         text("reader_id").notNull().references(() => readers.id, { onDelete: "cascade" }),
  domainId:         text("domain_id").notNull().references(() => domains.id, { onDelete: "cascade" }),
  url:              text("url").notNull(),
  contentCategory:  text("content_category"),
  readTimeSeconds:  integer("read_time_seconds"),
  scrollDepthPct:   integer("scroll_depth_pct"),
  deviceType:       deviceTypeEnum("device_type"),
  referrer:         text("referrer"),
  isSubscriber:     boolean("is_subscriber"),   // null = pre-feature; true/false = subscriber status at time of visit
  gateShown:        boolean("gate_shown"),       // true = a gate was triggered on this pageview
  occurredAt:       timestamp("occurred_at").notNull().defaultNow(),
}, t => [
  index("reader_page_visits_reader_idx").on(t.readerId),
  index("reader_page_visits_domain_idx").on(t.domainId),
  index("reader_page_visits_occurred_idx").on(t.occurredAt),
])

export const contentClassifications = pgTable("content_classifications", {
  id:           text("id").primaryKey().default(sql`gen_random_uuid()`),
  url:          text("url").notNull(),
  categories:   text("categories").array().notNull().default(sql`ARRAY[]::text[]`),
  confidence:   real("confidence").notNull().default(0),
  classifiedAt: timestamp("classified_at").notNull().defaultNow(),
}, t => [
  uniqueIndex("content_classifications_url_idx").on(t.url),
])

export const readerProfiles = pgTable("reader_profiles", {
  id:                       text("id").primaryKey().default(sql`gen_random_uuid()`),
  readerId:                 text("reader_id").notNull().references(() => readers.id, { onDelete: "cascade" }),
  segment:                  readerSegmentEnum("segment").notNull().default("new"),
  engagementScore:          real("engagement_score").notNull().default(0),
  adCompletionRate:         real("ad_completion_rate").notNull().default(0),
  monetizationProbability:  real("monetization_probability").notNull().default(0),
  topicInterests:           jsonb("topic_interests").notNull().default(sql`'{}'::jsonb`),
  visitFrequency:           visitFrequencyEnum("visit_frequency").notNull().default("unknown"),
  totalVisits:              integer("total_visits").notNull().default(0),
  totalDomains:             integer("total_domains").notNull().default(0),
  lastComputedAt:           timestamp("last_computed_at").notNull().defaultNow(),
  createdAt:                timestamp("created_at").notNull().defaultNow(),
  updatedAt:                timestamp("updated_at").notNull().defaultNow(),
}, t => [
  uniqueIndex("reader_profiles_reader_idx").on(t.readerId),
])

// ─── Ads ──────────────────────────────────────────────────────────────────────

export const publisherAdNetworks = pgTable("publisher_ad_networks", {
  id:          text("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: text("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  provider:    adProviderEnum("provider").notNull(),
  credentials: jsonb("credentials").notNull(),
  active:      boolean("active").notNull().default(true),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
  updatedAt:   timestamp("updated_at").notNull().defaultNow(),
}, t => [
  uniqueIndex("publisher_ad_networks_unique_idx").on(t.publisherId, t.provider),
  index("publisher_ad_networks_publisher_idx").on(t.publisherId),
])

export const adUnits = pgTable("ad_units", {
  id:                 text("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId:        text("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  name:               text("name").notNull(),
  sourceType:         adSourceTypeEnum("source_type").notNull(),
  weight:             integer("weight").notNull().default(1),
  relevantCategories: text("relevant_categories").array().notNull().default(sql`ARRAY[]::text[]`),
  // direct fields
  mediaType:          mediaTypeEnum("media_type"),
  storageKey:         text("storage_key"),
  cdnUrl:             text("cdn_url"),
  ctaLabel:           text("cta_label"),
  ctaUrl:             text("cta_url"),
  skipAfterSeconds:   integer("skip_after_seconds"),
  // network fields
  adNetworkId:        text("ad_network_id").references(() => publisherAdNetworks.id, { onDelete: "set null" }),
  networkConfig:      jsonb("network_config"),
  active:             boolean("active").notNull().default(true),
  createdAt:          timestamp("created_at").notNull().defaultNow(),
  updatedAt:          timestamp("updated_at").notNull().defaultNow(),
  deletedAt:          timestamp("deleted_at"),
}, t => [
  index("ad_units_publisher_idx").on(t.publisherId),
  index("ad_units_network_idx").on(t.adNetworkId),
])

// ─── Payments ─────────────────────────────────────────────────────────────────

export const publisherPgConfigs = pgTable("publisher_pg_configs", {
  id:            text("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId:   text("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  brandId:       text("brand_id").references(() => brands.id, { onDelete: "cascade" }),
  mode:          pgModeEnum("mode").notNull().default("platform"),
  provider:      pgProviderEnum("provider").notNull().default("razorpay"),
  keyId:         text("key_id"),
  keySecret:     text("key_secret"),
  webhookSecret: text("webhook_secret"),
  active:        boolean("active").notNull().default(true),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
  updatedAt:     timestamp("updated_at").notNull().defaultNow(),
}, t => [
  uniqueIndex("publisher_pg_configs_brand_unique_idx").on(t.brandId),
  index("publisher_pg_configs_publisher_idx").on(t.publisherId),
])

export const pgWebhookEvents = pgTable("pg_webhook_events", {
  id:          text("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: text("publisher_id").references(() => publishers.id, { onDelete: "cascade" }),
  provider:    pgProviderEnum("provider").notNull(),
  eventId:     text("event_id").notNull(),
  eventType:   text("event_type").notNull(),
  payload:     jsonb("payload").notNull(),
  processedAt: timestamp("processed_at").notNull().defaultNow(),
}, t => [
  uniqueIndex("pg_webhook_events_unique_idx").on(t.provider, t.publisherId, t.eventId),
  index("pg_webhook_events_publisher_idx").on(t.publisherId),
])

// ─── Analytics ────────────────────────────────────────────────────────────────

export const gateEvents = pgTable("gate_events", {
  id:         text("id").primaryKey().default(sql`gen_random_uuid()`),
  domainId:   text("domain_id").notNull().references(() => domains.id, { onDelete: "cascade" }),
  gateId:     text("gate_id").notNull().references(() => gates.id, { onDelete: "cascade" }),
  stepId:     text("step_id").references(() => gateSteps.id, { onDelete: "set null" }),
  readerId:   text("reader_id").references(() => readers.id, { onDelete: "set null" }),
  eventType:  gateEventTypeEnum("event_type").notNull(),
  adUnitId:   text("ad_unit_id").references(() => adUnits.id, { onDelete: "set null" }),
  contentId:  text("content_id"),
  metadata:   jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
}, t => [
  index("gate_events_domain_idx").on(t.domainId),
  index("gate_events_gate_idx").on(t.gateId),
  index("gate_events_occurred_idx").on(t.occurredAt),
])

export const analyticsRollups = pgTable("analytics_rollups", {
  id:               text("id").primaryKey().default(sql`gen_random_uuid()`),
  domainId:         text("domain_id").notNull().references(() => domains.id, { onDelete: "cascade" }),
  gateId:           text("gate_id").references(() => gates.id, { onDelete: "cascade" }),
  date:             date("date").notNull(),
  impressions:      integer("impressions").notNull().default(0),
  stepCompletions:  integer("step_completions").notNull().default(0),
  gatePasses:       integer("gate_passes").notNull().default(0),
  uniqueReaders:    integer("unique_readers").notNull().default(0),
  createdAt:        timestamp("created_at").notNull().defaultNow(),
  updatedAt:        timestamp("updated_at").notNull().defaultNow(),
}, t => [
  uniqueIndex("analytics_rollups_unique_idx").on(t.domainId, t.gateId, t.date),
  index("analytics_rollups_domain_idx").on(t.domainId),
])

// ─── Publisher reader plans (subscription + unlock pricing) ──────────────────

export const publisherReaderPlans = pgTable("publisher_reader_plans", {
  id:              text("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId:     text("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  brandId:         text("brand_id").references(() => brands.id, { onDelete: "cascade" }),
  currency:        text("currency").notNull().default("INR"),
  monthlyPrice:    integer("monthly_price"),
  quarterlyPrice:  integer("quarterly_price"),
  annualPrice:     integer("annual_price"),
  subsEnabled:     boolean("subs_enabled").notNull().default(false),
  monthlyRazorpayPlanId:     text("monthly_razorpay_plan_id"),
  quarterlyRazorpayPlanId:   text("quarterly_razorpay_plan_id"),
  annualRazorpayPlanId:      text("annual_razorpay_plan_id"),
  monthlySyncedPrice:        integer("monthly_synced_price"),
  quarterlySyncedPrice:      integer("quarterly_synced_price"),
  annualSyncedPrice:         integer("annual_synced_price"),
  monthlySyncedCurrency:     text("monthly_synced_currency"),
  quarterlySyncedCurrency:   text("quarterly_synced_currency"),
  annualSyncedCurrency:      text("annual_synced_currency"),
  monthlySyncedPgMode:       pgModeEnum("monthly_synced_pg_mode"),
  quarterlySyncedPgMode:     pgModeEnum("quarterly_synced_pg_mode"),
  annualSyncedPgMode:        pgModeEnum("annual_synced_pg_mode"),
  monthlySyncedAt:           timestamp("monthly_synced_at"),
  quarterlySyncedAt:         timestamp("quarterly_synced_at"),
  annualSyncedAt:            timestamp("annual_synced_at"),
  monthlySyncError:          text("monthly_sync_error"),
  quarterlySyncError:        text("quarterly_sync_error"),
  annualSyncError:           text("annual_sync_error"),
  syncedDisplayName:  text("synced_display_name"),
  defaultUnlockPrice: integer("default_unlock_price"),
  unlockEnabled:   boolean("unlock_enabled").notNull().default(false),
  createdAt:       timestamp("created_at").notNull().defaultNow(),
  updatedAt:       timestamp("updated_at").notNull().defaultNow(),
}, t => [
  uniqueIndex("publisher_reader_plans_brand_unique_idx").on(t.brandId),
  index("publisher_reader_plans_publisher_idx").on(t.publisherId),
])

export const publisherContentPrices = pgTable("publisher_content_prices", {
  id:           text("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId:  text("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  brandId:      text("brand_id").references(() => brands.id, { onDelete: "cascade" }),
  urlPattern:   text("url_pattern").notNull(),
  price:        integer("price").notNull(),
  label:        text("label"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
  updatedAt:    timestamp("updated_at").notNull().defaultNow(),
}, t => [
  index("publisher_content_prices_publisher_idx").on(t.publisherId),
])

// ─── Reader transactions (revenue log) ───────────────────────────────────────

export const transactionTypeEnum = pgEnum("transaction_type", ["subscription", "one_time_unlock"])
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "refunded", "failed"])

export const readerTransactions = pgTable("reader_transactions", {
  id:                  text("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId:         text("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  brandId:             text("brand_id").references(() => brands.id, { onDelete: "set null" }),
  domainId:            text("domain_id").references(() => domains.id, { onDelete: "set null" }),
  readerId:            text("reader_id").references(() => readers.id, { onDelete: "set null" }),
  type:                transactionTypeEnum("type").notNull(),
  status:              transactionStatusEnum("status").notNull().default("completed"),
  amount:              integer("amount").notNull(),
  currency:            text("currency").notNull().default("INR"),
  razorpayPaymentId:   text("razorpay_payment_id"),
  razorpayOrderId:     text("razorpay_order_id"),
  razorpaySubscriptionId: text("razorpay_subscription_id"),
  readerEmailHash:     text("reader_email_hash"),
  encryptedReaderEmail:text("encrypted_reader_email"),
  contentUrl:          text("content_url"),
  failureReason:       text("failure_reason"),
  metadata:            jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
  createdAt:           timestamp("created_at").notNull().defaultNow(),
  updatedAt:           timestamp("updated_at").notNull().defaultNow(),
  completedAt:         timestamp("completed_at"),
}, t => [
  index("reader_transactions_publisher_idx").on(t.publisherId),
  index("reader_transactions_created_idx").on(t.createdAt),
  index("reader_transactions_type_idx").on(t.type),
  index("reader_transactions_status_idx").on(t.status),
  index("reader_transactions_payment_idx").on(t.razorpayPaymentId),
  index("reader_transactions_order_idx").on(t.razorpayOrderId),
  index("reader_transactions_subscription_idx").on(t.razorpaySubscriptionId),
  index("reader_transactions_brand_idx").on(t.brandId),
])

// ─── Reader subscriptions ────────────────────────────────────────────────────

export const readerSubscribers = pgTable("reader_subscribers", {
  id:                 text("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId:        text("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  brandId:            text("brand_id").references(() => brands.id, { onDelete: "cascade" }),
  emailHash:          text("email_hash").notNull(),
  encryptedEmail:     text("encrypted_email").notNull(),
  razorpayCustomerId: text("razorpay_customer_id"),
  active:             boolean("active").notNull().default(true),
  createdAt:          timestamp("created_at").notNull().defaultNow(),
  updatedAt:          timestamp("updated_at").notNull().defaultNow(),
}, t => [
  uniqueIndex("reader_subscribers_brand_email_idx").on(t.brandId, t.emailHash),
  index("reader_subscribers_publisher_idx").on(t.publisherId),
  index("reader_subscribers_brand_idx").on(t.brandId),
])

export const readerSubscriptions = pgTable("reader_subscriptions", {
  id:                    text("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId:           text("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  brandId:               text("brand_id").references(() => brands.id, { onDelete: "cascade" }),
  subscriberId:          text("subscriber_id").notNull().references(() => readerSubscribers.id, { onDelete: "cascade" }),
  interval:              text("interval").notNull(),
  status:                text("status").notNull().default("created"),
  pgMode:                pgModeEnum("pg_mode").notNull(),
  razorpaySubscriptionId:text("razorpay_subscription_id"),
  razorpayPlanId:        text("razorpay_plan_id"),
  currentPeriodStart:    timestamp("current_period_start"),
  currentPeriodEnd:      timestamp("current_period_end"),
  cancelledAt:           timestamp("cancelled_at"),
  cancelAtCycleEnd:      boolean("cancel_at_cycle_end").notNull().default(false),
  dunningStartedAt:      timestamp("dunning_started_at"),
  source:                text("source").notNull().default("razorpay"),
  paymentMethod:         text("payment_method"),
  notes:                 text("notes"),
  createdAt:             timestamp("created_at").notNull().defaultNow(),
  updatedAt:             timestamp("updated_at").notNull().defaultNow(),
}, t => [
  uniqueIndex("reader_subscriptions_razorpay_unique_idx").on(t.razorpaySubscriptionId),
  index("reader_subscriptions_publisher_idx").on(t.publisherId),
  index("reader_subscriptions_brand_idx").on(t.brandId),
  index("reader_subscriptions_subscriber_idx").on(t.subscriberId),
  index("reader_subscriptions_status_idx").on(t.status),
])

export const readerSubscriptionLinks = pgTable("reader_subscription_links", {
  id:           text("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId:  text("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  brandId:      text("brand_id").references(() => brands.id, { onDelete: "cascade" }),
  subscriberId: text("subscriber_id").notNull().references(() => readerSubscribers.id, { onDelete: "cascade" }),
  readerId:     text("reader_id").notNull().references(() => readers.id, { onDelete: "cascade" }),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
}, t => [
  uniqueIndex("reader_subscription_links_reader_brand_idx").on(t.readerId, t.brandId),
  index("reader_subscription_links_publisher_idx").on(t.publisherId),
  index("reader_subscription_links_subscriber_idx").on(t.subscriberId),
])

export const readerSubscriptionMagicLinks = pgTable("reader_subscription_magic_links", {
  token:        text("token").primaryKey(),
  publisherId:  text("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  brandId:      text("brand_id").references(() => brands.id, { onDelete: "cascade" }),
  subscriberId: text("subscriber_id").notNull().references(() => readerSubscribers.id, { onDelete: "cascade" }),
  returnUrl:    text("return_url"),
  expiresAt:    timestamp("expires_at").notNull(),
  usedAt:       timestamp("used_at"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
}, t => [
  index("reader_subscription_magic_links_subscriber_idx").on(t.subscriberId),
  index("reader_subscription_magic_links_expires_idx").on(t.expiresAt),
])

// ─── Password reset tokens ────────────────────────────────────────────────────

export const passwordResetTokens = pgTable("password_reset_tokens", {
  token:     text("token").primaryKey(),
  userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt:    timestamp("used_at"),
}, t => [
  index("prt_user_idx").on(t.userId),
])
