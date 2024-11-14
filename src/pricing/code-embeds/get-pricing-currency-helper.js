// Either include this file in your code embed or copy the content and paste it in your code embed
(function getPricingCurrencyHelperInit() {
  let currencyCode = "";
  let pricingPlans;

  const PRICING_3_DOT_1_YEARLY_DISCOUNT_PERCENTAGE = 200 / 12;

  const BillingPeriod = {
    Monthly: "monthly",
    Yearly: "yearly",
  };
  const pricingPlanNames = {
    pro: "pro",
    proPlus: "pro_plus",
    free: "free",
    essentials: "essentials",
    professional: "professional",
    premium: "premium",
    basic: "basic",
    plus: "plus",
    business: "business",
    default: "default",
    enterprise: "enterprise_tier_1_self_serve",
    starter: "v4.0_tier1_starter",
    standard: "v4.0_tier2_standard",
    advanced: "v4.0_tier3_advanced",
    growth_essentials: "growth_essentials",
    growth_pro: "growth_pro",
    growth_enterprise: "growth_enterprise",
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

  const PLANS_WITH_CUSTOM_PRICING = [
    pricingPlanNames.enterprise,
    pricingPlanNames.growth_enterprise,
  ];

  function getDiscountsMappingByBillingPeriod(discounts) {
    return discounts.reduce(
      (mapping, discount) => {
        if (["both", "yearly"].includes(discount.appliesTo)) {
          mapping.yearly.push(discount);
        }
        if (["both", "monthly"].includes(discount.appliesTo)) {
          mapping.monthly.push(discount);
        }
        return mapping;
      },
      { [BillingPeriod.Yearly]: [], [BillingPeriod.Monthly]: [] }
    );
  }

  function applyRegularYearlyDiscount(discounts) {
    const regularYearlyDiscount = {
      discountPercentages: {
        [pricingPlanNames.business]: PRICING_3_DOT_1_YEARLY_DISCOUNT_PERCENTAGE,
        [pricingPlanNames.plus]: PRICING_3_DOT_1_YEARLY_DISCOUNT_PERCENTAGE,
        [pricingPlanNames.basic]: PRICING_3_DOT_1_YEARLY_DISCOUNT_PERCENTAGE,
      },
      isPromotional: false,
    };

    discounts.yearly.push(regularYearlyDiscount);
    return discounts;
  }

  function calculateYearlySavingForPricing(pricing) {
    if (!pricing?.[BillingPeriod.Monthly] || !pricing?.[BillingPeriod.Yearly]) {
      return null;
    }

    return (
      (12 * pricing[BillingPeriod.Monthly].price?.base_amount -
        pricing[BillingPeriod.Yearly].price?.base_amount) /
      1000
    );
  }

  function calculatePromotionalDiscountModifier(
    discounts,
    billingPeriod,
    planName
  ) {
    const discountsForBillingPeriod = discounts[billingPeriod];

    // const promotionalDiscounts = discountsForBillingPeriod.filter(
    //   (discount) => discount.isPromotional
    // );

    const promotionalDiscountModifier = discountsForBillingPeriod.reduce(
      (currentModifier, discount) => {
        const discountPercentage = discount.discountPercentages[planName];
        const discountModifier = 1 - discountPercentage / 100;

        return (currentModifier *= discountModifier);
      },
      1
    );
    return promotionalDiscountModifier;
  };

  function calculatePromotionalDiscountModifiers(discounts, planName) {
    const monthlyTotalDiscountModifier = calculatePromotionalDiscountModifier(
      discounts,
      BillingPeriod.Monthly,
      planName
    );
    const yearlyTotalDiscountModifier = calculatePromotionalDiscountModifier(
      discounts,
      BillingPeriod.Yearly,
      planName
    );
    return { monthlyTotalDiscountModifier, yearlyTotalDiscountModifier };
  };

  const deepClone = object => JSON.parse(JSON.stringify(object))

  const clonePriceToDiscountedPrice = (periodPricing) => {
    periodPricing.discountedPrice = deepClone(periodPricing.price);
  };

  const applyTotalDiscountModifierToDiscountedPrice = (
    periodPricing,
    modifier
  ) => {
    periodPricing.discountedPrice.base_amount *= modifier;
    periodPricing.discountedPrice.amount *= modifier;
  };

  function applyTotalDiscountModifierToPricePeriods(
    pricing,
    monthlyTotalDiscountModifier,
    yearlyTotalDiscountModifier
  ) {
    clonePriceToDiscountedPrice(pricing.monthly);
    clonePriceToDiscountedPrice(pricing.yearly);

    applyTotalDiscountModifierToDiscountedPrice(
      pricing.monthly,
      monthlyTotalDiscountModifier
    );

    applyTotalDiscountModifierToDiscountedPrice(
      pricing.yearly,
      yearlyTotalDiscountModifier
    );
  };

  function applyDiscountsToPricingModel(pricingPlans, discounts) {
    return pricingPlans.map((plan) => {
      if (!plan.pricing) {
        return plan;
      }

      const modifiedPlan = deepClone(plan);

      const { monthlyTotalDiscountModifier, yearlyTotalDiscountModifier } =
        calculatePromotionalDiscountModifiers(discounts, plan.planName);

      applyTotalDiscountModifierToPricePeriods(
        modifiedPlan.pricing,
        monthlyTotalDiscountModifier,
        yearlyTotalDiscountModifier
      );

      return modifiedPlan;
    });
  }

  function transformPlans(plans, allowedPlanCodes = CORE_PLAN_NAMES) {
    return plans
      .filter(({ planName }) => allowedPlanCodes.includes(planName))
      .map((plan) => {
        const result = {
          ...plan,
          yearlySaving: calculateYearlySavingForPricing(plan.pricing),
        };

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
      const pricingPayload = await fetch(
        "https://admin.typeform.com/bff/pricing/v3/initial-payload"
      ).then((res) => res.json());


      let discounts = [];// you can add extra discounts here if necessary in the future
      discounts = getDiscountsMappingByBillingPeriod(discounts);
      discounts = applyRegularYearlyDiscount(discounts);

      const corePlans = applyDiscountsToPricingModel(
        transformPlans(pricingPayload.plans, CORE_PLAN_NAMES),
        discounts
      );
      const growthPlans = applyDiscountsToPricingModel(
        transformPlans(pricingPayload.plans, GROWTH_PLAN_NAMES),
        discounts
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
