// Firebase ID token verification using Web Crypto. Compatible with Workers/Node 24.
// Never trust decoded claims before verifying Google's RS256 signature.
export const JWKS_URL="https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
export class AuthError extends Error {
 constructor(code="NAO_AUTENTICADO",status=401){super(code);this.status=status;}
}
const utf8=new TextDecoder();
export function bytesBase64url(v){
 if(typeof v!=="string"||v.length>10000||!/^[A-Za-z0-9_-]*$/.test(v))throw new AuthError("TOKEN_INVALIDO");
 try {return Uint8Array.from(atob(v.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(v.length/4)*4,"=")),c=>c.charCodeAt(0));}
 catch{throw new AuthError("TOKEN_INVALIDO");}
}
export function parsedPart(part) {
 try{return JSON.parse(utf8.decode(bytesBase64url(part)));}
 catch{throw new AuthError("TOKEN_INVALIDO");}
}
export async function verifyFirebaseToken(header,projectId,{fetchImpl=fetch,now=Math.floor(Date.now()/1000)}={}) {
 if(!/^[a-z0-9][a-z0-9-]{2,80}$/.test(projectId??""))throw new AuthError("PROJETO_INVALIDO",503);
 if(typeof header!=="string"||!header.startsWith("Bearer ")||header.length>6500)throw new AuthError();
 const raw=header.slice(7);
 const parts=raw.split(".");
 if(parts.length!==3||parts.some(p=>!p))throw new AuthError("TOKEN_INVALIDO");
 const [head,payload]=parts.map(parsedPart);
 if(head.alg!=="RS256"||typeof head.kid!=="string"||head.kid.length>150||!head.kid)throw new AuthError("TOKEN_INVALIDO");
 if(payload.aud!==projectId||payload.iss!=="https://securetoken.google.com/"+projectId
    ||typeof payload.sub!=="string"||!payload.sub||payload.sub.length>128
    ||typeof payload.iat!=="number"||typeof payload.exp!=="number"
    ||payload.iat>now+60||payload.exp<=now||payload.exp-payload.iat>3660
    ||(payload.auth_time!==undefined&&(typeof payload.auth_time!=="number"||payload.auth_time>now+60)))
  throw new AuthError("TOKEN_INVALIDO");
 let response;
 try {response=await fetchImpl(JWKS_URL,{signal:AbortSignal.timeout(6000)});}
 catch {throw new AuthError("CHAVES_INDISPONIVEIS",503);}
 if(!response.ok)throw new AuthError("CHAVES_INDISPONIVEIS",503);
 let jwks;
 try{jwks=await response.json();}catch{throw new AuthError("CHAVES_INDISPONIVEIS",503);}
 const jwk=Array.isArray(jwks?.keys)?jwks.keys.find(k=>k.kid===head.kid&&k.kty==="RSA"&&(!k.alg||k.alg==="RS256")&&(!k.use||k.use==="sig")):null;
 if(!jwk)throw new AuthError("CHAVE_NAO_CONFIAVEL");
 let key,valid;
 try{
  key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
  valid=await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,bytesBase64url(parts[2]),new TextEncoder().encode(parts[0]+"."+parts[1]));
 }catch {throw new AuthError("TOKEN_INVALIDO");}
 if(!valid)throw new AuthError("ASSINATURA_INVALIDA");
 return Object.freeze({uid:payload.sub,projectId,authTime:payload.auth_time??payload.iat});
}
