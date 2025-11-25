const express = require('express');
const app = express();
const path = require('path');

const cookieParser = require('cookie-parser');

// Importar a configuração do banco PostgreSQL
const db = require('./database'); // Ajuste o caminho conforme necessário

// Configurações do servidor - quando em produção, você deve substituir o IP e a porta pelo do seu servidor remoto
//const HOST = '192.168.1.100'; // Substitua pelo IP do seu servidor remoto
const HOST = 'localhost'; // Para desenvolvimento local
const PORT_FIXA = 3001; // Porta fixa

// Middlewares
app.use(express.json());
app.use(cookieParser());

// Middleware para permitir CORS (Cross-Origin Resource Sharing)
app.use((req, res, next) => {
  const allowedOrigins = ['http://127.0.0.1:5500','http://localhost:5500', 'http://localhost:5501', 'http://127.0.0.1:5501', 'http://localhost:3000', 'http://localhost:3001'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Middleware para adicionar a instância do banco de dados às requisições
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Middleware de tratamento de erros JSON malformado
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'JSON malformado',
      message: 'Verifique a sintaxe do JSON enviado'
    });
  }
  next(err);
});

// só mexa nessa parte
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const franquiaRoutes = require('./routes/franquiaRoutes');
app.use('/franquia', franquiaRoutes);
// Importando as rotas
const loginRoutes = require('./routes/loginRoutes');
app.use('/login', loginRoutes);

const menuRoutes = require('./routes/menuRoutes');
app.use('/menu', menuRoutes);

const imageRoutes = require('./routes/imageRoutes'); 
app.use('/', imageRoutes); // Rota /upload-image

const cargoRoutes = require('./routes/cargoRoutes');
app.use('/cargo', cargoRoutes);

const forma_pagamentoRoutes = require('./routes/forma_pagamentoRoutes');
app.use('/forma_pagamento', forma_pagamentoRoutes);

const produtoRoutes = require('./routes/produtoRoutes');
app.use('/produto', produtoRoutes);

const pedidoRoutes = require('./routes/pedidoRoutes');
app.use('/pedido', pedidoRoutes);

const pedido_has_produtoRoutes = require('./routes/pedido_has_produtoRoutes');
app.use('/pedido_has_produto', pedido_has_produtoRoutes);

const pagamentoRoutes = require('./routes/pagamentoRoutes');
app.use('/pagamento', pagamentoRoutes);

//clienteRoutes tem que vir antes de pessoaRoutes
const clienteRoutes = require('./routes/clienteRoutes');
app.use('/cliente', clienteRoutes);

//funcionarioRoutes tem que vir antes de pessoaRoutes
const funcionarioRoutes = require('./routes/funcionarioRoutes');
app.use('/funcionario', funcionarioRoutes);

const pessoaRoutes = require('./routes/pessoaRoutes');
app.use('/pessoa', pessoaRoutes);

const relatorioRoutes = require('./routes/relatorioRoutes');
app.use('/relatorio', relatorioRoutes);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// serve a pasta frontend como arquivos estáticos
const caminhoFrontend = path.join(__dirname, '../frontend');
console.log('Caminho frontend:', caminhoFrontend);
app.use(express.static(caminhoFrontend));


// >>>>>>>>>>> SERVINDO PASTA DE IMAGENS <<<<<<<<<<
const caminhoImagensProduto = path.join(__dirname, '../imagens', 'produto');
console.log('Caminho Imagens Produto:', caminhoImagensProduto);
app.use('/imagens-produtos', express.static(caminhoImagensProduto));
// >>>>>>>>>>> FIM DO AJUSTE <<<<<<<<<<

// Rota padrão
app.get('/', (req, res) => {
  res.json({
    message: 'O server está funcionando - essa é a rota raiz!',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

// Rota para testar a conexão com o banco
app.get('/health', async (req, res) => {
  try {
    const connectionTest = await db.testConnection();

    if (connectionTest) {
      res.status(200).json({
        status: 'OK',
        message: 'Servidor e banco de dados funcionando',
        database: 'PostgreSQL',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        status: 'ERROR',
        message: 'Problema na conexão com o banco de dados',
        database: 'PostgreSQL',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Erro no health check:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Erro interno do servidor',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Middleware global de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);

  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado',
    timestamp: new Date().toISOString()
  });
});

// Middleware para rotas não encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.originalUrl} não existe`,
    timestamp: new Date().toISOString()
  });
});

// Inicialização do servidor
const startServer = async () => {
  try {
    // Testar conexão com o banco antes de iniciar o servidor
    console.log('Testando conexão com PostgreSQL...');
    const connectionTest = await db.testConnection();

    if (!connectionTest) {
      console.error('❌ Falha na conexão com PostgreSQL');
      process.exit(1);
    }

    console.log('✅ PostgreSQL conectado com sucesso');

    const PORT = process.env.PORT || PORT_FIXA;

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
      console.log(`📊 Health check disponível em http://${HOST}:${PORT}/health`);
      console.log(`🗄️ Banco de dados: PostgreSQL =>`);
      // console.log(`🗄️ Banco de dados: PostgreSQL =>`+ nomeDoBancoDeDados);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
};

// Tratamento de sinais para encerramento graceful
process.on('SIGINT', async () => {
  console.log('\n🔄 Encerrando servidor...');

  try {
    await db.pool.end();
    console.log('✅ Conexões com PostgreSQL encerradas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao encerrar conexões:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 SIGTERM recebido, encerrando servidor...');

  try {
    await db.pool.end();
    console.log('✅ Conexões com PostgreSQL encerradas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao encerrar conexões:', error);
    process.exit(1);
  }
});

// Iniciar o servidor
startServer();
