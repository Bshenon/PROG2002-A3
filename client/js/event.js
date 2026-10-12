
const API_BASE = 'http://localhost:3060/api';

const eventMessage = document.getElementById('event-message');
const eventDetails = document.getElementById('event-details');
const registrationSection = document.getElementById('registration-section');
const registrationForm = document.getElementById('registration-form');
const registrationMessage = document.getElementById('registration-message');
const registrationsList = document.getElementById('registrations-list');
const registerButton = document.getElementById('register-button');

const parameters = new URLSearchParams(window.location.search);
const eventId = parameters.get('id');

// Safely display text received from the API.
function addText(parent, tag, label, value) {
    const element = document.createElement(tag);

    if (label) {
        const strong = document.createElement('strong');
        strong.textContent = label + ' ';
        element.appendChild(strong);
    }

    element.appendChild(
        document.createTextNode(String(value ?? ''))
    );

    parent.appendChild(element);
    return element;
}

// Display registrations with the newest registrations first.
function showRegistrations(registrations) {
    registrationsList.replaceChildren();

    if (!Array.isArray(registrations) || registrations.length === 0) {
        registrationsList.textContent = 'No registrations yet.';
        return;
    }

    const sorted = [...registrations].sort((a, b) => {
        const first = new Date(a.registered_at || 0);
        const second = new Date(b.registered_at || 0);

        return second - first;
    });

    sorted.forEach(registration => {
        const card = document.createElement('div');
        card.className = 'event-detail-card';

        addText(
            card,
            'p',
            'Name:',
            registration.full_name || 'Registrant'
        );

        addText(
            card,
            'p',
            'Tickets:',
            registration.ticket_quantity ?? 'Not specified'
        );

        const dateValue = registration.registered_at;

        if (dateValue) {
            const date = new Date(dateValue);

            if (!Number.isNaN(date.getTime())) {
                addText(
                    card,
                    'p',
                    'Registered:',
                    date.toLocaleString('en-AU')
                );
            }
        }

        registrationsList.appendChild(card);
    });
}

// Load event details and existing registrations.
async function loadEvent() {
    if (!eventId || !/^\d+$/.test(eventId)) {
        eventMessage.textContent = 'No valid event was selected.';
        registrationSection.hidden = true;
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE}/events/${encodeURIComponent(eventId)}`
        );

        if (!response.ok) {
            throw new Error('Event not found');
        }

        const event = await response.json();

        eventMessage.textContent = '';
        eventDetails.replaceChildren();

        const card = document.createElement('div');
        card.className = 'event-detail-card';

        addText(card, 'h2', '', event.event_name);
        addText(card, 'p', 'Organisation:', event.organisation_name);
        addText(card, 'p', 'Category:', event.category_name);

        const eventDate = new Date(event.event_date);

        const formattedDate = Number.isNaN(eventDate.getTime())
            ? event.event_date
            : eventDate.toLocaleDateString('en-AU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

        addText(card, 'p', 'Date:', formattedDate);

        addText(
            card,
            'p',
            'Time:',
            String(event.event_time || '').substring(0, 5)
        );

        addText(card, 'p', 'Location:', event.location);
        addText(card, 'p', 'Purpose:', event.purpose);

        addText(card, 'h3', '', 'About This Event');
        addText(card, 'p', '', event.description);

        addText(card, 'h3', '', 'Ticket Information');

        const ticketPrice = Number(event.ticket_price || 0);

        addText(
            card,
            'p',
            'Ticket Price:',
            ticketPrice > 0
                ? '$' + ticketPrice.toFixed(2)
                : 'Free'
        );

        const goal = Number(event.fundraising_goal || 0);
        const progress = Number(event.fundraising_progress || 0);

        const percentage = goal > 0
            ? Math.max(0, Math.min(100, (progress / goal) * 100))
            : 0;

        const fundraisingBox = document.createElement('div');
        fundraisingBox.className = 'fundraising-box';

        addText(fundraisingBox, 'h3', '', 'Fundraising Progress');

        addText(
            fundraisingBox,
            'p',
            '',
            `$${progress.toFixed(2)} raised of $${goal.toFixed(2)}`
        );

        const track = document.createElement('div');
        track.className = 'progress-track';

        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        fill.style.width = `${percentage}%`;

        track.appendChild(fill);
        fundraisingBox.appendChild(track);

        addText(
            fundraisingBox,
            'p',
            '',
            `${percentage.toFixed(1)}% of goal reached`
        );

        card.appendChild(fundraisingBox);
        eventDetails.appendChild(card);

        // Show the registration form only for active, upcoming events.
        const status = String(event.status || '').toLowerCase();
        const eventStart = new Date(
            `${String(event.event_date).substring(0, 10)}T${String(event.event_time || '00:00').substring(0, 8)}`
        );

        const canRegister =
            status === 'active' &&
            !event.suspended &&
            !Number.isNaN(eventStart.getTime()) &&
            eventStart > new Date();

        registrationSection.hidden = false;
        registrationForm.hidden = !canRegister;

        if (!canRegister) {
            registrationMessage.textContent =
                'Registration is unavailable for this event.';
        } else {
            registrationMessage.textContent = '';
        }

        showRegistrations(event.registrations);

    } catch (error) {
        console.error('Error loading event:', error);

        eventMessage.textContent =
            'Unable to load this event. Please check the API server.';

        registrationSection.hidden = true;
    }
}

// Submit a new registration to the backend.
registrationForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const fullName =
        document.getElementById('register-name').value.trim();

    const email =
        document.getElementById('register-email').value.trim();

    const phone =
        document.getElementById('register-phone').value.trim();

    const ticketQuantity =
        Number(document.getElementById('register-tickets').value);

    registrationMessage.textContent = '';

    if (fullName.length < 2) {
        registrationMessage.textContent =
            'Please enter your full name.';
        return;
    }

    if (!registrationForm.checkValidity()) {
        registrationForm.reportValidity();
        return;
    }

    if (!Number.isInteger(ticketQuantity) || ticketQuantity < 1) {
        registrationMessage.textContent =
            'Please enter a valid number of tickets.';
        return;
    }

    const registration = {
        full_name: fullName,
        email: email,
        phone: phone,
        ticket_quantity: ticketQuantity
    };

    registerButton.disabled = true;
    registerButton.textContent = 'Registering...';

    try {
        const response = await fetch(
            `${API_BASE}/events/${encodeURIComponent(eventId)}/registrations`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registration)
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || 'Registration failed.'
            );
        }

        registrationForm.reset();

        await loadEvent();

        registrationMessage.textContent =
            result.message || 'Registration successful!';

    } catch (error) {
        registrationMessage.textContent =
            error.message || 'Unable to register. Please try again.';
    } finally {
        registerButton.disabled = false;
        registerButton.textContent = 'Register';
    }
});

// Load the selected event when the page opens.
loadEvent();
