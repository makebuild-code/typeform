(function getPricingCurrencyHelperInit() {
  let currencyCode = "";
  let pricingPlans;

  const BillingPeriod = {
    Monthly: "monthly",
    Yearly: "yearly",
  };

  const pricingPlanNames = {
    basic: "basic",
    plus: "plus",
    business: "business",
    enterprise: "enterprise_tier_1_self_serve",
    growth_essentials: "growth_essentials",
    growth_pro: "growth_pro",
    growth_enterprise: "growth_enterprise",
    talent: "talent",
    talent_enterprise: "talent_enterprise",
  };

  const CORE_PLAN_NAMES = [
    pricingPlanNames.basic,
    pricingPlanNames.plus,
    pricingPlanNames.business,
    pricingPlanNames.enterprise,
  ];

  const GROWTH_PLAN_NAMES = [
    pricingPlanNames.growth_essentials,
    pricingPlanNames.growth_pro,
    pricingPlanNames.growth_enterprise,
  ];  
  
  const TALENT_PLAN_NAMES = [
    pricingPlanNames.talent,
    pricingPlanNames.talent_enterprise,
  ];

  const PLANS_WITH_CUSTOM_PRICING = [
    pricingPlanNames.enterprise,
    pricingPlanNames.growth_enterprise,
    pricingPlanNames.talent_enterprise,
  ];

  function calculateYearlySavingForPricing(pricing) {
    if (!pricing?.[BillingPeriod.Monthly]?.visiblePrice || !pricing?.[BillingPeriod.Yearly]?.visiblePrice) {
      return null;
    }

    // Use the visible prices (which are already rounded) instead of raw base amounts
    const monthlyPrice = pricing[BillingPeriod.Monthly].visiblePrice.price;
    const yearlyPrice = pricing[BillingPeriod.Yearly].visiblePrice.price;
    
    // Calculate: (monthly price × 12) - yearly total price
    return (monthlyPrice * 12) - (yearlyPrice * 12);
  }

  function applyVisiblePricing(plan) {
    if (
      !plan.pricing ||
      !plan.pricing[BillingPeriod.Yearly]?.price ||
      !plan.pricing[BillingPeriod.Monthly]?.price
    ) {
      return;
    }

    const yearlyBaseAmount =
      plan.pricing[BillingPeriod.Yearly].price.base_amount;
    const monthlyBaseAmount =
      plan.pricing[BillingPeriod.Monthly].price.base_amount;

    plan.pricing[BillingPeriod.Yearly].visiblePrice = {
      price: Math.ceil(yearlyBaseAmount / 12 / 1000),
      currency: plan.pricing[BillingPeriod.Yearly].price.currency,
    };
    plan.pricing[BillingPeriod.Monthly].visiblePrice = {
      price: Math.ceil(monthlyBaseAmount / 1000),
      currency: plan.pricing[BillingPeriod.Yearly].price.currency,
    };
  }

  function transformPlans(plans, allowedPlanCodes = CORE_PLAN_NAMES) {
    return plans
      .filter(({ planName }) => allowedPlanCodes.includes(planName))
      .map((plan) => {
        const result = {
          ...plan,
        };

        applyVisiblePricing(result);
        
        // Calculate yearly savings AFTER visible pricing is applied
        result.yearlySaving = calculateYearlySavingForPricing(result.pricing);

        if (PLANS_WITH_CUSTOM_PRICING.includes(result.planName)) {
          delete result.pricing;
          result.isEnterprisePlan = true;
        }

        return result;
      });
  }

  window.getPricingPlans = async function getPricingPlans() {
    if (pricingPlans) {
      return pricingPlans;
    }

    try {
      // Get currency from URL query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const currencyParam = urlParams.get('cur')?.toLowerCase();
      
      // Determine which payload file to load based on currency parameter
      let payloadFileName = 'v4-initial-payload_usd.json'; // default
      if (currencyParam === 'gbp') {
        payloadFileName = 'v4-initial-payload_gbp.json';
      } else if (currencyParam === 'usd') {
        payloadFileName = 'v4-initial-payload_usd.json';
      } else if (currencyParam === 'eur') {
        payloadFileName = 'v4-initial-payload_eur.json';
      }
      
      const pricingPayload = await fetch(
        `https://static.makebuild.studio/client-assets/typeform/pricing-july-2025/${payloadFileName}`
      ).then((res) => res.json());

      const corePlans = transformPlans(pricingPayload.plans, CORE_PLAN_NAMES);
      const growthPlans = transformPlans(pricingPayload.plans, GROWTH_PLAN_NAMES);
      const talentPlans = transformPlans(pricingPayload.plans, TALENT_PLAN_NAMES);

      pricingPlans = {
        corePlans,
        growthPlans,
        talentPlans,
      };
    } catch (error) {
      console.error("Error fetching pricing info", error);
    }

    return pricingPlans;
  };

  window.getPricingCurrency = async function getPricingCurrency() {
    const DEFAULT_CURRENCY_CODE = 'USD';
    
    if (currencyCode) {
      return currencyCode;
    }

    try {
      const pricingPlans = await window.getPricingPlans();
      if (!pricingPlans) {
        return DEFAULT_CURRENCY_CODE;
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
      return DEFAULT_CURRENCY_CODE;
    }

    return currencyCode || DEFAULT_CURRENCY_CODE;
  };
})();

async function updateCurrencyElements() {
  const currency = await getPricingCurrency();
  document.querySelectorAll('[data-pricing-id="currency"]').forEach(element => {
      element.innerHTML = currency;
  });
}

async function updatePricingElements() {
    const pricingPlans = await getPricingPlans();
    
    // Define both core and growth plans
    const corePlanTypes = ['basic', 'plus', 'business'];
    const growthPlanTypes = ['growth_essentials', 'growth_pro'];
    const talentPlanTypes = ['talent'];
    
    const currencyCode = await getPricingCurrency();
    
    // Handle core plans
    corePlanTypes.forEach(planType => {
        const plan = pricingPlans?.corePlans?.find(plan => plan.planName === planType);
        
        // Monthly pricing
        const monthlyPrice = plan?.pricing?.monthly?.visiblePrice;
        if (monthlyPrice) {
            document.querySelectorAll(`[data-pricing-plan="${planType}"][data-pricing-id="monthly-total"]`)
                .forEach(element => {
                    element.innerHTML = monthlyPrice.price.toLocaleString();
                });

            // Monthly-annual-total
            const monthlyAnnualTotal = (monthlyPrice.price * 12);
            document.querySelectorAll(`[data-pricing-plan="${planType}"][data-pricing-id="monthly-annual-total"]`)
                .forEach(element => {
                    element.innerHTML = monthlyAnnualTotal.toLocaleString();
                });
        }

        // Yearly pricing
        const yearlyPrice = plan?.pricing?.yearly?.visiblePrice;
        if (yearlyPrice) {
            document.querySelectorAll(`[data-pricing-plan="${planType}"][data-pricing-id="yearly-total"]`)
                .forEach(element => {
                    element.innerHTML = yearlyPrice.price.toLocaleString();
                });
        }
    });

    // Handle growth plans
    growthPlanTypes.forEach(planType => {
        const plan = pricingPlans?.growthPlans?.find(plan => plan.planName === planType);
        
        // Monthly pricing
        const monthlyPrice = plan?.pricing?.monthly?.visiblePrice;
        if (monthlyPrice) {
            document.querySelectorAll(`[data-pricing-plan="${planType}"][data-pricing-id="monthly-total"]`)
                .forEach(element => {
                    element.innerHTML = monthlyPrice.price.toLocaleString();
                });

            // Monthly-annual-total
            const monthlyAnnualTotal = (monthlyPrice.price * 12);
            document.querySelectorAll(`[data-pricing-plan="${planType}"][data-pricing-id="monthly-annual-total"]`)
                .forEach(element => {
                    element.innerHTML = monthlyAnnualTotal.toLocaleString();
                });
        }

        // Yearly pricing
        const yearlyPrice = plan?.pricing?.yearly?.visiblePrice;
        if (yearlyPrice) {
            document.querySelectorAll(`[data-pricing-plan="${planType}"][data-pricing-id="yearly-total"]`)
                .forEach(element => {
                    element.innerHTML = yearlyPrice.price.toLocaleString();
                });
        }
    });

    // Handle talent plans
    talentPlanTypes.forEach(planType => {
        const plan = pricingPlans?.talentPlans?.find(plan => plan.planName === planType);
        
        // Monthly pricing
        const monthlyPrice = plan?.pricing?.monthly?.visiblePrice;
        if (monthlyPrice) {
            document.querySelectorAll(`[data-pricing-plan="${planType}"][data-pricing-id="monthly-total"]`)
                .forEach(element => {
                    element.innerHTML = monthlyPrice.price.toLocaleString();
                });

            // Monthly-annual-total
            const monthlyAnnualTotal = (monthlyPrice.price * 12);
            document.querySelectorAll(`[data-pricing-plan="${planType}"][data-pricing-id="monthly-annual-total"]`)
                .forEach(element => {
                    element.innerHTML = monthlyAnnualTotal.toLocaleString();
                });
        }

        // Yearly pricing
        const yearlyPrice = plan?.pricing?.yearly?.visiblePrice;
        if (yearlyPrice) {
            document.querySelectorAll(`[data-pricing-plan="${planType}"][data-pricing-id="yearly-total"]`)
                .forEach(element => {
                    element.innerHTML = yearlyPrice.price.toLocaleString();
                });
        }
    });
}
async function updateYearlySavings() {
    const pricingPlans = await getPricingPlans();
    
    // Define all plan types we want to update
    const corePlanTypes = ['basic', 'plus', 'business'];
    const growthPlanTypes = ['growth_essentials', 'growth_pro'];
    const talentPlanTypes = ['talent'];
    const allPlanTypes = [...corePlanTypes, ...growthPlanTypes, ...talentPlanTypes];
    
    // Loop through each plan type
    allPlanTypes.forEach(planType => {
        // Check in corePlans, growthPlans and talentPlans
        const plan = pricingPlans?.corePlans?.find(plan => plan.planName === planType) ||
                    pricingPlans?.growthPlans?.find(plan => plan.planName === planType) ||
                    pricingPlans?.talentPlans?.find(plan => plan.planName === planType);
        
        if (plan?.yearlySaving) {
            document.querySelectorAll(`[data-pricing-id="yearly-saving"][data-pricing-plan="${planType}"]`)
                .forEach(element => {
                    element.innerHTML = Math.floor(plan.yearlySaving);
                });
        }
    });
}

// Call all update functions
updateCurrencyElements();
updatePricingElements();
updateYearlySavings();