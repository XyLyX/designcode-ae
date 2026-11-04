import { authorize, limit as enforceLimit } from "./_ai-studio-security.mjs";
// Private integration-only consent endpoint; disabled until explicitly enabled.
// A preview key is NOT customer authentication. Do not expose to browsers.
import { createHmac, timingSafeEqual } from "node:crypto";
const url="https://zjiemjcilgbxrtqcovkz.supabase.co";
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
const eq=(a,b)=>{const x=Buffer.from(a||""),y=Buffer.from(b||"");return x.length===y.length&&timingSafeEqual(x,y);};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export default async function handler(request){
  if(request.method!=="POST")return respond({error:"Method not allowed"},405);
  if(process.env.AI_STUDIO_API_ENABLED!=="true"||process.env.AI_STUDIO_CONSENT_ENABLED!=="true")return respond({error:"Not available"},503);
  const key=process.env.AI_STUDIO_PREVIEW_KEY,secret=process.env.AI_STUDIO_SESSION_SIGNING_SECRET,
    service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!key||key.length<32||!secret||secret.length<32||!service||process.env.SUPABASE_URL!==url)return respond({error:"Server not configured"},503);
  if(!eq(request.headers.get("x-ai-studio-preview-key"),key))return respond({error:"Unauthorized"},401);
  const token=request.headers.get("x-ai-studio-session-token")||"";
  const m=/^([0-9a-f-]{36})\.([0-9]{10})\.([0-9a-f]{64})$/i.exec(token);
  if(!m||!uuid.test(m[1])||Number(m[2])<Math.floor(Date.now()/1000)||Number(m[2])>Math.floor(Date.now()/1000)+1800||
    !eq(m[3],createHmac("sha256",secret).update(m[1]+"."+m[2]).digest("hex")))return respond({error:"Invalid or expired session"},401);
  const auth=await authorize(request);
  if(auth.error)return auth.error;
  if(!await enforceLimit(auth.key,auth.userId,"ai-studio-consent.mjs",12))return respond({error:"Rate limit exceeded"},429);
  if(!(request.headers.get("content-type")||"").toLowerCase().startsWith("application/json"))return respond({error:"JSON required"},415);
  let body;try{const raw=await request.text();if(Buffer.byteLength(raw,"utf8")>1024)return respond({error:"Too large"},413);body=JSON.parse(raw);}catch{return respond({error:"Invalid JSON"},400);}
  // Version is controlled by the server, not supplied by a caller.
  const version=process.env.AI_STUDIO_CONSENT_VERSION;
  if(!version||!/^v[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(version))return respond({error:"Consent policy not configured"},503);
  if(!body||body.policy_version!==version||body.ai_processing!==true||body.contact!==true||body.marketing!==false)return respond({error:"Explicit consent required"},400);
  const headers={apikey:service,Authorization:"Bearer "+service,"content-type":"application/json"};
  try{
    const check=await fetch(url+"/rest/v1/ai_design_sessions?id=eq."+m[1]+"&select=id,owner_user_id,status,consent_processing_at",{headers,signal:AbortSignal.timeout(8000)});
    if(!check.ok)return respond({error:"Session lookup failed"},502);
    const rows=await check.json();
    if(rows.length!==1||rows[0].owner_user_id!==auth.userId||rows[0].status!=="draft"||rows[0].consent_processing_at)return respond({error:"Session not eligible"},409);
    // This endpoint is deliberately fail-closed: atomic consent persistence is
    // required to prevent partial records from being treated as valid consent.
    const rpc=await fetch(url+"/rest/v1/rpc/ai_design_record_consent",{
      method:"POST",headers,body:JSON.stringify({p_session_id:m[1],p_policy_version:version}),signal:AbortSignal.timeout(8000)});
    if(!rpc.ok)return respond({error:"Consent could not be recorded"},502);
    return respond({status:"recorded",policy_version:version},200);
  }catch{return respond({error:"Backend unavailable"},502);}
}
