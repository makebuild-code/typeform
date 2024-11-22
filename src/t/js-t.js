// JS Tracking Helper
(function trackingCLientHelperScope() {
  const viewPagePropsMapping = [
    {
      isMatch: () => window.title === "Not Found",
      props: {
        typeform_property: "404_pages",
        section: "public_site_not_found",
      },
    },
    {
      isMatch: () => window.location.pathname.startsWith("/try"),
      props: {
        typeform_property: "landing_page",
      },
    },
    {
      isMatch: () => window.location.pathname.startsWith("/blog"),
      props: {
        typeform_property: "blog",
      },
    },
    {
      isMatch: () => window.location.pathname === "/connect",
      props: {
        typeform_property: "typeform_connect",
        section: "typeform_connect_home",
      },
    },
    {
      isMatch: () => window.location.pathname === "/connect/c",
      props: {
        typeform_property: "typeform_connect",
        section: "typeform_connect_category_page",
      },
    },
    {
      isMatch: () => {
        const [_, section, appSlug, integrationSlug] =
          window.location.pathname.split("/");
        if (section !== "/connect/" || !appSlug || !integrationSlug) {
          return false;
        }

        return true;
      },
      props: () => {
        const [_, section, appSlug, integrationSlug] =
          window.location.pathname.split("/");
        return {
          typeform_property: "typeform_connect",
          section: "typeform_connect_integration_page",
          typeform_connect_app: snakeCase(appSlug),
          typeform_connect_integration: snakeCase(integrationSlug),
        };
      },
    },
    {
      isMatch: () => {
        const [_, section, appSlug, integrationSlug] =
          window.location.pathname.split("/");
        if (section !== "/connect/" || !appSlug || !!integrationSlug) {
          return false;
        }
        return true;
      },
      props: () => {
        const [_, section, appSlug] = window.location.pathname.split("/");
        return {
          typeform_property: "typeform_connect",
          section: "typeform_connect_app_page",
          typeform_connect_app: appSlug,
        };
      },
    },
    {
      isMatch: () => window.location.pathname.startsWith("/templates"),
      props: {
        typeform_property: "public_template_gallery",
      },
    },
  ];

  function createTrackingHelper() {
    let _viewPageProps = {};

    const getViewPageProps = () => {
      const { props } =
        viewPagePropsMapping.find(({ isMatch }) => isMatch()) || {};
      const matchedProps = props
        ? typeof props === "function"
          ? props()
          : props
        : {};
      return {
        typeform_property: "public_site",
        ..._viewPageProps,
        ...matchedProps,
      };
    };

    const log = (...args) => {
      window.__DEBUG_TRACKING__ && console.trace(...args);
    };

    return {
      setPageTrackingProps: (props) => {
        _viewPageProps = {
          ..._viewPageProps,
          ...props,
        };
      },
      snakeCase: (value) => {
        const words =
          value
            // between lower & upper
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            // between number & letter
            .replace(/(\d)([A-Za-z])/g, "$1 $2")
            .replace(/([A-Za-z])(\d)/g, "$1 $2")
            // before last upper in a sequence followed by lower
            .replace(/\b([A-Z]+)([A-Z])([a-z])/, "$1 $2$3")
            .match(/[A-Za-z0-9]+/g) ?? [];

        return words.map((value) => value.toLowerCase()).join("_");
      },
      getPage: () => {
        return window.location.origin + window.location.pathname;
      },
      getMandatoryProperties: () => {
        const viewPageProps = getViewPageProps();
        return {
          category: "public_site",
          typeform_version: isMobile.any ? "mobile" : "v2",
          unique_pageview_id: uuidv4(),
          unique_sectionview_id: uuidv4(),
          attribution_user_id: window.getAttributionUserId(),
          page: window.trackingHelper.getPage(),
          tracking_session_id: Cookies.get("tracking_session_id"),
          event_owner: "site_team",
          ...viewPageProps,
          // country: {countryCode},
        };
      },
      trackViewPageSection: (data) => {
        const props = {
          page: window.location.href,
          title: document.title,
          ...window.trackingHelper.getMandatoryProperties(),
          ...(data || {}),
        };

        trackingClient.trackViewPageSection(props);

        log("view_page_section", props);
      },
      trackEvent: (eventName, data) => {
        const props = {
          ...window.trackingHelper.getMandatoryProperties(),
          ...data,
        };

        trackingClient.sendEvent(eventName, props);

        log(eventName, props);
      },
      trackItemClicked: (trackingData) => {
        const { link_url: rawLinkUrl } = trackingData;
        const link_url = rawLinkUrl
          ? rawLinkUrl.replace(window.location.origin, "")
          : undefined;

        const props = {
          ...window.trackingHelper.getMandatoryProperties(),
          ...trackingData,
          link_url,
        };

        trackingClient.trackItemClicked(props);
        log("item_clicked", props);
      },
      trackTmpItemClicked: (item, props) => {
        const trackingProps = {
          ...window.trackingHelper.getMandatoryProperties(),
          item,
          ...props,
        };
        trackingClient.trackTmpItemClicked(trackingProps);
        log("tmp_item_clicked", props);
      },
      trackLogin: (url, label, location = "") => {
        window.trackingHelper.trackItemClicked({
          item: "login",
          item_type: "link",
          link_url: url,
          label: window.trackingHelper.snakeCase(label),
          product: "typeform",
          location: location,
        });
      },
      trackSignup: (url, label, location = "") => {
        window.trackingHelper.trackItemClicked({
          item: "sign_up",
          item_type: "link",
          link_url: url,
          label: window.trackingHelper.snakeCase(label),
          product: "typeform",
          location: location,
        });
      },
      trackPageNavigated: (props) => {
        const documentHeight = document.body.offsetHeight - window.innerHeight;
        const scrollPercentage = window.scrollY / documentHeight;

        window.trackingHelper.trackEvent("page_navigated", {
          item: "scroll",
          ...props,
          location_depth: scrollPercentage,
        });
      },
    };
  }

  window.trackingHelper = createTrackingHelper();
})();

