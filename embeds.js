// ============================================================
//  PRATIC BOT — embeds.js
//  Constrói todos os embeds a partir do traducoes.js
// ============================================================
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const config    = require("./config");
const TRADUCOES = require("./traducoes");

// ─────────────────────────────────────────────
//  Placeholders {CANAL:xxx} → <#ID>
// ─────────────────────────────────────────────
function substituirCanais(texto) {
  return String(texto).replace(/\{CANAL:([a-z0-9\-]+)\}/g, (_, nome) => {
    const id = config.canais[nome];
    return id ? `<#${id}>` : `#${nome}`;
  });
}

// ─────────────────────────────────────────────
//  Constrói um embed a partir de uma chave
// ─────────────────────────────────────────────
function build(chave, idioma = config.idiomaPadrao) {
  const t =
    TRADUCOES[idioma]?.[chave] ??
    TRADUCOES[config.idiomaPadrao]?.[chave];

  if (!t) {
    return new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle("⚠️ Embed não encontrado")
      .setDescription(`Chave: \`${chave}\``);
  }

  return new EmbedBuilder()
    .setColor(config.corPratic)
    .setTitle(t.titulo)
    .setDescription(substituirCanais(t.descricao))
    .setFooter({ text: t.rodape });
}

// ─────────────────────────────────────────────
//  Linha de botões de idioma
// ─────────────────────────────────────────────
function linhaIdiomas(chave) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`lang:pt-pt:${chave}`)
      .setLabel("PT-PT").setEmoji("🇵🇹")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`lang:pt-br:${chave}`)
      .setLabel("PT-BR").setEmoji("🇧🇷")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`lang:es:${chave}`)
      .setLabel("ES").setEmoji("🇪🇸")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`lang:en:${chave}`)
      .setLabel("EN").setEmoji("🇬🇧")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`lang:ru:${chave}`)
      .setLabel("RU").setEmoji("🇷🇺")
      .setStyle(ButtonStyle.Danger),
  );
}

// ─────────────────────────────────────────────
//  Lista de chaves válidas
// ─────────────────────────────────────────────
const CHAVES = [
  "boas-vindas",
  "regras",
  "anuncios",
  "sobre-o-bot",
  "idiomas",
  "abrir-ticket",
  "ajuda",
  "feedback",
  "funcionalidades",
  "planos",
  "licencas",
];

// ─────────────────────────────────────────────
//  Atalhos por chave
// ─────────────────────────────────────────────
const embeds = {
  chaves: CHAVES,
  build,
  linhaIdiomas,

  boasVindas:      (lang) => build("boas-vindas", lang),
  regras:          (lang) => build("regras", lang),
  anuncios:        (lang) => build("anuncios", lang),
  sobreOBot:       (lang) => build("sobre-o-bot", lang),
  idiomas:         (lang) => build("idiomas", lang),
  abrirTicket:     (lang) => build("abrir-ticket", lang),
  ajuda:           (lang) => build("ajuda", lang),
  feedback:        (lang) => build("feedback", lang),
  funcionalidades: (lang) => build("funcionalidades", lang),
  planos:          (lang) => build("planos", lang),
  licencas:        (lang) => build("licencas", lang),
};

module.exports = embeds;
