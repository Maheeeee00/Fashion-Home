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
    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      nav.classList.toggle('open');
    });
    // On mobile, first tap on "Home Textile"/"Apparels" opens the submenu
    $$('.has-dropdown > .nav-link').forEach(link => {
      link.addEventListener('click', e => {
        if (window.innerWidth <= 900 && !link.parentElement.classList.contains('open')) {
          e.preventDefault();
          link.parentElement.classList.add('open');
        }
      });
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

  // Contact form (front-end demo — no backend yet)
  const form = $('#contactForm');
  const success = $('#formSuccess');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('button');
      btn.textContent = 'Sending...';
      btn.disabled = true;
      setTimeout(() => {
        form.reset();
        btn.textContent = 'Send Message';
        btn.disabled = false;
        if (success) {
          success.classList.add('show');
          setTimeout(() => success.classList.remove('show'), 5000);
        }
      }, 1000);
    });
  }

  // Footer year
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
