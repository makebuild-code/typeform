(function linkInterceptor() {
    const HOSTNAMES_ALLOWLIST = ['typeform.com', 'typeform-website.webflow.io'];
    const HOSTNAMES_BLOCKLIST = ['auth.typeform.com'];
    const listenersMap = new Map();

    const isAllowedHostname = (hostname = '') => {
      const isBlocked = HOSTNAMES_BLOCKLIST.some(hn => hn === hostname)
      if (isBlocked) {
        return false;
      }

      return HOSTNAMES_ALLOWLIST.some(hn => hostname.endsWith(hn))
    }
    const hasKeyPressed = event => {
      return [
        'ctrlKey',
        'shiftKey',
        'altKey',
        'metaKey',
      ].some(key => event[key] === true)
    }
    const handleLinkClick = link => event => {
      console.log('a link clicked');
      const linkHref = link.href
      const targetHref = event?.target?.href
      const linkTarget = link?.target
      const targetTarget = event?.target?.target
      const href = linkHref || targetHref
      const anchorTarget = linkTarget || targetTarget

      // login tracking
      if (linkHref && linkHref.includes('login')) {
        console.log('a login link clicked');
        window.trackingHelper.trackLogin(linkHref, anchorTarget.innerText || '')
      }

      // signup tracking
      if (linkHref && linkHref.includes('signup')) {
        console.log('a signup link clicked');
        window.trackingHelper.trackSignup(linkHref, anchorTarget.innerText || '')
      }

      // contact sales tracking
      if (linkHref && linkHref.includes('tfsales.typeform.com/to/PxcVKQGb')) {
        console.log('a contact sales link clicked');
        window.trackingHelper.trackContactSales(linkHref, anchorTarget.innerText || '')
      }

      // If the user had pressed a key when they click on a link then we'll use native link behaviour
      if (hasKeyPressed(event)) {
        return
      }

      try {
        // Links without an href attribute
        if (!linkHref) {
          console.log('link without href so returning');
          return
        }

        // If the link is to an anchor on the same page, then we'll use native link behaviour
        if (linkHref.startsWith('#')) {
          console.log('link starts with # so returning');
          return
        }

        const destinationUrl = new URL(href)

        // If the link goes outside of typeform.com then we'll use native link behaviour
        if (!isAllowedHostname(destinationUrl.hostname)) {
          console.log('not an allowed hostname so returning');
          return
        }

        event.preventDefault()

        const attributionUserId = window.getAttributionUserId()
        if (attributionUserId) {
          destinationUrl.searchParams.set(
            window.ATTRIBUTION_ID_GLOBAL_KEY,
            attributionUserId
          )
        }

        const destinationUrlString = destinationUrl.toString()
        // If we have a target value, then use it, otherwise change navigate in the same window.
        if (anchorTarget) {
          return window.open(destinationUrlString, anchorTarget)
        }
        window.location = destinationUrlString
      } catch (e) {
        console.log('Error handling link click', e)
      }
    };
    const handleMutatedNode = isRemoved => node => {
      if (node instanceof HTMLElement) {
        const links =
          node.nodeName === 'A' ? [node] : node.querySelectorAll('a')

        links.forEach(link => {
          const hasListener = listenersMap.has(link)

          if (!hasListener) {
            const listener = handleLinkClick(link)
            listenersMap.set(link, listener)
            link.addEventListener('click', listener)
          } else {
            if (isRemoved) {
              link.removeEventListener('click', listenersMap.get(link))
              listenersMap.delete(link);
            }
          }
        })
      }
    }
    console.log('link interceptors script loaded');
    document.addEventListener('DOMContentLoaded', function initLinkInterceptors() {
      console.log('setting up link interceptors');
      const linkMutationObserver = new MutationObserver(mutations => {
        mutations.forEach(mutationRecord => {
          if (mutationRecord.type === 'childList') {
            mutationRecord.addedNodes.forEach(handleMutatedNode(false));
            mutationRecord.removedNodes.forEach(handleMutatedNode(true));
          }
        });
      });

      linkMutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });

      const links = document.querySelectorAll('a');

      links.forEach(link => {
        const listener = handleLinkClick(link)
        listenersMap.set(link, listener);
        link.addEventListener('click', listener);
      });
    });
  })();