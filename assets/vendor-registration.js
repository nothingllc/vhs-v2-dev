/**
 * Vendor Registration Form
 * - Handles form submission and animations
 */
(function () {
  'use strict';

  // Initialize when DOM is fully loaded
  document.addEventListener('DOMContentLoaded', function () {
    initVendorRegistrationForm();
  });

  function initVendorRegistrationForm() {
    const form = document.getElementById('vendor-registration-form');
    if (!form) return;

    // Initialize other form functionality
    initFormSteps();
  }

  function initFormSteps() {
    class VendorRegistrationForm {
      constructor() {
        this.steps = document.querySelectorAll('.registration-step');
        this.nextButtons = document.querySelectorAll('.next-step');
        this.prevButtons = document.querySelectorAll('.prev-step');
        this.submitButton = document.querySelector('.registration-form__submit-button');
        this.progressIndicator = document.querySelector('.progress-indicator');

        this.currentStep = 1;
        this.boundHandlers = new Map();
        this.init();
      }

      init() {
        this.boundHandlers.set('toggleStep', this.toggleStep.bind(this));
        this.boundHandlers.set('handleNavigation', this.handleNavigation.bind(this));
        this.boundHandlers.set('validateForm', this.validateForm.bind(this));

        // Close all steps initially except first one
        this.steps.forEach((step, index) => {
          if (index === 0) {
            step.classList.add('active');
          } else {
            step.classList.remove('active');
          }

          // Add click listeners to step headers
          const header = step.querySelector('.step-header');
          header.addEventListener('click', this.boundHandlers.get('toggleStep'));
        });

        // Add navigation listeners
        this.nextButtons.forEach((button) => {
          button.addEventListener('click', (e) => this.handleNavigation(e, 'next'));
        });

        this.prevButtons.forEach((button) => {
          button.addEventListener('click', (e) => this.handleNavigation(e, 'prev'));
        });

        this.submitButton.addEventListener('click', (e) => this.validateForm(e));
      }

      toggleStep(step) {
        const isActive = step.classList.contains('active');
        const stepNumber = parseInt(step.dataset.step);

        // Close all steps first
        this.steps.forEach((s) => s.classList.remove('active'));

        // Open clicked step if it wasn't active
        if (!isActive) {
          step.classList.add('active');
          this.currentStep = stepNumber;
          this.updateProgressIndicator();
        }
      }

      handleNavigation(e, direction) {
        e.preventDefault();
        const currentStep = e.target.closest('.registration-step');

        if (direction === 'next') {
          if (this.validateStep(currentStep)) {
            this.goToNextStep(currentStep);
          }
        } else {
          this.goToPrevStep(currentStep);
        }
      }

      validateStep(step) {
        const inputs = step.querySelectorAll('input, select');
        let isValid = true;

        inputs.forEach((input) => {
          if (input.hasAttribute('required') && !input.value) {
            input.classList.add('error');
            isValid = false;
          } else {
            input.classList.remove('error');
          }
        });

        if (!isValid) {
          step.classList.add('active');
        }

        return isValid;
      }

      goToNextStep(currentStep) {
        const nextStep = currentStep.nextElementSibling;
        if (nextStep && nextStep.classList.contains('registration-step')) {
          currentStep.classList.remove('active');
          nextStep.classList.add('active');
          this.currentStep++;
          this.updateProgressIndicator();
        }
      }

      goToPrevStep(currentStep) {
        const prevStep = currentStep.previousElementSibling;
        if (prevStep && prevStep.classList.contains('registration-step')) {
          currentStep.classList.remove('active');
          prevStep.classList.add('active');
          this.currentStep--;
          this.updateProgressIndicator();
        }
      }

      updateProgressIndicator() {
        const steps = this.progressIndicator.querySelectorAll('.progress-step');
        steps.forEach((step, index) => {
          if (index + 1 < this.currentStep) {
            step.classList.add('completed');
          } else if (index + 1 === this.currentStep) {
            step.classList.add('active');
            step.classList.remove('completed');
          } else {
            step.classList.remove('completed', 'active');
          }
        });

        this.progressIndicator.setAttribute('aria-valuenow', this.currentStep);
      }

      validateForm(e) {
        e.preventDefault();
        let isValid = true;

        this.steps.forEach((step) => {
          if (!this.validateStep(step)) {
            isValid = false;
          }
        });

        if (isValid) {
          e.target.closest('form').submit();
        }
      }

      destroy() {
        this.steps.forEach((step) => {
          const header = step.querySelector('.step-header');
          header.removeEventListener('click', this.boundHandlers.get('toggleStep'));
        });

        this.boundHandlers.clear();
        this.steps = null;
        this.nextButtons = null;
        this.prevButtons = null;
      }
    }

    class VendorRegistrationHandler {
      constructor() {
        this.form = document.getElementById('vendor-registration-form');
        this.submitButton = this.form.querySelector('[data-add-to-cart]');
        this.submitText = this.submitButton.querySelector('[data-add-to-cart-text]');
        this.loader = this.submitButton.querySelector('[data-loader]');
        this.variantSelect = document.getElementById('productSelect-' + this.form.dataset.sectionId);
        this.categorySelect = document.getElementById('product-category');
        this.termsCheckbox = document.getElementById('terms-acceptance');
        this.requiredInputs = this.form.querySelectorAll('input[required], select[required]');
        this.requirementCheckboxes = this.form.querySelectorAll('.requirements-summary input[type="checkbox"]');

        // Initialize button state on load
        this.validateForm();

        // Track form submission state
        this.isSubmitting = false;

        this.debouncedValidate = this.debounce(this.validateForm.bind(this), 300);
        this.formState = new VendorRegistrationState();

        this.init();
      }

      debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
          const later = () => {
            clearTimeout(timeout);
            func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      }

      init() {
        if (!this.form) return;

        this.variantSelect?.addEventListener('change', this.handleVariantChange.bind(this));

        // Event delegation for form inputs
        this.form.addEventListener('input', (event) => {
          if (event.target.matches('input, select')) {
            this.debouncedValidate();
          }
        });

        // Use Intersection Observer for lazy validation
        this.setupIntersectionObserver();
      }

      setupIntersectionObserver() {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                this.validateStep(entry.target);
              }
            });
          },
          { threshold: 0.5 }
        );

        this.steps.forEach((step) => observer.observe(step));
      }

      handleVariantChange(event) {
        const variant = event.target.selectedOptions[0];
        const isAvailable = !variant.hasAttribute('disabled');

        // Update button state
        this.submitButton.disabled = !isAvailable;
        this.submitButton.setAttribute('aria-disabled', !isAvailable);

        // Update button text
        this.submitText.textContent = isAvailable ? window.theme.strings.addToCart : window.theme.strings.soldOut;

        // Announce status change to screen readers
        this.announceVariantStatus(isAvailable);
      }

      validateForm() {
        const isVariantSelected = this.variantSelect?.value;
        const isCategorySelected = this.categorySelect?.value;
        const isTermsAccepted = this.termsCheckbox?.checked;
        const areRequirementsAccepted = Array.from(this.requirementCheckboxes).every((checkbox) => checkbox.checked);
        let areRequiredFieldsFilled = true;

        this.requiredInputs.forEach((input) => {
          if (!input.value) {
            areRequiredFieldsFilled = false;
          }
        });

        const isValid =
          isVariantSelected &&
          isCategorySelected &&
          isTermsAccepted &&
          areRequirementsAccepted &&
          areRequiredFieldsFilled;

        this.updateButtonState(isValid);
        return isValid;
      }

      updateButtonState(isValid) {
        this.submitButton.disabled = !isValid;
        this.submitButton.setAttribute('aria-disabled', !isValid);

        this.submitText.textContent = isValid ? window.theme.strings.addToCart : window.theme.strings.completeForm;
      }

      highlightIncompleteFields() {
        this.requiredInputs.forEach((input) => {
          if (!input.value) {
            input.classList.add('error');
            input.closest('.registration-step')?.classList.add('active');
          } else {
            input.classList.remove('error');
          }
        });

        if (!this.termsCheckbox?.checked) {
          this.termsCheckbox.closest('.custom-checkbox').classList.add('error');
        }

        this.requirementCheckboxes.forEach((checkbox) => {
          if (!checkbox.checked) {
            checkbox.closest('.custom-checkbox').classList.add('error');
          } else {
            checkbox.closest('.custom-checkbox').classList.remove('error');
          }
        });
      }

      announceVariantStatus(isAvailable) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'visually-hidden';
        announcement.textContent = isAvailable ? window.theme.strings.available : window.theme.strings.soldOut;

        this.form.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
      }
    }

    class VendorRegistrationState {
      constructor() {
        this.state = {
          currentStep: 1,
          isValid: false,
          isSubmitting: false,
          errors: new Set(),
          dirtyFields: new Set(),
        };

        this.listeners = new Set();
      }

      update(changes) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...changes };
        this.notify(oldState);
      }

      subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
      }

      notify(oldState) {
        this.listeners.forEach((listener) => listener(this.state, oldState));
      }
    }

    // Update initialization
    document.addEventListener('DOMContentLoaded', () => {
      new VendorRegistrationForm();
      new VendorRegistrationHandler();
    });
  }
})();

