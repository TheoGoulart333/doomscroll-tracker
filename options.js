const COPY = {
  'pt-BR': {
    subtitle:'Preferências de monitoramento', title:'Escolha os sites que quer acompanhar',
    description:'Um domínio por linha. Só esses sites entram nas suas estatísticas.',
    privacy:'Sua lista e suas estatísticas ficam salvas apenas neste navegador.',
    label:'Domínios monitorados', help:'Use um domínio por linha. Você também pode colar uma URL; salvamos apenas o domínio, sem www ou caminho.',
    save:'Salvar alterações', saved:'Preferências salvas.', invalid:'Revise os domínios: use um domínio válido por linha.', permissionDenied:'O Chrome não autorizou o acesso. As alterações não foram salvas.',
    addLabel:'Adicionar um site', addPlaceholder:'reddit.com ou https://reddit.com/…', add:'Adicionar à lista', added:'{domain} foi adicionado. Salve para aplicar.', duplicate:'Esse domínio já está na lista.', addInvalid:'Digite um domínio como reddit.com ou cole uma URL válida.',
    foot:'Você pode mudar a lista a qualquer momento no popup ou nesta página.'
  },
  en: {
    subtitle:'Tracking preferences', title:'Choose the sites you want to track',
    description:'Add one domain per line. Only these sites are included in your stats.',
    privacy:'Your list and statistics are saved only in this browser.',
    label:'Tracked domains', help:'Use one domain per line. You can also paste a URL; only the domain is saved, without www or the page path.',
    save:'Save changes', saved:'Preferences saved.', invalid:'Please check the domains. Enter one valid domain per line.', permissionDenied:'Chrome did not grant site access. Your changes were not saved.',
    addLabel:'Add a site', addPlaceholder:'reddit.com or https://reddit.com/…', add:'Add to list', added:'{domain} was added. Save to apply.', duplicate:'That domain is already in the list.', addInvalid:'Enter a domain like reddit.com or paste a valid URL.',
    foot:'You can update this list any time from the popup or this page.'
  },
  es: {
    subtitle:'Preferencias de seguimiento', title:'Elige los sitios que quieres seguir',
    description:'Añade un dominio por línea. Solo estos sitios aparecerán en tus estadísticas.',
    privacy:'Tu lista y tus estadísticas se guardan solo en este navegador.',
    label:'Dominios seguidos', help:'Usa un dominio por línea. También puedes pegar una URL; solo guardamos el dominio, sin www ni la ruta.',
    save:'Guardar cambios', saved:'Preferencias guardadas.', invalid:'Revisa los dominios: escribe un dominio válido por línea.', permissionDenied:'Chrome no concedió acceso a los sitios. No se guardaron los cambios.',
    addLabel:'Añadir un sitio', addPlaceholder:'reddit.com o https://reddit.com/…', add:'Añadir a la lista', added:'Se añadió {domain}. Guarda para aplicar el cambio.', duplicate:'Ese dominio ya está en la lista.', addInvalid:'Escribe un dominio como reddit.com o pega una URL válida.',
    foot:'Puedes cambiar esta lista cuando quieras desde la ventana emergente o esta página.'
  },
  fr: {
    subtitle:'Préférences de suivi', title:'Choisissez les sites à suivre',
    description:'Ajoutez un domaine par ligne. Seuls ces sites apparaîtront dans vos statistiques.',
    privacy:'Votre liste et vos statistiques restent enregistrées dans ce navigateur.',
    label:'Domaines suivis', help:'Un domaine par ligne. Vous pouvez aussi coller une URL ; seul le domaine est conservé, sans www ni chemin.',
    save:'Enregistrer', saved:'Préférences enregistrées.', invalid:'Vérifiez les domaines : saisissez un domaine valide par ligne.', permissionDenied:'Chrome n’a pas autorisé l’accès aux sites. Les modifications n’ont pas été enregistrées.',
    addLabel:'Ajouter un site', addPlaceholder:'reddit.com ou https://reddit.com/…', add:'Ajouter à la liste', added:'{domain} a été ajouté. Enregistrez pour appliquer.', duplicate:'Ce domaine figure déjà dans la liste.', addInvalid:'Saisissez un domaine comme reddit.com ou collez une URL valide.',
    foot:'Vous pouvez modifier cette liste à tout moment depuis la fenêtre de l’extension ou cette page.'
  }
};
let lang = 'pt-BR';
let currentDomains = [];

