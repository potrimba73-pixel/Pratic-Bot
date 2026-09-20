const fs = require("fs");
const path = require("path");
const imghash = require("imghash");
const config = require("./config");

// ─────────────────────────────────────────────
//  DISTÂNCIA DE HAMMING
// ─────────────────────────────────────────────
function hamming(a, b) {
  if (a.length !== b.length) return 999;
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    const x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    d += (x & 1) + ((x >> 1) & 1) + ((x >> 2) & 1) + ((x >> 3) & 1);
  }
  return d;
}

// ─────────────────────────────────────────────
//  CACHE
// ─────────────────────────────────────────────
let HASHES_SCAM = [];
let carregado = false;

function carregarHashes() {
  const ficheiro = config.scam.ficheiroHashes;
  if (!fs.existsSync(ficheiro)) return [];
  try {
    return JSON.parse(fs.readFileSync(ficheiro, "utf8"));
  } catch {
    return [];
  }
}

function guardarHashes(lista) {
  fs.writeFileSync(
    config.scam.ficheiroHashes,
    JSON.stringify(lista, null, 2),
    "utf8"
  );
}

// ─────────────────────────────────────────────
//  GERAR HASHES A PARTIR DA PASTA
// ─────────────────────────────────────────────
async function gerarHashesDaPasta() {
  const pasta = config.scam.pastaScamImages;
  if (!fs.existsSync(pasta)) {
    fs.mkdirSync(pasta, { recursive: true });
  }

  const ficheiros = fs
    .readdirSync(pasta)
    .filter((f) => /\.(png|jpe?g|webp|gif)$/i.test(f));

  const lista = [];
  for (const f of ficheiros) {
    const caminho = path.join(pasta, f);
    try {
      const hash = await imghash.hash(caminho, 16, "hex");
      lista.push({ ficheiro: f, hash });
      console.log(`   ✅ ${f} → ${hash}`);
    } catch (e) {
      console.warn(`   ⚠️  Erro a processar ${f}:`, e.message);
    }
  }
  guardarHashes(lista);
  HASHES_SCAM = lista;
  carregado = true;
  console.log(`🔒 ${lista.length} imagens de scam carregadas.`);
  return lista;
}

async function carregar() {
  if (carregado) return;
  HASHES_SCAM = carregarHashes();
  if (!HASHES_SCAM.length) {
    await gerarHashesDaPasta();
  } else {
    carregado = true;
    console.log(`🔒 ${HASHES_SCAM.length} imagens de scam em cache.`);
  }
}

// ─────────────────────────────────────────────
//  VERIFICA UM BUFFER
// ─────────────────────────────────────────────
async function verificarBuffer(buffer) {
  await carregar();
  if (!HASHES_SCAM.length) return { match: false };

  const hash = await imghash.hash(buffer, 16, "hex");

  let melhor = { distancia: 999, ficheiro: null };
  for (const item of HASHES_SCAM) {
    const d = hamming(hash, item.hash);
    if (d < melhor.distancia) melhor = { distancia: d, ficheiro: item.ficheiro };
  }

  const isScam = melhor.distancia <= config.scam.hammingThreshold;
  return {
    match: isScam,
    distancia: melhor.distancia,
    ficheiro: melhor.ficheiro,
    hash,
  };
}

// ─────────────────────────────────────────────
//  VERIFICA ANEXOS DE UMA MENSAGEM
// ─────────────────────────────────────────────
async function verificarAnexos(message) {
  const resultados = [];
  for (const att of message.attachments.values()) {
    if (!att.contentType?.startsWith("image/")) continue;
    try {
      const resp = await fetch(att.url);
      const buf  = Buffer.from(await resp.arrayBuffer());
      const res  = await verificarBuffer(buf);
      if (res.match) resultados.push({ att, ...res });
    } catch (e) {
      console.warn("⚠️  Erro a analisar imagem:", e.message);
    }
  }
  return resultados;
}

module.exports = {
  gerarHashesDaPasta,
  carregar,
  verificarBuffer,
  verificarAnexos,
  hamming,
};

// CLI
if (require.main === module && process.argv[2] === "scan") {
  console.log("🔍 A gerar hashes de /scam-images/...");
  gerarHashesDaPasta().then(() => process.exit(0));
}
