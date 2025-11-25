const express = require("express");
const router = express.Router();
const controller = require("../controllers/cargoController");
const loginController = require("../controllers/loginController");

// Rota para abrir a página do CRUD (não precisa de autenticação se for só para a página)
router.get("/", controller.abrirCrudCargo);

// Rota pública para listar cargos (necessário para o formulário de pessoa)
router.get("/api", controller.listarCargos);

// Todas as rotas de gerenciamento (CRUD) devem ser protegidas para Gerente
router.use("/api", loginController.isAuthenticated);
router.use("/api", loginController.isManager);

router.get("/api/:id", controller.obterCargo);
router.post("/api", controller.criarCargo);
router.put("/api/:id", controller.atualizarCargo);
router.delete("/api/:id", controller.deletarCargo);

module.exports = router;
