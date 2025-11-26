// ===== CHAVES DO LOCALSTORAGE =====
const CHAVE_CARROS = 'carros_empresa';
const CHAVE_HISTORICO_CARROS = 'historico_carros';
const CHAVE_RETIRADAS_ATIVAS_CARROS = 'retiradas_ativas_carros';
const CHAVE_FERRAMENTAS = 'ferramentas_empresa';
const CHAVE_HISTORICO_FERRAMENTAS = 'historico_ferramentas';
const CHAVE_RETIRADAS_ATIVAS_FERRAMENTAS = 'retiradas_ativas_ferramentas';

// ===== VARIÁVEIS GLOBAIS =====
let filtroHistoricoCarroAtual = 'todos';
let filtroHistoricoFerramentaAtual = 'todos';
let funcaoConfirmacao = null;

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    inicializarApp();
    configurarEventos();
});

function inicializarApp() {
    const agora = new Date();
    const dataHoraFormatada = formatarDataHoraParaInput(agora);
    
    document.getElementById('dataHoraRetiradaCarro').value = dataHoraFormatada;
    document.getElementById('dataHoraDevolvCarro').value = dataHoraFormatada;
    document.getElementById('dataHoraSaidaFerramenta').value = dataHoraFormatada;
    document.getElementById('dataHoraDevolucaoFerramenta').value = dataHoraFormatada;

    atualizarSelectCarrosRetirada();
    atualizarSelectCarrosDevolucao();
    atualizarSelectFerramentasSaida();
    atualizarSelectFerramentasDevolucao();
}

function configurarEventos() {
    // Formulários de Carros
    document.getElementById('formCadastroCarro').addEventListener('submit', salvarCarro);
    document.getElementById('formRetiradaCarro').addEventListener('submit', salvarRetiradaCarro);
    document.getElementById('formDevolvCarro').addEventListener('submit', salvarDevolvCarro);

    // Formulários de Ferramentas
    document.getElementById('formCadastroFerramenta').addEventListener('submit', salvarFerramenta);
    document.getElementById('formRegistroSaidaFerramenta').addEventListener('submit', salvarSaidaFerramenta);
    document.getElementById('formRegistroDevolucaoFerramenta').addEventListener('submit', salvarDevolucaoFerramenta);

    // Eventos de mudança
    document.getElementById('algumDanoCarro').addEventListener('change', mostrarCampoDanoCarro);
    document.getElementById('algumDanoFerramenta').addEventListener('change', mostrarCampoDanoFerramenta);
}

// ===== NAVEGAÇÃO =====
function irParaModuloCarros() {
    irParaTela('telaMenuCarros');
}

function irParaModuloFerramentas() {
    irParaTela('telaMenuFerramentas');
}

function voltarMenuPrincipal() {
    irParaTela('telaMenuPrincipal');
    limparFormularios();
}

function voltarParaMenuCarros() {
    irParaTela('telaMenuCarros');
    limparFormularios();
}

function voltarParaMenuFerramentas() {
    irParaTela('telaMenuFerramentas');
    limparFormularios();
}

function irParaTela(idTela) {
    document.querySelectorAll('.tela').forEach(tela => tela.classList.remove('ativa'));
    document.getElementById(idTela).classList.add('ativa');
    window.scrollTo(0, 0);

    if (idTela === 'telaListaCarro') {
        atualizarListaCarros();
    } else if (idTela === 'telaHistoricoCarro') {
        atualizarHistoricoCarros();
    } else if (idTela === 'telaRetiradaCarro') {
        atualizarSelectCarrosRetirada();
    } else if (idTela === 'telaDevolvCarro') {
        atualizarSelectCarrosDevolucao();
    } else if (idTela === 'telaListaFerramenta') {
        atualizarListaFerramentas();
    } else if (idTela === 'telaFerramentasEmUso') {
        atualizarFerramentasEmUso();
    } else if (idTela === 'telaHistoricoFerramenta') {
        atualizarHistoricoFerramentas();
    } else if (idTela === 'telaRegistroSaidaFerramenta') {
        atualizarSelectFerramentasSaida();
    } else if (idTela === 'telaRegistroDevolucaoFerramenta') {
        atualizarSelectFerramentasDevolucao();
    }
}

function limparFormularios() {
    document.querySelectorAll('form').forEach(form => form.reset());
    const agora = new Date();
    const dataHoraFormatada = formatarDataHoraParaInput(agora);
    
    document.getElementById('dataHoraRetiradaCarro').value = dataHoraFormatada;
    document.getElementById('dataHoraDevolvCarro').value = dataHoraFormatada;
    document.getElementById('dataHoraSaidaFerramenta').value = dataHoraFormatada;
    document.getElementById('dataHoraDevolucaoFerramenta').value = dataHoraFormatada;

    document.getElementById('descricaoDanoCarro').style.display = 'none';
    document.getElementById('descricaoDanoFerramenta').style.display = 'none';
}

// ===== FUNÇÕES DE CARROS =====

