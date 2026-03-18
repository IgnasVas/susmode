// SusMode - Content Script
// Runs inside the actual webpage (NOT the extension popup)

console.log('SusMode content script running');

// Encapsulate logic to avoid polluting global scope
const blockAI = (() => {
    // Selectors targeting AI-related UI elements
    const aiSelectors = [
        '.plR5qb',                        // Specific class (Google AI button)
        'button[aria-label*="AI"]',       // Buttons with "AI" in aria-label
        'svg path[d*="M17.5 12c0-3.04"]'  // Sparkle icon path
    ];

    // Track already hidden elements
    const hiddenElements = new WeakSet();

    // Hide helper
    const hideElement = (el) => {
        if (!el || hiddenElements.has(el)) return;

        el.style.setProperty('display', 'none', 'important');
        hiddenElements.add(el);

        console.log('SusMode: Blocked element', el);
    };

    return () => {
        // 1. Hide based on selectors
        aiSelectors.forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach(el => {
                    const elementToHide =
                        el.tagName === 'path' ? el.closest('button') : el;

                    hideElement(elementToHide);
                });
            } catch (e) {
                console.error('SusMode: Invalid selector:', selector);
            }
        });

        // 2. Hide based on button text
        document.querySelectorAll('button').forEach(btn => {
            const btnText = btn.textContent?.trim() || "";

            if (
                (btnText === 'AI' || btnText.includes('AI Mode')) &&
                !hiddenElements.has(btn)
            ) {
                hideElement(btn);
            }
        });
    };
})();

// Run immediately
blockAI();

// Observe DOM changes (for dynamically loaded elements)
const observer = new MutationObserver(() => {
    blockAI();
});

// Ensure body exists before observing
if (document.body) {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
} else {
    // Fallback if body isn't ready yet
    window.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}