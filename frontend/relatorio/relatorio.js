document.addEventListener('DOMContentLoaded', () => {
    loadVendasPorMes();
    loadProdutosMaisVendidos();
});

async function loadVendasPorMes() {
    try {
        const response = await fetch('/relatorio/vendas-por-mes');
        if (!response.ok) {
            throw new Error('Erro ao carregar relatório de vendas por mês.');
        }
        const vendas = await response.json();
        const tableBody = document.querySelector('#vendas-por-mes-table tbody');
        tableBody.innerHTML = '';

        if (vendas.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="2">Nenhum dado de venda encontrado.</td></tr>';
            return;
        }

        vendas.forEach(venda => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = formatMonthYear(venda.mes_ano);
            row.insertCell().textContent = `R$ ${parseFloat(venda.total_vendas).toFixed(2)}`;
        });
    } catch (error) {
        console.error('Erro:', error);
        alert(error.message);
    }
}

async function loadProdutosMaisVendidos() {
    try {
        const response = await fetch('/relatorio/produtos-mais-vendidos');
        if (!response.ok) {
            throw new Error('Erro ao carregar relatório de produtos mais vendidos.');
        }
        const produtos = await response.json();
        const tableBody = document.querySelector('#produtos-mais-vendidos-table tbody');
        tableBody.innerHTML = '';

        if (produtos.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="2">Nenhum dado de produto vendido encontrado.</td></tr>';
            return;
        }

        produtos.forEach(produto => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = produto.nome_produto;
            row.insertCell().textContent = produto.total_vendido;
        });
    } catch (error) {
        console.error('Erro:', error);
        alert(error.message);
    }
}

function formatMonthYear(mesAno) {
    const [ano, mes] = mesAno.split('-');
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${meses[parseInt(mes) - 1]} de ${ano}`;
}
