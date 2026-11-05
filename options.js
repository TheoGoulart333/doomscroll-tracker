const COPY = {
  'pt-BR': {
    subtitle:'Preferências de monitoramento', title:'Escolha os sites que quer acompanhar',
    description:'Um domínio por linha. Só esses sites entram nas suas estatísticas.',
    privacy:'Sua lista e suas estatísticas ficam salvas apenas neste navegador.',
    label:'Domínios monitorados', help:'Exemplo: reddit.com ou www.youtube.com. Prefixos http e https também são aceitos.',
    save:'Salvar alterações', saved:'Preferências salvas.', invalid:'Revise os domínios: use um domínio válido por linha.', permissionDenied:'O Chrome não autorizou o acesso. As alterações não foram salvas.',
    foot:'Você pode mudar a lista a qualquer momento no popup ou nesta página.'
  },
  en: {
    subtitle:'Tracking preferences', title:'Choose the sites you want to track',
    description:'Add one domain per line. Only these sites are included in your stats.',
    privacy:'Your list and statistics are saved only in this browser.',
    label:'Tracked domains', help:'For example: reddit.com or www.youtube.com. http and https prefixes are accepted.',
    save:'Save changes', saved:'Preferences saved.', invalid:'Please check the domains. Enter one valid domain per line.', permissionDenied:'Chrome did not grant site access. Your changes were not saved.',
    foot:'You can update this list any time from the popup or this page.'
  }
};
let lang = 'pt-BR';
let currentDomains = [];

function setLanguage(value) {
  lang = value === 'en' ? 'en' : 'pt-BR';
  document.documentElement.lang = lang;
  const copy = COPY[lang];
  for (const [id, text] of Object.entries({subtitle:copy.subtitle,title:copy.title,description:copy.description,privacy:copy.privacy,label:copy.label,help:copy.help,save:copy.save,foot:copy.foot})) {
    document.getElementById(id).textContent = text;
  }
}

function normalizeDomain(value) {
  const raw = value.trim().toLowerCase();
  if (!raw || raw.length > 253 || /\s/.test(raw)) return null;
  let host;
  try { host = new URL(raw.includes('://') ? raw : `https://${raw}`).hostname.toLowerCase(); }
  catch { return null; }
  host = host.replace(/^www\./, '').replace(/\.$/, '');
  if (!host.includes('.') || host.split('.').some(label => !label || label.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))) return null;
  return host;
}

async function init() {
  const prefs = await chrome.storage.local.get({ trackedDomains: [], lang: chrome.i18n.getUILanguage().toLowerCase().startsWith('pt') ? 'pt-BR' : 'en' });
  currentDomains = prefs.trackedDomains;
  lang = prefs.lang;
  setLanguage(lang);
  document.getElementById('domains').value = currentDomains.join('\n');
}

document.getElementById('save').addEventListener('click', () => {
  const textarea = document.getElementById('domains');
  const lines = textarea.value.split('\n').map(line => line.trim()).filter(Boolean);
  const normalized = lines.map(normalizeDomain);
  const status = document.getElementById('status');
  if (normalized.some(domain => !domain)) {
    status.textContent = COPY[lang].invalid;
    status.style.color = 'var(--rose, #fb7185)';
    textarea.focus();
    return;
  }
  const unique = [...new Set(normalized)];
  const origins = permissionOrigins(unique);
  const previousOrigins = permissionOrigins(currentDomains);
  const persist = () => {
    const save = () => chrome.storage.local.set({ trackedDomains: unique }, () => {
      currentDomains = unique;
      textarea.value = unique.join('\n');
      status.textContent = COPY[lang].saved;
      status.style.color = 'var(--teal)';
    });
    const removed = previousOrigins.filter(origin => !origins.includes(origin));
    if (removed.length) chrome.permissions.remove({ origins: removed }, save);
    else save();
  };
  if (!origins.length) { persist(); return; }
  chrome.permissions.request({ origins }, granted => {
    if (!granted) {
      status.textContent = COPY[lang].permissionDenied;
      status.style.color = 'var(--rose, #fb7185)';
      return;
    }
    persist();
  });
});

function permissionOrigins(domains) {
  return [...new Set(domains.flatMap(domain => [`https://*.${domain}/*`, `http://*.${domain}/*`]))];
}

init();
