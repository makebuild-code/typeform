// Configuration settings for different functionality
const SETTINGS = {
    // Redirect untranslated Spanish pages to English - temp Webflow workaround
    redirectUntranslatedToEnglish: true,
    
    // Redirect English pages to Spanish when available
    redirectEnglishToSpanish: true,
    
    // Disable Spanish language switcher for untranslated pages
    disableUntranslatedLinks: true,
    
    // Enable logging for debugging
    debug: false
};

// Map of all Spanish pages with their corresponding English versions
// If redirectToSpanish is true, visiting the English version will redirect to Spanish
const SPANISH_PAGES = {
    // Home
    '/es': { englishPath: '/', redirectToSpanish: false },
    
    // About us
    '/es/acerca-de': { englishPath: '/about-us', redirectToSpanish: true },
    
    // Test maker
    '/es/crear-un-cuestionario': { englishPath: '/test-maker', redirectToSpanish: true },
    
    // Surveys
    '/es/encuestas': { englishPath: '/surveys', redirectToSpanish: true },
    
    // Surveys - Employee engagement ideas
    '/es/encuestas/fomenta-compromiso-laboral': { englishPath: '/surveys/employee-engagement-ideas', redirectToSpanish: true },
    
    // Feedback
    '/es/feedback': { englishPath: '/feedback', redirectToSpanish: true },
    
    // Forms
    '/es/formularios': { englishPath: '/forms', redirectToSpanish: true },
    
    // Lead generation
    '/es/generacion-de-leads': { englishPath: '/lead-generation', redirectToSpanish: true },
    
    // Growth
    '/es/growth': { englishPath: '/growth', redirectToSpanish: true },
    
    // Guide
    '/es/guide': { englishPath: '/guide', redirectToSpanish: true },
    
    // Hubspot integration
    '/es/hubspot-integration': { englishPath: '/hubspot-integration', redirectToSpanish: true },
    
    // Research
    '/es/investigacion': { englishPath: '/research', redirectToSpanish: true },
    
    // Templates
    '/es/plantillas': { englishPath: '/templates', redirectToSpanish: true },
    
    // Pricing
    '/es/precios': { englishPath: '/pricing', redirectToSpanish: true },
    
    // Product
    '/es/producto': { englishPath: '/product-overview', redirectToSpanish: true },
    
    // Signup
    '/es/signup': { englishPath: '/signup', redirectToSpanish: false },
    
    // Surveys
    '/es/sondeos': { englishPath: '/poll-builder', redirectToSpanish: true },
    
    // Tests
    '/es/tests': { englishPath: '/quizzes', redirectToSpanish: true },
    
    // Whats new
    '/es/whats-new': { englishPath: '/whats-new', redirectToSpanish: true }
};

// Add wildcard patterns for CMS collection pages
const SPANISH_WILDCARDS = [
    '/es/plantillas/',
    '/es/plantillas-category/',
    '/es/plantillas-sub-category/'
];

function matchesWildcard(path) {
    return SPANISH_WILDCARDS.some(wildcard => path.startsWith(wildcard));
}

function getFullUrl(path) {
    const queryString = window.location.search;
    const hash = window.location.hash;
    return `${path}${queryString}${hash}`;
}

function handleRedirect() {
    const langAttr = document.documentElement.lang;
    const currentPath = window.location.pathname;
    
    if (SETTINGS.debug) {
        console.log('Language:', langAttr);
        console.log('Current path:', currentPath);
    }

    // Handle Spanish pages
    if (SETTINGS.redirectUntranslatedToEnglish && langAttr === 'es' && currentPath.startsWith('/es/')) {
        // Check both exact matches and wildcard patterns
        if (!SPANISH_PAGES[currentPath] && !matchesWildcard(currentPath)) {
            const pageSlug = currentPath.replace('/es/', '/');
            window.location.href = getFullUrl(pageSlug);
        }
    }

    // Handle English to Spanish redirects
    if (SETTINGS.redirectEnglishToSpanish && currentPath.startsWith('/es/')) {
        const spanishPage = Object.entries(SPANISH_PAGES).find(([spanishPath, data]) => 
            data.englishPath === currentPath.replace('/es/', '/') && data.redirectToSpanish
        );
        
        if (spanishPage) {
            window.location.href = getFullUrl(spanishPage[0]);
        }
    }
}

function disableSpanishLinks() {
    if (!SETTINGS.disableUntranslatedLinks) return;

    let currentPath = window.location.pathname;
    // Handle root path specially
    if (currentPath === '/') {
        return; // Don't disable Spanish links on homepage
    }
    
    currentPath = currentPath.startsWith('/') ? currentPath : '/' + currentPath;
    
    const hasSpanishVersion = Object.values(SPANISH_PAGES).some(page => 
        page.englishPath === currentPath
    ) || matchesWildcard(currentPath);

    if (!hasSpanishVersion) {
        // Find Spanish language links
        const spanishLinks = document.querySelectorAll('a[hreflang="es"]');
        
        spanishLinks.forEach(link => {
            link.href = '#';
            link.classList.add('locale-link-disabled');
            link.style.cursor = 'not-allowed';
            link.style.opacity = '0.3';
        });
    }
}

// Update the initialization to handle both redirect and link disabling
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        handleRedirect();
        disableSpanishLinks();
    });
} else {
    handleRedirect();
    disableSpanishLinks();
}