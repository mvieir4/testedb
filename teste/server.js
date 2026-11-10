const http = require("http");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

const conexao = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "", // coloque aqui a senha do MySQL, se houver
  database: "sistema_carros",
  waitForConnections: true,
  connectionLimit: 10
});

// Classe exigida pela atividade: representa um carro.
class Carro {
  constructor(dados) {
    this.placa = dados.placa;
    this.chassi = dados.chassi;
    this.marca = dados.marca;
    this.modelo = dados.modelo;
    this.ano = Number(dados.ano);
    this.cor = dados.cor;
    this.combustivel = dados.combustivel;
    this.capacidade = dados.capacidade;
    this.motor = dados.motor;
    this.velocidade = Number(dados.velocidade);
  }

  validar() {
    const campos = [
      "placa", "chassi", "marca", "modelo", "ano",
      "cor", "combustivel", "capacidade", "motor", "velocidade"
    ];

    for (const campo of campos) {
      if (this[campo] === undefined || this[campo] === null ||
          String(this[campo]).trim() === "") {
        throw new Error(`O campo ${campo} é obrigatório.`);
      }
    }

    if (!Number.isInteger(this.ano) || this.ano < 1886 || this.ano > 2100) {
      throw new Error("Informe um ano válido.");
    }

    if (!Number.isInteger(this.velocidade) || this.velocidade < 0) {
      throw new Error("A velocidade deve ser um número inteiro igual ou maior que zero.");
    }
  }
}

function responder(res, status, dados) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(dados));
}

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    let corpo = "";
    req.on("data", parte => {
      corpo += parte;
      if (corpo.length > 1_000_000) {
        reject(new Error("Requisição muito grande."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(corpo || "{}"));
      } catch {
        reject(new Error("JSON inválido."));
      }
    });
    req.on("error", reject);
  });
}

async function lidarComApi(req, res, url) {
  try {
    // READ: consultar todos os carros ou um carro pelo ID.
    if (req.method === "GET" && url.pathname === "/api/carros") {
      const [carros] = await conexao.query("SELECT * FROM carros ORDER BY id DESC");
      return responder(res, 200, carros);
    }

    const rotaCarro = url.pathname.match(/^\/api\/carros\/(\d+)$/);

    if (req.method === "GET" && rotaCarro) {
      const [resultado] = await conexao.execute(
        "SELECT * FROM carros WHERE id = ?", [rotaCarro[1]]
      );
      if (!resultado.length) return responder(res, 404, { erro: "Carro não encontrado." });
      return responder(res, 200, resultado[0]);
    }

    // CREATE: cadastrar um novo carro.
    if (req.method === "POST" && url.pathname === "/api/carros") {
      const carro = new Carro(await lerCorpo(req));
      carro.validar();

      const sql = `INSERT INTO carros
        (placa, chassi, marca, modelo, ano, cor, combustivel, capacidade, motor, velocidade)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const valores = [
        carro.placa, carro.chassi, carro.marca, carro.modelo, carro.ano,
        carro.cor, carro.combustivel, carro.capacidade, carro.motor, carro.velocidade
      ];

      const [resultado] = await conexao.execute(sql, valores);
      return responder(res, 201, { mensagem: "Carro cadastrado com sucesso!", id: resultado.insertId });
    }

    // UPDATE: atualizar um carro existente.
    if (req.method === "PUT" && rotaCarro) {
      const carro = new Carro(await lerCorpo(req));
      carro.validar();

      const sql = `UPDATE carros SET
        placa = ?, chassi = ?, marca = ?, modelo = ?, ano = ?, cor = ?,
        combustivel = ?, capacidade = ?, motor = ?, velocidade = ?
        WHERE id = ?`;

      const valores = [
        carro.placa, carro.chassi, carro.marca, carro.modelo, carro.ano,
        carro.cor, carro.combustivel, carro.capacidade, carro.motor,
        carro.velocidade, rotaCarro[1]
      ];

      const [resultado] = await conexao.execute(sql, valores);
      if (!resultado.affectedRows) return responder(res, 404, { erro: "Carro não encontrado." });
      return responder(res, 200, { mensagem: "Carro atualizado com sucesso!" });
    }

    // DELETE: excluir um carro.
    if (req.method === "DELETE" && rotaCarro) {
      const [resultado] = await conexao.execute(
        "DELETE FROM carros WHERE id = ?", [rotaCarro[1]]
      );
      if (!resultado.affectedRows) return responder(res, 404, { erro: "Carro não encontrado." });
      return responder(res, 200, { mensagem: "Carro excluído com sucesso!" });
    }

    return responder(res, 404, { erro: "Rota não encontrada." });
  } catch (erro) {
    const duplicado = erro.code === "ER_DUP_ENTRY";
    const status = duplicado ? 409 : (erro.message.includes("obrigatório") ||
      erro.message.includes("válido") || erro.message.includes("JSON") ? 400 : 500);
    return responder(res, status, {
      erro: duplicado ? "A placa ou o chassi já está cadastrado." : erro.message
    });
  }
}

function servirPagina(req, res, url) {
  const rota = url.pathname === "/" ? "/index.html" : url.pathname;
  const caminho = path.resolve(PUBLIC_DIR, "." + rota);

  if (!caminho.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403);
    return res.end("Acesso negado.");
  }

  fs.readFile(caminho, (erro, conteudo) => {
    if (erro) {
      res.writeHead(404);
      return res.end("Arquivo não encontrado.");
    }

    const extensao = path.extname(caminho);
    const tipos = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8"
    };
    res.writeHead(200, { "Content-Type": tipos[extensao] || "application/octet-stream" });
    res.end(conteudo);
  });
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname.startsWith("/api/")) {
    return lidarComApi(req, res, url);
  }
  servirPagina(req, res, url);
});

servidor.listen(PORT, () => {
  console.log(`Sistema disponível em http://localhost:${PORT}`);
});
