// ==========================================================================
// CONFIGURAÇÃO DA API: INSIRA AQUI A URL QUE VOCÊ COPIOU DO GOOGLE APPS SCRIPT
// ==========================================================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxdGlBpCmI5hMGf679IBVzXflN3mI9Khx0fX7COsmojPxrj7vtfUFa9ccofCO7GzzzOyw/exec";

let bancoClientes = [];
let bancoMotoristas = [];
let clienteNovo = false;
let motoristaNovo = false;

// ==========================================================================
// 1. CARREGA OS DADOS DA PLANILHA ASSIM QUE ABRE A TELA
// ==========================================================================
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const resposta = await fetch(`${WEB_APP_URL}?action=dadosIniciais`);
        const dados = await resposta.json();
        
        bancoClientes = dados.clientes;
        bancoMotoristas = dados.motoristas;
        
        // Preenche o campo do próximo número do termo vindo da planilha automaticamente
        document.getElementById('num_termo').value = dados.proximoTermo;
    } catch (erro) {
        console.error("Erro ao conectar com a planilha:", erro);
        alert("Não foi possível carregar os dados da planilha de clientes/termos.");
    }
});

// ==========================================================================
// 2. BUSCA AUTOMÁTICA DE CLIENTE PELO CNPJ/CPF
// ==========================================================================
function buscarCliente() {
    const cnpjDigitado = document.getElementById('cliente_cnpj').value.trim();
    if (!cnpjDigitado) return;

    // Procura na tabela (ignorando a primeira linha de cabeçalho)
    const encontrado = bancoClientes.find(linha => linha[0].toString() == cnpjDigitado);

    if (encontrado) {
        document.getElementById('cliente').value = encontrado[1];
        document.getElementById('cidade').value = encontrado[2];
        clienteNovo = false;
    } else {
        // Se não achar, deixa o usuário digitar para cadastrar um novo
        clienteNovo = true;
        console.log("Cliente novo detectado. Será salvo ao imprimir.");
    }
}

// ==========================================================================
// 3. BUSCA AUTOMÁTICA DE MOTORISTA PELO CPF
// ==========================================================================
function buscarMotorista() {
    const cpfDigitado = document.getElementById('cpf').value.trim();
    if (!cpfDigitado) return;

    const encontrado = bancoMotoristas.find(linha => linha[0].toString() == cpfDigitado);

    if (encontrado) {
        document.getElementById('motorista').value = encontrado[1];
        motoristaNovo = false;
    } else {
        motoristaNovo = true;
        console.log("Motorista novo detectado. Será salvo ao imprimir.");
    }
}

// ==========================================================================
// 4. ENVIA OS DADOS PARA A PLANILHA E DISPARA A IMPRESSÃO
// ==========================================================================
document.getElementById('btnPrint').addEventListener('click', async function() {
    // Coleta todos os valores da tela (incluindo os novos campos)
    const numTermo = document.getElementById('num_termo').value;
    const ordem = document.getElementById('ordem').value.trim();
    const cnpj = document.getElementById('cliente_cnpj').value.trim();
    const cliente = document.getElementById('cliente').value.trim();
    const cidade = document.getElementById('cidade').value.trim();
    const qtd_pallets = document.getElementById('qtd_pallets').value;
    const qtd_chapas = document.getElementById('qtd_chapas').value;
    const motorista = document.getElementById('motorista').value.trim();
    const cpf = document.getElementById('cpf').value.trim();

    // Validação obrigatória de todos os campos
    if(!numTermo || !ordem || !cliente || !cidade || !qtd_pallets || !qtd_chapas || !motorista || !cpf) {
        alert("Por favor, preencha todos os campos do formulário antes de gerar o PDF.");
        return;
    }

    // Prepara o pacote de dados para salvar na planilha em segundo plano
    const dadosParaSalvar = {
        action: "salvarEAtualizar",
        novoNumeroTermo: Number(numTermo) + 1, // Soma +1 para o próximo termo da planilha
        novoCliente: clienteNovo,
        clienteCnpj: cnpj,
        clienteNome: cliente,
        clienteCidade: cidade,
        novoMotorista: motoristaNovo,
        motoristaCpf: cpf,
        motoristaNome: motorista
    };

    try {
        // Envia as atualizações para o Google Sheets via Apps Script
        fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosParaSalvar)
        });

        const dataAtual = new Date().toLocaleDateString('pt-BR');

        // Função molde com os seus dados originais da Rampinelli Caruaru + Número do Termo
        function gerarLayoutDocumento(nomeVia) {
            return `
                <div class="recibo-header">
                    <img src="img/logo-rampinelli.png" alt="Logo" class="recibo-logo">
                    <div class="empresa-dados">
                        <strong>Rampinelli Alimentos LTDA</strong><br>
                        CNPJ: 79.416.541/0005-89 | Tel: (81) 3721-5754<br>
                        faturacaruaru@rampinelli.com.br<br>
                        Termo de Controle nº: <strong>${numTermo}</strong>
                    </div>
                </div>
                <div class="recibo-title">TERMO DE RESPONSABILIDADE DE PALLETS E CHAPAS</div>
                <div class="recibo-body">
                    Declaramos para os devidos fins que o motorista <strong>${motorista}</strong>, portador do CPF <strong>${cpf}</strong>, 
                    vinculado à ordem de carregamento nº <strong>${ordem}</strong>, confere e assume a responsabilidade pelo transporte e devolução de 
                    <strong>${qtd_pallets}</strong> pallet(s) e <strong>${qtd_chapas}</strong> chapa(s) destinados ao cliente <strong>${cliente}</strong> na cidade de <strong>${cidade}</strong>. 
                    Os materiais descritos deverão retornar à empresa em perfeito estado de conservação.
                </div>
                <div>
                    <p style="font-size: 11px; margin-bottom: 5px;">Data de Emissão: ${dataAtual}</p>
                    <div class="recibo-footer-assinaturas">
                        <div class="campo-assinatura">Assinatura do Motorista</div>
                        <div class="campo-assinatura">Responsável Rampinelli</div>
                    </div>
                    <div class="via-tag">${nomeVia}</div>
                </div>
            `;
        }

        // Insere as duas vias idênticas na tela oculta de impressão
        const printArea = document.getElementById('print-area');
        printArea.innerHTML = `
            <div class="recibo-via primeira-via">${gerarLayoutDocumento('1ª Via - Empresa')}</div>
            <div class="recibo-via segunda-via">${gerarLayoutDocumento('2ª Via - Motorista')}</div>
        `;

        // Dispara a janela de impressão e logo após recarrega para atualizar o número na tela
        setTimeout(function() {
            window.print();
            window.location.reload();
        }, 300);

    } catch (erro) {
        alert("Erro ao salvar os dados na planilha. A impressão continuará, mas verifique os dados salvos.");
    }
});