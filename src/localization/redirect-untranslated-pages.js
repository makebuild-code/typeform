// List of paths that should redirect when accessed in Spanish
const UNTRANSLATED_PATHS = [
    '/test-path-here',
    '/another-path',
    '/third-path'
];

function handleRedirect() {
    const langAttr = document.documentElement.lang;
    const currentPath = window.location.pathname;
    console.log(langAttr);
    console.log(currentPath);

    if (langAttr === 'es' && currentPath.startsWith('/es/')) {
        // Extract the page slug by removing the '/es/' prefix
        const pageSlug = currentPath.replace('/es/', '/');
        
        // Check if this path should be redirected
        if (UNTRANSLATED_PATHS.includes(pageSlug)) {
            window.location.href = pageSlug;
        }
    }
}

function disableSpanishLinks() {
    const currentPath = window.location.pathname;
    const pageSlug = currentPath.startsWith('/') ? currentPath : '/' + currentPath;
    
    if (UNTRANSLATED_PATHS.includes(pageSlug)) {
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