function obterCarros() {
    const carrosJSON = localStorage.getItem(CHAVE_CARROS);
    return carrosJSON ? JSON.parse(carrosJSON) : [];
}

function salvarCarros(carros) {
    localStorage.setItem(CHAVE_CARROS, JSON.stringify(carros));
}

function salvarCarro(e) {
    e.preventDefault();

    const modelo = document.getElementById('modeloCarro').value.trim();
    const placa = document.getElementById('placaCarro').value.trim().toUpperCase();
    const ano = parseInt(document.getElementById('anoCarro').value);
    const kmAtual = parseInt(document.getElementById('kmCarroAtual').value);

    const carros = obterCarros();
    if (carros.some(c => c.placa === placa)) {
        mostrarNotificacao('Erro: Já existe um carro com esta placa!', 'erro');
        return;
    }

    const novoCarro = {
        id: Date.now().toString(),
        modelo,
        placa,
        ano,
        kmAtual,
        status: 'disponivel',
        dataCadastro: new Date().toISOString()
    };

    carros.push(novoCarro);
    salvarCarros(carros);

    mostrarNotificacao(`Carro ${modelo} cadastrado com sucesso!`, 'sucesso');
    voltarParaMenuCarros();
}

function excluirCarro(idCarro) {
    const carros = obterCarros();
    const carro = carros.find(c => c.id === idCarro);

    if (!carro) return;

    const retiradas = obterRetiradasAtivasCarros();
    if (retiradas.some(r => r.idCarro === idCarro)) {
        mostrarNotificacao('Erro: Não é possível excluir um carro em uso!', 'erro');
        return;
    }

    abrirModalConfirmacao(
        'Excluir Carro',
        `Tem certeza que deseja excluir o carro ${carro.modelo} (${carro.placa})?`,
        function() {
            const carrosAtualizados = carros.filter(c => c.id !== idCarro);
            salvarCarros(carrosAtualizados);
            mostrarNotificacao(`Carro ${carro.modelo} excluído com sucesso!`, 'sucesso');
            atualizarListaCarros();
            fecharModal();
        }
    );
}

function atualizarListaCarros() {
    const carros = obterCarros();
    const listaCarros = document.getElementById('listaCarros');
    const mensagemVazia = document.getElementById('mensagemVaziaCarros');

    if (carros.length === 0) {
        listaCarros.innerHTML = '';
        mensagemVazia.style.display = 'block';
        return;
    }

    mensagemVazia.style.display = 'none';

    listaCarros.innerHTML = carros.map(carro => {
        const statusClass = carro.status === 'disponivel' ? 'status-disponivel' : 'status-em-uso';
        const statusTexto = carro.status === 'disponivel' ? 'Disponível' : 'Em uso';

        return `
            <div class="card-item">
                <div class="card-header">
                    <div>
                        <div class="card-titulo">${carro.modelo}</div>
                        <div class="card-codigo">${carro.placa}</div>
                    </div>
                    <span class="status-badge ${statusClass}">${statusTexto}</span>
                </div>
                <div class="card-info">
                    <div class="info-item">
                        <span class="info-label">Ano</span>
                        <span class="info-valor">${carro.ano}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">KM Atual</span>
                        <span class="info-valor">${carro.kmAtual.toLocaleString('pt-BR')} km</span>
                    </div>
                </div>
                <div class="card-acoes">
                    <button class="btn-excluir" onclick="excluirCarro('${carro.id}')">Excluir</button>
                </div>
            </div>
        `;
    }).join('');
}

function obterRetiradasAtivasCarros() {
    const retiradasJSON = localStorage.getItem(CHAVE_RETIRADAS_ATIVAS_CARROS);
    return retiradasJSON ? JSON.parse(retiradasJSON) : [];
}

function salvarRetiradasAtivasCarros(retiradas) {
    localStorage.setItem(CHAVE_RETIRADAS_ATIVAS_CARROS, JSON.stringify(retiradas));
}

function atualizarSelectCarrosRetirada() {
    const carros = obterCarros();
    const selectCarros = document.getElementById('carroRetirada');

    const carrosDisponiveis = carros.filter(c => c.status === 'disponivel');

    selectCarros.innerHTML = '<option value="">-- Escolha um carro --</option>';
    selectCarros.innerHTML += carrosDisponiveis.map(carro => {
        return `<option value="${carro.id}">${carro.modelo} (${carro.placa})</option>`;
    }).join('');
}

function atualizarSelectCarrosDevolucao() {
    const carros = obterCarros();
    const retiradas = obterRetiradasAtivasCarros();
    const selectCarros = document.getElementById('carroDevolvido');

    const carrosEmUso = carros.filter(c => {
        return retiradas.some(r => r.idCarro === c.id);
    });

    selectCarros.innerHTML = '<option value="">-- Escolha um carro em uso --</option>';
    selectCarros.innerHTML += carrosEmUso.map(carro => {
        return `<option value="${carro.id}">${carro.modelo} (${carro.placa})</option>`;
    }).join('');
}

