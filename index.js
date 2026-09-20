// ============================================================
//  PRATIC BOT — index.js (v2 corrigida)
// ============================================================
const {
  Client, GatewayIntentBits, Partials,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  PermissionFlagsBits, AttachmentBuilder,
} = require("discord.js");

const config     = require("./config");
const TRADUCOES  = require("./traducoes");
const scam       = require("./scamDetector");
const sharp      = require("sharp");
const fs         = require("fs");
const path       = require("path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel],
});

// ═════════════════════════════════════════════════════════════
//  ✅ FIX #1: ler config DINAMICAMENTE (sem reiniciar o bot)
// ═════════════════════════════════════════════════════════════
function lerConfig(nome) {
  const f = path.join(__dirname, "configs", `${nome}.json`);
  if (!fs.existsSync(f)) return {};
  try {
    return JSON.parse(fs.readFileSync(f, "utf8"));
  } catch (e) {
    console.warn(`⚠️  Config ${nome} inválida:`, e.message);
    return {};
  }
}

// ─────────────────────────────────────────────
function substituirCanais(texto) {
  return texto.replace(/\{CANAL:([a-z0-9\-]+)\}/g, (_, nome) => {
    const id = config.canais[nome];
    return id ? `<#${id}>` : `#${nome}`;
  });
}

function criarEmbed(idioma, chave) {
  const t = TRADUCOES[idioma]?.[chave] ?? TRADUCOES[config.idiomaPadrao][chave];
  return new EmbedBuilder()
    .setColor(config.corPratic)
    .setTitle(t.titulo)
    .setDescription(substituirCanais(t.descricao))
    .setFooter({ text: t.rodape });
}

function anexarImagem(embed, caminho) {
  if (!caminho) return { embed, file: null };
  if (caminho.startsWith("http")) {
    embed.setImage(caminho);
    return { embed, file: null };
  }
  if (!fs.existsSync(caminho)) return { embed, file: null };
  const nome = path.basename(caminho);
  embed.setImage(`attachment://${nome}`);
  return { embed, file: { attachment: caminho, name: nome } };
}

function linhaIdiomas(chaveEmbed) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`lang:pt-pt:${chaveEmbed}`).setLabel("PT-PT").setEmoji("🇵🇹").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`lang:pt-br:${chaveEmbed}`).setLabel("PT-BR").setEmoji("🇧🇷").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`lang:es:${chaveEmbed}`).setLabel("ES").setEmoji("🇪🇸").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`lang:en:${chaveEmbed}`).setLabel("EN").setEmoji("🇬🇧").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`lang:ru:${chaveEmbed}`).setLabel("RU").setEmoji("🇷🇺").setStyle(ButtonStyle.Danger),
  );
}

