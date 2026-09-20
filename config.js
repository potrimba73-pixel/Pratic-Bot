require("dotenv").config();

module.exports = {
  TOKEN: process.env.DISCORD_TOKEN,

  canais: {
    "boas-vindas":     process.env.CANAL_BOAS_VINDAS,
    "regras":          process.env.CANAL_REGRAS,
    "anuncios":        process.env.CANAL_ANUNCIOS,
    "sobre-o-bot":     process.env.CANAL_SOBRE_BOT,
    "idiomas":         process.env.CANAL_IDIOMAS,
    "abrir-ticket":    process.env.CANAL_ABRIR_TICKET,
    "ajuda":           process.env.CANAL_AJUDA,
    "feedback":        process.env.CANAL_FEEDBACK,
    "funcionalidades": process.env.CANAL_FUNCIONALIDADES,
    "planos":          process.env.CANAL_PLANOS,
    "licencas":        process.env.CANAL_LICENCAS,
  },

  logs: {
    mod:  process.env.CANAL_LOGS_MOD,
    scam: process.env.CANAL_LOGS_SCAM,
  },

  fotos: {
    boasVindas: "assets/boas_vindas.png",
    ban:        "assets/ban.png",
    kick:       "assets/kick.png",
    mute:       "assets/mute.png",
    warn:       "assets/warn.png",
  },

  scam: {
    castigoMinutos:   Number(process.env.SCAM_CASTIGO_MINUTOS ?? 1440),
    apagarMensagem:   process.env.SCAM_APAGAR_MENSAGEM !== "false",
    avisarStaff:      process.env.SCAM_AVISAR_STAFF !== "false",
    hammingThreshold: Number(process.env.SCAM_HAMMING_THRESHOLD ?? 6),
    pastaScamImages:  "scam-images",
    ficheiroHashes:   "scam-hashes.json",
  },

  corPratic:   0x5865F2,
  idiomaPadrao: "pt-pt",
};
