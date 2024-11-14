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