// ═════════════════════════════════════════════════════════════
//  ✅ FIX #3: GERAR IMAGEM DE BOAS-VINDAS (avatar + texto + cores)
// ═════════════════════════════════════════════════════════════
async function gerarImagemBoasVindas(member, imgCfg) {
  const W = 1024, H = 400;

  // 1) Fundo: cor sólida ou URL de imagem
  let fundo;
  if (imgCfg.bgUrl && imgCfg.bgUrl.startsWith("http")) {
    try {
      const resp = await fetch(imgCfg.bgUrl);
      const buf  = Buffer.from(await resp.arrayBuffer());
      fundo = await sharp(buf).resize(W, H, { fit: "cover" }).toBuffer();
    } catch {
      fundo = await sharp({
        create: { width: W, height: H, channels: 4, background: imgCfg.bgColor || "#1e1f22" },
      }).png().toBuffer();
    }
  } else if (imgCfg.bgUrl && imgCfg.bgUrl.startsWith("/assets/")) {
    // imagem guardada localmente
    const local = path.join(__dirname, imgCfg.bgUrl.replace(/^\//, ""));
    if (fs.existsSync(local)) {
      fundo = await sharp(local).resize(W, H, { fit: "cover" }).toBuffer();
    }
  }
  if (!fundo) {
    fundo = await sharp({
      create: { width: W, height: H, channels: 4, background: imgCfg.bgColor || "#1e1f22" },
    }).png().toBuffer();
  }

  // 2) Avatar redondo
  const avatarUrl = member.user.displayAvatarURL({ extension: "png", size: 256 });
  const avatarBuf = await sharp(Buffer.from(await (await fetch(avatarUrl)).arrayBuffer()))
    .resize(200, 200)
    .png()
    .toBuffer();

  let avatarMascara;
  if (imgCfg.avatarShape === "circle") {
    const svgCirculo = `<svg width="200" height="200"><circle cx="100" cy="100" r="100" fill="#fff"/></svg>`;
    avatarMascara = await sharp(avatarBuf)
      .composite([{ input: Buffer.from(svgCirculo), blend: "dest-in" }])
      .png().toBuffer();
  } else if (imgCfg.avatarShape === "rounded") {
    const svgRounded = `<svg width="200" height="200"><rect x="0" y="0" width="200" height="200" rx="30" fill="#fff"/></svg>`;
    avatarMascara = await sharp(avatarBuf)
      .composite([{ input: Buffer.from(svgRounded), blend: "dest-in" }])
      .png().toBuffer();
  } else {
    avatarMascara = avatarBuf;
  }

  // 3) Texto (nome + mensagem)
  const nome = member.user.username;
  const texto = (imgCfg.imgText || "Bem-vindo {user.name}")
    .replace(/{user\.name}/g, nome)
    .replace(/{user\.mention}/g, nome)
    .replace(/{server\.name}/g, member.guild.name)
    .replace(/{memberCount}/g, member.guild.memberCount);

  const nomeCor    = imgCfg.nameColor || "#ffffff";
  const msgCor     = imgCfg.msgColor  || "#dbdee1";
  const circleCor  = imgCfg.circleColor || "#5865F2";

  const svgTexto = `
    <svg width="${W}" height="${H}">
      <style>
        .nome { font-family: 'Segoe UI', Arial, sans-serif; font-size: 46px; font-weight: 700; fill: ${nomeCor}; }
        .msg  { font-family: 'Segoe UI', Arial, sans-serif; font-size: 28px; fill: ${msgCor}; }
      </style>
      <text x="380" y="200" class="nome">${escapeXml(nome)}</text>
      <text x="380" y="250" class="msg">${escapeXml(texto)}</text>
      <circle cx="280" cy="200" r="110" fill="${circleCor}" opacity="0.35"/>
    </svg>`;

  // 4) Compor tudo
  const resultado = await sharp(fundo)
    .composite([
      { input: avatarMascara, left: 180, top: 100 },
      { input: Buffer.from(svgTexto), left: 0, top: 0 },
    ])
    .png()
    .toBuffer();

  return new AttachmentBuilder(resultado, { name: "boas_vindas.png" });
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c])
  );
}

// ═════════════════════════════════════════════════════════════
//  ✅ FIX #2 + #1: on_guildMemberAdd usa config dinamicamente
// ═════════════════════════════════════════════════════════════
client.on("guildMemberAdd", async (member) => {
  const cfg = lerConfig("welcome");
  if (!cfg.channel) return;

  const canal = member.guild.channels.cache.get(cfg.channel);
  if (!canal) {
    console.warn(`⚠️  Canal de boas-vindas não encontrado: ${cfg.channel}`);
    return;
  }

  const interpolar = (txt) => (txt || "")
    .replace(/{user\.mention}/g, `${member}`)
    .replace(/{user\.name}/g, member.user.username)
    .replace(/{user\.tag}/g, member.user.tag)
    .replace(/{server\.name}/g, member.guild.name)
    .replace(/{memberCount}/g, member.guild.memberCount);

  const msg = interpolar(cfg.message);

  // Gerar imagem personalizada
  let attachment = null;
  try {
    attachment = await gerarImagemBoasVindas(member, cfg.image || {});
  } catch (e) {
    console.warn("⚠️  Erro a gerar imagem de boas-vindas:", e.message);
  }

  // Sem embed → manda texto + imagem
  if (!cfg.useEmbed) {
    const payload = { content: msg || `${member}` };
    if (attachment) {
      payload.files = [attachment];
      // Se a posição é "incorporado", mete a imagem como URL de embed simples
      if (cfg.image?.position === "incorporado") {
        payload.embeds = [new EmbedBuilder().setImage("attachment://boas_vindas.png")];
      }
    }
    return canal.send(payload);
  }

  // Com embed
  const e = cfg.embed || {};
  const embed = new EmbedBuilder()
    .setColor(e.color || 0x5865F2)
    .setDescription(interpolar(e.description) || undefined);

  if (e.title)     embed.setTitle(interpolar(e.title));
  if (e.author)    embed.setAuthor({ name: interpolar(e.author) });
  if (e.thumb)     embed.setThumbnail(e.thumb);
  if (e.footer)    embed.setFooter({ text: interpolar(e.footer), iconURL: e.footerIcon || undefined });
  if (e.timestamp) embed.setTimestamp();

  if (e.fields?.length) {
    embed.addFields(e.fields.map((f) => ({
      name: interpolar(f.name),
      value: interpolar(f.value),
      inline: !!f.inline,
    })));
  }

  // Posição da imagem
  const payload = { content: msg || undefined, embeds: [embed] };
  if (attachment) {
    payload.files = [attachment];
    const pos = cfg.image?.position || "padrao";
    if (pos === "incorporado" || pos === "padrao") {
      embed.setImage("attachment://boas_vindas.png");
    }
    // pos === "anexo" → fica como ficheiro solto
  } else if (e.image) {
    embed.setImage(e.image);
  }

  await canal.send(payload);
});

