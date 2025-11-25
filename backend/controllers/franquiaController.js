const db = require('../database');
const path = require('path');

// Rota para abrir o CRUD de Franquia
exports.abrirCrudFranquia = (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/franquia/franquia.html'));
};

// Listar todas as franquias
exports.listarFranquias = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM franquia ORDER BY id_franquia');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar franquias:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Obter uma franquia por ID
exports.obterFranquia = async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const result = await db.query('SELECT * FROM franquia WHERE id_franquia = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Franquia não encontrada' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao obter franquia:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Criar uma nova franquia
exports.criarFranquia = async (req, res) => {
    const { nome_franquia, endereco_franquia, telefone_franquia } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO franquia (nome_franquia, endereco_franquia, telefone_franquia) VALUES ($1, $2, $3) RETURNING *',
            [nome_franquia, endereco_franquia, telefone_franquia]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar franquia:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Atualizar uma franquia
exports.atualizarFranquia = async (req, res) => {
    const id = parseInt(req.params.id);
    const { nome_franquia, endereco_franquia, telefone_franquia } = req.body;
    try {
        const result = await db.query(
            'UPDATE franquia SET nome_franquia = $1, endereco_franquia = $2, telefone_franquia = $3 WHERE id_franquia = $4 RETURNING *',
            [nome_franquia, endereco_franquia, telefone_franquia, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Franquia não encontrada' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar franquia:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Deletar uma franquia
exports.deletarFranquia = async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const result = await db.query('DELETE FROM franquia WHERE id_franquia = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Franquia não encontrada' });
        }
        res.json({ message: 'Franquia deletada com sucesso', deletedFranquia: result.rows[0] });
    } catch (error) {
        console.error('Erro ao deletar franquia:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
