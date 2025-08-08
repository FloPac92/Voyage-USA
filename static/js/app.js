// Global variables
let map;
let mini; // mini-map instance
const markerManager = {
  markers: new Map(),
  addMarker(day, marker) {
    this.markers.set(day, marker);
    console.log(`Marker added for day ${day}. Total markers: ${this.markers.size}`);
  },
  getMarker(day) {
    return this.markers.get(day);
  },
  createIcon(isActive) {
    return L.divIcon({
      className: '',
      html: `<div class="custom-marker${isActive ? ' active' : ''}"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  }
};

// Initialize map
async function initMap() {
  // Charger toutes les données (jours et points de carte)
  window.tripData = await loadTripData();

  map = L.map('map-container').setView([36.17, -115.90], 4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Créer les marqueurs depuis les données
  const coordMap = new Map();
  if (Array.isArray(window.tripData)) {
    window.tripData.forEach(point => {
      const key = `${point.lat},${point.lng}`;
      const formatDays = days => `Jour${days.length > 1 ? 's' : ''} ${days.join(', ')}`;

      if (coordMap.has(key)) {
        const entry = coordMap.get(key);
        entry.days.push(point.day);
        markerManager.addMarker(point.day, entry.marker);
        const dayLabel = formatDays(entry.days);
        const popupContent = `
        <div class="marker-popup">
          <h3 class="font-bold text-lg mb-2">${entry.name}</h3>
          <div class="text-gray-700">${dayLabel}</div>
        </div>
      `;
        entry.marker.setPopupContent(popupContent);
        entry.marker.setTooltipContent(dayLabel);
      } else {
        const marker = L.marker([point.lat, point.lng], {
          icon: markerManager.createIcon(false)
        }).addTo(map);
        markerManager.addMarker(point.day, marker);
        const entry = { marker, days: [point.day], name: point.name };
        coordMap.set(key, entry);
        const dayLabel = formatDays(entry.days);
        const popupContent = `
        <div class="marker-popup">
          <h3 class="font-bold text-lg mb-2">${point.name}</h3>
          <div class="text-gray-700">${dayLabel}</div>
        </div>
      `;
        marker.bindPopup(popupContent, { className: 'custom-popup' });
        marker.bindTooltip(dayLabel, { direction: 'top', sticky: true });
        marker.on('mouseover', () => marker.openTooltip());
        marker.on('mouseout', () => marker.closeTooltip());
        marker.on('click', function() {
          markerManager.markers.forEach(m => {
            if (m !== marker) m.closePopup();
          });
          marker.openPopup();
          marker.openTooltip();
        });
      }
    });
  }

  // Charger le tracé KML (sans les points, déjà gérés)
  console.log('Loading KML file...');
  omnivore.kml('./circuit-voyage-usa.kml')
    .on('ready', async function() {
      console.log('KML file loaded successfully');
      this.eachLayer(function(layer) {
        if (layer.feature && layer.feature.geometry.type === 'Point') {
          map.removeLayer(layer);
        } else {
          layer.setStyle({
            color: '#2563eb',
            weight: 3,
            opacity: 1
          });
        }
      });
      this.addTo(map);
      map.fitBounds(this.getBounds());
      if (window.tripData) {
        renderNavigation(window.tripData);
        await showDay(1);
      }
    })
    .on('error', function(error) {
      console.error('Error loading KML:', error);
    });
}

// Load day data
// Charger toutes les informations du voyage
async function loadTripData() {
  try {
    console.log('Fetching itinerary.json...');
    const response = await fetch('./itinerary.json');
    console.log('Response status:', response.status);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    console.log('Trip data response text:', text.substring(0, 100) + '...');
    return JSON.parse(text);
  } catch (error) {
    console.error('Error loading trip data:', error);
      document.getElementById('jour-detail').innerHTML = `
        <div class="text-red-600 p-4">
          Erreur de chargement : ${error.message}
        </div>
      `;
      return [];
  }
}

// Render navigation
function renderNavigation(data) {
  const nav = document.getElementById('sidebar-programme');
  nav.innerHTML = '';
  data.forEach(day => {
    const btn = document.createElement('button');
    btn.textContent = `Jour ${day.day}`;
    btn.classList.add('day-button');
    btn.dataset.day = day.day;
    btn.addEventListener('click', () => showDay(day.day, btn));
    nav.appendChild(btn);
  });
}

// Show day content
function showDay(dayNumber, button) {
  try {
    const dayNum = parseInt(dayNumber, 10);
    const day = window.tripData.find(d => d.day === dayNum);
    if (!day) {
      console.error('Day not found in tripData:', dayNumber);
      return;
    }

    const sidebar = document.getElementById('sidebar-programme');
    const detailContainer = document.getElementById('jour-detail');

    // Clean previous mini-map instance to avoid memory leaks
    if (mini) {
      mini.remove();
      mini = null;
    }
    sidebar.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
    const targetBtn = button || sidebar.querySelector(`button[data-day="${dayNum}"]`);
    if (targetBtn) {
      targetBtn.classList.add('selected');
      targetBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    detailContainer.innerHTML = '';

    const block = document.createElement('div');
    block.classList.add('day-block', 'day-content');

    const leftCol = document.createElement('div');
    leftCol.classList.add('left');
    const rightCol = document.createElement('div');
    rightCol.classList.add('right');

    const title = document.createElement('h3');
    title.textContent = day.jour || `Jour ${day.day}`;
    leftCol.appendChild(title);

    if (day.name) {
      const poetic = document.createElement('h3');
      poetic.classList.add('jour-title');
      poetic.textContent = day.name;
      leftCol.appendChild(poetic);
    }

    if (Array.isArray(day.activities) && day.activities.length > 0) {
      const travelIcons = document.createElement('div');
      travelIcons.classList.add('travel-icons');
      day.activities.forEach(act => {
        const span = document.createElement('span');
        span.textContent = act.icon;
        span.title = act.label;
        travelIcons.appendChild(span);
      });
      leftCol.appendChild(travelIcons);
    }

    const steps = document.createElement('p');
    const stepParts = [];
    if (day.wake) stepParts.push(day.wake);
    if (day.sleep) stepParts.push(day.sleep);
    if (stepParts.length > 0) {
      steps.textContent = stepParts.join(' → ');
      if (day.travel && day.travel.trim() !== '' && day.travel.toLowerCase() !== 'aucun') {
        steps.textContent += ` (${day.travel})`;
      }
      leftCol.appendChild(steps);
    }

    const desc = document.createElement('p');
    desc.textContent = day.explication || '';
    leftCol.appendChild(desc);

    const agenda = document.createElement('ul');
    (day.agenda || []).forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      agenda.appendChild(li);
    });
    leftCol.appendChild(agenda);

    const img = document.createElement('img');
    img.classList.add('jour-image');
    img.src = `jour${day.day}.jpg`;
    img.alt = day.photo || title.textContent;
    img.onerror = () => { img.src = `jour${day.day}.png`; };
    rightCol.appendChild(img);

    const miniMap = document.createElement('div');
    miniMap.classList.add('mini-map');
    rightCol.appendChild(miniMap);

    // Initialize mini-map for the selected day
    const points = Array.isArray(day.coords)
      ? day.coords
      : Array.isArray(day.steps)
        ? day.steps
        : [{ lat: day.lat, lng: day.lng }];
    const latlngs = points.map(p => [p.lat, p.lng]);
    mini = L.map(miniMap, {
      attributionControl: false,
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mini);

    latlngs.forEach(coord => {
      L.marker(coord)
        .addTo(mini)
        .on('click', () => showDay(day.day));
    });

    if (latlngs.length > 1) {
      L.polyline(latlngs).addTo(mini);
    }

    const bounds = L.latLngBounds(latlngs);
    mini.fitBounds(bounds, { padding: [10, 10] });

    block.appendChild(leftCol);
    block.appendChild(rightCol);

    detailContainer.appendChild(block);
    detailContainer.classList.add('fade-in');
    detailContainer.addEventListener('animationend', () => {
      detailContainer.classList.remove('fade-in');
    }, { once: true });
  } catch (error) {
    console.error('Error showing day:', error);
    document.getElementById('jour-detail').innerHTML = `
      <div class="text-red-600 p-4">
        Erreur lors du chargement du jour ${dayNumber}: ${error.message}
      </div>
    `;
  }
}


// Mobile menu
document.getElementById('mobile-menu-button').addEventListener('click', () => {
  const nav = document.getElementById('side-nav');
  nav.classList.toggle('hidden');
});

// Initialize
window.addEventListener('load', async () => {
  console.log('Loading application...');
  
  try {
    // Verify Tailwind is loaded
    console.log('Tailwind loaded:', typeof tailwind !== 'undefined');
    
    // Initialize map
    console.log('Initializing map...');
    await initMap();  // Attend que la carte soit initialisée avec les données
    
    // Données déjà chargées dans initMap
    console.log('Trip data loaded:', window.tripData);
    
    // La navigation et l'affichage du jour 1 sont maintenant gérés après le chargement du KML
    if (!window.tripData) {
      document.getElementById('jour-detail').innerHTML = `
        <div class="text-red-600 p-4">
          Erreur: Impossible de charger les données du voyage.
          Vérifiez que le fichier itinerary.json est présent.
        </div>
      `;
    }
  } catch (error) {
    console.error('Error during initialization:', error);
      document.getElementById('jour-detail').innerHTML = `
        <div class="text-red-600 p-4">
          Erreur lors de l'initialisation: ${error.message}
        </div>
      `;
  }
});

