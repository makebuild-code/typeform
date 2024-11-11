window.ATTRIBUTION_ID_GLOBAL_KEY = 'tid';

function setGlobalAttributionId() {
  const attributionIdFromQueryString = new URLSearchParams(
    window.location.search
  ).get(window.ATTRIBUTION_ID_GLOBAL_KEY);

  const attributionIdFromState = window.history.state ? window.history.state?.[window.ATTRIBUTION_ID_GLOBAL_KEY] : '';

  const referrer = document.referrer

  if (attributionIdFromState) {
    window[window.ATTRIBUTION_ID_GLOBAL_KEY] = attributionIdFromState;
  } else if (
    attributionIdFromQueryString &&
    referrer.includes("typeform.com")) {
    window[window.ATTRIBUTION_ID_GLOBAL_KEY] = attributionIdFromQueryString;
  }

  if (attributionIdFromQueryString) {
    const urlObj = new URL(window.location.href);
    urlObj.searchParams.delete(window.ATTRIBUTION_ID_GLOBAL_KEY);

    const urlWithoutAttributionId = urlObj.toString();

    window.history.replaceState(
      {
        ...window.history.state,
        [window.ATTRIBUTION_ID_GLOBAL_KEY]: window[window.ATTRIBUTION_ID_GLOBAL_KEY],
      },
      "",
      urlWithoutAttributionId
    );
  }
}

window.getAttributionUserId = function getAttributionUserId() {
  return window[window.ATTRIBUTION_ID_GLOBAL_KEY] || null;
};
window.setAttributionUserId = function setAttributionUserId(id) {
  window[window.ATTRIBUTION_ID_GLOBAL_KEY] = id;
};

function syncAttributionIdState() {
  const attributionUserIdFromCookie = Cookies.get('attribution_user_id')
  const attributionUserIdFromState = window.getAttributionUserId()
  /*
    1. If attribution cookie is present and different than global attribution id
    use attribution cookie as source of truth
  */
  if (
    attributionUserIdFromCookie &&
    attributionUserIdFromCookie !== attributionUserIdFromState
  ) {
    window.setAttributionUserId(attributionUserIdFromCookie)
  }

  /*
    2. If global attribution id is undefined/null create a new uuid
  */
  if (!window.getAttributionUserId()) {
    window.setAttributionUserId(uuidv4())
  }
  /*
    3. Finally, replace history state with the latest attribution id
    so that back/forward/refresh actions have the current state
  */
  window.history.replaceState(
    {
      ...window.history.state,
      [window.ATTRIBUTION_ID_GLOBAL_KEY]: window.getAttributionUserId(),
    },
    '',
    window.location.href
  )
}

setGlobalAttributionId();
syncAttributionIdState();