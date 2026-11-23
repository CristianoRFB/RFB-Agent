// RFBAgent — local-only privileged confirmation gateway for Firebase Emulator.
// NOT deployable on Cloudflare Workers: uses Node HTTP + Admin SDK.
// Production requires a reviewed Worker adapter, trusted identity and billing approval gates.
import {createServer} from "node:http";
import {fileURLToPath} from "node:url";
import {initializeApp,getApps} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore,Timestamp} from "firebase-admin/firestore";

const allowedHosts=new Set(["127.0.0.1:5173","localhost:5173"]);
const idPattern=/^[A-Za-z0-9_-]{1,100}$/;
class HttpError extends Error {
 constructor(code,status){super(code);this.status=status;}
}
function assertEmulators() {
 if(process.env.FIRESTORE_EMULATOR_HOST!=="127.0.0.1:8080" ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST!=="127.0.0.1:9099")
   throw new Error("GATEWAY_BLOQUEADO_SEM_EMULADORES");
}
function dbAndAuth() {
 assertEmulators();
 const app=getApps()[0]??initializeApp({projectId:"demo-rfbagent"});
 return {db:getFirestore(app),auth:getAuth(app)};
}
function validId(value){
 if(typeof value!=="string"||!idPattern.test(value))throw new HttpError("ID_INVALIDO",400);
 return value;
}
async function readBody(req){
 let body="",size=0;
 for await (const chunk of req) {
  size+=chunk.length;
  if(size>4096)throw new HttpError("CORPO_EXCESSIVO",413);
  body+=chunk.toString("utf8");
 }
 try{return JSON.parse(body);}
 catch{throw new HttpError("JSON_INVALIDO",400);}
}
async function identity(req,auth){
 const authorization=req.headers.authorization;
 if(typeof authorization!=="string"||!authorization.startsWith("Bearer "))throw new HttpError("NAO_AUTENTICADO",401);
 try {const decoded=await auth.verifyIdToken(authorization.slice(7));return decoded.uid;}
 catch {throw new HttpError("TOKEN_INVALIDO",401);}
}
async function confirmBooking(db,uid,body){
 if(!body||body.accepted!==true)throw new HttpError("CONFIRMACAO_EXPLICITA_OBRIGATORIA",400);
 const companyId=validId(body.companyId),conversationId=validId(body.conversationId),proposalId=validId(body.proposalId);
 const base="companies/"+companyId;
 const member=db.doc(base+"/members/"+uid);
 const conv=db.doc(base+"/conversations/"+conversationId);
 const proposal=db.doc(base+"/conversations/"+conversationId+"/proposals/"+proposalId);
 const booking=db.doc(base+"/conversations/"+conversationId+"/bookings/"+proposalId);
 const event=db.collection(base+"/conversations/"+conversationId+"/audit").doc();
 return await db.runTransaction(async tx=>{
  const [m,c,p,b]=await Promise.all([tx.get(member),tx.get(conv),tx.get(proposal),tx.get(booking)]);
  if(!m.exists||m.get("active")!==true||m.get("role")!=="customer"||!c.exists||c.get("customerUid")!==uid||c.get("companyId")!==companyId)
   throw new HttpError("SEM_AUTORIZACAO",403);
  if(!p.exists||p.get("customerUid")!==uid)throw new HttpError("PROPOSTA_NAO_AUTORIZADA",403);
  if(b.exists) return {status:"confirmed",bookingId:proposalId,replayed:true};
  if(p.get("status")!=="pending"||!p.get("expiresAt")||p.get("expiresAt").toMillis()<=Date.now()||!p.get("slot")||p.get("slot").toMillis()<=Date.now())
   throw new HttpError("PROPOSTA_INDISPONIVEL",409);
  tx.update(proposal,{status:"confirmed",confirmedAt:Timestamp.now()});
  tx.create(booking,{customerUid:uid,proposalId,slot:p.get("slot"),status:"confirmed",createdAt:Timestamp.now(),mode:"EMULATOR"});
  tx.create(event,{type:"BOOKING_CONFIRMED_EXPLICIT",actorUid:uid,proposalId,createdAt:Timestamp.now()});
  return {status:"confirmed",bookingId:proposalId,replayed:false};
 });
}
async function cancelProposal(db,uid,body) {
 const companyId=validId(body?.companyId),conversationId=validId(body?.conversationId),proposalId=validId(body?.proposalId);
 const base="companies/"+companyId;
 const member=db.doc(base+"/members/"+uid),conv=db.doc(base+"/conversations/"+conversationId),prop=db.doc(base+"/conversations/"+conversationId+"/proposals/"+proposalId);
 const event=db.collection(base+"/conversations/"+conversationId+"/audit").doc();
 return await db.runTransaction(async tx=>{
  const [m,c,p]=await Promise.all([tx.get(member),tx.get(conv),tx.get(prop)]);
  if(!m.exists||m.get("active")!==true||m.get("role")!=="customer"||!c.exists||c.get("customerUid")!==uid||c.get("companyId")!==companyId)
   throw new HttpError("SEM_AUTORIZACAO",403);
  if(!p.exists||p.get("customerUid")!==uid)throw new HttpError("PROPOSTA_NAO_AUTORIZADA",403);
  if(p.get("status")==="cancelled")return {status:"cancelled",replayed:true};
  if(p.get("status")!=="pending")throw new HttpError("PROPOSTA_INDISPONIVEL",409);
  tx.update(prop,{status:"cancelled",cancelledAt:Timestamp.now()});
  tx.create(event,{type:"PROPOSAL_CANCELLED",actorUid:uid,proposalId,createdAt:Timestamp.now()});
  return {status:"cancelled",replayed:false};
 });
}
function searchTokens(input){
 const stop=new Set(["qual","quais","que","como","para","com","uma","onde","posso","tenho","seus","suas","meu","minha","dos","das","os","as","no","na","de","do"]);
 return [...new Set(String(input).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2&&!stop.has(x)))];
}
async function respondFromKnowledge(db,uid,body) {
 const companyId=validId(body?.companyId),conversationId=validId(body?.conversationId);
 const question=typeof body?.question==="string"?body.question.trim():"";
 if(!question||question.length>500)throw new HttpError("PERGUNTA_INVALIDA",400);
 const base="companies/"+companyId;
 const [m,c]=await Promise.all([
  db.doc(base+"/members/"+uid).get(),
  db.doc(base+"/conversations/"+conversationId).get()
 ]);
 if(!m.exists||m.get("active")!==true||!c.exists||c.get("companyId")!==companyId)throw new HttpError("SEM_AUTORIZACAO",403);
 const role=m.get("role");
 if(!["customer","attendant","manager"].includes(role))throw new HttpError("SEM_AUTORIZACAO",403);
 if(role==="customer"&&c.get("customerUid")!==uid)throw new HttpError("SEM_AUTORIZACAO",403);
 // Only customer-public documents are used in automated replies (even when staff requests).
 const snap=await db.collection(base+"/knowledge").where("published","==",true).limit(50).get();
 const tokens=searchTokens(question);
 const ranked=snap.docs.map(d=>{
  const data=d.data(),words=searchTokens(String(data.title)+" "+String(data.body));
  const score=tokens.reduce((n,t)=>n+(words.some(w=>w===t||(t.length>4&&w.startsWith(t)))?1:0),0);
  return {doc:d,score};
 }).sort((a,b)=>b.score-a.score);
 const match=ranked[0]?.score>0?ranked[0].doc:null;
 const source=match?{id:match.id,title:match.get("title"),version:match.get("version")}:null;
 const response=match?"Conforme a base de conhecimento: "+String(match.get("body")).slice(0,800)
  :"Não encontrei um fato verificável na base. Solicite transferência para atendimento humano.";
 const message=db.collection(base+"/conversations/"+conversationId+"/messages").doc();
 const audit=db.collection(base+"/conversations/"+conversationId+"/audit").doc();
 const batch=db.batch();
 batch.create(message,{customerUid:c.get("customerUid"),senderUid:"rfb-simulator",senderRole:"simulator",text:response,source,createdAt:Timestamp.now()});
 batch.create(audit,{type:"LEXICAL_RESPONSE_WITH_PROVENANCE",actorUid:uid,sourceId:source?.id??null,createdAt:Timestamp.now()});
 await batch.commit();
 return {messageId:message.id,source,mode:"LEXICAL_SIMULATOR",booked:false};
}
async function requestHumanHandoff(db,uid,body){
 const companyId=validId(body?.companyId);
 const conversationId=validId(body?.conversationId);
 const base="companies/"+companyId;
 const member=db.doc(base+"/members/"+uid),conversation=db.doc(base+"/conversations/"+conversationId);
 const event=db.collection(base+"/conversations/"+conversationId+"/audit").doc();
 return await db.runTransaction(async tx=>{
  const [m,c]=await Promise.all([tx.get(member),tx.get(conversation)]);
  if(!m.exists||m.get("active")!==true||!c.exists||c.get("companyId")!==companyId)
   throw new HttpError("SEM_AUTORIZACAO",403);
  const role=m.get("role");
  if(!["customer","manager","attendant"].includes(role)
      || (role==="customer"&&c.get("customerUid")!==uid))
   throw new HttpError("SEM_AUTORIZACAO",403);
  if(c.get("status")==="human")return {status:"human",replayed:true,notified:false};
  if(c.get("status")!=="open")throw new HttpError("CONVERSA_INDISPONIVEL",409);
  tx.update(conversation,{status:"human",updatedAt:Timestamp.now()});
  tx.create(event,{type:"HUMAN_HANDOFF_REQUESTED",actorUid:uid,createdAt:Timestamp.now()});
  return {status:"human",replayed:false,notified:false};
 });
}
export function startGateway({port=8787}={}) {
 const {db,auth}=dbAndAuth();
 const server=createServer(async(req,res)=>{
  const origin=req.headers.origin;
  let safeOrigin=null;
  if(typeof origin==="string"){
   try {const parsed=new URL(origin);if(parsed.protocol==="http:"&&allowedHosts.has(parsed.host))safeOrigin=origin;}catch{}
  }
  if(origin&&!safeOrigin){res.writeHead(403,{"Content-Type":"application/json"});res.end('{"error":"ORIGEM_NEGADA"}');return;}
  const headers={"Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin","Access-Control-Allow-Headers":"Authorization, Content-Type","Access-Control-Allow-Methods":"POST, GET, OPTIONS"};
  if(safeOrigin)headers["Access-Control-Allow-Origin"]=safeOrigin;
  const finish=(status,payload)=>{res.writeHead(status,headers);res.end(JSON.stringify(payload));};
  if(req.method==="OPTIONS"){finish(204,{});return;}
  if(req.method==="GET"&&req.url==="/health"){finish(200,{status:"emulator-only",production:false});return;}
  if(req.method!=="POST"||!["/api/bookings/confirm","/api/proposals/cancel","/api/knowledge/respond","/api/conversations/handoff"].includes(req.url)){finish(404,{error:"ROTA_INEXISTENTE"});return;}
  try{
   const uid=await identity(req,auth);
   const body=await readBody(req);
   const result=req.url==="/api/bookings/confirm"?await confirmBooking(db,uid,body):req.url==="/api/proposals/cancel"?await cancelProposal(db,uid,body):req.url==="/api/knowledge/respond"?await respondFromKnowledge(db,uid,body):await requestHumanHandoff(db,uid,body);
   finish(200,result);
  }catch(err){finish(err instanceof HttpError?err.status:500,{error:err instanceof HttpError?err.message:"FALHA_INTERNA"});}
 });
 return new Promise((resolve,reject)=>{
  server.on("error",reject);
  server.listen(port,"127.0.0.1",()=>resolve(server));
 });
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]) {
 await startGateway();
 console.log("RFBAgent gateway local iniciado em 127.0.0.1:8787 — SOMENTE EMULADORES");
}
