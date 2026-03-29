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
    const toggleTabSuspension = document.getElementById('toggle-tab-suspension');
    const toggleThrottling = document.getElementById('toggle-throttling');
    const whitelistBtn = document.getElementById('whitelist-btn');
    const viewWhitelistBtn = document.getElementById('view-whitelist-btn');
    const whitelistModal = document.getElementById('whitelist-modal');
    const whitelistList = document.getElementById('whitelist-list');
    const closeModalBtn = document.getElementById('close-whitelist-modal');

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
        videosBlockingEnabled: true,
        tabSuspensionEnabled: true,
        throttlingEnabled: true,
        whitelistedSites: []
    }, (result) => {
        render(result.susmodeEnabled);
        toggleAi.checked = result.aiBlockingEnabled;
        toggleAds.checked = result.adsBlockingEnabled;
        toggleScripts.checked = result.scriptsBlockingEnabled;
        toggleVideos.checked = result.videosBlockingEnabled;
        if (toggleTabSuspension) toggleTabSuspension.checked = result.tabSuspensionEnabled;
        if (toggleThrottling) toggleThrottling.checked = result.throttlingEnabled;

        if (whitelistBtn) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && tabs[0].url) {
                    try {
                        const hostname = new URL(tabs[0].url).hostname;
                        if (result.whitelistedSites.includes(hostname)) {
                            whitelistBtn.textContent = 'Remove from Whitelist';
                            whitelistBtn.style.background = '#c2410c';
                        }
                    } catch (e) { }
                }
            });
        }
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

    if (toggleTabSuspension) {
        toggleTabSuspension.addEventListener('change', () => {
            chrome.storage.local.set({ tabSuspensionEnabled: toggleTabSuspension.checked });
        });
    }

    if (toggleThrottling) {
        toggleThrottling.addEventListener('change', () => {
            chrome.storage.local.set({ throttlingEnabled: toggleThrottling.checked });
        });
    }

    if (whitelistBtn) {
        whitelistBtn.addEventListener('click', () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (!tabs[0] || !tabs[0].url) return;
                try {
                    const hostname = new URL(tabs[0].url).hostname;
                    chrome.storage.local.get({ whitelistedSites: [] }, (res) => {
                        let sites = res.whitelistedSites || [];
                        if (sites.includes(hostname)) {
                            sites = sites.filter(s => s !== hostname);
                            whitelistBtn.textContent = 'Whitelist this Site';
                            whitelistBtn.style.background = '#2b8a3e';
                        } else {
                            sites.push(hostname);
                            whitelistBtn.textContent = 'Remove from Whitelist';
                            whitelistBtn.style.background = '#c2410c';
                        }
                        chrome.storage.local.set({ whitelistedSites: sites }, () => {
                            // Reload page to match disabled extension behavior
                            if (tabs[0]?.id) {
                                chrome.tabs.reload(tabs[0].id);
                            }
                        });
                    });
                } catch (e) { }
            });
        });
    }

    // Listen for storage changes to update metrics in real-time
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local') {
            if (changes.blockedAds || changes.blockedScripts || changes.blockedVideos) {
                updateMetrics();
            }
        }
    });

    // Function to render whitelisted sites in modal
    const renderWhitelistModal = () => {
        chrome.storage.local.get({ whitelistedSites: [] }, (result) => {
            const sites = result.whitelistedSites || [];
            if (sites.length === 0) {
                whitelistList.innerHTML = '<p style="color: #666;">No whitelisted sites</p>';
            } else {
                whitelistList.innerHTML = sites.map(site => `
                    <div style="padding: 8px; background: #f5f5f5; margin: 5px 0; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                        <span>${site}</span>
                        <button data-site="${site}" class="remove-whitelist-btn" style="background: #c2410c; color: white; border: none; padding: 4px 10px; border-radius: 3px; cursor: pointer; font-size: 0.8em;">Remove</button>
                    </div>
                `).join('');

                // Add event listeners to remove buttons
                document.querySelectorAll('.remove-whitelist-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const site = e.target.dataset.site;
                        chrome.storage.local.get({ whitelistedSites: [] }, (res) => {
                            let sites = res.whitelistedSites || [];
                            sites = sites.filter(s => s !== site);
                            chrome.storage.local.set({ whitelistedSites: sites }, () => {
                                // Reload page if it matches the removed site
                                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                                    if (tabs[0] && tabs[0].url) {
                                        try {
                                            const hostname = new URL(tabs[0].url).hostname;
                                            if (hostname === site && tabs[0].id) {
                                                chrome.tabs.reload(tabs[0].id);
                                            } else {
                                                renderWhitelistModal();
                                            }
                                        } catch (e) {
                                            renderWhitelistModal();
                                        }
                                    }
                                });
                            });
                        });
                    });
                });
            }
        });
    };

    // View whitelist button
    if (viewWhitelistBtn) {
        viewWhitelistBtn.addEventListener('click', () => {
            whitelistModal.style.display = 'block';
            renderWhitelistModal();
        });
    }

    // Close modal button
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            whitelistModal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    if (whitelistModal) {
        whitelistModal.addEventListener('click', (e) => {
            if (e.target === whitelistModal) {
                whitelistModal.style.display = 'none';
            }
        });
    }
});

