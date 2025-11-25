const db = require('../database');
const bcrypt = require('bcrypt'); // Usar bcrypt para senhas seguras

// Função auxiliar para buscar pessoa e verificar senha
async function authenticateUser(email, senha) {
    const query = `
        SELECT
            cpf_pessoa,
            nome_pessoa,
            senha_pessoa,
            tipo_usuario
        FROM
            pessoa
        WHERE
            email_pessoa = $1;
    `;
    const result = await db.query(query, [email]);
    if (result.rows.length === 0) {
        return null; // Usuário não encontrado
    }

    const user = result.rows[0];
    
    // Na implementação final, a senha deve ser verificada com bcrypt.compare
    // Por enquanto, usaremos a comparação direta (ou hash fictício)
    // const isPasswordValid = await bcrypt.compare(senha, user.senha_pessoa);
    const isPasswordValid = (senha + '_hash') === user.senha_pessoa; // Comparação fictícia para dados populados

    if (!isPasswordValid) {
        return null; // Senha inválida
    }

    return {
        cpf: user.cpf_pessoa,
        nome: user.nome_pessoa,
        role: user.tipo_usuario // 'C' (Cliente) ou 'G' (Gerente) ou 'F' (Funcionário/Vendedor)
    };
}

// Rota de Login
exports.login = async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    try {
        const user = await authenticateUser(email, senha);

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // Configuração do cookie de sessão
        res.cookie('session', JSON.stringify({
            cpf: user.cpf,
            nome: user.nome,
            role: user.role
        }), {
            httpOnly: true,
            secure: false, // Em produção, deve ser true
            maxAge: 3600000 // 1 hora
        });

        res.json({
            message: 'Login bem-sucedido',
            user: {
                nome: user.nome,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor durante o login.' });
    }
};

// Rota de Logout
exports.logout = (req, res) => {
    res.clearCookie('session');
    res.json({ message: 'Logout bem-sucedido.' });
};

// Middleware de autenticação
exports.isAuthenticated = (req, res, next) => {
    const sessionCookie = req.cookies.session;

    if (!sessionCookie) {
        return res.status(401).json({ error: 'Não autenticado. Faça o login.' });
    }

    try {
        req.user = JSON.parse(sessionCookie);
        next();
    } catch (error) {
        res.clearCookie('session');
        return res.status(401).json({ error: 'Sessão inválida. Faça o login novamente.' });
    }
};

// Middleware de autorização para Gerente
exports.isManager = (req, res, next) => {
    if (!req.user || req.user.role !== 'G') {
        return res.status(403).json({ error: 'Acesso negado. Apenas gerentes podem acessar esta rota.' });
    }
    next();
};

// Middleware de autorização para Cliente
exports.isClient = (req, res, next) => {
    if (!req.user || req.user.role !== 'C') {
        return res.status(403).json({ error: 'Acesso negado. Apenas clientes podem acessar esta rota.' });
    }
    next();
};

// Middleware de autorização para Cliente ou Gerente
exports.isClientOrManager = (req, res, next) => {
    if (!req.user || (req.user.role !== 'C' && req.user.role !== 'G')) {
        return res.status(403).json({ error: 'Acesso negado. Apenas clientes e gerentes podem acessar esta rota.' });
    }
    next();
};

// Rota para verificar se o usuário está logado e qual seu papel
exports.verificaSeUsuarioEstaLogado = (req, res) => {
    const sessionCookie = req.cookies.session;

    if (!sessionCookie) {
        return res.json({ status: 'nao_logado' });
    }

    try {
        const user = JSON.parse(sessionCookie);
        return res.json({
            status: 'ok',
            nome: user.nome,
            role: user.role,
            cpf: user.cpf
        });
    } catch (error) {
        res.clearCookie('session');
        return res.json({ status: 'nao_logado' });
    }
}
