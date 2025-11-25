const express = require('express');
const router = express.Router();
const controller = require('../controllers/pedidoController');
const loginController = require('../controllers/loginController');

// Rota para abrir a página do CRUD (Gerente)
router.get('/', controller.abrirCrudPedido);

// Rota para o cliente ver seus pedidos (Página)
router.get('/meus-pedidos', loginController.isAuthenticated, (req, res) => {
    // Apenas um placeholder, a lógica de listagem é na API
    res.send('<h1>Meus Pedidos</h1><p>Lista de pedidos do cliente (a ser implementado no frontend).</p>');
});

// Rota para ver detalhes de um pedido (Página)
router.get('/detalhes/:id', loginController.isAuthenticated, (req, res) => {
    // Apenas um placeholder, a lógica de listagem é na API
    res.send(`<h1>Detalhes do Pedido #${req.params.id}</h1><p>Detalhes do pedido (a ser implementado no frontend).</p>`);
});

// --- Rotas de API ---

// Criar Pedido (Checkout) - Apenas para usuários logados (Cliente/Gerente)
router.post('/api', loginController.isAuthenticated, controller.criarPedido);

// Listar Meus Pedidos - Apenas para usuários logados (Cliente/Gerente)
router.get('/api/meus-pedidos', loginController.isAuthenticated, controller.meusPedidos);

// Listar Todos os Pedidos (Gerente)
router.get('/api/gerenciamento', loginController.isAuthenticated, loginController.isManager, controller.listarPedidos);

// Obter/Atualizar/Deletar Pedido (Gerente OU Cliente - com verificação interna)
router.get('/api/:id', loginController.isAuthenticated, controller.obterPedido);
router.put('/api/:id', loginController.isAuthenticated, loginController.isManager, controller.atualizarPedido);
router.delete('/api/delete/:id', loginController.isAuthenticated, loginController.isManager, controller.deletarPedido); // Alterado para evitar conflito de rota

module.exports = router;