function mostrarCampoDanoCarro() {
    const algumDano = document.getElementById('algumDanoCarro').value;
    document.getElementById('descricaoDanoCarro').style.display = algumDano === 'sim' ? 'flex' : 'none';
}

function salvarRetiradaCarro(e) {
    e.preventDefault();

    const idCarro = document.getElementById('carroRetirada').value;
    const nomeFunc = document.getElementById('nomeFuncCarro').value.trim();
    const dataHora = document.getElementById('dataHoraRetiradaCarro').value;
    const kmRetirada = parseInt(document.getElementById('kmRetiradaCarro').value);
    const motivo = document.getElementById('motivoCarro').value.trim();
    const pneusOk = document.getElementById('pneusOkCarro').checked;
    const documentos = document.getElementById('documentosCarro').checked;
    const carroLimpo = document.getElementById('carroLimpoCarro').checked;

    if (!idCarro || !nomeFunc || !dataHora || !motivo) {
        mostrarNotificacao('Erro: Preencha todos os campos obrigatórios!', 'erro');
        return;
    }

    const carros = obterCarros();
    const carro = carros.find(c => c.id === idCarro);

    if (!carro) {
        mostrarNotificacao('Erro: Carro não encontrado!', 'erro');
        return;
    }

    if (kmRetirada < carro.kmAtual) {
        mostrarNotificacao('Erro: KM na retirada não pode ser menor que o KM atual!', 'erro');
        return;
    }

    const retirada = {
        id: Date.now().toString(),
        idCarro,
        modeloCarro: carro.modelo,
        placaCarro: carro.placa,
        nomeFunc,
        dataHora,
        kmRetirada,
        motivo,
        checklist: {
            pneusOk,
            documentos,
            carroLimpo
        },
        dataRegistro: new Date().toISOString()
    };

    const historico = obterHistoricoCarros();
    historico.push({
        ...retirada,
        tipo: 'retirada'
    });
    salvarHistoricoCarros(historico);

    const retiradas = obterRetiradasAtivasCarros();
    retiradas.push(retirada);
    salvarRetiradasAtivasCarros(retiradas);

    carro.status = 'em-uso';
    salvarCarros(carros);

    mostrarNotificacao(`Retirada do carro ${carro.modelo} registrada!`, 'sucesso');
    voltarParaMenuCarros();
}

function salvarDevolvCarro(e) {
    e.preventDefault();

    const idCarro = document.getElementById('carroDevolvido').value;
    const dataHora = document.getElementById('dataHoraDevolvCarro').value;
    const kmDevolucao = parseInt(document.getElementById('kmDevolvCarro').value);
    const carroLimpoDev = document.getElementById('carroLimpoDevCarro').value;
    const algumDano = document.getElementById('algumDanoCarro').value;
    const descricaoDanoTexto = document.getElementById('descricaoDanoTextoCarro').value.trim();
    const observacoes = document.getElementById('observacoesCarro').value.trim();

    if (!idCarro || !dataHora || !carroLimpoDev || !algumDano) {
        mostrarNotificacao('Erro: Preencha todos os campos obrigatórios!', 'erro');
        return;
    }

    if (algumDano === 'sim' && !descricaoDanoTexto) {
        mostrarNotificacao('Erro: Descreva o dano encontrado!', 'erro');
        return;
    }

    const carros = obterCarros();
    const carro = carros.find(c => c.id === idCarro);

    if (!carro) {
        mostrarNotificacao('Erro: Carro não encontrado!', 'erro');
        return;
    }

    const retiradas = obterRetiradasAtivasCarros();
    const retiradaIndex = retiradas.findIndex(r => r.idCarro === idCarro);

    if (retiradaIndex === -1) {
        mostrarNotificacao('Erro: Retirada não encontrada!', 'erro');
        return;
    }

    const retirada = retiradas[retiradaIndex];

    if (kmDevolucao < retirada.kmRetirada) {
        mostrarNotificacao('Erro: KM na devolução não pode ser menor que o KM na retirada!', 'erro');
        return;
    }

    const devolucao = {
        id: Date.now().toString(),
        idRetirada: retirada.id,
        idCarro,
        modeloCarro: carro.modelo,
        placaCarro: carro.placa,
        nomeFunc: retirada.nomeFunc,
        dataHoraRetirada: retirada.dataHora,
        dataHoraDevolucao: dataHora,
        kmRetirada: retirada.kmRetirada,
        kmDevolucao,
        kmPercorrido: kmDevolucao - retirada.kmRetirada,
        carroLimpoDev,
        algumDano,
        descricaoDano: descricaoDanoTexto,
        observacoes,
        dataRegistro: new Date().toISOString()
    };

    const historico = obterHistoricoCarros();
    historico.push({
        ...devolucao,
        tipo: 'devolucao'
    });
    salvarHistoricoCarros(historico);

    retiradas.splice(retiradaIndex, 1);
    salvarRetiradasAtivasCarros(retiradas);

    carro.kmAtual = kmDevolucao;
    carro.status = 'disponivel';
    salvarCarros(carros);

    mostrarNotificacao(`Devolução do carro ${carro.modelo} registrada!`, 'sucesso');
    voltarParaMenuCarros();
}

