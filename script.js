document.addEventListener('DOMContentLoaded', () => {
  // =================================================================
  // ===== GLOBAL SITE SCRIPT (e.g., Header, Menus) ==================
  // =================================================================

  const hamburger = document.getElementById('hamburger-menu');
  const navLinks = document.querySelector('.nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
    });
  }

  // =================================================================
  // ===== MENU PAGE LOGIC (cardapio.html) ===========================
  // =================================================================

  const menuPageContainer = document.querySelector('main.container');
  if (menuPageContainer && document.getElementById('cart-section')) {
    const MAX_EXTRA_SAUCES = 5;
    let cart = [];

    // --- Selectors for Menu Page ---
    const cartSection = document.getElementById('cart-section');
    const cartHeader = cartSection.querySelector('.cart-header');
    const cartItemsList = cartSection.querySelector('#cart-items-list');
    const cartTotalPriceEl = cartSection.querySelector('#cart-total-price');
    const continueButton = cartSection.querySelector('#btn-continue');
    const cartObservationEl = cartSection.querySelector('#cart-observation');

    // --- Functions for Menu Page ---

    function toggleCart() {
      cartSection.classList.toggle('collapsed');
    }

    function toggleExtraOptions(e) {
      const header = e.target.closest('.extra-options-header');
      if (header) {
        const container = header.closest('.extra-options-container');
        container.classList.toggle('collapsed');
      }
    }

    function checkSauceLimit(menuItemEl) {
      const extraOptions = menuItemEl.querySelectorAll('.extra-option-item');
      let currentSauceCount = 0;
      extraOptions.forEach((option) => {
        currentSauceCount += parseInt(
          option.querySelector('.extra-quantity').textContent,
        );
      });

      const plusButtons = menuItemEl.querySelectorAll('.btn-extra-plus');
      plusButtons.forEach((button) => {
        button.disabled = currentSauceCount >= MAX_EXTRA_SAUCES;
      });
    }

    function handleExtraSauceChange(e) {
      const button = e.target;
      const isPlus = button.classList.contains('btn-extra-plus');
      const isMinus = button.classList.contains('btn-extra-minus');

      if (!isPlus && !isMinus) return;

      const quantityControl = button.parentElement;
      const quantityEl = quantityControl.querySelector('.extra-quantity');
      let quantity = parseInt(quantityEl.textContent);

      if (isPlus) quantity++;
      else if (isMinus) quantity--;

      quantity = Math.max(0, quantity);
      quantityEl.textContent = quantity;

      quantityControl.querySelector('.btn-extra-minus').disabled =
        quantity === 0;

      const menuItemEl = button.closest('.menu-item');
      checkSauceLimit(menuItemEl);
    }

    function updateCartDisplay() {
      cartItemsList.innerHTML = '';
      const emptyCartMessageHTML = `<li class="cart-empty-message">Seu carrinho está vazio.</li>`;

      if (cart.length === 0) {
        cartItemsList.innerHTML = emptyCartMessageHTML;
        cartTotalPriceEl.innerText = 'R$ 0.00';
        continueButton.classList.add('disabled');
        clearCartButton.classList.add('hidden'); // <-- ADD THIS LINE TO HIDE
        return;
      }

      let total = 0;
      cart.forEach((item, index) => {
        let itemTotal = item.basePrice * item.quantity;
        let extrasHtml = '';

        if (item.extras.length > 0) {
          extrasHtml += '<ul class="cart-item-extras">';
          item.extras.forEach((extra) => {
            itemTotal += extra.price * extra.quantity * item.quantity;
            extrasHtml += `<li>${extra.quantity}x ${extra.name}</li>`;
          });
          extrasHtml += '</ul>';
        }

        total += itemTotal;

        const li = document.createElement('li');
        li.classList.add('cart-item');
        li.dataset.index = index;

        let description = `${item.quantity}x ${item.name}`;
        if (item.type) description += ` - ${item.type}`;
        if (item.sauce) description += ` (${item.sauce})`;

        li.innerHTML = `
          <div class="cart-item-details">
            ${description}
            ${extrasHtml}
          </div>
          <div class="cart-item-action">
            <span class="cart-item-price">R$ ${itemTotal.toFixed(2)}</span>
            <button class="btn-remove-item" title="Remover">
              <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
            </button>
          </div>
        `;
        cartItemsList.appendChild(li);
      });

      cartTotalPriceEl.innerText = `R$ ${total.toFixed(2)}`;
      continueButton.classList.remove('disabled');
      clearCartButton.classList.remove('hidden'); // <-- ADD THIS LINE TO SHOW
    }

    function handleAddToCart(e) {
      const addButton = e.target.closest('.btn-add');
      if (!addButton) return;

      const menuItemEl = addButton.closest('.menu-item');
      const cartItem = {
        id: menuItemEl.dataset.id,
        name: menuItemEl.dataset.name,
        basePrice: parseFloat(menuItemEl.dataset.price),
        quantity: parseInt(menuItemEl.querySelector('.item-qty')?.value || '1'),
        sauce: menuItemEl.querySelector('.item-sauce')?.value,
        type: menuItemEl.querySelector('.item-type')?.value,
        extras: [],
        // Observation is now global, not per item
      };

      menuItemEl.querySelectorAll('.extra-option-item').forEach((option) => {
        const quantity = parseInt(
          option.querySelector('.extra-quantity').textContent,
        );
        if (quantity > 0) {
          cartItem.extras.push({
            name: option.dataset.name,
            price: parseFloat(option.dataset.price),
            quantity: quantity,
          });
        }
      });

      cart.push(cartItem);

      if (cartSection.classList.contains('collapsed')) {
        cartSection.classList.remove('collapsed');
      }

      saveCartAndObservation();
      updateCartDisplay();
    }

    function handleRemoveFromCart(e) {
      const removeButton = e.target.closest('.btn-remove-item');
      if (!removeButton) return;

      const cartItemEl = removeButton.closest('.cart-item');
      const indexToRemove = parseInt(cartItemEl.dataset.index);

      cart.splice(indexToRemove, 1);
      saveCartAndObservation();
      updateCartDisplay();
    }

    function saveCartAndObservation() {
      const observationText = cartObservationEl.value.trim();
      const orderData = {
        items: cart,
        observation: observationText,
      };
      localStorage.setItem('restaurantOrder', JSON.stringify(orderData));
    }

    function loadCartAndObservation() {
      const savedOrder = localStorage.getItem('restaurantOrder');
      if (savedOrder) {
        const orderData = JSON.parse(savedOrder);
        cart = orderData.items || [];
        cartObservationEl.value = orderData.observation || '';
        updateCartDisplay();
      }
    }

    function clearCart() {
      if (confirm('Tem certeza que deseja limpar todo o seu pedido?')) {
        cart = []; // Empty the cart array
        cartObservationEl.value = ''; // Also clear the observation text
        saveCartAndObservation(); // Update localStorage with the empty data
        updateCartDisplay(); // Re-render the UI to show it's empty
      }
    }

    // --- Event Listeners for Menu Page ---
    menuPageContainer.addEventListener('click', (e) => {
      handleAddToCart(e);
      handleExtraSauceChange(e);
      toggleExtraOptions(e);
    });

    cartHeader.addEventListener('click', toggleCart);
    cartItemsList.addEventListener('click', handleRemoveFromCart);
    clearCartButton.addEventListener('click', clearCart); //

    cartObservationEl.addEventListener('input', saveCartAndObservation);

    // Save observation before leaving the page
    continueButton.addEventListener('click', (e) => {
      e.preventDefault(); // Stop the link from navigating immediately
      window.location.href = continueButton.href; // Now navigate
    });

    // --- Initialization for Menu Page ---
    loadCartAndObservation();
    if (!cartSection.classList.contains('collapsed')) {
      cartSection.classList.add('collapsed');
    }
  }

  // =================================================================
  // ===== CHECKOUT PAGE LOGIC (checkout.html) =======================
  // =================================================================
  const checkoutList = document.getElementById('checkout-list');
  if (checkoutList) {
    let checkoutOrder = { items: [], observation: '' };
    const checkoutTotalEl = document.getElementById('checkout-total');

    function renderCheckoutPage() {
      checkoutList.innerHTML = '';

      if (!checkoutOrder.items || checkoutOrder.items.length === 0) {
        checkoutList.innerHTML = `<li class="checkout-empty-message">Seu pedido está vazio. <a href="cardapio.html">Voltar ao cardápio</a>.</li>`;
        checkoutTotalEl.innerText = 'TOTAL: R$ 0.00';
        return;
      }

      let totalPrice = 0;
      checkoutOrder.items.forEach((item, index) => {
        let itemTotal = item.basePrice * item.quantity;
        let extrasHtml = '';
        if (item.extras.length > 0) {
          extrasHtml += '<ul class="checkout-item-extras">';
          item.extras.forEach((extra) => {
            itemTotal += extra.price * extra.quantity * item.quantity;
            extrasHtml += `<li>${extra.quantity}x ${extra.name}</li>`;
          });
          extrasHtml += '</ul>';
        }

        totalPrice += itemTotal;
        let mainDesc = [item.name];
        if (item.type) mainDesc.push(item.type);
        if (item.sauce) mainDesc.push(item.sauce);

        const li = document.createElement('li');
        li.classList.add('checkout-item');
        li.dataset.index = index;

        li.innerHTML = `
          <div class="checkout-item-details">
            <p><span>${item.quantity}x</span> ${mainDesc.join(' - ')}</p>
            ${extrasHtml}
          </div>
          <button class="btn-remove-checkout" title="Remover item">
            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
          </button>
        `;
        checkoutList.appendChild(li);
      });

      function removeFromCheckout(index) {
        checkoutOrder.items.splice(index, 1);
        localStorage.setItem('restaurantOrder', JSON.stringify(checkoutOrder));
        renderCheckoutPage();
      }

      checkoutList.addEventListener('click', (e) => {
        const removeButton = e.target.closest('.btn-remove-checkout');
        if (removeButton) {
          const itemEl = removeButton.closest('.checkout-item');
          const indexToRemove = parseInt(itemEl.dataset.index);
          removeFromCheckout(indexToRemove);
        }
      });
      // Add observation at the end of the list
      if (checkoutOrder.observation) {
        const obsLi = document.createElement('li');
        obsLi.classList.add('checkout-item-observation-final');
        obsLi.innerHTML = `<h4>Observações:</h4><p>${checkoutOrder.observation}</p>`;
        checkoutList.appendChild(obsLi);
      }
      checkoutTotalEl.innerText = `TOTAL: R$ ${totalPrice.toFixed(2)}`;
    }

    const savedOrder = localStorage.getItem('restaurantOrder');
    if (savedOrder) {
      checkoutOrder = JSON.parse(savedOrder);
    }

    renderCheckoutPage();
  }
});
