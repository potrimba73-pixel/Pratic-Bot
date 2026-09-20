// ============================================================
//  PRATIC BOT — index.js
// ============================================================
const {
  Client, GatewayIntentBits, Partials,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js");

const config     = require("./config");
const TRADUCOES  = require("./traducoes");
const scam       = require("./scamDetector");
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

// ─────────────────────────────────────────────
function linhaIdiomas(chaveEmbed) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`lang:pt-pt:${chaveEmbed}`).setLabel("PT-PT").setEmoji("🇵🇹").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`lang:pt-br:${chaveEmbed}`).setLabel("PT-BR").setEmoji("🇧🇷").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`lang:es:${chaveEmbed}`).setLabel("ES").setEmoji("🇪🇸").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`lang:en:${chaveEmbed}`).setLabel("EN").setEmoji("🇬🇧").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`lang:ru:${chaveEmbed}`).setLabel("RU").setEmoji("🇷🇺").setStyle(ButtonStyle.Danger),
  );
}

// ─────────────────────────────────────────────
client.on("guildMemberAdd", async (member) => {
  const canal = member.guild.channels.cache.get(config.canais["boas-vindas"]);
  if (!canal) return;

  const embed = criarEmbed(config.idiomaPadrao, "boas-vindas")
    .setDescription(
      substituirCanais(TRADUCOES[config.idiomaPadrao]["boas-vindas"].descricao)
        .replace("Bem-vindo", `Bem-vindo, ${member.user.username}`)
    );

  const { embed: e2, file } = anexarImagem(embed, config.fotos.boasVindas);
  await canal.send({ content: `${member}`, embeds: [e2], files: file ? [file] : [] });
});

// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
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
      await message.channel.send({
        content: `🚫 ${message.author} — imagem de scam removida.`,
      }).then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
    } catch {}
  }
});

// ─────────────────────────────────────────────
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
