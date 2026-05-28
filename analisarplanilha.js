// ==========================================================================
// 1. SISTEMA DE NAVEGAÇÃO LATERAL (PADRÃO OPERACIONAL RAMPINELLI)
// ==========================================================================
const linksMenu = document.querySelectorAll('.sidebar-menu a');
const modulosForm = document.querySelectorAll('.modulo-form');

linksMenu.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault(); 
        linksMenu.forEach(l => l.classList.remove('active'));
        this.classList.add('active');

        const moduloDestino = this.getAttribute('data-modulo');
        modulosForm.forEach(modulo => {
            modulo.classList.remove('active-modulo');
            if (modulo.id === `modulo-${moduloDestino}`) {
                modulo.classList.add('active-modulo');
            }
        });
    });
});

// ==========================================================================
// 2. CONTROLE LOGÍSTICO - MÓDULO CARGAS PALETIZADAS
// ==========================================================================
let dadosPlanilhaProcessados = [];
let alteracoesSalvasEReadytogo = false; 

// Lista expandida de palavras-chave para o filtro de paletizados
const PALAVRAS_CHAVE_PALETIZADOS = ["NOVO ATACADO", "SENDAS", "ATACADAO", "NORDESTAO", "BONANCA", "ASSAI"];

// Aguarda a renderização completa do HTML
document.addEventListener('DOMContentLoaded', inicializarGatilhosComponentes);

function inicializarGatilhosComponentes() {
    // Vincular Input de Arquivo
    const inputExcel = document.getElementById('inputExcelPaletizadas');
    if (inputExcel) {
        inputExcel.addEventListener('change', tratarUploadExcel);
    }

    // Vincular Botão Filtrar Paletizados
    const btnFiltrar = document.getElementById('btnFiltrarPaletizados');
    if (btnFiltrar) {
        btnFiltrar.onclick = function(e) {
            e.preventDefault();
            filtrarApenasPaletizados();
        };
    }

    // Vincular Botão Mostrar Todos
    const btnResetar = document.getElementById('btnResetarPaletizados');
    if (btnResetar) {
        btnResetar.onclick = function(e) {
            e.preventDefault();
            renderizarTabelaAnalise(dadosPlanilhaProcessados);
        };
    }

    // Vincular Botões Superiores de Ação (Impressão e Exportação)
    configurarBotoesSuperioresNativos();
}

function configurarBotoesSuperioresNativos() {
    const btnResumido = document.getElementById('btnPrintResumido');
    const btnDetalhado = document.getElementById('btnPrintDetalhado');
    const btnExcel = document.getElementById('btnExportarExcelAjustado');

    // Ambos os botões de impressão agora chamam o layout unificado e otimizado para produção
    if (btnResumido) btnResumido.onclick = function(e) { e.preventDefault(); emitirImpressaoRelatorio(); };
    if (btnDetalhado) btnDetalhado.onclick = function(e) { e.preventDefault(); emitirImpressaoRelatorio(); };
    if (btnExcel) btnExcel.onclick = function(e) { e.preventDefault(); baixarExcelModificado(); };

    gerenciarBloqueioAcoesImpressao(true);
}

// ==========================================================================
// 3. LEITURA DE PLANILHAS COM TRATAMENTO OPERACIONAL SEGURO
// ==========================================================================
function tratarUploadExcel(e) {
    const arquivo = e.target.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = function(evt) {
        try {
            const dadosBinarios = evt.target.result;
            const livroExcel = XLSX.read(dadosBinarios, { type: 'binary', cellDates: true, raw: false });
            
            const nomeAba = livroExcel.SheetNames.find(n => {
                const normalizado = n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return normalizado.includes('programac');
            }) || livroExcel.SheetNames[0];
            
            const abaAlvo = livroExcel.Sheets[nomeAba];
            const dadosJson = XLSX.utils.sheet_to_json(abaAlvo);
            
            if (!dadosJson || dadosJson.length === 0) {
                alert("A aba '" + nomeAba + "' importada está vazia ou mal estruturada.");
                return;
            }

            processarDadosMapeados(dadosJson, abaAlvo);
        } catch (err) {
            console.error(err);
            alert("Erro ao processar o arquivo Excel. Certifique-se de que a planilha não possui células corrompidas.");
        }
    };
    leitor.readAsBinaryString(arquivo);
}

