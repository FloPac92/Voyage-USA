const STICKY_OFFSET = 80;

document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('mobile-menu-button');
  const nav = document.getElementById('side-nav');
  if (button && nav) {
    button.addEventListener('click', () => {
      nav.classList.toggle('hidden');
      nav.classList.toggle('show');
    });
  }

  const links = document.querySelectorAll('header nav a[href^="#"]');
  links.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - STICKY_OFFSET;
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
