/* ArcaPet — interazioni (vanilla JS, nessuna dipendenza) */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Anno nel footer ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Menu mobile ---------- */
  const toggle = $('#menu-toggle');
  const nav = $('#main-nav');
  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open);
  });
  $$('.sub-toggle', nav).forEach(btn =>
    btn.addEventListener('click', () => btn.parentElement.classList.toggle('is-open'))
  );

  /* ---------- Sticky menu (clona il menu principale) ---------- */
  const sticky = $('#sticky-bar');
  const stickyNav = $('#sticky-nav');
  if (sticky && stickyNav && nav) {
    const clone = $('.main-nav__list', nav).cloneNode(true);
    $$('.sub-toggle', clone).forEach(b => b.remove());
    stickyNav.appendChild(clone);
  }

  /* ---------- Scroll: sticky + torna su ---------- */
  const toTop = $('#to-top');
  const header = $('#site-header');
  const onScroll = () => {
    const y = window.scrollY;
    const threshold = header ? header.offsetTop + header.offsetHeight + 80 : 200;
    sticky?.classList.toggle('is-visible', y > threshold);
    sticky?.setAttribute('aria-hidden', y > threshold ? 'false' : 'true');
    toTop?.classList.toggle('is-visible', y > 600);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Slider hero ---------- */
  const slider = $('#hero-slider');
  if (slider) {
    const slides = $$('.slide', slider);
    const dotsWrap = $('#slider-dots');
    let index = 0;
    let timer;
    const DELAY = 6000;

    const dots = slides.map((_, i) => {
      const b = document.createElement('button');
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', `Vai alla slide ${i + 1}`);
      b.addEventListener('click', () => { go(i); restart(); });
      dotsWrap.appendChild(b);
      return b;
    });

    function go(i) {
      slides[index].classList.remove('is-active');
      index = (i + slides.length) % slides.length;
      const s = slides[index];
      // forza il riavvio delle animazioni
      void s.offsetWidth;
      s.classList.add('is-active');
      dots.forEach((d, k) => d.setAttribute('aria-selected', k === index));
    }
    const next = () => go(index + 1);
    const prev = () => go(index - 1);
    const restart = () => {
      clearInterval(timer);
      if (!reduceMotion) timer = setInterval(next, DELAY);
    };

    $('#slider-next')?.addEventListener('click', () => { next(); restart(); });
    $('#slider-prev')?.addEventListener('click', () => { prev(); restart(); });
    slider.addEventListener('mouseenter', () => clearInterval(timer));
    slider.addEventListener('mouseleave', restart);

    // swipe touch
    let startX = 0;
    slider.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); restart(); }
    });

    go(0);
    restart();
  }

  /* ---------- Caroselli prodotti (scroll-snap + dots + autoplay) ---------- */
  $$('[data-carousel]').forEach(car => {
    const track = $('.carousel__track', car);
    const dotsWrap = $('.carousel__dots', car);
    const items = $$('.product', track);
    let timer;

    const perView = () => {
      const w = items[0]?.getBoundingClientRect().width || 1;
      return Math.max(1, Math.round(track.clientWidth / w));
    };
    const pages = () => Math.max(1, Math.ceil(items.length - perView() + 1));
    const step = () => {
      const a = items[0], b = items[1];
      return b ? b.offsetLeft - a.offsetLeft : track.clientWidth;
    };

    function buildDots() {
      dotsWrap.innerHTML = '';
      const n = Math.ceil(items.length / perView());
      for (let i = 0; i < n; i++) {
        const d = document.createElement('button');
        d.setAttribute('aria-label', `Pagina ${i + 1}`);
        d.addEventListener('click', () => {
          track.scrollTo({ left: i * perView() * step() });
          restart();
        });
        dotsWrap.appendChild(d);
      }
      updateDots();
    }
    function updateDots() {
      const pv = perView();
      const maxScroll = track.scrollWidth - track.clientWidth;
      let page = Math.round(track.scrollLeft / (step() * pv));
      if (track.scrollLeft >= maxScroll - 4) page = dotsWrap.children.length - 1;
      [...dotsWrap.children].forEach((d, i) => d.setAttribute('aria-selected', i === page));
    }
    function advance() {
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (track.scrollLeft >= maxScroll - 4) track.scrollTo({ left: 0 });
      else track.scrollBy({ left: step() });
    }
    const restart = () => {
      clearInterval(timer);
      if (!reduceMotion) timer = setInterval(advance, 3500);
    };

    let raf;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateDots);
    }, { passive: true });
    car.addEventListener('mouseenter', () => clearInterval(timer));
    car.addEventListener('mouseleave', restart);
    car.addEventListener('touchstart', () => clearInterval(timer), { passive: true });

    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(buildDots, 150); });

    buildDots();
    restart();
  });

  /* ---------- Reveal on scroll ---------- */
  if ('IntersectionObserver' in window && !reduceMotion) {
    const targets = $$('.services, .band-head, .carousel, .facility, .footer-widgets');
    targets.forEach(el => el.classList.add('reveal'));
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    targets.forEach(el => io.observe(el));
  }
})();
