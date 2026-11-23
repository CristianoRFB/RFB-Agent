import {test} from "node:test";
import assert from "node:assert/strict";
import {getAccessToken,FirestoreRest,firestoreFields,documentData,StoreError} from "../firestore-rest.mjs";
const E=new TextEncoder();
function base64(bytes){return btoa(String.fromCharCode(...bytes));}
function toBytes(text){return Uint8Array.from(atob(text.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(text.length/4)*4,"=")),c=>c.charCodeAt(0));}
async function credential(){
 const pair=await crypto.subtle.generateKey({name:"RSASSA-PKCS1-v1_5",modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"},true,["sign","verify"]);
 const pem="-----BEGIN PRIVATE KEY-----\n"+base64(new Uint8Array(await crypto.subtle.exportKey("pkcs8",pair.privateKey)))+"\n-----END PRIVATE KEY-----";
 return {pair,env:{FIREBASE_PROJECT_ID:"demo-rfbagent",FIREBASE_SERVICE_EMAIL:"mock@demo-rfbagent.iam.gserviceaccount.com",FIREBASE_SERVICE_PRIVATE_KEY:pem}};
}
test("troca OAuth assina assertion RS256 com escopo datastore",async()=>{
 const {pair,env}=await credential();
 let calls=0;
 const token=await getAccessToken(env,{fetchImpl:async(url,opts)=>{
  calls++;
  assert.equal(url,"https://oauth2.googleapis.com/token");
  const params=new URLSearchParams(opts.body);
  const [head,payload,signature]=params.get("assertion").split(".");
  assert.equal(JSON.parse(new TextDecoder().decode(toBytes(payload))).scope,"https://www.googleapis.com/auth/datastore");
  assert.equal(await crypto.subtle.verify("RSASSA-PKCS1-v1_5",pair.publicKey,toBytes(signature),E.encode(head+"."+payload)),true);
  return Response.json({access_token:"synthetic-access-token",token_type:"Bearer"});
 }});
 assert.equal(token,"synthetic-access-token");assert.equal(calls,1);
});
test("sem segredo ou sem projeto o REST recusa antes de enviar requisição",async()=>{
 await assert.rejects(()=>getAccessToken({FIREBASE_PROJECT_ID:"demo-rfbagent",FIREBASE_SERVICE_EMAIL:"fake@example.com",FIREBASE_SERVICE_PRIVATE_KEY:"x"}),/CREDENCIAL_INDISPONIVEL/);
 assert.throws(()=>new FirestoreRest({FIREBASE_PROJECT_ID:"../../etc"}),/PROJETO_INVALIDO/);
});
test("serialização tipada e transporte de transações Firestore",async()=>{
 const {env}=await credential();
 const history=[];
 const base="projects/demo-rfbagent/databases/(default)/documents";
 const fetchImpl=async(url,options)=>{
  assert.ok(url.startsWith("https://firestore.googleapis.com/v1/"+base));
  assert.equal(options.headers.Authorization,"Bearer synthetic-access-token");
  history.push({url,body:JSON.parse(options.body)});
  if(url.endsWith(":beginTransaction"))return Response.json({transaction:"transaction=mock=="});
  if(url.endsWith(":batchGet")){
   const documents=JSON.parse(options.body).documents;
   assert.equal(documents.length,2);
   return new Response(
    JSON.stringify({found:{name:documents[0],fields:{active:{booleanValue:true},role:{stringValue:"customer"},version:{integerValue:"2"}}}})+"\n"+
    JSON.stringify({missing:documents[1]})+"\n", {headers:{"Content-Type":"application/json"}});
  }
  if(url.endsWith(":commit"))return Response.json({commitTime:"2026-11-23T12:00:00Z",writeResults:[]});
  if(url.endsWith(":rollback"))return Response.json({});
  throw Error("unexpected "+url);
 };
 const store=new FirestoreRest(env,{fetchImpl,accessToken:"synthetic-access-token"});
 const transaction=await store.begin();
 const [owner,lock]=await store.batchGet(["companies/alpha/members/customerA","companies/alpha/slots/slot_1"],transaction);
 assert.deepEqual(owner,{id:"customerA",active:true,role:"customer",version:2});
 assert.equal(lock,null);
 const writes=[
  store.create("companies/alpha/slots/slot_1",{active:true,slot:new Date("2026-11-24T10:00:00Z")}),
  store.patch("companies/alpha/conversations/a/proposals/p1",{status:"confirmed"}),
  store.delete("companies/alpha/slots/slot_2")
 ];
 await store.commit(transaction,writes);
 assert.equal(history.at(-1).body.writes.length,3);
 assert.equal(writes[0].currentDocument.exists,false);
 assert.deepEqual(writes[1].updateMask.fieldPaths,["status"]);
 await store.rollback(transaction);
 assert.equal(history.at(-1).url.endsWith(":rollback"),true);
 assert.equal(writes[0].update.fields.slot.timestampValue,"2026-11-24T10:00:00.000Z");
 assert.throws(()=>store.create("../../secret",{a:true}),/CAMINHO_INVALIDO/);
});
test("limites do Firestore REST falham com erro controlado",async()=>{
 const client=new FirestoreRest({FIREBASE_PROJECT_ID:"demo-rfbagent"},{accessToken:"test",fetchImpl:async()=>Response.json({error:{status:"RESOURCE_EXHAUSTED"}},{status:429})});
 await assert.rejects(()=>client.begin(),e=>e instanceof StoreError&&e.message==="QUOTA_EXCEDIDA"&&e.status===503);
 assert.throws(()=>firestoreFields({arr:[1]}),/TIPO_INVALIDO/);
 assert.equal(documentData({name:"x/abc",fields:{ok:{booleanValue:false}}}).ok,false);
});
