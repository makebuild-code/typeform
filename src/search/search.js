// Add timeout handling for script loading
let initAttempts = 0;
const MAX_ATTEMPTS = 30; // 3 seconds (30 * 100ms)

// Create a state object to store the counts
const searchState = {
    templatesCount: 0,
    categoriesCount: 0
};

// Helper function to track combined results
const trackCombinedResults = _.debounce(() => {
    const totalCount = searchState.templatesCount + searchState.categoriesCount;
    
    if (window.trackingHelper) {
        const searchInput = document.querySelector('[cc-t-id="jetboost-search"]');
        const query = searchInput ? searchInput.value : '';
        
        // Only track if there's actually a search query
        if (!query.trim()) {
            return;
        }
        
        // Get location from algolia-search element
        const algoliaElement = document.querySelector('.algolia-search[cc-algolia-instance]');
        let location = '';
        
        if (algoliaElement) {
            const instanceType = algoliaElement.getAttribute('cc-algolia-instance');
            const pageSlug = algoliaElement.getAttribute('cc-algolia-page_slug');
            
            if (instanceType === 'templates_home') {
                location = 'templates_home';
            } else if (instanceType === 'templates_category' && pageSlug) {
                location = `category_${window.trackingHelper.snakeCase(pageSlug)}`;
            } else if (instanceType === 'templates_sub_category' && pageSlug) {
                location = `sub_category_${window.trackingHelper.snakeCase(pageSlug)}`;
            } else if (instanceType === 'connect') {
                location = 'connect';
            }
        }
        
        const trackingData = {
            search_query: window.trackingHelper.snakeCase(query),
            number_of_results: totalCount
        };

        // Only add location if it's not empty
        if (location) {
            trackingData.location = location;
        }

        window.trackingHelper.trackSearchQueryEntered(trackingData);
    }
}, 3000);

// Update the logging functions
const logTemplatesCount = _.debounce((count) => {
    searchState.templatesCount = count;
    trackCombinedResults();
}, 3000);

const logCategoriesCount = _.debounce((count) => {
    searchState.categoriesCount = count;
    trackCombinedResults();
}, 3000);

const logTemplatesStats = _.debounce((count) => {}, 1000);

const logCategoriesStats = _.debounce((count) => {}, 1000);

function getSearchContext(algoliaElement) {
    return algoliaElement?.getAttribute('cc-algolia-context') || 'templates';
}

function getSearchInstance(algoliaElement) {
    return algoliaElement?.getAttribute('cc-algolia-instance') || 'templates_home';
}

function getIndicesForContext(context) {
    return {
        primary: context === 'connect' ? 'csv_connect-unified' : 'csv_templates-unified',
        categories: null
    };
}

