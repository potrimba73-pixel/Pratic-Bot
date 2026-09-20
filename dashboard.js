// ============================================================
//  PRATIC BOT — DASHBOARD (v2 profissional)
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
const PASTA_CONFIGS = path.join(__dirname, "configs");
if (!fs.existsSync(PASTA_ASSETS))  fs.mkdirSync(PASTA_ASSETS,  { recursive: true });
if (!fs.existsSync(PASTA_CONFIGS)) fs.mkdirSync(PASTA_CONFIGS, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "dashboard")));
app.use("/assets", express.static(PASTA_ASSETS));

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function lerConfig(nome) {
  const f = path.join(PASTA_CONFIGS, `${nome}.json`);
  if (!fs.existsSync(f)) return {};
  try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return {}; }
}
function gravarConfig(nome, dados) {
  const f = path.join(PASTA_CONFIGS, `${nome}.json`);
  fs.writeFileSync(f, JSON.stringify(dados, null, 2), "utf8");
}

// ─────────────────────────────────────────────
//  ASSETS
// ─────────────────────────────────────────────
app.get("/api/assets", (req, res) => {
  const ficheiros = fs.readdirSync(PASTA_ASSETS);
  res.json(ficheiros.map((f) => {
    const stat = fs.statSync(path.join(PASTA_ASSETS, f));
    return { nome: f, tamanho: stat.size, atualizado: stat.mtime, url: `/assets/${f}` };
  }));
});

app.post("/api/upload/:tipo", upload.single("imagem"), async (req, res) => {
  const tipo = req.params.tipo;
  if (!req.file) return res.status(400).json({ erro: "Sem ficheiro" });

  const destino = path.join(PASTA_ASSETS, `${tipo}.png`);
  try {
    await sharp(req.file.buffer)
      .resize({ width: 1920, height: 1080, fit: "inside", withoutEnlargement: true })
      .png({ quality: 92 })
      .toFile(destino);
    res.json({ ok: true, url: `/assets/${tipo}.png?t=${Date.now()}` });
  } catch (e) {
    res.status(500).json({ erro: "Erro: " + e.message });
  }
});

app.delete("/api/assets/:nome", (req, res) => {
  const caminho = path.join(PASTA_ASSETS, path.basename(req.params.nome));
  if (!fs.existsSync(caminho)) return res.status(404).json({ erro: "Não existe" });
  fs.unlinkSync(caminho);
  res.json({ ok: true });
});

// ─────────────────────────────────────────────
//  CONFIGS (welcome, leave, anuncios, mod, scam, ...)
// ─────────────────────────────────────────────
const SECOES = ["welcome", "leave", "anuncios", "mod", "scam", "idiomas", "embeds", "geral"];

SECOES.forEach((secao) => {
  app.get(`/api/config/${secao}`, (req, res) => res.json(lerConfig(secao)));
  app.post(`/api/config/${secao}`, (req, res) => {
    gravarConfig(secao, req.body);
    res.json({ ok: true });
  });
});

// ─────────────────────────────────────────────
//  STATUS
// ─────────────────────────────────────────────
app.get("/api/status", (req, res) => {
  const temToken = !!config.TOKEN;
  const canaisPreenchidos = Object.values(config.canais).filter(Boolean).length;
  const totalCanais = Object.keys(config.canais).length;
  const scamPronto = fs.existsSync(path.join(__dirname, "scam-hashes.json"));

  res.json({
    token: temToken ? "ok" : "erro",
    canais: { preenchidos: canaisPreenchidos, total: totalCanais },
    logs: !!(config.logs.mod && config.logs.scam) ? "ok" : "erro",
    scam: scamPronto ? "ok" : "aviso",
    uptime: process.uptime(),
  });
});

app.listen(PORT, () => {
  console.log(`\n🎛️  Dashboard: http://localhost:${PORT}\n`);
});
