'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const photo=$('photo'), status=$('photo-status'), form=$('ai-intake');
  const email=$('login-email'), code=$('login-code'), loginStatus=$('login-status');
  const send=$('request-code'), verify=$('verify-code');
  let config=null, accessToken=null, expiresAt=0;
  const allowed=new Set(['image/jpeg','image/png','image/webp']);
  const message=(el,s)=>{el.textContent=s;};
  const authHeaders=()=>({'apikey':config.publishable_key,'content-type':'application/json'});
  async function authFetch(path,body){
    const response=await fetch(config.supabase_url+'/auth/v1/'+path,{
      method:'POST',headers:authHeaders(),body:JSON.stringify(body),cache:'no-store'});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.msg||data.error_description||'Authentication request failed');
    return data;
  }
  async function setup(){
    try{
      const response=await fetch('/.netlify/functions/ai-studio-config',{cache:'no-store'});
      if(!response.ok)return;
      const data=await response.json();
      if(!data.enabled)return;
      if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(data.supabase_url) ||
         typeof data.publishable_key!=='string'||!data.publishable_key)return;
      config=data;
      send.disabled=false;
      message(loginStatus,'Enter your email to request a verification code.');
    }catch{message(loginStatus,'Authentication is temporarily unavailable.');}
  }
  send?.addEventListener('click',async()=>{
    if(!config||!email.reportValidity())return;
    send.disabled=true;
    try{
      await authFetch('otp',{email:email.value.trim(),create_user:true});
      code.disabled=false;verify.disabled=false;
      message(loginStatus,'Check your email. Enter the verification code sent to you.');
    }catch(e){message(loginStatus,e.message);}
    finally{send.disabled=false;}
  });
  verify?.addEventListener('click',async()=>{
    if(!config||!code.value.trim())return;
    verify.disabled=true;
    try{
      const result=await authFetch('verify',{email:email.value.trim(),token:code.value.trim(),type:'email'});
      if(!result.access_token||!result.expires_in)throw new Error('No valid session returned');
      accessToken=result.access_token;expiresAt=Date.now()+result.expires_in*1000;
      message(loginStatus,'Email verified. Design submission remains unavailable during the private pilot.');
      email.disabled=true;code.disabled=true;send.disabled=true;
    }catch(e){message(loginStatus,e.message);verify.disabled=false;}
  });
  photo?.addEventListener('change',()=>{
    const file=photo.files?.[0];
    if(!file){message(status,'');return;}
    if(!allowed.has(file.type)||file.size>10*1024*1024||file.size===0){
      photo.value='';message(status,'Please select a JPEG, PNG or WebP photo smaller than 10 MB.');return;
    }
    message(status,'Photo selected locally: '+file.name+'. Nothing has been uploaded.');
  });
  form?.addEventListener('submit',event=>event.preventDefault());
  // No token persistence, no customer data submission, no upload or consent until approved.
  window.addEventListener('pagehide',()=>{accessToken=null;expiresAt=0;});
  setup();
})();
