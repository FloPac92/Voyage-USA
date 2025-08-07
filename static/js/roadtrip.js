window.onload = async () => {
  const kmlPath = 'usa-roadtrip.kml';
  const jsonPath = 'itinerary.json';

  // Initialize Leaflet map
  let map;
  if (window.L) {
    map = L.map('map-container').setView([36.17, -115.90], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    if (window.omnivore) {
      omnivore.kml(kmlPath)
        .on('ready', function() {
          this.addTo(map);
          map.fitBounds(this.getBounds());
        })
        .on('error', () => document.getElementById('map-error').classList.remove('hidden'));
    } else {
      document.getElementById('map-error').classList.remove('hidden');
    }
  } else {
    document.getElementById('map-error').classList.remove('hidden');
  }

  // Load JSON data
  let days;
  try {
    const res = await fetch(jsonPath);
    if (!res.ok) throw new Error(res.status);
    days = await res.json();
  } catch (e) {
    console.error('Échec JSON', e);
    return;
  }

  // Build sidebar buttons
  const nav = document.getElementById('nav-buttons');
  days.forEach((d, i) => {
    const btn = document.createElement('button');
    btn.textContent = d.jour;
    btn.className = 'day-button';
    btn.addEventListener('click', () => displayDay(i));
    nav.appendChild(btn);
  });

  // Display first day
  displayDay(0);

  function displayDay(idx) {
    // sidebar active
    Array.from(nav.children).forEach((btn, i) => btn.classList.toggle('active', i === idx));
    const d = days[idx];
    const reveil = d.wake || '';
    const nuit = d.sleep || '';
    const trajet = d.travel || 'Aucun';
    // fade out content
    const container = document.getElementById('day-content');
    container.classList.add('hide');
    setTimeout(() => {
      let html = '';
      html += `<h2 class="text-2xl font-bold mb-2">${d.jour} – ${d.jour}</h2>`;
      html += `<div class="flex space-x-4 mb-4">
                     <div>⏰ ${reveil}</div>
                     <div>🛏️ ${nuit}</div>
                     <div>🚗 ${trajet}</div>
                   </div>`;
      html += `<p class="mb-4">${d.explication}</p>`;
      html += '<ul class="list-disc list-inside mb-4">';
      d.agenda.forEach(a => { html += `<li>${a}</li>`; });
      html += '</ul>';
      html += `<figure class="mb-4">
                     <img src="jour${idx+1}.jpg" alt="Photo ${d.jour}" class="rounded mx-auto" />
                     <figcaption class="text-sm text-center text-gray-500">${d.photo}</figcaption>
                   </figure>`;
      container.innerHTML = html;
      container.classList.remove('hide');
    }, 300);
  }
};
