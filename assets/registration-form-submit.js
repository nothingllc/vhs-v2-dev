class RegistrationFormSubmit extends HTMLElement {
  constructor() {
    super();
    this.submitButton = this.querySelector('.registration-form__submit-text');
    this.form = this.closest('form');
    this.init();
  }

  init() {
    if (this.submitButton) {
      this.submitButton.addEventListener('click', this.handleSubmit.bind(this));
      this.submitButton.addEventListener('keypress', this.handleKeyPress.bind(this));
      this.submitButton.addEventListener('mousedown', () => this.submitButton.classList.add('is-pressed'));
      this.submitButton.addEventListener('mouseup', () => this.submitButton.classList.remove('is-pressed'));
      this.submitButton.addEventListener('mouseleave', () => this.submitButton.classList.remove('is-pressed'));
    }
  }

  handleSubmit(event) {
    event.preventDefault();
    if (this.validateForm()) {
      this.submitForm();
    }
  }

  handleKeyPress(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.handleSubmit(event);
    }
  }

  validateForm() {
    const requiredFields = this.form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach((field) => {
      if (!field.value) {
        isValid = false;
        this.showError(field);
      }
    });

    return isValid;
  }

  showError(field) {
    // Add error handling logic here
    field.classList.add('error');
    field.addEventListener('input', () => field.classList.remove('error'), { once: true });
  }

  submitForm() {
    // Preserve Shopify's Add to Cart functionality
    const formData = new FormData(this.form);

    fetch(window.Shopify.routes.root + 'cart/add.js', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        // Handle successful submission
        this.handleSuccess(data);
      })
      .catch((error) => {
        // Handle error
        this.handleError(error);
      });
  }

  handleSuccess(data) {
    // Add success handling logic
    this.dispatchEvent(
      new CustomEvent('registration:success', {
        bubbles: true,
        detail: { data },
      })
    );

    // Dispatch custom event for the animation handler
    const event = new CustomEvent('vendor:cart:added', {
      detail: {
        form: this.form,
        response: data,
      },
    });
    document.dispatchEvent(event);
  }

  handleError(error) {
    // Add error handling logic
    this.dispatchEvent(
      new CustomEvent('registration:error', {
        bubbles: true,
        detail: { error },
      })
    );
  }
}

customElements.define('registration-form-submit', RegistrationFormSubmit);
