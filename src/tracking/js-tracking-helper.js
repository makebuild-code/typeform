window.trackingHelper = {
  snakeCase: (value) => {
    const words = value
      // between lower & upper
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // between number & letter
      .replace(/(\d)([A-Za-z])/g, '$1 $2')
      .replace(/([A-Za-z])(\d)/g, '$1 $2')
      // before last upper in a sequence followed by lower
      .replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1 $2$3')
      .match(/[A-Za-z0-9]+/g) ?? [];

    return words
      .map(value => value.toLowerCase())
      .join('_');
  },
  getPage: () => {
    return window.location.origin + window.location.pathname;
  },
  getMandatoryProperties: () => {
    return {
      category: 'public_site',
      typeform_version: isMobile.any ? 'mobile' : 'v2',
      typeform_property: 'public_site',
      unique_pageview_id: uuidv4(),
      unique_sectionview_id: uuidv4(),
      attribution_user_id: window.getAttributionUserId(),
      page: window.trackingHelper.getPage(),
      tracking_session_id: Cookies.get('tracking_session_id'),
      event_owner: 'site_team',
      // country: {countryCode},
    }
  },
  trackItemClicked: (trackingData, options) => {
    const { link_url: rawLinkUrl } = trackingData
    const link_url = rawLinkUrl ? rawLinkUrl.replace(window.location.origin, '') : undefined

    const props = {
      ...window.trackingHelper.getMandatoryProperties(),
      ...trackingData,
      link_url,
    }

    if (options) {
      trackingClient.trackItemClicked(props, options);
      return;
    }

    trackingClient.trackItemClicked(props);
  },
  trackSignup: (url, label, location = '') => {
    window.trackingHelper.trackItemClicked({
      item: 'sign_up',
      item_type: 'link',
      link_url: url,
      label: window.trackingHelper.snakeCase(label),
      product: 'typeform',
      location: location,
    });
  },
  trackLogin: (url, label, location = '') => {
    window.trackingHelper.trackItemClicked({
      item: 'login',
      item_type: 'link',
      link_url: url,
      label: window.trackingHelper.snakeCase(label),
      product: 'typeform',
      location: location,
    });
  },
}