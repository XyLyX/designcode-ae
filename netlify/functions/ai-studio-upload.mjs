import { authorize, limit as enforceLimit } from "./_ai-studio-security.mjs";
// Internal-only, default-disabled upload scaffold. NOT a public customer endpoint.
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
const json = (data, status = 200) => new Response(JSON.stringify(data), { status,
  headers: { "content-type": "application/json", "cache-control": "no-store" } });
const same = (a, b) => { const x = Buffer.from(a || ""), y = Buffer.from(b || "");
  return x.length === y.length && timingSafeEqual(x, y); };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const max = 10 * 1024 * 1024;
function fileType(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return ["image/jpeg","jpg"];
  if (bytes.length >= 8 && Buffer.from(bytes.subarray(0,8)).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return ["image/png","png"];
  if (bytes.length >= 12 && Buffer.from(bytes.subarray(0,4)).toString() === "RIFF" &&
    Buffer.from(bytes.subarray(8,12)).toString() === "WEBP") return ["image/webp","webp"];
  return null;
}
export default async function handler(request) {
  if (request.method !== "POST") return json({error:"Method not allowed"},405);
  if (process.env.AI_STUDIO_API_ENABLED !== "true" || process.env.AI_STUDIO_UPLOAD_ENABLED !== "true") return json({error:"Not available"},503);
  const key=process.env.AI_STUDIO_PREVIEW_KEY, signing=process.env.AI_STUDIO_SESSION_SIGNING_SECRET;
  const service=process.env.SUPABASE_SERVICE_ROLE_KEY, url=process.env.SUPABASE_URL;
  if (!signing || signing.length<32 || !service ||
    url !== "https://zjiemjcilgbxrtqcovkz.supabase.co") return json({error:"Server not configured"},503);
  if (process.env.AI_STUDIO_REQUIRE_PREVIEW_KEY==="true" && (!key || key.length<32 || !same(request.headers.get("x-ai-studio-preview-key"),key))) return json({error:"Unauthorized"},401);
  const auth=await authorize(request);
  if(auth.error)return auth.error;
  if(!await enforceLimit(auth.key,auth.userId,"ai-studio-upload.mjs",20))return respond({error:"Rate limit exceeded"},429);
  const token=request.headers.get("x-ai-studio-session-token") || "";
  const match=/^([0-9a-f-]{36})\.([0-9]{10})\.([0-9a-f]{64})$/i.exec(token);
  if (!match || !uuid.test(match[1])) return json({error:"Invalid session"},401);
  const [_, sessionId, exp, mac]=match;
  if (Number(exp)<Math.floor(Date.now()/1000) || Number(exp)>Math.floor(Date.now()/1000)+1800) return json({error:"Expired session"},401);
  const expected=createHmac("sha256",signing).update(sessionId+"."+exp).digest("hex");
  if (!same(mac,expected)) return json({error:"Invalid session"},401);
  const length=Number(request.headers.get("content-length")||0);
  if (length>max || length<0) return json({error:"Image too large"},413);
  const suppliedType=(request.headers.get("content-type")||"").split(";")[0].toLowerCase();
  if (!["image/jpeg","image/png","image/webp"].includes(suppliedType)) return json({error:"Unsupported media type"},415);
  let bytes;
  try { bytes=new Uint8Array(await request.arrayBuffer()); } catch { return json({error:"Invalid upload"},400); }
  if (!bytes.length || bytes.length>max) return json({error:"Image too large or empty"},413);
  const detected=fileType(bytes);
  if (!detected || detected[0]!==suppliedType) return json({error:"File signature does not match image type"},415);
  const headers={apikey:service,Authorization:"Bearer "+service};
  try {
    const check=await fetch(url+"/rest/v1/ai_design_sessions?id=eq."+sessionId+"&select=id,owner_user_id,status,consent_processing_at,consent_version",{
      headers,signal:AbortSignal.timeout(8000)});
    if (!check.ok) return json({error:"Unable to verify session"},502);
    const sessions=await check.json();
    if (sessions.length!==1 || sessions[0].owner_user_id!==auth.userId) return json({error:"Session not found"},404);
    // Fail closed: an explicit, persisted consent record is mandatory.
    const session=sessions[0];
    if (!session.consent_processing_at || !session.consent_version) return json({error:"AI processing consent required"},403);
    if (!["draft","uploaded"].includes(session.status)) return json({error:"Session is not accepting images"},409);
    const consentCheck=await fetch(url+"/rest/v1/ai_design_consents?session_id=eq."+sessionId+
      "&consent_type=eq.ai_processing&granted=eq.true&policy_version=eq."+encodeURIComponent(session.consent_version)+"&select=id&limit=1",{
      headers,signal:AbortSignal.timeout(8000)});
    if (!consentCheck.ok || !(await consentCheck.json()).length) return json({error:"AI processing consent required"},403);
    const path=sessionId+"/"+randomUUID()+"."+detected[1];
    const stored=await fetch(url+"/storage/v1/object/ai-design-private/"+path,{
      method:"POST",headers:{...headers,"content-type":detected[0],"x-upsert":"false"},
      body:bytes,signal:AbortSignal.timeout(15000)});
    if (!stored.ok) return json({error:"Storage unavailable"},502);
    const saved=await fetch(url+"/rest/v1/ai_design_photos",{
      method:"POST",headers:{...headers,"content-type":"application/json","prefer":"return=representation"},
      body:JSON.stringify({session_id:sessionId,storage_path:path,content_type:detected[0],byte_size:bytes.length}),
      signal:AbortSignal.timeout(8000)});
    if (!saved.ok) {
      // Best-effort cleanup of orphaned object.
      await fetch(url+"/storage/v1/object/ai-design-private/"+path,{method:"DELETE",headers,signal:AbortSignal.timeout(5000)}).catch(()=>{});
      return json({error:"Unable to register image"},502);
    }
    return json({id:(await saved.json())[0].id,status:"stored"},201);
  } catch { return json({error:"Upload unavailable"},502); }
}
