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

  document.addEventListener(
    "DOMContentLoaded",
    function initLinkInterceptors() {
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
    }
  );
})();
