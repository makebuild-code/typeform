// Add timeout handling for script loading
let initAttempts = 0;
const MAX_ATTEMPTS = 30; // 3 seconds (30 * 100ms)

function initAlgoliaSearch() {
    // Check if required globals are available
    if (!window.algoliasearch || !window.instantsearch || !window._) {
        initAttempts++;
        if (initAttempts > MAX_ATTEMPTS) {
            console.error('Failed to load Algolia scripts or Lodash after 3 seconds');
            return;
        }
        console.log('Waiting for Algolia scripts and Lodash...');
        setTimeout(initAlgoliaSearch, 100);
        return;
    }

    // Wait for DOM content to be loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAlgoliaSearch);
        return;
    }

    const searchClient = algoliasearch(
        'I2G92GH19H',
        '87a42220f4ea090a907ad412e0f52d60'
    );

    // Create separate search instances for each index
    const templatesSearch = instantsearch({
        indexName: 'templates_upload',
        searchClient,
        searchParameters: {
            analytics: false,        // Disables search analytics
            clickAnalytics: false,   // Disables click tracking
            enablePersonalization: false,  // Disables personalization
            getRankingInfo: false    // Disables detailed ranking info collection
          },
          insights: false,   
    });

    // Add stats widget for templates
    templatesSearch.addWidgets([
        instantsearch.widgets.stats({
            container: "div[algolia-search-id='templates'][algolia-search-function='stats']",
            templates: {
                text: (data) => {
                    if (!data || typeof data.nbHits === 'undefined') {
                        return '';
                    }
                    return '';
                },
            },
        }),
    ]);

    const categoriesSearch = instantsearch({
        indexName: 'template-categories_upload',
        searchClient,
        searchParameters: {
            analytics: false,        // Disables search analytics
            clickAnalytics: false,   // Disables click tracking
            enablePersonalization: false,  // Disables personalization
            getRankingInfo: false    // Disables detailed ranking info collection
          },
          insights: false,   
    });

    // Add stats widget for categories
    categoriesSearch.addWidgets([
        instantsearch.widgets.stats({
            container: "div[algolia-search-id='template-categories'][algolia-search-function='stats']",
            templates: {
                text: (data) => {
                    return '';
                },
            },
        }),
    ]);

    // Create separate virtual search boxes for each instance
    const createVirtualSearchBox = () => instantsearch.connectors.connectSearchBox(
        (renderOptions, isFirstRender) => {
            const { refine, clear, query } = renderOptions;
            
            if (isFirstRender) {
                const searchInput = document.querySelector('input[cc-t-id="jetboost-search"]');
                const searchResultsWrapper = document.querySelector('.search-results_wrap');
                const resetButton = document.querySelector('[algolia-search-function="reset"]');
                
                // Add event listeners for clear search buttons
                document.querySelectorAll('[algolia-search-function="clear"]').forEach(clearButton => {
                    clearButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        searchInput.value = '';
                        clear();
                        if (searchResultsWrapper) {
                            searchResultsWrapper.style.display = 'none';
                        }
                        updateResetButtonVisibility();
                    });
                });

                // Update reset button visibility based on input content
                const updateResetButtonVisibility = () => {
                    if (resetButton) {
                        if (searchInput.value.length >= 1) {
                            resetButton.classList.add('is-opacity-100');
                        } else {
                            resetButton.classList.remove('is-opacity-100');
                        }
                    }
                };
                
                searchInput.addEventListener('input', (e) => {
                    const searchValue = e.target.value.trim();
                    if (searchValue.length > 0) {
                        refine(searchValue);
                    } else {
                        clear();
                    }
                    updateResetButtonVisibility();
                    if (searchResultsWrapper) {
                        searchResultsWrapper.style.display = searchValue ? 'block' : 'none';
                    }
                });
                
                if (resetButton) {
                    resetButton.addEventListener('click', () => {
                        searchInput.value = '';
                        clear();
                        if (searchResultsWrapper) {
                            searchResultsWrapper.style.display = 'none';
                        }
                        updateResetButtonVisibility();
                    });
                }
                
                updateResetButtonVisibility();
            }
        }
    )();

    // Create separate instances for each search
    const templatesVirtualSearchBox = createVirtualSearchBox();
    const categoriesVirtualSearchBox = createVirtualSearchBox();

    // Add widgets to templates search
    templatesSearch.addWidgets([
        templatesVirtualSearchBox,
        instantsearch.widgets.hits({
            container: '[algolia-search-function="results"][algolia-search-id="templates"] .search-results_list',
            transformItems(items) {
                if (!items || !Array.isArray(items)) return [];
                console.log('Templates rendering items:', items.length);
                return items;
            },
            templates: {
                item(hit, { html, components }) {
                    try {
                        // More defensive checking of hit data
                        if (!hit || typeof hit !== 'object') return '';
                        if (!hit.Slug || !hit.Title) return '';
                        
                        // Ensure Title exists and is a string
                        const Title = String(hit.Title || '');
                        
                        // Return empty string if no content to render
                        if (!Title) return '';
                        
                        return html`
                            <a 
                                cc-t-id="jetboost-search-result-item" 
                                href="/templates/${hit.Slug}" 
                                class="search-results_item w-inline-block"
                            >
                                <p cc-t-id="jetboost-search-result-item-Title" class="text-sm u-text-bold">
                                    ${components.Highlight({ hit, attribute: 'Title' }) || Title}
                                </p>
                            </a>
                        `;
                    } catch (error) {
                        console.error('Error rendering template hit:', error, 'Hit data:', hit);
                        return '';
                    }
                },
                empty: 'No results found' // Provide a default empty template
            },
            render({ results, widgetParams }) {
                try {
                    if (!results) return;
                    
                    const noResultsElement = document.querySelector('[algolia-search-function="no-results"][algolia-search-id="templates"]');
                    const resultsWrapper = document.querySelector('[algolia-search-function="results"][algolia-search-id="templates"]');
                    
                    // Only show elements if there's a search query
                    if (!results.query) {
                        if (noResultsElement) noResultsElement.style.display = 'none';
                        if (resultsWrapper) resultsWrapper.style.display = 'none';
                        return;
                    }

                    // Show appropriate element based on results
                    if (noResultsElement && resultsWrapper) {
                        if (!results.nbHits || results.nbHits === 0) {
                            noResultsElement.style.display = 'flex';
                            resultsWrapper.style.display = 'none';
                        } else {
                            noResultsElement.style.display = 'none';
                            resultsWrapper.style.display = 'block';
                        }
                    }
                } catch (error) {
                    console.error('Error rendering template results:', error);
                }
            }
        })
    ]);

    // Add widgets to categories search
    categoriesSearch.addWidgets([
        categoriesVirtualSearchBox,
        instantsearch.widgets.hits({
            container: '[algolia-search-function="results"][algolia-search-id="template-categories"] .search-results_list',
            transformItems(items) {
                if (!items || !Array.isArray(items)) return [];
                console.log('Categories rendering items:', items.length);
                return items;
            },
            templates: {
                item(hit, { html, components }) {
                    try {
                        // More defensive checking of hit data
                        if (!hit || typeof hit !== 'object') return '';
                        if (!hit.Slug || !hit.Title) return '';
                        
                        // Ensure Title exists and is a string
                        const Title = String(hit.Title || '');
                        
                        // Return empty string if no content to render
                        if (!Title) return '';
                        
                        return html`
                            <a cc-t-id="jetboost-search-result-item" href="/categories/${hit.Slug}" class="search-results_item w-inline-block">
                                <p cc-t-id="jetboost-search-result-item-Title" class="text-sm u-text-bold">
                                    ${components.Highlight({ hit, attribute: 'Title' }) || Title}
                                </p>
                            </a>
                        `;
                    } catch (error) {
                        console.error('Error rendering category hit:', error, 'Hit data:', hit);
                        return '';
                    }
                },
                empty: 'No results found' // Provide a default empty template
            },
            render({ results, widgetParams }) {
                try {
                    const noResultsElement = document.querySelector('[algolia-search-function="no-results"][algolia-search-id="template-categories"]');
                    const resultsWrapper = document.querySelector('[algolia-search-function="results"][algolia-search-id="template-categories"]');
                    const renderedHits = document.querySelectorAll('[algolia-search-function="results"][algolia-search-id="template-categories"] .search-results_item').length;
                    
                    console.log('Categories total hits:', results.nbHits, 'Rendered hits:', renderedHits);
                    
                    // Only show elements if there's a search query
                    if (!results.query) {
                        if (noResultsElement) noResultsElement.style.display = 'none';
                        if (resultsWrapper) resultsWrapper.style.display = 'none';
                        return;
                    }

                    // Show appropriate element based on results
                    if (noResultsElement && resultsWrapper) {
                        if (results.nbHits === 0) {
                            noResultsElement.style.display = 'flex';
                            resultsWrapper.style.display = 'none';
                        } else {
                            noResultsElement.style.display = 'none';
                            resultsWrapper.style.display = 'block';
                        }
                    }
                } catch (error) {
                    console.error('Error rendering category results:', error);
                }
            }
        })
    ]);

    // Start both search instances
    templatesSearch.start();
    categoriesSearch.start();
}

// Start the initialization process
initAlgoliaSearch();