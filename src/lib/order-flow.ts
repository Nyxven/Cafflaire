// Order progress steps. Plain TypeScript (no React) so both server pages and client components can use it.
export type Fulfilment = "pickup" | "delivery";

export function flowFor(fulfilment: Fulfilment): string[] {
  return fulfilment === "delivery"
    ? ["pending", "preparing", "out_for_delivery", "completed"]
    : ["pending", "preparing", "ready", "completed"];
}

export const STATUS_LABEL: Record<string, string> = {
  pending: "Received",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "On the way",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const STATUS_HINT: Record<string, string> = {
  pending: "We got your order and will start on it soon.",
  preparing: "Your drinks are being made right now.",
  ready: "Your order is ready for pickup!",
  out_for_delivery: "Your order is on its way to you.",
  completed: "All done. Enjoy your coffee!",
  cancelled: "This order was cancelled.",
};
