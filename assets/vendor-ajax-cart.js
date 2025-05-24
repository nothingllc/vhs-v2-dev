(function () {
  'use strict';

  // Feature detection
  if (!window.fetch) return;

  // Namespace to avoid conflicts
  window.VendorCart = window.VendorCart || {};

  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('vendor-registration-form');
    if (!form || window.VendorCart.initialized) return;

    // Mark as initialized to prevent multiple handlers
    window.VendorCart.initialized = true;

    // Cache elements
    const elements = {
      form: form,
      submitButton: form.querySelector('[data-add-to-cart]'),
      submitText: form.querySelector('[data-add-to-cart-text]'),
      loader: form.querySelector('[data-loader]'),
      notification: document.getElementById('cart-notification'),
      cartUpdateElem: document.querySelector('.cart-notification__textUpdate'),
      cartCountElem: document.querySelector('.cart-notification__textNum'),
    };

    // Add our controlled submit handler with high priority
    elements.form.addEventListener('submit', handleFormSubmit, true);

    function handleFormSubmit(event) {
      // CRITICAL: Always prevent default and stop propagation
      event.preventDefault();
      event.stopImmediatePropagation();

      // Only proceed if form is valid
      if (!this.checkValidity()) {
        return false;
      }

      // Get necessary form data
      const formData = new FormData(this);
      const variantId = this.querySelector('select[name="id"]').value;

      if (!variantId) {
        console.error('Missing variant ID');
        return false;
      }

      // Disable button and show loader
      if (elements.submitButton) {
        elements.submitButton.disabled = true;
        const loaderElement = elements.submitButton.querySelector('[data-loader]');
        if (loaderElement) loaderElement.classList.remove('hide');
      }

      // Submit via AJAX
      fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              id: parseInt(variantId, 10),
              quantity: 1,
              properties: Object.fromEntries(
                Array.from(formData.entries())
                  .filter((pair) => pair[0].startsWith('properties['))
                  .map((pair) => [pair[0].replace('properties[', '').replace(']', ''), pair[1]])
              ),
            },
          ],
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          handleSuccess(data);
        })
        .catch((error) => {
          handleError(error);
        });

      return false;
    }

    function handleSuccess(data) {
      // Hide loader
      const loaderElement = elements.submitButton?.querySelector('[data-loader]');
      if (loaderElement) loaderElement.classList.add('hide');

      // Success - show notification
      if (elements.notification) {
        elements.notification.style.display = 'block';
      }

      // Animate button
      const buttonWrapper = elements.submitButton?.querySelector('.btn-text-slider__wrapper');
      if (buttonWrapper) {
        buttonWrapper.classList.add('btn-text-slider__wrapper--slide-right');
      }

      // Fetch cart count and update the counter
      fetch('/cart.js')
        .then((response) => response.json())
        .then((cartData) => {
          if (elements.cartCountElem) {
            elements.cartCountElem.textContent = cartData.item_count;
          }

          if (elements.cartUpdateElem) {
            setTimeout(() => {
              elements.cartUpdateElem.classList.add('active');
            }, 300);
          }
        });

      // Reset button after animation
      setTimeout(() => {
        if (buttonWrapper) {
          buttonWrapper.classList.remove('btn-text-slider__wrapper--slide-right');
        }

        setTimeout(() => {
          elements.submitButton.disabled = false;
          resetForm(elements.form);
        }, 300);
      }, 2000);
    }

    function handleError(error) {
      console.error('Error adding to cart:', error);
      elements.submitButton.disabled = false;
      const loaderElement = elements.submitButton?.querySelector('[data-loader]');
      if (loaderElement) loaderElement.classList.add('hide');
    }

    function resetForm(form) {
      // Reset variant selection
      const variantSelect = form.querySelector('select[name="id"]');
      if (variantSelect) {
        variantSelect.selectedIndex = 0;
      }

      // Reset progress steps if applicable
      const steps = form.querySelectorAll('.registration-step');
      if (steps.length > 0) {
        steps.forEach((step, index) => {
          if (index === 0) {
            step.classList.add('active');
          } else {
            step.classList.remove('active');
          }
        });

        const progressSteps = form.querySelectorAll('.progress-step');
        if (progressSteps.length > 0) {
          progressSteps.forEach((step, index) => {
            if (index === 0) {
              step.classList.add('completed');
            } else {
              step.classList.remove('completed');
            }
          });
        }
      }
    }

    // Override any window location changes that might redirect to cart
    const originalLocationSetter =
      Object.getOwnPropertyDescriptor(window, 'location') ||
      Object.getOwnPropertyDescriptor(Window.prototype, 'location');

    if (originalLocationSetter && originalLocationSetter.set) {
      Object.defineProperty(window, 'location', {
        set: function (url) {
          // Block cart redirects during our form submission process
          if (
            elements.submitButton &&
            elements.submitButton.disabled &&
            (url.includes('/cart') || url.includes('cart_url'))
          ) {
            console.log('Blocked automatic cart redirect:', url);
            return;
          }
          originalLocationSetter.set.call(this, url);
        },
        get: originalLocationSetter.get,
      });
    }
  });
})();
