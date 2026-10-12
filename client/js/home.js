const eventsContainer = document.getElementById('events-container');

fetch('http://localhost:3060/api/events')
    .then(response => response.json())
    .then(events => {

        eventsContainer.innerHTML = '';

        if (events.length === 0) {

            eventsContainer.innerHTML =
                '<p>No upcoming events are currently available.</p>';

            return;
        }

        events.forEach(event => {

            const eventCard = document.createElement('div');

            eventCard.className = 'event-card';

            const eventDate = new Date(event.event_date);

            const formattedDate = eventDate.toLocaleDateString('en-AU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            eventCard.innerHTML = `
                <h3>${event.event_name}</h3>

                <p>
                    <strong>Category:</strong>
                    ${event.category_name}
                </p>

                <p>
                    <strong>Date:</strong>
                    ${formattedDate}
                </p>

                <p>
                    <strong>Location:</strong>
                    ${event.location}
                </p>

                <p>
                    ${event.purpose}
                </p>

                <a href="event.html?id=${event.event_id}" class="button">
                    View Event
                </a>
            `;

            eventsContainer.appendChild(eventCard);

        });

    })
    .catch(error => {

        console.error('Error loading events:', error);

        eventsContainer.innerHTML =
            '<p>Unable to load events. Please try again later.</p>';

    });