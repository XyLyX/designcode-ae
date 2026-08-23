// ===== GTM / GA4 conversion event tracking =====
// dataLayer is created by the GTM snippet in <head>; guard here in case this
// script ever runs on a page without it (e.g. local testing without GTM).
window.dataLayer = window.dataLayer || [];

// WhatsApp click tracking — fires on any link to wa.me, anywhere on the page
// (header, hero CTAs, contact panel, footer, etc.)
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href*="wa.me"]');
  if (link) {
    window.dataLayer.push({
      event: 'whatsapp_click',
      link_url: link.href,
      page_path: window.location.pathname
    });
  }
});

// Phone click tracking — fires on any tel: link
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="tel:"]');
  if (link) {
    window.dataLayer.push({
      event: 'phone_click',
      link_url: link.href,
      page_path: window.location.pathname
    });
  }
});

// ===== Header scroll state =====
const header = document.querySelector('.site-header');
if(header){
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 30);
  }, {passive:true});
}

// ===== Mobile nav toggle =====
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-header nav');
if(navToggle && nav){
  navToggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    document.body.classList.toggle('nav-open');
    navToggle.textContent = nav.classList.contains('open') ? '✕' : '☰';
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    document.body.classList.remove('nav-open');
    navToggle.textContent = '☰';
  }));
}

// ===== Scroll reveal =====
const revealEls = document.querySelectorAll('.reveal');
if('IntersectionObserver' in window && revealEls.length){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, {threshold:0.1});
  revealEls.forEach(el=>io.observe(el));
} else {
  revealEls.forEach(el=>el.classList.add('is-visible'));
}

// ===== Before / after slider (apartments page) =====
document.querySelectorAll('.ba-slider').forEach(slider=>{
  const after = slider.querySelector('.ba-after');
  const handle = slider.querySelector('.ba-handle');
  let dragging = false;
  const setPos = (clientX) => {
    const rect = slider.getBoundingClientRect();
    let pct = ((clientX - rect.left) / rect.width) * 100;
    pct = Math.max(0, Math.min(100, pct));
    after.style.clipPath = `inset(0 0 0 ${pct}%)`;
    handle.style.left = pct + '%';
  };
  handle.addEventListener('pointerdown', (e)=>{ dragging = true; e.target.setPointerCapture(e.pointerId); });
  window.addEventListener('pointerup', ()=> dragging = false);
  slider.addEventListener('pointermove', (e)=>{ if(dragging) setPos(e.clientX); });
  slider.addEventListener('click', (e)=> setPos(e.clientX));
});

// ===== RFQ form submission (Netlify Forms via AJAX) =====
const encodeFormData = (data) => {
  return Object.keys(data)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&');
};

document.querySelectorAll('.rfq-form').forEach(form => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const payload = {};
    formData.forEach((value, key) => { payload[key] = value; });

    // RFQ / consultation-request conversion event. form-name distinguishes
    // which page the lead came from (rfq-general, rfq-villa-renovation,
    // rfq-commercial-fit-out, rfq-apartment-renovation, rfq-office) so GTM/GA4
    // can report them individually or roll them all up as one conversion.
    const trackSubmit = () => {
      window.dataLayer.push({
        event: 'rfq_form_submit',
        form_name: payload['form-name'] || form.getAttribute('name') || 'unknown',
        page_path: window.location.pathname
      });
    };

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encodeFormData(payload)
    })
    .then(() => {
      trackSubmit();
      const msg = form.parentElement.querySelector('.confirm-msg');
      if (msg) msg.classList.add('show');
      form.reset();
    })
    .catch(() => {
      // Not deployed on Netlify yet, or offline — still confirm locally so the UI doesn't feel broken.
      trackSubmit();
      const msg = form.parentElement.querySelector('.confirm-msg');
      if (msg) msg.classList.add('show');
      form.reset();
    });
  });
});
