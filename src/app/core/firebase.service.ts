import { Injectable } from "@angular/core";
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { firebaseConfig, useEmulators } from "../config/firebase.config";
@Injectable({ providedIn: "root" })
export class FirebaseService {
  readonly configured = !!firebaseConfig.projectId && !!firebaseConfig.apiKey;
  private readonly app = this.configured ? initializeApp(firebaseConfig) : null;
  readonly auth = this.app ? getAuth(this.app) : null;
  readonly db = this.app ? getFirestore(this.app) : null;
  constructor() {
    if (useEmulators && this.auth && this.db) {
      connectAuthEmulator(this.auth, "http://127.0.0.1:9099", {
        disableWarnings: true,
      });
      connectFirestoreEmulator(this.db, "127.0.0.1", 8080);
    }
  }
}
