const express = require('express');
const router = express.Router();
const controller = require('../controllers/pessoaController');
const loginController = require('../controllers/loginController');

// Rota para abrir a página do CRUD (não precisa de autenticação se for só para a página)
router.get('/', controller.abrirCrudPessoa);

// Todas as rotas de gerenciamento devem ser protegidas para Gerente
router.use('/api', loginController.isAuthenticated);
router.use('/api', loginController.isManager);

router.get('/api', controller.listarPessoas);
router.get('/api/:cpf', controller.obterPessoa);
router.post('/api', controller.criarPessoa);
router.put('/api/:cpf', controller.atualizarPessoa);
router.delete('/api/:cpf', controller.deletarPessoa);

module.exports = router;
