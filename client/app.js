// Use dedicated API server (always online on Vercel)
const API_URL = 'https://server-5i1vk5gn3-karthikeyan006867s-projects.vercel.app/api';

let events = [];
let editingEventId = null;
let reminders = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    loadStats();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('eventForm').addEventListener('submit', handleSubmitEvent);
    document.getElementById('cancelBtn').addEventListener('click', resetForm);
    document.getElementById('addReminderBtn').addEventListener('click', addReminder);
    document.getElementById('filterCategory').addEventListener('change', filterEvents);
    document.getElementById('syncTimeBtn').addEventListener('click', syncTimeTracking);
}

// Load all events
async function loadEvents() {
    try {
        const response = await fetch(`${API_URL}/events`);
        const data = await response.json();
        events = Array.isArray(data) ? data : [];
        displayEvents(events);
        updateStats();
    } catch (error) {
        console.error('Error loading events:', error);
        events = [];
        displayEvents(events);
        showNotification('Error loading events. Server may be offline.', 'error');
    }
}

// Display events
function displayEvents(eventsToDisplay) {
    const eventsList = document.getElementById('eventsList');
    
    if (!Array.isArray(eventsToDisplay) || eventsToDisplay.length === 0) {
        eventsList.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">No events found. Create your first event!</p>';
        return;
    }

    eventsList.innerHTML = eventsToDisplay.map(event => {
        const startDate = new Date(event.startDate);
        const endDate = event.endDate ? new Date(event.endDate) : null;
        const timeTrackedHours = (event.timeTracked / 3600).toFixed(1);
        
        return `
            <div class="event-card priority-${event.priority}" data-id="${event._id}">
                <div class="event-header">
                    <h3 class="event-title">${event.title}</h3>
                    <span class="event-category">${event.category || 'General'}</span>
                </div>
                <p class="event-description">${event.description || 'No description'}</p>
                <div class="event-date">
                    📅 ${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString()}
                    ${endDate ? ` - ${endDate.toLocaleDateString()}` : ''}
                </div>
                ${event.wakatimeProject ? `<div class="event-date">⏱️ WakaTime: ${event.wakatimeProject}</div>` : ''}
                ${event.reminders && event.reminders.length > 0 ? `<div class="event-date">🔔 ${event.reminders.length} reminder(s)</div>` : ''}
                <div class="event-time-tracked">
                    ⏰ Time Tracked: ${timeTrackedHours}h
                </div>
                <div class="event-actions">
                    <button class="btn-edit" onclick="editEvent('${event._id}')">Edit</button>
                    <button class="btn-delete" onclick="deleteEvent('${event._id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Handle form submission
async function handleSubmitEvent(e) {
    e.preventDefault();
    
    const eventData = {
        title: document.getElementById('eventTitle').value,
        description: document.getElementById('eventDescription').value,
        startDate: document.getElementById('eventStartDate').value,
        endDate: document.getElementById('eventEndDate').value,
        category: document.getElementById('eventCategory').value,
        priority: document.getElementById('eventPriority').value,
        wakatimeProject: document.getElementById('wakatimeProject').value,
        reminders: reminders
    };

    try {
        let response;
        if (editingEventId) {
            response = await fetch(`${API_URL}/events/${editingEventId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });
        } else {
            response = await fetch(`${API_URL}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });
        }

        if (response.ok) {
            showNotification(editingEventId ? 'Event updated!' : 'Event created!', 'success');
            resetForm();
            loadEvents();
        } else {
            showNotification('Error saving event', 'error');
        }
    } catch (error) {
        console.error('Error saving event:', error);
        showNotification('Error saving event', 'error');
    }
}

// Edit event
async function editEvent(id) {
    try {
        const response = await fetch(`${API_URL}/events/${id}`);
        const event = await response.json();
        
        editingEventId = id;
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventStartDate').value = new Date(event.startDate).toISOString().slice(0, 16);
        document.getElementById('eventEndDate').value = event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '';
        document.getElementById('eventCategory').value = event.category || 'other';
        document.getElementById('eventPriority').value = event.priority || 'medium';
        document.getElementById('wakatimeProject').value = event.wakatimeProject || '';
        
        reminders = event.reminders || [];
        displayReminders();
        
        document.getElementById('event-form-section').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading event:', error);
        showNotification('Error loading event', 'error');
    }
}

// Delete event
async function deleteEvent(id) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
        const response = await fetch(`${API_URL}/events/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Event deleted!', 'success');
            loadEvents();
        } else {
            showNotification('Error deleting event', 'error');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        showNotification('Error deleting event', 'error');
    }
}

// Add reminder
function addReminder() {
    const reminderTime = document.getElementById('reminderTime').value;
    if (!reminderTime) {
        showNotification('Please select a reminder time', 'error');
        return;
    }
    
    reminders.push({
        time: reminderTime,
        message: 'Event reminder',
        sent: false
    });
    
    displayReminders();
    document.getElementById('reminderTime').value = '';
}

// Display reminders
function displayReminders() {
    const remindersList = document.getElementById('remindersList');
    remindersList.innerHTML = reminders.map((reminder, index) => `
        <div class="reminder-item">
            <span>🔔 ${new Date(reminder.time).toLocaleString()}</span>
            <button onclick="removeReminder(${index})">Remove</button>
        </div>
    `).join('');
}

// Remove reminder
function removeReminder(index) {
    reminders.splice(index, 1);
    displayReminders();
}

// Reset form
function resetForm() {
    document.getElementById('eventForm').reset();
    editingEventId = null;
    reminders = [];
    displayReminders();
}

// Filter events
function filterEvents() {
    const category = document.getElementById('filterCategory').value;
    if (category === 'all') {
        displayEvents(events);
    } else {
        const filtered = events.filter(event => event.category === category);
        displayEvents(filtered);
    }
}

// Load stats
async function loadStats() {
    try {
        // Load WakaTime stats
        const wakatimeResponse = await fetch(`${API_URL}/wakatime/stats`);
        if (wakatimeResponse.ok) {
            const wakatimeData = await wakatimeResponse.json();
            const wakatimeHours = (wakatimeData.data?.total_seconds / 3600 || 0).toFixed(1);
            document.getElementById('wakatimeHours').textContent = `${wakatimeHours}h`;
        }

        // Load HackaTime stats
        const hackatimeResponse = await fetch(`${API_URL}/hackatime/stats`);
        if (hackatimeResponse.ok) {
            const hackatimeData = await hackatimeResponse.json();
            const hackatimeHours = (hackatimeData.data?.total_seconds / 3600 || 0).toFixed(1);
            document.getElementById('hackatimeHours').textContent = `${hackatimeHours}h`;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Update dashboard stats
function updateStats() {
    const now = new Date();
    const upcoming = events.filter(event => new Date(event.startDate) > now);
    
    document.getElementById('totalEvents').textContent = events.length;
    document.getElementById('upcomingEvents').textContent = upcoming.length;
}

// Sync time tracking
async function syncTimeTracking() {
    if (events.length === 0) {
        showNotification('No events to sync', 'error');
        return;
    }

    showNotification('Syncing time tracking...', 'info');

    try {
        for (const event of events) {
            if (event.wakatimeProject) {
                await fetch(`${API_URL}/time-tracking/sync`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        eventId: event._id,
                        source: 'wakatime'
                    })
                });
            }
        }

        showNotification('Time tracking synced!', 'success');
        loadEvents();
        loadStats();
    } catch (error) {
        console.error('Error syncing time tracking:', error);
        showNotification('Error syncing time tracking', 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--danger-color)' : 'var(--secondary-color)'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
