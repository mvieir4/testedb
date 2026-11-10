# Grupo 2 — Sistema de Cadastro de Carros

Sistema CRUD feito em JavaScript puro no navegador e Node.js no servidor, sem frameworks. O banco de dados utilizado é MySQL.

## Requisitos

- Node.js instalado
- MySQL instalado e em execução

## 1. Criar o banco

Abra o MySQL Workbench ou outro cliente MySQL e execute todo o conteúdo do arquivo `database.sql`.

## 2. Configurar a conexão

Abra `server.js` e ajuste estes campos conforme sua instalação do MySQL:

```js
host: "localhost",
user: "root",
password: "",
database: "sistema_carros"
```

## 3. Instalar a dependência

No terminal, dentro da pasta do projeto, execute:

```bash
npm install
```

## 4. Iniciar o sistema

```bash
npm start
```

Acesse no navegador:

http://localhost:3000

## Funcionalidades

- **Create:** cadastrar carros.
- **Read:** listar os carros cadastrados.
- **Update:** editar os dados de um carro.
- **Delete:** excluir um carro.

## Classe Carro

A classe `Carro`, no arquivo `server.js`, representa um veículo e contém os atributos placa, chassi, marca, modelo, ano, cor, combustível, capacidade, motor e velocidade. O método `validar()` verifica os campos antes de salvar ou atualizar.

## Arquivos

- `database.sql`: criação do banco e da tabela.
- `server.js`: classe Carro, conexão MySQL e rotas da API.
- `public/index.html`: estrutura da página.
- `public/style.css`: aparência da página.
- `public/app.js`: comunicação com a API e operações CRUD.
