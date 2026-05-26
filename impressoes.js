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
    const script = document.createElement('script');
    script.src = `${WEB_APP_URL}?action=dadosIniciais&callback=processarDadosIniciais`;
    
    script.onerror = function() {
        console.error("Erro ao conectar com a planilha.");
        const campoTermo = document.getElementById('num_termo');
        if (campoTermo) {
            campoTermo.value = "";
            campoTermo.placeholder = "Ex: 2026-276";
        }
    };

    document.body.appendChild(script);
}

function inicializarMenuMobile() {
    const menuBtn = document.getElementById('menu-btn');
    const navbar = document.querySelector('.header .navbar');

    if (menuBtn && navbar) {
        menuBtn.addEventListener('click', () => {
            navbar.classList.toggle('active');
            menuBtn.classList.toggle('fa-times');
        });

        document.querySelectorAll('.header .navbar a').forEach(link => {
            link.addEventListener('click', () => {
                navbar.classList.remove('active');
                menuBtn.classList.remove('fa-times');
            });
        });
    }
}

function gerenciarModulosBrevemente() {
    const linksBrevemente = document.querySelectorAll('.sidebar-menu a.brevemente');
    linksBrevemente.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); 
            const nomeModulo = link.textContent.trim();
            console.log(`Módulo em desenvolvimento: ${nomeModulo}`);
        });
    });
}

window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('termoImpresso')) {
        const ultimoTermo = localStorage.getItem('termoImpresso');
        console.log(`✅ Termo nº ${ultimoTermo} gerado com sucesso.`);
        localStorage.removeItem('termoImpresso');
    }

    carregarDadosIniciais();
    inicializarMenuMobile();
    gerenciarModulosBrevemente();
});

// ==========================================================================
// 2. BUSCA AUTOMÁTICA DE CLIENTE PELO CNPJ/CPF (EDITÁVEL)
// ==========================================================================
function buscarCliente() {
    const cnpjDigitado = document.getElementById('cliente_cnpj').value.trim();
    const campoCliente = document.getElementById('cliente');
    if (!cnpjDigitado) return;

    const encontrado = bancoClientes.find(linha => linha[0].toString().trim() === cnpjDigitado);

    if (encontrado) {
        campoCliente.value = encontrado[1];
        document.getElementById('cidade').value = encontrado[2];
        campoCliente.style.borderColor = '#cbd5e1'; 
        clienteNovo = false;
    } else {
        clienteNovo = true;
        campoCliente.style.borderColor = '#ea580c'; 
        campoCliente.placeholder = "Cliente novo! Digite a Razão Social para cadastrar.";
        console.log("⚠️ CNPJ/CPF não encontrado. Novo cliente configurado.");
    }
}

// ==========================================================================
// 3. BUSCA AUTOMÁTICA DE MOTORISTA PELO CPF (EDITÁVEL)
// ==========================================================================
function buscarMotorista() {
    const cpfDigitado = document.getElementById('cpf').value.trim();
    const campoMotorista = document.getElementById('motorista');
    if (!cpfDigitado) return;

    const encontrado = bancoMotoristas.find(linha => linha[0].toString().trim() === cpfDigitado);

    if (encontrado) {
        campoMotorista.value = encontrado[1];
        campoMotorista.style.borderColor = '#cbd5e1'; 
        motoristaNovo = false;
    } else {
        motoristaNovo = true;
        campoMotorista.style.borderColor = '#ea580c';
        campoMotorista.placeholder = "Motorista novo! Digite o nome completo para cadastrar.";
        console.log("⚠️ CPF não encontrado. Novo motorista configurado.");
    }
}

