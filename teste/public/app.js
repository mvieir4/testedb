const formulario = document.getElementById("form-carro");
const lista = document.getElementById("lista-carros");
const mensagem = document.getElementById("mensagem");
const campos = [
  "placa", "chassi", "marca", "modelo", "ano",
  "cor", "combustivel", "capacidade", "motor", "velocidade"
];

function mostrarMensagem(texto, tipo = "sucesso") {
  mensagem.textContent = texto;
  mensagem.className = tipo;
}

function obterDadosFormulario() {
  const dados = {};
  campos.forEach(campo => {
    dados[campo] = document.getElementById(campo).value.trim();
  });
  return dados;
}

function limparFormulario() {
  formulario.reset();
  document.getElementById("carro-id").value = "";
  document.getElementById("titulo-formulario").textContent = "Cadastrar carro";
  document.getElementById("botao-salvar").textContent = "Cadastrar carro";
  document.getElementById("botao-cancelar").hidden = true;
}

async function requisicao(url, opcoes = {}) {
  const resposta = await fetch(url, {
    ...opcoes,
    headers: { "Content-Type": "application/json", ...(opcoes.headers || {}) }
  });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || "Ocorreu um erro.");
  return dados;
}

// READ: busca e mostra todos os carros cadastrados.
async function carregarCarros() {
  try {
    const carros = await requisicao("/api/carros");
    lista.replaceChildren();

    if (carros.length === 0) {
      const linha = document.createElement("tr");
      const celula = document.createElement("td");
      celula.colSpan = 6;
      celula.textContent = "Nenhum carro cadastrado.";
      linha.appendChild(celula);
      lista.appendChild(linha);
      return;
    }

    carros.forEach(carro => {
      const linha = document.createElement("tr");
      const valores = [
        carro.placa,
        `${carro.marca} / ${carro.modelo}`,
        carro.ano,
        carro.cor,
        carro.combustivel
      ];

      valores.forEach(valor => {
        const celula = document.createElement("td");
        celula.textContent = valor;
        linha.appendChild(celula);
      });

      const celulaAcoes = document.createElement("td");
      const grupo = document.createElement("div");
      grupo.className = "acoes-tabela";

      const editar = document.createElement("button");
      editar.textContent = "Editar";
      editar.className = "secundario";
      editar.addEventListener("click", () => prepararEdicao(carro));

      const excluir = document.createElement("button");
      excluir.textContent = "Excluir";
      excluir.className = "excluir";
      excluir.addEventListener("click", () => excluirCarro(carro.id));

      grupo.append(editar, excluir);
      celulaAcoes.appendChild(grupo);
      linha.appendChild(celulaAcoes);
      lista.appendChild(linha);
    });
  } catch (erro) {
    mostrarMensagem(erro.message, "erro");
  }
}

// CREATE e UPDATE: o ID vazio cadastra; com ID, atualiza.
formulario.addEventListener("submit", async evento => {
  evento.preventDefault();

  const id = document.getElementById("carro-id").value;
  const dados = obterDadosFormulario();

  try {
    if (id) {
      await requisicao(`/api/carros/${id}`, {
        method: "PUT",
        body: JSON.stringify(dados)
      });
      mostrarMensagem("Carro atualizado com sucesso!");
    } else {
      await requisicao("/api/carros", {
        method: "POST",
        body: JSON.stringify(dados)
      });
      mostrarMensagem("Carro cadastrado com sucesso!");
    }

    limparFormulario();
    carregarCarros();
  } catch (erro) {
    mostrarMensagem(erro.message, "erro");
  }
});

// Preenche o formulário para permitir a edição.
function prepararEdicao(carro) {
  document.getElementById("carro-id").value = carro.id;
  campos.forEach(campo => {
    document.getElementById(campo).value = carro[campo];
  });
  document.getElementById("titulo-formulario").textContent = "Editar carro";
  document.getElementById("botao-salvar").textContent = "Salvar alterações";
  document.getElementById("botao-cancelar").hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// DELETE: pede confirmação antes de excluir.
async function excluirCarro(id) {
  if (!confirm("Tem certeza de que deseja excluir este carro?")) return;

  try {
    await requisicao(`/api/carros/${id}`, { method: "DELETE" });
    mostrarMensagem("Carro excluído com sucesso!");
    carregarCarros();
  } catch (erro) {
    mostrarMensagem(erro.message, "erro");
  }
}

document.getElementById("botao-cancelar").addEventListener("click", limparFormulario);
document.getElementById("botao-atualizar").addEventListener("click", carregarCarros);

carregarCarros();
