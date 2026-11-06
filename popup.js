// popup.js v2 — completo, humano, animado

// ── Dados de domínio ──────────────────────────────────────────
const DOMAIN_META = {
  'reddit.com':    { color:'#ff705d' },
  'twitter.com':   { color:'#75aee5' },
  'x.com':         { color:'#d4d2dc' },
  'youtube.com':   { color:'#df7777' },
  'instagram.com': { color:'#cb8ba4' },
  'tiktok.com':    { color:'#79b2b6' },
  'facebook.com':  { color:'#7d9fc9' },
  'huffpost.com':  { color:'#76aebe' },
  'buzzfeed.com':  { color:'#d77a73' },
  'twitch.tv':     { color:'#a18ad0' },
  'linkedin.com':  { color:'#729bbd' },
};

const DAYS_SHORT = { 'pt-BR':['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'], en:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], es:['dom','lun','mar','mié','jue','vie','sáb'], fr:['dim','lun','mar','mer','jeu','ven','sam'] };
const DATE_LOCALE = { 'pt-BR':'pt-BR', en:'en-US', es:'es-ES', fr:'fr-FR' };

// ── Estado global ─────────────────────────────────────────────
let currentDomains = [];
let liveInterval   = null;
let liveElapsed    = 0;
let statsCache     = {};
let currentLang    = 'pt-BR';

