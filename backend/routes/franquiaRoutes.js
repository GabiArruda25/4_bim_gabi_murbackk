const express = require('express');
const router = express.Router();
const controller = require('../controllers/franquiaController');
const loginController = require('../controllers/loginController');

// Rota para abrir a página do CRUD (não precisa de autenticação se for só para a página)
router.get('/', controller.abrirCrudFranquia);

// Todas as rotas de gerenciamento devem ser protegidas para Gerente
router.use('/api', loginController.isAuthenticated);
router.use('/api', loginController.isManager);

router.get('/api', controller.listarFranquias);
router.get('/api/:id', controller.obterFranquia);
router.post('/api', controller.criarFranquia);
router.put('/api/:id', controller.atualizarFranquia);
router.delete('/api/:id', controller.deletarFranquia);

module.exports = router;