// ==========================================================================
// 4. ENVIA OS DADOS PARA A PLANILHA E DISPARA A IMPRESSÃO REESTRUTURADA
// ==========================================================================
document.getElementById('btnPrint').addEventListener('click', async function() {
    const numTermo = document.getElementById('num_termo').value.trim(); 
    const lote = document.getElementById('lote').value.trim();
    const transportadora = document.getElementById('transportadora').value;
    const cnpj = document.getElementById('cliente_cnpj').value.trim();
    const cliente = document.getElementById('cliente').value.trim();
    const cidade = document.getElementById('cidade').value.trim();
    const qtd_pallets = document.getElementById('qtd_pallets').value;
    const qtd_chapas = document.getElementById('qtd_chapas').value;
    const motorista = document.getElementById('motorista').value.trim();
    const cpf = document.getElementById('cpf').value.trim();

    if(!numTermo || !lote || !transportadora || !cliente || !cidade || !qtd_pallets || !qtd_chapas || !motorista || !cpf) {
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

        fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosParaSalvar)
        });

        const dataAtual = new Date().toLocaleDateString('pt-BR');

        function gerarLayoutDocumento(nomeVia) {
            return `
                <!-- A GRANDE CAIXA QUE ARREMAUTA TUDO DENTRO DE UM QUADRADO FECHADO -->
                <div style="border: 2px solid #000; padding: 20px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; background: #fff;">
                    
                    <!-- CABEÇALHO -->
                    <div class="recibo-header-novo" style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                        <div class="recibo-logo-box">
                            <!-- Logo da Impressão definida estritamente como a versão -2 -->
                            <img src="img/logo-rampinelli-2.png" alt="Logo Rampinelli" style="max-height: 42px; filter: grayscale(100%);">
                        </div>
                        <div class="recibo-termo-badge" style="border: 2px solid #000; padding: 5px 15px; text-align: center; min-width: 140px; background: #fff; font-family: Arial, sans-serif;">
                            <div style="font-size: 16px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 2px;">Nº ${numTermo}</div>
                            <div style="font-size: 11px; font-weight: bold; text-transform: uppercase;">${nomeVia}</div>
                        </div>
                    </div>

                    <!-- TÍTULO CENTRALIZADO -->
                    <div style="text-align: center; font-size: 16px; font-weight: bold; margin: 12px 0 8px 0; letter-spacing: 1px; font-family: Arial, sans-serif;">TERMO DE COMPROMETIMENTO</div>

                    <!-- CORPO DO TEXTO -->
                    <div style="font-size: 12.5px; line-height: 1.5; text-align: justify; margin-bottom: 12px; font-family: Arial, sans-serif;">
                        Eu, <strong>${motorista}</strong>, motorista, inscrito no CPF nº <strong>${cpf}</strong>, da Transportadora <strong>${transportadora}</strong>, declaro ter recebido da empresa Rampinelli Alimentos LTDA, CNPJ 79.416.541/0005-89 no dia <strong>${dataAtual}</strong> a quantidade de <strong>${qtd_pallets}</strong> pallets e <strong>${qtd_chapas}</strong> chapas, referente ao transporte e descarga da mercadoria relativa ao lote <strong>${lote}</strong>, cliente: <strong>${cliente}</strong>, cidade: <strong>${cidade}</strong> sob o CNPJ nº <strong>${cnpjFinal}</strong>.
                    </div>

                    <!-- ASSINATURAS METADE DA TELA -->
                    <div class="recibo-assinaturas-lista" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; font-family: Arial, sans-serif; width: 50%; align-self: flex-start;">
                        <div style="border-bottom: 1px solid #000; padding-bottom: 2px; height: 16px;"><span style="font-size: 10px; font-weight: bold;">Ass. Motorista</span></div>
                        <div style="border-bottom: 1px solid #000; padding-bottom: 2px; height: 16px;"><span style="font-size: 10px; font-weight: bold;">Ass. Expedição</span></div>
                        <div style="border-bottom: 1px solid #000; padding-bottom: 2px; height: 16px;"><span style="font-size: 10px; font-weight: bold;">Ass. Conferente</span></div>
                        <div style="border-bottom: 1px solid #000; padding-bottom: 2px; height: 16px;"><span style="font-size: 10px; font-weight: bold;">Ass. Expedição</span></div>
                        <div style="border-bottom: 1px solid #000; padding-bottom: 2px; height: 16px;"><span style="font-size: 10px; font-weight: bold;">Ass. Motorista</span></div>
                    </div>

                    <!-- CAIXA DE OBSERVAÇÃO -->
                    <div style="font-size: 9.5px; line-height: 1.4; text-align: justify; border: 1px solid #000; padding: 6px; font-family: Arial, sans-serif; background-color: #fafafa;">
                        <strong>OBS:</strong> Esse Termo terá que voltar para o setor Administrativo assinado pelo conferente atestando o recebimento bem como o estado dos pallets e chapatex. Os mesmos deverão estar em perfeito estado, caso contrário será cobrada uma taxa no Valor de R$ 40,00 (quarenta reais) por cada pallet quebrado.
                    </div>
                </div>
            `;
        }

        const printArea = document.getElementById('print-area');
        printArea.innerHTML = `
            <div class="recibo-via primeira-via" style="height: 48vh; padding: 10px; box-sizing: border-box; page-break-inside: avoid; margin-bottom: 2vh;">${gerarLayoutDocumento('VIA EMPRESA')}</div>
            <div class="recibo-via segunda-via" style="height: 48vh; padding: 10px; box-sizing: border-box; page-break-inside: avoid;">${gerarLayoutDocumento('VIA MOTORISTA')}</div>
        `;

        setTimeout(function() {
            window.print();
            window.location.reload();
        }, 300);

    } catch (erro) {
        console.error("Erro no salvamento:", erro);
    }
});