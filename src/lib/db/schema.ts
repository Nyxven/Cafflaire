import { bigint, boolean, customType, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { OrderItem } from "../catalog";
import { decrypt, encryptDet, encryptRandom } from "../crypto";

// Transparent encrypted columns: app code sees plain values, the database only ever stores ciphertext.
/** Randomized AES-GCM text (not searchable). */
export const encText = customType<{ data: string; driverData: string }>({
  dataType: () => "text",
  toDriver: (v) => encryptRandom(v),
  fromDriver: (v) => decrypt(v),
});
/** Deterministic AES-GCM text (same input -> same ciphertext, so lookups and UNIQUE still work). */
export const detText = customType<{ data: string; driverData: string }>({
  dataType: () => "text",
  toDriver: (v) => encryptDet(v),
  fromDriver: (v) => decrypt(v),
});
/** Randomized AES-GCM JSON. */
export const encJson = <T>() =>
  customType<{ data: T; driverData: string }>({
    dataType: () => "text",
    toDriver: (v) => encryptRandom(JSON.stringify(v)),
    fromDriver: (v) => JSON.parse(decrypt(v)) as T,
  });

// ---- Better Auth tables (shape matches Better Auth's drizzle adapter) ----
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: encText("name").notNull(),
  email: detText("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: detText("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: encText("ip_address"),
  userAgent: encText("user_agent"),
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
  identifier: detText("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key"),
  count: integer("count"),
  lastRequest: bigint("last_request", { mode: "number" }),
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
  address: encJson<{ line1: string; city: string; notes?: string }>()("address"),
  phone: encText("phone").notNull(),
  notes: encText("notes"),
  items: jsonb("items").$type<OrderItem[]>().notNull(),
  subtotalCents: integer("subtotal_cents").notNull(),
  deliveryFeeCents: integer("delivery_fee_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  paymentMethod: text("payment_method").notNull().default("cash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
