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
        const props = data || {};

        console.log("view_page_section", {
          page: window.location.href,
          title: document.title,
          ...window.trackingHelper.getMandatoryProperties(),
          ...props,
        });

        trackingClient.trackViewPageSection({
          page: window.location.href,
          title: document.title,
          ...window.trackingHelper.getMandatoryProperties(),
          ...props,
        });
      },
      trackEvent: (eventName, data) => {
        const props = {
          ...window.trackingHelper.getMandatoryProperties(),
          ...data,
        };
        console.log(eventName, props);
        trackingClient.sendEvent(eventName, props);
      },
      trackItemClicked: (trackingData, options) => {
        const { link_url: rawLinkUrl } = trackingData;
        const link_url = rawLinkUrl
          ? rawLinkUrl.replace(window.location.origin, "")
          : undefined;

        const props = {
          ...window.trackingHelper.getMandatoryProperties(),
          ...trackingData,
          link_url,
        };

        if (options) {
          trackingClient.trackItemClicked(props, options);
          return;
        }

        console.log("item_clicked", props);

        trackingClient.trackItemClicked(props);
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
