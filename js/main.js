// Fashion Home — interactions & animations (multi-page)
(function () {
  const body = document.body;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  body.classList.add('loading');

  // Preloader: full on first visit, quick on following pages
  let seen = false;
  try { seen = sessionStorage.getItem('fh-seen') === '1'; sessionStorage.setItem('fh-seen', '1'); } catch (e) {}
  const preloader = $('#preloader');
  function reveal() {
    if (preloader) preloader.classList.add('hide');
    body.classList.remove('loading');
    body.classList.add('loaded');
  }
  if (document.readyState === 'complete') setTimeout(reveal, seen ? 150 : 900);
  else window.addEventListener('load', () => setTimeout(reveal, seen ? 150 : 900));
  setTimeout(reveal, 4000); // safety: never block the page if an image is slow

  // Header shrink, back to top, banner parallax
  const header = $('#header');
  const toTop = $('#toTop');
  const bannerBg = $('.banner-bg');
  function onScroll() {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 40);
    if (toTop) toTop.classList.toggle('show', y > 600);
    if (bannerBg) {
      const r = bannerBg.parentElement.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        bannerBg.style.transform = `translateY(${(r.top - window.innerHeight / 2) * -0.15}px)`;
      }
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });

  // Mobile menu
  const burger = $('#burger');
  const nav = $('#nav');
  if (burger && nav) {
    const backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);

    const setMenu = open => {
      burger.classList.toggle('active', open);
      nav.classList.toggle('open', open);
      body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open);
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
    backdrop.addEventListener('click', () => setMenu(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', () => { if (window.innerWidth > 900) setMenu(false); });

    // On mobile, tapping "Home Textile"/"Apparels" opens/closes its submenu
    // (the submenu has its own "View all" link)
    $$('.has-dropdown > .nav-link').forEach(link => {
      link.addEventListener('click', e => {
        if (window.innerWidth <= 900) {
          e.preventDefault();
          const li = link.parentElement;
          const wasOpen = li.classList.contains('open');
          $$('.has-dropdown.open').forEach(d => d.classList.remove('open'));
          if (!wasOpen) li.classList.add('open');
        }
      });
    });
    // Close the menu after choosing a page
    $$('.nav a').forEach(a => {
      if (!a.matches('.has-dropdown > .nav-link')) a.addEventListener('click', () => setMenu(false));
    });
  }

  // Scroll reveal with stagger inside grids
  $$('.textile-grid, .apparel-grid, .steps, .products, .values-grid, .stats-grid').forEach(grid => {
    [...grid.children].forEach((el, i) => el.style.setProperty('--rd', (i % 3) * 0.12 + 's'));
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  // Counters: animate when visible
  function runCounter(c) {
    const target = +c.dataset.target;
    const dur = 1800;
    const start = performance.now();
    (function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      c.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }
  const cio = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        const delay = en.target.closest('.hero') ? 1200 : 0;
        setTimeout(() => runCounter(en.target), delay);
        cio.unobserve(en.target);
      }
    });
  }, { threshold: 0.5 });
  $$('.counter').forEach(c => cio.observe(c));

  // 3D tilt on apparel cards (desktop only)
  if (window.matchMedia('(hover: hover)').matches) {
    $$('.a-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  // =========================================================
  //  Google Sheets backend (URL set in js/config.js)
  // =========================================================
  const API = ((window.FH_CONFIG || {}).SCRIPT_URL || '').trim();
  const HAS_API = /^https:\/\/script\.google(usercontent)?\.com\//.test(API);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cssUrl = u => `url("${String(u).replace(/["\\\n\r]/g, encodeURIComponent)}")`;

  function loadSheetData() {
    const KEY = 'fh-data', MAX_AGE = 5 * 60 * 1000;
    try {
      const c = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (c && Date.now() - c.t < MAX_AGE) return Promise.resolve(c.data);
    } catch (e) {}
    return fetch(API + (API.includes('?') ? '&' : '?') + 'action=all')
      .then(r => r.json())
      .then(data => {
        if (!data || !data.ok) throw new Error((data && data.error) || 'Bad response');
        try { sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now(), data })); } catch (e) {}
        return data;
      });
  }

  function applySheetData(data) {
    // Category photos → cards, page banner and intro image
    (data.categories || []).forEach(c => {
      if (!c.image) return;
      const img = cssUrl(c.image);
      $$(`a[href="${c.key}.html"].card, a[href="${c.key}.html"].a-card`).forEach(a => a.style.setProperty('--img', img));
      if (body.dataset.page === c.key) {
        $$('.page-hero-bg, .intro-media').forEach(el => el.style.setProperty('--img', img));
      }
    });

    // Products for the current category page
    const grid = $('.products[data-category]');
    const list = grid && (data.products || {})[grid.dataset.category];
    if (!grid || !list || !list.length) return;
    const patterns = ['sw-plain', 'sw-stripe', 'sw-weave', 'sw-check', 'sw-dot', 'sw-herring'];
    const palette = $$('.products .swatch').map(s => s.getAttribute('style'));
    grid.innerHTML = list.map((p, i) => {
      const photo = p.image ? ` has-photo" style="--photo:${esc(cssUrl(p.image))}` : `" style="${esc(palette[i % palette.length] || '')}`;
      return `<article class="product reveal">
          <div class="swatch ${patterns[i % patterns.length]}${photo}">${p.badge ? `<span class="swatch-tag">${esc(p.badge)}</span>` : ''}</div>
          <div class="product-body">
            <h4>${esc(p.name)}</h4>
            ${p.description ? `<p>${esc(p.description)}</p>` : ''}
            ${(p.tags || []).length ? `<div class="tags">${p.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
            <a href="contact.html" class="card-link">Enquire <span>→</span></a>
          </div>
        </article>`;
    }).join('');
    [...grid.children].forEach((el, i) => { el.style.setProperty('--rd', (i % 3) * 0.12 + 's'); io.observe(el); });
  }

  if (HAS_API && ($('.products[data-category]') || $('.card, .a-card'))) {
    loadSheetData().then(applySheetData).catch(err => console.warn('Sheet data not loaded:', err));
  }

  // =========================================================
  //  Contact form → Google Sheet (+ attachment → Google Drive)
  // =========================================================
  const form = $('#contactForm');
  const success = $('#formSuccess');
  const errorBox = $('#formError');
  const fileInput = $('#attachment');
  const fileName = $('#fileName');
  const MAX_MB = 5;

  if (fileInput && fileName) {
    fileInput.addEventListener('change', () => {
      const f = fileInput.files[0];
      fileName.textContent = f ? f.name : 'Attach a design or photo';
      fileInput.closest('.file-field').classList.toggle('has-file', !!f);
    });
  }

  const readFile = file => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = () => reject(new Error('Could not read the attached file.'));
    r.readAsDataURL(file);
  });

  function showMsg(el, text) {
    if (!el) return;
    if (text) el.textContent = text;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 7000);
  }

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const val = id => (($('#' + id) || {}).value || '').trim();
      if (errorBox) errorBox.classList.remove('show');

      const payload = {
        name: val('name'), email: val('email'), phone: val('phone'),
        interest: val('interest'), message: val('message'),
        website: val('website'), page: document.title,
      };

      btn.textContent = 'Sending...';
      btn.disabled = true;
      try {
        const file = fileInput && fileInput.files[0];
        if (file) {
          if (file.size > MAX_MB * 1024 * 1024) throw new Error(`The attachment is larger than ${MAX_MB} MB.`);
          payload.file = { name: file.name, type: file.type, data: await readFile(file) };
        }

        if (HAS_API) {
          // text/plain body avoids a CORS preflight, which Apps Script does not support
          const res = await fetch(API, { method: 'POST', body: JSON.stringify(payload) });
          const out = await res.json();
          if (!out.ok) throw new Error(out.error || 'Something went wrong. Please try again.');
        } else {
          await new Promise(r => setTimeout(r, 800)); // demo mode: no backend configured
        }

        form.reset();
        if (fileName) { fileName.textContent = 'Attach a design or photo'; }
        if (fileInput) fileInput.closest('.file-field').classList.remove('has-file');
        showMsg(success);
      } catch (err) {
        showMsg(errorBox, err.message && err.message !== 'Failed to fetch'
          ? err.message
          : 'Could not send right now. Please call us on +92 42 3552 5391.');
      } finally {
        btn.textContent = 'Send Message';
        btn.disabled = false;
      }
    });
  }

  // Footer year
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
