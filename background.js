const tabLastAccessed = {};
const SUSPENSION_TIMEOUT = 15 * 60 * 1000;

chrome.tabs.onActivated.addListener((activeInfo) => {
    tabLastAccessed[activeInfo.tabId] = Date.now();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.active) tabLastAccessed[tabId] = Date.now();
});

chrome.tabs.onRemoved.addListener((tabId) => {
    delete tabLastAccessed[tabId];
});

chrome.alarms.create("checkSuspension", { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== "checkSuspension") return;

    chrome.storage.local.get({ tabSuspensionEnabled: true, susmodeEnabled: true }, (result) => {
        if (!result.tabSuspensionEnabled || !result.susmodeEnabled) return;

        const now = Date.now();
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                if (tab.active || tab.pinned || tab.audible || tab.discarded) return;

                const lastAccessed = tabLastAccessed[tab.id] || now;
                if (now - lastAccessed > SUSPENSION_TIMEOUT) {
                    chrome.tabs.discard(tab.id)
                        .then((dt) => console.log(`SusMode: Suspended ${dt.title}`))
                        .catch(console.error);
                }
            });
        });
    });
});