function processarDadosMapeados(dadosJson, abaAlvo) {
    dadosPlanilhaProcessados = [];
    alteracoesSalvasEReadytogo = false;

    const primeiraLinha = dadosJson[0] || {};
    
    let chaveLote = encontrarChavePorSemelhança(primeiraLinha, ['lote', 'codigo']);
    let chaveFrete = encontrarChavePorSemelhança(primeiraLinha, ['frete', 'tipo']);
    let chaveData = encontrarChavePorSemelhança(primeiraLinha, ['progda', 'data progda', 'data', 'emissao']);
    let chaveCliente = encontrarChavePorSemelhança(primeiraLinha, ['cliente', 'destino', 'razao']);
    let chaveObs = encontrarChavePorSemelhança(primeiraLinha, ['obs.', 'obs', 'observac']);

    dadosJson.forEach(linha => {
        let lote = (linha[chaveLote] || '').toString().trim();
        let cliente = (linha[chaveCliente] || '').toString().trim();
        
        if (!lote && !cliente) return;

        let frete = (linha[chaveFrete] || 'CIF').toString().toUpperCase().trim();
        let dataOriginal = linha[chaveData];
        let observacao = (linha[chaveObs] || '').toString().trim();

        let dataFinalFormatada = "";
        if (dataOriginal) {
            if (dataOriginal instanceof Date && !isNaN(dataOriginal.getTime())) {
                dataFinalFormatada = dataOriginal.toLocaleDateString('pt-BR');
            } else if (typeof dataOriginal === 'string' && dataOriginal.includes('/')) {
                dataFinalFormatada = dataOriginal.trim();
            } else {
                dataFinalFormatada = new Date().toLocaleDateString('pt-BR');
            }
        } else {
            dataFinalFormatada = new Date().toLocaleDateString('pt-BR');
        }

        let produtosDaCarga = [];
        Object.keys(linha).forEach(chave => {
            const chaveMin = chave.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            if ([chaveLote, chaveFrete, chaveData, chaveCliente, chaveObs].includes(chave)) return;
            if (chaveMin.includes('liberac') || chaveMin.includes('representa')) return;
            
            const valorNum = parseFloat(linha[chave]);
            if (valorNum > 0) {
                produtosDaCarga.push({ nome: chave.toUpperCase().trim(), qtd: valorNum });
            }
        });

        dadosPlanilhaProcessados.push({
            lote: lote,
            frete: frete,
            dataProg: dataFinalFormatada,
            cliente: cliente,
            observacao: observacao,
            produtos: produtosDaCarga
        });
    });

    renderizarTabelaAnalise(dadosPlanilhaProcessados);
    exibirAreaResultados(true);
    gerenciarBloqueioAcoesImpressao(true);
}

function encontrarChavePorSemelhança(objeto, termosBusca) {
    const chaves = Object.keys(objeto);
    for (let termo of termosBusca) {
        let achado = chaves.find(c => {
            const cNorm = c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return cNorm.includes(termo);
        });
        if (achado) return achado;
    }
    return chaves[0] || '';
}