/**
 * Vendor Registration Form Animation Handler
 * Coordinates button animation with AJAX form submission
 */
document.addEventListener('DOMContentLoaded', function () {
  const vendorForm = document.getElementById('vendor-registration-form');
  if (!vendorForm) return;

  // Listen for a custom event that will be triggered after successful AJAX submission
  document.addEventListener('vendor:cart:added', function (event) {
    // Only proceed if this is our form's submission
    if (event.detail && event.detail.form === vendorForm) {
      const buttonWrapper = vendorForm.querySelector('.btn-text-slider__wrapper');
      const submitButton = vendorForm.querySelector('button[type="submit"]');
      const notification = document.getElementById('cart-notification');

      // Step 1: Animate to success state
      buttonWrapper.classList.add('btn-text-slider__wrapper--slide-right');

      // Step 2: Show notification if exists
      if (notification) {
        notification.style.display = 'block';
      }

      // Step 3: After delay, animate back
      setTimeout(() => {
        buttonWrapper.classList.remove('btn-text-slider__wrapper--slide-right');
        buttonWrapper.classList.add('btn-text-slider__wrapper--slide-reset');

        // Remove transition class after animation completes
        setTimeout(() => {
          buttonWrapper.classList.remove('btn-text-slider__wrapper--slide-reset');

          // Re-enable button if it was disabled
          submitButton.disabled = false;
        }, 300);
      }, 2000);
    }
  });
});

