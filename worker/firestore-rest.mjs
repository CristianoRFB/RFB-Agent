// Cloud Firestore REST + Google OAuth service-account adapter for edge runtimes.
// NEVER commit service-account JSON. Worker Secrets (when approved) must supply
// FIREBASE_SERVICE_EMAIL, FIREBASE_SERVICE_PRIVATE_KEY and FIREBASE_PROJECT_ID.
// OAuth tokens bypass Firestore Security Rules: authorization belongs to caller.
export class StoreError extends Error {
 constructor(code,status=503,upstreamCode){super(code);this.status=status;this.upstreamCode=upstreamCode;}
}
const enc=new TextEncoder();
const bin2base64url=u8=>btoa(String.fromCharCode(...u8)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");
function parsePEM(input){
 if(typeof input!=="string"||input.length>10000)throw new StoreError("CREDENCIAL_INDISPONIVEL");
 const normalized=input.replace(/\\n/g,"\n");
 const raw=normalized.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s+/g,"");
 if(!/^[A-Za-z0-9+/=]+$/.test(raw)||raw.length<500)throw new StoreError("CREDENCIAL_INDISPONIVEL");
 try{return Uint8Array.from(atob(raw),c=>c.charCodeAt(0));}
 catch{throw new StoreError("CREDENCIAL_INDISPONIVEL");}
}
export async function getAccessToken(env,{fetchImpl=fetch,now=Math.floor(Date.now()/1000)}={}) {
 const email=env.FIREBASE_SERVICE_EMAIL,projectId=env.FIREBASE_PROJECT_ID;
 if(typeof email!=="string"||!email.endsWith(".gserviceaccount.com")||!/^[a-z0-9][a-z0-9-]{2,80}$/.test(projectId??""))
  throw new StoreError("CREDENCIAL_INDISPONIVEL");
 let key;
 try{
  key=await crypto.subtle.importKey("pkcs8",parsePEM(env.FIREBASE_SERVICE_PRIVATE_KEY),{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["sign"]);
 }catch{throw new StoreError("CREDENCIAL_INDISPONIVEL");}
 const input=bin2base64url(enc.encode(JSON.stringify({alg:"RS256",typ:"JWT"})))+"."
  +bin2base64url(enc.encode(JSON.stringify({
   iss:email,scope:"https://www.googleapis.com/auth/datastore",
   aud:"https://oauth2.googleapis.com/token",iat:now,exp:now+3300
  })));
 const sig=new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5",key,enc.encode(input)));
 const assertion=input+"."+bin2base64url(sig);
 let response;
 try{response=await fetchImpl("https://oauth2.googleapis.com/token",{
  method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
  body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion}).toString(),
  signal:AbortSignal.timeout(8000)
 });}catch{throw new StoreError("OAUTH_INDISPONIVEL");}
 if(!response.ok)throw new StoreError("OAUTH_INDISPONIVEL");
 let data;
 try{data=await response.json();}catch{throw new StoreError("OAUTH_INDISPONIVEL");}
 if(typeof data.access_token!=="string"||!data.access_token||data.token_type?.toLowerCase()!=="bearer")
  throw new StoreError("OAUTH_INDISPONIVEL");
 return data.access_token;
}
function validPath(p) {
 if(typeof p!=="string"||!p||p.length>500||p.split("/").some(seg=>!/^[A-Za-z0-9_-]{1,100}$/.test(seg)))
  throw new StoreError("CAMINHO_INVALIDO",400);
 return p;
}
export function firestoreValue(v) {
 if(v===null)return {nullValue:null};
 if(typeof v==="string")return {stringValue:v};
 if(typeof v==="boolean")return {booleanValue:v};
 if(typeof v==="number"&&Number.isFinite(v)&&Number.isInteger(v))return {integerValue:String(v)};
 if(v instanceof Date&&!Number.isNaN(v.getTime()))return {timestampValue:v.toISOString()};
 if(v&&typeof v==="object"&&!Array.isArray(v))return {mapValue:{fields:firestoreFields(v)}};
 throw new StoreError("TIPO_INVALIDO",400);
}
export function firestoreFields(obj) {
 return Object.fromEntries(Object.entries(obj).map(([k,v])=>{
  if(!/^[A-Za-z0-9_]{1,80}$/.test(k))throw new StoreError("CAMPO_INVALIDO",400);
  return [k,firestoreValue(v)];
 }));
}
export function valueFromFirestore(v){
 if("stringValue" in v)return v.stringValue;
 if("booleanValue" in v)return v.booleanValue;
 if("integerValue" in v)return Number(v.integerValue);
 if("timestampValue" in v)return new Date(v.timestampValue);
 if("nullValue" in v)return null;
 if("mapValue" in v)return Object.fromEntries(Object.entries(v.mapValue.fields??{}).map(([k,x])=>[k,valueFromFirestore(x)]));
 throw new StoreError("TIPO_DESCONHECIDO");
}
export function documentData(d){
 if(!d)return null;
 return {id:d.name?.split("/").at(-1),...Object.fromEntries(Object.entries(d.fields??{}).map(([k,v])=>[k,valueFromFirestore(v)]))};
}
export class FirestoreRest {
 constructor(env,{fetchImpl=fetch,accessToken}={}){
  this.fetchImpl=fetchImpl;
  this.projectId=env.FIREBASE_PROJECT_ID;
  if(!/^[a-z0-9][a-z0-9-]{2,80}$/.test(this.projectId??""))throw new StoreError("PROJETO_INVALIDO");
  this.env=env;this.accessToken=accessToken??null;
  this.root="projects/"+this.projectId+"/databases/(default)";
  this.url="https://firestore.googleapis.com/v1/"+this.root+"/documents";
 }
 name(path){return this.root+"/documents/"+validPath(path);}
 async request(method,suffix,body){
  if(!this.accessToken)this.accessToken=await getAccessToken(this.env,{fetchImpl:this.fetchImpl});
  let response;
  try {response=await this.fetchImpl(this.url+suffix,{method,headers:{"Authorization":"Bearer "+this.accessToken,"Content-Type":"application/json"},
    ...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(8000)});}
  catch{throw new StoreError("FIRESTORE_INDISPONIVEL");}
  if(!response.ok){
   let code;try{code=(await response.json()).error?.status}catch{}
   const mapped=response.status===429?"QUOTA_EXCEDIDA":response.status===409?"CONFLITO_CONCORRENTE":"FIRESTORE_INDISPONIVEL";
   throw new StoreError(mapped,response.status===429?503:response.status>=500?503:response.status,code);
  }
  return await response.text();
 }
 async begin(){
  const data=JSON.parse(await this.request("POST",":beginTransaction",{options:{readWrite:{}}}));
  if(typeof data.transaction!=="string")throw new StoreError("TRANSACTION_INVALIDA");
  return data.transaction;
 }
 async batchGet(paths,transaction) {
  if(!Array.isArray(paths)||paths.length<1||paths.length>20)throw new StoreError("LOTE_INVALIDO",400);
  const list=paths.map(p=>this.name(p));
  const output=await this.request("POST",":batchGet",{documents:list,transaction});
  let results;
  try {results=output.trim().startsWith("[")?JSON.parse(output):output.split(/\r?\n/).filter(Boolean).map(l=>JSON.parse(l));}
  catch {throw new StoreError("RESPOSTA_FIRESTORE_INVALIDA");}
  const data=new Map();
  for(const item of results){
   if(item.found)data.set(item.found.name,documentData(item.found));
   if(item.missing)data.set(item.missing,null);
  }
  return paths.map((p,i)=>data.get(list[i])??null);
 }
 async commit(transaction,writes){
  if(!Array.isArray(writes)||writes.length<1||writes.length>20)throw new StoreError("ESCRITAS_INVALIDAS",400);
  return JSON.parse(await this.request("POST",":commit",{transaction,writes}));
 }
 create(path,data){
  return {update:{name:this.name(path),fields:firestoreFields(data)},currentDocument:{exists:false}};
 }
 patch(path,data){
  return {update:{name:this.name(path),fields:firestoreFields(data)},updateMask:{fieldPaths:Object.keys(data)},currentDocument:{exists:true}};
 }
 delete(path){return {delete:this.name(path),currentDocument:{exists:true}};}
}
