// ============================================================
//  PRATIC BOT — DASHBOARD
//  Corre em: http://localhost:3000
// ============================================================
const express = require("express");
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const sharp   = require("sharp");

const config  = require("./config");

const app  = express();
const PORT = process.env.DASHBOARD_PORT || 3000;

const PASTA_ASSETS = path.join(__dirname, "assets");
if (!fs.existsSync(PASTA_ASSETS)) fs.mkdirSync(PASTA_ASSETS, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.use(express.static(path.join(__dirname, "dashboard")));
app.use("/assets", express.static(PASTA_ASSETS));

// ── Listar assets ──
app.get("/api/assets", (req, res) => {
  const ficheiros = fs.readdirSync(PASTA_ASSETS);
  const info = ficheiros.map((f) => {
    const caminho = path.join(PASTA_ASSETS, f);
    const stat = fs.statSync(caminho);
    return {
      nome: f,
      tamanho: stat.size,
      atualizado: stat.mtime,
      url: `/assets/${f}`,
    };
  });
  res.json(info);
});

// ── Config ──
app.get("/api/config", (req, res) => {
  res.json({
    canais: config.canais,
    logs:   config.logs,
    fotos:  config.fotos,
    scam: {
      castigoMinutos:   config.scam.castigoMinutos,
      apagarMensagem:   config.scam.apagarMensagem,
      avisarStaff:      config.scam.avisarStaff,
      hammingThreshold: config.scam.hammingThreshold,
    },
  });
});

// ── Upload ──
app.post("/api/upload/:tipo", upload.single("imagem"), async (req, res) => {
  const tipo = req.params.tipo;
  const tiposValidos = ["boas_vindas", "ban", "kick", "mute", "warn"];
  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({ erro: "Tipo inválido" });
  }
  if (!req.file) {
    return res.status(400).json({ erro: "Sem ficheiro" });
  }

  const destino = path.join(PASTA_ASSETS, `${tipo}.png`);

  try {
    await sharp(req.file.buffer)
      .resize({ width: 1920, height: 1080, fit: "inside", withoutEnlargement: true })
      .png({ quality: 92 })
      .toFile(destino);

    res.json({
      ok: true,
      ficheiro: `${tipo}.png`,
      url: `/assets/${tipo}.png?t=${Date.now()}`,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro a processar imagem: " + e.message });
  }
});

// ── Apagar ──
app.delete("/api/assets/:nome", (req, res) => {
  const nome = path.basename(req.params.nome);
  const caminho = path.join(PASTA_ASSETS, nome);
  if (!fs.existsSync(caminho)) return res.status(404).json({ erro: "Não existe" });
  fs.unlinkSync(caminho);
  res.json({ ok: true });
});

// ── Status ──
app.get("/api/status", (req, res) => {
  const temToken = !!config.TOKEN;
  const canaisPreenchidos = Object.values(config.canais).filter(Boolean).length;
  const totalCanais = Object.keys(config.canais).length;
  const temLogs = !!(config.logs.mod && config.logs.scam);
  const scamPronto = fs.existsSync(path.join(__dirname, "scam-hashes.json"));

  res.json({
    token: temToken ? "✅ configurado" : "❌ em falta",
    canais: `${canaisPreenchidos}/${totalCanais}`,
    logs: temLogs ? "✅" : "❌",
    scam: scamPronto ? "✅ pronto" : "⚠️ corre npm run scan",
    uptime: process.uptime(),
  });
});

app.listen(PORT, () => {
  console.log(`\n🎛️  Dashboard: http://localhost:${PORT}\n`);
});
