document.getElementById('btn').addEventListener('click', async () => {
  const status = document.getElementById('status');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const elements = document.querySelectorAll('strong.ng-binding');

      // Procura o primeiro elemento que contém um código entre aspas
      let codigo = null;
      for (const el of elements) {
        const match = el.textContent?.match(/"([^"]+)"/);
        if (match) {
          codigo = match[1];
          break;
        }
      }

      const input = document.querySelector(
        'input[ng-model="vm.stringConfirmacao"]'
      );

      if (codigo && input) {
        input.value = codigo;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return { ok: true, codigo };
      }

      if (!codigo) return { ok: false, motivo: 'código não encontrado' };
      if (!input)  return { ok: false, motivo: 'campo não encontrado' };
    }
  });

  const res = result.result;

  if (res?.ok) {
    status.className = 'ok';
    status.textContent = `✓ "${res.codigo}"`;
  } else {
    status.className = 'erro';
    status.textContent = `✗ ${res?.motivo ?? 'erro desconhecido'}`;
  }
});