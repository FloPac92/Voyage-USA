document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('mobile-menu-button');
  const nav = document.getElementById('side-nav');
  if (button && nav) {
    button.addEventListener('click', () => {
      nav.classList.toggle('hidden');
      nav.classList.toggle('show');
    });
  }
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
