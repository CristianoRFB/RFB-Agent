// RFBAgent edge entrypoint. Worker Secrets required before staging;
// default fails CLOSED. No deployment, billing, or service credentials included.
import {verifyFirebaseToken,AuthError} from "./firebase-auth.mjs";
import {FirestoreRest,StoreError} from "./firestore-rest.mjs";
import {ActionError,confirmBooking,cancelBooking,cancelProposal,humanHandoff,resolveHandoff,sourceResponse} from "./actions.mjs";

const ACTIONS=new Map([
 ["/api/bookings/confirm",confirmBooking],
 ["/api/bookings/cancel",cancelBooking],
 ["/api/proposals/cancel",cancelProposal],
 ["/api/conversations/handoff",humanHandoff],
 ["/api/conversations/resolve",resolveHandoff],
 ["/api/knowledge/respond",sourceResponse]
]);
const secureHeaders={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff",
  "Referrer-Policy":"no-referrer","X-Frame-Options":"DENY"};
function answer(status,data){return new Response(JSON.stringify(data),{status,headers:secureHeaders});}
async function limitedJSON(request){
 if(!(request.headers.get("Content-Type")??"").toLowerCase().startsWith("application/json"))
  throw new ActionError("CONTENT_TYPE_INVALIDO",415);
 const declared=Number(request.headers.get("Content-Length"));
 if(Number.isFinite(declared)&&declared>4096)throw new ActionError("CORPO_EXCESSIVO",413);
 const reader=request.body?.getReader();
 if(!reader)throw new ActionError("CORPO_INVALIDO");
 const chunks=[];let size=0;
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   size+=value.byteLength;
   if(size>4096)throw new ActionError("CORPO_EXCESSIVO",413);
   chunks.push(value);
  }
 }finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;
 for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 try{return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));}
 catch {throw new ActionError("JSON_INVALIDO");}
}
function checkOrigin(request,url) {
 const origin=request.headers.get("Origin");
 if(!origin)return;
 let normalized;try{normalized=new URL(origin).origin;}catch{throw new ActionError("ORIGEM_NEGADA",403);}
 if(normalized!==url.origin)throw new ActionError("ORIGEM_NEGADA",403);
}
function guardEnv(env){
 if(env.RFB_WORKER_ENABLED!=="true"||env.RFB_API_ENV!=="staging")
  throw new ActionError("API_NAO_AUTORIZADA",503);
 if(!env.FIREBASE_PROJECT_ID||!env.FIREBASE_SERVICE_EMAIL||!env.FIREBASE_SERVICE_PRIVATE_KEY)
  throw new ActionError("INTEGRACAO_INCOMPLETA",503);
}
// Optional HTTP dependency injection for synthetic offline test; no global mutable state.
export function createWorker({fetchImpl=fetch}={}){
 return {async fetch(request,env){
  const url=new URL(request.url);
  if(!url.pathname.startsWith("/api/")){
   if(env?.ASSETS?.fetch)return env.ASSETS.fetch(request);
   return answer(404,{error:"NAO_ENCONTRADO"});
  }
  if(url.pathname==="/api/health"&&request.method==="GET")
   return answer(200,{service:"RFBAgent",ready:false,environment:"restricted",production:false});
  try{
   checkOrigin(request,url);
   if(request.method!=="POST"||!ACTIONS.has(url.pathname))return answer(404,{error:"ROTA_INEXISTENTE"});
   guardEnv(env);
   const body=await limitedJSON(request);
   const identity=await verifyFirebaseToken(request.headers.get("Authorization"),env.FIREBASE_PROJECT_ID,{fetchImpl});
   const store=new FirestoreRest(env,{fetchImpl});
   const result=await ACTIONS.get(url.pathname)(store,identity.uid,body);
   return answer(200,result);
  }catch(error){
   const known=error instanceof ActionError||error instanceof AuthError||error instanceof StoreError;
   // Do not expose Firestore internals, tokens, or sensitive exception messages.
   const status=known?error.status:503;
   return answer(status>=400&&status<=599?status:503,{error:known?error.message:"FALHA_TEMPORARIA"});
  }
 }};
}
export default createWorker();
