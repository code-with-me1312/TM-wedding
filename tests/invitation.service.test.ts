import { vi, beforeEach, describe, it, expect } from "vitest";
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  update: vi.fn(),
  listen: vi.fn(),
  db: {},
}));
vi.mock("@angular/core", () => ({
  Injectable: () => () => {},
  inject: () => ({ db: mocks.db }),
}));
vi.mock("../src/app/core/firebase.service", () => ({
  FirebaseService: class {},
}));
vi.mock("firebase/firestore", () => ({
  doc: (_db: unknown, collection: string, id: string) => ({ collection, id }),
  getDocFromServer: mocks.get,
  updateDoc: mocks.update,
  serverTimestamp: () => "<server-time>",
  Timestamp: class {},
  collection: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: mocks.listen,
  runTransaction: vi.fn(),
  deleteDoc: vi.fn(),
}));
import { InvitationService } from "../src/app/core/invitation.service";
import { emptyRsvp } from "../src/app/core/models";
beforeEach(() => vi.clearAllMocks());
describe("Invitation loading and RSVP persistence", () => {
  it("rejects malformed tokens before contacting Firestore", async () => {
    expect(await new InvitationService().load("123")).toBeNull();
    expect(mocks.get).not.toHaveBeenCalled();
  });
  it("uses an exact document read and returns missing invitations as null", async () => {
    mocks.get.mockResolvedValue({ exists: () => false });
    expect(await new InvitationService().load("a".repeat(64))).toBeNull();
    expect(mocks.get).toHaveBeenCalledWith({
      collection: "invitations",
      id: "a".repeat(64),
    });
  });
  it("loads the guest and their existing response", async () => {
    mocks.get.mockResolvedValue({
      exists: () => true,
      data: () => ({
        displayName: "Ahmed & Sara",
        invitedCount: 2,
        openedAt: null,
        rsvp: { ...emptyRsvp(), status: "attending", attendingCount: 2 },
      }),
    });
    const result = await new InvitationService().load("a".repeat(64));
    expect(result?.displayName).toBe("Ahmed & Sara");
    expect(result?.rsvp.attendingCount).toBe(2);
  });
  it("propagates network failures so the guest can retry", async () => {
    mocks.get.mockRejectedValue(new Error("offline"));
    await expect(new InvitationService().load("a".repeat(64))).rejects.toThrow(
      "offline",
    );
  });
  it("streams invitation changes and returns the listener cleanup", () => {
    const stop = vi.fn();
    mocks.listen.mockImplementation((_query, onChange) => {
      onChange({
        docs: [
          {
            id: "a".repeat(64),
            data: () => ({
              displayName: "Live guest",
              invitedCount: 1,
              openedAt: null,
              rsvp: emptyRsvp(),
            }),
          },
        ],
      });
      return stop;
    });
    const onChange = vi.fn();
    const unsubscribe = new InvitationService().watch(onChange, vi.fn());
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ displayName: "Live guest" }),
    ]);
    expect(unsubscribe).toBe(stop);
  });
  it("writes only RSVP and a server timestamp", async () => {
    const invitation = {
      token: "a".repeat(64),
      displayName: "Guest",
      invitedCount: 2,
      createdAt: 0,
      updatedAt: 0,
      openedAt: null,
      rsvp: emptyRsvp(),
    };
    const rsvp = {
      ...emptyRsvp(),
      status: "attending" as const,
      attendingCount: 2,
    };
    await new InvitationService().saveRsvp(invitation, rsvp);
    expect(mocks.update).toHaveBeenCalledWith(
      { collection: "invitations", id: invitation.token },
      {
        rsvp: { ...rsvp, updatedAt: "<server-time>" },
        updatedAt: "<server-time>",
      },
    );
    await expect(
      new InvitationService().saveRsvp(invitation, {
        ...rsvp,
        attendingCount: 3,
      }),
    ).rejects.toThrow();
  });
  it("records the first explicit opening with server timestamps", async () => {
    const invitation = {
      token: "a".repeat(64),
      displayName: "Guest",
      invitedCount: 2,
      createdAt: 0,
      updatedAt: 0,
      openedAt: null,
      rsvp: emptyRsvp(),
    };
    await new InvitationService().markOpened(invitation);
    expect(mocks.update).toHaveBeenCalledWith(
      { collection: "invitations", id: invitation.token },
      { openedAt: "<server-time>", updatedAt: "<server-time>" },
    );
    mocks.update.mockClear();
    await new InvitationService().markOpened({ ...invitation, openedAt: 1 });
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
