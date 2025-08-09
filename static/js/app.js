// Global variables
let map;
let miniMap; // mini-map instance
const KML_PATH = './circuit-voyage-usa.kml';
const STICKY_OFFSET = document.querySelector('header')?.offsetHeight || 0;
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

  map = createMap('map-container', {
    center: [36.17, -115.90],
    zoom: 4
  });

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
          // showDay(point.day);
        });
      }
    });
  }

  // Charger le tracé KML (sans les points, déjà gérés)
  console.log('Loading KML file...');
  omnivore.kml(KML_PATH)
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
      document.getElementById('day-content').innerHTML = `
        <div class="text-red-600 p-4">
          Erreur de chargement : ${error.message}
        </div>
      `;
      return [];
  }
}

// Render navigation
function renderNavigation(data) {
  const nav = document.getElementById('days-nav');
  if (!nav) {
    console.error('Navigation element not found: #days-nav');
    return;
  }
  nav.innerHTML = '';
  const list = document.createElement('ul');
  list.setAttribute('role', 'listbox');

  data.forEach(day => {
    const listItem = document.createElement('li');
    const btn = document.createElement('button');
    btn.textContent = `Jour ${day.day}`;
    btn.classList.add('day-button');
    btn.dataset.day = day.day;
    btn.setAttribute('role', 'option');
    btn.setAttribute('tabindex', '0');
    btn.setAttribute('aria-selected', 'false');
    btn.addEventListener('click', () => showDay(day.day, btn));
    listItem.appendChild(btn);
    list.appendChild(listItem);
  });

  nav.appendChild(list);
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

    const sidebar = document.getElementById('days-nav');
    const detailContainer = document.getElementById('day-content');
    const miniMapContainer = document.getElementById('mini-map');

    if (!sidebar) {
      console.error('Navigation element not found: #days-nav');
      return;
    }
    if (!detailContainer) {
      console.error('Detail container not found: #day-content');
      return;
    }
    if (!miniMapContainer) {
      console.error('Mini map container not found: #mini-map');
      return;
    }

    // Clean previous mini-map instance to avoid memory leaks
    if (miniMap) {
      miniMap.remove();
      miniMap = null;
    }
    const container = L.DomUtil.get('mini-map');
    if (container) container._leaflet_id = null;
    miniMapContainer.innerHTML = '';
    sidebar.querySelectorAll('button').forEach(btn => {
      btn.classList.remove('selected');
      btn.setAttribute('aria-selected', 'false');
    });
    const targetBtn = button || sidebar.querySelector(`button[data-day="${dayNum}"]`);
    if (targetBtn) {
      targetBtn.classList.add('selected');
      targetBtn.setAttribute('aria-selected', 'true');
      targetBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    Array.from(detailContainer.children).forEach(child => {
      if (child.id !== 'mini-map') child.remove();
    });

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

    // Initialize mini-map for the selected day
    miniMap = createMap('mini-map', {
      interactive: true,
      zoomControl: true
    });

    const features = [];
    const currentLatLng = [day.lat, day.lng];

    // Marker for the current day
    const startMarker = L.marker(currentLatLng).addTo(miniMap);
    startMarker.on('click', () => showDay(dayNum));
    features.push(startMarker);

    // If next day exists, draw segment to it
    const nextDay = window.tripData.find(d => d.day === dayNum + 1);
    if (nextDay && typeof nextDay.lat === 'number' && typeof nextDay.lng === 'number') {
      const nextLatLng = [nextDay.lat, nextDay.lng];
      const endMarker = L.marker(nextLatLng).addTo(miniMap);
      endMarker.on('click', () => showDay(nextDay.day));
      const polyline = L.polyline([currentLatLng, nextLatLng], {
        color: '#2563eb',
        weight: 3,
        opacity: 1
      }).addTo(miniMap);
      polyline.on('click', () => showDay(nextDay.day));
      features.push(endMarker, polyline);
    }

    if (features.length) {
      const group = L.featureGroup(features);
      miniMap.fitBounds(group.getBounds(), { padding: [10, 10] });
    } else {
      miniMap.setView(currentLatLng, 8);
    }

    miniMap.invalidateSize();

    block.appendChild(leftCol);
    block.appendChild(rightCol);

    detailContainer.insertBefore(block, miniMapContainer);
    detailContainer.classList.add('fade-in');
    detailContainer.addEventListener('animationend', () => {
      detailContainer.classList.remove('fade-in');
    }, { once: true });

    if (button) {
      const programmeTitle = document.getElementById('programme-title');
      if (programmeTitle) {
        const top = programmeTitle.getBoundingClientRect().top + window.scrollY - STICKY_OFFSET;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  } catch (error) {
    console.error('Error showing day:', error);
    document.getElementById('day-content').innerHTML = `
      <div class="text-red-600 p-4">
        Erreur lors du chargement du jour ${dayNumber}: ${error.message}
      </div>
    `;
  }
}

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
      document.getElementById('day-content').innerHTML = `
        <div class="text-red-600 p-4">
          Erreur: Impossible de charger les données du voyage.
          Vérifiez que le fichier itinerary.json est présent.
        </div>
      `;
    }
  } catch (error) {
    console.error('Error during initialization:', error);
      document.getElementById('day-content').innerHTML = `
        <div class="text-red-600 p-4">
          Erreur lors de l'initialisation: ${error.message}
        </div>
      `;
  }
});

