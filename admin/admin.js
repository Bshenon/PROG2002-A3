
const API_BASE = "https://24286114.it.scu.edu.au/PROG2002-A3-api/api";

const eventsBody = document.getElementById("eventsBody");
const form = document.getElementById("eventForm");
const editor = document.getElementById("editor");
const messageBox = document.getElementById("message");
const saveBtn = document.getElementById("saveBtn");

let editingId = null;
let events = [];

// Send requests to the backend
async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, options);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || `Request failed: ${response.status}`);
    }

    return result;
}

// Display success or error messages
function showMessage(text, isError = false) {
    messageBox.textContent = text;
    messageBox.className = isError ? "error" : "";
    messageBox.hidden = false;
}

// Create safe table cells
function makeCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value == null ? "" : String(value);
    row.appendChild(cell);
    return cell;
}

// Display all events
function displayEvents() {
    eventsBody.replaceChildren();

    for (const event of events) {
        const row = document.createElement("tr");

        makeCell(row, event.event_id);
        makeCell(row, event.event_name);
        makeCell(row, String(event.event_date || "").slice(0, 10));
        makeCell(row, event.location);

        const statusCell = makeCell(row, "");
        const status = document.createElement("span");

        status.textContent = event.status || "Active";
        status.className =
            `status status-${String(event.status || "Active").toLowerCase()}`;

        statusCell.appendChild(status);

        const actions = makeCell(row, "");
        actions.className = "actions";

        const edit = document.createElement("button");
        edit.textContent = "Edit";
        edit.addEventListener("click", () => editEvent(event.event_id));

        const remove = document.createElement("button");
        remove.textContent = "Delete";
        remove.className = "danger";
        remove.addEventListener("click", () => deleteEvent(event.event_id));

        actions.append(edit, remove);
        eventsBody.appendChild(row);
    }

    if (events.length === 0) {
        const row = document.createElement("tr");
        const cell = makeCell(row, "No events found.");
        cell.colSpan = 6;
        eventsBody.appendChild(row);
    }

    document.getElementById("totalCount").textContent = events.length;

    for (const status of ["Active", "Past", "Suspended"]) {
        document.getElementById(
            `${status.toLowerCase()}Count`
        ).textContent = events.filter(e => e.status === status).length;
    }
}

// Retrieve all events
async function loadEvents() {
    try {
        events = await request("/admin/events");
        displayEvents();
    } catch (error) {
        showMessage(`Could not load events: ${error.message}`, true);
    }
}

// Load category and organisation dropdowns
async function loadDropdowns() {
    const [categories, organisations] = await Promise.all([
        request("/categories"),
        request("/organisations")
    ]);

    populateSelect(
        "categorySelect",
        categories,
        "category_id",
        "category_name"
    );

    populateSelect(
        "organisationSelect",
        organisations,
        "organisation_id",
        "organisation_name"
    );
}

function populateSelect(id, records, valueKey, labelKey) {
    const select = document.getElementById(id);

    select.replaceChildren(
        new Option(
            id === "categorySelect"
                ? "Select Category"
                : "Select Organisation",
            ""
        )
    );

    for (const record of records) {
        select.add(new Option(record[labelKey], record[valueKey]));
    }
}

// Show event form
function openEditor() {
    editor.hidden = false;
    editor.scrollIntoView({ behavior: "smooth" });
}

// Add new event
function addEvent() {
    editingId = null;
    form.reset();

    document.getElementById("formTitle").textContent = "Add New Event";
    document.getElementById("registrationsPanel").hidden = true;

    form.elements.fundraising_progress.value = "0";

    openEditor();
}

// Edit existing event
async function editEvent(id) {
    try {
        const event = await request(`/admin/events/${id}`);

        editingId = id;
        form.reset();

        const fields = [
            "organisation_id",
            "category_id",
            "event_name",
            "location",
            "purpose",
            "description",
            "ticket_price",
            "fundraising_goal",
            "fundraising_progress",
            "status"
        ];

        for (const field of fields) {
            form.elements[field].value = event[field] ?? "";
        }

        form.elements.event_date.value =
            String(event.event_date || "").slice(0, 10);

        form.elements.event_time.value =
            String(event.event_time || "").slice(0, 5);

        document.getElementById("formTitle").textContent =
            `Edit Event #${id}`;

        displayRegistrations(event.registrations || []);
        openEditor();

    } catch (error) {
        showMessage(`Could not open event: ${error.message}`, true);
    }
}

// Display registrations
function displayRegistrations(registrations) {
    const body = document.getElementById("registrationsBody");
    body.replaceChildren();

    if (registrations.length === 0) {
        const row = document.createElement("tr");
        const cell = makeCell(row, "No registrations for this event.");
        cell.colSpan = 5;
        body.appendChild(row);
    }

    for (const registration of registrations) {
        const row = document.createElement("tr");

        makeCell(row, registration.full_name);
        makeCell(row, registration.email);
        makeCell(row, registration.phone);
        makeCell(row, registration.ticket_quantity);
        makeCell(row, registration.registered_at);

        body.appendChild(row);
    }

    document.getElementById("registrationsPanel").hidden = false;
}

// Collect form data
function getFormData() {
    const data = Object.fromEntries(new FormData(form).entries());

    for (const field of ["organisation_id", "category_id"]) {
        data[field] = Number(data[field]);
    }

    for (const field of [
        "ticket_price",
        "fundraising_goal",
        "fundraising_progress"
    ]) {
        data[field] = Number(data[field]);
    }

    return data;
}

// Save new or updated event
async function saveEvent(event) {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const data = getFormData();

    if (
        data.ticket_price < 0 ||
        data.fundraising_goal < 0 ||
        data.fundraising_progress < 0
    ) {
        showMessage("Numeric values cannot be negative.", true);
        return;
    }

    const isEditing = editingId !== null;
    const path = isEditing ? `/events/${editingId}` : "/events";
    const method = isEditing ? "PUT" : "POST";

    saveBtn.disabled = true;

    try {
        await request(path, {
            method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        editor.hidden = true;

        showMessage(
            isEditing
                ? "Event updated successfully."
                : "Event created successfully."
        );

        await loadEvents();

        document.getElementById("events").scrollIntoView({
            behavior: "smooth"
        });

    } catch (error) {
        showMessage(`Unable to save event: ${error.message}`, true);
    } finally {
        saveBtn.disabled = false;
    }
}

// Delete event
async function deleteEvent(id) {
    if (!confirm(`Are you sure you want to delete event #${id}?`)) {
        return;
    }

    try {
        await request(`/events/${id}`, {
            method: "DELETE"
        });

        showMessage("Event deleted successfully.");
        await loadEvents();

    } catch (error) {
        showMessage(`Cannot delete event: ${error.message}`, true);
    }
}

// Button actions
document.getElementById("addBtn").addEventListener("click", addEvent);

document.getElementById("navAdd").addEventListener("click", addEvent);

document.getElementById("refreshBtn").addEventListener("click", loadEvents);

document.getElementById("cancelBtn").addEventListener("click", () => {
    editor.hidden = true;
    editingId = null;
});

form.addEventListener("submit", saveEvent);

// Start dashboard
async function initialise() {
    try {
        await loadDropdowns();
    } catch (error) {
        showMessage(
            `Could not load form options: ${error.message}`,
            true
        );
    }

    await loadEvents();
}

initialise();
