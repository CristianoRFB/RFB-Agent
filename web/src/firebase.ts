import {initializeApp, getApps} from "firebase/app";
import {getAuth,connectAuthEmulator} from "firebase/auth";
import {getFirestore,connectFirestoreEmulator} from "firebase/firestore";

export const emulatorsEnabled = ["localhost","127.0.0.1"].includes(window.location.hostname)
  && import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";
const app = emulatorsEnabled
 ? (getApps().find(x=>x.name==="rfbagent-only-emulator") ??
    initializeApp({apiKey:"demo-key",authDomain:"demo-rfbagent.firebaseapp.com",projectId:"demo-rfbagent"},"rfbagent-only-emulator"))
 : null;
export const auth=app?getAuth(app):null;
export const db=app?getFirestore(app):null;
if(auth) connectAuthEmulator(auth,"http://127.0.0.1:9099",{disableWarnings:true});
if(db) connectFirestoreEmulator(db,"127.0.0.1",8080);
