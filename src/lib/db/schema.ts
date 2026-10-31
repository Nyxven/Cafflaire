import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { OrderItem } from "../catalog";

// ---- Better Auth tables (shape matches Better Auth's drizzle adapter) ----
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---- App tables ----
export const ORDER_STATUSES = ["pending", "preparing", "ready", "out_for_delivery", "completed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  number: text("number").notNull().unique(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  status: text("status").$type<OrderStatus>().notNull().default("pending"),
  fulfilment: text("fulfilment").$type<"pickup" | "delivery">().notNull(),
  pickupTime: timestamp("pickup_time"),
  address: jsonb("address").$type<{ line1: string; city: string; notes?: string } | null>(),
  phone: text("phone").notNull(),
  notes: text("notes"),
  items: jsonb("items").$type<OrderItem[]>().notNull(),
  subtotalCents: integer("subtotal_cents").notNull(),
  deliveryFeeCents: integer("delivery_fee_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  paymentMethod: text("payment_method").notNull().default("cash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
