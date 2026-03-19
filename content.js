// SusMode - Content Script (Improved)
console.log('SusMode active');

let enabled = true;

// Track already processed elements
const processed = new WeakSet();

// Detect AI-related elements
const isAIText = (text) => {
    if (!text) return false;

    text = text.toLowerCase();
    return (
        text.includes('ai mode') ||
        text.includes('search with ai') ||
        text.includes('ask ai')
    );
};

// Remove AI button/container
const removeAIElement = (el) => {
    if (!enabled) return;
    if (!el || processed.has(el)) return;

    const text = el.textContent?.trim();
    if (!isAIText(text)) return;

    // Find the actual clickable container
    const clickable = el.closest('a, button, div[role="button"]');

    if (clickable && !processed.has(clickable)) {
        clickable.remove();
        processed.add(clickable);
        console.log('SusMode: Removed AI element:', clickable);
    }
};

// Efficient scan (only relevant elements)
const scan = (root = document) => {
    if (!enabled) return;
    root.querySelectorAll('span, div, a').forEach(removeAIElement);
};

chrome.storage.local.get({ susmodeEnabled: true }, (result) => {
    enabled = result.susmodeEnabled;
    if (enabled) scan();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes.susmodeEnabled) return;
    enabled = changes.susmodeEnabled.newValue;
    if (enabled) scan();
});

// Observe dynamic changes (Google updates UI after load)
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
            if (!(node instanceof Element)) return;

            // Check the node itself
            removeAIElement(node);

            // Check its children
            scan(node);
        });
    }
});

// Start observing safely
if (document.body) {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
} else {
    window.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}