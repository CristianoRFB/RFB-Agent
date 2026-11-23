// Pure, injected business actions for Cloudflare Worker edge adapter.
// Firestore REST calls run with IAM, bypass Rules: ALWAYS authorize in every path.
import {StoreError} from "./firestore-rest.mjs";
export class ActionError extends Error {
 constructor(code,status=400){super(code);this.status=status;}
}
const allowed=/^[A-Za-z0-9_-]{1,100}$/;
export function requiredId(value){
 if(typeof value!=="string"||!allowed.test(value))throw new ActionError("ID_INVALIDO");
 return value;
}
export function validateBody(body,allowedKeys){
 if(!body||typeof body!=="object"||Array.isArray(body))throw new ActionError("CORPO_INVALIDO");
 if(Object.keys(body).some(k=>!allowedKeys.includes(k)))throw new ActionError("CAMPO_INESPERADO");
}
export function slotKey(value) {
 const ms=value instanceof Date?value.getTime():NaN;
 if(!Number.isFinite(ms))throw new ActionError("HORARIO_INVALIDO");
 return "slot_"+Math.floor(ms/1800000).toString(36);
}
const paths=(c,v)=>{const base="companies/"+requiredId(c);return {base,conversation:base+"/conversations/"+requiredId(v)};};
function checkScope(member,conversation,companyId,uid,{customerOnly=false}={}){
 if(!member||member.active!==true||!["customer","manager","attendant"].includes(member.role)
    ||!conversation||conversation.companyId!==companyId
    ||(member.role==="customer"&&conversation.customerUid!==uid)
    ||(customerOnly&&(member.role!=="customer"||conversation.customerUid!==uid)))
  throw new ActionError("SEM_AUTORIZACAO",403);
}
function checkProposal(proposal,uid){
 if(!proposal||proposal.customerUid!==uid)throw new ActionError("PROPOSTA_NAO_AUTORIZADA",403);
}
const strId=()=>crypto.randomUUID().replace(/-/g,"");
async function inTransaction(store,work){
 for(let attempt=0;attempt<3;attempt++){
  const tx=await store.begin();
  try{return await work(tx);}
  catch(error){
   if(error instanceof StoreError&&error.message==="CONFLITO_CONCORRENTE"&&attempt<2)continue;
   throw error;
  }
 }
 throw new ActionError("CONFLITO_CONCORRENTE",409);
}
export async function confirmBooking(store,uid,body,now=new Date()){
 validateBody(body,["companyId","conversationId","proposalId","accepted"]);
 if(body.accepted!==true)throw new ActionError("CONFIRMACAO_EXPLICITA_OBRIGATORIA");
 const {base,conversation}=paths(body.companyId,body.conversationId);
 const id=requiredId(body.proposalId),m=base+"/members/"+uid,p=conversation+"/proposals/"+id,b=conversation+"/bookings/"+id;
 return inTransaction(store,async tx=>{
  const [member,conv,proposal,booking]=await store.batchGet([m,conversation,p,b],tx);
  checkScope(member,conv,body.companyId,uid,{customerOnly:true});
  checkProposal(proposal,uid);
  if(booking){
   if(booking.status==="confirmed")return {status:"confirmed",bookingId:id,replayed:true,mode:"WORKER_FIRESTORE"};
   throw new ActionError("RESERVA_CANCELADA",409);
  }
  if(proposal.status!=="pending"||!(proposal.slot instanceof Date)
    ||!(proposal.expiresAt instanceof Date)||proposal.slot<=now||proposal.expiresAt<=now)
   throw new ActionError("PROPOSTA_INDISPONIVEL",409);
  const key=slotKey(proposal.slot),lock=base+"/slots/"+key;
  const [locked]=await store.batchGet([lock],tx);
  if(locked)throw new ActionError("HORARIO_OCUPADO",409);
  await store.commit(tx,[
   store.create(lock,{customerUid:uid,conversationId:body.conversationId,proposalId:id,status:"confirmed",slot:proposal.slot,createdAt:now}),
   store.patch(p,{status:"confirmed",confirmedAt:now}),
   store.create(b,{customerUid:uid,proposalId:id,slot:proposal.slot,slotKey:key,status:"confirmed",createdAt:now,mode:"WORKER_FIRESTORE"}),
   store.create(conversation+"/audit/"+strId(),{type:"BOOKING_CONFIRMED_EXPLICIT",actorUid:uid,proposalId:id,slotKey:key,createdAt:now})
  ]);
  return {status:"confirmed",bookingId:id,replayed:false,mode:"WORKER_FIRESTORE"};
 });
}
export async function cancelBooking(store,uid,body,now=new Date()){
 validateBody(body,["companyId","conversationId","proposalId","accepted"]);
 if(body.accepted!==true)throw new ActionError("CANCELAMENTO_EXPLICITO_OBRIGATORIO");
 const {base,conversation}=paths(body.companyId,body.conversationId);
 const id=requiredId(body.proposalId),p=conversation+"/proposals/"+id,b=conversation+"/bookings/"+id;
 return inTransaction(store,async tx=>{
  const [member,conv,proposal,booking]=await store.batchGet([base+"/members/"+uid,conversation,p,b],tx);
  checkScope(member,conv,body.companyId,uid,{customerOnly:true});
  checkProposal(proposal,uid);
  if(!booking||booking.customerUid!==uid)throw new ActionError("RESERVA_NAO_AUTORIZADA",403);
  if(booking.status==="cancelled")return {status:"cancelled",bookingId:id,replayed:true};
  if(booking.status!=="confirmed")throw new ActionError("RESERVA_INDISPONIVEL",409);
  const key=slotKey(booking.slot),lock=base+"/slots/"+key;
  const [held]=await store.batchGet([lock],tx);
  if(!held||held.proposalId!==id||held.conversationId!==body.conversationId)
   throw new ActionError("CONFLITO_BLOQUEIO_HORARIO",409);
  await store.commit(tx,[
   store.patch(b,{status:"cancelled",cancelledAt:now}),store.patch(p,{status:"cancelled",cancelledAt:now}),
   store.delete(lock),store.create(conversation+"/audit/"+strId(),{type:"BOOKING_CANCELLED_EXPLICIT",actorUid:uid,proposalId:id,createdAt:now})
  ]);
  return {status:"cancelled",bookingId:id,replayed:false};
 });
}
export async function cancelProposal(store,uid,body,now=new Date()){
 validateBody(body,["companyId","conversationId","proposalId","accepted"]);
 const {base,conversation}=paths(body.companyId,body.conversationId);
 const id=requiredId(body.proposalId),p=conversation+"/proposals/"+id;
 return inTransaction(store,async tx=>{
  const [member,conv,proposal]=await store.batchGet([base+"/members/"+uid,conversation,p],tx);
  checkScope(member,conv,body.companyId,uid,{customerOnly:true});
  checkProposal(proposal,uid);
  if(proposal.status==="cancelled")return {status:"cancelled",replayed:true};
  if(proposal.status!=="pending")throw new ActionError("PROPOSTA_INDISPONIVEL",409);
  await store.commit(tx,[
   store.patch(p,{status:"cancelled",cancelledAt:now}),
   store.create(conversation+"/audit/"+strId(),{type:"PROPOSAL_CANCELLED",actorUid:uid,proposalId:id,createdAt:now})
  ]);
  return {status:"cancelled",replayed:false};
 });
}
export async function humanHandoff(store,uid,body,now=new Date()){
 validateBody(body,["companyId","conversationId"]);
 const {base,conversation}=paths(body.companyId,body.conversationId);
 return inTransaction(store,async tx=>{
  const [member,conv]=await store.batchGet([base+"/members/"+uid,conversation],tx);
  checkScope(member,conv,body.companyId,uid);
  if(conv.status==="human")return {status:"human",replayed:true,notified:false};
  if(conv.status!=="open")throw new ActionError("CONVERSA_INDISPONIVEL",409);
  await store.commit(tx,[
   store.patch(conversation,{status:"human",updatedAt:now}),
   store.create(conversation+"/audit/"+strId(),{type:"HUMAN_HANDOFF_REQUESTED",actorUid:uid,createdAt:now})
  ]);
  return {status:"human",replayed:false,notified:false};
 });
}
function normalize(text){
 const stop=new Set(["qual","quais","que","como","para","com","uma","onde","posso","tenho","seus","suas","meu","minha","dos","das","os","as","no","na","de","do"]);
 return [...new Set(text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
  .split(/[^a-z0-9]+/).filter(x=>x.length>2&&!stop.has(x)))];
}
export async function sourceResponse(store,uid,body,now=new Date()){
 validateBody(body,["companyId","conversationId","question"]);
 const {base,conversation}=paths(body.companyId,body.conversationId);
 const question=typeof body.question==="string"?body.question.trim():"";
 if(!question||question.length>500)throw new ActionError("PERGUNTA_INVALIDA");
 return inTransaction(store,async tx=>{
  const [member,conv]=await store.batchGet([base+"/members/"+uid,conversation],tx);
  checkScope(member,conv,body.companyId,uid);
  // Deliberately never retrieve private knowledge, even for staff.
  const docs=await store.publicKnowledge(base,tx,50);
  const terms=normalize(question);
  const ranked=docs.map(d=>{
   const words=normalize(String(d.title)+" "+String(d.body));
   return {doc:d,score:terms.reduce((n,t)=>n+(words.some(w=>w===t||(t.length>4&&w.startsWith(t)))?1:0),0)};
  }).sort((a,b)=>b.score-a.score);
  const best=ranked[0]?.score>0?ranked[0].doc:null;
  const source=best?{id:best.id,title:String(best.title).slice(0,120),version:best.version}:null;
  const response=best?"Conforme a base de conhecimento: "+String(best.body).slice(0,800)
    :"Não encontrei um fato verificável na base. Solicite transferência para atendimento humano.";
  await store.commit(tx,[
   store.create(conversation+"/messages/"+strId(),{customerUid:conv.customerUid,senderUid:"rfb-simulator",senderRole:"simulator",text:response,source,createdAt:now}),
   store.create(conversation+"/audit/"+strId(),{type:"LEXICAL_RESPONSE_WITH_PROVENANCE",actorUid:uid,sourceId:source?.id??null,createdAt:now})
  ]);
  return {source,mode:"LEXICAL_SIMULATOR",booked:false};
 });
}
