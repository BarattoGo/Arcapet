(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Anno nel footer ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Menu mobile (Drawer) ---------- */
  const burger = $('#burger');
  const drawer = $('#drawer');
  const closeBtns = $$('[data-close]', drawer);
  
  burger?.addEventListener('click', () => {
    drawer?.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  });

  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      drawer?.setAttribute('aria-hidden', 'true');
      burger?.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  /* ---------- Slider hero ---------- */
  const heroCard = $('#hero');
  if (heroCard) {
    const slides = $$('.slide', heroCard);
    const titles = $$('.hero__title', heroCard);
    const dotsWrap = $('#hero-dots');
    let index = 0;
    let timer;
    const DELAY = 5000;

    const dots = slides.map((_, i) => {
      const b = document.createElement('button');
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', `Vai alla slide ${i + 1}`);
      b.addEventListener('click', () => { go(i); restart(); });
      if (dotsWrap) dotsWrap.appendChild(b);
      return b;
    });

    function go(i) {
      if (slides[index]) slides[index].classList.remove('is-active');
      if (titles[index]) titles[index].classList.remove('is-active');
      
      index = (i + slides.length) % slides.length;
      
      const s = slides[index];
      const t = titles[index];
      
      // forza il riavvio
      if (s) { void s.offsetWidth; s.classList.add('is-active'); }
      if (t) { void t.offsetWidth; t.classList.add('is-active'); }
      
      dots.forEach((d, k) => d.setAttribute('aria-selected', k === index));
    }
    const next = () => go(index + 1);
    const prev = () => go(index - 1);
    const restart = () => {
      clearInterval(timer);
      if (!reduceMotion) timer = setInterval(next, DELAY);
    };

    $('#hero-next')?.addEventListener('click', () => { next(); restart(); });
    $('#hero-prev')?.addEventListener('click', () => { prev(); restart(); });
    heroCard.addEventListener('mouseenter', () => clearInterval(timer));
    heroCard.addEventListener('mouseleave', restart);

    // swipe touch
    let startX = 0;
    heroCard.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    heroCard.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); restart(); }
    });

    go(0);
    restart();
  }

  /* ---------- Caroselli prodotti (Rail) ---------- */
  $$('[data-rail]').forEach(railSection => {
    const track = $('.rail__track', railSection);
    const progressSpan = $('.rail__progress span', railSection);
    const btnNext = $('[data-next]', railSection);
    const btnPrev = $('[data-prev]', railSection);
    const items = $$('.card', track);
    
    if (!track || items.length === 0) return;

    const getScrollStep = () => {
      const itemWidth = items[0].getBoundingClientRect().width;
      const gap = parseInt(getComputedStyle(track).gap) || 16;
      return itemWidth + gap;
    };

    const updateProgressAndButtons = () => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      const scrollLeft = track.scrollLeft;
      
      // Update progress bar
      if (progressSpan) {
        const percentage = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 100;
        progressSpan.style.width = `${percentage}%`;
      }
      
      // Update buttons
      if (btnPrev) btnPrev.disabled = scrollLeft <= 0;
      if (btnNext) btnNext.disabled = scrollLeft >= maxScroll - 5;
    };

    btnNext?.addEventListener('click', () => {
      track.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
    });

    btnPrev?.addEventListener('click', () => {
      track.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
    });

    track.addEventListener('scroll', () => {
      requestAnimationFrame(updateProgressAndButtons);
    }, { passive: true });

    window.addEventListener('resize', () => {
      requestAnimationFrame(updateProgressAndButtons);
    });

    // Init
    updateProgressAndButtons();
  });

  /* ---------- Header Sticky (Scroll) ---------- */
  const header = $('#header');
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 100) {
      if (y > lastY) {
        // Scroll down - nascondi header
        header?.classList.add('is-hidden');
      } else {
        // Scroll up - mostra header
        header?.classList.remove('is-hidden');
      }
    } else {
      header?.classList.remove('is-hidden');
    }
    lastY = y;
  }, { passive: true });

  /* ---------- Reveal on scroll ---------- */
  if ('IntersectionObserver' in window && !reduceMotion) {
    const targets = $$('[data-reveal], [data-stagger]');
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.1 });
    targets.forEach(el => io.observe(el));
  }
  
  /* ---------- Copia email ---------- */
  $$('[data-copy]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const text = btn.getAttribute('data-copy');
      navigator.clipboard.writeText(text).then(() => {
        const originalIcon = btn.innerHTML;
        btn.innerHTML = '<svg class="ico"><use href="#i-check"/></svg>';
        setTimeout(() => btn.innerHTML = originalIcon, 2000);
      });
    });
  });

})();
