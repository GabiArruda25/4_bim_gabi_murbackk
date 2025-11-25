const express = require('express');
const router = express.Router();
const controller = require('../controllers/produtoController');
const loginController = require('../controllers/loginController');

// Rota para abrir a página do CRUD (não precisa de autenticação se for só para a página)
router.get('/', controller.abrirCrudProduto);

// Rota de API para listar produtos (Catálogo) - ACESSO PÚBLICO
router.get('/api', controller.listarProdutos);

// Todas as rotas de gerenciamento (CRUD) devem ser protegidas para Gerente
router.use('/api', loginController.isAuthenticated);
router.use('/api', loginController.isManager);

router.get('/api/:id', controller.obterProduto);
router.post('/api', controller.criarProduto);
router.put('/api/:id', controller.atualizarProduto);
router.delete('/api/:id', controller.deletarProduto);

module.exports = router;
