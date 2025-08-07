fetch('itinerary.json')
  .then(r => r.json())
  .then(days => {
    const container = document.getElementById('programme');
    days.forEach(d => {
      const block = document.createElement('div');
      block.className = 'day-block';

      const filArianeText = `Jour ${d.day} sur 16 – ${d.name}`;
      const filAriane = document.createElement('p');
      filAriane.className = 'fil-ariane';
      filAriane.textContent = filArianeText;
      block.appendChild(filAriane);

      const title = document.createElement('h3');
      title.textContent = d.jour || `Jour ${d.day}`;
      block.appendChild(title);

      if (d.travel && d.travel.trim() !== '' && d.travel.toLowerCase() !== 'aucun') {
        const trip = document.createElement('p');
        trip.textContent = d.travel;
        block.appendChild(trip);
      }

      const agenda = document.createElement('ul');
      d.agenda.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        agenda.appendChild(li);
      });
      block.appendChild(agenda);

      const desc = document.createElement('p');
      desc.textContent = d.explication;
      block.appendChild(desc);

      const img = document.createElement('img');
      img.src = `jour${d.day}.jpg`;
      img.alt = d.photo || title.textContent;
      img.onerror = () => { img.src = `jour${d.day}.png`; };
      block.appendChild(img);

      container.appendChild(block);
    });
  })
  .catch(err => console.error('Erreur de chargement du programme', err));
