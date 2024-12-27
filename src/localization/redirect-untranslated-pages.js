const LocalizationRedirect = (function() {
    // Configuration settings for different functionality
    const CONFIG = {
        redirectUntranslatedToEnglish: true,
        redirectEnglishToSpanish: true,
        disableUntranslatedLinks: true,
        debug: false
    };

    // Map of all Spanish pages with their corresponding English versions
    // If redirectToSpanish is true, visiting the English version will redirect to Spanish
    const TRANSLATED_SPANISH_PAGES = {
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
    const SPANISH_CMS_WILDCARDS = [
        '/es/plantillas/',
        '/es/plantillas-category/',
        '/es/plantillas-sub-category/'
    ];

    // Private functions
    function matchesWildcard(path) {
        return SPANISH_CMS_WILDCARDS.some(wildcard => path.startsWith(wildcard));
    }

    function getFullUrl(path) {
        const queryString = window.location.search;
        const hash = window.location.hash;
        return `${path}${queryString}${hash}`;
    }

    // Public methods
    return {
        handleRedirect: function() {
            const langAttr = document.documentElement.lang;
            const currentPath = window.location.pathname;
            
            if (CONFIG.debug) {
                console.log('Language:', langAttr);
                console.log('Current path:', currentPath);
            }

            // Update references to use local constants
            if (CONFIG.redirectUntranslatedToEnglish && langAttr === 'es' && currentPath.startsWith('/es/')) {
                if (!TRANSLATED_SPANISH_PAGES[currentPath] && !matchesWildcard(currentPath)) {
                    const pageSlug = currentPath.replace('/es/', '/');
                    window.location.href = getFullUrl(pageSlug);
                }
            }

            if (CONFIG.redirectEnglishToSpanish && currentPath.startsWith('/es/')) {
                const pathWithoutPrefix = currentPath.replace('/es/', '/');
                
                if (!TRANSLATED_SPANISH_PAGES[currentPath]) {
                    const spanishPage = Object.entries(TRANSLATED_SPANISH_PAGES).find(([spanishPath, data]) => 
                        data.englishPath === pathWithoutPrefix
                    );
                    
                    if (spanishPage) {
                        window.location.href = getFullUrl(spanishPage[0]);
                    }
                }
            }
        },

        disableSpanishLinks: function() {
            if (!CONFIG.disableUntranslatedLinks) return;

            let currentPath = window.location.pathname;
            if (currentPath === '/') return;
            
            currentPath = currentPath.startsWith('/') ? currentPath : '/' + currentPath;
            
            // Check if there's a Spanish translation for the current English path
            const hasSpanishTranslation = Object.values(TRANSLATED_SPANISH_PAGES).some(
                data => data.englishPath === currentPath
            );
            
            if (!hasSpanishTranslation && !matchesWildcard(currentPath)) {
                const spanishLinks = document.querySelectorAll('a[hreflang="es"]');
                
                spanishLinks.forEach(link => {
                    link.href = '#';
                    link.classList.add('locale-link-disabled');
                    link.style.cursor = 'not-allowed';
                    link.style.opacity = '0.3';
                });
            }
        },

        init: function() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.handleRedirect();
                    this.disableSpanishLinks();
                });
            } else {
                this.handleRedirect();
                this.disableSpanishLinks();
            }
        }
    };
})();

// Initialize the module
LocalizationRedirect.init();