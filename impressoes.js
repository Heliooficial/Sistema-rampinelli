// ==========================================================================
// CONFIGURAÇÃO DA API: URL DO SEU GOOGLE APPS SCRIPT
// ==========================================================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxdGlBpCmI5hMGf679IBVzXflN3mI9Khx0fX7COsmojPxrj7vtfUFa9ccofCO7GzzzOyw/exec";

let bancoClientes = [];
let bancoMotoristas = [];
let clienteNovo = false;
let motoristaNovo = false;

const LISTA_OBSERVACOES = [
    "E o motorista responsabiliza-se por qualquer dano ao arroz transportado.",
    "Cliente não autorizou dedetizar o Veículo porque esta carregado de outros produtos.",
    "Veículo não encontra-se higienizado.",
    "Veículo encontra-se com a porta do baú com defeitos no fechamento",
    "Veículo apresenta defeito no lastro do baú.",
    "Veículo encontra-se com sujeira no piso do bau (papelao, plastico, residuos de acucar)",
    "Veículo encontra-se com o piso do baú molhado.",
    "Veículo encontra-se com a lona de cobrir o produto suja.",
    "Veículo encontra-se sem a lona para cobrir a carga.",
    "Veículo encontra-se com forte odor de produto de limpeza.",
    "Veículo encontra-se com vazamento no teto do baú.",
    "Veículo apresenta furos na lateral da carroceria.",
    "Cliente nao autorizou dedetizar o veículo porque é automóvel de passeio.",
    "Veículo não possui corda para amarrar o produto.",
    "O tempo esta chuvoso podendo molhar o arroz.",
    "Veículo encontra-se com piso do baú molhado de carne.",
    "Veículo encontra-se com a lona furada.",
    "Veículo encontra-se com o piso do baú furado.",
    "Veículo encontra-se carregado de verduras improprias para o consumo.",
    "Veículo encontra-se com insetos vivos no baú (baratas vivas).",
    "Veículo encontra-se com o piso da carroceria molhado.",
    "Veículo encontra-se carregado de outros produtos ( sabão ).",
    "Veículo encontra-se carregado de arroz bichado, e o motorista autorizou colocar junto com o arroz ideal para consumo.",
    "Foi solicitado pelo motorista para bater o arroz em cima dos pallets que o mesmo trouxe. E esses pallets estavam cheios de pregos podendo estourar o fardo.",
    "Veículo de camara fria (refrigerado) e está ligado.",
    "Veículo encontra-se carregado com materiais cortantes, podendo danificar o arroz.",
    "Cliente não autorizou dedetizar o Veículo.",
    "Veículo encontra-se com garrafa pet com urina humana.",
    "Veículo encontra-se com vazamento na porta do baú.",
    "Veículo apresenta aberturas na lateral, devido ao transporte ser para animais, podendo molhar o arroz ao ser transportado",
    "Veículo encontra-se com 2 carrinhos de supermercado",
    "Outros"
];

window.addEventListener('DOMContentLoaded', () => {
    carregarDadosIniciais();
    inicializarMenuAbas();
    renderizarChecklist();
    inicializarMenuMobile();
});

function inicializarMenuAbas() {
    const botoesMenu = document.querySelectorAll('.sidebar-menu a:not(.brevemente)');
    botoesMenu.forEach(botao => {
        botao.addEventListener('click', (e) => {
            e.preventDefault();
            botoesMenu.forEach(b => b.classList.remove('active'));
            botao.classList.add('active');

            const moduloAlvo = botao.getAttribute('data-modulo');
            document.querySelectorAll('.modulo-form').forEach(form => form.classList.remove('active-modulo'));
            document.getElementById(`modulo-${moduloAlvo}`).classList.add('active-modulo');
        });
    });
}

function renderizarChecklist() {
    const grid = document.getElementById('containerChecklist');
    if (!grid) return;
    grid.innerHTML = "";

    LISTA_OBSERVACOES.forEach((obs, index) => {
        const num = index + 1;
        const isChecked = (num === 1 || num === 27) ? "checked" : "";
        
        const itemHtml = `
            <label class="chk-item">
                <input type="checkbox" value="${num}" id="chk_${num}" ${isChecked} onchange="verificarOutros(this)">
                <span>${num} - ${obs}</span>
            </label>
        `;
        grid.insertAdjacentHTML('beforeend', itemHtml);
    });
}

