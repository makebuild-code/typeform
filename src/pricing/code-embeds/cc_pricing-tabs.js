/**
 * @file Tab Function with Multi-Group and Billing Period Support
 * @description
 * Handles all tab-based interactions for pricing sections, allowing multiple tab groups
 * (e.g., billing period, plan type) to stay synchronized and update signup links accordingly.
 *
 * ## How It Works:
 * - Waits for the DOM to load.
 * - Finds all tab groups with `[data-pricing-tabgroupname]`.
 * - Within each group, identifies buttons using `[data-pricing-taboption]`.
 * - Activates the correct default tab (e.g., "Yearly" by default for billing groups).
 * - Updates the `data-billing-period` on all signup wrappers so pricing links stay consistent.
 * - Keeps all matching tab groups (same name) synchronized when one tab changes.
 * - Updates signup button URLs dynamically between monthly and yearly versions.
 * - Optionally refreshes `ScrollTrigger` animations when tab changes occur.
 *
 * ## Key Functions:
 * - `updateSignupButtons()` → Updates all signup button links based on the active billing period.
 * - Inline `click` listeners → Handle tab switching, visual state (active class), and syncing.
 *
 * ## Custom Attributes:
 * - `[data-pricing-tabgroupname]` → Identifies each group (e.g., "billing").
 * - `[data-pricing-taboption]` → Defines each option (e.g., "monthly" or "yearly").
 * - `[data-activeclass]` → Specifies which class marks an active state.
 * - `[data-pricing-id="signup-button-wrap"]` → Wraps signup links tied to plans.
 * - `[data-pricing-plan-name]` → Defines the specific plan for URL mapping.
 * - `[data-free-trial]` → Optional. If present on a signup wrapper, the link goes straight to
 *   `https://admin.typeform.com/signup?trial=VALUE` (no checkout redirect_uri).
 *
 * ## Example:
 * ```html
 * <div data-pricing-tabgroupname="billing">
 *   <button data-pricing-taboption="monthly" data-activeclass="w--current">Monthly</button>
 *   <button data-pricing-taboption="yearly" data-activeclass="w--current">Yearly</button>
 * </div>
 * ```
 *
 * ## Notes:
 * - The script automatically defaults billing tabs to yearly if none is active.
 * - Keeps multiple pricing tab groups (e.g., in sticky nav and body) in sync.
 * - `ScrollTrigger.refresh()` is called after updating signup URLs if GSAP is available.
 * - URLs for all plans are defined in `monthlySignupUrls` and `yearlySignupUrls`.
 */

document.addEventListener('DOMContentLoaded', function () {
    // Custom attribute selectors
    const TAB_GROUP_NAME_ATTR = '[data-pricing-tabgroupname]';
    const TAB_OPTION_ATTR = '[data-pricing-taboption]';
    const ACTIVE_CLASS_ATTR = 'data-activeclass';

    // Select all tab groups
    const tabGroups = document.querySelectorAll(TAB_GROUP_NAME_ATTR);

    tabGroups.forEach((tabGroup) => {
        const buttons = tabGroup.querySelectorAll(TAB_OPTION_ATTR);
        const tabGroupName = tabGroup.getAttribute('data-pricing-tabgroupname');

        // Make the appropriate button active if none is active
        let isActive = Array.from(buttons).some((button) =>
            button.classList.contains(button.getAttribute(ACTIVE_CLASS_ATTR))
        );
        
        if (!isActive && buttons.length > 0) {
            // Select which button to make active based on the tab group name
            const buttonToActivate = tabGroupName === 'billing' ? buttons[1] : buttons[0];
            const activeClass = buttonToActivate.getAttribute(ACTIVE_CLASS_ATTR);
            if (activeClass) {
                buttonToActivate.classList.add(activeClass);
            }
            
            // Set the initial billing period on signup wrappers
            const initialBillingPeriod = buttonToActivate.getAttribute('data-pricing-taboption');
            document.querySelectorAll('[data-pricing-id="signup-button-wrap"]').forEach(wrapper => {
                wrapper.setAttribute('data-billing-period', initialBillingPeriod);
            });
        }

        buttons.forEach((button) => {
            button.addEventListener('click', function () {
                // Log the clicked tab option
                const tabOption = this.getAttribute('data-pricing-taboption');
                log('Tab clicked:', tabOption);

                // Update all signup button URLs based on the selected billing period
                document.querySelectorAll('[data-pricing-id="signup-button-wrap"]').forEach(wrapper => {
                    wrapper.setAttribute('data-billing-period', tabOption);
                });

                // Remove the active class from all buttons in this group
                buttons.forEach((btn) => {
                    const activeClass = btn.getAttribute(ACTIVE_CLASS_ATTR);
                    if (activeClass) {
                        btn.classList.remove(activeClass);
                    }
                });

                // Add the active class to the clicked button
                const activeClass = this.getAttribute(ACTIVE_CLASS_ATTR);
                if (activeClass) {
                    this.classList.add(activeClass);
                }

                // Mirror the selection across other tab groups with the same name
                const tabGroupName = tabGroup.getAttribute(
                    'data-pricing-tabgroupname'
                );
                const matchingTabGroups = document.querySelectorAll(
                    `[data-pricing-tabgroupname='${tabGroupName}']`
                );

                matchingTabGroups.forEach((matchingTabGroup) => {
                    if (matchingTabGroup !== tabGroup) {
                        const matchingButtons =
                            matchingTabGroup.querySelectorAll(TAB_OPTION_ATTR);

                        matchingButtons.forEach((matchingButton) => {
                            const activeClass =
                                matchingButton.getAttribute(ACTIVE_CLASS_ATTR);
                            if (activeClass) {
                                matchingButton.classList.remove(activeClass);
                            }

                            if (
                                matchingButton.getAttribute(
                                    'data-pricing-taboption'
                                ) ===
                                this.getAttribute('data-pricing-taboption')
                            ) {
                                matchingButton.classList.add(activeClass);
                            }
                        });
                    }
                });

                // Update signup URLs after all DOM changes are complete
                setTimeout(() => {
                    updateSignupButtons();
                    
                    // ScrollTrigger refresh after URLs are updated
                    if (typeof ScrollTrigger !== 'undefined' && ScrollTrigger) {
                        ScrollTrigger.refresh();
                    }
                }, 0);
            });
        });
    });

    // Initial URL update after all tabs are initialized
    setTimeout(() => {
        updateSignupButtons();
    }, 0);
});

