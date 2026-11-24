// ONLY for Firebase Local Emulator Suite. No production project is ever contacted.
import {initializeApp,getApps} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore,Timestamp} from "firebase-admin/firestore";

const expectedFirestore="127.0.0.1:8080",expectedAuth="127.0.0.1:9099";
if(process.env.FIRESTORE_EMULATOR_HOST!==expectedFirestore ||
   process.env.FIREBASE_AUTH_EMULATOR_HOST!==expectedAuth) {
  throw new Error("SEED_BLOQUEADO: defina FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 e FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 antes de executar.");
}
const projectId="demo-rfbagent";
const app=getApps()[0]??initializeApp({projectId});
const users=[
 {uid:"managerA",email:"gestor@rfbagent.invalid",role:"manager",company:"alpha"},
 {uid:"attendantA",email:"atendente@rfbagent.invalid",role:"attendant",company:"alpha"},
 {uid:"customerA",email:"cliente@rfbagent.invalid",role:"customer",company:"alpha"},
 {uid:"customerB",email:"cliente2@rfbagent.invalid",role:"customer",company:"alpha"},
 {uid:"managerB",email:"gestor2@rfbagent.invalid",role:"manager",company:"beta"},
 {uid:"customerZ",email:"cliente-b@rfbagent.invalid",role:"customer",company:"beta"}
];
const auth=getAuth(app),db=getFirestore(app);
for(const user of users){
 try{await auth.createUser({uid:user.uid,email:user.email,password:"SenhaDemo123!"});}
 catch(error){if(error?.code!=="auth/uid-already-exists"&&error?.code!=="auth/email-already-exists")throw error;}
}
const batch=db.batch();
batch.set(db.doc("companies/alpha"),{name:"Empresa Alpha (fictícia)",createdAt:Timestamp.now()});
batch.set(db.doc("companies/beta"),{name:"Empresa Beta (fictícia)",createdAt:Timestamp.now()});
for(const user of users)batch.set(db.doc("companies/"+user.company+"/members/"+user.uid),{role:user.role,active:true});
batch.set(db.doc("companies/alpha/knowledge/hours"),{companyId:"alpha",title:"Horário de atendimento",body:"Atendemos de segunda a sexta-feira, das 9h às 18h.",version:1,published:true,updatedAt:Timestamp.now()});
batch.set(db.doc("companies/alpha/knowledge/address"),{companyId:"alpha",title:"Endereço (fictício)",body:"Rua Exemplo, 100. Atendimento somente com agendamento confirmado.",version:1,published:true,updatedAt:Timestamp.now()});
batch.set(db.doc("companies/alpha/knowledge/private"),{companyId:"alpha",title:"Procedimento interno",body:"Exemplo interno para gestor e atendente, não público.",version:1,published:false,updatedAt:Timestamp.now()});
batch.set(db.doc("companies/alpha/agentConfig/default"),{companyId:"alpha",language:"pt-BR",tone:"neutro",mode:"LEXICAL_SIMULATOR",version:1,updatedAt:Timestamp.now()});
batch.set(db.doc("companies/beta/agentConfig/default"),{companyId:"beta",language:"pt-BR",tone:"neutro",mode:"LEXICAL_SIMULATOR",version:1,updatedAt:Timestamp.now()});
batch.set(db.doc("companies/alpha/conversations/conversation-a"),{companyId:"alpha",customerUid:"customerA",status:"open",createdAt:Timestamp.now(),updatedAt:Timestamp.now()});
batch.set(db.doc("companies/alpha/conversations/queue-synthetic"),{companyId:"alpha",customerUid:"customerB",status:"human",createdAt:Timestamp.now(),updatedAt:Timestamp.now()});
batch.set(db.doc("companies/beta/conversations/conversation-b"),{companyId:"beta",customerUid:"customerZ",status:"open",createdAt:Timestamp.now(),updatedAt:Timestamp.now()});
await batch.commit();
console.log("SEED_EMULATOR_OK: 2 empresas, 6 contas sintéticas, 3 documentos, 2 conversas. NENHUM dado real.");
