// Injeta o script no contexto da página (para ter acesso ao fetch/XHR real)
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.onload = function () { this.remove(); };
(document.head || document.documentElement).appendChild(script);

// ─── Captura sistema e entidade ──────────────────────────────────────────────
let capturedEntity = '';
let capturedSystem = '';

// Lê o sistema a partir do hostname da página (ex: rh.betha.cloud → RH)
function lerSistema() {
  // Tenta ler do título da página primeiro
  const title = document.title || '';
  const titleMatch = title.match(/^([^\-–|\/]+)/);
  if (titleMatch && titleMatch[1].trim().length > 0) {
    capturedSystem = titleMatch[1].trim();
    return;
  }
  // Fallback: extrai o primeiro subdomínio do hostname
  const host = window.location.hostname; // ex: rh.betha.cloud
  const parts = host.split('.');
  if (parts.length >= 2) {
    capturedSystem = parts[0].toUpperCase();
  }
}

lerSistema();

function lerEntidade() {
  // Procura por texto "Entidade: ..." em qualquer elemento da página
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const match = node.textContent.match(/Entidade[:\s]+([^\n\r\t▼▾]+)/i);
    if (match) {
      const nome = match[1].trim().replace(/[▼▾].*$/, '').trim();
      if (nome.length > 2) {
        capturedEntity = nome;
        return true;
      }
    }
  }
  return false;
}

// Tenta imediatamente após o DOM estar pronto
function tentarCapturarEntidade() {
  if (!lerEntidade()) {
    // Sistema renderizado via framework (Angular/Vue) — observa mutações
    const observer = new MutationObserver(() => {
      if (lerEntidade()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    // Para após 30s para não ficar rodando para sempre
    setTimeout(() => observer.disconnect(), 30000);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', tentarCapturarEntidade);
} else {
  tentarCapturarEntidade();
}

// ─── Recebe token do injected.js e repassa ao background ─────────────────────
window.addEventListener('message', function (event) {
  if (event.source === window && event.data && event.data.type === 'TOKEN_CAPTURED') {
    chrome.runtime.sendMessage({
      type:          'TOKEN_CAPTURED',
      authorization: event.data.authorization,
      userAccess:    event.data.userAccess,
      sourceUrl:     event.data.sourceUrl,
      entity:        capturedEntity,
      system:        capturedSystem
    });
  }
});
