const UntranslatedLinks = (function() {
    const CONFIG = {
        debug: false
    };

    // Secondary locales, served under /<locale>/
    const LOCALES = ['es', 'fr'];

    // English paths of pages translated in every secondary locale.
    // Links to /<locale>/<path> for any other path are pointed at the English page.
    const TRANSLATED_PAGES = [
        '/',
        '/about-us',
        '/ai',
        '/application-form-builder',
        '/enterprise',
        '/explore',
        '/forms',
        '/landing-page-builder',
        '/legal',
        '/platform-overview',
        '/poll-builder',
        '/pricing',
        '/quizzes',
        '/refer-a-friend',
        '/refer-a-friend/invite',
        '/roles/b2b-marketing',
        '/surveys',
        '/surveys/product-survey-questions-examples',
        '/test-maker',
        '/try/active-campaign',
        '/try/application',
        '/try/best-form-builder',
        '/try/feedback',
        '/try/form-builder',
        '/try/googleforms-alternative',
        '/try/googlesheets',
        '/try/growth',
        '/try/hubspot',
        '/try/jotform-alternative',
        '/try/klaviyo',
        '/try/landingpage',
        '/try/landingpage-builder',
        '/try/lead-generation',
        '/try/mailchimp',
        '/try/microsoft-alternative',
        '/try/notion',
        '/try/nps',
        '/try/paypal',
        '/try/poll-builder',
        '/try/qualtrics-alternative',
        '/try/questionnaire-builder',
        '/try/quiz-builder',
        '/try/registration',
        '/try/research',
        '/try/square',
        '/try/survey-builder',
        '/try/surveymonkey-alternative',
        '/try/tally-alternative',
        '/try/typeform-ai',
        '/try/typeformbrand',
        '/try/wordpress',
        '/try/zohoforms-alternative',
        '/typeform-startups',
        '/video',
        '/wait-list'
    ];

    // Collections whose slug is translated in a locale, keyed by locale, mapped to the English slug.
    // Their items live under the translated slug (/es/plantillas/<item>), so links to items are left
    // alone. Anything else under the slug is pointed at the English slug, since /plantillas/... 404s.
    const LOCALIZED_SLUGS = {
        es: {
            '/plantillas': '/templates',
            '/plantillas-category': '/templates-category',
            '/plantillas-sub-category': '/templates-sub-category'
        }
    };

    const localePattern = new RegExp(`^/(${LOCALES.join('|')})(/.*)?$`);
    // A full typeform.com URL inside the path, e.g. /es/https://www.typeform.com/es/pricing.
    // Without this, removing the locale leaves /https://www.typeform.com/es/pricing, which 404s.
    const nestedUrlPattern = new RegExp(`^(?:/(?:${LOCALES.join('|')}))?/https?:/+(?:www\\.)?typeform\\.com(/.*)?$`, 'i');
    const translatedPages = new Set(TRANSLATED_PAGES);

    function normalizePath(path) {
        return path.length > 1 ? path.replace(/\/+$/, '') : path;
    }

    function unwrapNestedUrl(path) {
        const nested = path.match(nestedUrlPattern);
        // Collapse leading slashes so the result can never be a protocol-relative //host URL
        return nested ? (nested[1] || '/').replace(/^\/+/, '/') : path;
    }

    // The path a link should point at: unchanged for translated pages, English otherwise
    function targetPath(pathname) {
        const path = unwrapNestedUrl(pathname);

        const match = path.match(localePattern);
        if (!match) return path;

        const locale = match[1];
        const localePath = normalizePath(match[2] || '/');
        const firstSegment = localePath.match(/^\/[^/]*/)[0];
        const englishSlug = (LOCALIZED_SLUGS[locale] || {})[firstSegment];

        // A collection item under a translated slug, e.g. /es/plantillas/<item>
        if (englishSlug && localePath !== firstSegment) return path;

        const englishPath = englishSlug
            ? englishSlug + localePath.slice(firstSegment.length)
            : localePath;
        return translatedPages.has(englishPath) ? path : englishPath;
    }

    return {
        rewriteLinks: function() {
            document.querySelectorAll('a[href]').forEach(link => {
                const url = new URL(link.href, window.location.origin);
                if (url.origin !== window.location.origin) return;

                const path = targetPath(url.pathname);
                if (path === url.pathname) return;

                link.setAttribute('href', `${path}${url.search}${url.hash}`);

                if (CONFIG.debug) console.log('UntranslatedLinks:', url.pathname, '->', path);
            });
        },

        init: function() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.rewriteLinks());
            } else {
                this.rewriteLinks();
            }
        }
    };
})();

UntranslatedLinks.init();
