// URL de la "base de datos" local (JSON simulado)
const PRODUCTS_URL = 'data/productos.json';

// Elementos del DOM
const productList = document.getElementById('product-list');
const cartCount = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const cartButton = document.getElementById('cart-button');
const closeCartButton = document.getElementById('close-cart-button');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalSpan = document.getElementById('cart-total');

const searchInput = document.getElementById('search-input');
const categoryButtons = document.querySelectorAll('.category-btn');

// Elementos del Carrusel
const carousel = document.getElementById('carousel');
let carouselItems = [];
let currentIndex = 0;

// Estado global (Variables de control)
let cart = JSON.parse(localStorage.getItem('growshopCart')) || [];
let allProducts = [];
let currentCategory = 'Todos'; // Categoría activa por defecto
let currentSearchTerm = ''; // Término de búsqueda actual

// --- FUNCIONES DE INICIO Y CARGA ---

/**
 * Inicializa la carga de productos y el carrusel al cargar la página.
 */
async function loadProducts() {
    try {
        const response = await fetch(PRODUCTS_URL);
        if (!response.ok) {
            throw new Error(`Error al cargar los productos: ${response.statusText}`);
        }
        allProducts = await response.json();
        
        // Cargar y mostrar productos iniciales
        filterAndSearchProducts(); 
        updateCartDisplay();
        
        // Inicializar el carrusel
        initCarousel();
        // Establecer el estado inicial del botón "Todos"
        document.querySelector('[data-category="Todos"]').classList.add('bg-emerald-600', 'text-white', 'hover:bg-emerald-700');
        document.querySelector('[data-category="Todos"]').classList.remove('bg-white', 'text-gray-700', 'hover:bg-emerald-100');

    } catch (error) {
        console.error("No se pudo cargar el catálogo:", error);
        productList.innerHTML = `<p class="col-span-full text-red-500 text-center text-xl p-10">
            Error: No se pudo cargar el catálogo de productos.
        </p>`;
    }
}

/**
 * --- LÓGICA DE FILTROS Y BÚSQUEDA ---
 */

/**
 * Filtra y busca productos basados en la categoría y el término de búsqueda.
 */
function filterAndSearchProducts() {
    let filteredProducts = allProducts;
    
    // 1. Filtrar por Categoría
    if (currentCategory !== 'Todos') {
        filteredProducts = filteredProducts.filter(p => p.categoria === currentCategory);
    }

    // 2. Buscar por Término
    if (currentSearchTerm) {
        const term = currentSearchTerm.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
            p.nombre.toLowerCase().includes(term) || 
            p.descripcion.toLowerCase().includes(term) ||
            p.categoria.toLowerCase().includes(term)
        );
    }
    
    renderProducts(filteredProducts);
}

/**
 * Renderiza la lista de productos filtrados en el DOM.
 * @param {Array<Object>} productsToRender - Array de objetos producto.
 */
function renderProducts(productsToRender) {
    if (productsToRender.length === 0) {
        productList.innerHTML = `<div class="col-span-full text-center text-gray-500 p-10 bg-white rounded-xl shadow-inner">
            <p class="text-2xl font-bold mb-2">No se encontraron productos.</p>
            <p>Intenta ajustar tu búsqueda o selecciona otra categoría.</p>
        </div>`;
        return;
    }

    productList.innerHTML = productsToRender.map(product => `
        <div class="bg-white p-6 rounded-xl shadow-lg transition duration-300 shadow-hover flex flex-col border border-gray-100">
            <img src="${product.imagen}" alt="${product.nombre}" class="w-full h-48 object-cover rounded-md mb-4 border border-gray-200">
            <span class="text-sm font-semibold text-emerald-600 mb-1">${product.categoria}</span>
            <h3 class="text-xl font-bold mb-2 flex-grow">${product.nombre}</h3>
            <p class="text-gray-500 mb-4 text-sm line-clamp-2">${product.descripcion}</p>
            <p class="text-3xl font-extrabold text-gray-800 mb-4">${product.precio.toFixed(2)} €</p>
            
            <button onclick="addToCart(${product.id})" class="bg-emerald-500 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-emerald-600 transition duration-300 shadow-md">
                Añadir al Carrito
            </button>
        </div>
    `).join('');
}


// --- LÓGICA DEL CARRITO ---

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
        // Clonar el objeto para que no se modifique el producto original
        cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    updateCartDisplay();
    // Muestra una notificación con el nombre truncado del producto
    showToast(`${product.nombre.substring(0, 30)}... añadido.`);
}

/**
 * Guarda el estado actual del carrito en localStorage.
 */
function saveCart() {
    localStorage.setItem('growshopCart', JSON.stringify(cart));
}

