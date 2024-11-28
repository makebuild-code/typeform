// List of parameters to persist
const TRACKED_PARAMS = [
    'dev',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'tf_source',
    'tf_medium',
    'tf_campaign',
    'tf_term',
    'tf_content',
    'referrer',
    'optimizely_experiments_fingerprint'
];

// Function to get URL parameters
function getUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    
    TRACKED_PARAMS.forEach(param => {
        const value = params.get(param);
        if (value) {
            result[param] = value;
        }
    });
    
    return result;
}

// Function to save parameters to sessionStorage
function saveParameters() {
    const currentParams = getUrlParameters();
    const storedParams = JSON.parse(sessionStorage.getItem('trackedParams') || '{}');
    
    const mergedParams = { ...storedParams, ...currentParams };
    sessionStorage.setItem('trackedParams', JSON.stringify(mergedParams));
}

// Function to apply parameters to links
function applyParamsToLinks() {
    const storedParams = JSON.parse(sessionStorage.getItem('trackedParams') || '{}');
    
    document.querySelectorAll('a').forEach(link => {
        if (link.href && link.href.startsWith(window.location.origin)) {
            const url = new URL(link.href);
            Object.entries(storedParams).forEach(([key, value]) => {
                url.searchParams.set(key, value);
            });
            link.href = url.toString();
        }
    });
}

// Initialize tracking
function initParamTracking() {
    // Save parameters immediately
    saveParameters();
    
    // Try to apply parameters immediately and after a short delay
    applyParamsToLinks();
    
    // Add additional attempts to catch dynamically loaded content
    setTimeout(applyParamsToLinks, 1000);
    setTimeout(applyParamsToLinks, 3000);
    
    // Watch for dynamic content changes with a more specific configuration
    const observer = new MutationObserver((mutations) => {
        // Only run if new nodes were added
        if (mutations.some(mutation => mutation.addedNodes.length > 0)) {
            applyParamsToLinks();
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['href']
    });
}

// Run both on DOMContentLoaded and after window load
document.addEventListener('DOMContentLoaded', initParamTracking);
window.addEventListener('load', initParamTracking);
