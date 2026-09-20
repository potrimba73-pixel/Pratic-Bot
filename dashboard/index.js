<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pratic Bot — Dashboard</title>
<link rel="stylesheet" href="style.css">
</head>
<body>

<!-- ═══════════════ SIDEBAR ═══════════════ -->
<aside class="sidebar">
  <div class="brand">
    <div class="brand-logo">🎫</div>
    <div>
      <div class="brand-name">Pratic Bot</div>
      <div class="brand-sub">Dashboard</div>
    </div>
  </div>

  <nav class="nav">
    <div class="nav-section">Configuração</div>
    <a class="nav-item" data-tab="welcome">
      <span class="ico">👋</span> Boas-vindas
    </a>
    <a class="nav-item" data-tab="leave">
      <span class="ico">🚪</span> Saída
    </a>
    <a class="nav-item" data-tab="anuncios">
      <span class="ico">📢</span> Anúncios
    </a>

    <div class="nav-section">Segurança</div>
    <a class="nav-item" data-tab="mod">
      <span class="ico">🛡️</span> Moderação
    </a>
    <a class="nav-item" data-tab="scam">
      <span class="ico">🚨</span> Anti-Scam
    </a>

    <div class="nav-section">Extras</div>
    <a class="nav-item" data-tab="idiomas">
      <span class="ico">🌍</span> Idiomas
    </a>
    <a class="nav-item" data-tab="embeds">
      <span class="ico">📋</span> Embeds
    </a>
    <a class="nav-item" data-tab="geral">
      <span class="ico">⚙️</span> Geral
    </a>
  </nav>

  <div class="sidebar-footer">
    <div class="status-pill" id="status-pill">
      <span class="dot"></span> <span id="status-text">A carregar…</span>
    </div>
  </div>
</aside>

