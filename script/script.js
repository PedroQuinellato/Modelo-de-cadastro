// Configuração da API base
const API_URL = 'http://localhost:3000';

// Armazenamento e estado
let linhas = [];
let pontosTemp = [];
let map = null;
let markers = [];
let selectedLine = null;

// Funções de utilidade
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    atualizarInterface();
}

function validarCoordenada(valor) {
    return /^-?\d*\.?\d*$/.test(valor) && !isNaN(parseFloat(valor));
}

// Funções de API
async function fetchLinhas() {
    try {
        const response = await fetch(`${API_URL}/linhas`);
        linhas = await response.json();
        return linhas;
    } catch (error) {
        console.error('Erro ao buscar linhas:', error);
        return [];
    }
}

async function fetchPontos() {
    try {
        const response = await fetch(`${API_URL}/pontos`);
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar pontos:', error);
        return [];
    }
}

// Funções CRUD
async function cadastrarLinha(evento) {
    evento.preventDefault();

    const numero = document.getElementById('numero').value;
    const tipo = document.getElementById('tipo').value;

    if (!numero || !tipo) {
        alert('Por favor, preencha todos os campos');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/linhas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                numero,
                tipo
            })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        alert('Linha cadastrada com sucesso!');
        evento.target.reset();
        await atualizarInterface();
    } catch (error) {
        console.error('Erro ao cadastrar linha:', error);
        alert('Erro ao cadastrar linha. Por favor, tente novamente.');
    }
}

async function adicionarPonto(evento) {
    evento.preventDefault();

    const latitude = parseFloat(document.getElementById('latitude').value);
    const longitude = parseFloat(document.getElementById('longitude').value);
    const linhaSelect = document.getElementById('linha-select');
    const linhaSelecionada = linhaSelect.value;

    if (!validarCoordenada(latitude) || !validarCoordenada(longitude)) {
        alert('Por favor, insira coordenadas válidas');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/pontos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                linha: linhaSelecionada,
                latitude,
                longitude
            })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        alert('Ponto adicionado com sucesso!');
        evento.target.reset();
        await atualizarInterface();
    } catch (error) {
        console.error('Erro ao adicionar ponto:', error);
        alert('Erro ao adicionar ponto. Por favor, tente novamente.');
    }
}

async function removerLinha(id) {
    if (!confirm('Tem certeza que deseja remover esta linha?')) return;

    try {
        // Remove a linha
        await fetch(`${API_URL}/linhas/${id}`, {
            method: 'DELETE'
        });

        // Busca e remove todos os pontos associados
        const pontos = await fetchPontos();
        const linha = linhas.find(l => l.id === id);
        const pontosParaRemover = pontos.filter(p => p.linha === linha.numero);

        for (const ponto of pontosParaRemover) {
            await fetch(`${API_URL}/pontos/${ponto.id}`, {
                method: 'DELETE'
            });
        }

        await atualizarInterface();
    } catch (error) {
        console.error('Erro ao remover linha:', error);
    }
}

