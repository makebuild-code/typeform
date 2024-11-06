let settingsClicked = false;
let isFirstCallbackCall = true;
const oneTrustCookiesRejectedEvent = new Event('oneTrustCookiesRejected');

const callOneTrustSdk = function (callback) {
  if (!document.querySelector('#onetrust-consent-sdk')) {
    setTimeout(function () {
      callOneTrustSdk(callback)
    }, 100)
  } else {
    callback()
  }
}

function hideBanner() {
  const shownBanner = document.querySelector('.show-cookie-banner');

  if (shownBanner) {
    shownBanner.classList.remove('show-cookie-banner')
  }
}

function onRejectAllCookies() {
  window.dispatchEvent(oneTrustCookiesRejectedEvent)
}

function onShowSettings(event) {
  event.preventDefault();
  settingsClicked = true;

  callOneTrustSdk(function sdkSettingsCallback() {
    window.OneTrust.ToggleInfoDisplay()

    const rejectAllButton = document.querySelector('.ot-pc-refuse-all-handler');

    if (rejectAllButton) {
      rejectAllButton.addEventListener('click', onRejectAllCookies)
    }

    settingsClicked = false;
  })
}

function onAllowAllCookies(event) {
  if (event) {
    event.preventDefault();
  }

  try {
    localStorage.setItem('CustomCookieBannerAcceptIntent', true)
  } catch (err) {
    console.warn('Localstorage is not accessible');
  }
  hideBanner();

  callOneTrustSdk(function sdkAllowCallback() {
    window.OneTrust.AllowAll();
    window.OneTrust.TriggerGoogleAnalyticsEvent('Inhouse Cookie Consent', 'Banner Accept Cookies');

    try {
      localStorage.removeItem('CustomCookieBannerAcceptIntent')
    } catch (err) {
      console.warn('Localstorage is not accessible');
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
    hideBanner();
  }
}

function attachCookieConsentListeners() {
  document.querySelector('#cookie-settings-link')?.addEventListener('click', onShowSettings);
  document.querySelector('#cookie-accept-btn')?.addEventListener('click', onAllowAllCookies);
}

try {
  if (localStorage.getItem('CustomCookieBannerAcceptIntent')) {
    onAllowAllCookies();
  }
} catch (err) {
  console.warn('Localstorage is not accessible');
}

callOneTrustSdk(function setLanguage() {
  // change this part accoridng to your languge management
  // locale
  window?.OneTrust?.changeLanguage?.('en')
})
attachCookieConsentListeners();
