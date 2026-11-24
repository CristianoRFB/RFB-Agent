import {useEffect,useMemo,useState,type FormEvent} from "react";
import {onAuthStateChanged,signInWithEmailAndPassword,signOut,type User} from "firebase/auth";
import {addDoc,collection,doc,onSnapshot,query,serverTimestamp,Timestamp,updateDoc,where,type DocumentData} from "firebase/firestore";
import {auth,db,emulatorsEnabled,appEnabled,stagingEnabled,apiBaseUrl} from "./firebase";

type Role="manager"|"attendant"|"customer";
type Member={id:string;role:Role;active:boolean};
type Conversation={id:string;customerUid:string;status:string;createdAt?:Timestamp};
type Message={id:string;senderUid:string;senderRole:string;text:string;source?:{id:string;title:string;version:number}|null;createdAt?:Timestamp};
type Knowledge={id:string;title:string;body:string;published:boolean;version:number};
type Proposal={id:string;customerUid:string;slot:Timestamp;expiresAt:Timestamp;status:string};
type AgentConfig={id:string;companyId:string;language:string;tone:string;mode:string;version:number};
type Audit={id:string;type:string;actorUid:string;sourceId?:string|null;proposalId?:string;createdAt?:Timestamp};
type Tab="inbox"|"knowledge"|"schedule"|"members"|"queue"|"analytics"|"audit"|"settings";
const tabs:Array<{id:Tab;label:string;icon:string}>=[
 {id:"inbox",label:"Conversas",icon:"▤"},{id:"knowledge",label:"Conhecimento",icon:"▦"},
 {id:"schedule",label:"Agendamentos",icon:"▣"},{id:"queue",label:"Fila humana",icon:"☷"},{id:"members",label:"Equipe",icon:"◈"},
 {id:"analytics",label:"Indicadores",icon:"▥"},{id:"audit",label:"Auditoria",icon:"≡"},{id:"settings",label:"Configurações",icon:"⚙"}
];
function format(date?:Timestamp) {return date?.toDate().toLocaleString("pt-BR",{dateStyle:"medium",timeStyle:"short"})??"Agora";}
function messageFrom(error:unknown){return error instanceof Error?error.message:"Erro não identificado";}
function checkedDb(){if(!db)throw new Error("FIRESTORE_EMULATOR_DESATIVADO");return db;}
function checkedAuth(){if(!auth)throw new Error("AUTH_EMULATOR_DESATIVADO");return auth;}
function useItems<T extends {id:string}>(path:string|null,filter?:{field:string;value:string|boolean}) {
 const [items,setItems]=useState<T[]>([]),[error,setError]=useState("");
 useEffect(()=>{
  setItems([]);setError("");
  if(!db||!path)return;
  const ref=collection(checkedDb(),path), q=filter?query(ref,where(filter.field,"==",filter.value)):ref;
  return onSnapshot(q,s=>setItems(s.docs.map(d=>({id:d.id,...d.data()}) as T)),err=>setError(err.message));
 },[path,filter?.field,filter?.value]);
 return {items,error};
}
export default function App(){
 const [user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true);
 const [email,setEmail]=useState(emulatorsEnabled?"cliente@rfbagent.invalid":""),[password,setPassword]=useState(emulatorsEnabled?"SenhaDemo123!":"");
 const [company,setCompany]=useState(emulatorsEnabled?"alpha":import.meta.env.VITE_STAGING_COMPANY_ID??""),[member,setMember]=useState<Member|null>(null);
 const [tab,setTab]=useState<Tab>("inbox"),[selected,setSelected]=useState<string|null>(null);
 const [text,setText]=useState(""),[search,setSearch]=useState(""),[title,setTitle]=useState(""),[body,setBody]=useState(""),[slot,setSlot]=useState(""),[feedback,setFeedback]=useState("");
 const [team,setTeam]=useState<Member[]>([]);
 const [editingKnowledge,setEditingKnowledge]=useState<{id:string;version:number}|null>(null);
 useEffect(()=>{
  if(!auth){setLoading(false);return;}
  return onAuthStateChanged(auth,u=>{setUser(u);setLoading(false);setSelected(null)},e=>{setFeedback(e.message);setLoading(false)});
 },[]);
 useEffect(()=>{
  setMember(null);
  if(!db||!user||!company)return;
  return onSnapshot(doc(checkedDb(),"companies",company,"members",user.uid),s=>{
    const m=s.data() as Omit<Member,"id">|undefined;
    setMember(m?.active&&["customer","attendant","manager"].includes(m.role)?{id:user.uid,...m}:null);
  },e=>setFeedback(e.message));
 },[user,company]);
 const root=db&&user&&member?"companies/"+company:null;
 const conversations=useItems<Conversation>(root?root+"/conversations":null,member?.role==="customer"&&user?{field:"customerUid",value:user.uid}:undefined);
 const knowledge=useItems<Knowledge>(root&&member?.role!=="customer"?root+"/knowledge":null);
 // Customer documents are fetched using a separate boolean filter below; no unscoped customer query.
 const customerKnowledge=useItems<Knowledge>(root&&member?.role==="customer"?root+"/knowledge":null,member?.role==="customer"?{field:"published",value:true}:undefined);
 const conv=conversations.items.find(x=>x.id===selected)??conversations.items[0], cid=selected??conv?.id;
 const customerScope=member?.role==="customer"&&user?{field:"customerUid",value:user.uid}:undefined;
 const messages=useItems<Message>(root&&cid?root+"/conversations/"+cid+"/messages":null,customerScope);
 const proposals=useItems<Proposal>(root&&cid?root+"/conversations/"+cid+"/proposals":null,customerScope);
 const bookings=useItems<{id:string;status:string}>(root&&cid?root+"/conversations/"+cid+"/bookings":null,customerScope);
 const staff=member?.role==="manager"||member?.role==="attendant";
 const configs=useItems<AgentConfig>(root&&staff?root+"/agentConfig":null);
 const audits=useItems<Audit>(root&&staff&&cid?root+"/conversations/"+cid+"/audit":null);
 const docs=member?.role==="customer"?customerKnowledge.items:knowledge.items;
 const shownDocs=useMemo(()=>docs.filter(x=>(x.title+" "+x.body).toLowerCase().includes(search.toLowerCase())),[docs,search]);
 useEffect(()=>{
  setTeam([]);
  if(!db||!root||member?.role!=="manager")return;
  return onSnapshot(collection(checkedDb(),root+"/members"),s=>setTeam(s.docs.map(d=>({id:d.id,...d.data()}) as Member)),e=>setFeedback(e.message));
 },[root,member?.role]);
 async function run(task:()=>Promise<unknown>,ok:string){
  try{await task();setFeedback(ok);}catch(e){setFeedback("Operação recusada: "+messageFrom(e));}
 }
 async function login(e:FormEvent){e.preventDefault();if(auth)await run(()=>signInWithEmailAndPassword(checkedAuth(),email,password),"Conta de teste autenticada.");}
 async function createConversation(){if(db&&root&&user)await run(async()=>{const created=await addDoc(collection(checkedDb(),root+"/conversations"),{companyId:company,customerUid:user.uid,status:"open",createdAt:serverTimestamp(),updatedAt:serverTimestamp()});setSelected(created.id);},"Nova conversa criada no emulador.");}
 async function send(e:FormEvent){
  e.preventDefault();if(!db||!root||!cid||!user||!text.trim())return;
  const value=text.trim();
  await run(()=>addDoc(collection(checkedDb(),root+"/conversations/"+cid+"/messages"),{customerUid:conv?.customerUid??user.uid,senderUid:user.uid,senderRole:staff?"staff":"customer",text:value,createdAt:serverTimestamp()}),"Mensagem persistida sem acionar IA.");
  setText("");
 }
 async function saveKnowledge(e:FormEvent){
  e.preventDefault();if(!db||!root||!title.trim()||!body.trim())return;
  try{
   if(editingKnowledge){
    await updateDoc(doc(checkedDb(),root+"/knowledge/"+editingKnowledge.id),{
     title:title.trim(),body:body.trim(),version:editingKnowledge.version+1,updatedAt:serverTimestamp()
    });
    setFeedback("Nova versão publicada no emulador. Se houver conflito, recarregue e revise a última versão.");
   }else{
    await addDoc(collection(checkedDb(),root+"/knowledge"),{
     companyId:company,title:title.trim(),body:body.trim(),published:true,version:1,updatedAt:serverTimestamp()
    });
    setFeedback("Fonte versionada criada com sucesso.");
   }
   setTitle("");setBody("");setEditingKnowledge(null);
  }catch(error){setFeedback("Não foi possível salvar (possível conflito ou ausência de permissão): "+messageFrom(error));}
 }
 function beginKnowledgeEdit(k:Knowledge){
  setEditingKnowledge({id:k.id,version:k.version});setTitle(k.title);setBody(k.body);
 }
 function abandonKnowledgeEdit(){setEditingKnowledge(null);setTitle("");setBody("");}
 async function propose(e:FormEvent){
  e.preventDefault();if(!db||!root||!cid||!user||!slot)return;
  const date=new Date(slot);
  if(!Number.isFinite(date.getTime())){setFeedback("Data inválida.");return;}
  await run(()=>addDoc(collection(checkedDb(),root+"/conversations/"+cid+"/proposals"),{customerUid:user.uid,slot:Timestamp.fromDate(date),expiresAt:Timestamp.fromDate(new Date(Date.now()+15*60000)),status:"pending",createdAt:serverTimestamp()}),"Proposta pendente criada. Nenhuma reserva efetuada.");
 }
 async function gatewayAction(path:string,proposalId:string){
  if(!user||!cid)return;
  await run(async()=>{
    const token=await user.getIdToken();
    const response=await fetch(apiBaseUrl+path,{
      method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
      body:JSON.stringify({companyId:company,conversationId:cid,proposalId,accepted:path.startsWith("/api/bookings/")})
    });
    const payload=await response.json() as {error?:string;status?:string;replayed?:boolean};
    if(!response.ok)throw new Error(payload.error??"GATEWAY_INDISPONIVEL");
  },"Operação transacional concluída no ambiente autorizado de homologação.");
 }
 async function answerWithSource(){
  if(!user||!cid)return;
  const last=[...messages.items].filter(m=>m.senderRole==="customer")
    .sort((a,b)=>(a.createdAt?.toMillis()??0)-(b.createdAt?.toMillis()??0)).at(-1);
  if(!last){setFeedback("Nenhuma pergunta de cliente disponível.");return;}
  await run(async()=>{
    const token=await user.getIdToken();
    const response=await fetch(apiBaseUrl+"/api/knowledge/respond",{
      method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
      body:JSON.stringify({companyId:company,conversationId:cid,question:last.text})
    });
    const payload=await response.json() as {error?:string;mode?:string};
    if(!response.ok)throw new Error(payload.error??"FALHA_LEXICAL");
  },"Resposta por busca lexical registrada com fonte. Nenhum modelo de IA foi utilizado.");
 }
 async function requestHuman(){
  if(!user||!cid)return;
  await run(async()=>{
    const token=await user.getIdToken();
    const response=await fetch(apiBaseUrl+"/api/conversations/handoff",{
      method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
      body:JSON.stringify({companyId:company,conversationId:cid})
    });
    const result=await response.json() as {error?:string;notified?:boolean};
    if(!response.ok)throw new Error(result.error??"TRANSFERENCIA_INDISPONIVEL");
  },"Transferência humana registrada no ambiente de teste. Nenhum atendente externo foi notificado.");
 }
 async function resolveHuman(id:string){
  if(!user||!staff)return;
  await run(async()=>{
   const token=await user.getIdToken();
   const response=await fetch(apiBaseUrl+"/api/conversations/resolve",{
    method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
    body:JSON.stringify({companyId:company,conversationId:id})
   });
   const payload=await response.json() as {error?:string};
   if(!response.ok)throw new Error(payload.error??"RESOLUCAO_RECUSADA");
  },"Atendimento resolvido e auditado no ambiente de teste.");
 }
 if(!appEnabled)return <main className="blocked"><h1>RFBAgent — acesso protegido</h1><p>Aplicação bloqueada: é necessário configurar explicitamente um ambiente de homologação isolado. Nenhuma integração de produção foi autorizada.</p></main>;
 if(loading)return <p className="loading">Carregando Firebase Emulator...</p>;
 if(!user)return <main className="auth"><section className="login"><div className="logo"><span>R</span><b>RFBAgent</b></div><small>HOMOLOGAÇÃO LOCAL</small><h1>Entrar no workspace</h1><p>{emulatorsEnabled?"Use contas sintéticas do Auth Emulator.":"Use apenas contas autorizadas do projeto Firebase de homologação. Nunca autentique com conta de produção."}</p><form onSubmit={login}><label>E-mail<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Senha<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="primary">Entrar</button></form>{feedback&&<p role="alert">{feedback}</p>}</section></main>;
 if(!member)return <main className="blocked"><h1>Sem permissão nesta empresa</h1><p>O usuário autenticado não tem associação ativa ao tenant informado. Papéis não podem ser criados pelo navegador.</p><label>Empresa<input value={company} onChange={e=>setCompany(e.target.value)}/></label><button onClick={()=>auth&&signOut(auth)}>Sair</button>{feedback&&<p>{feedback}</p>}</main>;
 return <div className="app"><aside className="sidebar"><div className="logo"><span>R</span><b>RFB<em>Agent</em></b></div><small>WORKSPACE · {emulatorsEnabled?"EMULADOR":"HOMOLOGAÇÃO"}</small><div className="tenant">EMPRESA<span>{company} · {member.role}</span></div><p className="nav-heading">NAVEGAÇÃO</p><nav aria-label="Módulos">{tabs.map(t=><button key={t.id} type="button" className={tab===t.id?"active":""} onClick={()=>setTab(t.id)}><span>{t.icon}</span>{t.label}</button>)}</nav><div className="sidebar-foot">● {emulatorsEnabled?"Firebase Emulator":"Firebase homologação"}<small>Sem produção nem IA paga</small></div></aside>
 <main className="main"><header className="top"><div><small>ATENDIMENTO / {tab.toUpperCase()}</small><h1>{tabs.find(t=>t.id===tab)?.label}</h1><p>Fluxos autorizados, fontes verificáveis e ações sob permissão.</p></div><button className="secondary" onClick={()=>auth&&signOut(auth)}>Sair</button></header>
 <div className="banner"><strong>{stagingEnabled?"Homologação remota restrita:":"Emuladores locais:"}</strong> {stagingEnabled?"acesso à API condicionado às configurações seguras do Worker, sem produção nem conta real.":"nenhum agendamento, aviso externo ou chamada de IA será executado."}</div>
 {feedback&&<div className="feedback" role="status">{feedback}<button onClick={()=>setFeedback("")} aria-label="Fechar aviso">×</button></div>}
 {(conversations.error||knowledge.error||customerKnowledge.error||messages.error||proposals.error||audits.error)&&<p role="alert" className="error">{conversations.error||knowledge.error||customerKnowledge.error||messages.error||proposals.error||audits.error}</p>}
 {tab==="inbox"&&<div className="inbox"><section className="card"><div className="card-head"><h2>Atendimentos</h2><span>{conversations.items.length}</span></div>{member.role==="customer"&&<div className="pad"><button className="primary" onClick={createConversation}>Nova conversa</button></div>}{conversations.items.map(c=><button key={c.id} className={"item "+(c.id===cid?"selected":"")} onClick={()=>setSelected(c.id)}><strong>Conversa {c.id.slice(0,8)}</strong><small>{c.status} · {c.customerUid.slice(0,9)}</small></button>)}{conversations.items.length===0&&<p className="empty">Sem conversas disponíveis.</p>}</section>
 <section className="card chat"><div className="card-head"><h2>Conversa {cid?.slice(0,8)??"—"}</h2>{cid&&<button type="button" className="secondary" onClick={answerWithSource}>Responder com fontes (simulador)</button>}{cid&&<button type="button" className="secondary" onClick={requestHuman}>{staff?"Encaminhar para humano":"Solicitar humano"}</button>}</div><div className="messages" role="log" aria-label="Histórico">{messages.items.sort((a,b)=>(a.createdAt?.toMillis()??0)-(b.createdAt?.toMillis()??0)).map(m=><article className={m.senderUid===user.uid?"bubble own":"bubble"} key={m.id}><strong>{m.senderRole==="staff"?"Atendente":m.senderRole==="simulator"?"RFBAgent · simulador lexical":"Cliente"}</strong><p>{m.text}</p>{m.source&&<small>Fonte: {m.source.title} · v{m.source.version}</small>}<small>{format(m.createdAt)}</small></article>)}{messages.items.length===0&&<p className="empty">Escreva uma mensagem para iniciar. Não existe IA ativa.</p>}</div><form onSubmit={send} className="composer"><label htmlFor="reply">Mensagem</label><div><input id="reply" maxLength={1000} required disabled={!cid} placeholder="Responder ao atendimento" value={text} onChange={e=>setText(e.target.value)}/><button disabled={!cid} className="primary">Enviar</button></div></form></section>
 <section className="card"><div className="card-head"><h2>Contexto e fontes</h2></div><div className="pad"><p className="muted">Busca textual, sem IA generativa. Fontes versionadas.</p><input aria-label="Buscar base" placeholder="Buscar fonte..." value={search} onChange={e=>setSearch(e.target.value)}/>{shownDocs.map(k=><div key={k.id} className="doc"><strong>{k.title}</strong><small>v{k.version}</small><p>{k.body}</p></div>)}</div></section></div>}
 {tab==="knowledge"&&<div className="twocol"><section className="card"><div className="card-head"><h2>Base de conhecimento</h2><span>{shownDocs.length}</span></div><div className="pad"><input aria-label="Pesquisar conhecimento" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Título ou conteúdo"/>{shownDocs.map(k=><div className="doc" key={k.id}><strong>{k.title}</strong><small>v{k.version} · {k.published?"publicado":"restrito"}</small><p>{k.body}</p>{member.role==="manager"&&<div className="actions"><button type="button" className="secondary" onClick={()=>beginKnowledgeEdit(k)}>Editar fonte</button><button type="button" className="secondary" onClick={()=>db&&run(()=>updateDoc(doc(checkedDb(),root!+"/knowledge/"+k.id),{published:!k.published,version:k.version+1,updatedAt:serverTimestamp()}),"Visibilidade versionada.")}>{k.published?"Restringir":"Publicar"}</button></div>}</div>)}</div></section><section className="card"><div className="card-head"><h2>{editingKnowledge?"Editar fonte versionada":"Adicionar fonte"}</h2></div><div className="pad">{member.role==="manager"?<form className="stacked" onSubmit={saveKnowledge}><label>Título<input maxLength={120} required value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Conteúdo<textarea rows={6} maxLength={10000} required value={body} onChange={e=>setBody(e.target.value)}/></label><button className="primary">{editingKnowledge?`Salvar versão ${editingKnowledge.version+1}`:"Salvar versão 1"}</button>{editingKnowledge&&<button type="button" className="secondary" onClick={abandonKnowledgeEdit}>Cancelar edição</button>}</form>:<p className="muted">Somente gestor pode criar e versionar documentos.</p>}</div></section></div>}
 {tab==="schedule"&&<div className="twocol"><section className="card"><div className="card-head"><h2>Propostas pendentes</h2></div><div className="pad">{proposals.items.map(p=><div className="doc" key={p.id}><strong>{format(p.slot)}</strong><small>{p.status}</small><p>Expira em {format(p.expiresAt)} — {p.status==="confirmed"?"RESERVA DE TESTE":"SEM RESERVA"}</p>{member.role==="customer"&&p.status==="confirmed"&&<button type="button" className="secondary" onClick={()=>gatewayAction("/api/bookings/cancel",p.id)}>Cancelar reserva de teste</button>}{member.role==="customer"&&p.status==="pending"&&<div className="actions"><button type="button" className="primary" onClick={()=>gatewayAction("/api/bookings/confirm",p.id)}>Confirmar reserva de teste</button><button type="button" className="secondary" onClick={()=>gatewayAction("/api/proposals/cancel",p.id)}>Cancelar proposta</button></div>}</div>)}{member.role==="customer"&&cid&&<form onSubmit={propose} className="stacked"><label>Horário solicitado<input type="datetime-local" required value={slot} onChange={e=>setSlot(e.target.value)}/></label><button className="primary">Enviar proposta</button></form>}</div></section><section className="card"><div className="card-head"><h2>Confirmação</h2></div><div className="pad"><p>O gateway autorizado de teste garante um agendamento por intervalo de 30 minutos e empresa. Confirmar e cancelar exigem ação explícita, Firebase Auth, posse da conversa, transação e auditoria. As Firestore Rules negam gravação direta da reserva.</p><p>Reservas confirmadas nesta conversa: <strong>{bookings.items.filter(b=>b.status==="confirmed").length}</strong> (sem agenda externa).</p><button className="secondary" disabled>Confirmar reserva real — indisponível</button></div></section></div>}
 {tab==="queue"&&<section className="card"><div className="card-head"><h2>Fila de atendimentos humanos</h2><span>{conversations.items.filter(c=>c.status==="human").length}</span></div><div className="pad">{staff?<>{conversations.items.filter(c=>c.status==="human").length===0&&<p className="empty">Nenhum atendimento aguardando resolução humana.</p>}{conversations.items.filter(c=>c.status==="human").map(c=><article className="doc" key={c.id}><strong>Conversa {c.id.slice(0,10)}</strong><small>com humano</small><p>Cliente: {c.customerUid.slice(0,10)} · aguardando atendimento</p><div className="actions"><button type="button" className="secondary" onClick={()=>{setSelected(c.id);setTab("inbox");}}>Abrir atendimento</button><button type="button" className="primary" onClick={()=>resolveHuman(c.id)}>Marcar resolvido</button></div></article>)}</>:<p className="muted">A fila operacional é visível apenas a atendentes e gestores.</p>}</div></section>}
 {tab==="members"&&<section className="card"><div className="card-head"><h2>Equipe e permissões</h2></div><div className="pad">{member.role==="manager"?team.map(m=><div className="member" key={m.id}><span>{m.id}</span><b>{m.role}</b><small>{m.active?"ativo":"inativo"}</small></div>):<p className="muted">A lista de colaboradores é restrita a gestores.</p>}<p className="muted">Papéis só são atribuídos por administrador autorizado fora do navegador.</p></div></section>}
 {tab==="analytics"&&<div className="metrics"><div><small>Conversas permitidas</small><strong>{conversations.items.length}</strong></div><div><small>Mensagens na conversa</small><strong>{messages.items.length}</strong></div><div><small>Documentos visíveis</small><strong>{shownDocs.length}</strong></div><div><small>Propostas registradas</small><strong>{proposals.items.length}</strong></div><div><small>Aguardando humano</small><strong>{conversations.items.filter(c=>c.status==="human").length}</strong></div><div><small>Resolvidas</small><strong>{conversations.items.filter(c=>c.status==="resolved").length}</strong></div></div>}
 {tab==="audit"&&<section className="card"><div className="card-head"><h2>Eventos e trilha de auditoria (Emulator)</h2><span>{audits.items.length}</span></div><div className="pad">{staff?<><p className="muted">Eventos criados pelo gateway autorizado e limitados à conversa selecionada. Sem garantia de retenção de produção.</p>{audits.items.length===0?<p className="empty">Nenhum evento de gateway nesta conversa. Confirme uma proposta de teste ou consulte uma fonte.</p>:[...audits.items].sort((a,b)=>(b.createdAt?.toMillis()??0)-(a.createdAt?.toMillis()??0)).map(a=><article key={a.id} className="doc"><strong>{a.type.replaceAll("_"," ")}</strong><small>{format(a.createdAt)}</small><p>Ator: {a.actorUid} · Referência: {a.proposalId??a.sourceId??"sem referência"}</p></article>)}</>:<p className="muted">Auditoria restrita aos atendentes e gestores. A leitura é negada no banco para clientes.</p>}</div></section>}
 {tab==="settings"&&<section className="card"><div className="card-head"><h2>Contexto seguro</h2></div><div className="pad"><p>Autenticação: {user.uid}</p><p>Empresa atual: {company}</p><p>Papel validado: {member.role}</p><label>Trocar empresa<input value={company} onChange={e=>setCompany(e.target.value.trim())}/></label><p className="muted">Trocar empresa não concede permissões: as regras validam o vínculo do usuário em todas as consultas.</p>{staff&&<div className="doc"><strong>Configuração versionada do simulador</strong>{configs.items.map(config=><div key={config.id}><p>Idioma: {config.language} · tom: {config.tone} · v{config.version}</p><p className="muted">Modo {config.mode} — não há geração de IA conectada.</p>{member.role==="manager"&&<div className="actions"><button type="button" className="secondary" onClick={()=>db&&run(()=>updateDoc(doc(checkedDb(),root!+"/agentConfig/"+config.id),{tone:config.tone==="formal"?"neutro":"formal",version:config.version+1,updatedAt:serverTimestamp()}),"Configuração versionada.")}>Alternar neutro/formal</button><button type="button" className="secondary" onClick={()=>db&&run(()=>updateDoc(doc(checkedDb(),root!+"/agentConfig/"+config.id),{language:config.language==="pt-BR"?"en-US":"pt-BR",version:config.version+1,updatedAt:serverTimestamp()}),"Idioma planejado alterado.")}>Alternar idioma de planejamento</button></div>}</div>)}</div>}</div></section>}
 <footer>RFBAgent · {stagingEnabled?"Homologação restrita":"Emulador local"} <span>Sem dados de produção nem IA paga</span></footer>
 </main></div>;
}
