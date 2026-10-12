const searchForm = document.getElementById('search-form');
const dateInput = document.getElementById('date');
const locationInput = document.getElementById('location');
const categorySelect = document.getElementById('category');
const clearButton = document.getElementById('clear-button');
const message = document.getElementById('message');
const searchResults = document.getElementById('search-results');

fetch('http://localhost:3060/api/categories')
    .then(response => response.json())
    .then(categories => {

        categories.forEach(category => {

            const option = document.createElement('option');

            option.value = category.category_id;
            option.textContent = category.category_name;

            categorySelect.appendChild(option);
        });

    })
    .catch(error => {
        console.error('Error loading categories:', error);
        message.textContent = 'Unable to load event categories.';
    });

searchForm.addEventListener('submit', function(event) {

    event.preventDefault();

    const date = dateInput.value;
    const location = locationInput.value.trim();
    const category = categorySelect.value;

    if (!date && !location && !category) {
        message.textContent = 'Please enter at least one search criterion.';
        searchResults.innerHTML = '';
        return;
    }

    let url = 'http://localhost:3060/api/events/search?';

    const parameters = [];

    if (date) {
        parameters.push('date=' + encodeURIComponent(date));
    }

    if (location) {
        parameters.push('location=' + encodeURIComponent(location));
    }

    if (category) {
        parameters.push('category=' + encodeURIComponent(category));
    }

    url += parameters.join('&');

    message.textContent = 'Searching...';
    searchResults.innerHTML = '';

    fetch(url)
        .then(response => response.json())
        .then(events => {

            message.textContent = '';

            if (events.length === 0) {
                message.textContent = 'No events found matching your search.';
                return;
            }

            message.textContent = events.length + ' event(s) found.';

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

                searchResults.appendChild(eventCard);

            });

        })
        .catch(error => {

            console.error('Error searching events:', error);

            message.textContent =
                'Unable to search events. Please try again.';

        });

});

clearButton.addEventListener('click', function() {

    dateInput.value = '';
    locationInput.value = '';
    categorySelect.value = '';

    message.textContent = '';
    searchResults.innerHTML = '';

});