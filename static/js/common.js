document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('mobile-menu-button');
  const nav = document.getElementById('side-nav');
  const overlay = document.getElementById('menu-overlay');
  const focusableSelectors = 'a, button, [tabindex]:not([tabindex="-1"])';
  let lastFocused = null;

  function openMenu() {
    lastFocused = document.activeElement;
    nav.classList.remove('hidden');
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => {
      nav.classList.add('show');
      overlay.classList.add('show');
    });
    button.setAttribute('aria-expanded', 'true');
    nav.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    const first = nav.querySelector(focusableSelectors);
    (first || nav).focus();
  }

  function closeMenu() {
    if (!nav.classList.contains('show')) return;
    nav.classList.remove('show');
    overlay.classList.remove('show');
    nav.addEventListener(
      'transitionend',
      () => {
        nav.classList.add('hidden');
        overlay.classList.add('hidden');
        nav.setAttribute('aria-hidden', 'true');
        overlay.setAttribute('aria-hidden', 'true');
        document.documentElement.style.overflow = '';
        button.setAttribute('aria-expanded', 'false');
        if (lastFocused) lastFocused.focus();
      },
      { once: true }
    );
  }

  function handleKeydown(e) {
    if (!nav.classList.contains('show')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu();
    } else if (e.key === 'Tab') {
      const focusable = nav.querySelectorAll(focusableSelectors);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  if (button && nav && overlay) {
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-expanded') === 'true') {
        closeMenu();
      } else {
        openMenu();
      }
    });
    overlay.addEventListener('click', closeMenu);
    document.addEventListener('keydown', handleKeydown);
    const desktop = window.matchMedia('(min-width: 768px)');
    desktop.addEventListener('change', e => {
      if (e.matches) closeMenu();
    });
  }

  const header = document.querySelector('header');
  const offset = header ? header.offsetHeight : 0;

  const links = document.querySelectorAll(
    '#side-nav a[href^="#"], header nav a[href^="#"]'
  );
  links.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        const top =
          target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
      if (nav && nav.classList.contains('show')) {
        closeMenu();
      }
    });
  });
});

function createMap(container, options = {}) {
  if (!window.L) {
    console.error('Leaflet library is missing');
    return null;
  }
  const { interactive = true, ...mapOptions } = options;
  const map = L.map(container, {
    zoomControl: interactive,
    dragging: interactive,
    scrollWheelZoom: interactive,
    doubleClickZoom: interactive,
    boxZoom: interactive,
    keyboard: interactive,
    ...mapOptions
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  return map;
}
