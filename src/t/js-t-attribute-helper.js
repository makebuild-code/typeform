
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
    const { event, in_view, ...trackingData } = getTrackingAttributes(element);

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

    if (typeof in_view !== undefined && in_view !== null && !event) {
      window.trackingHelper.trackPageNavigated(trackingData);
      return;
    }

    window.trackingHelper.trackEvent(event, trackingData);
  };


  // cc-t-in_view attribute is used to track when an element is in view
  window.addEventListener("DOMContentLoaded", function initInViewTracking() {
    const inViewElements = document.querySelectorAll("[cc-t-in_view]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            window.trackElementWithAttributes(entry.target);
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
  });
})();
