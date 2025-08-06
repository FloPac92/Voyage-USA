// Global variables
let currentDay = 1;
let map;
const markerManager = {
  markers: new Map(),
  addMarker(day, marker) {
    this.markers.set(day, marker);
    console.log(`Marker added for day ${day}. Total markers: ${this.markers.size}`);
  },
  getMarker(day) {
    return this.markers.get(day);
  },
  resetAllMarkers() {
    this.markers.forEach((marker, day) => {
      marker.setIcon(this.createIcon(false));
    });
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
  if (Array.isArray(window.tripData)) {
    window.tripData.forEach(point => {
      const marker = L.marker([point.lat, point.lng], {
        icon: markerManager.createIcon(false)
      }).addTo(map);
      markerManager.addMarker(point.day, marker);
      const popupContent = `
        <div class="marker-popup">
          <h3 class="font-bold text-lg mb-2">${point.name}</h3>
          <div class="text-gray-700">Jour ${point.day}</div>
        </div>
      `;
      marker.bindPopup(popupContent, { className: 'custom-popup' });
      marker.bindTooltip(`Jour ${point.day}`, { direction: 'top', sticky: true });
      marker.on('mouseover', () => marker.openTooltip());
      marker.on('mouseout', () => marker.closeTooltip());
      marker.on('click', function() {
        markerManager.markers.forEach((m, d) => {
          if (m !== marker) m.closePopup();
        });
        marker.openTooltip();
        showDay(point.day);
        const navBtn = document.querySelector(`.day-button[data-day="${point.day}"]`);
        if (navBtn) {
          document.querySelectorAll('.day-button').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.day, 10) === point.day);
          });
          navBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    });
  }

  // Charger le tracé KML (sans les points, déjà gérés)
  console.log('Loading KML file...');
  omnivore.kml('./itinary.kml')
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
  nav.innerHTML = data.map(day => `
    <button
      class="day-button ${currentDay === day.day ? 'active' : ''}"
      data-day="${day.day}"
      onclick="showDay(${day.day})"
    >
      ${day.jour}
    </button>
  `).join('');
}

// Show day content
async function showDay(dayNumber) {
  try {
    // S'assurer que le numéro de jour est bien un entier
    const dayNum = parseInt(dayNumber, 10);
    console.log('Showing day:', dayNum);
    console.log('Current tripData:', window.tripData);
    currentDay = dayNum;

    // Recherche du jour par son numéro
    const day = window.tripData.find(d => d.day === dayNum);
    console.log('Found day:', day);
    
    if (!day) {
      console.error('Day not found in tripData:', dayNumber);
      console.log('Available days:', window.tripData.map(d => d.day));
      return;
    }

    // Update navigation
    document.querySelectorAll('.day-button').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.day, 10) === dayNum);
    });
    const activeBtn = document.querySelector(`.day-button[data-day="${dayNum}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Utiliser directement les données du jour
    const detailedInfo = day;

    // Update content
    document.getElementById('day-title').textContent = detailedInfo.jour || `Jour ${detailedInfo.day}`;
    document.getElementById('wake-up').textContent = detailedInfo.wake || '';
    document.getElementById('sleep').textContent = detailedInfo.sleep || '';
    document.getElementById('distance').textContent = detailedInfo.travel || '';

    // Update description
    const description = `
      <div class="mb-6 text-gray-700">
        ${detailedInfo.explication || ''}
      </div>
    `;

    // Update timeline
    const timeline = `
      <div class="space-y-4">
        ${(detailedInfo.agenda || []).map(item => {
          const [time, activity] = item.split(' : ');
          return `
            <div class="timeline-item relative pl-4">
              <div class="flex items-start">
                <span class="text-blue-600 font-medium w-32 shrink-0">${time}</span>
                <span class="text-gray-700">${activity}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Update activities list
    const activitiesList = document.getElementById('activities-list');
    activitiesList.innerHTML = description + timeline;

    // Update photos
    const photosGrid = document.getElementById('photos-grid');
    photosGrid.innerHTML = `
      <img
        src="jour${day.day}${day.day === 1 ? '.jpg' : '.png'}"
        alt="${detailedInfo.photo}"
        class="w-full h-[calc(100vh-200px)] object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-lg"
        onclick="openLightbox('jour${day.day}${day.day === 1 ? '.jpg' : '.png'}')"
        onerror="this.style.display='none'"
      >
    `;

    // Update map
    updateMapMarker(day);
} catch (error) {
  console.error('Error showing day:', error);
  document.getElementById('day-content').innerHTML = `
    <div class="text-red-600 p-4">
      Erreur lors du chargement du jour ${dayNumber}: ${error.message}
    </div>
  `;
}
}

// Helper function to create marker icons
function createMarkerIcon(isActive = false) {
  return L.divIcon({
    className: isActive ? 'marker-active' : 'marker-default',
    html: `<div class="marker-${isActive ? 'active' : 'default'}"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
}

// Update map marker
function updateMapMarker(day) {
  try {
    if (!day || !day.day) {
      console.error('Invalid day object:', day);
      return;
    }
    const activeMarker = markerManager.getMarker(day.day);
    if (!activeMarker) {
      console.error('No marker found for day:', day.day);
      return;
    }
    // Réinitialiser tous les marqueurs et activer le marqueur actif
    markerManager.resetAllMarkers();
    activeMarker.setIcon(markerManager.createIcon(true));
    // Centrer la carte sur le marqueur actif avec animation
    const latlng = activeMarker.getLatLng();
    map.flyTo(latlng, 10, { animate: true, duration: 1 });
    // Fermer tous les popups puis ouvrir celui du marqueur actif
    markerManager.markers.forEach(m => m.closePopup());
    setTimeout(() => {
      activeMarker.openPopup();
      activeMarker.openTooltip();
    }, 500);
  } catch (error) {
    console.error('Error updating active marker:', error);
  }
}

// Lightbox functions
function openLightbox(src) {
  document.getElementById('lightbox').classList.add('active');
  document.getElementById('lightbox-img').src = src;
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
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

