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
function generateFaqSchema() {
    const faqItems = document.querySelectorAll('.faq-item_wrapper');
    if (!faqItems.length) {
        //console.log('No FAQ items found.');
        return;
    }

    const faqData = Array.from(faqItems).map((item) => ({
        '@type': 'Question',
        name: item.querySelector('.faq_question').textContent.trim(),
        acceptedAnswer: {
            '@type': 'Answer',
            text: item.querySelector('.faq_answer').textContent.trim(),
        },
    }));

    injectSchemaScript('faq-schema', 'FAQPage', { mainEntity: faqData });
}

/**
 * Generates and injects breadcrumb schema script.
 */
function generateBreadcrumbSchema() {
    const breadcrumbContainer = document.querySelector('.secondary-breadcrumb');
    if (!breadcrumbContainer) {
        return;
    }

    // Get breadcrumb items from the container.
    const breadcrumbItems = breadcrumbContainer.querySelectorAll('.breadcrumb-bar_wrap a');

    // Map breadcrumb items to schema, starting positions at 1 now
    const breadcrumbSchema = Array.from(breadcrumbItems).map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1, // Position starts at 1 now
        item: {
            '@id': item.href,
            name: item.textContent.trim(),
        },
    }));

    injectSchemaScript('breadcrumb-schema', 'BreadcrumbList', {
        itemListElement: breadcrumbSchema,
    });
}

document.addEventListener('DOMContentLoaded', function () {
    generateFaqSchema();
    generateBreadcrumbSchema();
});