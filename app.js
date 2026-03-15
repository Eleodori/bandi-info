// === Auth ===
(function checkAuth() {
  if (sessionStorage.getItem('bandi_auth') === 'ok') {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
  }
})();

function doLogin(e) {
  e.preventDefault();
  var pwd = document.getElementById('login-password').value;
  var errEl = document.getElementById('login-error');
  if (pwd === 'bandi2026') {
    sessionStorage.setItem('bandi_auth', 'ok');
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
  } else {
    errEl.textContent = 'Password errata. Riprova.';
    errEl.style.display = 'block';
    document.getElementById('login-password').value = '';
  }
}

// === Config ===
const CONFIG = {
  apiBase: 'https://maritsrl.app.n8n.cloud/webhook',
  tenant_id: 'default',
  chatWebhookId: 'bandi-chat'
};

const API = {
  upload: CONFIG.apiBase + '/bandi-upload',
  list: CONFIG.apiBase + '/bandi-lista',
  delete: CONFIG.apiBase + '/bandi-elimina',
  chat: CONFIG.apiBase + '/' + CONFIG.chatWebhookId + '/chat'
};

let sessionId = crypto.randomUUID ? crypto.randomUUID() : 'session_' + Math.random().toString(36).substr(2, 9);
let bandiData = [];
let chatHistory = [];

// === Toast Notifications ===
function showToast(message, type) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = '<span class="toast-icon">' + (type === 'success' ? '\u2705' : '\u274c') + '</span><span>' + message + '</span>';
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3000);
}

// === Button Ripple Effect ===
document.addEventListener('click', function (e) {
  var btn = e.target.closest('.btn');
  if (!btn) return;
  var ripple = document.createElement('span');
  ripple.className = 'btn-ripple';
  var rect = btn.getBoundingClientRect();
  var size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
  ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', function () { ripple.remove(); });
});

// === Tab Navigation ===
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

function switchToTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
  document.getElementById('tab-' + tabName).classList.add('active');
}

// === File Upload Drag & Drop ===
const fileInput = document.getElementById('pdf_file');
const fileDrop = document.getElementById('file-drop');
const fileName = document.getElementById('file-name');

fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) fileName.textContent = fileInput.files[0].name;
});

fileDrop.addEventListener('dragover', e => { e.preventDefault(); fileDrop.classList.add('dragover'); });
fileDrop.addEventListener('dragleave', () => fileDrop.classList.remove('dragover'));
fileDrop.addEventListener('drop', e => {
  e.preventDefault();
  fileDrop.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) {
    fileInput.files = e.dataTransfer.files;
    fileName.textContent = e.dataTransfer.files[0].name;
  }
});

// === Skeleton Loading HTML ===
function getSkeletonHTML() {
  var html = '';
  for (var i = 0; i < 3; i++) {
    html += '<div class="skeleton-card"><div class="skeleton-line short"></div><div class="skeleton-line medium"></div></div>';
  }
  return html;
}

// === Empty State HTML ===
function getEmptyStateHTML() {
  return '<div class="empty-state">' +
    '<div class="empty-state-illustration">' +
      '<svg width="80" height="80" viewBox="0 0 80 80" fill="none">' +
        '<rect x="16" y="8" width="48" height="60" rx="6" stroke="#cbd5e1" stroke-width="2" fill="#f8fafc"/>' +
        '<rect x="20" y="12" width="40" height="52" rx="4" stroke="#e2e8f0" stroke-width="1.5" fill="#fff"/>' +
        '<line x1="28" y1="28" x2="52" y2="28" stroke="#e2e8f0" stroke-width="2" stroke-linecap="round"/>' +
        '<line x1="28" y1="36" x2="46" y2="36" stroke="#e2e8f0" stroke-width="2" stroke-linecap="round"/>' +
        '<line x1="28" y1="44" x2="50" y2="44" stroke="#e2e8f0" stroke-width="2" stroke-linecap="round"/>' +
        '<circle cx="58" cy="56" r="14" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>' +
        '<line x1="58" y1="50" x2="58" y2="62" stroke="#2563eb" stroke-width="2" stroke-linecap="round"/>' +
        '<line x1="52" y1="56" x2="64" y2="56" stroke="#2563eb" stroke-width="2" stroke-linecap="round"/>' +
      '</svg>' +
    '</div>' +
    '<h3>Nessun bando caricato</h3>' +
    '<p>Carica il tuo primo bando PDF per iniziare</p>' +
    '<button class="btn btn-primary" onclick="switchToTab(\'upload\')">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
      'Carica un bando' +
    '</button>' +
  '</div>';
}

