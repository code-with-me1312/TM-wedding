import { inject, Injectable, signal } from "@angular/core";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDocFromServer } from "firebase/firestore";
import { FirebaseService } from "./firebase.service";
@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly firebase = inject(FirebaseService);
  readonly authorized = signal(false);
  async check(): Promise<boolean> {
    const { auth, db } = this.firebase;
    if (!auth || !db) return false;
    await auth.authStateReady();
    if (!auth.currentUser) {
      this.authorized.set(false);
      return false;
    }
    try {
      const record = await getDocFromServer(
        doc(db, "admins", auth.currentUser.uid),
      );
      const allowed = record.exists() && record.data()["enabled"] === true;
      this.authorized.set(allowed);
      return allowed;
    } catch {
      this.authorized.set(false);
      return false;
    }
  }
  async login(email: string, password: string) {
    if (!this.firebase.auth)
      throw new Error(
        "Add your Firebase configuration to enable administrator sign-in.",
      );
    await signInWithEmailAndPassword(this.firebase.auth, email, password);
    if (!(await this.check())) {
      await this.logout();
      throw new Error("This account is not authorized as an administrator.");
    }
  }
  async logout() {
    if (this.firebase.auth) await signOut(this.firebase.auth);
    this.authorized.set(false);
  }
  async resetPassword(email: string) {
    if (!this.firebase.auth)
      throw new Error("Firebase has not been configured.");
    await sendPasswordResetEmail(this.firebase.auth, email.trim());
  }
}
