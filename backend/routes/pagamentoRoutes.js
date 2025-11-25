const express = require('express');
const router = express.Router();
const controller = require('../controllers/pagamentoController');
const loginController = require('../controllers/loginController');

// Rota de API para finalizar pagamento - Protegida (Cliente/Gerente)
router.post('/api', loginController.isAuthenticated, controller.finalizarPagamento);

// Rota de API para obter detalhes de pagamento - Protegida (Gerente)
router.get('/api/:id', loginController.isAuthenticated, loginController.isManager, controller.obterPagamento);

module.exports = router;
