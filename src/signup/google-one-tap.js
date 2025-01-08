(function googleOneTapInitScope() {
  const ONE_TAP_BLOCKED_URLS = [
    "/signup/",
    "/refer-a-friend/invite/",
    "/careers/",
  ];
  const GOOGLE_CLIENT_ID =
    "6362390987-tg4ho08ait31oaomjia4367ln4e047qd.apps.googleusercontent.com";

  function log(...args) {
    window.__DEBUG_ONETAP__ && console.trace("[GoogleOneTap]", ...args);
  }

  function parseJwt(token) {
    var base64Url = token.split(".")[1];
    var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    var jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    return JSON.parse(jsonPayload);
  }

  function isOneTapSupported() {
    const isVisitorAuthenticated = Cookies.get("tf_email"); // defined in root level
    const hasTargetingConsent = consentUtil.hasTargetingConsent(); // defined in root level
    const isMobileDevice = isMobile.any; // defined in root level

    if (isVisitorAuthenticated) {
      return false;
    }

    if (isMobileDevice && !hasTargetingConsent) {
      return false;
    }

    if (
      ONE_TAP_BLOCKED_URLS.some((path) =>
        window.location.pathname.includes(path)
      )
    ) {
      return false;
    }

    return true;
  }

  function initGoogleOneTap() {
    if (!isOneTapSupported()) {
      return;
    }

    const googleOneTapScript = document.createElement("script");
    googleOneTapScript.src = "https://accounts.google.com/gsi/client";
    googleOneTapScript.async = true;
    googleOneTapScript.id = "google-one-tap-script";
    googleOneTapScript.onload = function () {
      const { google } = window;

      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        context: "signup",
        itp_support: true,
        use_fedcm_for_prompt: true,
        cancel_on_tap_outside: false,
        callback: function googleClientInitializeCallback(credentialResponse) {
          if (!credentialResponse?.credential) {
            window.trackingHelper.trackTmpItemClicked(
              "google_one_tap_response_no_credential"
            );

            log(`Response doesn't have credential`);
            return;
          }

          // Needed to update navigation menu avatar to show loading staate
          window.dispatchEvent(new Event("user:loading"));

          let decodedToken = undefined;
          try {
            decodedToken = parseJwt(credentialResponse?.credential);

            if (!decodedToken?.email) {
              throw new Error("Empty token or email");
            }
          } catch (error) {
            window.trackingHelper.trackTmpItemClicked(
              "google_one_tap_response_faulty_token"
            );
            log(`Token decode error, ${error?.message}`);

            window.dispatchEvent(new Event("user:initial"));
            return;
          }

          const redirectUrl = window.signUpHelpers.getSocialSignupRedirectUrl(
            "google",
            decodedToken.email
          );

          window.signUpHelpers.setSignupCookies({
            provider: "google",
            isOneTap: true,
          });

          window.trackingHelper.trackItemClicked({
            item: "social_signup",
            item_type: "one_tap",
            label: "google",
            location: "body",
            typeform_property: "admin_access",
          });

          window.trackingHelper.trackTmpItemClicked("google_one_tap_signup");

          window.location.href = redirectUrl;
        },
      });

      window.trackingHelper.trackTmpItemClicked(
        "google_one_tap_client_initialized"
      );

      google.accounts.id.prompt((notification) => {
        switch (notification.getMomentType()) {
          case "display":
            window.trackingHelper.trackTmpItemClicked(
              "google_one_tap_prompt_displayed"
            );
            break;
          case "dismissed": {
            const dismissedReason = notification.getDismissedReason();

            window.trackingHelper.trackTmpItemClicked(
              `google_one_tap_prompt_dismissed_${dismissedReason}`
            );
            break;
          }
          case "skipped":
            window.trackingHelper.trackTmpItemClicked(
              "google_one_tap_prompt_skipped"
            );
            break;
        }
      });
    };

    document.body.appendChild(googleOneTapScript);
  }

  window.addEventListener("signup-helpers:loaded", () => {
    console.log("signup-helpers:loaded");
    const hasTargetingConsent = consentUtil?.hasTargetingConsent?.();

    if (hasTargetingConsent) {
      initGoogleOneTap();
    } else {
      window.addEventListener("OneTrustGroupsUpdated", function () {
        initGoogleOneTap();
      });
    }
  });
})();
