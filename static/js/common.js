document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('mobile-menu-button');
  const nav = document.getElementById('side-nav');
  if (button && nav) {
    const focusableSelectors = 'a, button, [tabindex]:not([tabindex="-1"])';
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';

      if (expanded) {
        nav.classList.remove('show');
        nav.addEventListener(
          'transitionend',
          () => {
            nav.classList.add('hidden');
            nav.setAttribute('aria-hidden', 'true');
            button.focus();
          },
          { once: true }
        );
      } else {
        nav.classList.remove('hidden');
        requestAnimationFrame(() => nav.classList.add('show'));
        nav.setAttribute('aria-hidden', 'false');
        const first = nav.querySelector(focusableSelectors);
        (first || nav).focus();
      }

      button.setAttribute('aria-expanded', String(!expanded));
    });
  }

  const header = document.querySelector('header');
  const offset = header ? header.offsetHeight : 0;

  const links = document.querySelectorAll('header nav a[href^="#"]');
  links.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
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
