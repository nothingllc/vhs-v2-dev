(function () {
  // Simple feature detection
  if (!window.fetch) return;

  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('vendor-registration-form');
    if (!form) return;

    // Get elements
    const submitButton = form.querySelector('[data-add-to-cart]');
    const submitText = submitButton.querySelector('[data-add-to-cart-text]');
    const loader = submitButton.querySelector('[data-loader]');
    const notification = document.getElementById('cart-notification');

    // Add submit handler
    form.addEventListener('submit', function (event) {
      // Always prevent default form submission to avoid page reload
      event.preventDefault();

      // Only proceed if form is valid
      if (!this.checkValidity()) {
        return;
      }

      // Get necessary form data
      const formData = new FormData(this);
      const variantId = this.querySelector('select[name="id"]').value;

      if (!variantId) {
        console.error('Missing variant ID');
        return;
      }

      // Disable button and show loader
      if (submitButton) {
        submitButton.disabled = true;
        const loaderElement = submitButton.querySelector('[data-loader]');
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
          // Hide loader
          const loaderElement = submitButton?.querySelector('[data-loader]');
          if (loaderElement) loaderElement.classList.add('hide');

          // Success - show notification
          if (notification) {
            notification.style.display = 'block';
          }

          // Animate button
          const buttonWrapper = submitButton?.querySelector('.btn-text-slider__wrapper');
          if (buttonWrapper) {
            buttonWrapper.classList.add('btn-text-slider__wrapper--slide-right');
          }

          // Fetch cart count and update the counter
          fetch('/cart.js')
            .then((response) => response.json())
            .then((cartData) => {
              const cartCountElem = document.querySelector('.cart-notification__textNum');
              if (cartCountElem) {
                cartCountElem.textContent = cartData.item_count;
              }

              const cartUpdateElem = document.querySelector('.cart-notification__textUpdate');
              if (cartUpdateElem) {
                setTimeout(() => {
                  cartUpdateElem.classList.add('active');
                }, 300);
              }
            });

          // Reset button after animation
          setTimeout(() => {
            if (buttonWrapper) {
              buttonWrapper.classList.remove('btn-text-slider__wrapper--slide-right');
            }

            // Re-enable the button after animations complete
            setTimeout(() => {
              submitButton.disabled = false;

              // Reset form for another potential submission
              resetForm(form);
            }, 300);
          }, 2000);
        })
        .catch((error) => {
          console.error('Error adding to cart:', error);
          submitButton.disabled = false;
          const loaderElement = submitButton?.querySelector('[data-loader]');
          if (loaderElement) loaderElement.classList.add('hide');
        });
    });

    // Function to reset form to initial state
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

        // Reset progress indicators
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

      // Don't reset checkboxes or text inputs to make it faster for users to submit multiple dates
    }
  });
})();
