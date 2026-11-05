// options.js
// Persiste a lista de domínios monitorados via chrome.storage.local

document.addEventListener('DOMContentLoaded', async () => {
  const textarea = document.getElementById('domains');
  const saveBtn = document.getElementById('save');

  // Carrega domínios já salvos ou usa padrão (se nada houver)
  const { trackedDomains = [] } = await chrome.storage.local.get('trackedDomains');
  textarea.value = trackedDomains.join('\n');

  saveBtn.addEventListener('click', async () => {
    const lines = textarea.value
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);
    await chrome.storage.local.set({ trackedDomains: lines });
    alert('Domínios salvos!');
  });
});
