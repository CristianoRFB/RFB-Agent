import {test} from "node:test";
import assert from "node:assert/strict";
import {verifyFirebaseToken,JWKS_URL} from "../firebase-auth.mjs";
const encoder=new TextEncoder();
function b64(bytes){return btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");}
const enc=obj=>b64(encoder.encode(JSON.stringify(obj)));
async function fixture(){
 const keys=await crypto.subtle.generateKey({name:"RSASSA-PKCS1-v1_5",modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"},true,["sign","verify"]);
 const publicKey=await crypto.subtle.exportKey("jwk",keys.publicKey);
 const fetchImpl=async url=>{assert.equal(url,JWKS_URL);return Response.json({keys:[{...publicKey,kid:"key-1",alg:"RS256",use:"sig"}]});};
 const now=Math.floor(Date.now()/1000);
 const claims={iss:"https://securetoken.google.com/demo-rfbagent",aud:"demo-rfbagent",sub:"customerA",iat:now,exp:now+3600,auth_time:now};
 async function sign(payload=claims,header={alg:"RS256",typ:"JWT",kid:"key-1"}){
  const data=enc(header)+"."+enc(payload);
  const sig=await crypto.subtle.sign("RSASSA-PKCS1-v1_5",keys.privateKey,encoder.encode(data));
  return "Bearer "+data+"."+b64(new Uint8Array(sig));
 }
 return {fetchImpl,claims,sign,now};
}
test("valida token Firebase RS256 assinado e aud/iss/sub",async()=>{
 const f=await fixture();
 const user=await verifyFirebaseToken(await f.sign(),"demo-rfbagent",{fetchImpl:f.fetchImpl,now:f.now});
 assert.equal(user.uid,"customerA");
});
test("rejeita JWT forjado, expiração, outro projeto e alg none",async()=>{
 const f=await fixture();
 const sign=await f.sign();
 const corrupted=sign.slice(0,-5)+"AAAAA";
 await assert.rejects(()=>verifyFirebaseToken(corrupted,"demo-rfbagent",{fetchImpl:f.fetchImpl,now:f.now}),/ASSINATURA_INVALIDA|TOKEN_INVALIDO/);
 for(const claim of [{...f.claims,exp:f.now-1},{...f.claims,aud:"beta"},{...f.claims,sub:""},{...f.claims,iss:"https://evil.example"},{...f.claims,iat:f.now+999}]){
  const signed=await f.sign(claim);
  await assert.rejects(()=>verifyFirebaseToken(signed,"demo-rfbagent",{fetchImpl:f.fetchImpl,now:f.now}),/TOKEN_INVALIDO/);
 }
 const noneSigned=await f.sign(f.claims,{kid:"key-1",alg:"none"});
 await assert.rejects(()=>verifyFirebaseToken(noneSigned,"demo-rfbagent",{fetchImpl:f.fetchImpl,now:f.now}),/TOKEN_INVALIDO/);
});
test("falha segura quando JWKS não disponível",async()=>{
 const f=await fixture();
 const signed=await f.sign();
 await assert.rejects(()=>verifyFirebaseToken(signed,"demo-rfbagent",{fetchImpl:async()=>{throw new Error("network")},now:f.now}),/CHAVES_INDISPONIVEIS/);
 await assert.rejects(()=>verifyFirebaseToken("Bearer evil","demo-rfbagent",{fetchImpl:f.fetchImpl,now:f.now}),/TOKEN_INVALIDO/);
});