function obterHistoricoCarros() {
    const historicoJSON = localStorage.getItem(CHAVE_HISTORICO_CARROS);
    return historicoJSON ? JSON.parse(historicoJSON) : [];
}

function salvarHistoricoCarros(historico) {
    localStorage.setItem(CHAVE_HISTORICO_CARROS, JSON.stringify(historico));
}

function filtrarHistoricoCarro(tipo) {
    filtroHistoricoCarroAtual = tipo;
    atualizarHistoricoCarros();
}

function atualizarHistoricoCarros() {
    let historico = obterHistoricoCarros();

    if (filtroHistoricoCarroAtual !== 'todos') {
        historico = historico.filter(item => item.tipo === filtroHistoricoCarroAtual);
    }

    historico.sort((a, b) => new Date(b.dataRegistro) - new Date(a.dataRegistro));

    const listaHistorico = document.getElementById('listaHistoricoCarro');
    const mensagemVazia = document.getElementById('mensagemHistoricoVazioCarros');

    if (historico.length === 0) {
        listaHistorico.innerHTML = '';
        mensagemVazia.style.display = 'block';
        return;
    }

    mensagemVazia.style.display = 'none';

    listaHistorico.innerHTML = historico.map(item => {
        if (item.tipo === 'retirada') {
            const data = new Date(item.dataHora);
            const dataFormatada = data.toLocaleDateString('pt-BR');
            const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            const checklist = item.checklist || {};
            const checklistTexto = [
                checklist.pneusOk ? '✓ Pneus ok' : '✗ Pneus com problema',
                checklist.documentos ? '✓ Documentos ok' : '✗ Sem documentos',
                checklist.carroLimpo ? '✓ Carro limpo' : '✗ Carro sujo'
            ].join(' | ');

            return `
                <div class="item-historico retirada">
                    <span class="historico-tipo retirada">RETIRADA</span>
                    <div class="historico-titulo">${item.modeloCarro} (${item.placaCarro})</div>
                    <div class="historico-detalhes">
                        <div class="historico-item-info">
                            <span class="historico-label">Funcionário</span>
                            <span class="historico-valor">${item.nomeFunc}</span>
                        </div>
                        <div class="historico-item-info">
                            <span class="historico-label">Data e Hora</span>
                            <span class="historico-valor">${dataFormatada} ${horaFormatada}</span>
                        </div>
                        <div class="historico-item-info">
                            <span class="historico-label">KM na Retirada</span>
                            <span class="historico-valor">${item.kmRetirada.toLocaleString('pt-BR')} km</span>
                        </div>
                        <div class="historico-item-info">
                            <span class="historico-label">Motivo</span>
                            <span class="historico-valor">${item.motivo}</span>
                        </div>
                    </div>
                    <div class="historico-observacoes">
                        <strong>Checklist:</strong> ${checklistTexto}
                    </div>
                </div>
            `;
        } else {
            const data = new Date(item.dataHoraDevolucao);
            const dataFormatada = data.toLocaleDateString('pt-BR');
            const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            let condicaoCarro = item.carroLimpoDev === 'sim' ? '✓ Limpo' : '✗ Sujo';
            let statusDano = item.algumDano === 'sim' ? '✓ Sim' : '✗ Não';

            let observacoesHTML = '';
            if (item.descricaoDano) {
                observacoesHTML += `<p><strong>Dano:</strong> ${item.descricaoDano}</p>`;
            }
            if (item.observacoes) {
                observacoesHTML += `<p><strong>Observações:</strong> ${item.observacoes}</p>`;
            }

            return `
                <div class="item-historico devolucao">
                    <span class="historico-tipo devolucao">DEVOLUÇÃO</span>
                    <div class="historico-titulo">${item.modeloCarro} (${item.placaCarro})</div>
                    <div class="historico-detalhes">
                        <div class="historico-item-info">
                            <span class="historico-label">Funcionário</span>
                            <span class="historico-valor">${item.nomeFunc}</span>
                        </div>
                        <div class="historico-item-info">
                            <span class="historico-label">Data e Hora</span>
                            <span class="historico-valor">${dataFormatada} ${horaFormatada}</span>
                        </div>
                        <div class="historico-item-info">
                            <span class="historico-label">KM Percorrido</span>
                            <span class="historico-valor">${item.kmPercorrido.toLocaleString('pt-BR')} km</span>
                        </div>
                        <div class="historico-item-info">
                            <span class="historico-label">Condição</span>
                            <span class="historico-valor">${condicaoCarro}</span>
                        </div>
                        <div class="historico-item-info">
                            <span class="historico-label">Danos</span>
                            <span class="historico-valor">${statusDano}</span>
                        </div>
                        <div class="historico-item-info">
                            <span class="historico-label">KM na Devolução</span>
                            <span class="historico-valor">${item.kmDevolucao.toLocaleString('pt-BR')} km</span>
                        </div>
                    </div>
                    ${observacoesHTML ? `<div class="historico-observacoes">${observacoesHTML}</div>` : ''}
                </div>
            `;
        }
    }).join('');
}