function setLanguage(value) {
  lang = COPY[value] ? value : 'pt-BR';
  document.documentElement.lang = lang;
  const copy = COPY[lang];
  for (const [id, text] of Object.entries({subtitle:copy.subtitle,title:copy.title,description:copy.description,privacy:copy.privacy,label:copy.label,help:copy.help,save:copy.save,foot:copy.foot,'add-label':copy.addLabel,'add-domain':copy.add})) {
    document.getElementById(id).textContent = text;
  }
  document.getElementById('new-domain').placeholder = copy.addPlaceholder;
}

async function init() {
  const browserLanguage = chrome.i18n.getUILanguage().toLowerCase();
  const defaultLanguage = browserLanguage.startsWith('pt') ? 'pt-BR' : browserLanguage.startsWith('es') ? 'es' : browserLanguage.startsWith('fr') ? 'fr' : 'en';
  const prefs = await chrome.storage.local.get({ trackedDomains: [], lang: defaultLanguage });
  currentDomains = prefs.trackedDomains;
  lang = prefs.lang;
  setLanguage(lang);
  document.getElementById('domains').value = currentDomains.join('\n');
}

function addDomain() {
  const input = document.getElementById('new-domain');
  const textarea = document.getElementById('domains');
  const status = document.getElementById('status');
  status.style.color = '';
  const domain = normalizeDomain(input.value);
  if (!domain) {
    status.textContent = COPY[lang].addInvalid;
    status.classList.add('error');
    input.focus();
    return;
  }
  const lines = textarea.value.split('\n').map(line => line.trim()).filter(Boolean);
  const existing = lines.map(normalizeDomain).filter(Boolean);
  if (existing.includes(domain) || existing.some(item => domain.endsWith(`.${item}`))) {
    status.textContent = COPY[lang].duplicate;
    status.classList.add('error');
    input.focus();
    return;
  }
  lines.push(domain);
  textarea.value = lines.join('\n');
  input.value = '';
  status.classList.remove('error');
  status.textContent = COPY[lang].added.replace('{domain}', domain);
  input.focus();
}

document.getElementById('add-domain').addEventListener('click', addDomain);
document.getElementById('new-domain').addEventListener('keydown', event => {
  if (event.key === 'Enter') { event.preventDefault(); addDomain(); }
});

document.getElementById('save').addEventListener('click', () => {
  const textarea = document.getElementById('domains');
  const lines = textarea.value.split('\n').map(line => line.trim()).filter(Boolean);
  const normalized = lines.map(normalizeDomain);
  const status = document.getElementById('status');
  if (normalized.some(domain => !domain)) {
    status.textContent = COPY[lang].invalid;
    status.classList.add('error');
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
      status.classList.remove('error');
    });
    const removed = previousOrigins.filter(origin => !origins.includes(origin));
    if (removed.length) chrome.permissions.remove({ origins: removed }, save);
    else save();
  };
  if (!origins.length) { persist(); return; }
  chrome.permissions.request({ origins }, granted => {
    if (!granted) {
      status.textContent = COPY[lang].permissionDenied;
      status.classList.add('error');
      return;
    }
    persist();
  });
});

function permissionOrigins(domains) {
  return [...new Set(domains.flatMap(domain => [`https://*.${domain}/*`, `http://*.${domain}/*`]))];
}

init();