const COPY = {
  'pt-BR': {
    today:'Hoje', week:'Semana', settings:'Ajustes', active:'Ativo', paused:'Pausado', permissionNeeded:'Acesso pendente',
    minutes:'minutos', minuteSingular:'minuto', hours:'horas', hourSingular:'hora', durationTotal:'no total', day:'dia', days:'dias', record:'Recorde',
    todayCompare:'vs ontem', weekCompare:'vs semana passada',
    limitReached:'Limite alcançado por hoje. Se puder, faça uma pausa.',
    noSites:'Nenhum site monitorado por enquanto.',
    startTitle:'Perceba para onde vai seu tempo.', startCopy:'Acompanhe quanto tempo você passa nos sites que escolher. Seus dados ficam no seu navegador. Sem julgamentos.',
    privacy:'Seus dados ficam neste navegador. O Doomscroll Tracker não envia seu histórico para nenhum servidor.',
    welcomeSites:'Sites que você quer acompanhar', welcomeSitesHelp:'Digite um domínio (ex.: reddit.com) ou cole uma URL. Salvamos só o domínio, sem www ou caminho.', welcomeDomainPlaceholder:'reddit.com ou https://reddit.com/…', welcomeAdd:'Adicionar site', domainHelp:'Digite um domínio (ex.: reddit.com) ou cole uma URL. Vamos guardar só o domínio, sem www ou caminho.', domainInvalid:'Não reconheci esse site. Digite um domínio como reddit.com ou cole uma URL válida.', domainDuplicate:'Esse site já está na lista.', siteAdded:'{domain} foi adicionado.', noMonitoredSites:'Nenhum site na lista. Adicione um domínio abaixo.', selectedSites:'{count} sites selecionados', selectedSite:'1 site selecionado', noSelectedSites:'Nenhum site selecionado. Você pode continuar sem monitorar.',
    language:'Idioma', start:'Ativar monitoramento', skip:'Continuar sem monitorar', permissionExplainer:'O Chrome vai pedir acesso apenas aos sites da sua lista, para reconhecer quando você está neles.', permissionDenied:'Sem esse acesso, a extensão não consegue contar o tempo. Você pode tentar de novo ou continuar sem monitorar por enquanto.', permissionMissing:'Para contar o tempo, escolha os sites e autorize o acesso a eles em Configurações.', savePermissionDenied:'O acesso aos sites não foi autorizado; as alterações não foram salvas.', saved:'Ajustes salvos.', loadError:'Não foi possível carregar seus dados', loadErrorCopy:'A extensão não respondeu desta vez. Tente novamente ou recarregue a extensão em chrome://extensions.', retry:'Tentar novamente', limit:'Limite diário', weekLabel:'Esta semana', navLabel:'Navegação do Doomscroll Tracker', pauseTitle:'Pausar ou retomar a contagem', domainInputPlaceholder:'reddit.com ou https://reddit.com/…', removeSite:'Remover {domain}',
    secondsShort:'s',
    moodEmptyTitle:'Nada registrado ainda.', moodEmptyBody:'A contagem começa quando você visita um site da lista.', moodCalm:'Um começo tranquilo.', moodSteady:'Até aqui, tudo bem.', moodNear:'Chegando perto da sua meta.', moodAlmost:'Quase na sua meta.', moodTracked:'{minutes} min de tempo monitorado hoje.', moodTrackedShort:'{minutes} min de tempo monitorado.', moodPause:'Uma pausa pode ajudar.', moodRemaining:'Restam {minutes} min, se quiser seguir acompanhando.', moodRemainingToday:'Restam {minutes} min hoje.', moodChangeGoal:'Você pode mudar essa meta quando quiser.', streakFirst:'Primeiro dia dentro da sua meta', streakWithin:'{count} dias dentro da sua meta', streakDays:'{count} dias seguidos', chartAvg:'Média (min)', chartBest:'Melhor dia', chartWorst:'Pior dia',
    streak:'dias dentro da sua meta', streakStart:'Seu primeiro dia começa hoje',
    goal:'Meta: {limit} min/dia — {left} min restantes', left:'{left} min restantes hoje',
    hit:'Limite alcançado ({limit} min)', sitesToday:'Sites hoje', last7:'Últimos 7 dias',
    topSites:'Sites mais acessados', sessions:'Atividade recente', visitCount:'{count} visitas', visitCountOne:'1 visita', export:'Exportar CSV',
    avg:'Média (min)', best:'Menor uso', worst:'Maior uso',
    alert:'Alertas de limite', alertSub:'Avisos ao chegar a 80% e 100%',
    setLimit:'Aviso ao atingir', setLimitSub:'Escolha uma referência diária que faça sentido para você',
    notifications:'Notificações', monitored:'Sites monitorados', weeklyReport:'Resumo semanal', weeklyToggle:'Lembrete semanal', weeklySub:'Receba um resumo uma vez por semana', livePrefix:'Hoje em', add:'Adicionar site',
    save:'Salvar ajustes', saved:'Salvo', more:'Mais opções', reset:'Apagar histórico',
    emptySessions:'Nenhuma sessão registrada ainda.', nothing:'Nada registrado ainda hoje.',
    confirmReset:'Apagar todo o histórico deste navegador? Essa ação não pode ser desfeita.',
    onTrack:'Dentro da sua meta. Seu uso hoje: {today} min.', gentle:'Você está chegando à sua meta diária. Que tal uma pausa?',
    progress:'Você já chegou à sua meta de hoje. Uma pausa pode ajudar.',
  },
  en: {
    today:'Today', week:'Week', settings:'Settings', active:'On', paused:'Paused', permissionNeeded:'Access needed',
    minutes:'minutes', minuteSingular:'minute', hours:'hours', hourSingular:'hour', durationTotal:'tracked in total', day:'day', days:'days', record:'Best',
    todayCompare:'vs yesterday', weekCompare:'vs last week',
    limitReached:'That’s your daily goal. Consider taking a break.',
    noSites:'No tracked sites yet.',
    startTitle:'See where your time goes.', startCopy:'Track how long you spend on the sites you choose. Your data stays in your browser. No judgment.',
    privacy:'Your data stays in this browser. Doomscroll Tracker never sends your browsing history to a server.',
    welcomeSites:'Sites you want to track', welcomeSitesHelp:'Enter a domain (e.g. reddit.com) or paste a URL. We only keep the domain, without www or the page path.', welcomeDomainPlaceholder:'reddit.com or https://reddit.com/…', welcomeAdd:'Add site', domainHelp:'Enter a domain (e.g. reddit.com) or paste a URL. We only keep the domain, without www or the page path.', domainInvalid:'We could not recognize that site. Enter a domain like reddit.com or paste a valid URL.', domainDuplicate:'This site is already in your list.', siteAdded:'{domain} was added.', noMonitoredSites:'No sites in your list. Add a domain below.', selectedSites:'{count} sites selected', selectedSite:'1 site selected', noSelectedSites:'No sites selected. You can continue without tracking.',
    language:'Language', start:'Enable tracking', skip:'Continue without tracking', permissionExplainer:'Chrome will ask for access only to sites in your list so the extension can recognize when you visit them.', permissionDenied:'Without this access, the extension cannot count time. Try again or continue without tracking for now.', permissionMissing:'To count time, choose sites and allow access to them in Settings.', savePermissionDenied:'Site access was not granted, so settings were not saved.', saved:'Settings saved.', loadError:'Your data could not be loaded', loadErrorCopy:'The extension did not respond this time. Try again or reload it from chrome://extensions.', retry:'Try again', limit:'Daily goal', weekLabel:'This week', navLabel:'Doomscroll Tracker navigation', pauseTitle:'Pause or resume tracking', domainInputPlaceholder:'reddit.com or https://reddit.com/…', removeSite:'Remove {domain}',
    secondsShort:'s',
    moodEmptyTitle:'Nothing recorded yet.', moodEmptyBody:'Time starts counting when you visit a site on your list.', moodCalm:'A calm start.', moodSteady:'Steady so far.', moodNear:'Getting close to your goal.', moodAlmost:'Almost at your goal.', moodTracked:'{minutes} min of tracked time today.', moodTrackedShort:'{minutes} min of tracked time.', moodPause:'A short pause can help.', moodRemaining:'{minutes} min left, if you want to keep track.', moodRemainingToday:'{minutes} min remaining today.', moodChangeGoal:'You can adjust this goal any time.', streakFirst:'First day within your goal', streakWithin:'{count} days within your goal', streakDays:'{count} days in a row', chartAvg:'Average (min)', chartBest:'Best day', chartWorst:'Highest use',
    streak:'days within your goal', streakStart:'Today is a fresh start',
    goal:'Goal: {limit} min/day — {left} min left', left:'{left} min left today',
    hit:'Daily goal reached ({limit} min)', sitesToday:'Sites today', last7:'Last 7 days',
    topSites:'Most visited sites', sessions:'Recent activity', visitCount:'{count} visits', visitCountOne:'1 visit', export:'Export CSV',
    avg:'Average (min)', best:'Lowest day', worst:'Highest use',
    alert:'Goal alerts', alertSub:'Alerts at 80% and 100%',
    setLimit:'Daily goal', setLimitSub:'Choose a daily reference that works for you',
    notifications:'Notifications', monitored:'Tracked sites', weeklyReport:'Weekly summary', weeklyToggle:'Weekly reminder', weeklySub:'Get a short summary once a week', livePrefix:'Today on', add:'Add site',
    save:'Save settings', saved:'Saved', more:'More options', reset:'Clear history',
    emptySessions:'No sessions recorded yet.', nothing:'Nothing recorded today yet.',
    confirmReset:'Clear all history in this browser? This cannot be undone.',
    onTrack:'Within your goal. Today’s usage: {today} min.', gentle:'You’re nearing your daily goal. How about a short break?',
    progress:'You’ve reached today’s goal. A break may help.',
  }
};

