import { inject, Injectable } from "@angular/core";
import {
  collection,
  doc,
  getDocFromServer,
  getDocs,
  runTransaction,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { FirebaseService } from "./firebase.service";
import {
  emptyRsvp,
  generateToken,
  validRsvp,
  validToken,
  type Invitation,
  type Rsvp,
} from "./models";
import { withNetworkDeadline, requireConnection } from "./network";
const millis = (value: unknown): number =>
  value instanceof Timestamp ? value.toMillis() : 0;
@Injectable({ providedIn: "root" })
export class InvitationService {
  private readonly firebase = inject(FirebaseService);
  private get db() {
    if (!this.firebase.db) throw new Error("Firebase has not been configured.");
    return this.firebase.db;
  }
  private decode(token: string, data: DocumentData): Invitation {
    const r = data["rsvp"];
    return {
      token,
      displayName: data["displayName"],
      invitedCount: data["invitedCount"],
      createdAt: millis(data["createdAt"]),
      updatedAt: millis(data["updatedAt"]),
      openedAt: data["openedAt"] ? millis(data["openedAt"]) : null,
      rsvp: { ...r, updatedAt: r.updatedAt ? millis(r.updatedAt) : null },
    };
  }
  async load(token: string): Promise<Invitation | null> {
    if (!validToken(token)) return null;
    const snapshot = await withNetworkDeadline(
      getDocFromServer(doc(this.db, "invitations", token)),
    );
    return snapshot.exists() ? this.decode(token, snapshot.data()) : null;
  }
  async list(): Promise<Invitation[]> {
    const result = await withNetworkDeadline(
      getDocs(collection(this.db, "invitations")),
    );
    return result.docs
      .map((d) => this.decode(d.id, d.data()))
      .sort((a, b) => b.createdAt - a.createdAt);
  }
  async saveRsvp(invitation: Invitation, rsvp: Rsvp): Promise<void> {
    if (!validRsvp(rsvp, invitation.invitedCount))
      throw new Error("Please check your response and guest count.");
    requireConnection();
    await withNetworkDeadline(
      updateDoc(doc(this.db, "invitations", invitation.token), {
        rsvp: { ...rsvp, updatedAt: serverTimestamp() },
        updatedAt: serverTimestamp(),
      }),
    );
  }
  async markOpened(invitation: Invitation): Promise<void> {
    if (invitation.openedAt !== null) return;
    requireConnection();
    await withNetworkDeadline(
      updateDoc(doc(this.db, "invitations", invitation.token), {
        openedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  }
  async create(displayName: string): Promise<string> {
    requireConnection();
    const token = generateToken();
    const ref = doc(this.db, "invitations", token);
    await runTransaction(this.db, async (tx) => {
      if ((await tx.get(ref)).exists())
        throw new Error("Please try creating this invitation again.");
      tx.set(ref, {
        displayName,
        invitedCount: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        openedAt: null,
        rsvp: emptyRsvp(),
      });
    });
    return token;
  }
  async edit(invitation: Invitation, displayName: string) {
    requireConnection();
    await withNetworkDeadline(
      updateDoc(doc(this.db, "invitations", invitation.token), {
        displayName,
        updatedAt: serverTimestamp(),
      }),
    );
  }
  async delete(token: string) {
    requireConnection();
    await withNetworkDeadline(deleteDoc(doc(this.db, "invitations", token)));
  }
}
