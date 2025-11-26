const firebaseConfig = {
    apiKey: "AIzaSyCVZ0MiX-Haa8rp2I1YpBkBBoA2YnK5GRQ",
    authDomain: "cultura-947db.firebaseapp.com",
    projectId: "cultura-947db",
    storageBucket: "cultura-947db.firebasestorage.app",
    messagingSenderId: "693000652015",
    appId: "1:693000652015:web:9fc3cf09204da2bf8e071a",
    measurementId: "G-BD5JNBJ565"
};

try {
    firebase.initializeApp(firebaseConfig);
} catch (error) {
    console.log("Firebase já inicializado ou erro na configuração");
}

const db = firebase.firestore();
const auth = firebase.auth();


let allEvents = [];
let allLocais = [];

document.addEventListener('DOMContentLoaded', function() {
    const imagemInput = document.getElementById('imagemEvento') || document.getElementById('imagemLocal');
    if (imagemInput) {
        imagemInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const previewContainer = document.getElementById('previewContainer');
                    const previewImage = document.getElementById('previewImage');
                    const currentImageStatus = document.getElementById('currentImageStatus');
                    
                    previewImage.src = e.target.result;
                    previewContainer.classList.remove('hidden');
                    if (currentImageStatus) {
                        currentImageStatus.textContent = 'Nova imagem selecionada';
                        currentImageStatus.style.color = '#2196F3';
                    }
                }
                reader.readAsDataURL(file);
            }
        });
    }

    
    const cadastroEventoForm = document.getElementById('cadastroEventoForm');
    if (cadastroEventoForm) {
        cadastroEventoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
        
            const editingEventId = localStorage.getItem('editingEventId');
            if (editingEventId) {
                updateEvento(editingEventId);
            } else {
                addEvento();
            }
        });
        
        
        loadLocaisForSelect();
        
        
        setupPrecosCalculation();
    }
    
    
    const cadastroLocalForm = document.getElementById('cadastroLocalForm');
    if (cadastroLocalForm) {
        cadastroLocalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            
            const editingLocalId = localStorage.getItem('editingLocalId');
            if (editingLocalId) {
                updateLocal(editingLocalId);
            } else {
                addLocal();
            }
        });
    }
    
    
    if (document.getElementById('allData')) {
        loadAllData();
    }
    
    
    checkEditMode();
});


function checkEditMode() {
    try {
        
        const editingEventId = localStorage.getItem('editingEventId');
        const editingEventData = localStorage.getItem('editingEventData');
        
        if (editingEventId && editingEventData) {
            const event = JSON.parse(editingEventData);
            
            
            document.getElementById('nomeEvento').value = event.nome || '';
            document.getElementById('localEvento').value = event.localId || '';
            document.getElementById('descricaoEvento').value = event.descricao || '';
            document.getElementById('dataEvento').value = event.data || '';
            document.getElementById('horaEvento').value = event.hora || '';
            document.getElementById('contatoEvento').value = event.contato || '';
            document.getElementById('observacoesEvento').value = event.observacoes || '';
            
            
            if (event.precos && event.precos.length > 0) {
                const precosContainer = document.getElementById('precosContainer');
                precosContainer.innerHTML = '';
                
                event.precos.forEach(preco => {
                    addPrecoItem(preco.nome, preco.valor);
                });
                
                calculateTotalPrecos();
            }
            
            
            if (event.imagemBase64) {
                const previewContainer = document.getElementById('previewContainer');
                const previewImage = document.getElementById('previewImage');
                const currentImageStatus = document.getElementById('currentImageStatus');
                
                previewImage.src = event.imagemBase64;
                previewContainer.classList.remove('hidden');
                if (currentImageStatus) {
                    currentImageStatus.textContent = 'Imagem atual carregada';
                    currentImageStatus.style.color = '#4CAF50';
                }
            }
            
            
            if (document.getElementById('pageTitle')) {
                document.getElementById('pageTitle').textContent = 'Editar Evento';
            }
            if (document.getElementById('formTitle')) {
                document.getElementById('formTitle').textContent = 'Editar Evento Cultural';
                document.getElementById('formDescription').textContent = 'Edite as informações do evento cultural existente';
                document.getElementById('submitButton').innerHTML = '<i class="fas fa-save"></i> Atualizar';
            }
        }
        
        
        const editingLocalId = localStorage.getItem('editingLocalId');
        const editingLocalData = localStorage.getItem('editingLocalData');
        
        if (editingLocalId && editingLocalData) {
            const local = JSON.parse(editingLocalData);
            
            
            document.getElementById('nomeLocal').value = local.nome || '';
            document.getElementById('tipoLocal').value = local.tipo || '';
            document.getElementById('descricaoLocal').value = local.descricao || '';
            document.getElementById('enderecoLocal').value = local.endereco || '';
            document.getElementById('bairroLocal').value = local.bairro || '';
            document.getElementById('capacidadeLocal').value = local.capacidade || '';
            document.getElementById('contatoLocal').value = local.contato || '';
            document.getElementById('observacoesLocal').value = local.observacoes || '';
            
            
            if (local.imagemBase64) {
                const previewContainer = document.getElementById('previewContainer');
                const previewImage = document.getElementById('previewImage');
                const currentImageStatus = document.getElementById('currentImageStatus');
                
                previewImage.src = local.imagemBase64;
                previewContainer.classList.remove('hidden');
                if (currentImageStatus) {
                    currentImageStatus.textContent = 'Imagem atual carregada';
                    currentImageStatus.style.color = '#4CAF50';
                }
            }
            
            
            if (document.getElementById('pageTitle')) {
                document.getElementById('pageTitle').textContent = 'Editar Local';
            }
            if (document.getElementById('formTitle')) {
                document.getElementById('formTitle').textContent = 'Editar Local Cultural';
                document.getElementById('formDescription').textContent = 'Edite as informações do local cultural existente';
                document.getElementById('submitButton').innerHTML = '<i class="fas fa-save"></i> Atualizar';
            }
        }
    } catch (error) {
        console.error('Erro no checkEditMode:', error);
    }
}


