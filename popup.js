// SusMode - Sustainable Browser Extension
// Popup script for extension initialization

document.addEventListener('DOMContentLoaded', () => {
    console.log('SusMode extension loaded!');
    
    const statusEl = document.getElementById('toggle-status');
    const buttonEl = document.getElementById('toggle-button');
    const metricEnergy = document.getElementById('metric-energy');
    const metricScripts = document.getElementById('metric-scripts');
    const metricAds = document.getElementById('metric-ads');
    const metricVideos = document.getElementById('metric-videos');
    const metricAiDisabled = document.getElementById('metric-ai-disabled');

    // Blocking toggles
    const toggleAi = document.getElementById('toggle-ai');
    const toggleAds = document.getElementById('toggle-ads');
    const toggleScripts = document.getElementById('toggle-scripts');
    const toggleVideos = document.getElementById('toggle-videos');

    if (!statusEl || !buttonEl) return;

    // Energy calculation: ads=0.5kJ, scripts=1kJ, videos=5kJ
    const calculateEnergy = (ads, scripts, videos) => {
        const totalKJ = (ads * 0.5) + (scripts * 1) + (videos * 5);
        const kWh = totalKJ / 3600;
        return kWh.toFixed(2);
    };

    // Update displayed metrics
    const updateMetrics = () => {
        chrome.storage.local.get({
            blockedAds: 0,
            blockedScripts: 0,
            blockedVideos: 0,
            aiDisabled: 0
        }, (result) => {
            const energy = calculateEnergy(result.blockedAds, result.blockedScripts, result.blockedVideos);
            
            if (metricEnergy) metricEnergy.textContent = `${energy} kWh`;
            if (metricScripts) metricScripts.textContent = result.blockedScripts || '0';
            if (metricAds) metricAds.textContent = result.blockedAds || '0';
            if (metricVideos) metricVideos.textContent = result.blockedVideos || '0';
            if (metricAiDisabled) metricAiDisabled.textContent = result.aiDisabled || '0';
        });
    };

    // Initial metrics display
    updateMetrics();

    // Render main toggle status
    const render = (enabled) => {
        statusEl.textContent = enabled ? 'Enabled' : 'Disabled';
        statusEl.style.color = enabled ? '#2b8a3e' : '#c2410c';
        buttonEl.textContent = enabled ? 'Turn off' : 'Turn on';
        buttonEl.style.background = enabled ? '#2b8a3e' : '#c2410c';
    };

    // Load initial state
    chrome.storage.local.get({
        susmodeEnabled: true,
        aiBlockingEnabled: true,
        adsBlockingEnabled: true,
        scriptsBlockingEnabled: true,
        videosBlockingEnabled: true
    }, (result) => {
        render(result.susmodeEnabled);
        toggleAi.checked = result.aiBlockingEnabled;
        toggleAds.checked = result.adsBlockingEnabled;
        toggleScripts.checked = result.scriptsBlockingEnabled;
        toggleVideos.checked = result.videosBlockingEnabled;
    });

    // Main toggle button
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

    // Blocking toggles
    toggleAi.addEventListener('change', () => {
        chrome.storage.local.set({ aiBlockingEnabled: toggleAi.checked }, () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.id) {
                    chrome.tabs.reload(tabs[0].id);
                }
            });
        });
    });

    toggleAds.addEventListener('change', () => {
        chrome.storage.local.set({ adsBlockingEnabled: toggleAds.checked }, () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.id) {
                    chrome.tabs.reload(tabs[0].id);
                }
            });
        });
    });

    toggleScripts.addEventListener('change', () => {
        chrome.storage.local.set({ scriptsBlockingEnabled: toggleScripts.checked }, () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.id) {
                    chrome.tabs.reload(tabs[0].id);
                }
            });
        });
    });

    toggleVideos.addEventListener('change', () => {
        chrome.storage.local.set({ videosBlockingEnabled: toggleVideos.checked }, () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.id) {
                    chrome.tabs.reload(tabs[0].id);
                }
            });
        });
    });

    // Listen for storage changes to update metrics in real-time
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local') {
            if (changes.blockedAds || changes.blockedScripts || changes.blockedVideos) {
                updateMetrics();
            }
        }
    });
});
