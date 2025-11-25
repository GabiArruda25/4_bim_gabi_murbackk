const express = require('express');
const router = express.Router();
const clienteController = require('./../controllers/clienteController');
const loginController = require('../controllers/loginController');

// CRUD de Clientes

router.get('/abrirCrudCliente', clienteController.abrirCrudCliente);

// Rotas protegidas para gerentes
router.use(loginController.isAuthenticated);
router.use(loginController.isManager);

router.get('/', clienteController.listarClientes);
router.post('/', clienteController.criarCliente);
router.get('/:id', clienteController.obterCliente);
router.put('/:id', clienteController.atualizarCliente);
router.delete('/:id', clienteController.deletarCliente);

module.exports = router;