function updateSignupButtons() {
    document.querySelectorAll('[data-pricing-id="signup-button-wrap"]').forEach(wrapper => {
        const planName = wrapper.getAttribute('data-pricing-plan-name');
        const billingPeriod = wrapper.getAttribute('data-billing-period') || 'monthly'; // default to yearly if not specified
        const linkElement = wrapper.querySelector('a');
        
        if (planName && linkElement) {
            const urls = billingPeriod === 'monthly' ? monthlySignupUrls : yearlySignupUrls;
            if (urls[planName]) {
                let href = urls[planName];

                // If the wrapper has a data-free-trial attribute, send it straight to signup
                // with only trial=VALUE (no checkout redirect_uri).
                const freeTrial = wrapper.getAttribute('data-free-trial');
                if (freeTrial) {
                    href = 'https://admin.typeform.com/signup?trial=' + encodeURIComponent(freeTrial);
                }

                linkElement.href = href;
            }
        }
    });
}

const yearlySignupUrls = {
    basic: "https://admin.typeform.com/signup/?redirect_uri=https%3A%2F%2Fadmin.typeform.com%2Fcheckout%3Fplan-name%3Dbasic%26period%3DP1Y%26is_express_checkout%3Dtrue",
    plus: "https://admin.typeform.com/signup/?redirect_uri=https%3A%2F%2Fadmin.typeform.com%2Fcheckout%3Fplan-name%3Dplus%26period%3DP1Y%26is_express_checkout%3Dtrue",
    business: "https://admin.typeform.com/signup/?redirect_uri=https%3A%2F%2Fadmin.typeform.com%2Fcheckout%3Fplan-name%3Dbusiness%26period%3DP1Y%26is_express_checkout%3Dtrue",
    enterprise_tier_1_self_serve: "https://tfsales.typeform.com/to/PxcVKQGb?source=website&source2=public%20pricing%20page&_gl=1*1seemqj*_gcl_au*MTA2ODk5NDM0My4xNzMxNDc4MjUx",
    growth_pro: "https://admin.typeform.com/signup/?redirect_uri=https%3A%2F%2Fadmin.typeform.com%2Fcheckout%3Fplan-name%3Dgrowth_pro%26period%3DP1Y%26is_express_checkout%3Dtrue",
    growth_enterprise: "https://tfsales.typeform.com/to/PxcVKQGb?source=website&source2=typeformforgrowth&_gl=1*1seemqj*_gcl_au*MTA2ODk5NDM0My4xNzMxNDc4MjUx",
    talent: "https://admin.typeform.com/signup?redirect_uri=https%3A%2F%2Fadmin.typeform.com%2Fcheckout%3Fplan-name%3Dtalent%26period%3DP1Y%26is_express_checkout%3Dtrue"
  };
  
const monthlySignupUrls = {
    basic: "https://admin.typeform.com/signup/?redirect_uri=https%3A%2F%2Fadmin.typeform.com%2Fcheckout%3Fplan-name%3Dbasic%26period%3DP1M%26is_express_checkout%3Dtrue",
    plus: "https://admin.typeform.com/signup/?redirect_uri=https%3A%2F%2Fadmin.typeform.com%2Fcheckout%3Fplan-name%3Dplus%26period%3DP1M%26is_express_checkout%3Dtrue",
    business: "https://admin.typeform.com/signup/?redirect_uri=https%3A%2F%2Fadmin.typeform.com%2Fcheckout%3Fplan-name%3Dbusiness%26period%3DP1M%26is_express_checkout%3Dtrue",
    enterprise_tier_1_self_serve: "https://tfsales.typeform.com/to/PxcVKQGb?source=website&source2=public%20pricing%20page&_gl=1*1seemqj*_gcl_au*MTA2ODk5NDM0My4xNzMxNDc4MjUx",
    growth_pro: "https://admin.typeform.com/signup/?redirect_uri=https%3A%2F%2Fadmin.typeform.com%2Fcheckout%3Fplan-name%3Dgrowth_pro%26period%3DP1M%26is_express_checkout%3Dtrue",
    growth_enterprise: "https://tfsales.typeform.com/to/PxcVKQGb?source=website&source2=typeformforgrowth&_gl=1*1seemqj*_gcl_au*MTA2ODk5NDM0My4xNzMxNDc4MjUx",
    talent: "https://admin.typeform.com/signup?redirect_uri=https%3A%2F%2Fadmin.typeform.com%2Fcheckout%3Fplan-name%3Dtalent%26period%3DP1M%26is_express_checkout%3Dtrue"
};
