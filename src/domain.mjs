// Motor determinístico de demonstração. Sem auth de produção ou integração externa.
const stop=new Set(["qual","quais","para","quero","como","que","são","com","uma","uns","dos","das","por","sobre","posso","pode","aqui","meu","minha","hoje","vocês","voces","tem","ter","das","nos","nas"]);
const normalize=(value)=>String(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const words=(value)=>[...new Set(normalize(value).split(/[^a-z0-9]+/).filter((w)=>w.length>2&&!stop.has(w)))];
const copy=(x)=>structuredClone(x);
const fail=(code)=>{throw new Error(code)};
const stamp=(now)=>new Date(now).toISOString();
export const ACTOR=Object.freeze({userId:"client-01",tenantId:"tenant-01",role:"cliente"});
export function initial(){
 return {schema:1,next:1,conversations:[{id:"c1",tenantId:"tenant-01",customerId:"client-01",status:"aberto"},{id:"c2",tenantId:"tenant-02",customerId:"client-02",status:"aberto"}],
 documents:[{id:"doc-hours",tenantId:"tenant-01",version:1,title:"Horários de atendimento",text:"Atendemos de segunda a sexta-feira, das 9h às 18h."},{id:"doc-address",tenantId:"tenant-01",version:2,title:"Endereço",text:"Rua Exemplo, 100. Local fictício para demonstração."},{id:"doc-booking",tenantId:"tenant-01",version:1,title:"Agendamento",text:"O horário só é reservado após confirmação explícita do cliente."},{id:"doc-private",tenantId:"tenant-02",version:1,title:"Informação privada",text:"DADO_DE_OUTRA_EMPRESA"}],
 messages:[],proposals:[],bookings:[],audits:[]};
}
export function guard(state,actor,conversationId){
 const conv=state.conversations.find((c)=>c.id===conversationId);
 if(!conv||!actor||conv.tenantId!==actor.tenantId||!["cliente","atendente","gestor"].includes(actor.role))fail("ACESSO_NEGADO");
 if(actor.role==="cliente"&&conv.customerId!==actor.userId)fail("ACESSO_NEGADO");
 return conv;
}
function log(state,actor,conversationId,type,now){
 state.audits.push({id:"a"+state.next++,tenantId:actor.tenantId,conversationId,type,date:stamp(now)});
}
export function scoped(state,actor,conversationId="c1"){
 const conversation=copy(guard(state,actor,conversationId));
 const filter=(arr)=>copy(arr.filter((x)=>x.tenantId===actor.tenantId&&x.conversationId===conversationId));
 return {conversation,documents:copy(state.documents.filter((x)=>x.tenantId===actor.tenantId)),messages:filter(state.messages),proposals:filter(state.proposals),bookings:filter(state.bookings),audits:filter(state.audits)};
}
export function lookup(state,actor,input){
 if(!actor?.tenantId)fail("ACESSO_NEGADO");
 const query=words(input);
 if(!query.length)return null;
 const candidates=state.documents.filter((d)=>d.tenantId===actor.tenantId).map((doc)=>{
  const terms=words(doc.title+" "+doc.text);
  const score=query.reduce((n,w)=>n+(terms.some((t)=>t===w||(w.length>4&&t.startsWith(w)))?1:0),0);
  return {doc,score};
 }).sort((a,b)=>b.score-a.score);
 return candidates[0]?.score>0?copy(candidates[0].doc):null;
}
export function message(state,actor,conversationId,input,now=Date.now()){
 guard(state,actor,conversationId);
 const text=String(input??"").trim();
 if(!text||text.length>500)fail("MENSAGEM_INVALIDA");
 const next=copy(state),source=lookup(next,actor,text);
 next.messages.push({id:"m"+next.next++,conversationId,tenantId:actor.tenantId,by:"cliente",text,date:stamp(now)});
 next.messages.push({id:"m"+next.next++,conversationId,tenantId:actor.tenantId,by:"simulador",text:source?"Conforme a base de conhecimento: "+source.text:"Não encontrei uma informação verificada. Solicite atendimento humano.",source:source?{id:source.id,title:source.title,version:source.version}:null,date:stamp(now)});
 log(next,actor,conversationId,"RESPOSTA_LEXICAL_SEM_ACAO",now);
 return next;
}
export function propose(state,actor,conversationId,slot,now=Date.now()){
 guard(state,actor,conversationId);
 if(actor.role!=="cliente")fail("ACESSO_NEGADO");
 const at=Date.parse(slot);
 if(!Number.isFinite(at)||at<=now||at>now+180*86400000)fail("HORARIO_INVALIDO");
 if(state.proposals.some((p)=>p.conversationId===conversationId&&p.status==="pendente"&&p.expires>now))fail("PROPOSTA_PENDENTE");
 const next=copy(state);
 next.proposals.push({id:"p"+next.next++,conversationId,tenantId:actor.tenantId,customerId:actor.userId,slot:new Date(at).toISOString(),status:"pendente",expires:now+15*60000});
 log(next,actor,conversationId,"PROPOSTA_SEM_RESERVA",now);
 return next;
}
export function confirm(state,actor,conversationId,proposalId,accepted,now=Date.now()){
 guard(state,actor,conversationId);
 if(actor.role!=="cliente")fail("ACESSO_NEGADO");
 const found=state.proposals.find((p)=>p.id===proposalId&&p.conversationId===conversationId&&p.tenantId===actor.tenantId&&p.customerId===actor.userId);
 if(!found)fail("ACESSO_NEGADO");
 if(accepted!==true)fail("CONFIRMACAO_EXPLICITA_OBRIGATORIA");
 if(found.status==="confirmada")return copy(state); // repetição idempotente
 if(found.status!=="pendente"||found.expires<=now)fail("PROPOSTA_INDISPONIVEL");
 const next=copy(state);
 next.proposals.find((p)=>p.id===proposalId).status="confirmada";
 next.bookings.push({id:"b"+next.next++,conversationId,tenantId:actor.tenantId,proposalId,slot:found.slot,mode:"SIMULADO"});
 log(next,actor,conversationId,"RESERVA_SIMULADA_CONFIRMADA",now);
 return next;
}
export function cancel(state,actor,conversationId,proposalId,now=Date.now()){
 guard(state,actor,conversationId);
 if(actor.role!=="cliente")fail("ACESSO_NEGADO");
 const next=copy(state),p=next.proposals.find((x)=>x.id===proposalId&&x.conversationId===conversationId&&x.tenantId===actor.tenantId&&x.customerId===actor.userId);
 if(!p)fail("ACESSO_NEGADO");
 if(p.status==="cancelada")return next;
 if(p.status!=="pendente")fail("PROPOSTA_INDISPONIVEL");
 p.status="cancelada";
 log(next,actor,conversationId,"PROPOSTA_CANCELADA",now);
 return next;
}
export function handoff(state,actor,conversationId,now=Date.now()){
 guard(state,actor,conversationId);
 const next=copy(state),c=next.conversations.find((x)=>x.id===conversationId);
 if(c.status!=="com-humano"){c.status="com-humano";log(next,actor,conversationId,"HUMANO_SOLICITADO_SEM_ENVIO",now);}
 return next;
}
