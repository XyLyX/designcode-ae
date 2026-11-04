import test from "node:test";
import assert from "node:assert/strict";
import session from "../netlify/functions/ai-studio-session.mjs";
import consent from "../netlify/functions/ai-studio-consent.mjs";
import upload from "../netlify/functions/ai-studio-upload.mjs";

const endpoint = "https://example.test/.netlify/functions/";
const request = (name, init={}) => new Request(endpoint+name,{method:"POST",...init});
const disabled = async (handler,name) => {
  const response=await handler(request(name));
  assert.equal(response.status,503);
  assert.equal((await response.json()).error,"Not available");
};
test("all three endpoints fail closed when feature flags are absent",async()=>{
  const flags=["AI_STUDIO_API_ENABLED","AI_STUDIO_UPLOAD_ENABLED","AI_STUDIO_CONSENT_ENABLED"];
  const old=flags.map(k=>process.env[k]);
  try{
    flags.forEach(k=>delete process.env[k]);
    await disabled(session,"ai-studio-session");
    await disabled(consent,"ai-studio-consent");
    await disabled(upload,"ai-studio-upload");
  }finally{flags.forEach((k,i)=>old[i]===undefined?delete process.env[k]:process.env[k]=old[i]);}
});
test("all three endpoints reject GET",async()=>{
  for(const [name,fn] of [["session",session],["consent",consent],["upload",upload]]){
    const response=await fn(new Request(endpoint+name));
    assert.equal(response.status,405);
  }
});
