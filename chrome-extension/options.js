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
        }
        if (settings.wakatimeApiKey) {
            document.getElementById('wakatimeApiKey').value = settings.wakatimeApiKey;
        }
        if (settings.hackatimeApiKey) {
            document.getElementById('hackatimeApiKey').value = settings.hackatimeApiKey;
        }
        if (settings.hackatimeUrl) {
            document.getElementById('hackatimeUrl').value = settings.hackatimeUrl;
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
