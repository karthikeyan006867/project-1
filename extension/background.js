// Use dedicated API server (always online)
const API_URL = 'https://server-5i1vk5gn3-karthikeyan006867s-projects.vercel.app/api';
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('Event Manager Extension installed');
    
    // Set up periodic alarm for checking reminders
    chrome.alarms.create('checkReminders', { periodInMinutes: 5 });
    
    // Set up periodic alarm for syncing time tracking
    chrome.alarms.create('syncTimeTracking', { periodInMinutes: 30 });
});

// Listen for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'checkReminders') {
        checkReminders();
    } else if (alarm.name === 'syncTimeTracking') {
        syncTimeTracking();
    }
});

// Check for pending reminders
async function checkReminders() {
    try {
        const response = await fetch(`${API_URL}/reminders/pending`);
        const reminders = await response.json();
        
        reminders.forEach(reminder => {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon128.png',
                title: '🔔 Event Reminder',
                message: `${reminder.eventTitle}\n${reminder.message || 'Event coming up!'}`,
                priority: 2
            });
            
            // Mark reminder as sent
            fetch(`${API_URL}/reminders/${reminder.eventId}/${reminder.reminderTime}/mark-sent`, {
                method: 'PUT'
            });
        });
    } catch (error) {
        console.error('Error checking reminders:', error);
    }
}

// Sync time tracking
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
            
            // Also sync HackaTime if configured
            if (event.hackatimeProject) {
                await fetch(`${API_URL}/time-tracking/sync`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        eventId: event._id,
                        source: 'hackatime'
                    })
                });
            }
        }
        
        console.log('Time tracking synced successfully');
    } catch (error) {
        console.error('Error syncing time tracking:', error);
    }
}

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'syncNow') {
        syncTimeTracking().then(() => {
            sendResponse({ success: true });
        });
        return true; // Keep channel open for async response
    }
    
    if (request.action === 'checkReminders') {
        checkReminders().then(() => {
            sendResponse({ success: true });
        });
        return true;
    }
});

// Track active tab time (optional feature)
let activeTabStartTime = null;
let activeTabUrl = null;

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        activeTabStartTime = Date.now();
        activeTabUrl = tab.url;
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
        activeTabStartTime = Date.now();
        activeTabUrl = tab.url;
    }
});

// Continuous tracking - check every minute if user is working on event-related projects
setInterval(async () => {
    try {
        // Get current WakaTime/HackaTime activity
        const settings = await chrome.storage.sync.get(['wakatimeApiKey', 'hackatimeApiKey']);
        
        if (settings.wakatimeApiKey) {
            // Could implement real-time tracking here
            // This is a placeholder for continuous tracking feature
            console.log('Continuous tracking active');
        }
    } catch (error) {
        console.error('Error in continuous tracking:', error);
    }
}, 60000); // Check every minute