COPY.es = {
  ...COPY.en,
  today:'Hoy', week:'Semana', settings:'Ajustes', active:'Activo', paused:'En pausa', permissionNeeded:'Acceso pendiente', minutes:'minutos', hours:'horas', day:'día', days:'días', record:'Récord', todayCompare:'vs. ayer', weekCompare:'vs. la semana pasada',
  limitReached:'Has alcanzado tu objetivo de hoy. Si puedes, descansa.', noSites:'Todavía no hay sitios seguidos.', startTitle:'Descubre adónde va tu tiempo.', startCopy:'Mira cuánto tiempo pasas en los sitios que eliges. Tus datos se quedan en este navegador. Sin juicios.', privacy:'Tus datos se quedan en este navegador. Doomscroll Tracker no envía tu historial a ningún servidor.',
  welcomeSites:'Sitios que quieres seguir', welcomeSitesHelp:'Escribe un dominio (p. ej., reddit.com) o pega una URL. Solo guardamos el dominio, sin www ni la ruta.', welcomeDomainPlaceholder:'reddit.com o https://reddit.com/…', welcomeAdd:'Añadir sitio', domainHelp:'Escribe un dominio (p. ej., reddit.com) o pega una URL. Solo guardamos el dominio, sin www ni la ruta.', domainInvalid:'No reconocemos ese sitio. Escribe un dominio como reddit.com o pega una URL válida.', domainDuplicate:'Ese sitio ya está en la lista.', siteAdded:'Se añadió {domain}.', noMonitoredSites:'No hay sitios en la lista. Añade un dominio abajo.', selectedSites:'{count} sitios seleccionados', selectedSite:'1 sitio seleccionado', noSelectedSites:'No hay sitios seleccionados. Puedes continuar sin seguimiento.',
  language:'Idioma', start:'Activar seguimiento', skip:'Continuar sin seguimiento', permissionExplainer:'Chrome pedirá acceso solo a los sitios de tu lista para reconocer cuándo los visitas.', permissionDenied:'Sin este acceso, la extensión no puede contar el tiempo. Inténtalo de nuevo o continúa sin seguimiento.', permissionMissing:'Para contar el tiempo, elige sitios y permite el acceso en Ajustes.', savePermissionDenied:'No se autorizó el acceso a los sitios; no se guardaron los cambios.', saved:'Cambios guardados.', loadError:'No se pudieron cargar tus datos', loadErrorCopy:'La extensión no respondió esta vez. Inténtalo de nuevo o vuelve a cargarla en chrome://extensions.', retry:'Intentar de nuevo', limit:'Objetivo diario', weekLabel:'Esta semana', secondsShort:'s',
  minutes:'minutos', minuteSingular:'minuto', hours:'horas', hourSingular:'hora', durationTotal:'en total',
  streak:'días dentro de tu objetivo', streakStart:'Hoy puedes empezar de nuevo', goal:'Objetivo: {limit} min/día — quedan {left} min', left:'Quedan {left} min hoy', hit:'Objetivo alcanzado ({limit} min)', sitesToday:'Sitios de hoy', last7:'Últimos 7 días', topSites:'Sitios más visitados', sessions:'Actividad reciente', visitCount:'{count} visitas', visitCountOne:'1 visita', export:'Exportar CSV', avg:'Promedio (min)', best:'Día más bajo', worst:'Mayor uso', alert:'Avisos del objetivo', alertSub:'Avisos al llegar al 80 % y al 100 %', setLimit:'Objetivo diario', setLimitSub:'Elige una referencia diaria que te resulte útil', notifications:'Notificaciones', monitored:'Sitios seguidos', weeklyReport:'Resumen semanal', weeklyToggle:'Recordatorio semanal', weeklySub:'Recibe un breve resumen una vez por semana', livePrefix:'Hoy en', add:'Añadir sitio', save:'Guardar ajustes', more:'Más opciones', reset:'Borrar historial', emptySessions:'Todavía no hay sesiones registradas.', nothing:'Todavía no hay datos de hoy.', confirmReset:'¿Borrar todo el historial de este navegador? Esta acción no se puede deshacer.', onTrack:'Dentro de tu objetivo. Uso de hoy: {today} min.', gentle:'Te acercas a tu objetivo diario. ¿Te tomas un breve descanso?', progress:'Has alcanzado el objetivo de hoy. Un descanso puede ayudar.',
  navLabel:'Navegación de Doomscroll Tracker', pauseTitle:'Pausar o reanudar el seguimiento', domainInputPlaceholder:'reddit.com o https://reddit.com/…', removeSite:'Quitar {domain}', moodEmptyTitle:'Todavía no hay datos.', moodEmptyBody:'El tiempo empieza a contar cuando visitas un sitio de la lista.', moodCalm:'Un comienzo tranquilo.', moodSteady:'Todo va bien por ahora.', moodNear:'Te acercas a tu objetivo.', moodAlmost:'Casi has llegado a tu objetivo.', moodTracked:'{minutes} min de seguimiento hoy.', moodTrackedShort:'{minutes} min de seguimiento.', moodPause:'Un breve descanso puede ayudar.', moodRemaining:'Quedan {minutes} min, si quieres seguir contando.', moodRemainingToday:'Quedan {minutes} min hoy.', moodChangeGoal:'Puedes cambiar este objetivo cuando quieras.', streakFirst:'Primer día dentro de tu objetivo', streakWithin:'{count} días dentro de tu objetivo', streakDays:'{count} días seguidos', chartAvg:'Promedio (min)', chartBest:'Mejor día', chartWorst:'Mayor uso',
};

