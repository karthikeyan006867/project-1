// Get API URL from storage or use dedicated API server
let API_URL = 'https://server-5i1vk5gn3-karthikeyan006867s-projects.vercel.app/api';

// Try to get custom API URL from storage
chrome.storage.sync.get(['apiUrl'], (result) => {
    if (result.apiUrl) {
        API_URL = result.apiUrl;
    }
});

// Load events when popup opens
document.addEventListener('DOMContentLoaded', async () => {
    loadEvents();
    loadStats();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('openApp').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://event-manager-hackatime-4wjk7rvrp-karthikeyan006867s-projects.vercel.app' });
    });

    document.getElementById('syncNow').addEventListener('click', syncTimeTracking);
}

async function loadEvents() {
    try {
        const response = await fetch(`${API_URL}/events/upcoming/list`);
        const events = await response.json();
        
        displayEvents(events);
        updateEventStats(events);
    } catch (error) {
        console.error('Error loading events:', error);
        document.getElementById('eventsList').innerHTML = `
            <div class="empty-state">
                <p>Unable to connect to server</p>
                <p style="font-size: 0.8rem; margin-top: 10px;">Make sure the backend is running</p>
            </div>
        `;
    }
}

function displayEvents(events) {
    const eventsList = document.getElementById('eventsList');
    
    if (events.length === 0) {
        eventsList.innerHTML = `
            <div class="empty-state">
                <p>No upcoming events</p>
                <p style="font-size: 0.8rem; margin-top: 10px;">Create your first event!</p>
            </div>
        `;
        return;
    }

    eventsList.innerHTML = events.slice(0, 5).map(event => {
        const startDate = new Date(event.startDate);
        const now = new Date();
        const daysUntil = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
        
        return `
            <div class="event-item priority-${event.priority}">
                <div class="event-title">${event.title}</div>
                <div class="event-date">
                    📅 ${startDate.toLocaleDateString()} - ${daysUntil > 0 ? `${daysUntil} days` : 'Today'}
                </div>
                <span class="event-category">${event.category || 'General'}</span>
            </div>
        `;
    }).join('');
}

function updateEventStats(events) {
    const now = new Date();
    const upcoming = events.filter(event => new Date(event.startDate) > now);
    
    document.getElementById('totalEvents').textContent = events.length;
    document.getElementById('upcomingEvents').textContent = upcoming.length;
}

async function loadStats() {
    try {
        // Load WakaTime stats
        const wakatimeResponse = await fetch(`${API_URL}/wakatime/stats`);
        if (wakatimeResponse.ok) {
            const wakatimeData = await wakatimeResponse.json();
            const hours = (wakatimeData.data?.total_seconds / 3600 || 0).toFixed(1);
            document.getElementById('wakatimeHours').textContent = `${hours}h`;
        }

        // Load HackaTime stats
        const hackatimeResponse = await fetch(`${API_URL}/hackatime/stats`);
        if (hackatimeResponse.ok) {
            const hackatimeData = await hackatimeResponse.json();
            const hours = (hackatimeData.data?.total_seconds / 3600 || 0).toFixed(1);
            document.getElementById('hackatimeHours').textContent = `${hours}h`;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function syncTimeTracking() {
    try {
        const response = await fetch(`${API_URL}/events`);
        const events = await response.json();

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

        loadStats();
        showNotification('Time tracking synced!');
    } catch (error) {
        console.error('Error syncing:', error);
    }
}

function showNotification(message) {
    // Simple notification - could be enhanced
    const button = document.getElementById('syncNow');
    const originalText = button.textContent;
    button.textContent = message;
    setTimeout(() => {
        button.textContent = originalText;
    }, 2000);
}
