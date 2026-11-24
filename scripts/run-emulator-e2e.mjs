// Isolated E2E harness: Auth+Firestore emulators managed by firebase emulators:exec.
// Starts the trusted local gateway in-process and always shuts it down.
import {spawn} from "node:child_process";
import "../firebase/seed.mjs";
import {startGateway} from "../gateway/server.mjs";

if(process.env.FIRESTORE_EMULATOR_HOST!=="127.0.0.1:8080"
  ||process.env.FIREBASE_AUTH_EMULATOR_HOST!=="127.0.0.1:9099")
  throw new Error("E2E_BLOQUEADO_SEM_EMULADORES");
const server=await startGateway({port:8787});
let exitCode=1;
try{
 exitCode=await new Promise((resolve,reject)=>{
  const child=spawn(process.platform==="win32"?"npx.cmd":"npx",
    ["playwright","test","--config","web/playwright.config.mjs"],
    {stdio:"inherit",env:process.env});
  child.once("error",reject);
  child.once("exit",(code)=>resolve(code??1));
 });
}finally{
 await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
}
process.exitCode=exitCode;
