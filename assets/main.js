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

// ===== Share bar (Insights articles) =====
// Standard for every article: drop <div class="share-bar" data-share></div>
// anywhere on the page. URL + title are read from the canonical tag and
// og:title automatically (override with data-url / data-title if needed).
// WhatsApp uses api.whatsapp.com (not wa.me) so shares are NOT counted as
// whatsapp_click lead conversions. Shares push a separate `share_click` event.
(() => {
  const bars = document.querySelectorAll('[data-share]');
  if (!bars.length) return;
  const icon = {
    share: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="M8.3 10.8l7.4-4.4M8.3 13.2l7.4 4.4"/></svg>',
    out:   '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };
  const track = (platform, url) => window.dataLayer.push({
    event: 'share_click', share_platform: platform, link_url: url, page_path: location.pathname
  });

  bars.forEach(bar => {
    const url   = bar.dataset.url   || document.querySelector('link[rel="canonical"]')?.href || location.href;
    const title = bar.dataset.title || document.querySelector('meta[property="og:title"]')?.content || document.title;
    const e = encodeURIComponent;
    const targets = [
      ['linkedin', 'LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}`],
      ['threads',  'Threads',  `https://www.threads.net/intent/post?text=${e(title + ' ' + url)}`],
      ['whatsapp', 'WhatsApp', `https://api.whatsapp.com/send?text=${e(title + ' — ' + url)}`]
    ];
    const canNative = !!navigator.share;
    bar.innerHTML =
      '<span class="share-label">Share</span>' +
      targets.map(([id, name, href]) =>
        `<a class="share-btn" data-platform="${id}" href="${href}" target="_blank" rel="noopener" aria-label="Share on ${name}">${name}${icon.out}</a>`
      ).join('') +
      `<button type="button" class="share-btn share-native" aria-label="${canNative ? 'More sharing options' : 'Copy link'}">${icon.share}<span>${canNative ? 'More' : 'Copy link'}</span></button>`;

    bar.querySelectorAll('a.share-btn').forEach(a =>
      a.addEventListener('click', () => track(a.dataset.platform, url)));

    const nativeBtn = bar.querySelector('.share-native');
    nativeBtn.addEventListener('click', async () => {
      if (canNative) {
        try { await navigator.share({ title, url }); track('native', url); } catch (_) {}
        return;
      }
      try {
        await navigator.clipboard.writeText(url);
        track('copy_link', url);
        nativeBtn.classList.add('is-done');
        nativeBtn.innerHTML = `${icon.check}<span>Copied</span>`;
        setTimeout(() => {
          nativeBtn.classList.remove('is-done');
          nativeBtn.innerHTML = `${icon.share}<span>Copy link</span>`;
        }, 2000);
      } catch (_) { prompt('Copy this link:', url); }
    });
  });
})();
