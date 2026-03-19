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
    const metricEnergy = document.getElementById('metric-energy');
    const metricScripts = document.getElementById('metric-scripts');
    const metricAds = document.getElementById('metric-ads');
    const metricVideos = document.getElementById('metric-videos');
    const metricAiDisabled = document.getElementById('metric-ai-disabled');

    if (!statusEl || !buttonEl) return;

    const defaults = {
        energy: '67.67 kWh',
        scripts: '6767',
        ads: '676767',
        videos: '67',
        aiDisabled: '6677'
    };
 // values to be replaced one we start tracking the actual data
    if (metricEnergy) metricEnergy.textContent = defaults.energy;
    if (metricScripts) metricScripts.textContent = defaults.scripts;
    if (metricAds) metricAds.textContent = defaults.ads;
    if (metricVideos) metricVideos.textContent = defaults.videos;
    if (metricAiDisabled) metricAiDisabled.textContent = defaults.aiDisabled;

    const render = (enabled) => {
        statusEl.textContent = enabled ? 'Enabled' : 'Disabled';
        statusEl.style.color = enabled ? '#2b8a3e' : '#c2410c';
        buttonEl.textContent = enabled ? 'Turn off' : 'Turn on';
        buttonEl.style.background = enabled ? '#2b8a3e' : '#c2410c';
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
