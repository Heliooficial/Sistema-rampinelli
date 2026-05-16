// ==========================================================================
// CONFIGURAÇÃO DA API: URL DO SEU GOOGLE APPS SCRIPT
// ==========================================================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxdGlBpCmI5hMGf679IBVzXflN3mI9Khx0fX7COsmojPxrj7vtfUFa9ccofCO7GzzzOyw/exec";

let bancoClientes = [];
let bancoMotoristas = [];
let clienteNovo = false;
let motoristaNovo = false;

// ==========================================================================
// 1. CARREGA OS DADOS DA PLANILHA VIA JSONP (BULA O BLOQUEIO DE CORS)
// ==========================================================================

// Função global que o Google vai chamar de volta entregando os dados
window.processarDadosIniciais = function(dados) {
    if (dados) {
        bancoClientes = dados.clientes || [];
        bancoMotoristas = dados.motoristas || [];
        
        const campoTermo = document.getElementById('num_termo');
        if (campoTermo && dados.proximoTermo) {
            campoTermo.value = dados.proximoTermo;
            campoTermo.placeholder = ""; 
        }
        console.log("Dados carregados com sucesso via JSONP!");
    }
};

function carregarDadosIniciais() {
    // Criamos uma chamada de script dinâmica que o navegador não bloqueia por CORS
    const script = document.createElement('script');
    script.src = `${WEB_APP_URL}?action=dadosIniciais&callback=processarDadosIniciais`;
    
    script.onerror = function() {
        console.error("Erro ao conectar com a planilha.");
        alert("⚠️ Não foi possível carregar os dados automaticamente. Mas o campo foi liberado para você digitar o número manualmente!");
        const campoTermo = document.getElementById('num_termo');
        if (campoTermo) {
            campoTermo.value = "";
            campoTermo.placeholder = "Ex: 2026-276";
        }
    };

    document.body.appendChild(script);
}

window.addEventListener('DOMContentLoaded', () => {
    // Alerta de confirmação após o recarregamento da página
    if (localStorage.getItem('termoImpresso')) {
        const ultimoTermo = localStorage.getItem('termoImpresso');
        alert(`✅ Termo nº ${ultimoTermo} gerado com sucesso!\nA planilha foi atualizada e o sistema já preparou o próximo número.`);
        localStorage.removeItem('termoImpresso');
    }

    // Dispara o carregamento dos dados
    carregarDadosIniciais();
});

// ==========================================================================
// 2. BUSCA AUTOMÁTICA DE CLIENTE PELO CNPJ/CPF (COM ALERTA)
// ==========================================================================
function buscarCliente() {
    const cnpjDigitado = document.getElementById('cliente_cnpj').value.trim();
    if (!cnpjDigitado) return;

    const encontrado = bancoClientes.find(linha => linha[0].toString().trim() === cnpjDigitado);

    if (encontrado) {
        document.getElementById('cliente').value = encontrado[1];
        document.getElementById('cidade').value = encontrado[2];
        clienteNovo = false;
    } else {
        clienteNovo = true;
        alert("⚠️ CNPJ/CPF não encontrado! Este é um CLIENTE NOVO e será cadastrado automaticamente na planilha ao imprimir.");
    }
}

// ==========================================================================
// 3. BUSCA AUTOMÁTICA DE MOTORISTA PELO CPF (COM ALERTA)
// ==========================================================================
function buscarMotorista() {
    const cpfDigitado = document.getElementById('cpf').value.trim();
    if (!cpfDigitado) return;

    const encontrado = bancoMotoristas.find(linha => linha[0].toString().trim() === cpfDigitado);

    if (encontrado) {
        document.getElementById('motorista').value = encontrado[1];
        motoristaNovo = false;
    } else {
        motoristaNovo = true;
        alert("⚠️ CPF não encontrado! Este é um MOTORISTA NOVO e será cadastrado automaticamente na planilha ao imprimir.");
    }
}

// ==========================================================================
// 4. ENVIA OS DADOS PARA A PLANILHA E DISPARA A IMPRESSÃO
// ==========================================================================
document.getElementById('btnPrint').addEventListener('click', async function() {
    const numTermo = document.getElementById('num_termo').value.trim(); 
    const ordem = document.getElementById('ordem').value.trim();
    const cnpj = document.getElementById('cliente_cnpj').value.trim();
    const cliente = document.getElementById('cliente').value.trim();
    const cidade = document.getElementById('cidade').value.trim();
    const qtd_pallets = document.getElementById('qtd_pallets').value;
    const qtd_chapas = document.getElementById('qtd_chapas').value;
    const motorista = document.getElementById('motorista').value.trim();
    const cpf = document.getElementById('cpf').value.trim();

    if(!numTermo || !ordem || !cliente || !cidade || !qtd_pallets || !qtd_chapas || !motorista || !cpf) {
        alert("Por favor, preencha todos os campos obrigatórios do formulário antes de gerar o PDF.");
        return;
    }

    const cnpjFinal = cnpj || "Não Informado";

    const dadosParaSalvar = {
        action: "salvarEAtualizar",
        termoAtual: numTermo, 
        novoCliente: clienteNovo,
        clienteCnpj: cnpjFinal,
        clienteNome: cliente,
        clienteCidade: cidade,
        novoMotorista: motoristaNovo,
        motoristaCpf: cpf,
        motoristaNome: motorista
    };

    try {
        localStorage.setItem('termoImpresso', numTermo);

        // Envia para o Sheets de forma assíncrona
        fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosParaSalvar)
        });

        const dataAtual = new Date().toLocaleDateString('pt-BR');

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

        const printArea = document.getElementById('print-area');
        printArea.innerHTML = `
            <div class="recibo-via primeira-via">${gerarLayoutDocumento('1ª Via - Empresa')}</div>
            <div class="recibo-via segunda-via">${gerarLayoutDocumento('2ª Via - Motorista')}</div>
        `;

        setTimeout(function() {
            window.print();
            window.location.reload();
        }, 300);

    } catch (erro) {
        console.error("Erro no salvamento:", erro);
    }
});