COPY.fr = {
  ...COPY.en,
  today:'Aujourd’hui', week:'Semaine', settings:'Réglages', active:'Actif', paused:'En pause', permissionNeeded:'Accès requis', minutes:'minutes', hours:'heures', day:'jour', days:'jours', record:'Record', todayCompare:'vs hier', weekCompare:'vs la semaine dernière',
  limitReached:'Votre objectif du jour est atteint. Si possible, faites une pause.', noSites:'Aucun site suivi pour le moment.', startTitle:'Découvrez où passe votre temps.', startCopy:'Voyez le temps passé sur les sites que vous choisissez. Vos données restent dans ce navigateur. Sans jugement.', privacy:'Vos données restent dans ce navigateur. Doomscroll Tracker n’envoie pas votre historique à un serveur.',
  welcomeSites:'Sites à suivre', welcomeSitesHelp:'Saisissez un domaine (ex. reddit.com) ou collez une URL. Seul le domaine est conservé, sans www ni chemin.', welcomeDomainPlaceholder:'reddit.com ou https://reddit.com/…', welcomeAdd:'Ajouter un site', domainHelp:'Saisissez un domaine (ex. reddit.com) ou collez une URL. Seul le domaine est conservé, sans www ni chemin.', domainInvalid:'Site non reconnu. Saisissez un domaine comme reddit.com ou collez une URL valide.', domainDuplicate:'Ce site figure déjà dans la liste.', siteAdded:'{domain} a été ajouté.', noMonitoredSites:'Aucun site dans la liste. Ajoutez un domaine ci-dessous.', selectedSites:'{count} sites sélectionnés', selectedSite:'1 site sélectionné', noSelectedSites:'Aucun site sélectionné. Vous pouvez continuer sans suivi.',
  language:'Langue', start:'Activer le suivi', skip:'Continuer sans suivi', permissionExplainer:'Chrome demandera l’accès uniquement aux sites de votre liste pour reconnaître vos visites.', permissionDenied:'Sans cet accès, l’extension ne peut pas compter le temps. Réessayez ou continuez sans suivi.', permissionMissing:'Pour compter le temps, choisissez des sites et autorisez leur accès dans Réglages.', savePermissionDenied:'L’accès aux sites a été refusé ; les modifications n’ont pas été enregistrées.', saved:'Réglages enregistrés.', loadError:'Impossible de charger vos données', loadErrorCopy:'L’extension n’a pas répondu. Réessayez ou rechargez-la dans chrome://extensions.', retry:'Réessayer', limit:'Objectif quotidien', weekLabel:'Cette semaine', secondsShort:'s',
  minutes:'minutes', minuteSingular:'minute', hours:'heures', hourSingular:'heure', durationTotal:'au total',
  streak:'jours dans votre objectif', streakStart:'Un nouveau départ aujourd’hui', goal:'Objectif : {limit} min/jour — {left} min restantes', left:'Encore {left} min aujourd’hui', hit:'Objectif atteint ({limit} min)', sitesToday:'Sites du jour', last7:'7 derniers jours', topSites:'Sites les plus visités', sessions:'Activité récente', visitCount:'{count} visites', visitCountOne:'1 visite', export:'Exporter CSV', avg:'Moyenne (min)', best:'Journée la plus basse', worst:'Usage le plus élevé', alert:'Alertes d’objectif', alertSub:'Alertes à 80 % et 100 %', setLimit:'Objectif quotidien', setLimitSub:'Choisissez un repère quotidien adapté', notifications:'Notifications', monitored:'Sites suivis', weeklyReport:'Résumé hebdomadaire', weeklyToggle:'Rappel hebdomadaire', weeklySub:'Recevez un bref résumé chaque semaine', livePrefix:'Aujourd’hui sur', add:'Ajouter un site', save:'Enregistrer les réglages', more:'Plus d’options', reset:'Effacer l’historique', emptySessions:'Aucune session enregistrée.', nothing:'Aucune donnée pour aujourd’hui.', confirmReset:'Effacer tout l’historique de ce navigateur ? Cette action est irréversible.', onTrack:'Dans votre objectif. Temps suivi aujourd’hui : {today} min.', gentle:'Vous approchez de votre objectif quotidien. Une courte pause ?', progress:'Objectif du jour atteint. Une pause peut aider.',
  navLabel:'Navigation Doomscroll Tracker', pauseTitle:'Mettre en pause ou reprendre le suivi', domainInputPlaceholder:'reddit.com ou https://reddit.com/…', removeSite:'Retirer {domain}', moodEmptyTitle:'Aucune donnée pour le moment.', moodEmptyBody:'Le suivi commence lorsque vous visitez un site de la liste.', moodCalm:'Un début tranquille.', moodSteady:'Tout va bien pour le moment.', moodNear:'Vous approchez de votre objectif.', moodAlmost:'Objectif presque atteint.', moodTracked:'{minutes} min suivies aujourd’hui.', moodTrackedShort:'{minutes} min suivies.', moodPause:'Une courte pause peut aider.', moodRemaining:'Encore {minutes} min, si vous souhaitez continuer le suivi.', moodRemainingToday:'Encore {minutes} min aujourd’hui.', moodChangeGoal:'Vous pouvez modifier cet objectif à tout moment.', streakFirst:'Premier jour dans votre objectif', streakWithin:'{count} jours dans votre objectif', streakDays:'{count} jours consécutifs', chartAvg:'Moyenne (min)', chartBest:'Meilleure journée', chartWorst:'Usage le plus élevé',
};

