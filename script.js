fetch('itinerary.json')
  .then(r => r.json())
  .then(days => {
    const sidebar = document.getElementById('sidebar-programme');
    const detailContainer = document.getElementById('jour-detail');

    function showDay(day, button) {
      sidebar.querySelectorAll('button').forEach(btn => {
        if (btn !== button) btn.classList.remove('selected');
      });
      const isSelected = button.classList.toggle('selected');

      detailContainer.innerHTML = '';
      if (!isSelected) return;
      const block = document.createElement('div');
      block.classList.add('day-block', 'fade-in');

      const title = document.createElement('h3');
      title.textContent = day.jour || `Jour ${day.day}`;
      block.appendChild(title);

      if (day.travel && day.travel.trim() !== '' && day.travel.toLowerCase() !== 'aucun') {
        const trip = document.createElement('p');
        trip.textContent = day.travel;
        block.appendChild(trip);
      }

      const agenda = document.createElement('ul');
      day.agenda.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        agenda.appendChild(li);
      });
      block.appendChild(agenda);

      const desc = document.createElement('p');
      desc.textContent = day.explication;
      block.appendChild(desc);

      const img = document.createElement('img');
      img.src = `jour${day.day}.jpg`;
      img.alt = day.photo || title.textContent;
      img.onerror = () => { img.src = `jour${day.day}.png`; };
      block.appendChild(img);

      detailContainer.appendChild(block);
    }

    days.forEach(d => {
      const btn = document.createElement('button');
      btn.textContent = `Jour ${d.day}`;
      btn.addEventListener('click', () => showDay(d, btn));
      sidebar.appendChild(btn);
    });

    const firstBtn = sidebar.querySelector('button');
    if (firstBtn) firstBtn.click();
  })
  .catch(err => console.error('Erreur de chargement du programme', err));