function verificarOutros(chk) {
    if (chk.value === "32") {
        document.getElementById('txt_outros').style.display = chk.checked ? 'block' : 'none';
    }
}

window.processarDadosIniciais = function(dados) {
    if (dados) {
        bancoClientes = dados.clientes || [];
        bancoMotoristas = dados.motoristas || [];
        if (document.getElementById('num_termo') && dados.proximoTermo) {
            document.getElementById('num_termo').value = dados.proximoTermo;
        }
    }
};

function carregarDadosIniciais() {
    const script = document.createElement('script');
    script.src = `${WEB_APP_URL}?action=dadosIniciais&callback=processarDadosIniciais`;
    document.body.appendChild(script);
}

function inicializarMenuMobile() {
    const menuBtn = document.getElementById('menu-btn');
    const navbar = document.querySelector('.header .navbar');
    if (menuBtn && navbar) {
        menuBtn.addEventListener('click', () => { navbar.classList.toggle('active'); });
    }
}

function buscarClientePallet() {
    const cnpj = document.getElementById('cliente_cnpj').value.trim();
    const encontrado = bancoClientes.find(l => l[0].toString().trim() === cnpj);
    if (encontrado) {
        document.getElementById('cliente').value = encontrado[1];
        document.getElementById('cidade').value = encontrado[2];
        clienteNovo = false;
    } else { clienteNovo = true; }
}

function buscarMotoristaPallet() {
    const cpf = document.getElementById('cpf').value.trim();
    const encontrado = bancoMotoristas.find(l => l[0].toString().trim() === cpf);
    if (encontrado) {
        document.getElementById('motorista').value = encontrado[1];
        motoristaNovo = false;
    } else { motoristaNovo = true; }
}

function buscarMotoristaResp() {
    const cpf = document.getElementById('resp_cpf').value.trim();
    const encontrado = bancoMotoristas.find(l => l[0].toString().trim() === cpf);
    if (encontrado) {
        document.getElementById('resp_motorista').value = encontrado[1];
        document.getElementById('resp_cnh_rg').value = encontrado[2] || "";
    } else {
        document.getElementById('resp_cnh_rg').value = "";
        document.getElementById('resp_cnh_rg').placeholder = "Digite o documento manualmente (Opcional)";
    }
}

function buscarMultiCliente(num) {
    const cnpj = document.getElementById(`resp_cnpj${num}`).value.trim();
    if (!cnpj) return;
    const encontrado = bancoClientes.find(l => l[0].toString().trim() === cnpj);
    if (encontrado) {
        document.getElementById(`resp_nome${num}`).value = encontrado[1];
    }
}

