/**
 * Breadcrumb schema generator module
 */
const BreadcrumbSchema = {
    /**
     * Injects a JSON-LD schema script into the document head.
     */
    inject(schemaContent) {
        const schemaId = 'breadcrumb-schema';
        if (document.getElementById(schemaId)) return;

        const script = document.createElement('script');
        script.id = schemaId;
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            ...schemaContent,
        });

        document.head.appendChild(script);
    },

    /**
     * Generates and injects breadcrumb schema script.
     */
    generate() {
        const breadcrumbContainer = document.querySelector('.breadcrumb-bar_wrap');
        if (!breadcrumbContainer) return;

        const cleanUrl = (url) => {
            try {
                return new URL(url).toString()
                    .split('?')[0]
                    .split('#')[0];
            } catch (e) {
                return url;
            }
        };

        const breadcrumbSchema = Array.from(
            breadcrumbContainer.querySelectorAll('.breadcrumb_item')
        ).map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
                '@id': cleanUrl(
                    item.querySelector('.breadcrumb_link')?.href || window.location.href
                ),
                name: (
                    item.querySelector('.breadcrumb_link') || 
                    item.querySelector('div:not(.breadcrumb_icon)')
                ).textContent.trim()
            }
        }));

        this.inject({ itemListElement: breadcrumbSchema });
    },

    /**
     * Initialize the breadcrumb schema generation
     */
    init() {
        document.readyState === 'loading'
            ? document.addEventListener('DOMContentLoaded', () => this.generate())
            : this.generate();
    }
};

BreadcrumbSchema.init();