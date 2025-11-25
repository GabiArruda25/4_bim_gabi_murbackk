const express = require('express');
const router = express.Router();
const controller = require('../controllers/relatorioController');
const loginController = require('../controllers/loginController');

// Rota para abrir a página de relatórios
router.get('/', controller.abrirPaginaRelatorios);

// Todas as rotas de relatório devem ser protegidas para Gerente
router.use(loginController.isAuthenticated);
router.use(loginController.isManager);

router.get('/vendas-por-mes', controller.vendasPorMes);
router.get('/produtos-mais-vendidos', controller.produtosMaisVendidos);

module.exports = router;