// Init JS Tracking
(function jsTrackingInitScope() {
  window.addEventListener("OneTrustGroupsUpdated", function () {
    // Now you can run following consentUtil check the exact consent.
    // Script tags above adds consentUtil helper to global window

    // TargetingConsent
    const hasTargetingConsent = consentUtil.hasTargetingConsent();

    // FunctionalConsent
    const hasFunctionalConsent = consentUtil.hasFunctionalConsent();

    // Performance Consent
    const hasPerformanceConsent = consentUtil.hasPerformanceConsent();

    if (hasTargetingConsent) {
      const clearbitScript = document.createElement("script");
      clearbitScript.id = "clearbit";
      clearbitScript.innerHTML = `!function(w){var clearbit=w.clearbit=w.clearbit||[];if(!clearbit.initialize)if(clearbit.invoked)w.console&&console.error&&console.error("Clearbit snippet included twice.");else{clearbit.invoked=!0;clearbit.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","page","once","off","on"];clearbit.factory=function(t){return function(){var e=Array.prototype.slice.call(arguments);e.unshift(t);clearbit?.push?.(e);return clearbit}};for(var t=0;t<clearbit.methods.length;t++){var e=clearbit.methods[t];clearbit[e]=clearbit.factory(e)}clearbit.load=function(t){var e=document.createElement("script");e.async=!0;e.src=("https:"===document.location.protocol?"https://":"http://")+"x.clearbitjs.com/v1/"+t+"/clearbit.js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(e,n)};clearbit.SNIPPET_VERSION="3.1.0"; clearbit.load("pk_76b17f79dd398468af3f36d637ba1002"); clearbit.page(); }}(window);`;

      document.body.appendChild(clearbitScript);
    }

    if (!hasFunctionalConsent) {
      fetch("https://www.typeform.com/api/track/page/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          typeformProperty: "public_site",
          title: document.title,
          url: window.location.href,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          typeformVersion: "v2",
          attributionUserId: window.getAttributionUserId(),
          locale: navigator.language,
        }),
      }).catch(() => {});
    }

    // For eg. initialize tracking when we have functional consent
    if (hasFunctionalConsent && !trackingClient.isInitialized("segment")) {
      attributionUtil.default.generateUser(
        ".typeform.com",
        window.getAttributionUserId()
      );
      trackingClient.default.init(
        // Segment Prod Key
        "13PRPoCAmemn6i0qZSq8pnKYbRZ57rTB",
        // Segment Dev key
        // 'N4DrQC6NYcQXbJZo6iAU2QLSymJGMQkI',
        trackingHelper.getMandatoryProperties(),
        {
          integrations: {
            All: true,
            Amplitude: hasPerformanceConsent,
            "Actions Amplitude": hasPerformanceConsent,
          },
        },
        "GTM-WH2ZQ3X" // GTM_ID
      );

      if (!window.analytics) return;

      window.analytics.ready(() => {
        window.trackingHelper.trackViewPageSection();

        if (window.reveal) {
          const { company } = window.reveal;

          if (company) {
            // Override default encoder
            const cookies = Cookies.withConverter({
              write: (value = {}) => JSON.stringify(value),
            });

            cookies.set(
              "clearbit-reveal",
              {
                employees: company.metrics.employees,
              },
              {
                domain: ".typeform.com",
              }
            );
          }
        }
      });
    }
  });
})();

