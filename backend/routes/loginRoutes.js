const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');

// Rota de login (POST /login)
router.post('/', loginController.login);

// Rota de logout (POST /logout)
router.post('/logout', loginController.logout);

// Rota para verificar status de login (GET /login/status)
router.get('/status', loginController.verificaSeUsuarioEstaLogado);

module.exports = router;
