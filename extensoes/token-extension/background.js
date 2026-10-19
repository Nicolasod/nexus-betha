// Recebe o token do content script e salva no storage
chrome.runtime.onMessage.addListener(function (message) {
  if (message.type === 'TOKEN_CAPTURED' && message.authorization) {
    let domain = '';
    try {
      domain = new URL(message.sourceUrl).hostname;
    } catch {
      domain = message.sourceUrl || '';
    }

    chrome.storage.local.set({
      authorization: message.authorization,
      userAccess:    message.userAccess || '',
      sourceDomain:  domain,
      entity:        message.entity  || '',
      system:        message.system  || '',
      capturedAt:    new Date().toLocaleTimeString('pt-BR')
    });
  }
});
