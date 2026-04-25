import {
  pgTable,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum    = pgEnum("user_role",    ["superadmin", "publisher"])
export const memberRoleEnum  = pgEnum("member_role",  ["owner", "admin", "member"])
export const planSlugEnum    = pgEnum("plan_slug",    ["trial", "lite", "starter", "growth", "scale"])
export const subStatusEnum   = pgEnum("sub_status",   ["trialing", "active", "past_due", "cancelled"])
export const domainStatusEnum = pgEnum("domain_status", ["active", "paused", "removed"])

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id:           text("id").primaryKey().default(sql`gen_random_uuid()`),
  email:        text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  name:         text("name").notNull(),
  role:         userRoleEnum("role").notNull().default("publisher"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
  updatedAt:    timestamp("updated_at").notNull().defaultNow(),
}, t => [
  uniqueIndex("users_email_idx").on(t.email),
])

// ─── Publishers ───────────────────────────────────────────────────────────────

export const publishers = pgTable("publishers", {
  id:        text("id").primaryKey().default(sql`gen_random_uuid()`),
  name:      text("name").notNull(),
  slug:      text("slug").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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

// ─── Domains ──────────────────────────────────────────────────────────────────

export const domains = pgTable("domains", {
  id:          text("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId: text("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  domain:      text("domain").notNull(),
  status:      domainStatusEnum("status").notNull().default("active"),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
}, t => [
  uniqueIndex("domains_domain_idx").on(t.domain),
  index("domains_publisher_idx").on(t.publisherId),
])

// ─── Plans ────────────────────────────────────────────────────────────────────

export const plans = pgTable("plans", {
  slug:           planSlugEnum("slug").primaryKey(),
  name:           text("name").notNull(),
  priceMonthly:   integer("price_monthly"),           // paise; null = free
  maxDomains:     integer("max_domains"),             // null = unlimited
  maxMauPerDomain: integer("max_mau_per_domain"),     // null = unlimited
  maxGates:       integer("max_gates"),               // null = unlimited
  trialDays:      integer("trial_days").default(0),
  active:         boolean("active").notNull().default(true),
})

// ─── Subscriptions ────────────────────────────────────────────────────────────

export const subscriptions = pgTable("subscriptions", {
  id:                  text("id").primaryKey().default(sql`gen_random_uuid()`),
  publisherId:         text("publisher_id").notNull().references(() => publishers.id, { onDelete: "cascade" }),
  planSlug:            planSlugEnum("plan_slug").notNull(),
  status:              subStatusEnum("status").notNull().default("trialing"),
  razorpaySubId:       text("razorpay_sub_id"),
  currentPeriodStart:  timestamp("current_period_start"),
  currentPeriodEnd:    timestamp("current_period_end"),
  cancelledAt:         timestamp("cancelled_at"),
  createdAt:           timestamp("created_at").notNull().defaultNow(),
  updatedAt:           timestamp("updated_at").notNull().defaultNow(),
}, t => [
  index("subscriptions_publisher_idx").on(t.publisherId),
  index("subscriptions_status_idx").on(t.status),
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
