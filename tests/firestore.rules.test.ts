import { readFileSync } from "node:fs";
import { beforeAll, afterAll, beforeEach, it, expect } from "vitest";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
let env: RulesTestEnvironment;
const token = "a".repeat(64);
const record = () => ({
  displayName: "Ahmed & Sara",
  invitedCount: 2,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  openedAt: null,
  rsvp: { status: "pending", attendingCount: 0, message: "", updatedAt: null },
});
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-tm-wedding",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});
afterAll(async () => {
  await env.cleanup();
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "invitations", token), record());
    await setDoc(doc(context.firestore(), "admins", "host"), { enabled: true });
  });
});
it("allows exact capability gets but denies list and filtered queries", async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(db, "invitations", token)));
  await assertFails(getDocs(collection(db, "invitations")));
  await assertFails(
    getDocs(
      query(
        collection(db, "invitations"),
        where("displayName", "==", "Ahmed & Sara"),
      ),
    ),
  );
  await assertFails(getDoc(doc(db, "invitations", "123")));
});
it("returns no guest information for a missing valid token", async () => {
  const s = await assertSucceeds(
    getDoc(
      doc(
        env.unauthenticatedContext().firestore(),
        "invitations",
        "b".repeat(64),
      ),
    ),
  );
  expect(s.exists()).toBe(false);
});
it("saves and changes RSVP without changing guest fields", async () => {
  const ref = doc(
    env.unauthenticatedContext().firestore(),
    "invitations",
    token,
  );
  for (const [status, count] of [
    ["attending", 2],
    ["declined", 0],
  ])
    await assertSucceeds(
      updateDoc(ref, {
        rsvp: {
          status,
          attendingCount: count,
          message: "Love",
          updatedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      }),
    );
  expect((await getDoc(ref)).data()?.["rsvp"].status).toBe("declined");
  await assertFails(
    updateDoc(ref, { displayName: "Changed", updatedAt: serverTimestamp() }),
  );
  await assertFails(
    updateDoc(ref, { invitedCount: 10, updatedAt: serverTimestamp() }),
  );
  await assertFails(deleteDoc(ref));
});
it("records only the first seal opening using server time", async () => {
  const ref = doc(
    env.unauthenticatedContext().firestore(),
    "invitations",
    token,
  );
  await assertFails(
    updateDoc(ref, {
      openedAt: Timestamp.fromMillis(0),
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    updateDoc(ref, {
      openedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(ref, {
      openedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
});
it("rejects oversized counts, arbitrary fields, messages and client timestamps", async () => {
  const ref = doc(
    env.unauthenticatedContext().firestore(),
    "invitations",
    token,
  );
  const r = {
    status: "attending",
    attendingCount: 1,
    message: "",
    updatedAt: serverTimestamp(),
  };
  for (const delta of [
    { attendingCount: 3 },
    { attendingCount: 1.5 },
    { status: "pending" },
    { message: "x".repeat(1001) },
    { updatedAt: Timestamp.fromMillis(0) },
    { extra: true },
  ])
    await assertFails(
      updateDoc(ref, {
        rsvp: { ...r, ...delta },
        updatedAt: serverTimestamp(),
      }),
    );
});
it("requires an enabled allowlisted admin, not just a signed-in user", async () => {
  await assertFails(
    getDocs(
      collection(
        env.authenticatedContext("stranger").firestore(),
        "invitations",
      ),
    ),
  );
  const db = env.authenticatedContext("host").firestore();
  await assertSucceeds(getDocs(collection(db, "invitations")));
  await assertSucceeds(getDoc(doc(db, "admins", "host")));
  await assertFails(setDoc(doc(db, "admins", "host"), { enabled: true }));
  await assertFails(getDoc(doc(db, "admins", "someone-else")));
});
it("allows admin create edit delete with validation", async () => {
  const db = env.authenticatedContext("host").firestore();
  const ref = doc(db, "invitations", "b".repeat(64));
  await assertSucceeds(
    setDoc(ref, {
      ...record(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    updateDoc(ref, {
      displayName: "Family",
      invitedCount: 4,
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(ref, { invitedCount: 0, updatedAt: serverTimestamp() }),
  );
  await assertSucceeds(deleteDoc(ref));
});
