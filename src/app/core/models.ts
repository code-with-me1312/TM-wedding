export type RsvpStatus = "pending" | "attending" | "declined";
export interface Rsvp {
  status: RsvpStatus;
  attendingCount: number;
  message: string;
  updatedAt: number | null;
}
export interface Invitation {
  token: string;
  displayName: string;
  invitedCount: number;
  createdAt: number;
  updatedAt: number;
  openedAt: number | null;
  rsvp: Rsvp;
}
export const emptyRsvp = (): Rsvp => ({
  status: "pending",
  attendingCount: 0,
  message: "",
  updatedAt: null,
});
export const validToken = (token: string): boolean =>
  /^[a-f0-9]{64}$/.test(token);
export function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
export function validRsvp(rsvp: Rsvp, invited: number): boolean {
  return (
    ["attending", "declined"].includes(rsvp.status) &&
    Number.isInteger(rsvp.attendingCount) &&
    (rsvp.status === "attending"
      ? rsvp.attendingCount >= 1 && rsvp.attendingCount <= invited
      : rsvp.attendingCount === 0) &&
    rsvp.message.length <= 1000
  );
}
export function countdown(date: string, now = Date.now()): number[] {
  const s = Math.max(0, Math.floor((Date.parse(date) - now) / 1000));
  return [
    Math.floor(s / 86400),
    Math.floor(s / 3600) % 24,
    Math.floor(s / 60) % 60,
    s % 60,
  ];
}
export function statistics(items: Invitation[]) {
  return {
    total: items.length,
    invited: items.reduce((n, i) => n + i.invitedCount, 0),
    confirmed: items.filter((i) => i.rsvp.status === "attending").length,
    headcount: items.reduce(
      (n, i) => n + (i.rsvp.status === "attending" ? i.rsvp.attendingCount : 0),
      0,
    ),
    declined: items.filter((i) => i.rsvp.status === "declined").length,
    pending: items.filter((i) => i.rsvp.status === "pending").length,
    opened: items.filter((i) => i.openedAt !== null).length,
  };
}