async function addEvento() {
    showLoading();
    
    const nomeEvento = document.getElementById('nomeEvento').value;
    const localEvento = document.getElementById('localEvento').value;
    const descricaoEvento = document.getElementById('descricaoEvento').value;
    const dataEvento = document.getElementById('dataEvento').value;
    const horaEvento = document.getElementById('horaEvento').value;
    const contatoEvento = document.getElementById('contatoEvento').value;
    const observacoesEvento = document.getElementById('observacoesEvento').value;
    const imagemEvento = document.getElementById('imagemEvento').files[0];
    

    const precos = [];
    const precoItems = document.querySelectorAll('.preco-item');
    precoItems.forEach(item => {
        const nome = item.querySelector('.preco-nome').value;
        const valor = parseFloat(item.querySelector('.preco-valor').value);
        
        if (nome && !isNaN(valor)) {
            precos.push({ nome, valor });
        }
    });
    
    try {
        let imagemBase64 = '';
        
        
        if (imagemEvento) {
            imagemBase64 = await compressAndConvertImage(imagemEvento);
        }
        
        
        await db.collection('eventos').add({
            nome: nomeEvento,
            localId: localEvento,
            descricao: descricaoEvento,
            data: dataEvento,
            hora: horaEvento,
            contato: contatoEvento,
            observacoes: observacoesEvento,
            precos: precos,
            imagemBase64: imagemBase64,
            dataCadastro: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        hideLoading();
        showMessage('Evento cadastrado com sucesso!', 'success');
        document.getElementById('cadastroEventoForm').reset();
        document.getElementById('previewContainer').classList.add('hidden');
        document.getElementById('precosContainer').innerHTML = '<div class="preco-item"><input type="text" class="preco-nome" placeholder="Nome do serviço (ex: Palco)"><input type="number" class="preco-valor" placeholder="Valor (R$)" min="0" step="0.01"><button type="button" class="btn-remove" onclick="removePrecoItem(this)"><i class="fas fa-trash"></i></button></div>';
        document.getElementById('totalPrecos').textContent = '0.00';
        
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        hideLoading();
        showMessage('Erro ao cadastrar evento: ' + error.message, 'error');
    }
}


async function addLocal() {
    showLoading();
    
    const nomeLocal = document.getElementById('nomeLocal').value;
    const tipoLocal = document.getElementById('tipoLocal').value;
    const descricaoLocal = document.getElementById('descricaoLocal').value;
    const enderecoLocal = document.getElementById('enderecoLocal').value;
    const bairroLocal = document.getElementById('bairroLocal').value;
    const capacidadeLocal = document.getElementById('capacidadeLocal').value;
    const contatoLocal = document.getElementById('contatoLocal').value;
    const observacoesLocal = document.getElementById('observacoesLocal').value;
    const imagemLocal = document.getElementById('imagemLocal').files[0];
    
    try {
        let imagemBase64 = '';
        
        
        if (imagemLocal) {
            imagemBase64 = await compressAndConvertImage(imagemLocal);
        }
        
        
        await db.collection('locais').add({
            nome: nomeLocal,
            tipo: tipoLocal,
            descricao: descricaoLocal,
            endereco: enderecoLocal,
            bairro: bairroLocal,
            capacidade: capacidadeLocal,
            contato: contatoLocal,
            observacoes: observacoesLocal,
            imagemBase64: imagemBase64,
            dataCadastro: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        hideLoading();
        showMessage('Local cadastrado com sucesso!', 'success');
        document.getElementById('cadastroLocalForm').reset();
        document.getElementById('previewContainer').classList.add('hidden');
        
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        hideLoading();
        showMessage('Erro ao cadastrar local: ' + error.message, 'error');
    }
}


function compressAndConvertImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                
                const base64 = canvas.toDataURL('image/jpeg', quality);
                resolve(base64);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}


async function loadAllData() {
    showLoading();
    
    try {
        
        const eventosSnapshot = await db.collection('eventos')
            .orderBy('dataCadastro', 'desc')
            .get();
        
        allEvents = [];
        eventosSnapshot.forEach(doc => {
            allEvents.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
    
        const locaisSnapshot = await db.collection('locais')
            .orderBy('dataCadastro', 'desc')
            .get();
        
        allLocais = [];
        locaisSnapshot.forEach(doc => {
            allLocais.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        displayLocaisComEventos();
        document.getElementById('todosDadosCount').textContent = `${allEvents.length + allLocais.length} registros`;
        hideLoading();
        
    } catch (error) {
        hideLoading();
        showMessage('Erro ao carregar dados: ' + error.message, 'error');
    }
}


function displayLocaisComEventos() {
    const container = document.getElementById('allData');
    
    if (allLocais.length === 0) {
        container.innerHTML = '<p>Nenhum local cadastrado ainda.</p>';
        return;
    }
    
    container.innerHTML = allLocais.map(local => {
        const eventosDoLocal = allEvents.filter(event => event.localId === local.id);
        
        return `
        <div class="local-com-evento">
            <div class="local-header">
                <div class="local-info">
                    ${local.imagemBase64 ? 
                        `<img src="${local.imagemBase64}" alt="${local.nome}" class="local-imagem">` : 
                        '<div class="local-imagem" style="display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.5); background: linear-gradient(135deg, #1a2a6c, #b21f1f);"><i class="fas fa-image fa-2x"></i></div>'
                    }
                    <div class="local-nome" onclick="viewLocalDetails('${local.id}')">${local.nome}</div>
                    <div class="local-descricao">${local.descricao || 'Sem descrição disponível.'}</div>
                    
                    <div class="local-detalhes">
                        <div class="local-detalhe">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${local.bairro}</span>
                        </div>
                        ${local.capacidade ? `
                        <div class="local-detalhe">
                            <i class="fas fa-users"></i>
                            <span>Capacidade: ${local.capacidade}</span>
                        </div>
                        ` : ''}
                        <div class="local-detalhe">
                            <i class="fas fa-calendar"></i>
                            <span>${eventosDoLocal.length} evento(s)</span>
                        </div>
                        <div class="local-detalhe">
                            <i class="fas fa-clock"></i>
                            <span>${formatFirebaseDate(local.dataCadastro)}</span>
                        </div>
                    </div>
                    
                    <div class="local-actions">
                        <button class="btn-edit" onclick="editLocal('${local.id}')">
                            <i class="fas fa-edit"></i> Editar Local
                        </button>
                        <button class="btn-delete" onclick="deleteLocal('${local.id}')">
                            <i class="fas fa-trash"></i> Excluir Local
                        </button>
                    </div>
                </div>
                
                <div class="eventos-do-local">
                    <h3 style="margin-bottom: 15px; color: #fdbb2d;">Eventos neste Local</h3>
                    <div class="eventos-lista">
                        ${eventosDoLocal.length > 0 ? 
                            eventosDoLocal.map(evento => `
                                <div class="evento-no-local" onclick="viewEventDetails('${evento.id}')">
                                    <div class="evento-nome">${evento.nome}</div>
                                    <div class="evento-descricao">${evento.descricao || 'Sem descrição'}</div>
                                    <div class="evento-data">
                                        <i class="fas fa-calendar"></i>
                                        ${formatDate(evento.data)} às ${evento.hora || '--:--'}
                                    </div>
                                    <div class="evento-preco">
                                        <i class="fas fa-dollar-sign"></i>
                                        Total: R$ ${calculateTotalPrecosEvento(evento.precos)}
                                    </div>
                                    <div class="evento-acoes">
                                        <button class="btn-prices" onclick="event.stopPropagation(); viewPrices('${evento.id}')">
                                            <i class="fas fa-dollar-sign"></i> Preços
                                        </button>
                                        <button class="btn-edit" onclick="event.stopPropagation(); editEvent('${evento.id}')">
                                            <i class="fas fa-edit"></i> Editar
                                        </button>
                                        <button class="btn-delete" onclick="event.stopPropagation(); deleteEvent('${evento.id}')">
                                            <i class="fas fa-trash"></i> Excluir
                                        </button>
                                    </div>
                                </div>
                            `).join('') : 
                            '<p style="text-align: center; opacity: 0.7; grid-column: 1 / -1;">Nenhum evento cadastrado neste local.</p>'
                        }
                    </div>
                </div>
            </div>
        </div>
    `}).join('');
}


async function loadLocaisForSelect() {
    try {
        const snapshot = await db.collection('locais')
            .orderBy('nome')
            .get();
        
        const select = document.getElementById('localEvento');
        select.innerHTML = '<option value="">Selecione o local</option>';
        
        snapshot.forEach(doc => {
            const local = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = local.nome;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar locais:', error);
    }
}


function addPrecoItem(nome = '', valor = '') {
    const container = document.getElementById('precosContainer');
    const div = document.createElement('div');
    div.className = 'preco-item';
    div.innerHTML = `
        <input type="text" class="preco-nome" placeholder="Nome do serviço (ex: Palco)" value="${nome}">
        <input type="number" class="preco-valor" placeholder="Valor (R$)" min="0" step="0.01" value="${valor}">
        <button type="button" class="btn-remove" onclick="removePrecoItem(this)"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(div);
    
    
    const inputs = div.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', calculateTotalPrecos);
    });
}

function removePrecoItem(button) {
    const container = document.getElementById('precosContainer');
    if (container.children.length > 1) {
        button.parentElement.remove();
        calculateTotalPrecos();
    }
}

function setupPrecosCalculation() {
    const container = document.getElementById('precosContainer');
    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', calculateTotalPrecos);
    });
}

function calculateTotalPrecos() {
    const precoItems = document.querySelectorAll('.preco-item');
    let total = 0;
    
    precoItems.forEach(item => {
        const valor = parseFloat(item.querySelector('.preco-valor').value);
        if (!isNaN(valor)) {
            total += valor;
        }
    });
    
    document.getElementById('totalPrecos').textContent = total.toFixed(2);
}

function calculateTotalPrecosEvento(precos) {
    if (!precos || precos.length === 0) return '0.00';
    
    const total = precos.reduce((sum, preco) => sum + preco.valor, 0);
    return total.toFixed(2);
}


function viewEventDetails(eventId) {
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return;
    
    const local = allLocais.find(l => l.id === event.localId);
    const localNome = local ? local.nome : 'Local não encontrado';
    const localEndereco = local ? local.endereco : 'Endereço não disponível';
    
    const modalBody = document.getElementById('eventModalBody');
    modalBody.innerHTML = `
        ${event.imagemBase64 ? `<img src="${event.imagemBase64}" alt="${event.nome}" class="modal-image">` : ''}
        <h2>${event.nome}</h2>
        <p>${event.descricao || 'Sem descrição'}</p>
        
        <div class="modal-details">
            <div class="modal-detail">
                <span class="modal-label">Local:</span> ${localNome}
            </div>
            <div class="modal-detail">
                <span class="modal-label">Endereço:</span> ${localEndereco}
            </div>
            <div class="modal-detail">
                <span class="modal-label">Data:</span> ${formatDate(event.data)}
            </div>
            <div class="modal-detail">
                <span class="modal-label">Hora:</span> ${event.hora || 'Não definida'}
            </div>
            ${event.contato ? `
            <div class="modal-detail">
                <span class="modal-label">Contato:</span> ${event.contato}
            </div>
            ` : ''}
            <div class="modal-detail">
                <span class="modal-label">Data de Cadastro:</span> ${formatFirebaseDate(event.dataCadastro)}
            </div>
        </div>
        
        ${event.observacoes ? `
        <div style="margin-top: 20px;">
            <span class="modal-label">Observações:</span>
            <p>${event.observacoes}</p>
        </div>
        ` : ''}
        
        <div style="margin-top: 25px; display: flex; gap: 10px;">
            <button class="btn-prices" onclick="viewPrices('${event.id}')">
                <i class="fas fa-dollar-sign"></i> Ver Preços
            </button>
            <button class="btn-edit" onclick="editEvent('${event.id}')">
                <i class="fas fa-edit"></i> Editar Evento
            </button>
        </div>
    `;
    
    document.getElementById('eventDetailsModal').classList.remove('hidden');
}


function viewLocalDetails(localId) {
    const local = allLocais.find(l => l.id === localId);
    if (!local) return;
    
    const eventosDoLocal = allEvents.filter(event => event.localId === local.id);
    
    const modalBody = document.getElementById('eventModalBody');
    modalBody.innerHTML = `
        ${local.imagemBase64 ? `<img src="${local.imagemBase64}" alt="${local.nome}" class="modal-image">` : ''}
        <h2>${local.nome}</h2>
        <p>${local.descricao || 'Sem descrição'}</p>
        
        <div class="modal-details">
            <div class="modal-detail">
                <span class="modal-label">Tipo:</span> ${getTipoLocalText(local.tipo)}
            </div>
            <div class="modal-detail">
                <span class="modal-label">Endereço:</span> ${local.endereco}
            </div>
            <div class="modal-detail">
                <span class="modal-label">Bairro:</span> ${local.bairro}
            </div>
            ${local.capacidade ? `
            <div class="modal-detail">
                <span class="modal-label">Capacidade:</span> ${local.capacidade} pessoas
            </div>
            ` : ''}
            ${local.contato ? `
            <div class="modal-detail">
                <span class="modal-label">Contato:</span> ${local.contato}
            </div>
            ` : ''}
            <div class="modal-detail">
                <span class="modal-label">Eventos neste local:</span> ${eventosDoLocal.length}
            </div>
            <div class="modal-detail">
                <span class="modal-label">Data de Cadastro:</span> ${formatFirebaseDate(local.dataCadastro)}
            </div>
        </div>
        
        ${local.observacoes ? `
        <div style="margin-top: 20px;">
            <span class="modal-label">Observações:</span>
            <p>${local.observacoes}</p>
        </div>
        ` : ''}
        
        <div style="margin-top: 25px;">
            <button class="btn-edit" onclick="editLocal('${local.id}')">
                <i class="fas fa-edit"></i> Editar Local
            </button>
        </div>
    `;
    
    document.getElementById('eventDetailsModal').classList.remove('hidden');
}


function viewPrices(eventId) {
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return;
    
    const modalBody = document.getElementById('pricesModalBody');
    
    let precosHTML = '';
    if (event.precos && event.precos.length > 0) {
        precosHTML = `
            <h3>Serviços Contratados</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <thead>
                    <tr style="background: rgba(255,255,255,0.1);">
                        <th style="padding: 10px; text-align: left;">Serviço</th>
                        <th style="padding: 10px; text-align: right;">Valor (R$)</th>
                    </tr>
                </thead>
                <tbody>
                    ${event.precos.map(preco => `
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <td style="padding: 10px;">${preco.nome}</td>
                            <td style="padding: 10px; text-align: right;">${preco.valor.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr style="background: rgba(255,255,255,0.1); font-weight: bold;">
                        <td style="padding: 10px;">TOTAL</td>
                        <td style="padding: 10px; text-align: right;">R$ ${calculateTotalPrecosEvento(event.precos)}</td>
                    </tr>
                </tfoot>
            </table>
        `;
    } else {
        precosHTML = '<p>Nenhum serviço cadastrado para este evento.</p>';
    }
    
    modalBody.innerHTML = `
        <h2>Preços - ${event.nome}</h2>
        ${precosHTML}
    `;
    
    document.getElementById('pricesModal').classList.remove('hidden');
}


function closeEventModal() {
    document.getElementById('eventDetailsModal').classList.add('hidden');
}

function closePricesModal() {
    document.getElementById('pricesModal').classList.add('hidden');
}


function editEvent(eventId) {
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return;
    
    
    localStorage.setItem('editingEventId', eventId);
    localStorage.setItem('editingEventData', JSON.stringify(event));
    
    
    window.location.href = 'adicionar-evento.html';
}


function editLocal(localId) {
    const local = allLocais.find(l => l.id === localId);
    if (!local) return;
    
    
    localStorage.setItem('editingLocalId', localId);
    localStorage.setItem('editingLocalData', JSON.stringify(local));
    
    
    window.location.href = 'adicionar-local.html';
}


async function updateEvento(eventId) {
    showLoading();
    
    const nomeEvento = document.getElementById('nomeEvento').value;
    const localEvento = document.getElementById('localEvento').value;
    const descricaoEvento = document.getElementById('descricaoEvento').value;
    const dataEvento = document.getElementById('dataEvento').value;
    const horaEvento = document.getElementById('horaEvento').value;
    const contatoEvento = document.getElementById('contatoEvento').value;
    const observacoesEvento = document.getElementById('observacoesEvento').value;
    const imagemEvento = document.getElementById('imagemEvento').files[0];
    
    
    const precos = [];
    const precoItems = document.querySelectorAll('.preco-item');
    precoItems.forEach(item => {
        const nome = item.querySelector('.preco-nome').value;
        const valor = parseFloat(item.querySelector('.preco-valor').value);
        
        if (nome && !isNaN(valor)) {
            precos.push({ nome, valor });
        }
    });
    
    try {
        let imagemBase64 = '';
        

        const eventDoc = await db.collection('eventos').doc(eventId).get();
        if (eventDoc.exists) {
            const currentData = eventDoc.data();
            imagemBase64 = currentData.imagemBase64 || '';
        }
        
        
        if (imagemEvento) {
            imagemBase64 = await compressAndConvertImage(imagemEvento);
        }
        
        
        const updateData = {
            nome: nomeEvento,
            localId: localEvento,
            descricao: descricaoEvento,
            data: dataEvento,
            hora: horaEvento,
            contato: contatoEvento,
            observacoes: observacoesEvento,
            precos: precos,
            dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        
        if (imagemBase64) {
            updateData.imagemBase64 = imagemBase64;
        }
        
        console.log('Atualizando evento existente:', eventId, updateData);
        
        
        await db.collection('eventos').doc(eventId).update(updateData);
        
        hideLoading();
        showMessage('Evento atualizado com sucesso!', 'success');
        
        
        localStorage.removeItem('editingEventId');
        localStorage.removeItem('editingEventData');
        
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        hideLoading();
        showMessage('Erro ao atualizar evento: ' + error.message, 'error');
        console.error('Erro detalhado:', error);
    }
}


async function updateLocal(localId) {
    showLoading();
    
    const nomeLocal = document.getElementById('nomeLocal').value;
    const tipoLocal = document.getElementById('tipoLocal').value;
    const descricaoLocal = document.getElementById('descricaoLocal').value;
    const enderecoLocal = document.getElementById('enderecoLocal').value;
    const bairroLocal = document.getElementById('bairroLocal').value;
    const capacidadeLocal = document.getElementById('capacidadeLocal').value;
    const contatoLocal = document.getElementById('contatoLocal').value;
    const observacoesLocal = document.getElementById('observacoesLocal').value;
    const imagemLocal = document.getElementById('imagemLocal').files[0];
    
    try {
        let imagemBase64 = '';
        
        
        const localDoc = await db.collection('locais').doc(localId).get();
        if (localDoc.exists) {
            const currentData = localDoc.data();
            imagemBase64 = currentData.imagemBase64 || '';
        }
        
        
        if (imagemLocal) {
            imagemBase64 = await compressAndConvertImage(imagemLocal);
        }
        
        
        const updateData = {
            nome: nomeLocal,
            tipo: tipoLocal,
            descricao: descricaoLocal,
            endereco: enderecoLocal,
            bairro: bairroLocal,
            capacidade: capacidadeLocal,
            contato: contatoLocal,
            observacoes: observacoesLocal,
            dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        
        if (imagemBase64) {
            updateData.imagemBase64 = imagemBase64;
        }
        
        console.log('Atualizando local existente:', localId, updateData);
        
        
        await db.collection('locais').doc(localId).update(updateData);
        
        hideLoading();
        showMessage('Local atualizado com sucesso!', 'success');
        
        
        localStorage.removeItem('editingLocalId');
        localStorage.removeItem('editingLocalData');
        
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        hideLoading();
        showMessage('Erro ao atualizar local: ' + error.message, 'error');
        console.error('Erro detalhado:', error);
    }
}


async function deleteEvent(eventId) {
    if (!confirm('Tem certeza que deseja excluir este evento?')) {
        return;
    }
    
    showLoading();
    
    try {
        await db.collection('eventos').doc(eventId).delete();
        hideLoading();
        showMessage('Evento excluído com sucesso!', 'success');
        
        
        loadAllData();
        
    } catch (error) {
        hideLoading();
        showMessage('Erro ao excluir evento: ' + error.message, 'error');
    }
}


async function deleteLocal(localId) {
    if (!confirm('Tem certeza que deseja excluir este local? Todos os eventos associados a ele também serão excluídos.')) {
        return;
    }
    
    showLoading();
    
    try {
        
        const eventosSnapshot = await db.collection('eventos')
            .where('localId', '==', localId)
            .get();
        
        const batch = db.batch();
        eventosSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        
        await db.collection('locais').doc(localId).delete();
        
        hideLoading();
        showMessage('Local e eventos associados excluídos com sucesso!', 'success');
        
        
        loadAllData();
        
    } catch (error) {
        hideLoading();
        showMessage('Erro ao excluir local: ' + error.message, 'error');
    }
}


function filterData() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        displayLocaisComEventos();
        return;
    }
    
    
    const filteredLocais = allLocais.filter(local => 
        local.nome.toLowerCase().includes(searchTerm) ||
        (local.descricao && local.descricao.toLowerCase().includes(searchTerm)) ||
        local.bairro.toLowerCase().includes(searchTerm) ||
        local.endereco.toLowerCase().includes(searchTerm)
    );
    
    
    const filteredEvents = allEvents.filter(event => 
        event.nome.toLowerCase().includes(searchTerm) ||
        (event.descricao && event.descricao.toLowerCase().includes(searchTerm))
    );
    
    
    const locaisComEventosFiltrados = filteredLocais.map(local => {
        const eventosDoLocal = filteredEvents.filter(event => event.localId === local.id);
        return { ...local, eventos: eventosDoLocal };
    });
    
    
    displayFilteredResults(locaisComEventosFiltrados);
}

function displayFilteredResults(locaisComEventos) {
    const container = document.getElementById('allData');
    
    if (locaisComEventos.length === 0) {
        container.innerHTML = '<p>Nenhum local ou evento encontrado com os critérios de busca.</p>';
        return;
    }
    
    container.innerHTML = locaisComEventos.map(item => {
        const eventosDoLocal = item.eventos || [];
        
        return `
        <div class="local-com-evento">
            <div class="local-header">
                <div class="local-info">
                    ${item.imagemBase64 ? 
                        `<img src="${item.imagemBase64}" alt="${item.nome}" class="local-imagem">` : 
                        '<div class="local-imagem" style="display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.5); background: linear-gradient(135deg, #1a2a6c, #b21f1f);"><i class="fas fa-image fa-2x"></i></div>'
                    }
                    <div class="local-nome" onclick="viewLocalDetails('${item.id}')">${item.nome}</div>
                    <div class="local-descricao">${item.descricao || 'Sem descrição disponível.'}</div>
                    
                    <div class="local-detalhes">
                        <div class="local-detalhe">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${item.bairro}</span>
                        </div>
                        ${item.capacidade ? `
                        <div class="local-detalhe">
                            <i class="fas fa-users"></i>
                            <span>Capacidade: ${item.capacidade}</span>
                        </div>
                        ` : ''}
                        <div class="local-detalhe">
                            <i class="fas fa-calendar"></i>
                            <span>${eventosDoLocal.length} evento(s)</span>
                        </div>
                        <div class="local-detalhe">
                            <i class="fas fa-clock"></i>
                            <span>${formatFirebaseDate(item.dataCadastro)}</span>
                        </div>
                    </div>
                    
                    <div class="local-actions">
                        <button class="btn-edit" onclick="editLocal('${item.id}')">
                            <i class="fas fa-edit"></i> Editar Local
                        </button>
                        <button class="btn-delete" onclick="deleteLocal('${item.id}')">
                            <i class="fas fa-trash"></i> Excluir Local
                        </button>
                    </div>
                </div>
                
                <div class="eventos-do-local">
                    <h3 style="margin-bottom: 15px; color: #fdbb2d;">Eventos neste Local</h3>
                    <div class="eventos-lista">
                        ${eventosDoLocal.length > 0 ? 
                            eventosDoLocal.map(evento => `
                                <div class="evento-no-local" onclick="viewEventDetails('${evento.id}')">
                                    <div class="evento-nome">${evento.nome}</div>
                                    <div class="evento-descricao">${evento.descricao || 'Sem descrição'}</div>
                                    <div class="evento-data">
                                        <i class="fas fa-calendar"></i>
                                        ${formatDate(evento.data)} às ${evento.hora || '--:--'}
                                    </div>
                                    <div class="evento-preco">
                                        <i class="fas fa-dollar-sign"></i>
                                        Total: R$ ${calculateTotalPrecosEvento(evento.precos)}
                                    </div>
                                    <div class="evento-acoes">
                                        <button class="btn-prices" onclick="event.stopPropagation(); viewPrices('${evento.id}')">
                                            <i class="fas fa-dollar-sign"></i> Preços
                                        </button>
                                        <button class="btn-edit" onclick="event.stopPropagation(); editEvent('${evento.id}')">
                                            <i class="fas fa-edit"></i> Editar
                                        </button>
                                        <button class="btn-delete" onclick="event.stopPropagation(); deleteEvent('${evento.id}')">
                                            <i class="fas fa-trash"></i> Excluir
                                        </button>
                                    </div>
                                </div>
                            `).join('') : 
                            '<p style="text-align: center; opacity: 0.7; grid-column: 1 / -1;">Nenhum evento encontrado.</p>'
                        }
                    </div>
                </div>
            </div>
        </div>
    `}).join('');
}


function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function formatFirebaseDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate();
    return date.toLocaleDateString('pt-BR');
}

function getTipoLocalText(tipo) {
    const tipos = {
        'teatro': 'Teatro',
        'galeria': 'Galeria',
        'museu': 'Museu',
        'centro-cultural': 'Centro Cultural',
        'biblioteca': 'Biblioteca',
        'cinema': 'Cinema',
        'outro': 'Outro'
    };
    
    return tipos[tipo] || tipo;
}


function showLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.remove('loading-hidden');
    }
}

function hideLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('loading-hidden');
    }
}


function showMessage(message, type) {
    const mensagemDiv = document.getElementById('mensagem');
    if (mensagemDiv) {
        mensagemDiv.textContent = message;
        mensagemDiv.className = type;
        
        setTimeout(() => {
            mensagemDiv.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}


async function exportData() {
    showLoading();
    
    try {
        
        const eventosSnapshot = await db.collection('eventos').get();
        const eventosData = [];
        
        eventosSnapshot.forEach(doc => {
            const eventData = doc.data();
            eventosData.push({
                id: doc.id,
                nome: eventData.nome,
                localId: eventData.localId,
                descricao: eventData.descricao,
                data: eventData.data,
                hora: eventData.hora,
                contato: eventData.contato,
                observacoes: eventData.observacoes,
                precos: eventData.precos,
                imagemBase64: eventData.imagemBase64,
                dataCadastro: eventData.dataCadastro ? eventData.dataCadastro.toDate().toISOString() : null
            });
        });
        
        
        const locaisSnapshot = await db.collection('locais').get();
        const locaisData = [];
        
        locaisSnapshot.forEach(doc => {
            const localData = doc.data();
            locaisData.push({
                id: doc.id,
                nome: localData.nome,
                tipo: localData.tipo,
                descricao: localData.descricao,
                endereco: localData.endereco,
                bairro: localData.bairro,
                capacidade: localData.capacidade,
                contato: localData.contato,
                observacoes: localData.observacoes,
                imagemBase64: localData.imagemBase64,
                dataCadastro: localData.dataCadastro ? localData.dataCadastro.toDate().toISOString() : null
            });
        });
        
        const data = {
            eventos: eventosData,
            locais: locaisData,
            exportDate: new Date().toISOString()
        };
        
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup-cultural-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        hideLoading();
        showMessage('Backup exportado com sucesso!', 'success');
        
    } catch (error) {
        hideLoading();
        showMessage('Erro ao exportar backup: ' + error.message, 'error');
    }
}

async function importData(file) {
    if (!file) return;
    
    if (!confirm('Esta ação irá substituir todos os dados atuais. Tem certeza?')) {
        return;
    }
    
    showLoading();
    
    try {
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                
                const eventosSnapshot = await db.collection('eventos').get();
                const locaisSnapshot = await db.collection('locais').get();
                
                const batch = db.batch();
                
                eventosSnapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                locaisSnapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                await batch.commit();
                
                
                for (const item of data.locais) {
                    const { id, ...localData } = item;
                    
                    if (localData.dataCadastro) {
                        localData.dataCadastro = firebase.firestore.Timestamp.fromDate(new Date(localData.dataCadastro));
                    }
                    await db.collection('locais').add(localData);
                }
                
                
                for (const item of data.eventos) {
                    const { id, ...eventData } = item;
                    
                    if (eventData.dataCadastro) {
                        eventData.dataCadastro = firebase.firestore.Timestamp.fromDate(new Date(eventData.dataCadastro));
                    }
                    await db.collection('eventos').add(eventData);
                }
                
                hideLoading();
                showMessage('Dados importados com sucesso!', 'success');
                
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                
            } catch (parseError) {
                hideLoading();
                showMessage('Erro ao processar arquivo: ' + parseError.message, 'error');
            }
        };
        
        reader.readAsText(file);
        
    } catch (error) {
        hideLoading();
        showMessage('Erro ao importar dados: ' + error.message, 'error');
    }
}


function cancelEdit() {
    
    localStorage.removeItem('editingEventId');
    localStorage.removeItem('editingEventData');
    localStorage.removeItem('editingLocalId');
    localStorage.removeItem('editingLocalData');
    

    window.location.href = 'index.html';

}
