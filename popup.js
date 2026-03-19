// SusMode - Sustainable Browser Extension
// Popup script for extension initialization

document.addEventListener('DOMContentLoaded', () => {
    console.log('SusMode extension loaded!');
    
    // Future functionality can be added here
    // - Initialize event listeners
    // - Fetch and display user data
    // - Update UI elements dynamically
    const statusEl = document.getElementById('toggle-status');
    const buttonEl = document.getElementById('toggle-button');

    if (!statusEl || !buttonEl) return;

    const render = (enabled) => {
        statusEl.textContent = enabled ? 'Enabled' : 'Disabled';
        statusEl.style.color = enabled ? '#2f855a' : '#c05621';
        buttonEl.textContent = enabled ? 'Turn off' : 'Turn on';
        buttonEl.style.background = enabled ? '#2f855a' : '#c05621';
    };

    chrome.storage.local.get({ susmodeEnabled: true }, (result) => {
        render(result.susmodeEnabled);
    });

    buttonEl.addEventListener('click', () => {
        chrome.storage.local.get({ susmodeEnabled: true }, (result) => {
            const nextState = !result.susmodeEnabled;
            chrome.storage.local.set({ susmodeEnabled: nextState }, () => {
                render(nextState);

                if (!nextState) {
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        if (tabs[0]?.id) {
                            chrome.tabs.reload(tabs[0].id);
                        }
                    });
                }
            });
        });
    });
});
