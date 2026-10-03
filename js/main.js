// Fashion Home — interactions & animations
(function () {
  const body = document.body;
  body.classList.add('loading');

  // Preloader
  window.addEventListener('load', () => {
    setTimeout(() => {
      document.getElementById('preloader').classList.add('hide');
      body.classList.remove('loading');
      body.classList.add('loaded');
      setTimeout(startCounters, 1800);
    }, 900);
  });

  // Header shrink + back to top + active link + banner parallax
  const header = document.getElementById('header');
  const toTop = document.getElementById('toTop');
  const bannerBg = document.querySelector('.banner-bg');
  const sections = [...document.querySelectorAll('section[id]')];
  const navLinks = [...document.querySelectorAll('.nav-link')];

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 40);
    toTop.classList.toggle('show', y > 600);

    let current = 'home';
    sections.forEach(s => { if (y >= s.offsetTop - 140) current = s.id; });
    navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current));

    if (bannerBg) {
      const r = bannerBg.parentElement.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        bannerBg.style.transform = `translateY(${(r.top - window.innerHeight / 2) * -0.15}px)`;
      }
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    nav.classList.toggle('open');
  });

  document.querySelectorAll('.has-dropdown > .nav-link').forEach(link => {
    link.addEventListener('click', e => {
      if (window.innerWidth <= 900) {
        e.preventDefault();
        link.parentElement.classList.toggle('open');
      }
    });
  });

  document.querySelectorAll('.nav a:not(.has-dropdown > .nav-link)').forEach(a => {
    a.addEventListener('click', () => {
      burger.classList.remove('active');
      nav.classList.remove('open');
      document.querySelectorAll('.has-dropdown.open').forEach(d => d.classList.remove('open'));
    });
  });

  // Scroll reveal with stagger inside grids
  document.querySelectorAll('.textile-grid, .apparel-grid, .steps').forEach(grid => {
    [...grid.children].forEach((el, i) => el.style.setProperty('--rd', (i % 4) * 0.12 + 's'));
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Counters
  function startCounters() {
    document.querySelectorAll('.counter').forEach(c => {
      const target = +c.dataset.target;
      const dur = 1800;
      const start = performance.now();
      function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        c.textContent = Math.floor(eased * target).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  // Card tilt on hover (desktop)
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.a-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  // Contact form (demo — no backend)
  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button');
    btn.textContent = 'Sending...';
    btn.disabled = true;
    setTimeout(() => {
      form.reset();
      btn.textContent = 'Send Message';
      btn.disabled = false;
      success.classList.add('show');
      setTimeout(() => success.classList.remove('show'), 5000);
    }, 1000);
  });

  // Footer year
  document.getElementById('year').textContent = new Date().getFullYear();
})();