<!-- ═══════════════ MAIN ═══════════════ -->
<main class="main">

  <!-- ─────── TOPBAR ─────── -->
  <header class="topbar">
    <div>
      <h1 id="page-title">Boas-vindas</h1>
      <p class="page-sub" id="page-sub">Configura a mensagem enviada quando alguém entra no servidor.</p>
    </div>
    <div class="topbar-actions">
      <span class="save-state" id="save-state"></span>
      <button class="btn btn-primary" id="btn-save">
        💾 Guardar alterações
      </button>
    </div>
  </header>

  <!-- ═══════════════════════════════════════════ -->
  <!-- TAB: WELCOME                                -->
  <!-- ═══════════════════════════════════════════ -->
  <section class="tab" id="tab-welcome">

    <div class="layout">

      <!-- ─────── COLUNA ESQUERDA (FORM) ─────── -->
      <div class="col-form">

        <!-- CANAL -->
        <div class="card">
          <div class="card-title">Canal de envio</div>
          <div class="field">
            <label>Selecione o canal para onde as mensagens serão enviadas</label>
            <div class="input-wrap">
              <span class="prefix">#</span>
              <input type="text" id="w-channel" placeholder="ID do canal (ex: 123456789012345678)">
            </div>
            <p class="hint">Cola o ID do canal. Ativa o Modo Programador no Discord para o copiar.</p>
          </div>
        </div>

        <!-- MENSAGEM -->
        <div class="card">
          <div class="card-title">Mensagem</div>
          <div class="field">
            <label>Mensagem personalizada</label>
            <div class="variable-bar">
              <span class="var-label">Inserir:</span>
              <button class="var-btn" data-var="{user.mention}">@user</button>
              <button class="var-btn" data-var="{user.name}">user</button>
              <button class="var-btn" data-var="{user.tag}">user#0000</button>
              <button class="var-btn" data-var="{server.name}">server</button>
              <button class="var-btn" data-var="{memberCount}">memberCount</button>
            </div>
            <div class="textarea-wrap">
              <textarea id="w-message" maxlength="2000"
                placeholder="Bem-vindo {user.mention} ao **{server.name}**!"></textarea>
              <div class="counter"><span id="w-message-count">0</span> / 2000</div>
            </div>
            <label class="switch">
              <input type="checkbox" id="w-use-embed">
              <span class="switch-slider"></span>
              <span class="switch-label">Enviar uma embed com essa mensagem</span>
            </label>
          </div>
        </div>

        <!-- EMBED BUILDER -->
        <div class="card" id="w-embed-card">
          <div class="card-title">Embed</div>

          <div class="grid-2">
            <div class="field">
              <label>Cor</label>
              <div class="color-wrap">
                <input type="color" id="w-embed-color" value="#5865F2">
                <input type="text" id="w-embed-color-hex" value="#5865F2" maxlength="7">
              </div>
            </div>
            <div class="field">
              <label>Autor — Nome</label>
              <input type="text" id="w-embed-author" placeholder="Nome do autor" maxlength="256">
            </div>
          </div>

          <div class="field">
            <label>Título</label>
            <input type="text" id="w-embed-title" placeholder="Título da embed" maxlength="256">
          </div>

          <div class="field">
            <label>Descrição</label>
            <div class="textarea-wrap">
              <textarea id="w-embed-desc" maxlength="4096"
                placeholder="Descrição da embed"></textarea>
              <div class="counter"><span id="w-embed-desc-count">0</span> / 4096</div>
            </div>
          </div>

          <div class="field">
            <div class="field-header">
              <label>Campos</label>
              <button class="btn-mini" id="w-add-field">+ Adicionar Campo</button>
            </div>
            <div id="w-fields-list" class="fields-list"></div>
          </div>

          <div class="grid-2">
            <div class="field">
              <label>Imagem (URL)</label>
              <input type="text" id="w-embed-image" placeholder="https://...">
            </div>
            <div class="field">
              <label>Thumbnail (URL)</label>
              <input type="text" id="w-embed-thumb" placeholder="https://...">
            </div>
          </div>

          <div class="grid-2">
            <div class="field">
              <label>Rodapé — Texto</label>
              <input type="text" id="w-embed-footer" placeholder="Texto do rodapé" maxlength="2048">
            </div>
            <div class="field">
              <label>Rodapé — Ícone (URL)</label>
              <input type="text" id="w-embed-footer-icon" placeholder="https://...">
            </div>
          </div>

          <label class="switch">
            <input type="checkbox" id="w-embed-timestamp">
            <span class="switch-slider"></span>
            <span class="switch-label">Adicionar marca de data e hora</span>
          </label>
        </div>

        <!-- IMAGEM PERSONALIZADA -->
        <div class="card">
          <div class="card-title">
            Imagem personalizada
            <span class="badge">Beta</span>
          </div>
          <p class="card-desc">Adicione uma imagem personalizada à mensagem.</p>

          <div class="segmented" id="w-img-mode">
            <button class="seg-btn active" data-mode="basic">Modo Básico</button>
            <button class="seg-btn" data-mode="advanced">Modo Avançado</button>
          </div>

          <!-- MODO BÁSICO -->
          <div class="img-panel" data-panel="basic">
            <div class="field">
              <label>Imagem do Plano de Fundo</label>
              <div class="url-row">
                <input type="text" id="w-bg-url" placeholder="Insira a URL de uma imagem">
                <label class="btn btn-ghost" for="w-bg-file">📁 Galeria</label>
                <input type="file" id="w-bg-file" accept="image/*" hidden>
              </div>
            </div>

            <div class="grid-2">
              <div class="field">
                <label>Forma do Avatar</label>
                <select id="w-avatar-shape">
                  <option value="circle">Círculo</option>
                  <option value="rounded">Arredondado</option>
                  <option value="square">Quadrado</option>
                </select>
              </div>
              <div class="field">
                <label>Fonte</label>
                <select id="w-font">
                  <option value="Discord">Discord</option>
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                </select>
              </div>
            </div>

            <div class="field">
              <label>Mensagem na imagem</label>
              <input type="text" id="w-img-text" placeholder="Bem-vindo {user.name}" maxlength="100">
            </div>

            <div class="grid-2">
              <div class="field">
                <label>Cor do Plano de Fundo</label>
                <input type="color" id="w-bg-color" value="#1e1f22">
              </div>
              <div class="field">
                <label>Cor do Nome de Usuário</label>
                <input type="color" id="w-name-color" value="#ffffff">
              </div>
            </div>
            <div class="grid-2">
              <div class="field">
                <label>Cor da Mensagem</label>
                <input type="color" id="w-msg-color" value="#dbdee1">
              </div>
              <div class="field">
                <label>Cor do Círculo</label>
                <input type="color" id="w-circle-color" value="#5865F2">
              </div>
            </div>
          </div>

          <!-- MODO AVANÇADO -->
          <div class="img-panel hidden" data-panel="advanced">
            <div class="grid-4">
              <div class="field"><label>X</label><input type="number" id="adv-x" value="0"></div>
              <div class="field"><label>Y</label><input type="number" id="adv-y" value="0"></div>
              <div class="field"><label>W</label><input type="number" id="adv-w" value="0"></div>
              <div class="field"><label>H</label><input type="number" id="adv-h" value="0"></div>
            </div>
            <div class="field">
              <label>Opacidade</label>
              <input type="range" id="adv-opacity" min="0" max="100" value="100">
              <span class="range-value" id="adv-opacity-val">100</span>
            </div>
            <label class="switch">
              <input type="checkbox" id="adv-lock">
              <span class="switch-slider"></span>
              <span class="switch-label">Travar proporção</span>
            </label>
          </div>

          <div class="field">
            <label>Posição da Imagem</label>
            <p class="hint">Escolha onde a imagem deve ser exibida na mensagem.</p>
            <div class="radio-row">
              <label class="radio-pill"><input type="radio" name="w-img-pos" value="padrao" checked> Padrão</label>
              <label class="radio-pill"><input type="radio" name="w-img-pos" value="anexo"> Anexo</label>
              <label class="radio-pill"><input type="radio" name="w-img-pos" value="incorporado"> Incorporado</label>
            </div>
          </div>
        </div>

      </div>

      <!-- ─────── COLUNA DIREITA (PREVIEW) ─────── -->
      <div class="col-preview">
        <div class="preview-header">
          <span class="preview-title">👁️ Prévia</span>
          <button class="btn-mini" id="btn-reset-preview">↺ Reset</button>
        </div>

        <div class="discord-preview" id="preview-discord">
          <div class="msg-row">
            <div class="msg-avatar" id="prev-avatar"></div>
            <div class="msg-body">
              <div class="msg-header">
                <span class="msg-author">Pratic Bot</span>
                <span class="msg-bot-tag">APP</span>
                <span class="msg-time" id="prev-time">Hoje às 00:00</span>
              </div>

              <!-- Texto simples -->
              <div class="msg-content" id="prev-content">Bem-vindo…</div>

              <!-- Embed -->
              <div class="discord-embed hidden" id="prev-embed">
                <div class="embed-bar" id="prev-embed-bar"></div>
                <div class="embed-inner">
                  <div class="embed-author hidden" id="prev-embed-author">
                    <span class="embed-author-icon" id="prev-embed-author-icon"></span>
                    <span class="embed-author-name" id="prev-embed-author-name"></span>
                  </div>
                  <div class="embed-title hidden" id="prev-embed-title"></div>
                  <div class="embed-desc" id="prev-embed-desc"></div>
                  <div class="embed-fields" id="prev-embed-fields"></div>
                  <div class="embed-image hidden" id="prev-embed-image"></div>
                  <div class="embed-thumb hidden" id="prev-embed-thumb"></div>
                  <div class="embed-footer hidden" id="prev-embed-footer">
                    <span class="embed-footer-icon hidden" id="prev-embed-footer-icon"></span>
                    <span id="prev-embed-footer-text"></span>
                    <span class="embed-footer-sep hidden" id="prev-embed-footer-sep">•</span>
                    <span id="prev-embed-footer-time"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="preview-info">
          <div class="info-item"><span class="k">Variáveis disponíveis</span></div>
          <ul class="var-list">
            <li><code>{user.mention}</code> — menciona o utilizador</li>
            <li><code>{user.name}</code> — nome de utilizador</li>
            <li><code>{user.tag}</code> — nome#0000</li>
            <li><code>{server.name}</code> — nome do servidor</li>
            <li><code>{memberCount}</code> — nº de membros</li>
          </ul>
        </div>
      </div>

    </div>
  </section>

  <!-- ─────── OUTRAS TABS (placeholder) ─────── -->
  <section class="tab hidden" id="tab-leave">
    <div class="empty-state">🚪 <strong>Saída</strong><br>Em breve.</div>
  </section>
  <section class="tab hidden" id="tab-anuncios">
    <div class="empty-state">📢 <strong>Anúncios</strong><br>Em breve.</div>
  </section>
  <section class="tab hidden" id="tab-mod">
    <div class="empty-state">🛡️ <strong>Moderação</strong><br>Em breve.</div>
  </section>
  <section class="tab hidden" id="tab-scam">
    <div class="empty-state">🚨 <strong>Anti-Scam</strong><br>Em breve.</div>
  </section>
  <section class="tab hidden" id="tab-idiomas">
    <div class="empty-state">🌍 <strong>Idiomas</strong><br>Em breve.</div>
  </section>
  <section class="tab hidden" id="tab-embeds">
    <div class="empty-state">📋 <strong>Embeds</strong><br>Em breve.</div>
  </section>
  <section class="tab hidden" id="tab-geral">
    <div class="empty-state">⚙️ <strong>Geral</strong><br>Em breve.</div>
  </section>

</main>

<script src="app.js"></script>
</body>
</html>
