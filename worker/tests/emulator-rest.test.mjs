// Integration test for edge Firestore REST protocol, run ONLY against local Emulator.
// JWT signature tests are separate. The "owner" token is accepted by emulator only.
import test,{before,after} from "node:test";
import assert from "node:assert/strict";
import {initializeApp,getApps} from "firebase-admin/app";
import {getFirestore,Timestamp} from "firebase-admin/firestore";
import {FirestoreRest} from "../firestore-rest.mjs";
import {confirmBooking,cancelBooking,humanHandoff,sourceResponse} from "../actions.mjs";
if(process.env.FIRESTORE_EMULATOR_HOST!=="127.0.0.1:8080")
 throw new Error("TESTE_INTEGRACAO_REQUER_EMULADOR_FIRESTORE");
const app=getApps()[0]??initializeApp({projectId:"demo-rfbagent"});
const db=getFirestore(app);
let edge;
const appEnv={FIREBASE_PROJECT_ID:"demo-rfbagent"};
const fetchImpl=async (url,options)=>{
 const target=new URL(url);
 if(target.hostname!=="firestore.googleapis.com")throw new Error("NAO_USAR_REDE_EXTERNA");
 target.protocol="http:";
 target.host="127.0.0.1:8080";
 const response=await fetch(target,options);
 if(!response.ok){
   let body;try{body=await response.clone().json()}catch{body={}};
   console.error("EMULATOR_REST_DIAGNOSTIC",JSON.stringify({method:options.method,path:target.pathname.split("/").slice(-1)[0],status:response.status,code:body.error?.status,message:String(body.error?.message??"").slice(0,350)}));
 }
 return response;
};
const fixed=Timestamp.fromMillis(Math.floor((Date.now()+8*86400000)/1800000)*1800000);
let convoA,convoB;
before(async()=>{
 await import("../../firebase/seed.mjs");
 edge=new FirestoreRest(appEnv,{fetchImpl,accessToken:"owner"});
 convoA="edge-rest-customer-a";convoB="edge-rest-customer-b";
 for(const [id,uid] of [[convoA,"customerA"],[convoB,"customerB"]]){
  await db.doc("companies/alpha/conversations/"+id).set({companyId:"alpha",customerUid:uid,status:"open",createdAt:Timestamp.now(),updatedAt:Timestamp.now()});
 }
 await db.doc("companies/alpha/conversations/"+convoA+"/proposals/edge-a").set({
  customerUid:"customerA",slot:fixed,expiresAt:Timestamp.fromMillis(Date.now()+600000),status:"pending",createdAt:Timestamp.now()
 });
 await db.doc("companies/alpha/conversations/"+convoB+"/proposals/edge-b").set({
  customerUid:"customerB",slot:fixed,expiresAt:Timestamp.fromMillis(Date.now()+600000),status:"pending",createdAt:Timestamp.now()
 });
});
test("Firestore REST integra assinatura de transação, reserva exclusiva e cancelamento",async()=>{
 const a={companyId:"alpha",conversationId:convoA,proposalId:"edge-a",accepted:true};
 const b={companyId:"alpha",conversationId:convoB,proposalId:"edge-b",accepted:true};
 const confirmed=await confirmBooking(edge,"customerA",a);
 assert.equal(confirmed.status,"confirmed");
 assert.equal((await confirmBooking(edge,"customerA",a)).replayed,true);
 await assert.rejects(()=>confirmBooking(edge,"customerB",b),/HORARIO_OCUPADO/);
 await assert.rejects(()=>cancelBooking(edge,"customerB",a),/SEM_AUTORIZACAO/);
 const cancelled=await cancelBooking(edge,"customerA",a);
 assert.equal(cancelled.status,"cancelled");
 assert.equal((await cancelBooking(edge,"customerA",a)).replayed,true);
 assert.equal((await confirmBooking(edge,"customerB",b)).status,"confirmed");
 const stored=await db.doc("companies/alpha/conversations/"+convoB+"/bookings/edge-b").get();
 assert.equal(stored.get("mode"),"WORKER_FIRESTORE");
});
test("Firestore REST busca apenas fontes públicas e registra resposta com fonte",async()=>{
 const res=await sourceResponse(edge,"customerA",{companyId:"alpha",conversationId:convoA,question:"Qual é o horário de atendimento?"});
 assert.equal(res.mode,"LEXICAL_SIMULATOR");
 assert.equal(res.source?.id,"hours");
 const messages=await db.collection("companies/alpha/conversations/"+convoA+"/messages").where("senderRole","==","simulator").get();
 assert.equal(messages.size,1);
 assert.equal(messages.docs[0].get("source.version"),1);
 await assert.rejects(()=>sourceResponse(edge,"customerB",{companyId:"alpha",conversationId:convoA,question:"horário"}),/SEM_AUTORIZACAO/);
});
test("Firestore REST faz handoff com trilha sem notificar ninguém",async()=>{
 const res=await humanHandoff(edge,"customerA",{companyId:"alpha",conversationId:convoA});
 assert.equal(res.notified,false);
 assert.equal((await humanHandoff(edge,"customerA",{companyId:"alpha",conversationId:convoA})).replayed,true);
 const audits=await db.collection("companies/alpha/conversations/"+convoA+"/audit").get();
 assert.ok(audits.size>=2);
});
