/**
 * Injects a JSON-LD schema script into the document head.
 * @param {string} schemaId - The unique identifier for the script element.
 * @param {string} schemaType - The type of schema to be injected.
 * @param {object} schemaContent - The content of the schema.
 */
function injectSchemaScript(schemaId, schemaType, schemaContent) {
    if (document.getElementById(schemaId)) return;

    const script = document.createElement('script');
    script.id = schemaId;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': schemaType,
        ...schemaContent,
    });

    document.head.appendChild(script);
    //console.log(`${schemaId} schema generated and appended to <head>.`);
}

/**
 * Generates and injects FAQ schema script.
 */
// function generateFaqSchema() {
//     const faqItems = document.querySelectorAll('.faq-item_wrapper');
//     if (!faqItems.length) {
//         //console.log('No FAQ items found.');
//         return;
//     }

//     const faqData = Array.from(faqItems).map((item) => ({
//         '@type': 'Question',
//         name: item.querySelector('.faq_question').textContent.trim(),
//         acceptedAnswer: {
//             '@type': 'Answer',
//             text: item.querySelector('.faq_answer').textContent.trim(),
//         },
//     }));

//     injectSchemaScript('faq-schema', 'FAQPage', { mainEntity: faqData });
// }

/**
 * Generates and injects breadcrumb schema script.
 */
function generateBreadcrumbSchema() {
    const breadcrumbContainer = document.querySelector('.breadcrumb-bar_wrap');
    if (!breadcrumbContainer) {
        return;
    }

    // Helper function to clean URLs
    const cleanUrl = (url) => {
        try {
            const urlObj = new URL(url);
            return `${urlObj.origin}${urlObj.pathname}`;
        } catch (e) {
            return url;
        }
    };

    // Get breadcrumb items, including both linked and non-linked items
    const breadcrumbItems = breadcrumbContainer.querySelectorAll('.breadcrumb_item');
    
    // Map breadcrumb items to schema
    const breadcrumbSchema = Array.from(breadcrumbItems).map((item, index) => {
        const link = item.querySelector('.breadcrumb_link');
        const textDiv = item.querySelector('div:not(.breadcrumb_icon)');
        
        return {
            '@type': 'ListItem',
            position: index + 1,
            item: {
                '@id': cleanUrl(link ? link.href : window.location.href),
                name: link ? link.textContent.trim() : textDiv.textContent.trim(),
            },
        };
    });

    injectSchemaScript('breadcrumb-schema', 'BreadcrumbList', {
        itemListElement: breadcrumbSchema,
    });
}

const initializeSchemas = () => {
    generateBreadcrumbSchema();
    // Add other schema generation functions here
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSchemas);
} else {
    initializeSchemas();
}