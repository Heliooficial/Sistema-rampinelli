// ==========================================================================
// CONFIGURAÇÃO DA API: INSIRA AQUI A URL QUE VOCÊ COPIOU DO GOOGLE APPS SCRIPT
// ==========================================================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxdGlBpCmI5hMGf679IBVzXflN3mI9Khx0fX7COsmojPxrj7vtfUFa9ccofCO7GzzzOyw/exec";

let bancoClientes = [];
let bancoMotoristas = [];
let clienteNovo = false;
let motoristaNovo = false;

// ==========================================================================
// 1. CARREGA OS DADOS DA PLANILHA ASSIM QUE ABRE A TELA (CORRIGIDO PARA CORS)
// ==========================================================================
window.addEventListener('DOMContentLoaded', () => {
    fetch(`${WEB_APP_URL}?action=dadosIniciais`, {
        method: 'GET',
        mode: 'cors',
        redirect: 'follow',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8'
        }
    })
    .then(resposta => {
        if (!resposta.ok) throw new Error('Erro na resposta do servidor Google.');
        return resposta.json();
    })
    .then(dados => {
        bancoClientes = dados.clientes || [];
        bancoMotoristas = dados.motoristas || [];
        
        // Preenche o campo do próximo número do termo vindo da planilha automaticamente
        const campoTermo = document.getElementById('num_termo');
        if (campoTermo) {
            campoTermo.value = dados.proximoTermo;
            campoTermo.placeholder = ""; 
        }
        console.log("Dados da Rampinelli carregados com sucesso!");
    })
    .catch(erro => {
        console.error("Erro ao conectar com a planilha:", erro);
        alert("Não foi possível carregar os dados da planilha de clientes/termos automáticamente. Verifique a URL do Apps Script.");
    });
});

// ==========================================================================
// 2. BUSCA AUTOMÁTICA DE CLIENTE PELO CNPJ/CPF
// ==========================================================================
function buscarCliente() {
    const cnpjDigitado = document.getElementById('cliente_cnpj').value.trim();
    if (!cnpjDigitado) return;

    // Procura na tabela ignorando letras maiúsculas/minúsculas
    const encontrado = bancoClientes.find(linha => linha[0].toString().trim() === cnpjDigitado);

    if (encontrado) {
        document.getElementById('cliente').value = encontrado[1];
        document.getElementById('cidade').value = encontrado[2];
        clienteNovo = false;
        console.log("Cliente encontrado no banco.");
    } else {
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

    const encontrado = bancoMotoristas.find(linha => linha[0].toString().trim() === cpfDigitado);

    if (encontrado) {
        document.getElementById('motorista').value = encontrado[1];
        motoristaNovo = false;
        console.log("Motorista encontrado no banco.");
    } else {
        motoristaNovo = true;
        console.log("Motorista novo detectado. Será salvo ao imprimir.");
    }
}

// ==========================================================================
// 4. ENVIA OS DADOS PARA A PLANILHA E DISPARA A IMPRESSÃO
// ==========================================================================
document.getElementById('btnPrint').addEventListener('click', async function() {
    // Coleta todos os valores da tela garantindo os IDs exatos do HTML
    const numTermo = document.getElementById('num_termo').value;
    const ordem = document.getElementById('ordem').value.trim();
    const cnpj = document.getElementById('cliente_cnpj').value.trim();
    const cliente = document.getElementById('cliente').value.trim();
    const cidade = document.getElementById('cidade').value.trim();
    const qtd_pallets = document.getElementById('qtd_pallets').value;
    const qtd_chapas = document.getElementById('qtd_chapas').value;
    const motorista = document.getElementById('motorista').value.trim();
    const cpf = document.getElementById('cpf').value.trim();

    // Mostra no F12 o que o JavaScript está enxergando para ajudar no diagnóstico
    console.log("Valores coletados para envio:", { numTermo, ordem, cliente, cidade, qtd_pallets, qtd_chapas, motorista, cpf });

    // Validação obrigatória de todos os campos essenciais (CNPJ opcional para o termo não travar se não tiver)
    if(!numTermo || !ordem || !cliente || !cidade || !qtd_pallets || !qtd_chapas || !motorista || !cpf) {
        alert("Por favor, preencha todos os campos obrigatórios do formulário antes de gerar o PDF.");
        return;
    }

    // Se o usuário digitou o nome do cliente mas deixou o CNPJ em branco, define um padrão
    const cnpjFinal = cnpj || "Não Informado";

    // Prepara o pacote de dados para salvar na planilha
    const dadosParaSalvar = {
        action: "salvarEAtualizar",
        novoNumeroTermo: Number(numTermo) + 1, 
        novoCliente: clienteNovo,
        clienteCnpj: cnpjFinal,
        clienteNome: cliente,
        clienteCidade: cidade,
        novoMotorista: motoristaNovo,
        motoristaCpf: cpf,
        motoristaNome: motorista
    };

    try {
        // Envia as atualizações para o Google Sheets via POST
        fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosParaSalvar)
        });

        const dataAtual = new Date().toLocaleDateString('pt-BR');

        // Função molde com os dados da Rampinelli
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

        // Insere as duas vias na tela oculta de impressão
        const printArea = document.getElementById('print-area');
        printArea.innerHTML = `
            <div class="recibo-via primeira-via">${gerarLayoutDocumento('1ª Via - Empresa')}</div>
            <div class="recibo-via segunda-via">${gerarLayoutDocumento('2ª Via - Motorista')}</div>
        `;

        // Dispara a janela de impressão e recarrega a página
        setTimeout(function() {
            window.print();
            window.location.reload();
        }, 300);

    } catch (erro) {
        console.error("Erro no processo de salvamento:", erro);
        alert("Erro ao salvar os dados na planilha. A impressão continuará, mas verifique os dados salvos.");
    }
});