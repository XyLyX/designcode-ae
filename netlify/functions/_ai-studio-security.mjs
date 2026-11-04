import { createHash } from "node:crypto";
export const projectUrl="https://zjiemjcilgbxrtqcovkz.supabase.co";
export const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
export async function authorize(req){
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!key||process.env.SUPABASE_URL!==projectUrl)return {error:json({error:"Backend not configured"},503)};
 const token=(req.headers.get("authorization")||"").match(/^Bearer ([^\s]+)$/i)?.[1];
 if(!token)return {error:json({error:"Login required"},401)};
 let res;
 try{res=await fetch(projectUrl+"/auth/v1/user",{headers:{apikey:key,authorization:"Bearer "+token},signal:AbortSignal.timeout(7000)});}
 catch{return {error:json({error:"Authentication unavailable"},503)};}
 if(!res.ok)return {error:json({error:"Invalid login"},401)};
 const user=await res.json();
 if(!/^[0-9a-f-]{36}$/i.test(user.id||"")||!user.email_confirmed_at)return {error:json({error:"Verified email required"},403)};
 return {userId:user.id,key};
}
export async function limit(key,userId,operation,maxPerHour){
 const identity=createHash("sha256").update(operation+":"+userId).digest("hex");
 try{
  const response=await fetch(projectUrl+"/rest/v1/rpc/ai_design_check_rate_limit",{
   method:"POST",headers:{apikey:key,authorization:"Bearer "+key,"content-type":"application/json"},
   body:JSON.stringify({p_identity:identity,p_limit:maxPerHour,p_window_seconds:3600}),signal:AbortSignal.timeout(7000)});
  if(!response.ok)return false;
  return (await response.json())===true;
 }catch{return false;}
}
