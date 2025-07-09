document.addEventListener('DOMContentLoaded', function() {
    // Helper function to get the language prefix and base path
    function getUrlParts() {
        const path = window.location.pathname;
        const isSpanish = path.startsWith('/es/');
        const languagePrefix = isSpanish ? '/es' : '';
        const basePricingPath = isSpanish ? '/precios' : '/pricing';
        return { languagePrefix, basePricingPath };
    }
    // Helper function to construct the new URL
    function constructUrl(pagePath, params) {
        const { languagePrefix } = getUrlParts();
        const queryString = params.toString();
        return `${languagePrefix}${pagePath}${queryString ? '?' + queryString : ''}`;
    }
    
    // Helper function to set up button event listeners
    function setupButtonListener(button, tabOption, basePricingPath) {
        if (button && !button.hasAttribute('data-listener-attached')) {
            button.setAttribute('data-listener-attached', 'true');
            
            const params = new URLSearchParams(window.location.search);
            
            if (params.get('taboption') === tabOption) {
                const currentParams = new URLSearchParams(window.location.search);
                currentParams.delete('taboption');
                const newUrl = tabOption === 'core' ? constructUrl(basePricingPath, currentParams) : constructUrl(`${basePricingPath}/${tabOption}`, currentParams);
                history.pushState({}, '', newUrl);
                button.click();
            }
            
            button.addEventListener('click', () => {
                const currentParams = new URLSearchParams(window.location.search);
                currentParams.delete('taboption');
                const newUrl = tabOption === 'core' ? constructUrl(basePricingPath, currentParams) : constructUrl(`${basePricingPath}/${tabOption}`, currentParams);
                history.pushState({}, '', newUrl);
                const baseUrl = window.location.origin;
                window.trackingHelper.trackViewPageSection({
                    page: baseUrl + newUrl
                });
            });
        }
    }
    
    // Check for existing buttons immediately
    const { basePricingPath } = getUrlParts();
    setupButtonListener(document.querySelector('[data-pricing-taboption="growth"]'), 'growth', basePricingPath);
    setupButtonListener(document.querySelector('[data-pricing-taboption="talent"]'), 'talent', basePricingPath);
    setupButtonListener(document.querySelector('[data-pricing-taboption="core"]'), 'core', basePricingPath);
    
    const growthObserver = new MutationObserver((mutations, obs) => {
        const growthButton = document.querySelector('[data-pricing-taboption="growth"]');
        if (growthButton) {
            setupButtonListener(growthButton, 'growth', basePricingPath);
            obs.disconnect();
        }
    });
    const talentObserver = new MutationObserver((mutations, obs) => {
        const talentButton = document.querySelector('[data-pricing-taboption="talent"]');
        if (talentButton) {
            setupButtonListener(talentButton, 'talent', basePricingPath);
            obs.disconnect();
        }
    });
    const coreObserver = new MutationObserver((mutations, obs) => {
        const coreButton = document.querySelector('[data-pricing-taboption="core"]');
        if (coreButton) {
            setupButtonListener(coreButton, 'core', basePricingPath);
            obs.disconnect();
        }
    });
    growthObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
    talentObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
    coreObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
});