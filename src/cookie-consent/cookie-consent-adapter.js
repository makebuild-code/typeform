// Add this code to global webflow settings and include it in the body tag
(function cookieConsentAdapterScope() {
  let settingsClicked = false;
  let isFirstCallbackCall = true;
  const oneTrustCookiesRejectedEvent = new Event("oneTrustCookiesRejected");

  const callOneTrustSdk = function (callback) {
    if (!document.querySelector("#onetrust-consent-sdk")) {
      setTimeout(function () {
        callOneTrustSdk(callback);
      }, 100);
    } else {
      callback();
    }
  };

  function hideCookieBanner() {
    const shownBanner = document.querySelector(".show-cookie-banner");

    if (shownBanner) {
      shownBanner.classList.remove("show-cookie-banner");
    }
  }

  function onRejectAllCookies() {
    window.dispatchEvent(oneTrustCookiesRejectedEvent);
  }

  function onShowSettings(event) {
    if (event) {
      event.preventDefault();
    }

    settingsClicked = true;

    callOneTrustSdk(function sdkSettingsCallback() {
      window.OneTrust.ToggleInfoDisplay();

      const rejectAllButton = document.querySelector(
        ".ot-pc-refuse-all-handler"
      );

      if (rejectAllButton) {
        rejectAllButton.addEventListener("click", onRejectAllCookies);
      }

      settingsClicked = false;
    });
  }

  function onAllowAllCookies(event) {
    if (event) {
      event.preventDefault();
    }

    try {
      localStorage.setItem("CustomCookieBannerAcceptIntent", true);
    } catch (err) {
      console.warn("Localstorage is not accessible");
    }
    hideCookieBanner();

    callOneTrustSdk(function sdkAllowCallback() {
      window.OneTrust.AllowAll();
      window.OneTrust.TriggerGoogleAnalyticsEvent(
        "Inhouse Cookie Consent",
        "Banner Accept Cookies"
      );

      try {
        localStorage.removeItem("CustomCookieBannerAcceptIntent");
      } catch (err) {
        console.warn("Localstorage is not accessible");
      }
    });
  }

  window.OptanonWrapper = function OptanonWrapper() {
    // window.dispatchEvent(new Event('OneTrustGroupsUpdated'));
    if (isFirstCallbackCall) {
      isFirstCallbackCall = false;
      return;
    }

    if (!settingsClicked) {
      hideCookieBanner();
    }
  };

  function handleInitialCookieBannerVisibility() {
    let shouldShowBanner = false;
    if (document.cookie.indexOf("OptanonAlertBoxClosed") === -1) {
      shouldShowBanner = true;
    } else {
      const lastOnetrustUpdate = "2022/06/14, 16:51";
      const cookieString = document.cookie;
      let i =
        document.cookie.indexOf("OptanonAlertBoxClosed") +
        "OptanonAlertBoxClosed=".length;
      let dateString = "";

      while (cookieString[i] && cookieString[i] !== ";") {
        dateString += cookieString[i];
        i++; // This was causing the error because i was const
      }

      // check if reconsent needed because of onetrust list update
      if (new Date(`${lastOnetrustUpdate}`) > new Date(dateString)) {
        shouldShowBanner = true;
      }
    }

    // user accepted cookie but left the page before onetrust was called
    try {
      if (localStorage.getItem("CustomCookieBannerAcceptIntent")) {
        shouldShowBanner = false;
      }
    } catch (err) {
      console.warn("Localstorage was not accessible");
    }

    if (shouldShowBanner) {
      // change this classname according to webflow elements
      document.documentElement.classList.add("show-cookie-banner");
    }
  }

  try {
    if (localStorage.getItem("CustomCookieBannerAcceptIntent")) {
      onAllowAllCookies();
    }
  } catch (err) {
    console.warn("Localstorage is not accessible");
  }

  callOneTrustSdk(function setLanguage() {
    // change this part accoridng to your languge management
    // locale
    window?.OneTrust?.changeLanguage?.("en");
  });

  handleInitialCookieBannerVisibility();

  // Adds global helpers to window object so that you can call this functions anywere in webflow
  window.showCookieSettings = onShowSettings;
  window.callOneTrustSdk = callOneTrustSdk;
  window.hideCookieBanner = hideCookieBanner;
  window.onAllowAllCookies = onAllowAllCookies;
})();
