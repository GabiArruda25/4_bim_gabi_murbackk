const db = require('../database');
const path = require('path');

// Rota para abrir a página de relatórios
exports.abrirPaginaRelatorios = (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/relatorio/relatorio.html'));
};

// Relatório de Vendas por Mês
exports.vendasPorMes = async (req, res) => {
    try {
        const query = `
            SELECT
                TO_CHAR(p.data_pedido, 'YYYY-MM') AS mes_ano,
                SUM(pag.valor_total_pagamento) AS total_vendas
            FROM
                pedido p
            JOIN
                pagamento pag ON p.id_pedido = pag.pedido_id_pedido
            WHERE
                p.status_pedido = 'Pago'
            GROUP BY
                mes_ano
            ORDER BY
                mes_ano DESC;
        `;

        const result = await db.query(query);

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao gerar relatório de vendas por mês:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao gerar relatório.' });
    }
};

// Relatório de Produtos Mais Vendidos
exports.produtosMaisVendidos = async (req, res) => {
    try {
        const query = `
            SELECT
                prod.nome_produto,
                SUM(php.quantidade) AS total_vendido
            FROM
                pedido_has_produto php
            JOIN
                produto prod ON php.produto_id_produto = prod.id_produto
            JOIN
                pedido p ON php.pedido_id_pedido = p.id_pedido
            WHERE
                p.status_pedido = 'Pago'
            GROUP BY
                prod.nome_produto
            ORDER BY
                total_vendido DESC
            LIMIT 10;
        `;

        const result = await db.query(query);

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao gerar relatório de produtos mais vendidos:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao gerar relatório.' });
    }
};