function tr(key, vars = {}) { return (COPY[currentLang]?.[key] || COPY.en[key] || key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');}
function applyLanguage(lang) {
  currentLang = COPY[lang] ? lang : 'pt-BR';
  document.documentElement.lang = currentLang;
  document.getElementById('welcome-title').textContent = tr('startTitle');
  document.getElementById('welcome-copy').textContent = tr('startCopy');
  document.getElementById('welcome-privacy').textContent = tr('privacy');
  document.getElementById('permission-explainer').textContent = tr('permissionExplainer');
  document.getElementById('load-error-title').textContent = tr('loadError');
  document.getElementById('load-error-copy').textContent = tr('loadErrorCopy');
  document.getElementById('load-retry').textContent = tr('retry');
  document.getElementById('welcome-skip').textContent = tr('skip');
  document.getElementById('welcome-language-label').textContent = tr('language');
  document.getElementById('welcome-start').textContent = tr('start');
  document.getElementById('welcome-sites-label').textContent = tr('welcomeSites');
  document.getElementById('welcome-sites-help').textContent = tr('welcomeSitesHelp');
  document.getElementById('welcome-domain-input').placeholder = tr('welcomeDomainPlaceholder');
  document.getElementById('welcome-domain-input').setAttribute('aria-label', tr('welcomeSites'));
  document.getElementById('welcome-add-domain').textContent = tr('welcomeAdd');
  document.getElementById('language-label').textContent = tr('language');
  document.querySelectorAll('.tab').forEach((el,i) => el.textContent = [tr('today'),tr('week'),tr('settings')][i]);
  document.querySelector('.tabs').setAttribute('aria-label', tr('navLabel'));
  document.querySelectorAll('.card-label').forEach((el,i) => el.textContent = [tr('today'),tr('weekLabel')][i]);
  document.getElementById('progress-label').textContent = tr('limit');
  document.getElementById('live-prefix').textContent = tr('livePrefix');
  document.getElementById('weekly-label').textContent = tr('weeklyReport');
  document.getElementById('weekly-toggle-label').textContent = tr('weeklyToggle');
  document.getElementById('weekly-toggle-sub').textContent = tr('weeklySub');
  document.getElementById('pause-btn').title = tr('pauseTitle');
  document.getElementById('today-unit').textContent = tr('minutes');
  document.getElementById('week-unit').textContent = tr('minutes');
  document.querySelectorAll('.section-label').forEach((el,i) => el.textContent = [tr('sitesToday'),tr('last7'),tr('topSites'),tr('sessions')][i]);
  document.querySelectorAll('.set-label').forEach((el,i) => el.textContent = [tr('limit'),tr('notifications'),tr('weeklyReport'),tr('monitored'),tr('language')][i]);
  document.querySelectorAll('.set-row-label').forEach((el,i) => el.textContent = [tr('setLimit'),tr('alert'),tr('weeklyToggle')][i]);
  document.querySelectorAll('.set-row-sub').forEach((el,i) => el.textContent = [tr('setLimitSub'),tr('alertSub'),tr('weeklySub')][i]);
  document.getElementById('domain-help').textContent = tr('domainHelp');
  document.getElementById('domain-input').placeholder = tr('domainInputPlaceholder');
  document.getElementById('domain-add-btn').textContent = tr('add');
  document.getElementById('export-btn').textContent = tr('export');
  document.getElementById('save-settings-btn').textContent = tr('save');
  document.getElementById('options-btn').textContent = tr('more');
  document.getElementById('reset-btn').textContent = tr('reset');
  document.getElementById('language-input').value = currentLang;
  document.getElementById('welcome-lang').value = currentLang;
  if (document.getElementById('welcome-domain-chips')) renderWelcomeDomainChips();
  if (statsCache && Object.keys(statsCache).length) { renderToday(statsCache); renderWeek(statsCache); updateStatusPill(statsCache.isPaused, statsCache.trackingPermissionGranted); }
}


// ── Helpers ───────────────────────────────────────────────────

function todayStr() { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

function last7DaysArr() {
  return Array.from({length:7}, (_,i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6-i));
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });
}

function fmt(min) {
  if (min < 60) return `${min}`;
  const h = Math.floor(min/60), m = min%60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatCardDuration(minutes) {
  if (minutes < 60) return { value: String(minutes), unit: minutes === 1 ? tr('minuteSingular') : tr('minutes') };
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!remainder) return { value: String(hours), unit: hours === 1 ? tr('hourSingular') : tr('hours') };
  return { value: `${hours}h ${remainder}m`, unit: tr('durationTotal') };
}

function fmtLive(seconds) {
  const m = Math.floor(seconds/60), s = seconds%60;
  return `${m}:${String(s).padStart(2,'0')}`;
}

function domainIcon(d)  { return (d.replace(/^www\./, '').charAt(0) || '?').toUpperCase(); }

// ── Mensagens dinâmicas (com personalidade) ────────────────────

function getMood(todayMin, limit) {
  const pct = (todayMin/limit)*100;
  if (todayMin === 0)
    return { text:`<strong>${tr('moodEmptyTitle')}</strong><br>${tr('moodEmptyBody')}` };
  if (pct <= 20)
    return { text:`<strong>${tr('moodCalm')}</strong><br>${tr('moodTracked', {minutes:todayMin})}` };
  if (pct <= 50)
    return { text:`<strong>${tr('moodSteady')}</strong><br>${tr('moodTrackedShort', {minutes:todayMin})}` };
  if (pct <= 70)
    return { text:`<strong>${tr('moodNear')}</strong><br>${tr('moodTrackedShort', {minutes:todayMin})} ${tr('moodPause')}` };
  if (pct <= 90)
    return { text:`<strong>${tr('moodNear')}</strong><br>${tr('moodRemaining', {minutes:limit-todayMin})}` };
  if (pct < 100)
    return { text:`<strong>${tr('moodAlmost')}</strong><br>${tr('moodRemainingToday', {minutes:limit-todayMin})}` };
  return { text:`<strong>${tr('limitReached')}</strong><br>${tr('moodChangeGoal')}` };
}

// ── Carrega dados ─────────────────────────────────────────────

async function loadStats() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Stats request timed out')), 5000);
    chrome.runtime.sendMessage({ type:'getStats' }, res => {
      clearTimeout(timeout);
      if (chrome.runtime.lastError || !res || res.error) return reject(new Error('Stats request failed'));
      resolve(res);
    });
  });
}

// ── Render: Hoje ───────────────────────────────────────────────

function renderToday(s) {
  const { today:storedToday=0, week:storedWeek=0, yesterday=0, lastWeek=0, dailyLimit:limit=60, siteDaily={} } = s;
  const liveSeconds = s.liveSession ? (s.liveSession.elapsedSec || 0) : 0;
  const today = Math.floor(((s.todaySeconds ?? storedToday * 60) + liveSeconds) / 60);
  const week = Math.floor(((s.weekSeconds ?? storedWeek * 60) + liveSeconds) / 60);

  // Data header
  document.getElementById('h-date').textContent = new Date().toLocaleDateString(DATE_LOCALE[currentLang], {weekday:'long',day:'numeric',month:'long'});

  // Hero
  const todayDisplay = formatCardDuration(today);
  const weekDisplay = formatCardDuration(week);
  document.getElementById('today-val').textContent = todayDisplay.value;
  document.getElementById('today-unit').textContent = todayDisplay.unit;
  document.getElementById('week-val').textContent   = weekDisplay.value;
  document.getElementById('week-unit').textContent  = weekDisplay.unit;

  // Deltas
  const deltaToday = today - yesterday;
  const deltaEl    = document.getElementById('today-delta');
  if (yesterday > 0) {
    const pct  = Math.abs(Math.round((deltaToday/yesterday)*100));
    const sign = deltaToday >= 0 ? '↑' : '↓';
    deltaEl.textContent = `${sign} ${pct}% ${tr('todayCompare')}`;
    deltaEl.className   = `card-delta ${deltaToday >= 0 ? 'up' : 'down'}`;
  } else { deltaEl.textContent = ''; }

  const deltaWeek = week - lastWeek;
  const deltaWEl  = document.getElementById('week-delta');
  if (lastWeek > 0) {
    const pct  = Math.abs(Math.round((deltaWeek/lastWeek)*100));
    const sign = deltaWeek >= 0 ? '↑' : '↓';
    deltaWEl.textContent = `${sign} ${pct}% ${tr('weekCompare')}`;
    deltaWEl.className   = `card-delta ${deltaWeek >= 0 ? 'up' : 'down'}`;
  } else { deltaWEl.textContent = ''; }

  // Mood
  const mood = s.trackingPermissionGranted === false
    ? { text:`<strong>${tr('permissionMissing')}</strong>` }
    : getMood(today, limit);
  document.getElementById('mood-text').innerHTML    = mood.text.replace(/<br\s*\/?\s*>/gi, ' ');

  // Progress bar
  const pct  = Math.min(Math.round((today/limit)*100), 100);
  const bar  = document.getElementById('limit-bar');
  const pctEl= document.getElementById('limit-pct');
  const hint = document.getElementById('limit-hint');

  bar.style.width  = `${pct}%`;
  pctEl.textContent = `${pct}%`;
  bar.className = 'progress-bar-fill ' + (pct >= 90 ? 'pf-high' : pct >= 60 ? 'pf-mid' : 'pf-low');
  pctEl.style.color = pct >= 90 ? 'var(--rose)' : pct >= 60 ? 'var(--amber)' : 'var(--accent2)';

  if (pct >= 100) {
    hint.textContent   = tr('hit', {limit});
    hint.style.color   = 'var(--rose)';
  } else if (pct >= 70) {
    hint.textContent   = tr('left', {left: limit - today});
    hint.style.color   = 'var(--amber)';
  } else {
    hint.textContent   = tr('goal', {limit, left: limit - today});
    hint.style.color   = '';
  }

  // Sites hoje
  const todayKey  = todayStr();
  const todaySites = { ...(siteDaily[todayKey] || {}) };
  if (s.liveSession && s.liveSiteMinutes > 0) todaySites[s.liveSession.domain] = s.liveSiteMinutes;
  renderSites('sites-today', todaySites);

}

