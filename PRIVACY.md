# Política de Privacidade — Doomscroll Tracker

Última atualização: 5 de novembro de 2026

## Em resumo

Doomscroll Tracker mede o tempo em domínios que a pessoa escolhe monitorar. O processamento e o armazenamento acontecem localmente no perfil do Chrome. A extensão não envia dados de navegação a servidores, não os compartilha com terceiros e não usa analytics ou publicidade.

## Dados tratados

- **Domínios monitorados:** a extensão lê o endereço da aba ativa para verificar se o domínio corresponde a um item da lista escolhida. O domínio correspondente e a duração da visita podem ser registrados. Caminhos de página, conteúdo, buscas, cookies, formulários e credenciais não são registrados.
- **Estatísticas e sessões:** totais de tempo por dia, semana e domínio, além de horários e durações das sessões recentes.
- **Preferências:** idioma, meta diária, notificações, resumo semanal e lista de domínios.

Esses dados são necessários para exibir o acompanhamento de tempo solicitado. São guardados em `chrome.storage.local`; a referência da sessão ativa usa `chrome.storage.session`. A extensão não transmite esses dados para fora do navegador.

## Permissões e escolha

O acesso aos sites é opcional e solicitado apenas para os domínios adicionados à lista. Sem essa autorização, a extensão não consegue reconhecer nem contar o tempo nesses sites. A pessoa pode alterar a lista, revogar permissões nas configurações do Chrome ou continuar sem monitoramento.

As permissões `storage`, `idle`, `notifications` e `alarms` dão suporte ao armazenamento local, pausa quando o dispositivo fica inativo, alertas opcionais e atualização do selo da extensão. O acesso `activeTab` é usado somente por recursos iniciados pela pessoa no Chrome.

## Compartilhamento e retenção

Não vendemos nem compartilhamos dados com terceiros. Não há servidor de conta, sincronização própria, anúncios ou telemetria. O histórico permanece no perfil do Chrome até ser apagado pela pessoa, até que os dados da extensão sejam removidos ou até que a extensão seja desinstalada. O botão **Apagar histórico** remove as estatísticas locais.

## Segurança e alterações

Como o histórico fica no perfil local do Chrome, sua proteção depende também da segurança do dispositivo e do perfil do navegador. Esta política será atualizada se as práticas de dados mudarem; alterações relevantes serão explicadas dentro da extensão.

## Contato

Para dúvidas ou solicitações sobre privacidade, abra uma issue no [repositório do projeto](https://github.com/TheoGoulart333/doomscroll-tracker/issues).

## Chrome Web Store — declaração de uso limitado

The use of information received from Google APIs will adhere to the Chrome Web Store User Data Policy, including the Limited Use requirements. Data received from Chrome APIs is used only to provide the extension's user-facing time tracking features, is processed locally, and is not transferred to or shared with third parties.

---

## English

### Summary

Doomscroll Tracker measures time on domains a person chooses to monitor. Processing and storage happen locally in the Chrome profile. The extension does not send browsing data to servers, share it with third parties, or use analytics or advertising.

### Data handled

- **Tracked domains:** the extension reads the active tab URL to check whether its domain matches the user's list. It may record the matching domain and visit duration. Page paths, page content, searches, cookies, forms, and credentials are not recorded.
- **Statistics and sessions:** time totals by day, week, and domain, plus recent session times and durations.
- **Preferences:** language, daily goal, notifications, weekly summary, and domain list.

This information is necessary to provide the requested time tracking. It is stored in `chrome.storage.local`; the active-session reference uses `chrome.storage.session`. The extension does not transmit this information outside the browser.

Site access is optional and requested only for domains added to the list. Without permission, the extension cannot recognize or count time on those sites. Users can edit the list, revoke permissions in Chrome settings, or continue without tracking.

Data is not sold or shared. There is no account server, custom synchronization, advertising, or telemetry. Local history remains in the Chrome profile until users clear it, remove the extension's data, or uninstall the extension. The **Clear history** button deletes local statistics.

For privacy questions or requests, open an issue in the [project repository](https://github.com/TheoGoulart333/doomscroll-tracker/issues).
