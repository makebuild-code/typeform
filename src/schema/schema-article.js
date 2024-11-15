/**
 * NewsArticle schema generator module
 */
const ArticleSchema = {
    /**
     * Cleans URLs by removing query parameters and hashes
     */
    cleanUrl(url) {
        try {
            return new URL(url).toString()
                .split('?')[0]  // Remove query parameters
                .split('#')[0]; // Remove hash
        } catch (e) {
            return url;
        }
    },

    /**
     * Injects a JSON-LD schema script into the document head.
     */
    inject(schemaContent) {
        const schemaId = 'article-schema';
        if (document.getElementById(schemaId)) return;

        const script = document.createElement('script');
        script.id = schemaId;
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            ...schemaContent,
        });

        document.head.appendChild(script);
    },

    /**
     * Generates and injects NewsArticle schema script.
     */
    generate() {
        const article = {
            headline: document.querySelector('[cc-schema-article-id="headline"]')?.textContent.trim(),
            image: document.querySelector('[cc-schema-article-id="image"]')?.textContent.trim(),
            datePublished: document.querySelector('[cc-schema-article-id="datePublished"]')?.textContent.trim(),
            dateModified: document.querySelector('[cc-schema-article-id="dateModified"]')?.textContent.trim(),
            author: {
                '@type': document.querySelector('[cc-schema-article-id="author-type"]')?.textContent.trim(),
                name: document.querySelector('[cc-schema-article-id="author-name"]')?.textContent.trim(),
                url: this.cleanUrl(document.querySelector('[cc-schema-article-id="author-url"]')?.textContent.trim())
            }
        };

        this.inject(article);
    },

    /**
     * Initialize the article schema generation
     */
    init() {
        document.readyState === 'loading'
            ? document.addEventListener('DOMContentLoaded', () => this.generate())
            : this.generate();
    }
};

ArticleSchema.init();