// === Sort Bandi: active first (ascending by date), expired last (ascending by date) ===
function sortBandi(bandi) {
  var now = new Date();
  return bandi.slice().sort(function (a, b) {
    var dateA = a.data_scadenza ? new Date(a.data_scadenza) : null;
    var dateB = b.data_scadenza ? new Date(b.data_scadenza) : null;
    var expiredA = dateA ? dateA < now : false;
    var expiredB = dateB ? dateB < now : false;
    // Active before expired
    if (expiredA !== expiredB) return expiredA ? 1 : -1;
    // Within same group, sort by date ascending (soonest first)
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateA - dateB;
  });
}

// === Render Bandi List ===
function renderBandi(bandi) {
  var container = document.getElementById('bandi-list');
  if (bandi.length === 0) {
    var searchVal = document.getElementById('bandi-search') ? document.getElementById('bandi-search').value.trim() : '';
    if (searchVal) {
      container.innerHTML = '<div class="empty-state"><p>Nessun bando trovato per "' + searchVal.replace(/</g, '&lt;') + '"</p></div>';
    } else {
      container.innerHTML = getEmptyStateHTML();
    }
    return;
  }
  container.innerHTML = bandi.map(function (bando, i) {
    var scadenza = bando.data_scadenza ? new Date(bando.data_scadenza).toLocaleDateString('it-IT') : 'N/D';
    var isExpired = bando.data_scadenza && new Date(bando.data_scadenza) < new Date();
    var badgeClass = isExpired ? 'scaduto' : 'attivo';
    var badgeText = isExpired ? 'Scaduto' : 'Attivo';
    return '<div class="bando-card status-' + badgeClass + '" style="animation-delay:' + (i * 0.05) + 's">' +
      '<div class="bando-info">' +
        '<h3>' + bando.nome_bando + '</h3>' +
        '<div class="bando-meta">' +
          '<span class="badge-scadenza ' + badgeClass + '">' + badgeText + ' \u2022 ' + scadenza + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="bando-actions">' +
        '<button class="btn btn-danger" onclick="openDeleteModal(\'' + bando.nome_bando.replace(/'/g, "\\'") + '\')">Elimina</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

// === Search/Filter Bandi ===
function filterBandi() {
  var query = document.getElementById('bandi-search').value.trim().toLowerCase();
  if (!query) {
    renderBandi(sortBandi(bandiData));
    return;
  }
  var filtered = bandiData.filter(function (b) {
    return b.nome_bando.toLowerCase().indexOf(query) !== -1;
  });
  renderBandi(sortBandi(filtered));
}

// === Load Bandi ===
async function loadBandi() {
  const container = document.getElementById('bandi-list');
  container.innerHTML = getSkeletonHTML();
  try {
    const response = await fetch(API.list + '?tenant_id=' + CONFIG.tenant_id);
    const data = await response.json();
    bandiData = data.bandi || [];
    if (bandiData.length === 0) {
      container.innerHTML = getEmptyStateHTML();
      return;
    }
    renderBandi(sortBandi(bandiData));
  } catch (err) {
    container.innerHTML = '<div class="empty-state" style="color:#ef4444;">Errore nel caricamento: ' + err.message + '</div>';
  }
}

// === Upload Form ===
document.getElementById('upload-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('btn-upload');
  const btnText = btn.querySelector('.btn-text');
  const btnLoading = btn.querySelector('.btn-loading');
  const resultDiv = document.getElementById('upload-result');
  btn.disabled = true;
  btnText.style.display = 'none';
  btnLoading.style.display = 'inline-flex';
  resultDiv.className = 'result-message';
  resultDiv.style.display = 'none';

  const formData = new FormData();
  formData.append('file', document.getElementById('pdf_file').files[0]);
  formData.append('nome_bando', document.getElementById('nome_bando').value);
  formData.append('data_scadenza', document.getElementById('data_scadenza').value);
  formData.append('tenant_id', CONFIG.tenant_id);

  try {
    const response = await fetch(API.upload, { method: 'POST', body: formData });
    const data = await response.json();
    if (data.success) {
      resultDiv.className = 'result-message success';
      resultDiv.innerHTML =
        '<svg class="upload-success-check" viewBox="0 0 52 52">' +
          '<circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none" stroke="#22c55e" stroke-width="2"/>' +
          '<path class="checkmark-check" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>' +
        '</svg>' +
        'Bando caricato e indicizzato con successo!';
      showToast('Bando caricato e indicizzato con successo!', 'success');
      document.getElementById('upload-form').reset();
      fileName.textContent = '';
    } else {
      throw new Error(data.message || 'Errore sconosciuto');
    }
  } catch (err) {
    resultDiv.className = 'result-message error';
    resultDiv.textContent = 'Errore: ' + err.message;
    showToast('Errore durante il caricamento: ' + err.message, 'error');
  }
  btn.disabled = false;
  btnText.style.display = 'inline-flex';
  btnLoading.style.display = 'none';
});

// === Delete Modal ===
let deleteBandoName = '';

function openDeleteModal(name) {
  deleteBandoName = name;
  document.getElementById('delete-bando-name').textContent = name;
  document.getElementById('modal-delete').style.display = 'flex';
}

function closeDeleteModal() {
  document.getElementById('modal-delete').style.display = 'none';
  deleteBandoName = '';
}

document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
  const btn = document.getElementById('btn-confirm-delete');
  btn.disabled = true;
  btn.textContent = 'Eliminazione...';
  try {
    await fetch(API.delete, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome_bando: deleteBandoName, tenant_id: CONFIG.tenant_id })
    });
    closeDeleteModal();
    showToast('Bando "' + deleteBandoName + '" eliminato con successo!', 'success');
    loadBandi();
  } catch (err) {
    showToast('Errore durante l\'eliminazione: ' + err.message, 'error');
  }
  btn.disabled = false;
  btn.textContent = 'Elimina';
});

