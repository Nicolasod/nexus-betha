function copiar(texto, btn) {
  navigator.clipboard.writeText(texto).then(function() {
    const original = btn.textContent;
    btn.textContent = '✓ Copiado!';
    btn.classList.add('ok');
    setTimeout(function() {
      btn.textContent = original;
      btn.classList.remove('ok');
    }, 1500);
  });
}

chrome.storage.local.get(['authorization', 'userAccess', 'sourceDomain', 'entity', 'system', 'capturedAt'], function(data) {
  const content = document.getElementById('content');

  if (!data.authorization) return; // mantém mensagem de aguardando

  const auth       = data.authorization  || '';
  const userAccess = data.userAccess     || '';
  const capturedAt = data.capturedAt     || '';
  const domain     = data.sourceDomain   || '';
  const entity     = data.entity         || '';
  const system     = data.system         || '';

  content.innerHTML = `
    ${system ? `<div class="source" style="background:#eff6ff;border-color:#bfdbfe;color:#1e40af;">💻 ${system}</div>` : ''}
    ${domain ? `<div class="source">🌐 ${domain}</div>` : ''}
    ${entity ? `<div class="source" style="background:#f0fdf4;border-color:#bbf7d0;color:#166534;">🏛️ ${entity}</div>` : ''}

    <div class="field">
      <label>Authorization</label>
      <div class="value">${auth}</div>
      <button class="btn btn-copy" id="btnAuth">Copiar</button>
    </div>

    <div class="field">
      <label>User-Access</label>
      <div class="value ${userAccess ? '' : 'empty'}">${userAccess || 'não capturado'}</div>
      <button class="btn btn-copy" id="btnUA" ${!userAccess ? 'disabled' : ''}>Copiar</button>
    </div>

    <button class="btn btn-all" id="btnAmbos">📋 Copiar os dois</button>

    <div class="time">Capturado às ${capturedAt}</div>
  `;

  document.getElementById('btnAuth').addEventListener('click', function() {
    copiar(auth, this);
  });

  document.getElementById('btnUA').addEventListener('click', function() {
    copiar(userAccess, this);
  });

  document.getElementById('btnAmbos').addEventListener('click', function() {
    const txt = 'Authorization: ' + auth + (userAccess ? '\nUser-Access: ' + userAccess : '');
    copiar(txt, this);
  });
});