// ── Render: Semana ─────────────────────────────────────────────

function aggregateRecentSessions(sessions) {
  const byDomain = new Map();
  for (const session of sessions || []) {
    if (!session?.domain) continue;
    const group = byDomain.get(session.domain) || {
      domain: session.domain,
      date: session.date || '',
      start: session.start || '',
      visits: 0,
      seconds: 0,
    };
    group.visits += 1;
    group.seconds += Math.max(0, Number(session.seconds ?? (Number(session.minutes) || 0) * 60) || 0);
    byDomain.set(session.domain, group);
  }
  return [...byDomain.values()];
}

function formatRecentDuration(seconds) {
  if (seconds < 60) return `${seconds}${tr('secondsShort')}`;
  const mins = Math.floor(seconds / 60);
  const hours = Math.floor(mins / 60);
  return hours ? `${hours}h ${mins % 60}m` : `${mins}m`;
}

function renderWeek(s) {
  const { daily={}, siteDaily={}, sessions=[], dailyLimit:limit=60 } = s;
  const days = last7DaysArr();
  const todayKey = todayStr();
  const effectiveDaily = { ...daily };
  const liveSeconds = s.liveSession ? (s.liveSession.elapsedSec || 0) : 0;
  effectiveDaily[todayKey] = Math.floor(((s.todaySeconds ?? ((effectiveDaily[todayKey] || 0) * 60)) + liveSeconds) / 60);
  const values   = days.map(d => effectiveDaily[d] || 0);
  const max      = Math.max(...values, 1);

  // Bars
  const barsEl = document.getElementById('weekly-bars');
  barsEl.innerHTML = '';
  days.forEach((dateStr, i) => {
    const val    = values[i];
    const pct    = Math.max((val/max)*100, val > 0 ? 5 : 2);
    const dayName= (DAYS_SHORT[currentLang] || DAYS_SHORT['pt-BR'])[new Date(dateStr+'T12:00:00').getDay()];
    const isToday= dateStr === todayKey;

    const col = document.createElement('div');
    col.className = 'bar-col';
    col.title = `${dayName}: ${val} min`;

    const bar = document.createElement('div');
    bar.style.height = `${pct}%`;
    bar.className = 'bar' +
      (isToday ? ' is-today' : val > limit ? ' over-limit' : val > 0 ? ' has-data' : '');

    const lbl = document.createElement('div');
    lbl.className = 'bar-label' + (isToday ? ' active' : '');
    lbl.textContent = dayName;

    col.appendChild(bar);
    col.appendChild(lbl);
    barsEl.appendChild(col);
  });

  // Summary pills
  const nonZero  = values.filter(v=>v>0);
  const avg      = nonZero.length ? Math.round(nonZero.reduce((a,b)=>a+b,0)/nonZero.length) : 0;
  const best     = Math.min(...values.filter(v=>v>0), Infinity);
  const worst    = Math.max(...values, 0);
  const sumEl    = document.getElementById('chart-summary');
  sumEl.innerHTML = `
    <div class="chart-pill"><div class="cp-val">${avg}</div><div class="cp-lbl">${tr('chartAvg')}</div></div>
    <div class="chart-pill"><div class="cp-val">${best === Infinity ? '—' : best}</div><div class="cp-lbl">${tr('chartBest')}</div></div>
    <div class="chart-pill"><div class="cp-val">${worst}</div><div class="cp-lbl">${tr('chartWorst')}</div></div>
  `;

  // Top sites da semana
  const weekSites = {};
  for (const day of days) {
    if (!siteDaily[day]) continue;
    for (const [d,m] of Object.entries(siteDaily[day]))
      weekSites[d] = (weekSites[d]||0) + m;
  }
  if (s.liveSession && s.liveSiteMinutes > 0) {
    const savedTodayMinutes = (siteDaily[todayKey] || {})[s.liveSession.domain] || 0;
    weekSites[s.liveSession.domain] = (weekSites[s.liveSession.domain] || 0) - savedTodayMinutes + s.liveSiteMinutes;
  }
  renderSites('sites-week', weekSites);

  // Sessions
  const sessEl = document.getElementById('sessions-list');
  if (!sessions.length) {
    sessEl.textContent = tr('emptySessions');
    sessEl.className = 'empty-state';
    return;
  }
  sessEl.className = '';
  sessEl.innerHTML = '';
  aggregateRecentSessions(sessions).slice(0,6).forEach(s => {
    const item = document.createElement('div');
    item.className = 'session-item';
    const icon = document.createElement('span'); icon.className = 'site-ico'; icon.textContent = domainIcon(s.domain); icon.style.color = (DOMAIN_META[s.domain] || {}).color || 'var(--accent2)';
    const domain = document.createElement('span'); domain.className = 'si-domain'; domain.textContent = s.domain;
    const details = document.createElement('span'); details.className = 'si-details';
    const visits = document.createElement('span'); visits.className = 'si-date'; visits.textContent = s.visits === 1 ? tr('visitCountOne') : tr('visitCount', { count: s.visits });
    const recent = document.createElement('span'); recent.className = 'si-date';
    const recentDate = s.date && s.start ? new Date(`${s.date}T${s.start}:00`) : null;
    recent.textContent = recentDate && !Number.isNaN(recentDate.getTime())
      ? recentDate.toLocaleString(DATE_LOCALE[currentLang] || 'pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : '';
    details.append(visits, recent);
    const duration = document.createElement('span'); duration.className = 'si-time'; duration.textContent = formatRecentDuration(s.seconds);
    item.append(icon, domain, details, duration);
    sessEl.appendChild(item);
  });
}

// ── Render: Sites genérico ─────────────────────────────────────

function renderSites(containerId, sitesObj) {
  const el     = document.getElementById(containerId);
  const sorted = Object.entries(sitesObj).sort((a,b)=>b[1]-a[1]).slice(0,5);
  if (!sorted.length) {
    el.textContent = tr('noSites');
    el.className = 'empty-state';
    return;
  }
  const maxVal = sorted[0][1];
  el.className = '';
  el.innerHTML = '';
  sorted.forEach(([domain,min]) => {
    const pct  = Math.round((min/maxVal)*100);
    const icon = domainIcon(domain);
    const row = document.createElement('div');
    row.className = 'site-row';
    const ico = document.createElement('div'); ico.className = 'site-ico'; ico.textContent = icon; ico.style.color = (DOMAIN_META[domain] || {}).color || 'var(--accent2)';
    const name = document.createElement('div'); name.className = 'site-name'; name.textContent = domain;
    const track = document.createElement('div'); track.className = 'site-bar-bg';
    const fill = document.createElement('div'); fill.className = 'site-bar-fill'; fill.style.width = `${pct}%`;
    track.appendChild(fill);
    const time = document.createElement('div'); time.className = 'site-time'; time.textContent = `${fmt(min)}m`;
    row.append(ico, name, track, time);
    el.appendChild(row);
  });
}

// ── Render: Configurações ──────────────────────────────────────

function renderSettings(s) {
  const { dailyLimit=60, notificationsEnabled=true, weeklyReportEnabled=false, trackedDomains=[], lang='pt-BR' } = s;
  applyLanguage(lang);
  currentDomains = [...trackedDomains];
  renderWelcomeDomainChips();

  document.getElementById('limit-input').value   = dailyLimit;
  document.getElementById('limit-display').textContent = `${dailyLimit} min`;
  document.getElementById('notif-toggle').checked = notificationsEnabled;
  document.getElementById('weekly-toggle').checked = weeklyReportEnabled;
  document.getElementById('language-input').value = currentLang;

  renderDomainChips();
}

function renderDomainChips() {
  const container = document.getElementById('domain-chips');
  container.replaceChildren();
  if (!currentDomains.length) {
    const empty = document.createElement('span'); empty.className = 'domain-empty'; empty.textContent = tr('noMonitoredSites');
    container.appendChild(empty);
  }
  currentDomains.forEach((domain,index) => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.title = domain;
    chip.style.setProperty('--chip-color', DOMAIN_META[domain]?.color || '#a487ef');
    const dot = document.createElement('span'); dot.className = 'chip-dot'; dot.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span'); label.className = 'chip-name'; label.textContent = domain;
    const remove = document.createElement('button'); remove.className = 'rm'; remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', tr('removeSite', {domain}));
    chip.append(dot, label, remove);
    remove.addEventListener('click', () => {
      currentDomains.splice(index,1);
      renderDomainChips();
    });
    container.appendChild(chip);
  });
}

