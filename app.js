const CONFIG={apiBase:'https://maritsrl.app.n8n.cloud/webhook',tenant_id:'default',chatWebhookId:'bandi-chat'};
const API={upload:CONFIG.apiBase+'/bandi-upload',list:CONFIG.apiBase+'/bandi-lista',delete:CONFIG.apiBase+'/bandi-elimina',chat:CONFIG.apiBase+'/'+CONFIG.chatWebhookId+'/chat'};
let sessionId='session_'+Math.random().toString(36).substr(2,9);
let bandiData=[];

document.querySelectorAll('.tab').forEach(tab=>{tab.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));document.querySelectorAll('.tab-content').forEach(tc=>tc.classList.remove('active'));tab.classList.add('active');document.getElementById('tab-'+tab.dataset.tab).classList.add('active')})});

const fileInput=document.getElementById('pdf_file');
const fileDrop=document.getElementById('file-drop');
const fileName=document.getElementById('file-name');
fileInput.addEventListener('change',()=>{if(fileInput.files.length>0)fileName.textContent=fileInput.files[0].name});
fileDrop.addEventListener('dragover',e=>{e.preventDefault();fileDrop.classList.add('dragover')});
fileDrop.addEventListener('dragleave',()=>fileDrop.classList.remove('dragover'));
fileDrop.addEventListener('drop',e=>{e.preventDefault();fileDrop.classList.remove('dragover');if(e.dataTransfer.files.length>0){fileInput.files=e.dataTransfer.files;fileName.textContent=e.dataTransfer.files[0].name}});

async function loadBandi(){
  const container=document.getElementById('bandi-list');
  container.innerHTML='<div class="loading">Caricamento bandi...</div>';
  try{
    const response=await fetch(API.list+'?tenant_id='+CONFIG.tenant_id);
    const data=await response.json();
    bandiData=data.bandi||[];
    if(bandiData.length===0){container.innerHTML='<div class="empty-state"><p>Nessun bando caricato.</p><p>Vai alla sezione "Carica PDF" per aggiungere il primo bando.</p></div>';return}
    container.innerHTML=bandiData.map(bando=>{
      const scadenza=bando.data_scadenza?new Date(bando.data_scadenza).toLocaleDateString('it-IT'):'N/D';
      const isExpired=bando.data_scadenza&&new Date(bando.data_scadenza)<new Date();
      return '<div class="bando-card"><div class="bando-info"><h3>'+bando.nome_bando+'</h3><div class="bando-meta"><span>'+(isExpired?'\u26a0\ufe0f Scaduto':'\ud83d\udcc5')+' '+scadenza+'</span><span>\ud83d\udcc4 '+bando.chunk_count+' chunk</span></div></div><div class="bando-actions"><button class="btn btn-danger" onclick="openDeleteModal(\''+bando.nome_bando.replace(/'/g,"\\'")+'\')">Elimina</button></div></div>'
    }).join('');
  }catch(err){container.innerHTML='<div class="empty-state" style="color:#ef4444;">Errore nel caricamento: '+err.message+'</div>'}
}

document.getElementById('upload-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const btn=document.getElementById('btn-upload');
  const btnText=btn.querySelector('.btn-text');
  const btnLoading=btn.querySelector('.btn-loading');
  const resultDiv=document.getElementById('upload-result');
  btn.disabled=true;btnText.style.display='none';btnLoading.style.display='inline';
  resultDiv.className='result-message';resultDiv.style.display='none';
  const formData=new FormData();
  formData.append('file',document.getElementById('pdf_file').files[0]);
  formData.append('nome_bando',document.getElementById('nome_bando').value);
  formData.append('data_scadenza',document.getElementById('data_scadenza').value);
  formData.append('tenant_id',CONFIG.tenant_id);
  try{
    const response=await fetch(API.upload,{method:'POST',body:formData});
    const data=await response.json();
    if(data.success){resultDiv.className='result-message success';resultDiv.textContent='Bando caricato e indicizzato con successo!';document.getElementById('upload-form').reset();fileName.textContent=''}
    else throw new Error(data.message||'Errore sconosciuto');
  }catch(err){resultDiv.className='result-message error';resultDiv.textContent='Errore: '+err.message}
  btn.disabled=false;btnText.style.display='inline';btnLoading.style.display='none'
});

let deleteBandoName='';
function openDeleteModal(name){deleteBandoName=name;document.getElementById('delete-bando-name').textContent=name;document.getElementById('modal-delete').style.display='flex'}
function closeDeleteModal(){document.getElementById('modal-delete').style.display='none';deleteBandoName=''}
document.getElementById('btn-confirm-delete').addEventListener('click',async()=>{
  const btn=document.getElementById('btn-confirm-delete');btn.disabled=true;btn.textContent='Eliminazione...';
  try{await fetch(API.delete,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nome_bando:deleteBandoName,tenant_id:CONFIG.tenant_id})});closeDeleteModal();loadBandi()}
  catch(err){alert('Errore: '+err.message)}
  btn.disabled=false;btn.textContent='Elimina'
});

document.getElementById('chat-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const input=document.getElementById('chat-input');
  const message=input.value.trim();if(!message)return;
  addChatMessage(message,'user');input.value='';
  const btnSend=document.getElementById('btn-send');btnSend.disabled=true;
  const typingId=showTypingIndicator();
  try{
    const response=await fetch(API.chat,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'sendMessage',chatInput:message,sessionId:sessionId})});
    const data=await response.json();
    removeTypingIndicator(typingId);
    addChatMessage(data.output||data.text||data.response||'Risposta non disponibile','bot');
  }catch(err){removeTypingIndicator(typingId);addChatMessage('Errore: '+err.message,'bot')}
  btnSend.disabled=false
});

function addChatMessage(text,type){const c=document.getElementById('chat-messages');const d=document.createElement('div');d.className='message '+type;d.innerHTML='<div class="message-content">'+text.replace(/\n/g,'<br>')+'</div>';c.appendChild(d);c.scrollTop=c.scrollHeight}
function showTypingIndicator(){const c=document.getElementById('chat-messages');const id='typing-'+Date.now();const d=document.createElement('div');d.className='message bot';d.id=id;d.innerHTML='<div class="typing-indicator"><span></span><span></span><span></span></div>';c.appendChild(d);c.scrollTop=c.scrollHeight;return id}
function removeTypingIndicator(id){const el=document.getElementById(id);if(el)el.remove()}

loadBandi();
