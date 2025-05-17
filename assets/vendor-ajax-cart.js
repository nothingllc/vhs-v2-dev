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
      event.preventDefault();

      // Basic validation
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // Start loading
      submitButton.disabled = true;
      loader.classList.remove('hide');
      submitText.classList.add('hide');

      // Get form data
      const formData = new FormData(form);

      // Extract properties
      const properties = {};
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('properties[') && key.endsWith(']')) {
          const propName = key.slice(11, -1);
          properties[propName] = value;
        }
      }

      // Get variant ID from form
      const variantId = formData.get('id');

      // Add to cart via AJAX
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
              properties: properties,
            },
          ],
        }),
      })
        .then((response) => {
          if (!response.ok) return response.json().then((err) => Promise.reject(err));
          return response.json();
        })
        .then((data) => {
          // Success - show notification
          if (notification) {
            notification.style.display = 'block';

            // Reset variant dropdown
            const variantSelect = document.getElementById('productSelect-' + form.dataset.sectionId);
            if (variantSelect) {
              variantSelect.selectedIndex = 0;
            }
          }
        })
        .catch((error) => {
          console.error('Error adding to cart:', error);
          alert(error.description || 'Error adding item to cart');
        })
        .finally(() => {
          // Stop loading
          submitButton.disabled = false;
          loader.classList.add('hide');
          submitText.classList.remove('hide');
        });
    });
  });
})();
