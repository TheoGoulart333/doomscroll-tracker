# 🚫 Doomscroll Tracker

<div align="center">

<img src="icons/icon-128.png" alt="Doomscroll Tracker" width="96" />

### Monitore o tempo que você passa em sites de entretenimento — e retome o controle da sua atenção.

![Version](https://img.shields.io/badge/version-2.0.0-8b5cf6?style=flat-square)
![Manifest](https://img.shields.io/badge/Manifest-V3-2dd4bf?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-fb7185?style=flat-square)
![Privacy](https://img.shields.io/badge/privacy-100%25_local-22d3a5?style=flat-square)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-fbbf24?style=flat-square)

**[Instalar](#-instalacao) · [Funcionalidades](#-funcionalidades) · [Como funciona](#-como-funciona) · [Contribuir](#-contribuindo)**

</div>

---

## ✨ Por que essa extensão?

Você já abriu o Twitter "só por um segundo" e percebeu que passaram 45 minutos? Isso é **doomscrolling** — o consumo inconsciente e infinito de conteúdo em feeds de redes sociais.

**Doomscroll Tracker** monitora em tempo real quanto tempo você passa nesses sites, mostra seu progresso diário e semanal, e te dá nudges gentis para fazer uma pausa. Sem julgamento — só clareza.

---

## 🚀 Funcionalidades

### 📊 Dashboard com 3 abas

**Aba Hoje**
- ⏱ **Timer ao vivo** — vê em tempo real quantos minutos você está no site atual
- 📈 **Cards de hoje e semana** com comparativo percentual vs. ontem e semana passada
- 🔥 **Streak de dias** abaixo do limite com recorde pessoal
- 💬 **Mensagens dinâmicas** com personalidade — de `😌 Tudo certo!` a `🚨 Limite atingido!`
- 🎉 **Confetti** quando você mantém um streak de 3+ dias
- 🏆 Emojis adaptativos: `🌱` → `🔥` → `🏆`

**Aba Semana**
- 📊 **Gráfico de barras** dos últimos 7 dias com destaque no dia atual
- 📉 **Pills de resumo**: média, melhor e pior dia
- 🌐 **Top sites** rankeados por tempo (semana), com barra proporcional
- 📋 **Sessões recentes** com horário de início e duração
- 📥 **Export CSV** com histórico completo por dia e por sessão

**Aba Configurações**
- 🎚 **Limite diário customizável** via slider (10–300 min)
- 🔔 **Notificações do sistema** a 80% e 100% do limite (ativáveis/desativáveis)
- ➕ **Adicionar e remover domínios** diretamente no popup (chips clicáveis)

### 🔒 Privacidade total
- **Zero dados enviados** a servidores externos
- Tudo armazenado em `chrome.storage.local` — só você acessa
- Código aberto e auditável

---

## 📦 Instalacao

> Instalação via modo desenvolvedor — não requer publicação na Chrome Web Store.

**1. Clone o repositório:**
```bash
git clone https://github.com/TheoGoulart333/doomscroll-tracker.git
```

**2. Abra o Chrome e acesse:**
```
chrome://extensions/
```

**3. Ative o "Modo de desenvolvedor"** (canto superior direito).

**4. Clique em "Carregar sem compactação"** e selecione a pasta `doomscroll-tracker`.

**5. Pronto!** O ícone aparecerá na barra de ferramentas. Clique para começar. 🎉

---

## 🛠 Como funciona

```
┌─────────────────────────────────────────────────────────────┐
│                       CHROME BROWSER                        │
│                                                             │
│  ┌──────────────────┐       ┌──────────────────────────┐   │
│  │  background.js   │◄─────►│      popup.html / js     │   │
│  │  (service worker)│       │                          │   │
│  │                  │       │  Aba Hoje:               │   │
│  │  • Detecta URL   │       │   timer ao vivo          │   │
│  │  • Conta tempo   │       │   streak, mood, top sites│   │
│  │  • Salva sessões │       │                          │   │
│  │  • Streaks       │       │  Aba Semana:             │   │
│  │  • Notificações  │       │   gráfico 7 dias         │   │
│  └────────┬─────────┘       │   export CSV             │   │
│           │                 │                          │   │
│           ▼                 │  Aba Configurações:      │   │
│  ┌──────────────────┐       │   limite, notifs, sites  │   │
│  │ chrome.storage   │       └──────────────────────────┘   │
│  │ .local           │                                       │
│  │                  │  ← 100% local, sem servidores         │
│  │  daily: {...}    │                                       │
│  │  weekly: {...}   │                                       │
│  │  siteDaily: {...}│                                       │
│  │  sessions: [...] │                                       │
│  │  streak: 5       │                                       │
│  │  dailyLimit: 60  │                                       │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de rastreamento

1. **Troca de aba / mudança de URL** → `background.js` verifica se o domínio está na lista monitorada
2. **Domínio detectado** → inicia timer (`startTimestamp = Date.now()`)
3. **Usuário sai do site** (muda de aba, URL ou fica inativo) → `stopTracking()` calcula `agora - startTimestamp` em minutos
4. **Dados salvos** em `daily`, `weekly`, `siteDaily` (por site/dia) + array de sessões
5. **Streak recalculado** a cada sessão salva
6. **Notificação** disparada ao atingir 80% e 100% do limite diário

### Estrutura dos dados

```json
{
  "daily":     { "2026-11-05": 42, "2026-11-04": 61 },
  "weekly":    { "2026-W44": 180 },
  "siteDaily": { "2026-11-05": { "youtube.com": 20, "reddit.com": 22 } },
  "sessions":  [{ "domain": "youtube.com", "date": "2026-11-05", "start": "14:32", "minutes": 20 }],
  "streak":    3,
  "bestStreak": 7,
  "dailyLimit": 60,
  "trackedDomains": ["youtube.com", "reddit.com", "twitter.com", "..."]
}
```

---

## 🌐 Sites monitorados (padrão)

| Site | Domínio |
|------|---------|
| YouTube | `youtube.com` |
| Reddit | `reddit.com` |
| Twitter / X | `twitter.com`, `x.com` |
| Instagram | `instagram.com` |
| TikTok | `tiktok.com` |
| Facebook | `facebook.com` |
| Twitch | `twitch.tv` |
| LinkedIn | `linkedin.com` |
| HuffPost | `huffpost.com` |
| BuzzFeed | `buzzfeed.com` |

> Adicione ou remova sites diretamente no popup (aba Configurações → chips clicáveis).

---

## 🔐 Privacidade

| Item | Detalhe |
|------|---------|
| **Coleta de dados** | Nenhum dado é coletado ou enviado |
| **Armazenamento** | `chrome.storage.local` — exclusivo do navegador do usuário |
| **Telemetria** | Zero — sem analytics, sem tracking externo |
| **Código** | 100% open source e auditável |

**Permissões solicitadas:**
- `storage` — salvar dados localmente
- `tabs` / `activeTab` — detectar qual site está ativo
- `idle` — pausar contagem quando o usuário não está usando o computador
- `notifications` — avisos de limite (desativável nas configurações)
- `alarms` — reset da flag de notificação à meia-noite

---

## 🗂 Estrutura do projeto

```
doomscroll-tracker/
├── manifest.json        # Declaração da extensão (MV3)
├── background.js        # Service worker — coração do rastreamento
├── popup.html           # Interface principal (340px, 3 abas)
├── popup.js             # Lógica do popup: tabs, charts, timer, export
├── options.html         # Página de opções completa
├── options.js           # Lógica das opções
├── icons/
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
├── LICENSE              # MIT
├── CONTRIBUTING.md
└── README.md
```

---

## 🤝 Contribuindo

Contribuições são muito bem-vindas!

1. **Fork** este repositório
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Commit seguindo [Conventional Commits](https://www.conventionalcommits.org/pt-br/): `feat: adiciona X`
4. Abra um **Pull Request**

**Ideias abertas:**
- [ ] Light mode
- [ ] Suporte a Firefox
- [ ] Meta semanal configurável
- [ ] Companion app mobile (Flutter)
- [ ] Publicação na Chrome Web Store

---

## 📄 Licença

MIT © 2026 Theo Goulart — Veja [LICENSE](LICENSE) para detalhes.

---

<div align="center">

**Feito com 💜 para ajudar pessoas a retomarem o controle da sua atenção.**

Se esse projeto te ajudou, deixa uma ⭐ — significa muito!

</div>
