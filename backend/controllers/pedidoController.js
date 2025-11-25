const { query, transaction } = require('../database');
const loginController = require('./loginController');
const path = require('path');

exports.abrirCrudPedido = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/pedido/pedido.html'));
}

// Criar um novo pedido a partir do carrinho (Chamado pelo frontend)
exports.criarPedido = async (req, res) => {
    // Esta rota deve ser protegida (isAuthenticated)
    if (!req.user) {
        return res.status(401).json({ error: 'Não autenticado.' });
    }

    const cliente_cpf = req.user.cpf; // Pega o CPF do usuário logado
    const { itens } = req.body;
    
    if (!itens || itens.length === 0) {
        return res.status(400).json({ error: 'O carrinho está vazio.' });
    }

    try {
        const result = await transaction(async (client) => {
            // 1. Criar o Pedido (status 'Pendente' ou 'Carrinho' - vamos usar 'Pendente' para o checkout)
            const pedidoResult = await client.query(
                `INSERT INTO pedido (cliente_pessoa_cpf_pessoa, status_pedido, franquia_id_franquia) 
                 VALUES ($1, 'Pendente', 1) RETURNING id_pedido`, // Franquia 1 como padrão
                [cliente_cpf]
            );
            const id_pedido = pedidoResult.rows[0].id_pedido;

            // 2. Inserir os itens do pedido
            for (const item of itens) {
                await client.query(
                    `INSERT INTO pedido_has_produto (pedido_id_pedido, produto_id_produto, quantidade, preco_unitario_venda) 
                     VALUES ($1, $2, $3, $4)`,
                    [id_pedido, item.produto_id, item.quantidade, item.preco_unitario_venda]
                );
            }
            
            return { id_pedido };
        });

        res.status(201).json({ message: 'Pedido criado com sucesso', id_pedido: result.id_pedido });
    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao criar pedido.' });
    }
};

// Listar todos os pedidos (Gerente)
exports.listarPedidos = async (req, res) => {
  try {
    const result = await query(`
        SELECT 
            p.id_pedido, 
            p.data_pedido, 
            p.status_pedido, 
            pe.nome_pessoa AS nome_cliente, 
            f.nome_franquia
        FROM pedido p
        JOIN cliente c ON p.cliente_pessoa_cpf_pessoa = c.pessoa_cpf_pessoa
        JOIN pessoa pe ON c.pessoa_cpf_pessoa = pe.cpf_pessoa
        JOIN franquia f ON p.franquia_id_franquia = f.id_franquia
        ORDER BY p.id_pedido DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Obter detalhes de um pedido (Gerente e Cliente)
exports.obterPedido = async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    try {
        // 1. Obter dados principais do pedido
        const pedidoResult = await query(
            `SELECT * FROM pedido WHERE id_pedido = $1`,
            [id]
        );
        if (pedidoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }
        const pedido = pedidoResult.rows[0];

        // 2. Verificar se o usuário logado tem permissão
        if (req.user.role === 'C' && req.user.cpf !== pedido.cliente_pessoa_cpf_pessoa) {
             return res.status(403).json({ error: 'Acesso negado. Este pedido não pertence a você.' });
        }

        // 3. Obter itens do pedido
        const itensResult = await query(
            `SELECT 
                php.quantidade, 
                php.preco_unitario_venda, 
                p.nome_produto,
                p.id_produto
             FROM pedido_has_produto php
             JOIN produto p ON php.produto_id_produto = p.id_produto
             WHERE php.pedido_id_pedido = $1`,
            [id]
        );
        
        // 4. Obter dados de pagamento (se houver)
        const pagamentoResult = await query(
            `SELECT * FROM pagamento WHERE pedido_id_pedido = $1`,
            [id]
        );

        res.json({
            ...pedido,
            itens: itensResult.rows,
            pagamento: pagamentoResult.rows[0] || null
        });

    } catch (error) {
        console.error('Erro ao obter pedido:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Atualizar pedido (Gerente)
exports.atualizarPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const { status_pedido, franquia_id_franquia } = req.body;

    // Verifica se o pedido existe
    const existing = await query('SELECT * FROM pedido WHERE id_pedido = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    // Atualiza o pedido
    const sql = `
      UPDATE pedido
      SET status_pedido = $1,
          franquia_id_franquia = $2
      WHERE id_pedido = $3
      RETURNING *
    `;
    const values = [status_pedido, franquia_id_franquia, id];

    const updateResult = await query(sql, values);
    return res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar pedido (Gerente)
exports.deletarPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const result = await query(
      'DELETE FROM pedido WHERE id_pedido = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Rota para o cliente listar seus próprios pedidos
exports.meusPedidos = async (req, res) => {
    // Esta rota deve ser protegida (isAuthenticated)
    if (!req.user) {
        return res.status(401).json({ error: 'Não autenticado.' });
    }
    
    const cliente_cpf = req.user.cpf;
    
    try {
        const result = await query(`
            SELECT 
                p.id_pedido, 
                p.data_pedido, 
                p.status_pedido, 
                f.nome_franquia
            FROM pedido p
            JOIN franquia f ON p.franquia_id_franquia = f.id_franquia
            WHERE p.cliente_pessoa_cpf_pessoa = $1
            ORDER BY p.data_pedido DESC
        `, [cliente_cpf]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar meus pedidos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