function initAlgoliaSearch() {
    // Check if required globals are available
    if (!window.algoliasearch || !window.instantsearch || !window._) {
        initAttempts++;
        if (initAttempts > MAX_ATTEMPTS) {
            return;
        }
        setTimeout(initAlgoliaSearch, 100);
        return;
    }

    // Wait for DOM content to be loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAlgoliaSearch);
        return;
    }

    const algoliaElement = document.querySelector('.algolia-search[cc-algolia-context]');
    const context = getSearchContext(algoliaElement);
    const instanceType = getSearchInstance(algoliaElement);
    const { primary: primaryIndex, categories: categoriesIndex } = getIndicesForContext(context);

    const searchClient = algoliasearch(
        'I2G92GH19H',
        '87a42220f4ea090a907ad412e0f52d60'
    );

    // Add middleware to log API calls
    const searchClientWithLogging = {
        ...searchClient,
        search(requests) {
            console.log('Algolia API Call:', requests);
            return searchClient.search(requests);
        }
    };

    function getLocaleConfig() {
        const lang = document.documentElement.lang || 'en';
        
        return {
            templates: {
                en: {
                    titleField: 'title',
                    slugField: 'slug'
                },
                es: {
                    titleField: 'title',
                    slugField: 'slug'
                }
            },
            connect: {
                en: {
                    titleField: 'title',
                    slugField: 'slug'
                },
                es: {
                    titleField: 'title',
                    slugField: 'slug'
                }
            }
        }[context]?.[lang] || {
            titleField: context === 'connect' ? 'title' : 'title',
            slugField: 'slug'
        };
    }

    const searchConfig = {
        connect: {
            searchableAttributes: ['title'],
            urlPrefix: '/connect/'
        },
        templates: {
            searchableAttributes: ['title'],
            urlPrefix: '/templates/'
        }
    }[context];

    const primarySearch = instantsearch({
        indexName: primaryIndex,
        searchClient: searchClientWithLogging,
        searchParameters: {
            analytics: false,
            clickAnalytics: false,
            enablePersonalization: false,
            getRankingInfo: false,
            searchableAttributes: searchConfig.searchableAttributes
        },
        insights: false,
        searchFunction(helper) {
            // Only perform search if there's a query
            if (helper.state.query && helper.state.query.length >= 3) {
                helper.search();
            }
        }
    });

    function getStatsContainerId(context, isCategories = false) {
        if (context === 'connect') {
            return isCategories ? 'connect_categories' : 'connect';
        } else {
            return isCategories ? 'template-categories' : 'templates';
        }
    }

    primarySearch.addWidgets([
        instantsearch.widgets.stats({
            container: `[algolia-search-function='stats'][algolia-search-id='${getStatsContainerId(context)}']`,
            templates: {
                text: (data) => {
                    if (!data || typeof data.nbHits === 'undefined') {
                        return '';
                    }
                    logTemplatesStats(data.nbHits);
                    return '';
                },
            },
        }),
    ]);

    const createVirtualSearchBox = () => instantsearch.connectors.connectSearchBox(
        (renderOptions, isFirstRender) => {
            const { refine, clear, query } = renderOptions;
            
            if (isFirstRender) {
                const searchInput = document.querySelector('input[cc-t-id="jetboost-search"]');
                const searchResultsWrapper = document.querySelector('.search-results_wrap');
                const searchSpinner = document.querySelector('.search-bar_spinner');
                const searchLoadingBar = document.querySelector('.search-bar_loading-bar');
                const resetButton = document.querySelector('[algolia-search-function="reset"]');
                
                const debouncedRefine = _.debounce((value) => {
                    if (value.length >= 3) {
                        refine(value);
                    }
                }, 750);

                const hideLoadingStates = _.debounce(() => {
                    if (searchSpinner) {
                        searchSpinner.style.display = 'none';
                    }
                    if (searchLoadingBar) {
                        searchLoadingBar.style.display = 'none';
                    }
                }, 1000);

                searchInput.addEventListener('input', (e) => {
                    const searchValue = e.target.value.trim();
                    
                    // Show loading states when typing starts
                    if (searchValue.length > 0) {
                        if (searchSpinner) {
                            searchSpinner.style.display = 'block';
                        }
                        if (searchLoadingBar) {
                            searchLoadingBar.style.display = 'block';
                        }
                    }

                    if (searchValue.length === 0) {
                        // Hide everything when input is empty
                        if (searchResultsWrapper) {
                            searchResultsWrapper.style.display = 'none';
                        }
                        if (searchSpinner) {
                            searchSpinner.style.display = 'none';
                        }
                        if (searchLoadingBar) {
                            searchLoadingBar.style.display = 'none';
                        }
                    } else if (searchValue.length < 3) {
                        if (searchResultsWrapper) {
                            searchResultsWrapper.style.display = 'none';
                        }
                    } else {
                        debouncedRefine(searchValue);
                        hideLoadingStates();
                        if (searchResultsWrapper) {
                            searchResultsWrapper.style.display = 'block';
                        }
                    }
                    
                    updateResetButtonVisibility();
                });

                // Update clear/reset handlers to hide loading states too
                document.querySelectorAll('[algolia-search-function="clear"]').forEach(clearButton => {
                    clearButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        searchInput.value = '';
                        if (searchResultsWrapper) {
                            searchResultsWrapper.style.display = 'none';
                        }
                        if (searchSpinner) {
                            searchSpinner.style.display = 'none';
                        }
                        if (searchLoadingBar) {
                            searchLoadingBar.style.display = 'none';
                        }
                        updateResetButtonVisibility();
                    });
                });

                searchInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        searchInput.value = '';
                        // Just hide results, don't trigger a search
                        if (searchResultsWrapper) {
                            searchResultsWrapper.style.display = 'none';
                        }
                        updateResetButtonVisibility();
                    }
                });

                const updateResetButtonVisibility = () => {
                    if (resetButton) {
                        if (searchInput.value.length >= 1) {
                            resetButton.classList.add('is-opacity-100');
                        } else {
                            resetButton.classList.remove('is-opacity-100');
                        }
                    }
                };
                
                if (resetButton) {
                    resetButton.addEventListener('click', () => {
                        searchInput.value = '';
                        if (searchResultsWrapper) {
                            searchResultsWrapper.style.display = 'none';
                        }
                        if (searchSpinner) {
                            searchSpinner.style.display = 'none';
                        }
                        if (searchLoadingBar) {
                            searchLoadingBar.style.display = 'none';
                        }
                        updateResetButtonVisibility();
                    });
                }
                
                updateResetButtonVisibility();
            }

            // Only update input value if it's different and not empty
            const searchInput = document.querySelector('input[cc-t-id="jetboost-search"]');
            if (searchInput && query !== searchInput.value && query) {
                searchInput.value = query;
            }
        }
    )();

    const primaryVirtualSearchBox = createVirtualSearchBox();

    function getHitsContainerId(context, isCategories = false) {
        if (context === 'connect') {
            return isCategories ? 'connect_categories' : 'connect';
        } else {
            return isCategories ? 'template-categories' : 'templates';
        }
    }

    primarySearch.addWidgets([
        primaryVirtualSearchBox,
        // Main hits widget (non-category items)
        instantsearch.widgets.hits({
            container: `[algolia-search-function="results"][algolia-search-id="${getHitsContainerId(context)}"] .search-results_list`,
            transformItems(items) {
                if (!items || !Array.isArray(items)) return [];
                const lang = document.documentElement.lang || 'en';
                const filteredItems = items
                    .filter(item => item.category !== 'template_category' && item.category !== 'connect_category')
                    .filter(item => !item.language || item.language === lang);
                logTemplatesCount(filteredItems.length);
                return filteredItems;
            },
            templates: {
                item(hit, { html, components }) {
                    try {
                        const lang = document.documentElement.lang || 'en';
                        const urlPrefixes = getUrlPrefixes(lang);
                        const isConnect = context === 'connect';
                        
                        if (!hit || !hit.slug || !hit.title) return '';
                        
                        const url = isConnect 
                            ? `${urlPrefixes.connect}${hit.slug}`
                            : `${urlPrefixes.templates}${hit.slug}`;
                        
                        return html`
                            <div class="ais-Hits-item">
                                <a 
                                    cc-t-id="jetboost-search-result-item" 
                                    href="${url}" 
                                    class="search-results_item w-inline-block"
                                >
                                    <p cc-t-id="jetboost-search-result-item-title" class="text-sm">
                                        ${components.Highlight({ hit, attribute: 'title' }) || String(hit.title)}
                                    </p>
                                </a>
                            </div>
                        `;
                    } catch (error) {
                        console.error('Error rendering hit:', error);
                        return '';
                    }
                },
                empty: ({ results }, { html }) => {
                    // Check if there were any hits before language filtering
                    const totalHits = results?.hits?.length || 0;
                    const lang = document.documentElement.lang || 'en';
                    const hitsInCurrentLang = results?.hits?.filter(hit => !hit.language || hit.language === lang).length || 0;
                    
                    // Only show "no results" if there were no hits at all,
                    // or if there were hits but none in the current language
                    if (totalHits === 0 || (totalHits > 0 && hitsInCurrentLang === 0)) {
                        return html`
                            <div class="search-results_no-results">
                                <p class="text-sm u-text-bold">No results found</p>
                            </div>
                        `;
                    }
                    return '';
                }
            }
        }),
        // Categories hits widget
        instantsearch.widgets.hits({
            container: '#hits-2',
            transformItems(items) {
                if (!items || !Array.isArray(items)) return [];
                const lang = document.documentElement.lang || 'en';
                const categoryItems = items
                    .filter(item => context === 'connect' ? item.category === 'connect_category' : item.category === 'template_category')
                    .filter(item => !item.language || item.language === lang);
                logCategoriesCount(categoryItems.length);
                return categoryItems;
            },
            templates: {
                item(hit, { html, components }) {
                    try {
                        const lang = document.documentElement.lang || 'en';
                        const urlPrefixes = getUrlPrefixes(lang);
                        const isConnect = context === 'connect';
                        
                        if (!hit || !hit.slug || !hit.title) return '';
                        
                        const url = isConnect 
                            ? `${urlPrefixes.connectCategory}${hit.slug}`
                            : `${urlPrefixes.templatesCategory}${hit.slug}`;
                        
                        return html`
                            <div class="ais-Hits-item">
                                <a 
                                    cc-t-id="jetboost-search-result-item" 
                                    href="${url}" 
                                    class="search-results_item w-inline-block"
                                >
                                    <p cc-t-id="jetboost-search-result-item-title" class="text-sm">
                                        ${components.Highlight({ hit, attribute: 'title' }) || String(hit.title)}
                                    </p>
                                </a>
                            </div>
                        `;
                    } catch (error) {
                        console.error('Error rendering category hit:', error);
                        return '';
                    }
                },
                empty: ({ results }, { html }) => {
                    // Check if there were any hits before language filtering
                    const totalHits = results?.hits?.length || 0;
                    const lang = document.documentElement.lang || 'en';
                    const hitsInCurrentLang = results?.hits?.filter(hit => !hit.language || hit.language === lang).length || 0;
                    
                    // Only show "no results" if there were no hits at all,
                    // or if there were hits but none in the current language
                    if (totalHits === 0 || (totalHits > 0 && hitsInCurrentLang === 0)) {
                        return html`
                            <div class="search-results_no-results">
                                <p class="text-sm u-text-bold">No results found</p>
                            </div>
                        `;
                    }
                    return '';
                }
            }
        })
    ]);

    primarySearch.start();
}