/**
 * Actualiza el contador de ítems en el ícono del carrito y el total.
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
        cartItemsContainer.innerHTML = '<p class="text-gray-500 p-4">El carrito está vacío.</p>';
        cartTotalSpan.textContent = '0.00';
        return;
    }

    const cartItemsHTML = cart.map(item => `
        <div class="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
            <div class="flex items-center space-x-3">
                <img src="${item.imagen}" alt="${item.nombre}" class="w-16 h-12 object-cover rounded-md border">
                <div>
                    <p class="font-semibold text-gray-800">${item.nombre}</p>
                    <p class="text-sm text-gray-500">${item.quantity} x ${item.precio.toFixed(2)} €</p>
                </div>
            </div>
            <p class="font-bold text-lg text-emerald-600">
                ${(item.quantity * item.precio).toFixed(2)} €
            </p>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + item.quantity * item.precio, 0);

    cartItemsContainer.innerHTML = cartItemsHTML;
    cartTotalSpan.textContent = total.toFixed(2);
}

// --- LÓGICA DEL CARRUSEL ---

/**
 * Inicializa y automatiza el carrusel de anuncios.
 */
function initCarousel() {
    carouselItems = Array.from(carousel.children);
    showItem(currentIndex);
    // Configura el intervalo para cambiar de ítem cada 5 segundos
    setInterval(nextItem, 5000); 
}

/**
 * Muestra el ítem actual del carrusel.
 * @param {number} index - Índice del ítem a mostrar.
 */
function showItem(index) {
    // 1. Esconde todos los ítems
    carouselItems.forEach(item => {
        item.classList.remove('active');
        item.style.opacity = 0;
    });

    // 2. Muestra el ítem actual
    carouselItems[index].classList.add('active');
    carouselItems[index].style.opacity = 1;
    
    // 3. Mueve el carrusel (simulación de scroll horizontal)
    // El ancho del contenedor de carrusel debe estar ajustado para que esto funcione
    carousel.style.transform = `translateX(-${index * 100}%)`;
}

/**
 * Pasa al siguiente ítem del carrusel.
 */
function nextItem() {
    // Pasa al siguiente índice, y vuelve al 0 si supera el límite (loop)
    currentIndex = (currentIndex + 1) % carouselItems.length;
    showItem(currentIndex);
}


// --- UTILIDADES Y EVENT LISTENERS ---

/**
 * Muestra una notificación temporal.
 * @param {string} message - Mensaje a mostrar.
 */
function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.className = "fixed bottom-5 right-5 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl transition-opacity duration-300 opacity-0 z-[200]";
    document.body.appendChild(toast);
    
    // Animación de aparición
    setTimeout(() => { toast.classList.remove('opacity-0'); toast.style.opacity = 1; }, 50);
    
    // Animación de desaparición
    setTimeout(() => {
        toast.style.opacity = 0;
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Evento de Búsqueda (Se dispara cada vez que el usuario teclea)
searchInput.addEventListener('input', (e) => {
    currentSearchTerm = e.target.value;
    filterAndSearchProducts();
});

// Eventos de Categoría (Se dispara al hacer click en el botón de filtro)
categoryButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        // 1. Resetear el estilo de todos los botones
        categoryButtons.forEach(btn => {
            btn.classList.remove('bg-emerald-600', 'text-white', 'hover:bg-emerald-700');
            btn.classList.add('bg-white', 'text-gray-700', 'border', 'border-gray-300', 'hover:bg-emerald-100');
        });

        // 2. Aplicar estilo al botón activo
        e.currentTarget.classList.add('bg-emerald-600', 'text-white', 'hover:bg-emerald-700');
        e.currentTarget.classList.remove('bg-white', 'text-gray-700', 'border', 'border-gray-300', 'hover:bg-emerald-100');

        // 3. Aplicar filtro
        currentCategory = e.currentTarget.dataset.category;
        // Limpiar la barra de búsqueda al cambiar de categoría
        searchInput.value = '';
        currentSearchTerm = '';

        filterAndSearchProducts();
    });
});


// Event Listeners para el Modal del Carrito
cartButton.addEventListener('click', () => {
    cartModal.classList.remove('hidden');
    cartModal.classList.add('flex');
});

closeCartButton.addEventListener('click', () => {
    cartModal.classList.add('hidden');
    cartModal.classList.remove('flex');
});

// Cerrar Modal al hacer click en el fondo oscuro
cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) {
        cartModal.classList.add('hidden');
        cartModal.classList.remove('flex');
    }
});

// Inicia la carga de productos y la web al cargar la ventana
window.onload = loadProducts;