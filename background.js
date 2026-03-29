const tabLastAccessed = {};
const SUSPENSION_TIMEOUT = 15 * 60 * 1000;
const RULES_TO_CLEAN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

// Ad network domains to block
const AD_NETWORKS = [
    'doubleclick.net',
    'googlesyndication.com',
    'googleadservices.com',
    'ads.google.com',
    'google-analytics.com',
    'googletagmanager.com',
    'criteo.com',
    'amazon-adsystem.com',
    'facebook.com/tr',
    'connect.facebook.net',
    'pinterest.com/v1/conversion',
    'analytics.google.com'
];

// Video domains to block (but allow YouTube embeds on user choice via whitelist)
const VIDEO_BLOCK_PATTERNS = [
    'doubleclick.net.*\\.mp4',
    'googlesyndication.com.*\\.mp4',
    'criteo.com.*\\.(mp4|webm)',
    'amazon-adsystem.com.*\\.(mp4|webm)'
];

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

function enableBypass() {
    const rules = [
        // RULE 1: Skip if tbm exists (images/videos/etc)
        {
            id: 1,
            priority: 10,
            action: { type: "allow" },
            condition: {
                regexFilter: "[?&]tbm=",
                resourceTypes: ["main_frame"]
            }
        },

        // RULE 2: Skip if udm already exists
        {
            id: 2,
            priority: 9,
            action: { type: "allow" },
            condition: {
                regexFilter: "[?&]udm=",
                resourceTypes: ["main_frame"]
            }
        },

        // RULE 3: Add udm=14 otherwise
        {
            id: 3,
            priority: 8,
            action: {
                type: "redirect",
                redirect: {
                    transform: {
                        queryTransform: {
                            addOrReplaceParams: [
                                { key: "udm", value: "14" }
                            ]
                        }
                    }
                }
            },
            condition: {
                regexFilter: "^https://www\\.google\\.com/search\\?.*",
                resourceTypes: ["main_frame"]
            }
        },

        // RULE 4-10: Block ad network requests (high priority to stop them early)
        {
            id: 4,
            priority: 7,
            action: { type: "block" },
            condition: {
                urlFilter: "||doubleclick.net",
                resourceTypes: ["script", "image", "xmlhttprequest", "media"]
            }
        },
        {
            id: 5,
            priority: 7,
            action: { type: "block" },
            condition: {
                urlFilter: "||googlesyndication.com",
                resourceTypes: ["script", "image", "xmlhttprequest", "media"]
            }
        },
        {
            id: 6,
            priority: 7,
            action: { type: "block" },
            condition: {
                urlFilter: "||googleadservices.com",
                resourceTypes: ["script", "image", "xmlhttprequest"]
            }
        },
        {
            id: 7,
            priority: 7,
            action: { type: "block" },
            condition: {
                urlFilter: "||criteo.com",
                resourceTypes: ["script", "image", "xmlhttprequest", "media"]
            }
        },
        {
            id: 8,
            priority: 7,
            action: { type: "block" },
            condition: {
                urlFilter: "||amazon-adsystem.com",
                resourceTypes: ["script", "image", "xmlhttprequest", "media"]
            }
        },
        {
            id: 9,
            priority: 7,
            action: { type: "block" },
            condition: {
                urlFilter: "||googletagmanager.com",
                resourceTypes: ["script", "xmlhttprequest"]
            }
        },
        {
            id: 10,
            priority: 7,
            action: { type: "block" },
            condition: {
                regexFilter: "^https://(connect\\.facebook\\.net|facebook\\.com)/tr(\\?|$)",
                resourceTypes: ["xmlhttprequest", "script"]
            }
        },

        // RULE 11-13: Block ad-related tracking pixels and beacons
        {
            id: 11,
            priority: 6,
            action: { type: "block" },
            condition: {
                regexFilter: "analytics\\.google\\.com.*",
                resourceTypes: ["xmlhttprequest", "script"]
            }
        },
        {
            id: 12,
            priority: 6,
            action: { type: "block" },
            condition: {
                regexFilter: ".*[?&](pixel|beacon|track).*",
                resourceTypes: ["image", "xmlhttprequest"]
            }
        },
        {
            id: 13,
            priority: 6,
            action: { type: "block" },
            condition: {
                urlFilter: "*://*/*ad.gif",
                resourceTypes: ["image"]
            }
        },

        // RULE 14-15: Block video ads from known ad networks
        {
            id: 14,
            priority: 5,
            action: { type: "block" },
            condition: {
                regexFilter: "(doubleclick|googlesyndication|criteo|amazon-adsystem)\\..*\\.(mp4|webm|m4v)",
                resourceTypes: ["media"]
            }
        },
        {
            id: 15,
            priority: 5,
            action: { type: "block" },
            condition: {
                urlFilter: "*://ads-*.*.doubleclick.net/*",
                resourceTypes: ["media", "script"]
            }
        }
    ];

    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: RULES_TO_CLEAN,
        addRules: rules
    });
}

function disableBypass() {
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: RULES_TO_CLEAN
    });
}

// Sync with your existing toggle
chrome.storage.local.get({ susmodeEnabled: true }, (result) => {
    if (result.susmodeEnabled) {
        enableBypass();
    }
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.susmodeEnabled) return;

    if (changes.susmodeEnabled.newValue) {
        enableBypass();
    } else {
        disableBypass();
    }
});
