// Load saved settings
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    
    document.getElementById('settingsForm').addEventListener('submit', saveSettings);
});

function loadSettings() {
    chrome.storage.sync.get([
        'apiUrl',
        'wakatimeApiKey',
        'hackatimeApiKey',
        'hackatimeUrl',
        'enableNotifications',
        'enableAutoSync'
    ], (settings) => {
        if (settings.apiUrl) {
            document.getElementById('apiUrl').value = settings.apiUrl;
        } else {
            document.getElementById('apiUrl').value = 'https://server-5i1vk5gn3-karthikeyan006867s-projects.vercel.app/api';
        }
        if (settings.wakatimeApiKey) {
            document.getElementById('wakatimeApiKey').value = settings.wakatimeApiKey;
        }
        if (settings.hackatimeApiKey) {
            document.getElementById('hackatimeApiKey').value = settings.hackatimeApiKey;
        } else {
            document.getElementById('hackatimeApiKey').value = '1882521f-5422-498b-a22d-85ac59259506';
        }
        if (settings.hackatimeUrl) {
            document.getElementById('hackatimeUrl').value = settings.hackatimeUrl;
        } else {
            document.getElementById('hackatimeUrl').value = 'https://hackatime.hackclub.com/api/hackatime/v1';
        }
        
        document.getElementById('enableNotifications').checked = settings.enableNotifications !== false;
        document.getElementById('enableAutoSync').checked = settings.enableAutoSync !== false;
    });
}

function saveSettings(e) {
    e.preventDefault();
    
    const settings = {
        apiUrl: document.getElementById('apiUrl').value,
        wakatimeApiKey: document.getElementById('wakatimeApiKey').value,
        hackatimeApiKey: document.getElementById('hackatimeApiKey').value,
        hackatimeUrl: document.getElementById('hackatimeUrl').value,
        enableNotifications: document.getElementById('enableNotifications').checked,
        enableAutoSync: document.getElementById('enableAutoSync').checked
    };
    
    chrome.storage.sync.set(settings, () => {
        // Show success message
        const successMessage = document.getElementById('successMessage');
        successMessage.style.display = 'block';
        
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    });
}