// ===== FUNÇÕES DE FERRAMENTAS =====

function obterFerramentas() {
    const ferramentasJSON = localStorage.getItem(CHAVE_FERRAMENTAS);
    return ferramentasJSON ? JSON.parse(ferramentasJSON) : [];
}

function salvarFerramentas(ferramentas) {
    localStorage.setItem(CHAVE_FERRAMENTAS, JSON.stringify(ferramentas));
}

function salvarFerramenta(e) {
    e.preventDefault();

    const nome = document.getElementById('nomeFerramenta').value.trim();
    const codigo = document.getElementById('codigoFerramenta').value.trim().toUpperCase();
    const condicao = document.getElementById('condicaoFerramenta').value;
    const observacoes = document.getElementById('observacoesFerramenta').value.trim();

    if (!nome || !codigo || !condicao) {
        mostrarNotificacao('Erro: Preencha todos os campos obrigatórios!', 'erro');
        return;
    }

    const ferramentas = obterFerramentas();
    if (ferramentas.some(f => f.codigo === codigo)) {
        mostrarNotificacao('Erro: Já existe uma ferramenta com este código!', 'erro');
        return;
    }

    const novaFerramenta = {
        id: Date.now().toString(),
        nome,
        codigo,
        condicao,
        observacoes,
        status: 'disponivel',
        emUsoComQuem: null,
        emUsoDe: null,
        dataCadastro: new Date().toISOString()
    };

    ferramentas.push(novaFerramenta);
    salvarFerramentas(ferramentas);

    mostrarNotificacao(`Ferramenta ${nome} cadastrada com sucesso!`, 'sucesso');
    voltarParaMenuFerramentas();
}

function excluirFerramenta(idFerramenta) {
    const ferramentas = obterFerramentas();
    const ferramenta = ferramentas.find(f => f.id === idFerramenta);

    if (!ferramenta) return;

    const retiradas = obterRetiradasAtivasFerramentas();
    if (retiradas.some(r => r.idFerramenta === idFerramenta)) {
        mostrarNotificacao('Erro: Não é possível excluir uma ferramenta em uso!', 'erro');
        return;
    }

    abrirModalConfirmacao(
        'Excluir Ferramenta',
        `Tem certeza que deseja excluir a ferramenta ${ferramenta.nome} (${ferramenta.codigo})?`,
        function() {
            const ferramentasAtualizadas = ferramentas.filter(f => f.id !== idFerramenta);
            salvarFerramentas(ferramentasAtualizadas);
            mostrarNotificacao(`Ferramenta ${ferramenta.nome} excluída com sucesso!`, 'sucesso');
            atualizarListaFerramentas();
            fecharModal();
        }
    );
}

function atualizarListaFerramentas() {
    const ferramentas = obterFerramentas();
    const listaFerramentas = document.getElementById('listaFerramentas');
    const mensagemVazia = document.getElementById('mensagemVaziaFerramentas');

    if (ferramentas.length === 0) {
        listaFerramentas.innerHTML = '';
        mensagemVazia.style.display = 'block';
        return;
    }

    mensagemVazia.style.display = 'none';

    listaFerramentas.innerHTML = ferramentas.map(ferramenta => {
        const statusClass = ferramenta.status === 'disponivel' ? 'status-disponivel' : 'status-em-uso';
        const statusTexto = ferramenta.status === 'disponivel' ? 'Disponível' : 'Em uso';

        let condicaoTexto = '';
        if (ferramenta.condicao === 'nova') condicaoTexto = '✓ Nova';
        else if (ferramenta.condicao === 'usada') condicaoTexto = '⚠️ Usada';
        else if (ferramenta.condicao === 'precisa-reparar') condicaoTexto = '❌ Precisa Reparar';

        return `
            <div class="card-item">
                <div class="card-header">
                    <div>
                        <div class="card-titulo">${ferramenta.nome}</div>
                        <div class="card-codigo">${ferramenta.codigo}</div>
                    </div>
                    <span class="status-badge ${statusClass}">${statusTexto}</span>
                </div>
                <div class="card-info">
                    <div class="info-item">
                        <span class="info-label">Condição</span>
                        <span class="info-valor">${condicaoTexto}</span>
                    </div>
                    ${ferramenta.emUsoComQuem ? `
                    <div class="info-item">
                        <span class="info-label">Em uso com</span>
                        <span class="info-valor">${ferramenta.emUsoComQuem}</span>
                    </div>
                    ` : ''}
                </div>
                ${ferramenta.observacoes ? `<div class="historico-observacoes">${ferramenta.observacoes}</div>` : ''}
                <div class="card-acoes">
                    <button class="btn-excluir" onclick="excluirFerramenta('${ferramenta.id}')">Excluir</button>
                </div>
            </div>
        `;
    }).join('');
}

