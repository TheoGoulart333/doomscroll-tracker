# Chrome Web Store listing draft

## Name

Doomscroll Tracker

## Short description (under 132 characters)

Veja quanto tempo você passa nos sites escolhidos. Privado, local e sem julgamentos.

## Detailed description (Português — Brasil)

Perceba para onde vai seu tempo online.

Doomscroll Tracker acompanha o tempo nos sites que você escolher e organiza os dados em um painel diário e semanal. Os registros ficam no seu navegador. Sem conta, sem anúncios e sem julgamentos.

**Acompanhe com clareza**
- Veja o tempo de hoje e da semana, com um contador ao vivo.
- Compare os últimos sete dias e confira os sites mais acessados.
- Consulte a atividade recente agrupada por site.
- Exporte seus dados em CSV quando quiser.

**Você escolhe o que acompanhar**
- Adicione domínios como `youtube.com` ou cole uma URL.
- O Chrome solicita acesso somente aos domínios da sua lista.
- Ajuste sua meta diária e, se quiser, ative alertas e um resumo semanal.

**Privacidade por padrão**
- O tempo, os domínios e as preferências ficam no perfil local do Chrome.
- A extensão não envia seu histórico para servidores nem compartilha dados com terceiros.
- Não lemos o conteúdo das páginas, buscas, cookies ou credenciais.
- Revogue o acesso aos sites ou apague seu histórico quando quiser.

Idiomas disponíveis: português, inglês, espanhol e francês.

Saiba mais: https://github.com/TheoGoulart333/doomscroll-tracker
Política de privacidade: https://github.com/TheoGoulart333/doomscroll-tracker/blob/main/PRIVACY.md

## Categoria sugerida

Produtividade.

## Privacy fields to declare in the Developer Dashboard

- Declare that the extension handles **web browsing activity**: selected site domains and time spent on them.
- Explain that it is used only for the extension's core time-tracking and reporting features.
- State that it is stored locally and is not sold, shared, or transmitted to a server.
- Do not claim that the extension handles no user data; local processing still counts as handling under Chrome Web Store policy.
- Add the public `PRIVACY.md` URL in the privacy policy field.

## Permission justifications

| Permission | User-facing purpose |
|---|---|
| `storage` | Save the user's settings, daily and weekly totals, and recent sessions in the browser. |
| `idle` | Pause counting while the device is idle and resume when it becomes active. |
| `notifications` | Show optional daily-goal alerts and the optional weekly summary. |
| `alarms` | Update the extension badge and schedule the weekly summary when enabled. |
| Optional host access | Recognize visits only on domains the user adds and authorizes. |

## Listing assets still needed

- At least one current, real product screenshot; preferably five showing Today, Week, Settings/site addition, onboarding/privacy, and the grouped recent activity. Use 1280×800 or 640×400, full bleed, with square corners. Capture them after final UI QA and without personal tabs, names, or unrelated browser content.
- Developer account setup and two-step verification.
- Final review of the dashboard's privacy disclosures against `PRIVACY.md` and the permissions above.
- A final unpacked-install smoke check in Chrome, including install, granting/revoking a domain, tracking across tab switches and worker restarts, export, clear history, and optional notifications.
- Upload the ZIP with `manifest.json` at the archive root, submit for review, then publish from the Chrome Web Store Developer Dashboard.