function renderWelcomeDomainChips() {
  const container = document.getElementById('welcome-domain-chips');
  if (!container) return;
  container.replaceChildren();
  currentDomains.forEach((domain, index) => {
    const chip = document.createElement('div');
    chip.className = 'welcome-domain-chip';
    const label = document.createElement('span');
    label.textContent = domain;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', tr('removeSite', {domain}));
    remove.addEventListener('click', () => {
      currentDomains.splice(index, 1);
      renderWelcomeDomainChips();
    });
    chip.append(label, remove);
    container.appendChild(chip);
  });
  const status = document.getElementById('welcome-domain-status');
  status.textContent = currentDomains.length === 1 ? tr('selectedSite') : currentDomains.length ? tr('selectedSites', {count:currentDomains.length}) : tr('noSelectedSites');
}

function addDomainFromInput(input, status, render) {
  const domain = normalizeDomain(input.value);
  status.classList.remove('error');
  if (!domain) { status.textContent = tr('domainInvalid'); status.classList.add('error'); input.focus(); return; }
  if (currentDomains.some(item => item === domain || domain.endsWith(`.${item}`))) {
    status.textContent = tr('domainDuplicate'); status.classList.add('error'); input.focus(); return;
  }
  currentDomains.push(domain);
  input.value = '';
  render();
  status.textContent = tr('siteAdded', {domain});
  input.focus();
}

function addWelcomeDomain() {
  addDomainFromInput(document.getElementById('welcome-domain-input'), document.getElementById('welcome-domain-status'), renderWelcomeDomainChips);
}

// ── Live session ticker ────────────────────────────────────────

function startLiveTicker(ls) {
  const lsEl    = document.getElementById('live-session');
  const domainEl= document.getElementById('ls-domain');
  const timeEl  = document.getElementById('ls-elapsed');

  if (!ls) { lsEl.classList.add('hidden'); clearInterval(liveInterval); return; }

  lsEl.classList.remove('hidden');
  domainEl.textContent = ls.domain;
  liveElapsed = ls.siteElapsedSec ?? ls.elapsedSec ?? (ls.elapsed * 60);

  clearInterval(liveInterval);
  liveInterval = setInterval(() => {
    liveElapsed++;
    timeEl.textContent = fmtLive(liveElapsed);
  }, 1000);
  timeEl.textContent = fmtLive(liveElapsed);
}

// ── Status pill (pause) ────────────────────────────────────────