function obterRetiradasAtivasFerramentas() {
    const retiradasJSON = localStorage.getItem(CHAVE_RETIRADAS_ATIVAS_FERRAMENTAS);
    return retiradasJSON ? JSON.parse(retiradasJSON) : [];
}

function salvarRetiradasAtivasFerramentas(retiradas) {
    localStorage.setItem(CHAVE_RETIRADAS_ATIVAS_FERRAMENTAS, JSON.stringify(retiradas));
}

function atualizarSelectFerramentasSaida() {
    const ferramentas = obterFerramentas();
    const selectFerramentas = document.getElementById('ferramentaSaida');

    const ferramentasDisponiveis = ferramentas.filter(f => f.status === 'disponivel');

    selectFerramentas.innerHTML = '<option value="">-- Escolha uma ferramenta --</option>';
    selectFerramentas.innerHTML += ferramentasDisponiveis.map(ferramenta => {
        return `<option value="${ferramenta.id}">${ferramenta.nome} (${ferramenta.codigo})</option>`;
    }).join('');
}

function atualizarSelectFerramentasDevolucao() {
    const ferramentas = obterFerramentas();
    const retiradas = obterRetiradasAtivasFerramentas();
    const selectFerramentas = document.getElementById('ferramentaDevolucao');

    const ferramentasEmUso = ferramentas.filter(f => {
        return retiradas.some(r => r.idFerramenta === f.id);
    });

    selectFerramentas.innerHTML = '<option value="">-- Escolha uma ferramenta em uso --</option>';
    selectFerramentas.innerHTML += ferramentasEmUso.map(ferramenta => {
        return `<option value="${ferramenta.id}">${ferramenta.nome} (${ferramenta.codigo})</option>`;
    }).join('');
}

function mostrarCampoDanoFerramenta() {
    const algumDano = document.getElementById('algumDanoFerramenta').value;
    document.getElementById('descricaoDanoFerramenta').style.display = algumDano === 'sim' ? 'flex' : 'none';
}

function salvarSaidaFerramenta(e) {
    e.preventDefault();

    const idFerramenta = document.getElementById('ferramentaSaida').value;
    const nomeFunc = document.getElementById('nomeFuncSaidaFerramenta').value.trim();
    const dataHora = document.getElementById('dataHoraSaidaFerramenta').value;
    const condicaoSaida = document.getElementById('condicaoSaidaFerramenta').value;
    const observacoes = document.getElementById('observacoesSaidaFerramenta').value.trim();

    if (!idFerramenta || !nomeFunc || !dataHora || !condicaoSaida) {
        mostrarNotificacao('Erro: Preencha todos os campos obrigatórios!', 'erro');
        return;
    }

    const ferramentas = obterFerramentas();
    const ferramenta = ferramentas.find(f => f.id === idFerramenta);

    if (!ferramenta) {
        mostrarNotificacao('Erro: Ferramenta não encontrada!', 'erro');
        return;
    }

    const saida = {
        id: Date.now().toString(),
        idFerramenta,
        nomeFerramenta: ferramenta.nome,
        codigoFerramenta: ferramenta.codigo,
        nomeFunc,
        dataHora,
        condicaoSaida,
        observacoes,
        dataRegistro: new Date().toISOString()
    };

    const historico = obterHistoricoFerramentas();
    historico.push({
        ...saida,
        tipo: 'saida'
    });
    salvarHistoricoFerramentas(historico);

    const retiradas = obterRetiradasAtivasFerramentas();
    retiradas.push(saida);
    salvarRetiradasAtivasFerramentas(retiradas);

    ferramenta.status = 'em-uso';
    ferramenta.emUsoComQuem = nomeFunc;
    ferramenta.emUsoDe = dataHora;
    ferramenta.condicao = condicaoSaida;
    salvarFerramentas(ferramentas);

    mostrarNotificacao(`Saída da ferramenta ${ferramenta.nome} registrada!`, 'sucesso');
    voltarParaMenuFerramentas();
}