// IMPRESSÃO PALLET
document.getElementById('btnPrintPallet').addEventListener('click', function() {
    const numTermo = document.getElementById('num_termo').value.trim(); 
    const lote = document.getElementById('lote').value.trim();
    const transportadora = document.getElementById('transportadora').value;
    const cnpj = document.getElementById('cliente_cnpj').value.trim() || "Não Informado";
    const cliente = document.getElementById('cliente').value.trim();
    const cidade = document.getElementById('cidade').value.trim();
    const qtd_pallets = document.getElementById('qtd_pallets').value;
    const qtd_chapas = document.getElementById('qtd_chapas').value;
    const motorista = document.getElementById('motorista').value.trim();
    const cpf = document.getElementById('cpf').value.trim();
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    if(!numTermo || !lote || !transportadora || !cliente || !cidade || !qtd_pallets || !qtd_chapas || !motorista || !cpf) {
        alert("Preencha todos os campos obrigatórios do Pallet."); return;
    }

    function layoutPallet(via) {
        return `
            <div style="border: 2px solid #000; padding: 20px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; background: #fff;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                    <img src="img/logo-rampinelli-2.png" style="max-height: 42px; filter: grayscale(100%);">
                    <div style="border: 2px solid #000; padding: 5px 15px; text-align: center; min-width: 140px;">
                        <div style="font-size: 16px; font-weight: bold; border-bottom: 1px solid #000;">Nº ${numTermo}</div>
                        <div style="font-size: 11px; font-weight: bold;">${via}</div>
                    </div>
                </div>
                <div style="text-align: center; font-size: 16px; font-weight: bold; margin: 10px 0; font-family: Arial;">TERMO DE COMPROMETIMENTO</div>
                <div style="font-size: 12.5px; line-height: 1.5; text-align: justify; font-family: Arial;">
                    Eu, <strong>${motorista}</strong>, motorista, inscrito no CPF nº <strong>${cpf}</strong>, da Transportadora <strong>${transportadora}</strong>, declaro ter recebido da empresa Rampinelli Alimentos LTDA, CNPJ 79.416.541/0005-89 no dia <strong>${dataAtual}</strong> a quantidade de <strong>${qtd_pallets}</strong> pallets e <strong>${qtd_chapas}</strong> chapas, referente ao transporte e descarga da mercadoria relativa ao lote <strong>${lote}</strong>, cliente: <strong>${cliente}</strong>, cidade: <strong>${cidade}</strong> sob o CNPJ nº <strong>${cnpj}</strong>.
                </div>
                <div style="display: flex; flex-direction: column; gap: 12px; width: 50%;">
                    <div style="border-bottom: 1px solid #000; height: 16px;"><span style="font-size: 10px; font-weight: bold;">Ass. Motorista</span></div>
                    <div style="border-bottom: 1px solid #000; height: 16px;"><span style="font-size: 10px; font-weight: bold;">Ass. Expedição</span></div>
                    <div style="border-bottom: 1px solid #000; height: 16px;"><span style="font-size: 10px; font-weight: bold;">Ass. Conferente</span></div>
                    <div style="border-bottom: 1px solid #000; height: 16px;"><span style="font-size: 10px; font-weight: bold;">Ass. Expedição</span></div>
                    <div style="border-bottom: 1px solid #000; height: 16px;"><span style="font-size: 10px; font-weight: bold;">Ass. Motorista</span></div>
                </div>
                <div style="font-size: 9.5px; line-height: 1.4; border: 1px solid #000; padding: 6px; font-family: Arial; background: #fafafa;">
                    <strong>OBS:</strong> Esse Termo terá que voltar para o setor Administrativo assinado pelo conferente atestando o recebimento bem como o estado dos pallets e chapatex. Os mesmos deverão estar em perfeito estado, caso contrário será cobrada uma taxa no Valor de R$ 40,00 (quarenta reais) por cada pallet quebrado.
                </div>
            </div>`;
    }
    document.getElementById('print-area').innerHTML = `
        <div style="height: 48vh; padding: 10px; box-sizing: border-box; page-break-inside: avoid; margin-bottom: 2vh;">${layoutPallet('VIA EMPRESA')}</div>
        <div style="height: 48vh; padding: 10px; box-sizing: border-box; page-break-inside: avoid;">${layoutPallet('VIA MOTORISTA')}</div>
    `;
    setTimeout(() => { 
        window.print(); 
        document.getElementById('palletForm').reset();
        document.getElementById('print-area').innerHTML = "";
        carregarDadosIniciais();
    }, 300);
});