function updateStatusPill(isPaused, hasAccess = true) {
  const pill = document.getElementById('pause-btn');
  const text = document.getElementById('status-text');
  pill.setAttribute('aria-pressed', String(isPaused));
  if (isPaused) {
    pill.classList.add('paused');
    text.textContent = tr('paused');
  } else if (!hasAccess) {
    pill.classList.add('paused');
    text.textContent = tr('permissionNeeded');
  } else {
    pill.classList.remove('paused');
    text.textContent = tr('active');
  }
}

// ── Export CSV ─────────────────────────────────────────────────

function exportCSV(data) {
  const { daily={}, sessions=[] } = data;
  let csv = 'Data,Total (min)\n';
  for (const [date, min] of Object.entries(daily).sort())
    csv += `${date},${min}\n`;
  csv += '\nDomínio,Data,Início,Duração (min),Duração (s)\n';
  for (const s of sessions)
    csv += `${s.domain},${s.date},${s.start},${s.minutes},${s.seconds ?? s.minutes * 60}\n`;

  const blob = new Blob([csv], { type:'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `doomscroll_${todayStr()}.csv`;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
}

// ── Init principal ────────────────────────────────────────────

async function init() {
  const errorPanel = document.getElementById('load-error');
  try {
    const s = await loadStats();
    if (!s || !Object.keys(s).length) throw new Error('No stats returned');
    errorPanel.hidden = true;
    statsCache = s;
    currentLang = COPY[s.lang] ? s.lang : currentLang;
    const welcome = document.getElementById('onboarding');
    welcome.hidden = Boolean(s.onboardingDone);

    renderToday(s);
    renderWeek(s);
    renderSettings(s);
    updateStatusPill(s.isPaused, s.trackingPermissionGranted);
    startLiveTicker(s.liveSession);
  } catch (error) {
    console.error('Doomscroll Tracker popup could not load.', error);
    errorPanel.hidden = false;
  }
}

// ── Tab switching ─────────────────────────────────────────────

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
    document.querySelectorAll('.tab').forEach(t => { if (t !== tab) t.setAttribute('aria-selected', 'false'); });
  });
});

// ── Event listeners ───────────────────────────────────────────
// Pause/retomar
document.getElementById('pause-btn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type:'togglePause' }, res => {
    if (res) updateStatusPill(res.isPaused, statsCache.trackingPermissionGranted);
  });
});

// Slider de limite
document.getElementById('limit-input').addEventListener('input', e => {
  document.getElementById('limit-display').textContent = `${e.target.value} min`;
});

// Adicionar domínio
document.getElementById('domain-add-btn').addEventListener('click', () => addDomainFromInput(document.getElementById('domain-input'), document.getElementById('domain-feedback'), renderDomainChips));
document.getElementById('domain-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); document.getElementById('domain-add-btn').click(); }
});

// Salvar configurações
document.getElementById('save-settings-btn').addEventListener('click', () => {
  const dailyLimit = parseInt(document.getElementById('limit-input').value);
  const notificationsEnabled = document.getElementById('notif-toggle').checked;
  const weeklyReportEnabled = document.getElementById('weekly-toggle').checked;
  const lang = document.getElementById('language-input').value;
  const status = document.getElementById('settings-status');
  const origins = permissionOrigins(currentDomains);
  const previousOrigins = permissionOrigins(statsCache.trackedDomains || []);
  const save = () => {
    const persist = () => chrome.runtime.sendMessage({
      type:'saveSettings', dailyLimit, notificationsEnabled, weeklyReportEnabled,
      trackedDomains:currentDomains, lang,
    }, () => {
      status.textContent = tr('saved'); status.style.color = 'var(--teal)';
      currentLang = lang; applyLanguage(lang);
    });
    const removed = previousOrigins.filter(origin => !origins.includes(origin));
    if (removed.length) chrome.permissions.remove({ origins: removed }, persist);
    else persist();
  };
  if (!origins.length) { save(); return; }
  chrome.permissions.request({ origins }, granted => {
    if (!granted) { status.textContent = tr('savePermissionDenied'); status.style.color = 'var(--amber)'; return; }
    save();
  });
});

// Export CSV
document.getElementById('export-btn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type:'exportCSV' }, data => {
    if (data) exportCSV(data);
  });
});

// Opções completas
document.getElementById('options-btn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Resetar tudo
document.getElementById('reset-btn').addEventListener('click', () => {
  if (confirm(tr('confirmReset'))) {
    chrome.runtime.sendMessage({ type:'resetData' }, () => init());
  }
});

document.getElementById('load-retry').addEventListener('click', init);

document.getElementById('welcome-lang').addEventListener('change', e => applyLanguage(e.target.value));
document.getElementById('welcome-add-domain').addEventListener('click', addWelcomeDomain);
document.getElementById('welcome-domain-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); addWelcomeDomain(); }
});
document.getElementById('language-input').addEventListener('change', e => applyLanguage(e.target.value));
function finishOnboarding(lang) {
  const domains = [...currentDomains];
  chrome.runtime.sendMessage({ type:'saveSettings', dailyLimit:statsCache.dailyLimit || 60, notificationsEnabled:statsCache.notificationsEnabled !== false, weeklyReportEnabled:statsCache.weeklyReportEnabled === true, trackedDomains:domains, lang }, () => {
    chrome.runtime.sendMessage({ type:'completeOnboarding' }, () => { document.getElementById('onboarding').hidden = true; init(); });
  });
}
function permissionOrigins(domains) {
  return [...new Set(domains.flatMap(domain => [`https://*.${domain}/*`, `http://*.${domain}/*`]))];
}
document.getElementById('welcome-start').addEventListener('click', () => {
  const lang = document.getElementById('welcome-lang').value;
  const origins = permissionOrigins(currentDomains);
  const message = document.getElementById('permission-message');
  if (!origins.length) { message.hidden = true; finishOnboarding(lang); return; }
  chrome.permissions.request({ origins }, granted => {
    if (!granted) { message.hidden = false; message.textContent = tr('permissionDenied'); return; }
    message.hidden = true;
    finishOnboarding(lang);
  });
});
document.getElementById('welcome-skip').addEventListener('click', () => finishOnboarding(document.getElementById('welcome-lang').value));

// ── Kick off ─────────────────────────────────────────────────

init();
const refreshInterval = setInterval(init, 30000);
window.addEventListener('unload', () => {
  clearInterval(refreshInterval);
  clearInterval(liveInterval);
});