function salvarDevolucaoFerramenta(e) {
    e.preventDefault();

    const idFerramenta = document.getElementById('ferramentaDevolucao').value;
    const nomeFunc = document.getElementById('nomeFuncDevolucaoFerramenta').value.trim();
    const dataHora = document.getElementById('dataHoraDevolucaoFerramenta').value;
    const condicaoDevolucao = document.getElementById('condicaoDevolucaoFerramenta').value;
    const algumDano = document.getElementById('algumDanoFerramenta').value;
    const descricaoDanoTexto = document.getElementById('descricaoDanoTextoFerramenta').value.trim();
    const observacoes = document.getElementById('observacoesDevolucaoFerramenta').value.trim();

    if (!idFerramenta || !nomeFunc || !dataHora || !condicaoDevolucao || !algumDano) {
        mostrarNotificacao('Erro: Preencha todos os campos obrigatórios!', 'erro');
        return;
    }

    if (algumDano === 'sim' && !descricaoDanoTexto) {
        mostrarNotificacao('Erro: Descreva o dano encontrado!', 'erro');
        return;
    }

    const ferramentas = obterFerramentas();
    const ferramenta = ferramentas.find(f => f.id === idFerramenta);

    if (!ferramenta) {
        mostrarNotificacao('Erro: Ferramenta não encontrada!', 'erro');
        return;
    }

    const retiradas = obterRetiradasAtivasFerramentas();
    const retiradaIndex = retiradas.findIndex(r => r.idFerramenta === idFerramenta);

    if (retiradaIndex === -1) {
        mostrarNotificacao('Erro: Saída não encontrada!', 'erro');
        return;
    }

    const saida = retiradas[retiradaIndex];

    const devolucao = {
        id: Date.now().toString(),
        idSaida: saida.id,
        idFerramenta,
        nomeFerramenta: ferramenta.nome,
        codigoFerramenta: ferramenta.codigo,
        nomeFuncSaida: saida.nomeFunc,
        nomeFuncDevolucao: nomeFunc,
        dataHoraSaida: saida.dataHora,
        dataHoraDevolucao: dataHora,
        condicaoSaida: saida.condicaoSaida,
        condicaoDevolucao,
        algumDano,
        descricaoDano: descricaoDanoTexto,
        observacoes,
        dataRegistro: new Date().toISOString()
    };

    const historico = obterHistoricoFerramentas();
    historico.push({
        ...devolucao,
        tipo: 'devolucao'
    });
    salvarHistoricoFerramentas(historico);

    retiradas.splice(retiradaIndex, 1);
    salvarRetiradasAtivasFerramentas(retiradas);

    ferramenta.status = 'disponivel';
    ferramenta.emUsoComQuem = null;
    ferramenta.emUsoDe = null;
    ferramenta.condicao = condicaoDevolucao;
    salvarFerramentas(ferramentas);

    mostrarNotificacao(`Devolução da ferramenta ${ferramenta.nome} registrada!`, 'sucesso');
    voltarParaMenuFerramentas();
}

