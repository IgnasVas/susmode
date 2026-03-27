console.log('SusMode active');

let susmodeEnabled = true;
let aiBlockingEnabled = true;
let adsBlockingEnabled = true;
let scriptsBlockingEnabled = true;
let videosBlockingEnabled = true;
let throttlingEnabled = true;
let whitelistedSites = [];

// Track already processed elements
const processed = new WeakSet();

// Counter state (but is updated from local storage)
const counters = {
    aiDisabled: 0,
    ads: 0,
    scripts: 0,
    videos: 0
};

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
    if (!aiBlockingEnabled) return;
    if (!el || processed.has(el)) return;

    const text = el.textContent?.trim();
    if (!isAIText(text)) return;

    const clickable = el.closest('a, button, div[role="button"]');
    if (clickable && !processed.has(clickable)) {
        clickable.remove();
        processed.add(clickable);
        counters.aiDisabled++;
        console.log('SusMode: Removed AI element:', clickable);
    }
};

// Block ads
const blockAds = () => {
    if (!adsBlockingEnabled) return;

    const adSelectors = [
        // Google Ads
        '[data-ad-slot]',
        '[data-ad-client]',
        'ins.adsbygoogle',
        // Common ad classes/IDs
        '.ad',
        '.ads',
        '.advertisement',
        '.advert',
        '.banner-ad',
        '.sidebar-ads',
        '.sponsored',
        '.promotional',
        '.ad-banner',
        '.ad-container',
        '.ad-unit',
        '.adblock',
        '[class*="ad-"]',
        '[id*="ad-"]',
        '[class*="sponsor"]',
        '[id*="sponsor"]',
        // Ad iframes (common ad networks)
        'iframe[src*="doubleclick"]',
        'iframe[src*="googlesyndication"]',
        'iframe[src*="ads"]',
        'iframe[src*="ad."]',
        'iframe[src*="banner"]',
        'iframe[src*="adserver"]',
        'iframe[src*="amazon-adsystem"]',
        'iframe[src*="criteo"]',
        // Ad containers
        '[role="region"][aria-label*="ad"]',
        'div[data-component-type="ad"]',
        // Sponsored content
        '[data-ad-type]',
        '[data-ad-provider]',
        'div[data-native-ad]',
        // Common ad heights/widths that indicate ads
        'div[style*="300px"][style*="250px"]',
        'div[style*="728px"][style*="90px"]',
        'div[style*="336px"][style*="280px"]'
    ];

    adSelectors.forEach(selector => {
        try {
            document.querySelectorAll(selector).forEach(el => {
                if (!processed.has(el)) {
                    el.remove();
                    processed.add(el);
                    counters.ads++;
                    console.log('SusMode: Blocked ad', el.className || el.id || el.tagName);
                }
            });
        } catch (e) {
            // Silently skip invalid selectors
        }
    });
};

// Block scripts (except critical ones like analytics we want)
const blockScripts = () => {
    if (!scriptsBlockingEnabled) return;

    const scriptSelectors = [
        'script[src*="doubleclick"]',
        'script[src*="googlesyndication"]',
        'script[src*="adsbygoogle"]',
        'script[src*="ads"]',
        'script[src*="tracker"]'
    ];

    scriptSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            if (!processed.has(el)) {
                el.remove();
                processed.add(el);
                counters.scripts++;
                console.log('SusMode: Blocked script');
            }
        });
    });
};

// Block videos
const blockVideos = () => {
    if (!videosBlockingEnabled) return;

    const videoSelectors = [
        'video',
        'iframe[src*="youtube"]',
        'iframe[src*="vimeo"]',
        'iframe[src*="dailymotion"]'
    ];

    videoSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            if (!processed.has(el)) {
                el.style.display = 'none';
                processed.add(el);
                counters.videos++;
                console.log('SusMode: Blocked video');
            }
        });
    });
};

// Efficient scan for all blocking types
const scan = (root = document) => {
    if (!susmodeEnabled) return;
    const scanAI = (root) => root.querySelectorAll('span, div, a').forEach(removeAIElement);
    scanAI(root);
    blockAds();
    blockScripts();
    blockVideos();
};