// ═════════════════════════════════════════════════════════════
//  INTERAÇÕES
// ═════════════════════════════════════════════════════════════
client.on("interactionCreate", async (interaction) => {

  if (interaction.isButton() && interaction.customId.startsWith("lang:")) {
    const [, idioma, chave] = interaction.customId.split(":");
    const embed = criarEmbed(idioma, chave);
    return interaction.update({ embeds: [embed], components: [linhaIdiomas(chave)] });
  }

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "setup_embeds") {
    const canal = interaction.options.getChannel("canal");
    const chave = interaction.options.getString("embed");
    const embed = criarEmbed(config.idiomaPadrao, chave);
    await canal.send({ embeds: [embed], components: [linhaIdiomas(chave)] });
    return interaction.reply({ content: `✅ Embed **${chave}** enviado em ${canal}.`, ephemeral: true });
  }

  if (interaction.commandName === "setup_todos") {
    await interaction.deferReply({ ephemeral: true });
    let enviados = 0;
    for (const [chave, id] of Object.entries(config.canais)) {
      if (!id) continue;
      const canal = interaction.guild.channels.cache.get(id);
      if (!canal) continue;
      const embed = criarEmbed(config.idiomaPadrao, chave);
      await canal.send({ embeds: [embed], components: [linhaIdiomas(chave)] });
      enviados++;
    }
    return interaction.editReply(`✅ Enviei **${enviados}** embeds.`);
  }

  if (interaction.commandName === "reload") {
    return interaction.reply({ content: "♻️ Config recarregada automaticamente em cada evento.", ephemeral: true });
  }

  if (["ban","kick","mute","warn"].includes(interaction.commandName)) {
    const membro = interaction.options.getUser("membro");
    const motivo = interaction.options.getString("motivo") ?? "Sem motivo";

    if (interaction.commandName === "ban") {
      await interaction.guild.members.ban(membro.id, { reason: motivo });
      await logMod(interaction.guild, "🔨 Membro banido", membro, interaction.user, motivo, config.fotos.ban);
    }
    if (interaction.commandName === "kick") {
      await interaction.guild.members.kick(membro.id, motivo);
      await logMod(interaction.guild, "👢 Membro expulso", membro, interaction.user, motivo, config.fotos.kick);
    }
    if (interaction.commandName === "warn") {
      await logMod(interaction.guild, "⚠️ Aviso", membro, interaction.user, motivo, config.fotos.warn);
    }
    if (interaction.commandName === "mute") {
      const min = interaction.options.getInteger("minutos") ?? 60;
      const m = await interaction.guild.members.fetch(membro.id);
      await m.timeout(min * 60 * 1000, motivo);
      await logMod(interaction.guild, "🔇 Membro silenciado", membro, interaction.user, `${motivo} (${min} min)`, config.fotos.mute);
    }

    return interaction.reply({ content: `✅ Ação aplicada a ${membro.tag}.`, ephemeral: true });
  }
});

// ─────────────────────────────────────────────
async function logMod(guild, titulo, alvo, staff, motivo, foto) {
  const canal = guild.channels.cache.get(config.logs.mod);
  if (!canal) return;

  const embed = new EmbedBuilder()
    .setColor(config.corPratic)
    .setTitle(titulo)
    .addFields(
      { name: "Membro", value: `${alvo} (${alvo.tag ?? alvo.username})`, inline: true },
      { name: "Staff",  value: `${staff}`, inline: true },
      { name: "Motivo", value: motivo, inline: false },
    )
    .setTimestamp();

  const { embed: e2, file } = anexarImagem(embed, foto);
  await canal.send({ embeds: [e2], files: file ? [file] : [] });
}

