import { vi, it, expect, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({
  user: { uid: "host" } as { uid: string } | null,
  get: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  db: {},
  ready: vi.fn(),
}));
vi.mock("@angular/core", () => ({
  Injectable: () => () => {},
  inject: () => ({
    auth: {
      get currentUser() {
        return mocks.user;
      },
      authStateReady: mocks.ready,
    },
    db: mocks.db,
  }),
  signal: (initial: boolean) => {
    let value = initial;
    const fn = () => value;
    fn.set = (next: boolean) => (value = next);
    return fn;
  },
}));
vi.mock("../src/app/core/firebase.service", () => ({
  FirebaseService: class {},
}));
vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: mocks.signIn,
  signOut: mocks.signOut,
}));
vi.mock("firebase/firestore", () => ({
  doc: (_db: unknown, c: string, id: string) => ({ c, id }),
  getDocFromServer: mocks.get,
}));
import { AuthService } from "../src/app/core/auth.service";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = { uid: "host" };
});
it("blocks unauthenticated users", async () => {
  mocks.user = null;
  expect(await new AuthService().check()).toBe(false);
  expect(mocks.get).not.toHaveBeenCalled();
});
it("requires enabled allowlist membership", async () => {
  for (const enabled of [true, false]) {
    mocks.get.mockResolvedValue({
      exists: () => true,
      data: () => ({ enabled }),
    });
    expect(await new AuthService().check()).toBe(enabled);
  }
});
it("fails closed on network failure", async () => {
  mocks.get.mockRejectedValue(new Error("offline"));
  expect(await new AuthService().check()).toBe(false);
});
it("signs unauthorized accounts out", async () => {
  mocks.get.mockResolvedValue({ exists: () => false });
  await expect(
    new AuthService().login("guest@example.test", "test"),
  ).rejects.toThrow("not authorized");
  expect(mocks.signOut).toHaveBeenCalled();
});
