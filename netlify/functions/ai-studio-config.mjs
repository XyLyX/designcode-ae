// Returns only public configuration; never return privileged credentials.
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
export default async function handler(req){
 if(req.method!=="GET")return reply({error:"Method not allowed"},405);
 if(process.env.AI_STUDIO_PUBLIC_ENABLED!=="true")return reply({enabled:false},200);
 const key=process.env.SUPABASE_PUBLISHABLE_KEY,version=process.env.AI_STUDIO_CONSENT_VERSION;
 if(!key||!version||!/^v\d{4}-\d{2}-\d{2}$/.test(version))return reply({enabled:false},200);
 return reply({enabled:true,supabase_url:"https://zjiemjcilgbxrtqcovkz.supabase.co",publishable_key:key,policy_version:version,submission_enabled:process.env.AI_STUDIO_SUBMISSION_ENABLED==="true"});
}