/**
 * Enhanced Debug: Cart redirect interceptor with more comprehensive tracking
 */
(function () {
  'use strict';

  console.log('🔍 Enhanced debug mode activated');

  // Track all fetch requests
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    console.log('🌐 Fetch request:', args[0], args[1]);
    return originalFetch
      .apply(this, arguments)
      .then((response) => {
        console.log('✅ Fetch response:', response.status, response.url);
        return response;
      })
      .catch((error) => {
        console.log('❌ Fetch error:', error);
        throw error;
      });
  };

  // Intercept form submissions
  document.addEventListener(
    'submit',
    function (e) {
      console.log('📝 Form submitted:', e.target.id || e.target.className, e.target.action);
      console.trace('Form submission stack trace:');
    },
    true
  );

  // Track navigation attempts
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function () {
    console.log('🔄 History pushState called:', arguments);
    return originalPushState.apply(history, arguments);
  };

  history.replaceState = function () {
    console.log('🔄 History replaceState called:', arguments);
    return originalReplaceState.apply(history, arguments);
  };

  // Monitor window.location changes more effectively
  let currentLocation = window.location.href;
  setInterval(() => {
    if (window.location.href !== currentLocation) {
      console.log('🚀 Location changed from:', currentLocation, 'to:', window.location.href);
      console.trace('Location change detection:');
      currentLocation = window.location.href;
    }
  }, 100);

  // Track any programmatic redirects
  const originalAssign = window.location.assign;
  const originalReplace = window.location.replace;

  window.location.assign = function (url) {
    console.log('🎯 Location.assign called:', url);
    console.trace('Location.assign stack trace:');
    return originalAssign.call(this, url);
  };

  window.location.replace = function (url) {
    console.log('🎯 Location.replace called:', url);
    console.trace('Location.replace stack trace:');
    return originalReplace.call(this, url);
  };

  console.log('🔍 Enhanced debug interceptors active');
})();
