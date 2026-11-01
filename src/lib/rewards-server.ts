import { eq } from "drizzle-orm";
import { db } from "./db";
import { orders } from "./db/schema";
import { Rewards, computeRewards } from "./rewards";
import { getPrefsState } from "./prefs-server";

/**
 * Level, EXP and badges for one person. Counts ALL their orders (including ones they removed from "My orders"),
 * so removing an order never costs EXP. Never throws: on a database hiccup the profile just shows an empty start.
 */
export async function getRewards(userId: string): Promise<Rewards> {
  try {
    const [rows, prefs] = await Promise.all([
      db.select({ status: orders.status, fulfilment: orders.fulfilment, createdAt: orders.createdAt, items: orders.items }).from(orders).where(eq(orders.userId, userId)),
      getPrefsState(userId),
    ]);
    return computeRewards(rows, prefs.status === "completed");
  } catch (err) {
    console.error("[rewards] read failed", err instanceof Error ? err.message : err);
    return computeRewards([], false);
  }
}
