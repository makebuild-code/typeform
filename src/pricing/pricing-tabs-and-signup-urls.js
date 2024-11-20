// document.addEventListener('DOMContentLoaded', function () {
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
        }

        buttons.forEach((button) => {
            button.addEventListener('click', function () {
                // Log the clicked tab option
                const tabOption = this.getAttribute('data-pricing-taboption');
                console.log('Tab clicked:', tabOption);

                // Update all signup button URLs based on the selected billing period
                document.querySelectorAll('[data-pricing-id="signup-button-wrap"]').forEach(wrapper => {
                    wrapper.setAttribute('data-billing-period', tabOption);
                });
                updateSignupButtons();

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

                // ScrollTrigger refresh logic
                if (typeof ScrollTrigger !== 'undefined' && ScrollTrigger) {
                    setTimeout(() => {
                        ScrollTrigger.refresh();
                    }, 100);
                }
            });
        });
    });
// });

async function updateSignupButtons() {
    document.querySelectorAll('[data-pricing-id="signup-button-wrap"]').forEach(wrapper => {
        const planName = wrapper.getAttribute('data-pricing-plan-name');
        const billingPeriod = wrapper.getAttribute('data-billing-period') || 'monthly'; // default to yearly if not specified
        const linkElement = wrapper.querySelector('a');
        
        if (planName && linkElement) {
            const urls = billingPeriod === 'monthly' ? monthlySignupUrls : yearlySignupUrls;
            if (urls[planName]) {
                linkElement.href = urls[planName];
            }
        }
    });
}

const yearlySignupUrls = {
    basic: "https://www.typeform.com/signup/?redirect_uri=https%3A%2F%2Fadmin.typeform.com%2Fcheckout%3Fplan-name%3Dbasic%26period%3DP1Y%26is_express_checkout%3Dtrue",
    plus: "https://www.typeform.com/signup/?redirect_uri=https%3A%2F%2Fadmin.typeform.com%2Fcheckout%3Fplan-name%3Dplus%26period%3DP1Y%26is_express_checkout%3Dtrue",
    business: "https://www.typeform.com/signup/?redirect_uri=https%3A%2F%2Fadmin.typeform.com%2Fcheckout%3Fplan-name%3Dbusiness%26period%3DP1Y%26is_express_checkout%3Dtrue",
    enterprise_tier_1_self_serve: "https://tfsales.typeform.com/to/PxcVKQGb?source=website&source2=public%20pricing%20page&_gl=1*1seemqj*_gcl_au*MTA2ODk5NDM0My4xNzMxNDc4MjUx",
    growth_essentials: "https://www.typeform.com/signup/?redirect_uri=https%3A%2F%2Fadmin.typeform.com%2Fcheckout%3Fplan-name%3Dgrowth_essentials%26period%3DP1Y%26is_express_checkout%3Dtrue",
    growth_pro: "https://www.typeform.com/signup/?redirect_uri=https%3A%2F%2Fadmin.typeform.com%2Fcheckout%3Fplan-name%3Dgrowth_pro%26period%3DP1Y%26is_express_checkout%3Dtrue",
    growth_enterprise: "https://tfsales.typeform.com/to/PxcVKQGb?source=website&source2=typeformforgrowth&_gl=1*1seemqj*_gcl_au*MTA2ODk5NDM0My4xNzMxNDc4MjUx"
  };
  
const monthlySignupUrls = {
    basic: "https://www.typeform.com/signup/?redirect_uri=https%3A%2F%2Fadmin.typeform.com%2Fcheckout%3Fplan-name%3Dbasic%26period%3DP1M%26is_express_checkout%3Dtrue",
    plus: "https://www.typeform.com/signup/?redirect_uri=https%3A%2F%2Fadmin.typeform.com%2Fcheckout%3Fplan-name%3Dplus%26period%3DP1M%26is_express_checkout%3Dtrue",
    business: "https://www.typeform.com/signup/?redirect_uri=https%3A%2F%2Fadmin.typeform.com%2Fcheckout%3Fplan-name%3Dbusiness%26period%3DP1M%26is_express_checkout%3Dtrue",
    enterprise_tier_1_self_serve: "https://tfsales.typeform.com/to/PxcVKQGb?source=website&source2=public%20pricing%20page&_gl=1*1seemqj*_gcl_au*MTA2ODk5NDM0My4xNzMxNDc4MjUx",
    growth_essentials: "https://www.typeform.com/signup/?redirect_uri=https%3A%2F%2Fadmin.typeform.com%2Fcheckout%3Fplan-name%3Dgrowth_essentials%26period%3DP1M%26is_express_checkout%3Dtrue",
    growth_pro: "https://www.typeform.com/signup/?redirect_uri=https%3A%2F%2Fadmin.typeform.com%2Fcheckout%3Fplan-name%3Dgrowth_pro%26period%3DP1M%26is_express_checkout%3Dtrue",
    growth_enterprise: "https://tfsales.typeform.com/to/PxcVKQGb?source=website&source2=typeformforgrowth&_gl=1*1seemqj*_gcl_au*MTA2ODk5NDM0My4xNzMxNDc4MjUx"
};

updateSignupButtons();