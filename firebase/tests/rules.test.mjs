import {readFileSync} from "node:fs";
import test,{before,after,beforeEach} from "node:test";
import {initializeTestEnvironment,assertFails,assertSucceeds} from "@firebase/rules-unit-testing";
import {doc,getDoc,setDoc,updateDoc,collection,addDoc,query,where,getDocs,serverTimestamp,Timestamp} from "firebase/firestore";

let env;
const dbFor=(uid)=>env.authenticatedContext(uid).firestore();
const publicDb=()=>env.unauthenticatedContext().firestore();
const company=(id="alpha")=>doc(dbFor("managerA"),"companies",id);
const member=(co,uid)=>doc(dbFor(uid),"companies",co,"members",uid);
const conv=(uid,companyId="alpha",conversationId="conversation-a")=>doc(dbFor(uid),"companies",companyId,"conversations",conversationId);
const messageRef=(uid,companyId="alpha")=>doc(collection(dbFor(uid),"companies",companyId,"conversations","conversation-a","messages"));
const kb=(uid,companyId="alpha",id="hours")=>doc(dbFor(uid),"companies",companyId,"knowledge",id);
const proposal=(uid,companyId="alpha")=>doc(collection(dbFor(uid),"companies",companyId,"conversations","conversation-a","proposals"));
const booking=(uid,companyId="alpha")=>doc(collection(dbFor(uid),"companies",companyId,"conversations","conversation-a","bookings"));

before(async()=>{
 env=await initializeTestEnvironment({
  projectId:"demo-rfbagent",
  firestore:{host:"127.0.0.1",port:8080,rules:readFileSync("firebase/firestore.rules","utf8")}
 });
});
beforeEach(async()=>{
 await env.clearFirestore();
 await env.withSecurityRulesDisabled(async(ctx)=>{
  const db=ctx.firestore();
  const data=[
   ["companies/alpha",{name:"Empresa Alfa"}],
   ["companies/beta",{name:"Empresa Beta"}],
   ["companies/alpha/members/managerA",{role:"manager",active:true}],
   ["companies/alpha/members/attendantA",{role:"attendant",active:true}],
   ["companies/alpha/members/customerA",{role:"customer",active:true}],
   ["companies/alpha/members/customerB",{role:"customer",active:true}],
   ["companies/alpha/members/disabled",{role:"manager",active:false}],
   ["companies/beta/members/managerB",{role:"manager",active:true}],
   ["companies/beta/members/customerZ",{role:"customer",active:true}],
   ["companies/alpha/conversations/conversation-a",{companyId:"alpha",customerUid:"customerA",status:"open",createdAt:Timestamp.now(),updatedAt:Timestamp.now()}],
   ["companies/beta/conversations/conversation-b",{companyId:"beta",customerUid:"customerZ",status:"open",createdAt:Timestamp.now(),updatedAt:Timestamp.now()}],
   ["companies/alpha/knowledge/hours",{companyId:"alpha",title:"Horários",body:"Segunda a sexta",published:true,version:1,updatedAt:Timestamp.now()}],
   ["companies/alpha/knowledge/internal",{companyId:"alpha",title:"Interno",body:"Não mostrar",published:false,version:1,updatedAt:Timestamp.now()}]
  ];
  for(const [path,payload] of data)await setDoc(doc(db,path),payload);
 });
});
after(async()=>{if(env)await env.cleanup();});