// ==========================================================================
// 4. RENDERIZAÇÃO DA TABELA OPERACIONAL
// ==========================================================================
function renderizarTabelaAnalise(listaDados) {
    const tbody = document.querySelector('#tabelaPaletizadas tbody');
    if (!tbody) return;
    tbody.innerHTML = "";

    if (listaDados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px; color: #718096; font-weight:bold;">Nenhum registro encontrado.</td></tr>`;
        return;
    }

    listaDados.forEach((item, index) => {
        let stringProdutos = item.produtos.map((p, pIdx) => `
            <div style="display:flex; gap:6px; align-items:center; margin-bottom:5px;">
                <input type="number" value="${p.qtd}" style="width:55px; height:32px; text-align:center; border:1px solid #cbd5e0; border-radius:6px; font-weight:bold;" onchange="atualizarProdutoQtdLocal(${index}, ${pIdx}, this.value)">
                <input type="text" value="${p.nome}" style="flex:1; height:32px; border:1px solid #cbd5e0; border-radius:6px; padding:6px; font-size:13px; text-transform: uppercase;" onchange="automaticallyAtualizarProdutoNomeLocal(${index}, ${pIdx}, this.value)">
                <button type="button" onclick="removerItemProdutoEspecifico(${index}, ${pIdx})" style="background:transparent; border:none; color:#e53e3e; cursor:pointer; font-size: 14px; padding: 0 4px;" title="Remover este produto">❌</button>
            </div>
        `).join('');

        if(item.produtos.length === 0) {
            stringProdutos = `
                <div style="display:flex; gap:6px; align-items:center; margin-bottom:5px;">
                    <input type="number" placeholder="Qtd" style="width:55px; height:32px; text-align:center; border:1px solid #cbd5e0; border-radius:6px;" onchange="inicializarPrimeisroProdutoQtd(${index}, this.value)">
                    <input type="text" placeholder="Item" style="flex:1; height:32px; border:1px solid #cbd5e0; border-radius:6px; padding:6px; font-size:13px; text-transform: uppercase;" onchange="inicializarPrimeiroProdutoNome(${index}, this.value)">
                </div>
            `;
        }
        
        const trHtml = `
            <tr id="linha-carga-${index}">
                <td style="text-align:center; vertical-align: middle;">
                    <button type="button" onclick="removerLinhaCompletaDeCarga(${index})" style="background: #fff5f5; border: 1px solid #fed7d7; color: #e53e3e; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 15px; font-weight: bold; transition: all 0.2s;" onmouseover="this.style.background='#feb2b2'" onmouseout="this.style.background='#fff5f5'" title="Excluir carga completa">🗑️</button>
                </td>
                <td><input type="text" value="${item.lote}" class="input-lote" style="width:100%; border:1px solid #cbd5e0; padding:6px; border-radius:4px; font-weight:bold; text-align:center;" onchange="atualizarCampoLocal(${index}, 'lote', this.value)"></td>
                <td>
                    <select style="width:100%; padding:6px; border:1px solid #cbd5e0; border-radius:4px;" onchange="atualizarCampoLocal(${index}, 'frete', this.value)">
                        <option value="CIF" ${item.frete === 'CIF' ? 'selected' : ''}>CIF</option>
                        <option value="FOB" ${item.frete === 'FOB' ? 'selected' : ''}>FOB</option>
                    </select>
                </td>
                <td><input type="text" value="${item.dataProg}" style="width:100%; border:1px solid #cbd5e0; padding:6px; border-radius:4px; text-align:center;" onchange="atualizarCampoLocal(${index}, 'dataProg', this.value)"></td>
                <td><input type="text" value="${item.cliente}" style="width:100%; border:1px solid #cbd5e0; padding:6px; border-radius:4px; text-transform: uppercase; font-weight:600;" onchange="atualizarCampoLocal(${index}, 'cliente', this.value)"></td>
                <td>
                    <div>${stringProdutos}</div>
                    <button type="button" onclick="adicionarMaisUmProdutoNaMesmaCarga(${index})" style="background: #e2e8f0; color: #2b6cb0; border: none; padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; cursor: pointer; margin-top: 4px; display: inline-flex; align-items: center; gap: 2px;">➕ Item</button>
                </td>
                <td><input type="text" value="${item.observacao}" style="width:100%; border:1px solid #cbd5e0; padding:6px; border-radius:4px;" onchange="atualizarCampoLocal(${index}, 'observacao', this.value)"></td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', trHtml);
    });

    funcaoGerenciarPainelInferiorMesa();
}

// ==========================================================================
// 5. REMOÇÃO COMPLETA DE CARGAS (LINHAS) E ATUALIZADORES
// ==========================================================================
function removerLinhaCompletaDeCarga(indexCarga) {
    if (confirm(`Deseja realmente remover a carga do lote "${dadosPlanilhaProcessados[indexCarga].lote || 'Sem Lote'}" e cliente "${dadosPlanilhaProcessados[indexCarga].cliente || 'Sem Cliente'}" por completo?`)) {
        dadosPlanilhaProcessados.splice(indexCarga, 1);
        renderizarTabelaAnalise(dadosPlanilhaProcessados);
        notificarMudancaSemSalvar();
    }
}

function atualizarCampoLocal(index, campo, valor) {
    if (dadosPlanilhaProcessados[index]) {
        dadosPlanilhaProcessados[index][campo] = valor;
        notificarMudancaSemSalvar();
    }
}
function atualizarProdutoQtdLocal(loteIndex, prodIndex, valor) {
    if (dadosPlanilhaProcessados[loteIndex]?.produtos[prodIndex]) {
        dadosPlanilhaProcessados[loteIndex].produtos[prodIndex].qtd = parseFloat(valor) || 0;
        notificarMudancaSemSalvar();
    }
}
function automaticallyAtualizarProdutoNomeLocal(loteIndex, prodIndex, valor) {
    if (dadosPlanilhaProcessados[loteIndex]?.produtos[prodIndex]) {
        dadosPlanilhaProcessados[loteIndex].produtos[prodIndex].nome = valor.toUpperCase();
        notificarMudancaSemSalvar();
    }
}
function inicializarPrimeisroProdutoQtd(index, valor) {
    if (dadosPlanilhaProcessados[index]) {
        dadosPlanilhaProcessados[index].produtos = [{nome: '', qtd: parseFloat(valor) || 0}];
        notificarMudancaSemSalvar();
    }
}
function inicializarPrimeiroProdutoNome(index, valor) {
    if (dadosPlanilhaProcessados[index]) {
        if(dadosPlanilhaProcessados[index].produtos.length === 0) {
            dadosPlanilhaProcessados[index].produtos.push({nome: valor.toUpperCase(), qtd: 0});
        } else {
            dadosPlanilhaProcessados[index].produtos[0].nome = valor.toUpperCase();
        }
        notificarMudancaSemSalvar();
    }
}
function adicionarMaisUmProdutoNaMesmaCarga(loteIndex) {
    if (dadosPlanilhaProcessados[loteIndex]) {
        dadosPlanilhaProcessados[loteIndex].produtos.push({ nome: '', qtd: 0 });
        renderizarTabelaAnalise(dadosPlanilhaProcessados);
        notificarMudancaSemSalvar();
    }
}
function removerItemProdutoEspecifico(loteIndex, prodIndex) {
    if (dadosPlanilhaProcessados[loteIndex]) {
        dadosPlanilhaProcessados[loteIndex].produtos.splice(prodIndex, 1);
        renderizarTabelaAnalise(dadosPlanilhaProcessados);
        notificarMudancaSemSalvar();
    }
}

// ==========================================================================
// 6. FILTRAGEM INTELIGENTE
// ==========================================================================
function filtrarApenasPaletizados() {
    if (dadosPlanilhaProcessados.length === 0) {
        alert("Importe uma planilha primeiro antes de realizar a filtragem!");
        return;
    }

    const filtrados = dadosPlanilhaProcessados.filter(item => {
        if (!item.cliente) return false;
        const nomeClienteTratado = item.cliente.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return PALAVRAS_CHAVE_PALETIZADOS.some(palavra => {
            const palavraTratada = palavra.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return nomeClienteTratado.includes(palavraTratada);
        });
    });

    renderizarTabelaAnalise(filtrados);
}

function notificarMudancaSemSalvar() {
    alteracoesSalvasEReadytogo = false;
    gerenciarBloqueioAcoesImpressao(true);
}

function gerenciarBloqueioAcoesImpressao(bloquear) {
    const botoes = [document.getElementById('btnPrintResumido'), document.getElementById('btnPrintDetalhado'), document.getElementById('btnExportarExcelAjustado')];
    botoes.forEach(btn => {
        if (btn) {
            btn.disabled = bloquear;
            btn.style.opacity = bloquear ? "0.4" : "1";
            btn.style.cursor = bloquear ? "not-allowed" : "pointer";
        }
    });
}

function exibirAreaResultados(deveExibir) {
    const areaResultado = document.getElementById('resultadoPaletizadas');
    if (areaResultado) {
        areaResultado.style.display = deveExibir ? 'block' : 'none';
    }
}

// ==========================================================================
// 7. PAINEL DE VALIDAÇÃO INFERIOR
// ==========================================================================
function funcaoGerenciarPainelInferiorMesa() {
    if (document.getElementById('containerControlesOperacionais')) return;

    const tabelaElement = document.getElementById('tabelaPaletizadas');
    if (!tabelaElement) return;

    const htmlControles = `
        <div id="containerControlesOperacionais" style="margin-top: 20px; width: 100%; font-family: sans-serif;">
            <button type="button" id="btnAdicionarLinhaManual" style="background: #ffffff; color: #2b6cb0; border: 2px dashed #2b6cb0; padding: 10px; font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer; width: 100%; text-align: center; margin-bottom: 15px;">
                ➕ Adicionar Nova Carga Manual à Lista
            </button>

            <div style="background: #f7fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; display: flex; flex-direction: column; align-items: center; gap: 10px;">
                <span id="txtStatusSalvamento" style="font-size: 13px; font-weight: bold; color: #e53e3e;">⚠️ Existem alterações pendentes. Clique abaixo para liberar a emissão!</span>
                <button type="button" id="btnSalvarMesaOperacional" style="background: #38a169; color:#fff; border:none; padding:12px 25px; font-size:15px; font-weight:bold; border-radius:6px; cursor:pointer; width:100%; max-width:350px;">
                    💾 Salvar e Validar Alterações
                </button>
            </div>
        </div>
    `;
    tabelaElement.insertAdjacentHTML('afterend', htmlControles);

    document.getElementById('btnAdicionarLinhaManual').addEventListener('click', inserirLinhaEmBrancoNoFinal);
    document.getElementById('btnSalvarMesaOperacional').addEventListener('click', salvarTodaAMesaOperacional);
}

function inserirLinhaEmBrancoNoFinal() {
    dadosPlanilhaProcessados.push({
        lote: '', frete: 'CIF', dataProg: new Date().toLocaleDateString('pt-BR'), cliente: '', observacao: '', produtos: []
    });
    renderizarTabelaAnalise(dadosPlanilhaProcessados);
    notificarMudancaSemSalvar();
}

function salvarTodaAMesaOperacional() {
    dadosPlanilhaProcessados = dadosPlanilhaProcessados.filter(item => item.lote.trim() !== "" || item.cliente.trim() !== "");
    
    alteracoesSalvasEReadytogo = true;
    gerenciarBloqueioAcoesImpressao(false);

    const txtStatus = document.getElementById('txtStatusSalvamento');
    if (txtStatus) {
        txtStatus.innerText = "✅ Alterações salvas! Romaneios liberados para emissão.";
        txtStatus.style.color = "#2f855a";
    }
    alert("Dados consolidados com sucesso! Romaneios liberados.");
}

// ==========================================================================
// 8. RELATÓRIOS E EXPORTAÇÃO (LAYOUT ULTRA COMPACTO DE PRODUÇÃO)
// ==========================================================================
function emitirImpressaoRelatorio() {
    const dataEmissao = new Date().toLocaleDateString('pt-BR');
    
    // Montagem das linhas da tabela de cargas de forma ultra enxuta
    let linhasTabelaHtml = dadosPlanilhaProcessados.map(item => {
        // Formatação dos produtos colocando a quantidade estritamente entre parênteses para o operador não confundir
        let prodsFormatados = item.produtos.map(p => `
            <span style="display: inline-block; background: #e2e8f0; padding: 1px 5px; margin: 2px; border-radius: 3px; font-size: 10px; font-weight: bold; border: 1px solid #cbd5e0; white-space: nowrap;">
                (${p.qtd}) ${p.nome}
            </span>
        `).join('');

        return `
            <tr>
                <td style="text-align: center; font-weight: bold; font-size: 11px; padding: 3px; word-break: break-all;">${item.lote}</td>
                <td style="text-align: center; font-size: 11px; padding: 3px;">${item.frete}</td>
                <td style="text-align: center; font-size: 11px; padding: 3px;">${item.dataProg}</td>
                <td style="text-align: center; font-weight: bold; font-size: 10px; padding: 3px; text-transform: uppercase; max-width: 200px; word-wrap: break-word;">${item.cliente}</td>
                <td style="text-align: center; font-size: 10px; padding: 3px; max-width: 320px;">${prodsFormatados || '-'}</td>
                <td style="text-align: center; font-size: 10px; padding: 3px; color: #4a5568; font-style: italic; max-width: 150px; word-wrap: break-word;">${item.observacao || '-'}</td>
            </tr>
        `;
    }).join('');

    const janelaImpressao = window.open('', '_blank');
    
    janelaImpressao.document.write(`
        <html>
        <head>
            <title>Rampinelli - Cargas Paletizadas</title>
            <style>
                @page {
                    size: A4 landscape;
                    margin: 5mm 5mm 5mm 5mm; /* Aproveitamento total do papel A4 deitado */
                }
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    color: #000;
                    background-color: #fff;
                }
                /* Topo Estrutural Otimizado */
                .header-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #cc0000;
                    padding-bottom: 4px;
                    margin-bottom: 8px;
                }
                .logo-info-box {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }
                .img-logo {
                    height: 30px; /* Altura controlada para não empurrar os dados para baixo */
                    object-fit: contain;
                }
                .info-filial {
                    font-size: 7.5px;
                    line-height: 1.1;
                    color: #333;
                    max-width: 480px;
                }
                .title-doc {
                    font-size: 16px;
                    font-weight: bold;
                    color: #000;
                    text-align: center;
                    letter-spacing: 0.5px;
                }
                .date-doc {
                    font-size: 8.5px;
                    font-weight: bold;
                    text-align: right;
                    color: #000;
                }
                /* Estrutura da Grade de Production */
                table {
                    width: 100%;
                    border-collapse: collapse;
                    page-break-inside: auto;
                }
                tr {
                    page-break-inside: avoid;
                    page-break-after: auto;
                }
                th {
                    background-color: #e2e8f0;
                    color: #000;
                    font-weight: bold;
                    font-size: 10.5px;
                    padding: 4px;
                    border: 1px solid #718096;
                    text-transform: uppercase;
                    text-align: center;
                }
                td {
                    border: 1px solid #a0aec0;
                    padding: 3px;
                    vertical-align: middle; /* Centralização vertical de todos os registros */
                }
                tr:nth-child(even) {
                    background-color: #f7fafc;
                }
            </style>
        </head>
        <body onload="window.print(); window.close();">
            
            <div class="header-container">
                <div class="logo-info-box">
                    <img src="img/logo-rampinelli.png" alt="Rampinelli Alimentos" class="img-logo" onerror="this.style.display='none';">
                    <div class="info-filial">
                        <strong>Rampinelli Alimentos LTDA</strong> | CNPJ: 79.416.541/0005-89 | Fones: (81) 3721-5754 / 3721-7188<br>
                        Rua Eronildes Bernadino de Lima, 71 - Bairro: Pdsa-Modulo II - CEP: 55045-070 - Caruaru - PE
                    </div>
                </div>
                
                <div class="title-doc">CARGAS PALETIZADAS</div>
                
                <div class="date-doc">DATA DE GERAÇÃO DO RELATÓRIO: ${dataEmissao}</div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 8%;">Lote</th>
                        <th style="width: 7%;">Frete</th>
                        <th style="width: 13%;">Data Programada</th>
                        <th style="width: 27%;">Cliente</th>
                        <th style="width: 30%;">Produtos</th>
                        <th style="width: 15%;">Observações</th>
                    </tr>
                </thead>
                <tbody>
                    ${linhasTabelaHtml}
                </tbody>
            </table>

        </body>
        </html>
    `);
    janelaImpressao.document.close();
}

function baixarExcelModificado() {
    const linesExportar = dadosPlanilhaProcessados.map(item => ({
        "Lote": item.lote, "Tipo de Frete": item.frete, "Data Programada": item.dataProg, "Cliente": item.cliente, "Produtos": item.produtos.map(p => `(${p.qtd}) ${p.nome}`).join(', '), "Observações": item.observacao
    }));
    const novaPlanilha = XLSX.utils.json_to_sheet(linesExportar);
    const novoLivro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(novoLivro, novaPlanilha, "Programação");
    XLSX.writeFile(novoLivro, "Programacao_Cargas_Paletizadas.xlsx");
}