class VendorRegistrationForm {
  constructor() {
    this.steps = document.querySelectorAll('.registration-step');
    this.nextButtons = document.querySelectorAll('.next-step');
    this.prevButtons = document.querySelectorAll('.prev-step');
    this.submitButton = document.querySelector('.registration-form__submit-button');
    this.progressIndicator = document.querySelector('.progress-indicator');

    this.currentStep = 1;
    this.init();
  }

  init() {
    // Close all steps initially except first one
    this.steps.forEach((step, index) => {
      if (index === 0) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }

      // Add click listeners to step headers
      const header = step.querySelector('.step-header');
      header.addEventListener('click', () => this.toggleStep(step));
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
}

class VendorRegistrationHandler {
  constructor() {
    this.form = document.getElementById('vendor-registration-form');
    this.variantSelect = document.getElementById('productSelect-' + this.form.dataset.sectionId);
    this.addToCartButton = this.form.querySelector('[data-add-to-cart]');
    this.buttonText = this.form.querySelector('[data-add-to-cart-text]');
    this.init();
  }

  init() {
    this.variantSelect?.addEventListener('change', this.handleVariantChange.bind(this));
    this.form?.addEventListener('submit', this.handleSubmit.bind(this));
  }

  handleVariantChange(event) {
    const variant = event.target.selectedOptions[0];
    const isAvailable = !variant.hasAttribute('disabled');

    // Update button state
    this.addToCartButton.disabled = !isAvailable;
    this.addToCartButton.setAttribute('aria-disabled', !isAvailable);

    // Update button text
    this.buttonText.textContent = isAvailable ? window.theme.strings.addToCart : window.theme.strings.soldOut;

    // Announce status change to screen readers
    this.announceVariantStatus(isAvailable);
  }

  handleSubmit(event) {
    if (this.addToCartButton.disabled) {
      event.preventDefault();
      return;
    }

    this.addToCartButton.classList.add('loading');
    this.addToCartButton.setAttribute('aria-busy', 'true');
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

// Initialize the form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new VendorRegistrationForm();
  new VendorRegistrationHandler();
});