// Update counters in storage
const updateCounters = () => {
    chrome.storage.local.set({
        aiDisabled: counters.aiDisabled,
        blockedAds: counters.ads,
        blockedScripts: counters.scripts,
        blockedVideos: counters.videos
    });
};

// Initialize from storage
chrome.storage.local.get({
    susmodeEnabled: true,
    aiBlockingEnabled: true,
    adsBlockingEnabled: true,
    scriptsBlockingEnabled: true,
    videosBlockingEnabled: true,
    throttlingEnabled: true,
    whitelistedSites: [],
    aiDisabled: 0,
    blockedAds: 0,
    blockedScripts: 0,
    blockedVideos: 0
}, (result) => {
    susmodeEnabled = result.susmodeEnabled;
    aiBlockingEnabled = result.aiBlockingEnabled;
    adsBlockingEnabled = result.adsBlockingEnabled;
    scriptsBlockingEnabled = result.scriptsBlockingEnabled;
    videosBlockingEnabled = result.videosBlockingEnabled;
    throttlingEnabled = result.throttlingEnabled;
    whitelistedSites = result.whitelistedSites || [];
    counters.aiDisabled = result.aiDisabled;
    counters.ads = result.blockedAds;
    counters.scripts = result.blockedScripts;
    counters.videos = result.blockedVideos;

    if (susmodeEnabled) {
        scan();
        updateCounters();
    }
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;

    if (changes.throttlingEnabled) throttlingEnabled = changes.throttlingEnabled.newValue;
    if (changes.whitelistedSites) whitelistedSites = changes.whitelistedSites.newValue;

    if (changes.susmodeEnabled) {
        susmodeEnabled = changes.susmodeEnabled.newValue;
        if (susmodeEnabled) scan();
    }
    if (changes.aiBlockingEnabled) {
        aiBlockingEnabled = changes.aiBlockingEnabled.newValue;
        if (aiBlockingEnabled) scan();
    }
    if (changes.adsBlockingEnabled) {
        adsBlockingEnabled = changes.adsBlockingEnabled.newValue;
        if (adsBlockingEnabled) blockAds();
    }
    if (changes.scriptsBlockingEnabled) {
        scriptsBlockingEnabled = changes.scriptsBlockingEnabled.newValue;
        if (scriptsBlockingEnabled) blockScripts();
    }
    if (changes.videosBlockingEnabled) {
        videosBlockingEnabled = changes.videosBlockingEnabled.newValue;
        if (videosBlockingEnabled) blockVideos();
    }
});

// Observe dynamic content changes
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
            if (!(node instanceof Element)) return;

            if (susmodeEnabled) {
                removeAIElement(node);
                blockAds();
                blockScripts();
                blockVideos();
                updateCounters();
            }
        });
    }
});

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

// Background Throttling Feature
document.addEventListener('visibilitychange', () => {
    if (!susmodeEnabled || !throttlingEnabled) return;

    // Check if the current site is whitelisted
    const currentHostname = window.location.hostname;
    if (whitelistedSites.includes(currentHostname)) return;

    if (document.hidden) {
        // Pause media elements
        document.querySelectorAll('video, audio').forEach(el => el.pause());
        // Pause CSS Animations globally
        document.body.style.animationPlayState = 'paused';
        // Throttle JS timers
        injectTimerThrottle(true);
        console.log('SusMode: Throttling background tab');
    } else {
        // Resume CSS Animations
        document.body.style.animationPlayState = '';
        // Unthrottle JS timers
        injectTimerThrottle(false);
        console.log('SusMode: Resumed background tab');
    }
});

function injectTimerThrottle(throttle) {
    const script = document.createElement('script');
    script.textContent = `
        if (!window.__originalSetInterval) {
            window.__originalSetInterval = window.setInterval;
            window.__originalSetTimeout = window.setTimeout;
        }
        if (${throttle}) {
            window.setInterval = function(cb, ms, ...args) {
                return window.__originalSetInterval(cb, Math.max(ms || 0, 5000), ...args);
            };
            window.setTimeout = function(cb, ms, ...args) {
                return window.__originalSetTimeout(cb, Math.max(ms || 0, 1000), ...args);
            };
        } else {
            window.setInterval = window.__originalSetInterval;
            window.setTimeout = window.__originalSetTimeout;
        }
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
}