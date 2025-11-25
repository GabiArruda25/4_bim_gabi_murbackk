const { query } = require('../database');
const path = require('path');

exports.abrirCrudCargo = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/cargo/cargo.html'));
}

exports.listarCargos = async (req, res) => {
  try {
    const result = await query('SELECT * FROM cargo ORDER BY id_cargo');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar cargos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}


exports.criarCargo = async (req, res) => {
  try {
    const { nome_cargo} = req.body;

    if (!nome_cargo) {
      return res.status(400).json({
        error: 'O nome do cargo é obrigatório'
      });
    }

    const result = await query(
      'INSERT INTO cargo (nome_cargo) VALUES ($1) RETURNING *',
      [nome_cargo]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar cargo:', error);

    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.obterCargo = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM cargo WHERE id_cargo = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cargo não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter cargo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.atualizarCargo = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nome_cargo} = req.body;

    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    // Verifica se o cargo existe
    const existingResult = await query(
      'SELECT * FROM cargo WHERE id_cargo = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cargo não encontrado' });
    }

    // Atualiza o cargo
    const updateResult = await query(
      'UPDATE cargo SET nome_cargo = $1 WHERE id_cargo = $2 RETURNING *',
      [nome_cargo,  id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar cargo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

exports.deletarCargo = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Deleta o cargo (as constraints CASCADE cuidarão das dependências)
    const result = await query(
      'DELETE FROM cargo WHERE id_cargo = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cargo não encontrado' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar cargo:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar cargo com funcionários associados'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
