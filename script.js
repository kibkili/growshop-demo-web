// URL de la "base de datos" local
const PRODUCTS_URL = 'data/productos.json';

// Elementos del DOM
const productList = document.getElementById('product-list');
const cartCount = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const cartButton = document.getElementById('cart-button');
const closeCartButton = document.getElementById('close-cart-button');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalSpan = document.getElementById('cart-total');
const emptyCartMessage = document.getElementById('empty-cart-message');

// Estado global (carrito)
let cart = JSON.parse(localStorage.getItem('growshopCart')) || [];
let allProducts = [];

// --- FUNCIONES DE INICIO Y CARGA ---

/**
 * Carga los productos desde el archivo JSON simulado.
 */
async function loadProducts() {
    try {
        const response = await fetch(PRODUCTS_URL);
        if (!response.ok) {
            throw new Error(`Error al cargar los productos: ${response.statusText}`);
        }
        allProducts = await response.json();
        renderProducts(allProducts);
        updateCartDisplay();
    } catch (error) {
        console.error("No se pudo cargar el catálogo:", error);
        productList.innerHTML = `<p class="col-span-full text-red-500 text-center">Error: No se pudo cargar el catálogo de productos (${error.message}).</p>`;
    }
}

/**
 * Renderiza la lista de productos en el DOM.
 * @param {Array<Object>} productsToRender - Array de objetos producto.
 */
function renderProducts(productsToRender) {
    productList.innerHTML = productsToRender.map(product => `
        <div class="bg-white p-6 rounded-xl shadow-lg transition duration-300 card-hover flex flex-col">
            <img src="${product.imagen}" alt="${product.nombre}" class="w-full h-40 object-cover rounded-md mb-4 border border-gray-100">
            <span class="text-sm font-semibold text-emerald-600 mb-1">${product.categoria}</span>
            <h3 class="text-xl font-semibold mb-2 flex-grow">${product.nombre}</h3>
            <p class="text-2xl font-bold text-gray-800 mb-4">${product.precio.toFixed(2)} €</p>
            
            <button onclick="addToCart(${product.id})" class="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-600 transition duration-300">
                Añadir al Carrito
            </button>
        </div>
    `).join('');
}

// --- FUNCIONES DEL CARRITO ---

/**
 * Añade un producto al carrito (o incrementa su cantidad).
 * @param {number} productId - ID del producto a añadir.
 */
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    updateCartDisplay();
    showToast(`${product.nombre} añadido.`);
}

/**
 * Guarda el estado actual del carrito en localStorage.
 */
function saveCart() {
    localStorage.setItem('growshopCart', JSON.stringify(cart));
}

/**
 * Actualiza el contador de ítems en el ícono del carrito.
 */
function updateCartDisplay() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    renderCartModal();
}

/**
 * Renderiza los ítems y el total dentro del modal del carrito.
 */
function renderCartModal() {
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-gray-500">El carrito está vacío.</p>';
        cartTotalSpan.textContent = '0.00';
        return;
    }

    const cartItemsHTML = cart.map(item => `
        <div class="flex justify-between items-center py-2 border-b last:border-b-0">
            <div class="flex items-center space-x-3">
                <img src="${item.imagen}" alt="${item.nombre}" class="w-12 h-12 object-cover rounded-md">
                <div>
                    <p class="font-semibold">${item.nombre}</p>
                    <p class="text-sm text-gray-500">${item.quantity} x ${item.precio.toFixed(2)} €</p>
                </div>
            </div>
            <p class="font-bold text-gray-700">
                ${(item.quantity * item.precio).toFixed(2)} €
            </p>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + item.quantity * item.precio, 0);

    cartItemsContainer.innerHTML = cartItemsHTML;
    cartTotalSpan.textContent = total.toFixed(2);
}

// --- UTILIDADES ---

/**
 * Muestra una notificación temporal (simulada)
 * @param {string} message - Mensaje a mostrar.
 */
function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.className = "fixed bottom-5 right-5 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl transition-opacity duration-300 opacity-0";
    document.body.appendChild(toast);
    
    // Animación de aparición
    setTimeout(() => { toast.classList.remove('opacity-0'); }, 100);
    
    // Animación de desaparición
    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- EVENT LISTENERS ---

// Abrir Modal
cartButton.addEventListener('click', () => {
    renderCartModal(); // Asegura que el modal esté actualizado
    cartModal.classList.remove('hidden');
    cartModal.classList.add('flex');
});

// Cerrar Modal
closeCartButton.addEventListener('click', () => {
    cartModal.classList.add('hidden');
    cartModal.classList.remove('flex');
});

// Cerrar Modal al hacer click fuera
cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) {
        cartModal.classList.add('hidden');
        cartModal.classList.remove('flex');
    }
});

// Inicia la carga de productos al cargar la página
window.onload = loadProducts;