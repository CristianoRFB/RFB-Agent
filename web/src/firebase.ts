import {initializeApp, getApps} from "firebase/app";
import {getAuth,connectAuthEmulator} from "firebase/auth";
import {getFirestore,connectFirestoreEmulator} from "firebase/firestore";

// Neither build mode opens a production backend by default. VITE_* client
// Firebase config values are public identifiers, NEVER service-account secrets.
export const emulatorsEnabled = ["localhost","127.0.0.1"].includes(window.location.hostname)
  && import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";
const config={
 apiKey:import.meta.env.VITE_FIREBASE_API_KEY as string|undefined,
 authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string|undefined,
 projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID as string|undefined,
 appId:import.meta.env.VITE_FIREBASE_APP_ID as string|undefined
};
export const stagingEnabled = !emulatorsEnabled
 && import.meta.env.VITE_ENABLE_STAGING==="true"
 && window.location.protocol==="https:"
 && typeof config.projectId==="string"&&config.projectId.length>4
 && config.projectId!=="demo-rfbagent"
 && !!config.apiKey&&!!config.authDomain&&!!config.appId;
export const appEnabled=emulatorsEnabled||stagingEnabled;
export const apiBaseUrl=emulatorsEnabled?"http://127.0.0.1:8787":window.location.origin;
const settings=emulatorsEnabled?
 {apiKey:"demo-key",authDomain:"demo-rfbagent.firebaseapp.com",projectId:"demo-rfbagent"}:config;
const app=appEnabled?
 (getApps().find(x=>x.name==="rfbagent-secure")??initializeApp(settings,"rfbagent-secure")):null;
export const auth=app?getAuth(app):null;
export const db=app?getFirestore(app):null;
if(emulatorsEnabled){
 if(auth) connectAuthEmulator(auth,"http://127.0.0.1:9099",{disableWarnings:true});
 if(db) connectFirestoreEmulator(db,"127.0.0.1",8080);
}
