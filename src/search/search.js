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
        primary: context === 'connect' ? 'connect_apps_upload' : 'templates_upload',
        categories: context === 'connect' ? 'connect_categories_upload' : 'template_categories_upload'
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

    function getLocaleConfig() {
        const lang = document.documentElement.lang || 'en';
        
        return {
            templates: {
                en: {
                    titleField: 'Title',
                    slugField: 'Slug'
                },
                es: {
                    titleField: 'ES_Title',
                    slugField: 'ES_Slug'
                }
            },
            connect: {
                en: {
                    titleField: 'Name 2',
                    slugField: 'Slug'
                },
                es: {
                    titleField: 'Name 2',
                    slugField: 'Slug'
                }
            }
        }[context]?.[lang] || {
            titleField: context === 'connect' ? 'Name 2' : 'Title',
            slugField: 'Slug'
        };
    }

    const searchConfig = {
        connect: {
            searchableAttributes: ['Name 2'],
            urlPrefix: '/connect/'
        },
        templates: {
            searchableAttributes: [getLocaleConfig().titleField],
            urlPrefix: '/templates/'
        }
    }[context];

    const primarySearch = instantsearch({
        indexName: primaryIndex,
        searchClient,
        searchParameters: {
            analytics: false,
            clickAnalytics: false,
            enablePersonalization: false,
            getRankingInfo: false,
            searchableAttributes: searchConfig.searchableAttributes
        },
        insights: false
    });

    const secondarySearch = instantsearch({
        indexName: categoriesIndex,
        searchClient,
        searchParameters: {
            analytics: false,
            clickAnalytics: false,
            enablePersonalization: false,
            getRankingInfo: false,
            searchableAttributes: searchConfig.searchableAttributes
        },
        insights: false
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

    secondarySearch.addWidgets([
        instantsearch.widgets.stats({
            container: `[algolia-search-function='stats'][algolia-search-id='${getStatsContainerId(context, true)}']`,
            templates: {
                text: (data) => {
                    if (!data || typeof data.nbHits === 'undefined') {
                        return '';
                    }
                    logCategoriesStats(data.nbHits);
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
                const resetButton = document.querySelector('[algolia-search-function="reset"]');
                
                const debouncedRefine = _.debounce((value) => {
                    if (value.length >= 3) {
                        refine(value);
                    } else {
                        clear();
                    }
                }, 750);

                // Add a listener for when the search completes
                const hideSpinner = _.debounce(() => {
                    if (searchSpinner) {
                        searchSpinner.style.display = 'none';
                    }
                }, 1000);

                searchInput.addEventListener('input', (e) => {
                    const searchValue = e.target.value.trim();
                    
                    // Show spinner when typing starts
                    if (searchValue.length > 0 && searchSpinner) {
                        searchSpinner.style.display = 'block';
                    }

                    if (searchValue.length === 0) {
                        clear();
                        if (searchSpinner) searchSpinner.style.display = 'none';
                        if (searchResultsWrapper) {
                            searchResultsWrapper.style.display = 'none';
                        }
                    } else if (searchValue.length < 3) {
                        if (searchResultsWrapper) {
                            searchResultsWrapper.style.display = 'none';
                        }
                    } else {
                        debouncedRefine(searchValue);
                        // Schedule hiding of spinner
                        hideSpinner();
                    }
                    
                    updateResetButtonVisibility();
                    if (searchResultsWrapper) {
                        searchResultsWrapper.style.display = searchValue.length >= 3 ? 'block' : 'none';
                    }
                });

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

                searchInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        searchInput.value = '';
                        clear();
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
                        clear();
                        if (searchResultsWrapper) {
                            searchResultsWrapper.style.display = 'none';
                        }
                        updateResetButtonVisibility();
                    });
                }
                
                updateResetButtonVisibility();
            }

            // Update the input value when the query changes
            const searchInput = document.querySelector('input[cc-t-id="jetboost-search"]');
            if (searchInput && query !== searchInput.value) {
                searchInput.value = query;
            }
        }
    )();

    const primaryVirtualSearchBox = createVirtualSearchBox();
    const secondaryVirtualSearchBox = createVirtualSearchBox();

    function getHitsContainerId(context, isCategories = false) {
        if (context === 'connect') {
            return isCategories ? 'connect_categories' : 'connect';
        } else {
            return isCategories ? 'template-categories' : 'templates';
        }
    }

    primarySearch.addWidgets([
        primaryVirtualSearchBox,
        instantsearch.widgets.hits({
            container: `[algolia-search-function="results"][algolia-search-id="${getHitsContainerId(context)}"] .search-results_list`,
            transformItems(items) {
                if (!items || !Array.isArray(items)) return [];
                logTemplatesCount(items.length);
                return items;
            },
            templates: {
                item(hit, { html, components }) {
                    try {
                        const context = getSearchContext(document.querySelector('.algolia-search[cc-algolia-context]'));
                        const localeConfig = getLocaleConfig();
                        const lang = document.documentElement.lang || 'en';
                        const urlPrefixes = getUrlPrefixes(lang);
                        
                        const config = {
                            connect: {
                                urlPrefix: urlPrefixes.connect,
                                titleField: 'Name 2',
                                slugField: 'Slug'
                            },
                            templates: {
                                urlPrefix: urlPrefixes.templates,
                                titleField: localeConfig.titleField,
                                slugField: localeConfig.slugField
                            }
                        }[context];
                        
                        if (!hit || !hit[config.slugField]) return '';
                        
                        const displayTitle = String(hit[config.titleField] || '');
                        if (!displayTitle) return '';
                        
                        return html`
                            <a 
                                cc-t-id="jetboost-search-result-item" 
                                href="${config.urlPrefix}${hit[config.slugField]}" 
                                class="search-results_item w-inline-block"
                            >
                                <p cc-t-id="jetboost-search-result-item-title" class="text-sm">
                                    ${components.Highlight({ hit, attribute: config.titleField }) || displayTitle}
                                </p>
                            </a>
                        `;
                    } catch (error) {
                        return '';
                    }
                },
                empty: ({ query }, { html }) => html`
                    <div class="search-results_no-results">
                        <p class="text-sm u-text-bold">No results found</p>
                    </div>
                `
            }
        })
    ]);

    secondarySearch.addWidgets([
        secondaryVirtualSearchBox,
        instantsearch.widgets.hits({
            container: `[algolia-search-function="results"][algolia-search-id="${getHitsContainerId(context, true)}"] .search-results_list`,
            transformItems(items) {
                if (!items || !Array.isArray(items)) return [];
                logCategoriesCount(items.length);
                return items;
            },
            templates: {
                item(hit, { html, components }) {
                    try {
                        if (!hit || typeof hit !== 'object') return '';
                        
                        const isConnect = instanceType.startsWith('connect');
                        const localeConfig = getLocaleConfig();
                        const lang = document.documentElement.lang || 'en';
                        const urlPrefixes = getUrlPrefixes(lang);
                        
                        const titleField = isConnect ? 'Name 2' : localeConfig.titleField;
                        const slugField = isConnect ? 'Slug' : localeConfig.slugField;
                        
                        if (!hit[slugField] || !hit[titleField]) return '';
                        
                        const displayTitle = String(hit[titleField] || '');
                        if (!displayTitle) return '';
                        
                        const urlPrefix = isConnect ? urlPrefixes.connectCategory : urlPrefixes.templatesCategory;
                        
                        return html`
                            <a cc-t-id="jetboost-search-result-item" href="${urlPrefix}${hit[slugField]}" class="search-results_item w-inline-block">
                                <p cc-t-id="jetboost-search-result-item-title" class="text-sm">
                                    ${components.Highlight({ hit, attribute: titleField }) || displayTitle}
                                </p>
                            </a>
                        `;
                    } catch (error) {
                        return '';
                    }
                },
                empty: ({ query }, { html }) => html`
                    <div class="search-results_no-results">
                        <p class="text-sm u-text-bold">No results found</p>
                    </div>
                `
            },
            render({ results, widgetParams }) {
                try {
                    const resultsWrapper = document.querySelector('[algolia-search-function="results"][algolia-search-id="connect_categories"]');
                    
                    if (!results.query && resultsWrapper) {
                        resultsWrapper.style.display = 'none';
                        return;
                    }

                    if (resultsWrapper) {
                        resultsWrapper.style.display = 'block';
                    }
                } catch (error) {}
            }
        })
    ]);

    primarySearch.start();
    secondarySearch.start();
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