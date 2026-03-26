const RULE_ID = 1;

function enableBypass() {
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [RULE_ID],
        addRules: [
            {
                id: RULE_ID,
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
                    urlFilter: "google.com/search",
                    resourceTypes: ["main_frame"]
                }
            }
        ]
    });

    console.log("SusMode: AI bypass ENABLED");
}

function disableBypass() {
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [RULE_ID]
    });

    console.log("SusMode: AI bypass DISABLED");
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