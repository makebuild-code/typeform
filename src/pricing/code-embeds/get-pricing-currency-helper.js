  /**
 * @file Pricing Currency Helper Script - With Billing Period Support
 * @description
 * This script dynamically fetches and displays pricing, currency, and addon information for different Typeform plans.
 * It helps keep pricing details accurate and up to date across a website.
 *
 * ## Key Features:
 * - **Fetches pricing data** from Typeform’s public pricing API.
 * - **Handles multiple billing periods** (monthly and yearly).
 * - **Supports multiple product tiers** (Core, Growth, and Talent).
 * - **Displays dynamic currency codes** and formatted prices in the UI.
 * - **Shows calculated yearly savings** between monthly and yearly pricing.
 * - **Includes addon handling** via metadata (e.g., contacts tiers) with support for billing period adjustments.
 * - **Allows manual data lookups** using a path selector for flexibility.
 *
 * ## How It Works:
 * 1. The script fetches all pricing data from Typeform (`/bff/pricing/v4/initial-payload`).
 * 2. It processes plan prices to create “visible” monthly and yearly values.
 * 3. It updates HTML elements with matching `data-*` attributes for:
 *    - Plan pricing totals
 *    - Currency codes
 *    - Addon prices or metadata
 *    - Custom paths
 * 4. It automatically recalculates and updates displayed values whenever run.
 *
 * ## Custom Attributes:
 * - `[data-pricing-plan="{planName}"][data-pricing-id="{priceType}"]`  
 *   Example: `[data-pricing-plan="basic"][data-pricing-id="monthly-total"]`
 * - `[data-addon-type="{addonType}"][data-addon-property="{property}"]`  
 *   Example: `[data-addon-type="contacts_tier1"][data-addon-property="amount"]`
 * - `[data-pricing-path="{path}"]` for direct data access.
 *
 * ## Functions:
 * - `getPricingPlans()` → Fetches and organizes all plan data.
 * - `getPricingCurrency()` → Returns the current currency code.
 * - `updateCurrencyElements()` → Inserts the currency code into the DOM.
 * - `updatePricingElements()` → Updates visible pricing per plan and billing period.
 * - `updateYearlySavings()` → Displays yearly savings per plan.
 * - `updateAddonsByMetadata()` → Finds and displays addon data via metadata (supports billing period).
 * - `updateManualPaths()` → Displays custom pricing data via manual path lookup.
 *
 * ## Notes:
 * - All functions are safe to re-run; they’ll update the latest pricing data.
 * - The script uses `Math.ceil` and `.toLocaleString()` for cleanly formatted numbers.
 * - Addon prices on yearly billing are divided by 12 to show their monthly equivalent.
 */

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
      growth_pro: "growth_pro",
      growth_enterprise: "growth_enterprise",
      talent: "talent"
    };

    // Addon identifiers using metadata
    const addonIdentifiers = {
      contacts_tier1: {
        addon_family: "contacts_and_automations",
        addon_family_tier: 1
      },
      contacts_tier2: {
        addon_family: "contacts_and_automations",
        addon_family_tier: 2
      }
    };

    const CORE_PLAN_NAMES = [
      pricingPlanNames.basic,
      pricingPlanNames.plus,
      pricingPlanNames.business,
      pricingPlanNames.enterprise,
    ];

    const GROWTH_PLAN_NAMES = [
      pricingPlanNames.growth_pro,
      pricingPlanNames.growth_enterprise,
    ];  

    const TALENT_PLAN_NAMES = [
      pricingPlanNames.talent,
    ];

    const PLANS_WITH_CUSTOM_PRICING = [
      pricingPlanNames.enterprise,
      pricingPlanNames.growth_enterprise,
    ];

    function calculateYearlySavingForPricing(pricing) {
      if (!pricing?.[BillingPeriod.Monthly]?.visiblePrice || !pricing?.[BillingPeriod.Yearly]?.visiblePrice) {
        return null;
      }

      const monthlyPrice = pricing[BillingPeriod.Monthly].visiblePrice.price;
      const yearlyPrice = pricing[BillingPeriod.Yearly].visiblePrice.price;

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

        result.yearlySaving = calculateYearlySavingForPricing(result.pricing);

        if (PLANS_WITH_CUSTOM_PRICING.includes(result.planName)) {
          delete result.pricing;
          result.isEnterprisePlan = true;
        }

        return result;
      });
    }

    // Helper function to match addon by metadata
    function matchesMetadata(addon, criteria) {
      if (!addon.metadata) return false;

      return Object.entries(criteria).every(([key, value]) => {
        return addon.metadata[key] === value;
      });
    }

    // NEW: Find addon by metadata with specific billing period
    function findAddonByMetadata(plans, metadataMatch, billingPeriod = 'monthly') {
      for (const plan of plans) {
        if (!plan.pricing) continue;

        // Only check the specified billing period
        const periodPricing = plan.pricing[billingPeriod];
        if (periodPricing?.addons) {
          const addon = periodPricing.addons.find(a => matchesMetadata(a, metadataMatch));
          if (addon) return addon;
        }
      }

      return null;
    }

    window.getPricingPlans = async function getPricingPlans() {
      if (pricingPlans) {
        return pricingPlans;
      }

      try {
        const pricingPayload = await fetch(
          `https://admin.typeform.com/bff/pricing/v5/initial-payload`
        ).then((res) => res.json());

        const corePlans = transformPlans(pricingPayload.plans, CORE_PLAN_NAMES);
        const growthPlans = transformPlans(pricingPayload.plans, GROWTH_PLAN_NAMES);
        const talentPlans = transformPlans(pricingPayload.plans, TALENT_PLAN_NAMES);

        pricingPlans = {
          corePlans,
          growthPlans,
          talentPlans,
          rawPlans: pricingPayload.plans
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

  // ORIGINAL UPDATE FUNCTIONS (Preserved)
  async function updateCurrencyElements() {
    const currency = await getPricingCurrency();
    document.querySelectorAll('[data-pricing-id="currency"]').forEach(element => {
      element.innerHTML = currency;
    });
  }

  async function updatePricingElements() {
    const pricingPlans = await getPricingPlans();

    const corePlanTypes = ['basic', 'plus', 'business'];
    const growthPlanTypes = ['growth_pro'];
    const talentPlanTypes = ['talent'];

    // Handle core plans
    corePlanTypes.forEach(planType => {
      const plan = pricingPlans?.corePlans?.find(plan => plan.planName === planType);

      const monthlyPrice = plan?.pricing?.monthly?.visiblePrice;
      if (monthlyPrice) {
        document.querySelectorAll(`[data-pricing-plan="${planType}"][data-pricing-id="monthly-total"]`)
          .forEach(element => {
          element.innerHTML = monthlyPrice.price.toLocaleString();
        });

        const monthlyAnnualTotal = (monthlyPrice.price * 12);
        document.querySelectorAll(`[data-pricing-plan="${planType}"][data-pricing-id="monthly-annual-total"]`)
          .forEach(element => {
          element.innerHTML = monthlyAnnualTotal.toLocaleString();
        });
      }

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

      const monthlyPrice = plan?.pricing?.monthly?.visiblePrice;
      if (monthlyPrice) {
        document.querySelectorAll(`[data-pricing-plan="${planType}"][data-pricing-id="monthly-total"]`)
          .forEach(element => {
          element.innerHTML = monthlyPrice.price.toLocaleString();
        });

        const monthlyAnnualTotal = (monthlyPrice.price * 12);
        document.querySelectorAll(`[data-pricing-plan="${planType}"][data-pricing-id="monthly-annual-total"]`)
          .forEach(element => {
          element.innerHTML = monthlyAnnualTotal.toLocaleString();
        });
      }

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

      const monthlyPrice = plan?.pricing?.monthly?.visiblePrice;
      if (monthlyPrice) {
        document.querySelectorAll(`[data-pricing-plan="${planType}"][data-pricing-id="monthly-total"]`)
          .forEach(element => {
          element.innerHTML = monthlyPrice.price.toLocaleString();
        });

        const monthlyAnnualTotal = (monthlyPrice.price * 12);
        document.querySelectorAll(`[data-pricing-plan="${planType}"][data-pricing-id="monthly-annual-total"]`)
          .forEach(element => {
          element.innerHTML = monthlyAnnualTotal.toLocaleString();
        });
      }

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

    const corePlanTypes = ['basic', 'plus', 'business'];
    const growthPlanTypes = ['growth_pro'];
    const talentPlanTypes = ['talent'];
    const allPlanTypes = [...corePlanTypes, ...growthPlanTypes, ...talentPlanTypes];

    allPlanTypes.forEach(planType => {
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

  // NEW: Metadata-Based Addon Updates with Billing Period and Yearly/12 calculation
  async function updateAddonsByMetadata() {
    const pricingData = await getPricingPlans();
    const rawPlans = pricingData?.rawPlans;

    if (!rawPlans) {
      console.warn('No raw plans data available');
      return;
    }

    // Define addon identifiers
    const addonIdentifiers = {
      contacts_tier1: {
        addon_family: "contacts_and_automations",
        addon_family_tier: 1
      },
      contacts_tier2: {
        addon_family: "contacts_and_automations",
        addon_family_tier: 2
      }
    };

    // Helper to match metadata
    function matchesMetadata(addon, criteria) {
      if (!addon.metadata) return false;
      return Object.entries(criteria).every(([key, value]) => {
        return addon.metadata[key] === value;
      });
    }

    // Helper to find addon by metadata with billing period
    function findAddonByMetadata(plans, metadataMatch, billingPeriod = 'monthly') {
      for (const plan of plans) {
        if (!plan.pricing) continue;

        const periodPricing = plan.pricing[billingPeriod];
        if (periodPricing?.addons) {
          const addon = periodPricing.addons.find(a => matchesMetadata(a, metadataMatch));
          if (addon) return addon;
        }
      }
      return null;
    }

    // Find all elements with data-addon-type attribute
    const addonElements = document.querySelectorAll('[data-addon-type]');

    addonElements.forEach(element => {
      const addonType = element.getAttribute('data-addon-type');
      const property = element.getAttribute('data-addon-property') || 'amount';
      const billingPeriod = element.getAttribute('data-addon-period') || 'monthly';

      const metadataMatch = addonIdentifiers[addonType];

      if (!metadataMatch) {
        console.warn(`Unknown addon type: "${addonType}"`);
        return;
      }

      try {
        const addonData = findAddonByMetadata(rawPlans, metadataMatch, billingPeriod);

        if (addonData) {
          let value = null;

          if (property === 'amount' && addonData.price?.amount !== undefined) {
            value = addonData.price.amount;

            // Apply scale transformation
            if (addonData.price.scale && typeof value === 'number') {
              const divisor = Math.pow(10, addonData.price.scale);
              value = value / divisor;
            }

            // NEW: If yearly, divide by 12 to show monthly equivalent
            if (billingPeriod === 'yearly') {
              value = value / 12;
            }

            // Round up to nearest whole number
            element.innerHTML = Math.ceil(value).toLocaleString();

          } else if (property === 'currency' && addonData.price?.currency?.code) {
            element.innerHTML = addonData.price.currency.code;

          } else if (property === 'addon_name' && addonData.addon) {
            element.innerHTML = addonData.addon;

          } else if (property === 'charge_model' && addonData.charge_model) {
            element.innerHTML = addonData.charge_model;

          } else if (addonData[property] !== undefined) {
            const val = addonData[property];
            element.innerHTML = typeof val === 'object' ? JSON.stringify(val) : val;
          }
        } else {
          console.warn(`Addon type "${addonType}" with period "${billingPeriod}" not found in pricing data`);
        }

      } catch (error) {
        console.error(`Error processing addon type "${addonType}":`, error);
      }
    });
  }

  // Path-Based Updates (Still available)
  async function updateManualPaths() {
    const pricingData = await getPricingPlans();
    const rawPlans = pricingData?.rawPlans;

    if (!rawPlans) {
      console.warn('No raw plans data available');
      return;
    }

    const pathElements = document.querySelectorAll('[data-pricing-path]');

    pathElements.forEach(element => {
      const path = element.getAttribute('data-pricing-path');

      try {
        const result = extractValueWithScale(rawPlans, path);

        if (result.value !== null && result.value !== undefined) {
          let displayValue = result.value;

          if (result.scale !== null && typeof displayValue === 'number') {
            const divisor = Math.pow(10, result.scale);
            displayValue = displayValue / divisor;
          }

          element.innerHTML = typeof displayValue === 'number' 
            ? Math.ceil(displayValue).toLocaleString() 
          : displayValue;
        }
      } catch (error) {
        console.error(`Error processing path "${path}":`, error);
      }
    });
  }

  function extractValueWithScale(data, path) {
    const cleanPath = path.replace(/^plans\.?/, '');
    const parts = cleanPath.match(/([^\[\].]+|\[\d+\])/g);

    let current = data;
    let parentObject = null;
    let lastProperty = null;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (i === parts.length - 1) {
        parentObject = current;
        lastProperty = part;
      }

      if (part.startsWith('[') && part.endsWith(']')) {
        const index = parseInt(part.slice(1, -1));
        current = current?.[index];
      } else {
        current = current?.[part];
      }

      if (current === null || current === undefined) {
        return { value: null, scale: null };
      }
    }

    let scale = null;

    if (parentObject && lastProperty) {
      const propertyKey = lastProperty.startsWith('[') 
      ? parseInt(lastProperty.slice(1, -1))
      : lastProperty;

      if (parentObject.scale !== undefined) {
        scale = parentObject.scale;
      }
    }

    return { value: current, scale: scale };
  }

  // Execute all updates
  updateCurrencyElements();
  updatePricingElements();
  updateYearlySavings();
  updateAddonsByMetadata(); // Metadata-based lookup with period support
  updateManualPaths(); // Path-based lookup still available