async function editarLinha(id) {
    const linha = linhas.find(l => l.id === id);
    const novoNumero = prompt('Novo número da linha:', linha.numero);
    const novoTipo = prompt('Novo tipo de ônibus:', linha.tipo);

    if (novoNumero && novoTipo) {
        try {
            await fetch(`${API_URL}/linhas/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...linha,
                    numero: novoNumero,
                    tipo: novoTipo
                })
            });

            await atualizarInterface();
        } catch (error) {
            console.error('Erro ao editar linha:', error);
        }
    }
}

let currentEditingPoint = null;

async function visualizarPontos(linhaNumero) {
    selectedLine = linhaNumero; // Armazena a linha selecionada
    showTab('visualizacao'); // Muda para a aba de visualização

    try {
        const pontos = await fetchPontos();
        const pontosDaLinha = pontos.filter(ponto => ponto.linha === linhaNumero);

        const pontosList = document.getElementById('points-list');
        if (!pontosList) return;

        pontosList.innerHTML = '';
        pontosDaLinha.forEach((ponto, index) => {
            const li = document.createElement('div');
            li.className = 'point-item';
            li.innerHTML = `
                <div class="point-info">
                    <h4>Ponto ${index + 1}</h4>
                    <p>Latitude: ${ponto.latitude}</p>
                    <p>Longitude: ${ponto.longitude}</p>
                </div>
                <div class="point-actions">
                    <button onclick="editarPonto(${ponto.id}, ${ponto.latitude}, ${ponto.longitude})" class="edit-btn">Editar</button>
                    <button onclick="centralizarNoPonto(${ponto.latitude}, ${ponto.longitude})" class="center-btn">Centralizar</button>
                    <button onclick="removerPonto(${ponto.id})" class="delete-btn">Remover</button>
                </div>
            `;
            pontosList.appendChild(li);
        });

        initializeMap();
        atualizarMapa(pontosDaLinha);
    } catch (error) {
        console.error('Erro ao visualizar pontos:', error);
    }
}

function atualizarMapa(pontos) {
    if (!map) initializeMap();

    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    pontos.forEach((ponto, index) => {
        const marker = L.marker([ponto.latitude, ponto.longitude])
            .bindPopup(`Ponto ${index + 1}<br>Lat: ${ponto.latitude}<br>Lng: ${ponto.longitude}`)
            .addTo(map);
        markers.push(marker);
    });

    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }

    if (window.routeLine) {
        map.removeLayer(window.routeLine);
    }
    if (pontos.length > 1) {
        const coordinates = pontos.map(p => [p.latitude, p.longitude]);
        window.routeLine = L.polyline(coordinates, { color: 'blue' }).addTo(map);
    }
}

async function removerPonto(id) {
    if (!confirm('Tem certeza que deseja remover este ponto?')) return;

    try {
        await fetch(`http://localhost:3000/pontos/${id}`, {
            method: 'DELETE'
        });

        const ponto = await (await fetch(`http://localhost:3000/pontos/${id}`)).json();
        await visualizarPontos(ponto.linha);
    } catch (error) {
        console.error('Erro ao remover ponto:', error);
    }
}

function centralizarNoPonto(lat, lng) {
    if (!map) return;

    map.setView([lat, lng], 16);
    markers.forEach(marker => {
        const markerLatLng = marker.getLatLng();
        if (markerLatLng.lat === lat && markerLatLng.lng === lng) {
            marker.openPopup();
        }
    });
}

function initializeMap() {
    if (!map) {
        map = L.map('route-map').setView([-23.5505, -46.6333], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    }
}

function editarPonto(id, lat, lng) {
    currentEditingPoint = id;
    const editForm = document.getElementById('edit-form');
    const latInput = editForm.querySelector('[name="edit-latitude"]');
    const lngInput = editForm.querySelector('[name="edit-longitude"]');

    latInput.value = lat;
    lngInput.value = lng;
    editForm.style.display = 'block';
}

async function salvarEdicaoPonto(event) {
    event.preventDefault();
    const form = event.target;
    const latitude = parseFloat(form.querySelector('[name="edit-latitude"]').value);
    const longitude = parseFloat(form.querySelector('[name="edit-longitude"]').value);

    if (!validarCoordenada(latitude) || !validarCoordenada(longitude)) {
        alert('Coordenadas inválidas');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/pontos/${currentEditingPoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                latitude,
                longitude
            })
        });

        if (response.ok) {
            form.style.display = 'none';
            visualizarPontos(selectedLine);
        }
    } catch (error) {
        console.error('Erro ao editar ponto:', error);
    }
}

function cancelarEdicao() {
    const editForm = document.getElementById('edit-form');
    editForm.style.display = 'none';
    currentEditingPoint = null;
}

document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    atualizarInterface();

    // Formulário de edição de pontos
    const editForm = document.getElementById('edit-form');
    if (editForm) {
        editForm.addEventListener('submit', salvarEdicaoPonto);

        const cancelBtn = editForm.querySelector('button[type="button"]');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', cancelarEdicao);
        }
    }

    const linhaForm = document.getElementById('linha-form');
    if (linhaForm) linhaForm.addEventListener('submit', cadastrarLinha);

    const pontoForm = document.getElementById('ponto-form');
    if (pontoForm) pontoForm.addEventListener('submit', adicionarPontoTemp);

    const salvarPontosBtn = document.getElementById('salvar-pontos');
    if (salvarPontosBtn) salvarPontosBtn.addEventListener('click', salvarPontos);
});