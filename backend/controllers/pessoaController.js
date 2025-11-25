const db = require('../database');
const bcrypt = require('bcrypt');

// Listar todas as pessoas
exports.listarPessoas = async (req, res) => {
    try {
        const result = await db.query('SELECT cpf_pessoa, nome_pessoa, data_nascimento_pessoa, endereco_pessoa, email_pessoa, tipo_usuario FROM pessoa ORDER BY nome_pessoa');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar pessoas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Obter uma pessoa por CPF
exports.obterPessoa = async (req, res) => {
    const cpf = req.params.cpf;
    try {
        const result = await db.query('SELECT cpf_pessoa, nome_pessoa, data_nascimento_pessoa, endereco_pessoa, email_pessoa, tipo_usuario FROM pessoa WHERE cpf_pessoa = $1', [cpf]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pessoa não encontrada' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao obter pessoa:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Criar uma nova pessoa (ex: cadastro de cliente ou funcionário)
exports.criarPessoa = async (req, res) => {
    const { cpf_pessoa, nome_pessoa, data_nascimento_pessoa, endereco_pessoa, senha_pessoa, email_pessoa, tipo_usuario } = req.body;
    
    // Em um app real, a senha seria "hasheada" aqui com bcrypt
    // const salt = await bcrypt.genSalt(10);
    // const senhaHash = await bcrypt.hash(senha_pessoa, salt);
    const senhaHash = senha_pessoa + '_hash'; // Usando o hash fictício

    try {
        const result = await db.query(
            'INSERT INTO pessoa (cpf_pessoa, nome_pessoa, data_nascimento_pessoa, endereco_pessoa, senha_pessoa, email_pessoa, tipo_usuario) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING cpf_pessoa, nome_pessoa, email_pessoa, tipo_usuario',
            [cpf_pessoa, nome_pessoa, data_nascimento_pessoa, endereco_pessoa, senhaHash, email_pessoa, tipo_usuario]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar pessoa:', error);
        if (error.code === '23505') { // Código de violação de constraint unique
            return res.status(400).json({ error: 'CPF ou Email já cadastrado.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Atualizar uma pessoa
exports.atualizarPessoa = async (req, res) => {
    const cpf = req.params.cpf;
    const { nome_pessoa, data_nascimento_pessoa, endereco_pessoa, email_pessoa, tipo_usuario } = req.body;
    try {
        const result = await db.query(
            'UPDATE pessoa SET nome_pessoa = $1, data_nascimento_pessoa = $2, endereco_pessoa = $3, email_pessoa = $4, tipo_usuario = $5 WHERE cpf_pessoa = $6 RETURNING cpf_pessoa, nome_pessoa, email_pessoa, tipo_usuario',
            [nome_pessoa, data_nascimento_pessoa, endereco_pessoa, email_pessoa, tipo_usuario, cpf]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pessoa não encontrada' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar pessoa:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Deletar uma pessoa
exports.deletarPessoa = async (req, res) => {
    const cpf = req.params.cpf;
    try {
        const result = await db.query('DELETE FROM pessoa WHERE cpf_pessoa = $1 RETURNING *', [cpf]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pessoa não encontrada' });
        }
        res.json({ message: 'Pessoa deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar pessoa:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Rota para abrir o CRUD de Pessoa (mantida para a estrutura do frontend)
exports.abrirCrudPessoa = (req, res) => {
    const path = require('path');
    res.sendFile(path.join(__dirname, '../../frontend/pessoa/pessoa.html'));
};
