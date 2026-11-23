import test,{before,after} from "node:test";
import assert from "node:assert/strict";
import {initializeApp,getApps} from "firebase-admin/app";
import {getFirestore,Timestamp} from "firebase-admin/firestore";
import {startGateway} from "../server.mjs";

// The seed script refuses to run unless both emulator hosts are explicitly set.
let server,base,db;
const app=getApps()[0]??initializeApp({projectId:"demo-rfbagent"});

before(async()=>{
 await import("../../firebase/seed.mjs");
 db=getFirestore(app);
 server=await startGateway({port:0});
 const address=server.address();
 assert.ok(address&&typeof address!=="string");
 base="http://127.0.0.1:"+address.port;
});
after(async()=>{if(server)await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));});

async function token(email) {
 const res=await fetch("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key",{
  method:"POST",headers:{"Content-Type":"application/json"},
  body:JSON.stringify({email,password:"SenhaDemo123!",returnSecureToken:true})
 });
 const payload=await res.json();
 assert.equal(res.status,200,JSON.stringify(payload));
 return payload.idToken;
}
async function proposal({id="propx",company="alpha",conversation="conversation-a",customer="customerA",expired=false}={}) {
 const slot=Timestamp.fromMillis(Date.now()+86400000);
 const expiresAt=Timestamp.fromMillis(Date.now()+(expired?-60000:600000));
 const path="companies/"+company+"/conversations/"+conversation+"/proposals/"+id;
 await db.doc(path).set({customerUid:customer,slot,expiresAt,status:"pending",createdAt:Timestamp.now()});
 return id;
}
async function post(path,body,credential,origin) {
 const headers={"Content-Type":"application/json"};
 if(credential)headers.Authorization="Bearer "+credential;
 if(origin)headers.Origin=origin;
 const r=await fetch(base+path,{method:"POST",headers,body:JSON.stringify(body)});
 return {status:r.status,body:await r.json()};
}
const request=(proposalId,accepted=true)=>({companyId:"alpha",conversationId:"conversation-a",proposalId,accepted});
test("health checked only on local gateway",async()=>{
 const r=await fetch(base+"/health");
 assert.equal(r.status,200);assert.equal((await r.json()).production,false);
});
test("reject missing token, explicit no, malicious origin",async()=>{
 await proposal({id:"no-auth"});
 assert.equal((await post("/api/bookings/confirm",request("no-auth"))).status,401);
 const t=await token("cliente@rfbagent.invalid");
 assert.equal((await post("/api/bookings/confirm",request("no-auth",false),t)).status,400);
 assert.equal((await post("/api/bookings/confirm",request("no-auth"),t,"https://attacker.example")).status,403);
});
test("legitimate confirmation transactional, audited and idempotent",async()=>{
 await proposal({id:"valid-prop"});
 const t=await token("cliente@rfbagent.invalid");
 const a=await post("/api/bookings/confirm",request("valid-prop"),t);
 assert.equal(a.status,200);assert.equal(a.body.replayed,false);
 const b=await post("/api/bookings/confirm",request("valid-prop"),t);
 assert.equal(b.status,200);assert.equal(b.body.replayed,true);
 const bdoc=await db.doc("companies/alpha/conversations/conversation-a/bookings/valid-prop").get();
 assert.equal(bdoc.data()?.mode,"EMULATOR");
 const events=await db.collection("companies/alpha/conversations/conversation-a/audit").where("proposalId","==","valid-prop").get();
 assert.equal(events.size,1);
});
test("other customer, other tenant and manager cannot confirm",async()=>{
 await proposal({id:"no-access"});
 const other=await token("cliente2@rfbagent.invalid");
 const manager=await token("gestor@rfbagent.invalid");
 const beta=await token("cliente-b@rfbagent.invalid");
 assert.equal((await post("/api/bookings/confirm",request("no-access"),other)).status,403);
 assert.equal((await post("/api/bookings/confirm",request("no-access"),manager)).status,403);
 assert.equal((await post("/api/bookings/confirm",request("no-access"),beta)).status,403);
});
test("expired proposal cannot become reservation",async()=>{
 await proposal({id:"expired",expired:true});
 const t=await token("cliente@rfbagent.invalid");
 assert.equal((await post("/api/bookings/confirm",request("expired"),t)).status,409);
 const doc=await db.doc("companies/alpha/conversations/conversation-a/bookings/expired").get();
 assert.equal(doc.exists,false);
});
test("cancellation is idempotent; cancelled item cannot be confirmed",async()=>{
 await proposal({id:"cancelled-prop"});
 const t=await token("cliente@rfbagent.invalid");
 const a=await post("/api/proposals/cancel",request("cancelled-prop"),t);
 assert.equal(a.status,200);assert.equal(a.body.replayed,false);
 const b=await post("/api/proposals/cancel",request("cancelled-prop"),t);
 assert.equal(b.status,200);assert.equal(b.body.replayed,true);
 assert.equal((await post("/api/bookings/confirm",request("cancelled-prop"),t)).status,409);
});
