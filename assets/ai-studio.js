'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const photo=$('photo'), status=$('photo-status'), form=$('ai-intake');
  const email=$('login-email'), code=$('login-code'), loginStatus=$('login-status');
  const send=$('request-code'), verify=$('verify-code');
  let config=null, accessToken=null, expiresAt=0, refreshToken=null, sessionToken=null;
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
      accessToken=result.access_token;refreshToken=result.refresh_token||null;expiresAt=Date.now()+result.expires_in*1000;
      message(loginStatus,'Email verified. You can prepare a private design request.');
      if(config.submission_enabled===true){$('consent').disabled=false;$('contact-consent').disabled=false;$('marketing-consent').disabled=false;form.querySelector('button[type=submit]').disabled=false;form.querySelector('button[type=submit]').textContent='Submit private design request';}
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
  async function activeToken(){
    if(!accessToken)throw new Error('Please verify your email first.');
    if(Date.now()<expiresAt-60000)return accessToken;
    if(!refreshToken)throw new Error('Your session expired. Please sign in again.');
    const updated=await authFetch('token?grant_type=refresh_token',{refresh_token:refreshToken});
    if(!updated.access_token||!updated.expires_in)throw new Error('Session refresh failed.');
    accessToken=updated.access_token;refreshToken=updated.refresh_token||null;
    expiresAt=Date.now()+updated.expires_in*1000;
    return accessToken;
  }
  async function callApi(endpoint,body,token,session,contentType){
    const headers={'authorization':'Bearer '+token};
    if(session)headers['x-ai-studio-session-token']=session;
    if(contentType)headers['content-type']=contentType;
    const response=await fetch('/.netlify/functions/'+endpoint,{
      method:'POST',headers,body:contentType==='application/json'?JSON.stringify(body):body,cache:'no-store'});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||'Request failed ('+response.status+')');
    return data;
  }
  form?.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!config?.submission_enabled||!accessToken)return;
    if(!$('consent').checked||!$('contact-consent').checked){
      message(status,'AI processing and project-contact consent are required.');return;
    }
    const file=photo.files?.[0];
    if(!file||!allowed.has(file.type)||file.size===0||file.size>10*1024*1024){
      message(status,'Select a supported room photograph under 10 MB.');return;
    }
    const button=form.querySelector('button[type=submit]');
    button.disabled=true;
    try{
      const token=await activeToken();
      const budget=$('budget').value;
      message(status,'Creating your private design session…');
      const session=await callApi('ai-studio-session',{
        room_type:$('room').value,style_preference:$('style').value,
        budget_aed:budget===''?null:Number(budget),
        dimensions_note:$('dimensions').value,restrictions_note:$('restrictions').value
      },token,null,'application/json');
      sessionToken=session.session_token;
      message(status,'Recording your consent…');
      await callApi('ai-studio-consent',{
        policy_version:config.policy_version,ai_processing:true,contact:true,
        marketing:false
      },token,sessionToken,'application/json');
      message(status,'Uploading your photograph privately…');
      await callApi('ai-studio-upload',file,token,sessionToken,file.type);
      message(status,'Photograph stored privately. Reference: '+session.id+'. A design concept has not yet been generated.');
      button.textContent='Submitted';
    }catch(e){
      message(status,'Submission incomplete: '+e.message+'. Do not retry immediately; a draft may have been created.');
      button.disabled=false;
    }
  });
  // No token persistence, no customer data submission, no upload or consent until approved.
  window.addEventListener('pagehide',()=>{accessToken=null;refreshToken=null;sessionToken=null;expiresAt=0;});
  setup();
})();
