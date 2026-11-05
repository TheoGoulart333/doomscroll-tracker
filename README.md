# 🚫 Doomscroll Tracker

<div align="center">

<img src="icons/icon-128.png" alt="Doomscroll Tracker" width="100" />

**Monitore o tempo que você passa em sites de entretenimento — e retome o controle da sua atenção.**

[![Version](https://img.shields.io/badge/versão-2.0.0-8b5cf6?style=flat-square)](https://github.com/SEU_USUARIO/doomscroll-tracker)
[![Manifest](https://img.shields.io/badge/Manifest-V3-2dd4bf?style=flat-square)](https://developer.chrome.com/docs/extensions/mv3/)
[![License](https://img.shields.io/badge/licença-MIT-fb7185?style=flat-square)](LICENSE)
[![Privacy](https://img.shields.io/badge/privacidade-100%25%20local-22d3a5?style=flat-square)](#-privacidade)
[![PRs Welcome](https://img.shields.io/badge/PRs-bem--vindos-fbbf24?style=flat-square)](CONTRIBUTING.md)

[**Instalar manualmente**](#-instalação) · [**Ver funcionalidades**](#-funcionalidades) · [**Como funciona**](#-como-funciona) · [**Contribuir**](#-contribuindo)

---

![Preview do popup](docs/preview.png)

</div>

---

## ✨ Por que essa extensão?

Você já abriu o Twitter "só por um segundo" e percebeu que passaram 45 minutos? Isso é **doomscrolling** — o consumo inconsciente e infinito de conteúdo em feeds de redes sociais.

**Doomscroll Tracker** monitora em tempo real quanto tempo você passa nesses sites, mostra seu progresso diário e semanal, e te dá nudges gentis (não irritantes) para fazer uma pausa. Sem julgamento — só clareza.

---

## 🚀 Funcionalidades

### 📊 Dashboard inteligente
- **Timer ao vivo** — vê em tempo real quantos minutos você está no site atual
- **Cards de hoje e semana** com comparativo percentual vs. ontem e semana passada
- **Gráfico de barras** dos últimos 7 dias com destaque no dia atual
- **Top sites** rankeados por tempo (hoje e semana), com barra proporcional
- **Sessões recentes** com horário de início e duração

### 🔥 Streak & motivação
- **Contador de dias consecutivos** abaixo do limite diário
- **Recorde pessoal** (melhor streak)
- **Mensagens dinâmicas** com personalidade — de `😌 Tudo certo!` a `🚨 Limite atingido!`
- **Confetti** quando você mantém um streak de 3+ dias 🎉
- **Emojis adaptativos**: `🌱` → `🔥` → `🏆`

### ⚙️ Configurável do jeito que você quer
- **Limite diário customizável** via slider (10–300 min)
- **Adicionar e remover domínios** diretamente no popup (chips clicáveis)
- **Notificações do sistema** a 80% e 100% do limite
- **Pausa / Retomar** rastreamento com um clique
- **Export CSV** com histórico completo por dia e por sessão

### 🔒 Privacidade total
- **Zero dados enviados** a servidores externos
- Tudo armazenado em `chrome.storage.local` — só você acessa
- Código aberto e auditável

---

## 📸 Screenshots

<div align="center">
<table>
<tr>
  <td align="center"><strong>Aba Hoje</strong><br><img src="docs/screenshot-today.png" width="220"/></td>
  <td align="center"><strong>Aba Semana</strong><br><img src="docs/screenshot-week.png" width="220"/></td>
  <td align="center"><strong>Configurações</strong><br><img src="docs/screenshot-settings.png" width="220"/></td>
</tr>
</table>
</div>

---

## 📦 Instalação

### Via GitHub (modo desenvolvedor)

> Não requer publicação na Chrome Web Store — instale diretamente do repositório.

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/SEU_USUARIO/doomscroll-tracker.git
   cd doomscroll-tracker
   ```

2. **Abra o Chrome e vá para:**
   ```
   chrome://extensions/
   ```

3. **Ative o Modo de desenvolvedor** (interruptor no canto superior direito).

4. **Clique em "Carregar sem compactação"** e selecione a pasta `doomscroll-tracker`.

5. O ícone aparecerá na barra de ferramentas. Clique para começar! 🎉

### Download direto (ZIP)

1. [Baixe o ZIP mais recente](https://github.com/SEU_USUARIO/doomscroll-tracker/releases/latest)
2. Extraia a pasta
3. Siga os passos 2–5 acima

---

## 🛠 Como funciona

```
┌─────────────────────────────────────────────────────────┐
│                    CHROME BROWSER                       │
│                                                         │
│  ┌────────────────┐      ┌───────────────────────────┐  │
│  │  background.js │      │       popup.html/js        │  │
│  │  (service      │◄────►│  (UI com 3 abas:          │  │
│  │   worker)      │      │   Hoje / Semana /          │  │
│  │                │      │   Configurações)           │  │
│  │  • Detecta URL │      │  • Mostra stats ao vivo   │  │
│  │  • Conta tempo │      │  • Timer em tempo real    │  │
│  │  • Salva dados │      │  • Gráficos e rankings    │  │
│  │  • Streaks     │      │  • Export CSV             │  │
│  │  • Notificações│      │  • Configurações inline   │  │
│  └───────┬────────┘      └───────────────────────────┘  │
│          │                                               │
│          ▼                                               │
│  ┌───────────────────┐                                   │
│  │ chrome.storage    │  ← Tudo 100% local no navegador  │
│  │ .local            │                                   │
│  │                   │                                   │
│  │ daily: {...}      │                                   │
│  │ weekly: {...}     │                                   │
│  │ siteDaily: {...}  │                                   │
│  │ sessions: [...]   │                                   │
│  │ streak: 5         │                                   │
│  │ dailyLimit: 60    │                                   │
│  └───────────────────┘                                   │
└─────────────────────────────────────────────────────────┘
```

### Fluxo de rastreamento

1. **Troca de aba / mudança de URL** → `background.js` verifica se o domínio está na lista monitorada
2. **Domínio detectado** → inicia timer (`startTimestamp = Date.now()`)
3. **Usuário sai do site** (muda de aba, URL ou fica inativo) → `stopTracking()` calcula `agora - startTimestamp` em minutos
4. **Dados salvos** em `daily`, `weekly` e `siteDaily` (por site/dia) + array de sessões
5. **Streak recalculado** a cada sessão salva
6. **Notificação** disparada ao atingir 80% e 100% do limite diário

### Estrutura de dados

```json
{
  "daily":    { "2026-11-05": 42, "2026-11-04": 61 },
  "weekly":   { "2026-W44": 180 },
  "siteDaily":{ "2026-11-05": { "youtube.com": 20, "reddit.com": 22 } },
  "sessions": [{ "domain": "youtube.com", "date": "2026-11-05", "start": "14:32", "minutes": 20 }],
  "streak":   3,
  "bestStreak": 7,
  "dailyLimit": 60,
  "trackedDomains": ["youtube.com","reddit.com","twitter.com","..."]
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

> Adicione ou remova sites diretamente no popup (aba Configurações).

---

## 🔐 Privacidade

Esta extensão foi desenvolvida com **privacidade por design**:

| Item | Detalhe |
|------|---------|
| **Coleta de dados** | Nenhum dado é coletado ou enviado |
| **Armazenamento** | `chrome.storage.local` — exclusivo do navegador do usuário |
| **Telemetria** | Zero — sem analytics, sem tracking externo |
| **Código** | 100% open source e auditável |
| **Permissões** | Apenas as necessárias (veja `manifest.json`) |

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
├── popup.html           # Interface principal (340px)
├── popup.js             # Lógica do popup, tabs, charts, export
├── options.html         # Página de opções completa
├── options.js           # Lógica das opções
├── icons/
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
├── docs/                # Screenshots e assets para o README
├── LICENSE
└── README.md
```

---

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Veja como:

1. **Fork** este repositório
2. Crie uma branch: `git checkout -b feature/minha-funcionalidade`
3. Commit: `git commit -m 'feat: adiciona minha funcionalidade'`
4. Push: `git push origin feature/minha-funcionalidade`
5. Abra um **Pull Request**

### Ideias para contribuir

- [ ] Suporte a Firefox (Manifest V3)
- [ ] Tema claro (light mode)
- [ ] Widget de meta semanal (ex.: "máx 5h na semana")
- [ ] Integração com Google Calendar (bloquear horários)
- [ ] Companion app mobile (Flutter)
- [ ] Localization (English, Español)
- [ ] Publicação na Chrome Web Store

---

## 📄 Licença

MIT © 2026 — Veja [LICENSE](LICENSE) para detalhes.

---

<div align="center">

**Feito com 💜 para ajudar pessoas a retomarem o controle da sua atenção.**

Se esse projeto te ajudou, deixa uma ⭐ — significa muito!

[⬆ Voltar ao topo](#-doomscroll-tracker)

</div>
