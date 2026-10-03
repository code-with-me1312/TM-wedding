import type { FirebaseOptions } from "firebase/app";
// Firebase web configuration is public, not a service-account credential.
// TM Wedding web app. Analytics is not initialized on private invitation URLs.
export const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyD4vrqolb8exS8LcX7yX2t9Xh5sUphcOjY",
  authDomain: "tm-wedding-95636.firebaseapp.com",
  projectId: "tm-wedding-95636",
  storageBucket: "tm-wedding-95636.firebasestorage.app",
  messagingSenderId: "618840544884",
  appId: "1:618840544884:web:f6cd85b2efca59f7092321",
  measurementId: "G-FM3C495FJB",
};
// Never enable emulators in a deployed production build.
export const useEmulators = false;
