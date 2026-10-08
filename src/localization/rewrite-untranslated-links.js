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
        '/connect',
        '/connect/slack',
        '/enterprise',
        '/explore',
        '/forms',
        '/landing-page-builder',
        '/platform-overview',
        '/poll-builder',
        '/pricing',
        '/quizzes',
        '/refer-a-friend/invite',
        '/roles/b2b-marketing',
        '/surveys',
        '/templates',
        '/test-maker',
        '/try/best-form-builder',
        '/try/brand',
        '/try/connect',
        '/try/feedback',
        '/try/form-builder',
        '/try/googleforms-alternative',
        '/try/googlesheets',
        '/try/home',
        '/try/jotform-alternative',
        '/try/klaviyo',
        '/try/landingpage',
        '/try/notion',
        '/try/poll-builder',
        '/try/questionnaire-builder',
        '/try/quiz-builder',
        '/try/registration',
        '/try/research',
        '/try/survey-builder',
        '/try/surveymonkey-alternative',
        '/try/typeformbrand',
        '/video'
    ];

    const localePattern = new RegExp(`^/(${LOCALES.join('|')})(/.*)?$`);
    const translatedPages = new Set(TRANSLATED_PAGES);

    function normalizePath(path) {
        return path.length > 1 ? path.replace(/\/+$/, '') : path;
    }

    return {
        rewriteLinks: function() {
            document.querySelectorAll('a[href]').forEach(link => {
                const url = new URL(link.href, window.location.origin);
                if (url.origin !== window.location.origin) return;

                const match = url.pathname.match(localePattern);
                if (!match) return;

                const englishPath = normalizePath(match[2] || '/');
                if (translatedPages.has(englishPath)) return;

                link.setAttribute('href', `${englishPath}${url.search}${url.hash}`);

                if (CONFIG.debug) console.log('UntranslatedLinks:', url.pathname, '->', englishPath);
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