test("anônimo e membro inativo não consultam empresa",async()=>{
 await assertFails(getDoc(doc(publicDb(),"companies/alpha")));
 await assertFails(getDoc(conv("disabled")));
});
test("membro vê seu perfil, não consegue atribuir cargos",async()=>{
 await assertSucceeds(getDoc(member("alpha","customerA")));
 await assertFails(getDoc(doc(dbFor("customerA"),"companies/alpha/members/managerA")));
 await assertFails(setDoc(member("alpha","hacker"),{role:"manager",active:true}));
 await assertFails(updateDoc(member("alpha","customerA"),{role:"manager"}));
});
test("membro de outra empresa e cliente vizinho não veem conversas",async()=>{
 await assertFails(getDoc(conv("customerZ")));
 await assertFails(getDoc(conv("customerB")));
 await assertSucceeds(getDoc(conv("customerA")));
 await assertSucceeds(getDoc(conv("attendantA")));
});
test("cliente pode abrir própria conversa, não se fazer passar por outro",async()=>{
 await assertSucceeds(setDoc(conv("customerB","alpha","new-own"),{companyId:"alpha",customerUid:"customerB",status:"open",createdAt:serverTimestamp(),updatedAt:serverTimestamp()}));
 await assertFails(setDoc(conv("customerB","alpha","new-fake"),{companyId:"alpha",customerUid:"customerA",status:"open",createdAt:serverTimestamp(),updatedAt:serverTimestamp()}));
});
test("mensagem do cliente tem autoria verificada; bloqueia IA falsa e escrita cruzada",async()=>{
 await assertSucceeds(setDoc(messageRef("customerA"),{senderUid:"customerA",senderRole:"customer",text:"Qual o horário?",createdAt:serverTimestamp()}));
 await assertFails(setDoc(messageRef("customerA"),{senderUid:"customerA",senderRole:"agent",text:"IA forjada",createdAt:serverTimestamp()}));
 await assertFails(setDoc(messageRef("customerB"),{senderUid:"customerB",senderRole:"customer",text:"Outra conversa",createdAt:serverTimestamp()}));
 await assertSucceeds(setDoc(messageRef("attendantA"),{senderUid:"attendantA",senderRole:"staff",text:"Atendimento humano",createdAt:serverTimestamp()}));
});
test("conhecimento publicado acessível ao cliente; interno apenas staff",async()=>{
 await assertSucceeds(getDoc(kb("customerA")));
 await assertFails(getDoc(kb("customerA","alpha","internal")));
 await assertSucceeds(getDoc(kb("attendantA","alpha","internal")));
 await assertFails(getDoc(kb("customerZ")));
});
test("gerente versiona base; cliente não edita nem troca empresa",async()=>{
 await assertSucceeds(setDoc(kb("managerA","alpha","created"),{companyId:"alpha",title:"Novo",body:"Conteúdo",published:true,version:1,updatedAt:serverTimestamp()}));
 await assertFails(setDoc(kb("customerA","alpha","hacked"),{companyId:"alpha",title:"Falso",body:"Mudança",published:true,version:1,updatedAt:serverTimestamp()}));
 await assertFails(updateDoc(kb("managerA"),{companyId:"beta",version:2,updatedAt:serverTimestamp()}));
 await assertSucceeds(updateDoc(kb("managerA"),{title:"Horários atualizados",version:2,updatedAt:serverTimestamp()}));
});
test("cliente não altera estado; atendente pode registrar handoff",async()=>{
 await assertFails(updateDoc(conv("customerA"),{status:"resolved",updatedAt:serverTimestamp()}));
 await assertSucceeds(updateDoc(conv("attendantA"),{status:"human",updatedAt:serverTimestamp()}));
 await assertFails(updateDoc(conv("attendantA"),{customerUid:"customerB",updatedAt:serverTimestamp()}));
});
test("proposta pendente permitida, confirmação forjada e reservas bloqueadas",async()=>{
 const slot=Timestamp.fromDate(new Date(Date.now()+86400000));
 const expires=Timestamp.fromDate(new Date(Date.now()+10*60000));
 const p=proposal("customerA");
 await assertSucceeds(setDoc(p,{customerUid:"customerA",slot,expiresAt:expires,status:"pending",createdAt:serverTimestamp()}));
 await assertFails(updateDoc(p,{status:"confirmed"}));
 await assertFails(setDoc(booking("customerA"),{slot,customerUid:"customerA",status:"confirmed"}));
 await assertFails(setDoc(booking("managerA"),{slot,customerUid:"customerA",status:"confirmed"}));
 await assertFails(setDoc(proposal("customerA"),{customerUid:"customerA",slot,expiresAt:expires,status:"confirmed",createdAt:serverTimestamp()}));
});
test("cliente não escreve auditoria e não altera mensagens",async()=>{
 await assertFails(setDoc(doc(dbFor("customerA"),"companies/alpha/conversations/conversation-a/audit/forged"),{event:"approved"}));
 await assertFails(setDoc(doc(dbFor("managerA"),"companies/alpha/conversations/conversation-a/audit/forged"),{event:"approved"}));
 const x=messageRef("customerA");
 await assertSucceeds(setDoc(x,{senderUid:"customerA",senderRole:"customer",text:"Olá",createdAt:serverTimestamp()}));
 await assertFails(updateDoc(x,{text:"forjado"}));
});

test("configuração versionada do simulador é exclusiva do gestor",async()=>{
 const managerDoc=doc(dbFor("managerA"),"companies/alpha/agentConfig/default");
 await assertSucceeds(setDoc(managerDoc,{companyId:"alpha",language:"pt-BR",tone:"neutro",mode:"LEXICAL_SIMULATOR",version:1,updatedAt:serverTimestamp()}));
 await assertSucceeds(updateDoc(managerDoc,{tone:"formal",version:2,updatedAt:serverTimestamp()}));
 await assertFails(updateDoc(managerDoc,{mode:"IA_PAGA",version:3,updatedAt:serverTimestamp()}));
 await assertFails(updateDoc(managerDoc,{companyId:"beta",version:3,updatedAt:serverTimestamp()}));
 const customerDoc=doc(dbFor("customerA"),"companies/alpha/agentConfig/default");
 await assertFails(getDoc(customerDoc));
 await assertFails(updateDoc(customerDoc,{tone:"acolhedor",version:3,updatedAt:serverTimestamp()}));
 const attendantDoc=doc(dbFor("attendantA"),"companies/alpha/agentConfig/default");
 await assertSucceeds(getDoc(attendantDoc));
 await assertFails(updateDoc(attendantDoc,{tone:"acolhedor",version:3,updatedAt:serverTimestamp()}));
});
