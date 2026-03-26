const RULES_TO_CLEAN = [1, 2, 3];

function enableBypass() {
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: RULES_TO_CLEAN,
        addRules: [
            // RULE 1: Skip if tbm exists (images/videos/etc)
            {
                id: 1,
                priority: 3,
                action: { type: "allow" },
                condition: {
                    regexFilter: "[?&]tbm=",
                    resourceTypes: ["main_frame"]
                }
            },

            // RULE 2: Skip if udm already exists
            {
                id: 2,
                priority: 2,
                action: { type: "allow" },
                condition: {
                    regexFilter: "[?&]udm=",
                    resourceTypes: ["main_frame"]
                }
            },

            // RULE 3: Add udm=14 otherwise
            {
                id: 3,
                priority: 1,
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
            }
        ]
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