// Variável global para o carrinho
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let user = null;
const API_BASE_URL = 'http://localhost:3001'; // URL do backend

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadProducts();
    updateCartDisplay();
    setupCartModal();
});

// --- Funções de Autenticação e Autorização ---

async function checkLoginStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/login/status`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include' // IMPORTANTE: Enviar cookies com a requisição
        });
        const data = await response.json();

        const userNameElement = document.getElementById('user-name');
        const authButton = document.getElementById('auth-button');
        const managerMenuItems = document.querySelectorAll('.manager-only');
        const clientMenuItems = document.querySelectorAll('.client-only');

        if (data.status === 'ok') {
            user = data;
            userNameElement.textContent = data.nome;
            authButton.textContent = 'Logout';
            authButton.onclick = logout;

            // Mostrar links de gerenciamento apenas para Gerente
            if (data.role === 'G') {
                managerMenuItems.forEach(item => item.style.display = 'list-item');
                clientMenuItems.forEach(item => item.style.display = 'list-item'); // Gerente também pode fazer compras
            } else if (data.role === 'C' || data.role === 'F') {
                managerMenuItems.forEach(item => item.style.display = 'none');
                clientMenuItems.forEach(item => item.style.display = 'list-item');
            } else {
                managerMenuItems.forEach(item => item.style.display = 'none');
                clientMenuItems.forEach(item => item.style.display = 'none');
            }
            
            // Se o usuário estiver logado, o carrinho deve ser associado a um pedido pendente
            // (Lógica a ser implementada na fase 5, por enquanto, apenas o frontend)

        } else {
            user = null;
            userNameElement.textContent = 'Visitante';
            authButton.textContent = 'Login';
            authButton.onclick = redirectToLogin;
            managerMenuItems.forEach(item => item.style.display = 'none');
            clientMenuItems.forEach(item => item.style.display = 'none');
        }
    } catch (error) {
        console.error('Erro ao verificar status de login:', error);
    }
}

function redirectToLogin() {
    // Redireciona para a página de login
    window.location.href = 'login/login.html'; 
}

async function logout() {
    try {
        const response = await fetch(`${API_BASE_URL}/login/logout`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include' // IMPORTANTE: Enviar cookies com a requisição
        });
        if (response.ok) {
            localStorage.removeItem('cart'); // Limpa o carrinho local ao fazer logout
            cart = [];
            updateCartDisplay();
            // Não precisa de checkLoginStatus() aqui, o redirecionamento fará isso
            window.location.href = 'menu.html';
        } else {
            console.error('Erro ao fazer logout no servidor:', await response.json());
        }
    } catch (error) {
        console.error('Erro de comunicação ao fazer logout:', error);
    }
}

function handleAuthAction() {
    if (user) {
        logout();
    } else {
        redirectToLogin();
    }
}

// --- Funções de Catálogo de Produtos ---

async function loadProducts() {
    try {
        // A rota /produto/api deve ser pública para que o catálogo carregue sem login
        const response = await fetch(`${API_BASE_URL}/produto/api`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include' // Enviar cookies para preservar sessão
        }); 
        const products = await response.json();
        const productList = document.getElementById('product-list');
        productList.innerHTML = ''; // Limpa a lista existente

        products.forEach(product => {
            const productCard = createProductCard(product);
            productList.appendChild(productCard);
        });
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        // Exibir uma mensagem de erro amigável
        document.getElementById('product-list').innerHTML = '<p style="text-align: center; color: red;">Não foi possível carregar os produtos. Verifique a conexão com o servidor.</p>';
    }
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <img src="${product.imagem_produto ? '/imagens-produtos/' + product.imagem_produto : 'placeholder.png'}" alt="${product.nome_produto}">
        <div class="product-info">
            <h3>${product.nome_produto}</h3>
            <p class="price">R$ ${parseFloat(product.preco_unitario_produto).toFixed(2)}</p>
            <button onclick="addToCart(${product.id_produto}, '${product.nome_produto}', ${parseFloat(product.preco_unitario_produto)})">Adicionar ao Carrinho</button>
        </div>
    `;
    return card;
}

// --- Funções do Carrinho ---

function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    // alert(`${name} adicionado ao carrinho!`);
}

function removeFromCart(id) {
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity -= 1;
        if (existingItem.quantity <= 0) {
            cart = cart.filter(item => item.id !== id);
        }
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartCount = document.getElementById('cart-count');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartTotalElement = document.getElementById('cart-total');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const checkoutButton = document.getElementById('checkout-btn');
    const checkoutWarning = document.getElementById('checkout-warning');

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    if (cart.length === 0) {
        cartItemsList.innerHTML = '';
        emptyCartMessage.style.display = 'block';
        cartTotalElement.textContent = '0.00';
        checkoutButton.disabled = true;
    } else {
        emptyCartMessage.style.display = 'none';
        cartItemsList.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <span>${item.name} (x${item.quantity})</span>
                </div>
                <div class="cart-item-actions">
                    <span>R$ ${(item.price * item.quantity).toFixed(2)}</span>
                    <button onclick="removeFromCart(${item.id})">Remover 1</button>
                </div>
            </div>
        `).join('');

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalElement.textContent = total.toFixed(2);
        checkoutButton.disabled = false;
    }
    
    // Lógica de Pagamento: Apenas logados podem finalizar
    if (user && (user.role === 'C' || user.role === 'G' || user.role === 'F')) {
        checkoutWarning.style.display = 'none';
        checkoutButton.onclick = finalizePurchase;
        checkoutButton.textContent = 'Finalizar Compra';
    } else {
        checkoutWarning.style.display = 'block';
        checkoutButton.onclick = redirectToLogin;
        checkoutButton.textContent = 'Fazer Login para Finalizar';
    }
}

function setupCartModal() {
    const modal = document.getElementById('cart-modal');
    const openBtn = document.getElementById('open-cart-btn');
    const closeBtn = document.getElementById('close-cart-btn');

    openBtn.onclick = () => {
        modal.style.display = 'block';
    };

    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

async function finalizePurchase() {
    if (!user) {
        alert('Você precisa estar logado para finalizar a compra.');
        return;
    }

    if (cart.length === 0) {
        alert('Seu carrinho está vazio.');
        return;
    }

    // Preparar os dados do pedido
    const pedidoData = {
        cliente_cpf: user.cpf,
        itens: cart.map(item => ({
            produto_id: item.id,
            quantidade: item.quantity,
            preco_unitario_venda: item.price
        }))
    };

    try {
        // 1. Criar o Pedido no backend
        const response = await fetch(`${API_BASE_URL}/pedido/api`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // IMPORTANTE: Enviar cookies para autenticação
            body: JSON.stringify(pedidoData)
        });

        const result = await response.json();

        if (response.ok) {
            alert('Pedido criado com sucesso! Você será redirecionado para a página de pagamento.');
            localStorage.removeItem('cart');
            cart = [];
            updateCartDisplay();
            document.getElementById('cart-modal').style.display = 'none';
            // Redirecionar para a página de pagamento/detalhes do pedido
            // A rota /pedido/detalhes/:id precisa ser criada no backend
            window.location.href = `/pedido/detalhes/${result.id_pedido}`; 
        } else {
            alert(`Erro ao finalizar a compra: ${result.error}`);
        }
    } catch (error) {
        console.error('Erro ao finalizar a compra:', error);
        alert('Erro de comunicação com o servidor ao finalizar a compra.');
    }
}