// ═════════════════════════════════════════════════════════════
//  ANTI-SCAM
// ═════════════════════════════════════════════════════════════
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const matches = await scam.verificarAnexos(message);
  if (!matches.length) return;

  if (config.scam.apagarMensagem) {
    try { await message.delete(); } catch {}
  }

  if (config.scam.castigoMinutos > 0) {
    try {
      const m = await message.guild.members.fetch(message.author.id);
      await m.timeout(config.scam.castigoMinutos * 60 * 1000, "Envio de imagem de scam/phishing");
    } catch (e) {
      console.warn("Não consegui aplicar timeout:", e.message);
    }
  }

  try {
    await message.author.send(
      "🚫 A tua mensagem foi removida por conter uma **imagem de scam/phishing**.\n" +
      `Recebeste um castigo de **${config.scam.castigoMinutos} minutos**.`
    );
  } catch {}

  const canalLog = message.guild.channels.cache.get(config.logs.scam);
  if (canalLog) {
    const embed = new EmbedBuilder()
      .setColor(0xE74C3C)
      .setTitle("🚨 Imagem de scam detetada")
      .addFields(
        { name: "Autor", value: `${message.author} (${message.author.tag})`, inline: true },
        { name: "Canal", value: `${message.channel}`, inline: true },
        { name: "Match", value: `\`${matches[0].ficheiro}\` (dist: ${matches[0].distancia})`, inline: false },
      )
      .setTimestamp();
    await canalLog.send({ embeds: [embed] });
  }

  if (config.scam.avisarStaff) {
    try {
      await message.channel.send({ content: `🚫 ${message.author} — imagem de scam removida.` })
        .then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
    } catch {}
  }
});

// ═════════════════════════════════════════════════════════════
//  READY
// ═════════════════════════════════════════════════════════════
client.once("ready", async () => {
  console.log(`✅ Pratic Bot online como ${client.user.tag}`);
  await scam.carregar();

  const comandos = [
    {
      name: "setup_embeds",
      description: "Envia um embed traduzido com botões de idioma.",
      options: [
        { name: "canal", description: "Canal onde enviar", type: 7, required: true },
        {
          name: "embed", description: "Qual embed", type: 3, required: true,
          choices: [
            { name: "Boas-vindas",     value: "boas-vindas" },
            { name: "Regras",          value: "regras" },
            { name: "Anúncios",        value: "anuncios" },
            { name: "Sobre o bot",     value: "sobre-o-bot" },
            { name: "Idiomas",         value: "idiomas" },
            { name: "Abrir ticket",    value: "abrir-ticket" },
            { name: "Ajuda",           value: "ajuda" },
            { name: "Feedback",        value: "feedback" },
            { name: "Funcionalidades", value: "funcionalidades" },
            { name: "Planos",          value: "planos" },
            { name: "Licenças",        value: "licencas" },
          ],
        },
      ],
    },
    { name: "setup_todos", description: "Envia todos os embeds para os canais configurados no .env." },
    { name: "reload",      description: "Confirma que a config é recarregada automaticamente." },
    {
      name: "ban", description: "Bane um membro.",
      default_member_permissions: String(PermissionFlagsBits.BanMembers),
      options: [
        { name: "membro", description: "Membro", type: 6, required: true },
        { name: "motivo", description: "Motivo", type: 3, required: false },
      ],
    },
    {
      name: "kick", description: "Expulsa um membro.",
      default_member_permissions: String(PermissionFlagsBits.KickMembers),
      options: [
        { name: "membro", description: "Membro", type: 6, required: true },
        { name: "motivo", description: "Motivo", type: 3, required: false },
      ],
    },
    {
      name: "warn", description: "Avisa um membro.",
      options: [
        { name: "membro", description: "Membro", type: 6, required: true },
        { name: "motivo", description: "Motivo", type: 3, required: true },
      ],
    },
    {
      name: "mute", description: "Silencia (timeout) um membro.",
      options: [
        { name: "membro",  description: "Membro", type: 6, required: true },
        { name: "minutos", description: "Duração em minutos", type: 4, required: true },
        { name: "motivo",  description: "Motivo", type: 3, required: false },
      ],
    },
  ];

  await client.application.commands.set(comandos);
});

client.login(config.TOKEN);