function atualizarFerramentasEmUso() {
    const ferramentas = obterFerramentas();
    const retiradas = obterRetiradasAtivasFerramentas();
    const listaFerramentasEmUso = document.getElementById('listaFerramentasEmUso');
    const mensagemVazia = document.getElementById('mensagemVaziaFerramentasEmUso');

    const ferramentasEmUso = ferramentas.filter(f => f.status === 'em-uso');

    if (ferramentasEmUso.length === 0) {
        listaFerramentasEmUso.innerHTML = '';
        mensagemVazia.style.display = 'block';
        return;
    }

    mensagemVazia.style.display = 'none';

    listaFerramentasEmUso.innerHTML = ferramentasEmUso.map(ferramenta => {
        const saida = retiradas.find(r => r.idFerramenta === ferramenta.id);
        const dataSaida = saida ? new Date(saida.dataHora) : null;
        const dataFormatada = dataSaida ? dataSaida.toLocaleDateString('pt-BR') : '';
        const horaFormatada = dataSaida ? dataSaida.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

        let condicaoTexto = '';
        if (ferramenta.condicao === 'nova') condicaoTexto = '✓ Nova';
        else if (ferramenta.condicao === 'usada') condicaoTexto = '⚠️ Usada';
        else if (ferramenta.condicao === 'precisa-reparar') condicaoTexto = '❌ Precisa Reparar';

        return `
            <div class="card-item">
                <div class="card-header">
                    <div>
                        <div class="card-titulo">${ferramenta.nome}</div>
                        <div class="card-codigo">${ferramenta.codigo}</div>
                    </div>
                    <span class="status-badge status-em-uso">Em uso</span>
                </div>
                <div class="card-info">
                    <div class="info-item">
                        <span class="info-label">Quem está usando</span>
                        <span class="info-valor">${ferramenta.emUsoComQuem}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Desde</span>
                        <span class="info-valor">${dataFormatada} ${horaFormatada}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Condição</span>
                        <span class="info-valor">${condicaoTexto}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function obterHistoricoFerramentas() {
    const historicoJSON = localStorage.getItem(CHAVE_HISTORICO_FERRAMENTAS);
    return historicoJSON ? JSON.parse(historicoJSON) : [];
}

function salvarHistoricoFerramentas(historico) {
    localStorage.setItem(CHAVE_HISTORICO_FERRAMENTAS, JSON.stringify(historico));
}

function filtrarHistoricoFerramenta(tipo) {
    filtroHistoricoFerramentaAtual = tipo;
    atualizarHistoricoFerramentas();
}

function atualizarHistoricoFerramentas() {
    let historico = obterHistoricoFerramentas();

    if (filtroHistoricoFerramentaAtual !== 'todos') {
        historico = historico.filter(item => item.tipo === filtroHistoricoFerramentaAtual);
    }

    historico.sort((a, b) => new Date(b.dataRegistro) - new Date(a.dataRegistro));

    const listaHistorico = document.getElementById('listaHistoricoFerramenta');
    const mensagemVazia = document.getElementById('mensagemHistoricoVazioFerramenta');

    if (historico.length === 0) {
        listaHistorico.innerHTML = '';
        mensagemVazia.style.display = 'block';
        return;
    }

    mensagemVazia.style.display = 'none';

    listaHistorico.innerHTML = historico.map(item => {
        if (item.tipo === 'saida') {
            const data = new Date(item.dataHora);
            const dataFormatada = data.toLocaleDateString('pt-BR');
            const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            let condicaoTexto = '';
            if (item.condicaoSaida === 'nova') condicaoTexto = '✓ Nova';
            else if (item.condicaoSaida === 'usada') condicaoTexto = '⚠️ Usada';
            else if (item.condicaoSaida === 'precisa-reparar') condicaoTexto = '❌ Precisa Reparar';

            return `
                <div class="item-historico saida">
                    <span class="historico-tipo saida">SAÍDA</span>
                    <div class="historico-titulo">${item.nomeFerramenta} (${item.codigoFerramenta})</div>
                    <div class="historico-detalhes">
                        <div class="historico-item-info">
                            <span class="historico-label">Funcionário</span>
                            <span class="historico-valor">${item.nomeFunc}</span>
                        </div>
                        <div class="historico-item-info">
                            <span class="historico-label">Data e Hora</span>
                            <span class="historico-valor">${dataFormatada} ${horaFormatada}</span>
                        </div>
                        <div class="historico-item-info">
                            <span class="historico-label">Condição</span>
                            <span class="historico-valor">${condicaoTexto}</span>
                        </div>
                    </div>
                    ${item.observacoes ? `<div class="historico-observacoes"><strong>Observações:</strong> ${item.observacoes}</div>` : ''}
                </div>
            `;
        } else {
            const data = new Date(item.dataHoraDevolucao);
            const dataFormatada = data.toLocaleDateString('pt-BR');
            const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            let condicaoTexto = '';
            if (item.condicaoDevolucao === 'nova') condicaoTexto = '✓ Nova';
            else if (item.condicaoDevolucao === 'usada') condicaoTexto = '⚠️ Usada';
            else if (item.condicaoDevolucao === 'precisa-reparar') condicaoTexto = '❌ Precisa Reparar';

            let statusDano = item.algumDano === 'sim' ? '✓ Sim' : '✗ Não';

            let observacoesHTML = '';
            if (item.descricaoDano) {
                observacoesHTML += `<p><strong>Dano:</strong> ${item.descricaoDano}</p>`;
            }
            if (item.observacoes) {
                observacoesHTML += `<p><strong>Observações:</strong> ${item.observacoes}</p>`;
            }

            return `
                <div class="item-historico devolucao">
                    <span class="historico-tipo devolucao">DEVOLUÇÃO</span>
                    <div class="historico-titulo">${item.nomeFerramenta} (${item.codigoFerramenta})</div>
                    <div class="historico-detalhes">
                        <div class="historico-item-info">
                            <span class="historico-label">Retirado por</span>
                            <span class="historico-valor">${item.nomeFuncSaida}</span>
                        </div>
                        <div class="historico-item-info">
                            <span class="historico-label">Devolvido por</span>
                            <span class="historico-valor">${item.nomeFuncDevolucao}</span>
                        </div>
                        <div class="historico-item-info">
                            <span class="historico-label">Data e Hora</span>
                            <span class="historico-valor">${dataFormatada} ${horaFormatada}</span>
                        </div>
                        <div class="historico-item-info">
                            <span class="historico-label">Condição</span>
                            <span class="historico-valor">${condicaoTexto}</span>
                        </div>
                        <div class="historico-item-info">
                            <span class="historico-label">Danos</span>
                            <span class="historico-valor">${statusDano}</span>
                        </div>
                    </div>
                    ${observacoesHTML ? `<div class="historico-observacoes">${observacoesHTML}</div>` : ''}
                </div>
            `;
        }
    }).join('');
}

// ===== FUNÇÕES UTILITÁRIAS =====

function abrirModalConfirmacao(titulo, mensagem, callback) {
    const modal = document.getElementById('modalConfirmacao');
    document.getElementById('modalTitulo').textContent = titulo;
    document.getElementById('modalMensagem').textContent = mensagem;

    funcaoConfirmacao = callback;
    document.getElementById('btnConfirmarAcao').onclick = function() {
        if (funcaoConfirmacao) {
            funcaoConfirmacao();
        }
    };

    modal.classList.add('ativo');
}

function fecharModal() {
    document.getElementById('modalConfirmacao').classList.remove('ativo');
    funcaoConfirmacao = null;
}

function mostrarNotificacao(mensagem, tipo = 'sucesso') {
    const notificacao = document.getElementById('notificacao');
    notificacao.textContent = mensagem;
    notificacao.className = `notificacao ativa ${tipo}`;

    setTimeout(() => {
        notificacao.classList.remove('ativa');
    }, 3000);
}

function formatarDataHoraParaInput(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    const horas = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');

    return `${ano}-${mes}-${dia}T${horas}:${minutos}`;
}
