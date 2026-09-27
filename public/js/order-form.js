document.addEventListener('DOMContentLoaded', () => {
  const data = window.VINISHA_REF_ORDER_FORM_DATA || { isEdit: false, existingProducts: [] };

  let rowIndex = 0;
  const rowsBody = document.getElementById('productRowsBody');
  const rowTemplate = document.getElementById('productRowTemplate');
  const addRowBtn = document.getElementById('addProductRow');

  const grandTotalEl = document.getElementById('formGrandTotal');

  function updateGrandTotal() {
    let total = 0;
    rowsBody.querySelectorAll('.product-row').forEach((row) => {
      const price = parseFloat(row.querySelector('.product-price').value) || 0;
      const quantity = parseFloat(row.querySelector('.product-quantity').value) || 0;
      total += price * quantity;
    });
    if (grandTotalEl) {
      grandTotalEl.textContent = '₹' + total.toFixed(2);
    }
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  function addProductRow(prefill) {
    const html = rowTemplate.innerHTML.replaceAll('__INDEX__', String(rowIndex));
    const wrapper = document.createElement('tbody');
    wrapper.innerHTML = html;
    const row = wrapper.firstElementChild;
    rowsBody.appendChild(row);

    if (prefill) {
      row.querySelector('.product-id').value = prefill.product || prefill.productId || '';
      row.querySelector('.product-hinglish').value = prefill.nameHinglish || '';
      const gujaratiInput = row.querySelector('.product-gujarati');
      if (gujaratiInput) gujaratiInput.value = prefill.nameGujarati || '';
      row.querySelector('.product-price').value = prefill.price || '';
      row.querySelector('.product-quantity').value = prefill.quantity || '';
    }

    wireProductRow(row);
    rowIndex += 1;
    updateGrandTotal();
  }

  function wireProductRow(row) {
    const hinglishInput = row.querySelector('.product-hinglish');
    const productIdInput = row.querySelector('.product-id');
    const suggestionsBox = row.querySelector('.product-suggestions');
    const removeBtn = row.querySelector('.remove-product-row');
    const priceInput = row.querySelector('.product-price');
    const quantityInput = row.querySelector('.product-quantity');

    priceInput.addEventListener('input', updateGrandTotal);
    quantityInput.addEventListener('input', updateGrandTotal);

    removeBtn.addEventListener('click', () => {
      // Always keep at least one row
      if (rowsBody.querySelectorAll('.product-row').length > 1) {
        row.remove();
        updateGrandTotal();
      } else {
        hinglishInput.value = '';
        const gujaratiInput = row.querySelector('.product-gujarati');
        if (gujaratiInput) gujaratiInput.value = '';
        row.querySelector('.product-price').value = '';
        productIdInput.value = '';
        row.querySelector('.product-quantity').value = '';
        updateGrandTotal();
      }
    });

    // Product search-as-you-type
    const searchProducts = debounce(async (query) => {
      if (!query) {
        suggestionsBox.classList.add('d-none');
        suggestionsBox.innerHTML = '';
        return;
      }
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        renderProductSuggestions(json.products || []);
      } catch (err) {
        console.error('Product search failed', err);
      }
    }, 250);

    function renderProductSuggestions(products) {
      if (products.length === 0) {
        suggestionsBox.classList.add('d-none');
        suggestionsBox.innerHTML = '';
        return;
      }
      suggestionsBox.innerHTML = products
        .map(
          (p) =>
            `<div class="suggestion-item" data-id="${p._id}" data-hinglish="${escapeHtml(
              p.nameHinglish,
            )}" data-gujarati="${escapeHtml(p.nameGujarati)}">
              <strong>${escapeHtml(p.nameHinglish)}</strong>
            </div>`
        )
        .join('');
      suggestionsBox.classList.remove('d-none');

      suggestionsBox.querySelectorAll('.suggestion-item').forEach((item) => {
        item.addEventListener('click', () => {
          hinglishInput.value = item.getAttribute('data-hinglish');
          const gujaratiInput = row.querySelector('.product-gujarati');
          if (gujaratiInput) gujaratiInput.value = item.getAttribute('data-gujarati');
          productIdInput.value = item.getAttribute('data-id');
          suggestionsBox.classList.add('d-none');
          row.querySelector('.product-quantity').focus();
        });
      });
    }

    const transliterateInput = debounce(async (text) => {
      if (!text) {
        const gujaratiInput = row.querySelector('.product-gujarati');
        if (gujaratiInput) gujaratiInput.value = '';
        return;
      }
      try {
        const res = await fetch(`/api/products/transliterate?text=${encodeURIComponent(text)}`);
        const json = await res.json();
        if (json.success && json.gujarati) {
          const gujaratiInput = row.querySelector('.product-gujarati');
          if (gujaratiInput) gujaratiInput.value = json.gujarati;
        }
      } catch (err) {
        console.error('Transliteration failed', err);
      }
    }, 300);

    hinglishInput.addEventListener('input', () => {
      productIdInput.value = ''; // typing manually means it's not necessarily the same master product
      const val = hinglishInput.value.trim();
      searchProducts(val);
      transliterateInput(val);
    });

    hinglishInput.addEventListener('blur', () => {
      setTimeout(() => suggestionsBox.classList.add('d-none'), 150);
    });
  }

  addRowBtn.addEventListener('click', () => addProductRow());

  // ---------- Initialize rows ----------
  if (data.isEdit && Array.isArray(data.existingProducts) && data.existingProducts.length > 0) {
    data.existingProducts.forEach((p) => addProductRow(p));
  } else {
    addProductRow();
  }

  // ---------- Customer autocomplete ----------
  const customerNameInput = document.getElementById('customerName');
  const customerIdInput = document.getElementById('customerId');
  const customerSuggestions = document.getElementById('customerSuggestions');

  const searchCustomers = debounce(async (query) => {
    if (!query) {
      customerSuggestions.classList.add('d-none');
      customerSuggestions.innerHTML = '';
      return;
    }
    try {
      const res = await fetch(`/api/customers/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      renderCustomerSuggestions(json.customers || []);
    } catch (err) {
      console.error('Customer search failed', err);
    }
  }, 250);

  function renderCustomerSuggestions(customers) {
    if (customers.length === 0) {
      customerSuggestions.classList.add('d-none');
      customerSuggestions.innerHTML = '';
      return;
    }
    customerSuggestions.innerHTML = customers
      .map(
        (c) =>
          `<div class="suggestion-item" data-id="${c._id}" data-name="${escapeHtml(c.name)}">
            <i class="bi bi-person-circle text-muted me-1"></i>${escapeHtml(c.name)}
          </div>`
      )
      .join('');
    customerSuggestions.classList.remove('d-none');

    customerSuggestions.querySelectorAll('.suggestion-item').forEach((item) => {
      item.addEventListener('click', () => {
        customerNameInput.value = item.getAttribute('data-name');
        customerIdInput.value = item.getAttribute('data-id');
        customerSuggestions.classList.add('d-none');
      });
    });
  }

  customerNameInput.addEventListener('input', () => {
    customerIdInput.value = ''; // typing a new/edited name means it may be a new customer
    searchCustomers(customerNameInput.value.trim());
  });

  customerNameInput.addEventListener('blur', () => {
    setTimeout(() => customerSuggestions.classList.add('d-none'), 150);
  });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
});
