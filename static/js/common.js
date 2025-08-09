document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('mobile-menu-button');
  const nav = document.getElementById('side-nav');
  const overlay = document.getElementById('menu-overlay');
  if (button && nav && overlay) {
    const focusableSelectors = 'a, button, [tabindex]:not([tabindex="-1"])';

    const closeMenu = () => {
      if (!nav.classList.contains('show')) return;
      nav.classList.remove('show');
      overlay.classList.remove('show');
      nav.addEventListener(
        'transitionend',
        () => {
          nav.classList.add('hidden');
          overlay.classList.add('hidden');
          nav.setAttribute('aria-hidden', 'true');
          button.setAttribute('aria-expanded', 'false');
          button.focus();
        },
        { once: true }
      );
    };

    const openMenu = () => {
      nav.classList.remove('hidden');
      overlay.classList.remove('hidden');
      requestAnimationFrame(() => {
        nav.classList.add('show');
        overlay.classList.add('show');
      });
      nav.setAttribute('aria-hidden', 'false');
      button.setAttribute('aria-expanded', 'true');
      const first = nav.querySelector(focusableSelectors);
      (first || nav).focus();
    };

    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    overlay.addEventListener('click', closeMenu);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeMenu();
      }
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
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }

      if (button && nav && overlay && nav.classList.contains('show')) {
        nav.classList.remove('show');
        nav.classList.add('hidden');
        overlay.classList.remove('show');
        overlay.classList.add('hidden');
        button.setAttribute('aria-expanded', 'false');
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