// Tracking With Attributes Helper
(function initTrackingWithAttributesHelper() {
  // cc-t- prefixed attributes are used to for custom properties while tracking events
  function getTrackingAttributes(element) {
    return Array.from(element.attributes).reduce((acc, attr) => {
      if (attr.name.startsWith("cc-t-")) {
        acc[attr.name.replace("cc-t-", "")] = attr.value;
      }

      return acc;
    }, {});
  }

  window.trackElementWithAttributes = function trackElementWithAttributes(
    element
  ) {
    const { event, in_view, in_view_allow_multipe, ...trackingData } =
      getTrackingAttributes(element);

    if (event === "item_clicked") {
      if (!trackingData.item) {
        console.warn("Item attribute is required for tracking");
        return;
      }

      window.trackingHelper.trackItemClicked({
        ...trackingData,
        link_url: trackingData.link || element.href,
        item_type: trackingData.item_type || "link",
        label: window.trackingHelper.snakeCase(
          trackingData.label || element.textContent || ""
        ),
      });

      return;
    }

    if (in_view === "true" && !event) {
      window.trackingHelper.trackPageNavigated(trackingData);
      return;
    }

    if (!event) {
      return;
    }

    window.trackingHelper.trackEvent(event, trackingData);
  };

  // cc-t-in_view attribute is used to track when an element is in view
  const inViewElements = document.querySelectorAll("[cc-t-in_view]");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          window.trackElementWithAttributes(entry.target);
          if (
            entry.target.hasAttribute("cc-t-in_view_allow_multipe" === "true")
          ) {
            return;
          }

          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0,
      rootMargin: "0px",
    }
  );

  inViewElements.forEach((element) => {
    observer.observe(element);
  });
})();

// Global Link Interceptor
(function linkInterceptorScope() {
  const HOSTNAMES_ALLOWLIST = ["typeform.com"];
  const HOSTNAMES_BLOCKLIST = ["auth.typeform.com"];
  const listenersMap = new Map();

  const isAllowedHostname = (hostname = "") => {
    const isBlocked = HOSTNAMES_BLOCKLIST.some((hn) => hn === hostname);
    if (isBlocked) {
      return false;
    }

    return HOSTNAMES_ALLOWLIST.some((hn) => hostname.endsWith(hn));
  };
  const hasKeyPressed = (event) => {
    return ["ctrlKey", "shiftKey", "altKey", "metaKey"].some(
      (key) => event[key] === true
    );
  };
  const handleLinkClick = (link) => (event) => {
    const linkHref = link.href;
    const targetHref = event?.target?.href;
    const linkTarget = link?.target;
    const targetTarget = event?.target?.target;
    const href = linkHref || targetHref;
    const anchorTarget = linkTarget || targetTarget;

    // login tracking
    if (linkHref && linkHref.includes("login")) {
      window.trackingHelper.trackLogin(linkHref, anchorTarget.innerText || "");
      console.log("found login");
    }

    // signup tracking
    if (linkHref && linkHref.includes("signup")) {
      window.trackingHelper.trackSignup(linkHref, anchorTarget.innerText || "");
    }

    window.trackElementWithAttributes(link);
    if (link.nodeName === "BUTTON") {
      return;
    }

    // If the user had pressed a key when they click on a link then we'll use native link behaviour
    if (hasKeyPressed(event)) {
      return;
    }

    try {
      // Links without an href attribute
      if (!linkHref) {
        return;
      }

      // If the link is to an anchor on the same page, then we'll use native link behaviour
      if (linkHref.startsWith("#")) {
        return;
      }

      const destinationUrl = new URL(href);

      // If the link goes outside of typeform.com then we'll use native link behaviour
      if (!isAllowedHostname(destinationUrl.hostname)) {
        return;
      }

      event.preventDefault();

      const attributionUserId = window.getAttributionUserId();
      if (attributionUserId) {
        destinationUrl.searchParams.set(
          window.ATTRIBUTION_ID_GLOBAL_KEY,
          attributionUserId
        );
      }

      const destinationUrlString = destinationUrl.toString();
      // If we have a target value, then use it, otherwise change navigate in the same window.
      if (anchorTarget) {
        return window.open(destinationUrlString, anchorTarget);
      }
      window.location = destinationUrlString;
    } catch (e) {
      console.error("Error while intercepting link click", e);
    }
  };

  const getAllLinksAndButtonsToIntercept = (node) => {
    const container = node || document;
    const links = container.querySelectorAll("a");
    const buttons = container.querySelectorAll(
      'button[cc-t-event]:not([cc-t-event=""])'
    );

    return [...links, ...buttons];
  };

  const handleMutatedNode = (isRemoved) => (node) => {
    if (node instanceof HTMLElement) {
      const linksAndButtons = getAllLinksAndButtonsToIntercept(node);

      linksAndButtons.forEach((link) => {
        if (link.nodeName === "BUTTON" && !link.hasAttribute("cc-t-event")) {
          return;
        }

        const hasListener = listenersMap.has(link);

        if (!hasListener) {
          const listener = handleLinkClick(link);
          listenersMap.set(link, listener);
          link.addEventListener("click", listener);
        } else {
          if (isRemoved) {
            link.removeEventListener("click", listenersMap.get(link));
            listenersMap.delete(link);
          }
        }
      });
    }
  };

  const linkMutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutationRecord) => {
      if (mutationRecord.type === "childList") {
        mutationRecord.addedNodes.forEach(handleMutatedNode(false));
        mutationRecord.removedNodes.forEach(handleMutatedNode(true));
      }
    });
  });

  linkMutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  const linksAndButtons = getAllLinksAndButtonsToIntercept();

  linksAndButtons.forEach((link) => {
    const listener = handleLinkClick(link);
    listenersMap.set(link, listener);
    link.addEventListener("click", listener);
  });
})();