function handleSearchResultInteraction(searchResult, action) {
    const titleElement = searchResult.querySelector('[cc-t-id="jetboost-search-result-item-title"]');
    const titleText = titleElement ? titleElement.textContent.trim() : 'Unknown Title';

    const allResults = document.querySelectorAll('[cc-t-id="jetboost-search-result-item"]');
    const position = Array.from(allResults).indexOf(searchResult) + 1;
    const totalResults = allResults.length;

    const searchInput = document.querySelector('[cc-t-id="jetboost-search"]');
    const jetboostSearchQuery = searchInput ? searchInput.value : '';

    const algoliaElement = document.querySelector('.algolia-search[cc-algolia-instance]');
    let location = '';
    
    if (algoliaElement) {
        const instanceType = algoliaElement.getAttribute('cc-algolia-instance');
        const pageSlug = algoliaElement.getAttribute('cc-algolia-page_slug');
        
        if (instanceType === 'templates_home') {
            location = 'templates_home';
        } else if (instanceType === 'templates_category' && pageSlug) {
            location = `category_${window.trackingHelper.snakeCase(pageSlug)}`;
        } else if (instanceType === 'templates_sub_category' && pageSlug) {
            location = `sub_category_${window.trackingHelper.snakeCase(pageSlug)}`;
        } else if (instanceType === 'connect') {
            location = 'connect';
        }
    }

    if (window.trackingHelper) {
        const trackingData = {
            item: 'search_result',
            link_url: searchResult.href,
            label: window.trackingHelper.snakeCase(jetboostSearchQuery),
            value: window.trackingHelper.snakeCase(titleText),
            search_result_clicked: window.trackingHelper.snakeCase(titleText),
            position_selected: `${position}/${totalResults}`,
            action: action
        };

        // Only add location if it's not empty
        if (location) {
            trackingData.location = location;
        }

        window.trackingHelper.trackItemClicked(trackingData);
    }
}

document.addEventListener('click', event => {
    const searchResult = event.target.closest('[cc-t-id="jetboost-search-result-item"]');
    if (searchResult) handleSearchResultInteraction(searchResult, 'click');
});

document.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        const searchResult = document.activeElement.closest('[cc-t-id="jetboost-search-result-item"]');
        if (searchResult) {
            event.preventDefault();
            handleSearchResultInteraction(searchResult, 'enter');
            window.location.href = searchResult.href;
        }
    }
});

initAlgoliaSearch();

function getUrlPrefixes(lang) {
    return {
        en: {
            templates: '/templates/',
            templatesCategory: '/templates-category/',
            connect: '/connect/',
            connectCategory: '/connect-category/'
        },
        es: {
            templates: '/es/plantillas/',
            templatesCategory: '/es/plantillas-category/',
            connect: '/connect/',
            connectCategory: '/connect-category/'
        }
    }[lang] || {
        templates: '/templates/',
        templatesCategory: '/templates-category/',
        connect: '/connect/',
        connectCategory: '/connect-category/'
    };
}