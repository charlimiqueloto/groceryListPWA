const STORAGE_KEY = 'modern-grocery-list-v1';
const currencyFormatter = new Intl.NumberFormat('en-CA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const addForm = document.querySelector('#addForm');
const itemNameInput = document.querySelector('#itemName');
const formMessage = document.querySelector('#formMessage');
const itemsList = document.querySelector('#itemsList');
const emptyState = document.querySelector('#emptyState');
const grandTotal = document.querySelector('#grandTotal');
const clearBtn = document.querySelector('#clearBtn');
const installBtn = document.querySelector('#installBtn');

let groceryItems = loadItems();
let deferredPrompt;

function loadItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groceryItems));
}

function moneyToCents(value) {
  const digitsOnly = String(value).replace(/\D/g, '');
  return Number(digitsOnly || 0);
}

function centsToInput(cents) {
  return `CAD ${currencyFormatter.format((Number(cents) || 0) / 100)}`;
}

function centsToPriceInput(cents) {
  const numericCents = Number(cents) || 0;
  return numericCents > 0 ? centsToInput(numericCents) : '';
}

function quantityToNumber(value) {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity >= 0 ? quantity : 0;
}

function itemSubtotalCents(item) {
  const quantity = item.quantity === '' ? 1 : quantityToNumber(item.quantity);
  return Math.round(quantity * Number(item.priceCents || 0));
}

function calculateGrandTotalCents() {
  return groceryItems.reduce((sum, item) => sum + itemSubtotalCents(item), 0);
}

function showMessage(message = '') {
  formMessage.textContent = message;
}

function addItem(name) {
  groceryItems.push({
    id: crypto.randomUUID(),
    name,
    quantity: '',
    priceCents: 0,
    purchased: false,
  });
  saveItems();
  render();
}

function updateItem(id, changes, shouldRender = true) {
  groceryItems = groceryItems.map((item) => item.id === id ? { ...item, ...changes } : item);
  saveItems();
  if (shouldRender) render();
}

function removeItem(id) {
  groceryItems = groceryItems.filter((item) => item.id !== id);
  saveItems();
  render();
}

function startEditingItemName(id, listItem) {
  const item = groceryItems.find((currentItem) => currentItem.id === id);
  if (!item) return;

  const nameButton = listItem.querySelector('.item-name');
  const editInput = document.createElement('input');
  editInput.className = 'item-name-edit';
  editInput.type = 'text';
  editInput.value = item.name;
  editInput.setAttribute('aria-label', 'Edit item name');

  nameButton.replaceWith(editInput);
  editInput.focus();
  editInput.select();

  const saveName = () => {
    const newName = editInput.value.trim();

    if (!newName) {
      render();
      return;
    }

    updateItem(id, { name: newName });
  };

  editInput.addEventListener('blur', saveName);
  editInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      editInput.blur();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      render();
    }
  });
}

function render() {
  itemsList.innerHTML = '';
  emptyState.hidden = groceryItems.length > 0;
  clearBtn.hidden = groceryItems.length === 0;

  for (const item of groceryItems) {
    const li = document.createElement('li');
    li.className = `shopping-item${item.purchased ? ' purchased' : ''}`;
    li.innerHTML = `
      <input class="purchased-checkbox" type="checkbox" aria-label="Mark item as purchased" ${item.purchased ? 'checked' : ''}>
      <button class="item-name" type="button" title="Click to edit item name"></button>
      <span class="line-fill" aria-hidden="true"></span>

      <label class="inline-field quantity-field">
        <span>Qty:</span>
        <input class="quantity-input" type="number" min="0" step="any" inputmode="decimal" placeholder="-" value="${item.quantity}">
      </label>

      <label class="inline-field price-field">
        <span>Price:</span>
        <input class="price-input" type="text" inputmode="numeric" placeholder="" value="${centsToPriceInput(item.priceCents)}">
      </label>

      <span class="item-subtotal">${centsToInput(itemSubtotalCents(item))}</span>
      <button class="remove-btn" type="button" aria-label="Remove item">×</button>
    `;

    const purchasedCheckbox = li.querySelector('.purchased-checkbox');
    purchasedCheckbox.checked = Boolean(item.purchased);
    purchasedCheckbox.addEventListener('change', (event) => {
      updateItem(item.id, { purchased: event.target.checked });
    });

    const itemNameButton = li.querySelector('.item-name');
    itemNameButton.textContent = item.name;
    itemNameButton.addEventListener('click', () => startEditingItemName(item.id, li));

    li.querySelector('.remove-btn').addEventListener('click', () => removeItem(item.id));

    const quantityInput = li.querySelector('.quantity-input');
    quantityInput.addEventListener('input', (event) => {
      const rawValue = event.target.value;
      const quantity = rawValue === '' ? '' : Math.max(0, Number(rawValue));
      updateItem(item.id, { quantity });
    });

    const priceInput = li.querySelector('.price-input');
    priceInput.addEventListener('input', (event) => {
      const priceCents = moneyToCents(event.target.value);
      event.target.value = centsToPriceInput(priceCents);

      updateItem(item.id, { priceCents }, false);

      const updatedItem = groceryItems.find((currentItem) => currentItem.id === item.id);
      li.querySelector('.item-subtotal').textContent = centsToInput(itemSubtotalCents(updatedItem));
      grandTotal.textContent = centsToInput(calculateGrandTotalCents());
    });

    itemsList.appendChild(li);
  }

  grandTotal.textContent = centsToInput(calculateGrandTotalCents());
}

addForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const itemName = itemNameInput.value.trim();

  if (!itemName) {
    showMessage('Please enter an item name.');
    return;
  }

  const alreadyExists = groceryItems.some((item) => item.name.toLowerCase() === itemName.toLowerCase());
  if (alreadyExists) {
    showMessage('This item is already on your list.');
    return;
  }

  showMessage('');
  addItem(itemName);
  itemNameInput.value = '';
  itemNameInput.focus();
});

clearBtn.addEventListener('click', () => {
  groceryItems = [];
  saveItems();
  render();
});

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.classList.remove('hidden');
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.classList.add('hidden');
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js');
  });
}

render();
