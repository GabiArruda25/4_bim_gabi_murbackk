const { query, transaction } = require('../database');

// Finalizar o pagamento de um pedido
exports.finalizarPagamento = async (req, res) => {
    // Esta rota deve ser protegida (isAuthenticated)
    if (!req.user) {
        return res.status(401).json({ error: 'Não autenticado.' });
    }

    const { pedido_id, forma_pagamento } = req.body;

    if (!pedido_id || !forma_pagamento) {
        return res.status(400).json({ error: 'ID do pedido e forma de pagamento são obrigatórios.' });
    }
    
    try {
        const result = await transaction(async (client) => {
            // 1. Verificar se o pedido existe e pertence ao usuário (se não for gerente)
            const pedidoResult = await client.query(
                `SELECT 
                    p.status_pedido, 
                    p.cliente_pessoa_cpf_pessoa,
                    SUM(php.quantidade * php.preco_unitario_venda) AS valor_total
                 FROM pedido p
                 JOIN pedido_has_produto php ON p.id_pedido = php.pedido_id_pedido
                 WHERE p.id_pedido = $1
                 GROUP BY p.id_pedido`,
                [pedido_id]
            );

            if (pedidoResult.rows.length === 0) {
                throw new Error('Pedido não encontrado.');
            }
            
            const pedido = pedidoResult.rows[0];
            const valor_total = parseFloat(pedido.valor_total);

            if (req.user.role !== 'G' && req.user.cpf !== pedido.cliente_pessoa_cpf_pessoa) {
                throw new Error('Acesso negado. Este pedido não pertence a você.');
            }
            
            if (pedido.status_pedido === 'Pago') {
                throw new Error('Este pedido já foi pago.');
            }
            
            // 2. Inserir o registro de pagamento
            const pagamentoResult = await client.query(
                `INSERT INTO pagamento (pedido_id_pedido, valor_total_pagamento, forma_pagamento) 
                 VALUES ($1, $2, $3) RETURNING *`,
                [pedido_id, valor_total, forma_pagamento]
            );

            // 3. Atualizar o status do pedido para 'Pago'
            await client.query(
                `UPDATE pedido SET status_pedido = 'Pago' WHERE id_pedido = $1`,
                [pedido_id]
            );
            
            return pagamentoResult.rows[0];
        });

        res.status(201).json({ message: 'Pagamento realizado com sucesso', pagamento: result });
    } catch (error) {
        console.error('Erro ao finalizar pagamento:', error);
        res.status(500).json({ error: error.message || 'Erro interno do servidor ao finalizar pagamento.' });
    }
};

// Obter detalhes do pagamento (Gerente)
exports.obterPagamento = async (req, res) => {
    const pedido_id = parseInt(req.params.id);
    try {
        const result = await query('SELECT * FROM pagamento WHERE pedido_id_pedido = $1', [pedido_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pagamento não encontrado para este pedido' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao obter pagamento:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
