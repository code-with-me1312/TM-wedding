import { describe, it, expect } from "vitest";
import {
  countdown,
  generateToken,
  validToken,
  validRsvp,
  statistics,
  emptyRsvp,
  type Invitation,
} from "../src/app/core/models";
describe("Private invitations", () => {
  it("generates unique 256-bit URL-safe tokens", () => {
    const tokens = Array.from({ length: 100 }, generateToken);
    expect(new Set(tokens).size).toBe(100);
    expect(tokens.every(validToken)).toBe(true);
  });
  it("rejects sequential IDs and malformed links", () => {
    for (const token of ["123", "", "../admin", "a".repeat(63), "A".repeat(64)])
      expect(validToken(token)).toBe(false);
  });
  it("validates RSVP limits and declines", () => {
    const r = {
      status: "attending" as const,
      attendingCount: 2,
      message: "With love",
      updatedAt: 1,
    };
    expect(validRsvp(r, 2)).toBe(true);
    for (const n of [0, 3, 1.5, -1])
      expect(validRsvp({ ...r, attendingCount: n }, 2)).toBe(false);
    expect(validRsvp({ ...r, status: "declined", attendingCount: 0 }, 2)).toBe(
      true,
    );
    expect(validRsvp({ ...r, status: "declined" }, 2)).toBe(false);
    expect(validRsvp({ ...r, message: "x".repeat(1001) }, 2)).toBe(false);
  });
  it("distinguishes confirmed invitations and guests", () => {
    const item = (
      n: number,
      status: "pending" | "attending" | "declined",
      count: number,
    ): Invitation => ({
      token: generateToken(),
      displayName: "Guest",
      invitedCount: n,
      createdAt: 0,
      updatedAt: 0,
      openedAt: status === "pending" ? null : 1,
      rsvp: { ...emptyRsvp(), status, attendingCount: count },
    });
    expect(
      statistics([
        item(4, "attending", 3),
        item(2, "pending", 0),
        item(1, "declined", 0),
      ]),
    ).toEqual({
      total: 3,
      invited: 7,
      confirmed: 1,
      headcount: 3,
      pending: 1,
      declined: 1,
      opened: 2,
    });
  });
});
describe("Egypt wedding countdown", () => {
  const date = "2026-11-27T18:00:00+02:00";
  it("uses 16:00 UTC for 18:00 Egypt local time", () =>
    expect(countdown(date, Date.parse("2026-11-26T14:58:57Z"))).toEqual([
      1, 1, 1, 3,
    ]));
  it("never displays negative time", () =>
    expect(countdown(date, Date.parse("2027-01-01"))).toEqual([0, 0, 0, 0]));
});