// IMPRESSÃO RESPONSABILIDADE
document.getElementById('btnPrintResponsabilidade').addEventListener('click', function() {
    const motorista = document.getElementById('resp_motorista').value.trim();
    const cpf = document.getElementById('resp_cpf').value.trim();
    const cnh_rg = document.getElementById('resp_cnh_rg').value.trim();
    const notas = document.getElementById('resp_notas').value.trim();
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    // CORREÇÃO: CNH/RG removido da validação obrigatória
    if (!motorista || !cpf || !notas || !document.getElementById('resp_nome1').value.trim()) {
        alert("Por favor, preencha os dados obrigatórios do motorista (CPF/Nome), as notas fiscais e pelo menos o Cliente 1.");
        return;
    }

    // Monta o texto do documento tratando dinamicamente se há ou não CNH/RG preenchido
    const textoIdentificacaoDocumento = cnh_rg ? `, CNH / RG: <strong>${cnh_rg}</strong>` : "";

    let combinacaoClientesCnpjs = [];
    let listaApenasNomesClientes = [];

    for (let i = 1; i <= 5; i++) {
        const nomeCli = document.getElementById(`resp_nome${i}`).value.trim();
        const cnpjCli = document.getElementById(`resp_cnpj${i}`).value.trim() || "Não Informado";
        if (nomeCli) {
            combinacaoClientesCnpjs.push(`${nomeCli} (CNPJ: ${cnpjCli})`);
            listaApenasNomesClientes.push(nomeCli);
        }
    }

    const textoFormatadoClientes = combinacaoClientesCnpjs.join(', ');

    let observacoesSelecionadas = [];
    let obs1Marcada = false;

    for (let i = 1; i <= 32; i++) {
        const chk = document.getElementById(`chk_${i}`);
        if (chk && chk.checked) {
            if (i === 1) {
                obs1Marcada = true;
            } else if (i === 32) {
                const textoOutros = document.getElementById('txt_outros').value.trim();
                if (textoOutros) {
                    observacoesSelecionadas.push(textoOutros);
                }
            } else {
                observacoesSelecionadas.push(LISTA_OBSERVACOES[i-1]);
            }
        }
    }

    if (obs1Marcada) {
        observacoesSelecionadas.push(LISTA_OBSERVACOES[0]);
    }

    let htmlBlocoObservacoes = "";
    if (observacoesSelecionadas.length > 0) {
        htmlBlocoObservacoes = `
            <div style="border: 1px solid #000; padding: 6px; font-family: Arial; font-size: 10.5px; margin-bottom: 8px; background: #fafafa;">
                <strong style="display:block; margin-bottom:2px;">OBSERVAÇÕES:</strong>
                <ul style="margin: 0; padding-left: 15px; line-height: 1.3;">
                    ${observacoesSelecionadas.map(textoLimpo => `<li>${textoLimpo}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    let htmlRazoesSociaisRodape = "";
    listaApenasNomesClientes.forEach(nomeCli => {
        htmlRazoesSociaisRodape += `<div style="font-size: 11px; font-family: Arial; margin-top: 2px;"><strong>Razão Social:</strong> ${nomeCli}</div>`;
    });

    const layoutResponsabilidadeCorrigido = `
        <div style="border: 2px solid #000; padding: 15px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; background: #fff;">
            <div style="display: flex; justify-content: left; width: 100%;">
                <img src="img/logo-rampinelli-2.png" style="max-height: 35px; filter: grayscale(100%);">
            </div>

            <div style="text-align: center; font-size: 14px; font-weight: bold; margin: 5px 0; font-family: Arial; letter-spacing: 0.5px;">TERMO DE RESPONSABILIDADE</div>

            <div style="font-size: 11.5px; line-height: 1.4; text-align: justify; font-family: Arial; margin-bottom: 8px;">
                Eu, <strong>${motorista}</strong>, motorista, inscrito no CPF nº <strong>${cpf}</strong>${textoIdentificacaoDocumento}, retirei no dia <strong>${dataAtual}</strong> a mercadoria constante na nota fiscal nº <strong>${notas}</strong> referente a(os) cliente(s): <strong>${textoFormatadoClientes}</strong>, emitida pela RAMPINELLI ALIMENTOS LTDA sob o CNPJ nº 79.416.541/0005-89. Comprometo-me a entregá-lo em perfeito estado ao seu destino. Em caso de extravio e danos que acarretem a perda total ou parcial do bem fica a obrigação de ressarcir ao proprietário os prejuízos ocorridos.
            </div>

            ${htmlBlocoObservacoes}

            <div style="text-align: center; font-size: 11px; font-weight: bold; font-family: Arial; margin: 3px 0;">
                Por ser verdade firmo o presente termo.
            </div>

            <div style="text-align: center; margin: 15px auto 5px auto; width: 55%; font-family: Arial;">
                <div style="border-bottom: 1px solid #000; margin-bottom: 3px; height: 18px;"></div>
                <div style="font-size: 10.5px; font-weight: bold; text-transform: uppercase;">${motorista}</div>
            </div>

            <div style="text-align: left; margin-top: 5px; padding-top: 4px;">
                ${htmlRazoesSociaisRodape}
            </div>
        </div>
    `;

    document.getElementById('print-area').innerHTML = `
        <div style="height: 42vh; padding: 5px; box-sizing: border-box; page-break-inside: avoid;">
            ${layoutResponsabilidadeCorrigido}
        </div>
    `;

    setTimeout(() => { 
        window.print(); 
        document.getElementById('respForm').reset();
        document.getElementById('print-area').innerHTML = "";
        renderizarChecklist(); 
        document.getElementById('txt_outros').style.display = 'none';
    }, 300);
});