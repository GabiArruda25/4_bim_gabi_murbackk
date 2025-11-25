// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentPersonId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('produtoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const produtosTableBody = document.getElementById('produtosTableBody');
const messageContainer = document.getElementById('messageContainer');

// >>> NOVOS ELEMENTOS DOM PARA IMAGEM <<<
const imgProdutoVisualizacao = document.getElementById('imgProdutoVisualizacao');
const imgProdutoInput = document.getElementById('imgProdutoInput');
const imgURL = document.getElementById('imgURL');
const btnCarregarImagem = document.getElementById('btnCarregarImagem');


// Carregar lista de produtos ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    // Garante que a imagem inicial seja o fallback
    imgProdutoVisualizacao.src = '/imagens-produtos/000.png';
});

// Event Listeners
btnBuscar.addEventListener('click', buscarProduto);
btnIncluir.addEventListener('click', incluirProduto);
btnAlterar.addEventListener('click', alterarProduto);
btnExcluir.addEventListener('click', excluirProduto);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

// >>> NOVO EVENT LISTENER PARA UPLOAD DA IMAGEM <<<
btnCarregarImagem.addEventListener('click', handleImageUpload);


mostrarBotoes(true, false, false, false, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
bloquearCampos(false);//libera pk e bloqueia os demais campos

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCampos(bloquearPrimeiro) {
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach((input, index) => {
        if (index === 0) {
            // Primeiro elemento - bloqueia se bloquearPrimeiro for true, libera se for false
            input.disabled = bloquearPrimeiro;
        } else {
            // Demais elementos - faz o oposto do primeiro
            input.disabled = !bloquearPrimeiro;
        }
    });
}

// Função para limpar formulário
function limparFormulario() {
    form.reset();
    // Garante que a imagem volta para o padrão quando o formulário é limpo
    imgProdutoVisualizacao.src = '/imagens-produtos/000.png';
    imgProdutoVisualizacao.alt = 'Imagem do Produto 01';
}


function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

// Função para formatar data para exibição
function formatarData(dataString) {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

// Função para converter data para formato ISO
function converterDataParaISO(dataString) {
    if (!dataString) return null;
    return new Date(dataString).toISOString();
}

// Função para buscar produto por ID
async function buscarProduto() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    bloquearCampos(false);
    //focus no campo searchId
    searchId.focus();
    try {
        const response = await fetch(`${API_BASE_URL}/produto/api/${id}`);
        console.log(JSON.stringify(response));

        if (response.ok) {
            const produto = await response.json();
            preencherFormulario(produto);

            mostrarBotoes(true, false, true, true, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
            mostrarMensagem('Produto encontrado!', 'success');

        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false); //mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
            mostrarMensagem('Produto não encontrado. Você pode incluir um novo produto.', 'info');
            bloquearCampos(false);//bloqueia a pk e libera os demais campos
            //enviar o foco para o campo de nome
        } else {
            throw new Error('Erro ao buscar produto');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar produto', 'error');
    }
}

// Função para preencher formulário com dados da produto
function preencherFormulario(produto) {
    console.log(JSON.stringify(produto));

    currentPersonId = produto.id_produto;
    searchId.value = produto.id_produto;
    document.getElementById('nome_produto').value = produto.nome_produto || '';
    document.getElementById('quantidade_estoque_produto').value = produto.quantidade_estoque_produto || 0;
    document.getElementById('preco_unitario_produto').value = produto.preco_unitario_produto || 0;

    // Lógica para carregamento dinâmico da imagem com fallback
    const imgElement = document.getElementById('imgProdutoVisualizacao');
    const produtoId = produto.id_produto;
    
    // =============================================================
    // ⭐ AJUSTE 1: Aplicar o tamanho 200x200px ao elemento IMG
    // Isso garante o tamanho de exibição, independentemente do arquivo de origem.
    // =============================================================
    if (imgElement) {
        imgElement.style.width = '200px';
        imgElement.style.height = '200px';
        // Alternativamente, você pode usar os atributos HTML:
        // imgElement.width = 200;
        // imgElement.height = 200; 
    }
    // =============================================================

    
    // Limpa qualquer erro anterior e tenta carregar a nova imagem
    imgElement.onerror = function() {
        // Se a imagem com o ID não for encontrada, carrega o fallback.
        imgElement.src = '/imagens-produtos/000.png';
        imgElement.alt = 'Imagem Padrão não encontrada';
        // Limpa o onerror para evitar loops caso o 000.png também falhe (improvável)
        imgElement.onerror = null; 
    };

    if (imgElement && produtoId) {
        // Tenta carregar a imagem dinâmica (Isso pode disparar o onerror)
        // Adiciona um timestamp para forçar o navegador a recarregar a imagem
        const imagePath = `/imagens-produtos/${produtoId}.png?t=${new Date().getTime()}`; //or jpg, e
        imgElement.src = imagePath;
        imgElement.alt = `Imagem do Produto ID ${produtoId}`;

    } else if (imgElement) {
        // Se não houver ID do produto, mostra o fallback imediatamente
        imgElement.src = '/imagens-produtos/000.png';
        imgElement.alt = 'Imagem Padrão';
        imgElement.onerror = null; 
    }
}


async function handleImageUpload() {
    const id = searchId.value.trim();
    
    // A imagem só pode ser salva/renomeada se houver um ID conhecido (Alteração ou Inclusão SALVA)
    if (!id || (operacao !== 'alterar' && operacao !== 'incluir')) {
        mostrarMensagem('Busque ou inclua o produto e esteja no modo de Alteração/Inclusão para carregar a imagem.', 'warning');
        return;
    }
    
    const file = imgProdutoInput.files[0];
    const url = imgURL.value.trim();

    if (!file && !url) {
        mostrarMensagem('Selecione um arquivo local OU cole uma URL para carregar.', 'warning');
        return;
    }

    // 1. Prepara os dados para envio
    let formData = new FormData();
    formData.append('produtoId', id); // O ID será o novo nome do arquivo

    if (file) {
        // Opção 1: Upload de arquivo local
        formData.append('imageSource', 'local');
        formData.append('imageFile', file);
    } else if (url) {
        // Opção 2: Download de URL
        formData.append('imageSource', 'url');
        formData.append('imageUrl', url);
    } else {
        return; // Caso nenhum dado válido
    }

  //  mostrarMensagem('Enviando imagem para o servidor...', 'info');

    try {
        // 2. Envia para o novo endpoint de upload no backend
        const response = await fetch(`${API_BASE_URL}/upload-image`, {
            method: 'POST',
            body: formData 
        });

        if (response.ok) {
            // 3. Sucesso: Recarrega a imagem na tela para bustar o cache
            const imagePath = `/imagens-produtos/${id}.png?t=${new Date().getTime()}`; 
            imgProdutoVisualizacao.src = imagePath;
            mostrarMensagem('Imagem carregada e salva com sucesso!', 'success');
            
            // 4. Limpa os campos após sucesso
            imgProdutoInput.value = '';
            imgURL.value = '';
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Falha ao salvar a imagem no servidor.');
        }

    } catch (error) {
        console.error('Erro no upload da imagem:', error);
        mostrarMensagem(`Erro no upload: ${error.message}`, 'error');
    }
}
// >>> FIM DA NOVA FUNÇÃO <<<


// Função para incluir produto
async function incluirProduto() {

    mostrarMensagem('Digite os dados!', 'success');
    currentPersonId = searchId.value;
    // console.log('Incluir novo produto - currentPersonId: ' + currentPersonId);
    limparFormulario();
    searchId.value = currentPersonId;
    bloquearCampos(true);

    mostrarBotoes(false, false, false, false, true, true); // mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('nome_produto').focus();
    operacao = 'incluir';
    // console.log('fim nova produto - currentPersonId: ' + currentPersonId);
}

// Função para alterar produto
async function alterarProduto() {
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    document.getElementById('nome_produto').focus();
    operacao = 'alterar';
}

// Função para excluir produto
async function excluirProduto() {
    mostrarMensagem('Excluindo produto...', 'info');
    currentPersonId = searchId.value;
    //bloquear searchId
    searchId.disabled = true;
    bloquearCampos(false); // libera os demais campos
    mostrarBotoes(false, false, false, false, true, true);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)           
    operacao = 'excluir';
}

async function salvarOperacao() {
    console.log('Operação:', operacao + ' - currentPersonId: ' + currentPersonId + ' - searchId: ' + searchId.value);

    const formData = new FormData(form);
    const produto = {
        id_produto: searchId.value,
        nome_produto: formData.get('nome_produto'),
        quantidade_estoque_produto_produto: formData.get('quantidade_estoque_produto'),
        preco_unitario_produto: formData.get('preco_unitario_produto'),
    };
    let response = null;
    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/produto/api`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(produto)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/produto/api/${currentPersonId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(produto)
            });
        } else if (operacao === 'excluir') {
            // console.log('Excluindo produto com ID:', currentPersonId);
            response = await fetch(`${API_BASE_URL}/produto/api/${currentPersonId}`, {
                method: 'DELETE'
            });
            console.log('Produto excluído' + response.status);
        }
        if (response.ok && (operacao === 'incluir' || operacao === 'alterar')) {
            const novaProduto = await response.json();
            mostrarMensagem('Operação ' + operacao + ' realizada com sucesso!', 'success');
            limparFormulario();
            carregarProdutos();

        } else if (operacao !== 'excluir') {
            const error = await response.json();
            mostrarMensagem(error.error || 'Erro ao incluir produto', 'error');
        } else {
            mostrarMensagem('Produto excluído com sucesso!', 'success');
            limparFormulario();
            carregarProdutos();
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao incluir ou alterar a produto', 'error');
    }

    mostrarBotoes(true, false, false, false, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    bloquearCampos(false);//libera pk e bloqueia os demais campos
    document.getElementById('searchId').focus();
}

// Função para cancelar operação
function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);// mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
    bloquearCampos(false);//libera pk e bloqueia os demais campos
    document.getElementById('searchId').focus();
    mostrarMensagem('Operação cancelada', 'info');
}

// Função para carregar lista de produtos
async function carregarProdutos() {
    try {
        const rota = `${API_BASE_URL}/produto/api`;
       // console.log("a rota " + rota);

       
        const response = await fetch(rota);
     //   console.log(JSON.stringify(response));


        //    debugger
        if (response.ok) {
            const produtos = await response.json();
            renderizarTabelaProdutos(produtos);
        } else {
            throw new Error('Erro ao carregar produtos');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de produtos', 'error');
    }
}

// Função para renderizar tabela de produtos
function renderizarTabelaProdutos(produtos) {
    produtosTableBody.innerHTML = '';

    produtos.forEach(produto => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>
                        <button class="btn-id" onclick="selecionarProduto(${produto.id_produto})">
                            ${produto.id_produto}
                        </button>
                    </td>
                    <td>${produto.nome_produto}</td>                  
                    <td>${produto.quantidade_estoque_produto}</td>                  
                    <td>${produto.preco_unitario_produto}</td>                  
                                 
                `;
        produtosTableBody.appendChild(row);
    });
}

// Função para selecionar produto da tabela
async function selecionarProduto(id) {
    searchId.value = id;
    await buscarProduto();
}
