// Either include this file in your code embed or copy the content and paste it in your code embed
(function getPricingCurrencyHelperInit() {
  let currencyCode = "";
  let pricingPlans;

  window.getPricingPlans = async function getPricingPlans() {
    if (pricingPlans) {
      return pricingPlans;
    }

    try {
      const pricingPayload = await fetch(
        "https://admin.typeform.com/bff/pricing/v3/initial-payload"
      ).then((res) => res.json());

      const corePlans = pricingPayload.plans.filter((plan) =>
        ["basic", "plus", "business", "enterprise"].includes(plan.planName)
      );
      const growthPlans = pricingPayload.plans.filter((plan) =>
        ["growth_essentials", "growth_pro", "growth_enterprise"].includes(
          plan.planName
        )
      );

      pricingPlans = {
        corePlans,
        growthPlans,
      };
    } catch (error) {
      console.error("Error fetching pricing info", error);
    }

    return pricingPlans;
  };

  window.getPricingCurrency = async function getPricingCurrency() {
    if (currencyCode) {
      return currencyCode;
    }

    try {
      const pricingPlans = await window.getPricingPlans();
      if (!pricingPlans) {
        return currencyCode;
      }

      const { corePlans } = pricingPlans;
      corePlans?.some((plan) => {
        if (!plan.pricing) {
          return false;
        }

        return Object.values(plan.pricing).some((pricingSet) => {
          if (pricingSet?.price?.currency?.code) {
            currencyCode = pricingSet.price.currency.code;
            return true;
          }
          return false;
        });
      });
    } catch (error) {
      console.error("Error fetching pricing info", error);
    }

    return currencyCode;
  };
})();
