import {ACTOR,initial,scoped,message,propose,confirm,cancel,handoff} from "./domain.mjs";
const key="rfbagent-demo-local-v1",actor=ACTOR,conversation="c1";
let state,tab="conversation";
try{const value=JSON.parse(localStorage.getItem(key));state=value?.schema===1&&Array.isArray(value.messages)&&Array.isArray(value.proposals)?value:initial()}catch{state=initial()}
const $=(selector)=>document.querySelector(selector);
const make=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el};
const format=(date)=>new Date(date).toLocaleString("pt-BR",{dateStyle:"medium",timeStyle:"short"});
function button(title,action,cls=""){const b=make("button",title,"action "+cls);b.type="button";b.addEventListener("click",action);return b}
function run(fn,success){
 try{state=fn();localStorage.setItem(key,JSON.stringify(state));$("#feedback").textContent=success;$("#feedback").className="feedback ok";render();return true}
 catch(error){$("#feedback").textContent="Operação recusada: "+(error?.message||"erro");$("#feedback").className="feedback bad";return false}
}
function nextDate(){
 const d=new Date(Date.now()+2*86400000);const pad=(n)=>String(n).padStart(2,"0");
 return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+"T14:00";
}
function renderMessages(data){
 const box=$("#messages");box.replaceChildren();
 if(!data.messages.length){const empty=make("div",undefined,"empty");empty.append(make("span","✳","empty-icon"),make("h3","Uma conversa começa aqui"),make("p","Pergunte sobre horário, endereço ou agendamento. Cada resposta vem da base sintética."));box.append(empty)}
 for(const msg of data.messages){
  const bubble=make("article",undefined,"bubble "+(msg.by==="cliente"?"self":"reply"));
  bubble.append(make("strong",msg.by==="cliente"?"Marina · Cliente de teste":"RFBAgent · Simulador"),make("p",msg.text));
  if(msg.source)bubble.append(make("small","Fonte: "+msg.source.title+" · versão "+msg.source.version,"source"));
  bubble.append(make("time",format(msg.date)));box.append(bubble);
 }
 box.scrollTop=box.scrollHeight;
}
function renderContext(data){
 const area=$("#context");area.replaceChildren();
 $("#context-title").textContent={conversation:"Ações e contexto",knowledge:"Base de conhecimento",bookings:"Agendamentos simulados",audit:"Trilha demonstrativa"}[tab];
 const add=(tag,text,cls)=>{const el=make(tag,text,cls);area.append(el);return el};
 if(tab==="conversation"||tab==="bookings"){
  add("h3","Propor um horário","section-heading");
  add("p","Uma proposta NÃO é uma reserva. Só a confirmação separada registra agendamento simulado.","muted");
  const label=add("label","Horário desejado","field-label");label.htmlFor="slot";
  const field=add("input",undefined,"date-input");field.id="slot";field.type="datetime-local";field.value=nextDate();
  area.append(button("Criar proposta",()=>run(()=>propose(state,actor,conversation,new Date(field.value).toISOString()),"Proposta registrada. Nenhuma reserva criada."),"solid full"));
  const current=[...data.proposals].reverse().find((p)=>p.status==="pendente"&&p.expires>Date.now());
  if(current){
   const p=add("div",undefined,"pending");p.append(make("strong","Confirmação explícita necessária"),make("p",format(current.slot)),make("small","Esta proposta expira após 15 minutos."));
   const row=make("div",undefined,"actions");
   row.append(button("Confirmar",()=>run(()=>confirm(state,actor,conversation,current.id,true),"Agendamento SIMULADO confirmado."),"solid"),button("Cancelar",()=>run(()=>cancel(state,actor,conversation,current.id),"Proposta cancelada.")));
   p.append(row);
  }
  if(data.bookings.length){
   add("h3","Reservas somente locais","section-heading");
   for(const b of data.bookings)add("div",format(b.slot)+" · SIMULADO","record");
  }
  if(tab==="conversation"){
   add("h3","Transferência humana","section-heading");
   add("p","Registra solicitação local, sem envio a atendente real.","muted");
   area.append(button("Solicitar atendimento humano",()=>run(()=>handoff(state,actor,conversation),"Transferência humana solicitada em modo demo."),"full"));
  }
 }
 if(tab==="conversation"||tab==="knowledge"){
  add("h3","Fontes versionadas","section-heading");
  add("p","A resposta usa somente correspondência lexical; não existe IA conectada.","muted");
  for(const doc of data.documents){
   const card=add("div",undefined,"record");card.append(make("strong",doc.title),make("small","v"+doc.version,"version"),make("p",doc.text));
  }
 }
 if(tab==="audit"){
  add("p","Log local e editável: NÃO constitui auditoria de produção.","muted");
  if(!data.audits.length)add("p","Sem eventos no momento.","muted");
  for(const event of [...data.audits].reverse()){const card=add("div",undefined,"record");card.append(make("strong",event.type.replaceAll("_"," ")),make("p",format(event.date)))}
 }
}
function render(){
 const data=scoped(state,actor,conversation);
 renderMessages(data);renderContext(data);
 $("#count").textContent=String(data.bookings.length).padStart(2,"0");
 $("#status").textContent=data.conversation.status==="com-humano"?"Transferência solicitada · demo":"Aberto · conversa fictícia";
 for(const b of document.querySelectorAll("[data-tab]")){b.classList.toggle("active",b.dataset.tab===tab);b.setAttribute("aria-current",b.dataset.tab===tab?"page":"false")}
}
$("#form").addEventListener("submit",(event)=>{event.preventDefault();const f=$("#question");if(run(()=>message(state,actor,conversation,f.value),"Resposta lexical registrada, sem ação externa."))f.value=""});
$("#nav").addEventListener("click",(event)=>{const b=event.target.closest("[data-tab]");if(b){tab=b.dataset.tab;render()}});
$("#reset").addEventListener("click",()=>{state=initial();localStorage.removeItem(key);$("#feedback").textContent="Demonstração reiniciada.";$("#feedback").className="feedback ok";render()});
render();