// === Chat ===
function getTimeString() {
  var now = new Date();
  return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
}

document.getElementById('chat-form').addEventListener('submit', async e => {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message) return;

  // Remove welcome screen if present
  var welcome = document.querySelector('.chat-welcome');
  if (welcome) welcome.remove();

  addChatMessage(message, 'user');
  chatHistory.push({ role: 'user', content: message });
  input.value = '';
  const btnSend = document.getElementById('btn-send');
  btnSend.disabled = true;
  const typingId = showTypingIndicator();
  try {
    // Ensure the last message is always from the user
    // Build a clean history that always ends with a user message
    var messagesToSend = chatHistory.slice();
    // Remove any trailing assistant messages (safety net)
    while (messagesToSend.length > 0 && messagesToSend[messagesToSend.length - 1].role !== 'user') {
      messagesToSend.pop();
    }

    const response = await fetch(API.chat, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sendMessage',
        chatInput: message,
        sessionId: sessionId,
        history: messagesToSend
      })
    });
    const data = await response.json();
    removeTypingIndicator(typingId);
    var botReply = data.output || data.text || data.response || 'Risposta non disponibile';
    addChatMessage(botReply, 'bot');
    chatHistory.push({ role: 'assistant', content: botReply });
  } catch (err) {
    removeTypingIndicator(typingId);
    addChatMessage('Errore: ' + err.message, 'bot');
  }
  btnSend.disabled = false;
});

function addChatMessage(text, type) {
  const c = document.getElementById('chat-messages');
  const d = document.createElement('div');
  d.className = 'message ' + type;
  const avatar = type === 'bot' ? 'AI' : 'Tu';
  const time = getTimeString();
  d.innerHTML = '<div class="message-avatar">' + avatar + '</div>' +
    '<div class="message-content">' + text.replace(/\n/g, '<br>') +
    '<div class="message-time">' + time + '</div></div>';
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}

function showTypingIndicator() {
  const c = document.getElementById('chat-messages');
  const id = 'typing-' + Date.now();
  const d = document.createElement('div');
  d.className = 'message bot';
  d.id = id;
  d.innerHTML = '<div class="message-avatar">AI</div><div class="typing-indicator"><span></span><span></span><span></span></div>';
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// === Suggestion Chips ===
function sendSuggestion(text) {
  var welcome = document.querySelector('.chat-welcome');
  if (welcome) welcome.remove();
  document.getElementById('chat-input').value = text;
  document.getElementById('chat-form').dispatchEvent(new Event('submit'));
}

// === Chat Welcome ===
function showChatWelcome() {
  const c = document.getElementById('chat-messages');
  c.innerHTML = '';
  var div = document.createElement('div');
  div.className = 'chat-welcome';
  div.innerHTML =
    '<div class="chat-welcome-icon">' +
      '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01M12 10h.01M16 10h.01" stroke-linecap="round"/></svg>' +
    '</div>' +
    '<h3>Assistente Bandi AI</h3>' +
    '<p>Chiedimi informazioni su scadenze, requisiti o qualsiasi dettaglio sui bandi caricati.</p>' +
    '<div class="suggestion-chips">' +
      '<button class="suggestion-chip" onclick="sendSuggestion(this.textContent)">Quali bandi scadono questo mese?</button>' +
      '<button class="suggestion-chip" onclick="sendSuggestion(this.textContent)">Riassumi i bandi disponibili</button>' +
      '<button class="suggestion-chip" onclick="sendSuggestion(this.textContent)">Quali sono i requisiti per partecipare?</button>' +
    '</div>';
  c.appendChild(div);
}

// === New Chat ===
function newChat() {
  sessionId = crypto.randomUUID ? crypto.randomUUID() : 'session_' + Math.random().toString(36).substr(2, 9);
  chatHistory = [];
  showChatWelcome();
  showToast('Nuova chat avviata', 'success');
}

// === Init ===
loadBandi();
