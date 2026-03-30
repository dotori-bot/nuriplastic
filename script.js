const catalog = {
  capTypes: [
    { id: "spray_mist", label: "미스트" },
    { id: "pump_lotion", label: "펌프" },
    { id: "pump_foam", label: "거품펌프" },
    { id: "dropper", label: "스포이드" },
    { id: "one_touch", label: "원터치캡" },
    { id: "screw_cap", label: "스크류캡" }
  ],
  bodyShapes: [
    { id: "round", label: "원형" },
    { id: "slim_round", label: "슬림원형" },
    { id: "square", label: "사각" },
    { id: "oval", label: "타원" },
    { id: "jar", label: "JAR" },
    { id: "tube", label: "튜브" }
  ],
  volumes: [30, 50, 100, 150, 200],
  materials: ["PET", "PP", "PE", "Glass"],
  neckSizes: ["18", "20", "24", "28"]
};

const products = [
  { sku: "NP-001", name: "펌프 원형 50ml PET", capType: "pump_lotion", bodyShape: "round", volume: 50, material: "PET", neck: "24" },
  { sku: "NP-002", name: "펌프 사각 100ml PET", capType: "pump_lotion", bodyShape: "square", volume: 100, material: "PET", neck: "24" },
  { sku: "NP-003", name: "미스트 슬림원형 30ml Glass", capType: "spray_mist", bodyShape: "slim_round", volume: 30, material: "Glass", neck: "18" },
  { sku: "NP-004", name: "스포이드 원형 30ml Glass", capType: "dropper", bodyShape: "round", volume: 30, material: "Glass", neck: "18" },
  { sku: "NP-005", name: "거품펌프 타원 150ml PET", capType: "pump_foam", bodyShape: "oval", volume: 150, material: "PET", neck: "28" },
  { sku: "NP-006", name: "스크류캡 JAR 100ml PP", capType: "screw_cap", bodyShape: "jar", volume: 100, material: "PP", neck: "24" },
  { sku: "NP-007", name: "원터치 튜브 50ml PE", capType: "one_touch", bodyShape: "tube", volume: 50, material: "PE", neck: "20" },
  { sku: "NP-008", name: "미스트 원형 100ml PET", capType: "spray_mist", bodyShape: "round", volume: 100, material: "PET", neck: "20" },
  { sku: "NP-009", name: "펌프 슬림원형 150ml PET", capType: "pump_lotion", bodyShape: "slim_round", volume: 150, material: "PET", neck: "24" },
  { sku: "NP-010", name: "원터치 원형 30ml PP", capType: "one_touch", bodyShape: "round", volume: 30, material: "PP", neck: "20" }
];

const compatibility = {
  pump_lotion: ["round", "square", "slim_round", "oval"],
  pump_foam: ["round", "oval"],
  spray_mist: ["round", "slim_round"],
  dropper: ["round", "slim_round"],
  one_touch: ["tube", "round"],
  screw_cap: ["jar", "round", "square"]
};

const state = { capType: catalog.capTypes[0].id, bodyShape: "round", volume: null, material: null, neck: null };
const iconCache = new Map();
const ui = { capIndex: 0, bodyIndex: 0 };

const capTrack = document.getElementById("cap-track");
const bodyTrack = document.getElementById("body-track");
const previewCap = document.getElementById("preview-cap");
const previewBody = document.getElementById("preview-body");
const volumeWrap = document.getElementById("volume-chips");
const materialWrap = document.getElementById("material-chips");
const neckWrap = document.getElementById("neck-chips");
const summary = document.getElementById("selection-summary");
const resultButton = document.getElementById("result-button");
const resultCount = document.getElementById("result-count");
const resultGrid = document.getElementById("result-grid");
const styleNoteInput = document.getElementById("style-note");
const generateBtn = document.getElementById("generate-image");
const generateStatus = document.getElementById("generate-status");
const generatedImage = document.getElementById("generated-image");

function glossyGlass(ctx, x, y, w, h, r) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, "rgba(235,246,255,0.9)");
  g.addColorStop(0.4, "rgba(204,228,246,0.6)");
  g.addColorStop(1, "rgba(175,210,236,0.35)");
  ctx.fillStyle = g;
  roundRect(ctx, x, y, w, h, r, true);
  ctx.strokeStyle = "rgba(130,160,183,0.85)";
  ctx.lineWidth = 2.5;
  roundRect(ctx, x, y, w, h, r, false);
  const shine = ctx.createLinearGradient(x, y, x + w * 0.35, y);
  shine.addColorStop(0, "rgba(255,255,255,0.9)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  roundRect(ctx, x + 6, y + 8, 12, h - 18, 8, true);
}

function roundRect(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill(); else ctx.stroke();
}

function canvasBase() {
  const canvas = document.createElement("canvas");
  canvas.width = 220;
  canvas.height = 220;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, 220, 220);
  ctx.fillStyle = "rgba(210,214,220,0.5)";
  ctx.beginPath();
  ctx.ellipse(110, 196, 55, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  return { canvas, ctx };
}

function drawBodyIcon(id) {
  const { canvas, ctx } = canvasBase();

  const renderBottle = (x, y, w, h, r) => {
    glossyGlass(ctx, x, y, w, h, r);
    const inner = ctx.createLinearGradient(x, y + 10, x + w, y + h);
    inner.addColorStop(0, "rgba(255,255,255,0.55)");
    inner.addColorStop(1, "rgba(130,175,210,0.15)");
    ctx.fillStyle = inner;
    roundRect(ctx, x + 6, y + 8, w - 12, h - 16, Math.max(8, r - 6), true);

    const base = ctx.createLinearGradient(x, y + h - 26, x, y + h);
    base.addColorStop(0, "rgba(130,170,200,0.12)");
    base.addColorStop(1, "rgba(115,150,180,0.35)");
    ctx.fillStyle = base;
    roundRect(ctx, x + 8, y + h - 24, w - 16, 16, 6, true);
  };

  if (id === "round") renderBottle(78, 30, 64, 150, 30);
  if (id === "slim_round") renderBottle(86, 20, 48, 160, 24);
  if (id === "square") renderBottle(75, 30, 70, 150, 10);
  if (id === "oval") renderBottle(72, 30, 76, 150, 36);
  if (id === "jar") {
    renderBottle(58, 96, 104, 82, 18);
    const lidShadow = ctx.createLinearGradient(58, 88, 162, 108);
    lidShadow.addColorStop(0, "rgba(190,205,218,0.25)");
    lidShadow.addColorStop(1, "rgba(140,160,180,0.45)");
    ctx.fillStyle = lidShadow;
    roundRect(ctx, 58, 82, 104, 18, 9, true);
  }
  if (id === "tube") {
    const g = ctx.createLinearGradient(80, 30, 140, 180);
    g.addColorStop(0, "rgba(238,249,255,0.95)");
    g.addColorStop(0.5, "rgba(201,228,246,0.6)");
    g.addColorStop(1, "rgba(150,194,224,0.4)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(78, 36); ctx.lineTo(142, 36); ctx.lineTo(130, 180); ctx.lineTo(90, 180); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(120,150,176,0.85)";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.beginPath();
    ctx.moveTo(90, 44); ctx.lineTo(104, 44); ctx.lineTo(100, 168); ctx.lineTo(92, 168); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(118,146,170,0.28)";
    roundRect(ctx, 95, 174, 30, 8, 4, true);
  }

  return canvas.toDataURL("image/png");
}

function drawCapIcon(id) {
  const { canvas, ctx } = canvasBase();

  const metal = ctx.createLinearGradient(0, 40, 220, 180);
  metal.addColorStop(0, "#c7cdd5");
  metal.addColorStop(0.28, "#8992a0");
  metal.addColorStop(0.52, "#5f6876");
  metal.addColorStop(0.75, "#858f9f");
  metal.addColorStop(1, "#c3cad3");
  ctx.fillStyle = metal;

  const metalSpec = () => {
    const h = ctx.createLinearGradient(0, 0, 220, 0);
    h.addColorStop(0, "rgba(255,255,255,0.72)");
    h.addColorStop(0.3, "rgba(255,255,255,0.18)");
    h.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = h;
    roundRect(ctx, 70, 86, 16, 66, 6, true);
  };

  if (id === "spray_mist") {
    roundRect(ctx, 58, 94, 104, 58, 12, true);
    ctx.fillRect(102, 62, 16, 32);
    roundRect(ctx, 122, 78, 34, 10, 5, true);
    ctx.fillStyle = "rgba(230,236,241,0.35)";
    roundRect(ctx, 66, 112, 88, 10, 5, true);
  }
  if (id === "pump_lotion") {
    roundRect(ctx, 62, 104, 96, 50, 14, true);
    ctx.fillRect(104, 72, 14, 32);
    roundRect(ctx, 116, 66, 52, 12, 6, true);
    ctx.fillStyle = "rgba(228,235,241,0.34)";
    roundRect(ctx, 70, 120, 82, 10, 6, true);
  }
  if (id === "pump_foam") {
    roundRect(ctx, 58, 100, 104, 54, 14, true);
    ctx.fillRect(98, 66, 20, 34);
    roundRect(ctx, 116, 60, 56, 14, 7, true);
    ctx.fillStyle = "rgba(228,235,241,0.32)";
    roundRect(ctx, 66, 118, 88, 12, 6, true);
  }
  if (id === "dropper") {
    roundRect(ctx, 84, 90, 52, 64, 14, true);
    ctx.beginPath();
    ctx.moveTo(110, 42); ctx.lineTo(126, 90); ctx.lineTo(94, 90); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(228,235,241,0.28)";
    roundRect(ctx, 90, 114, 40, 10, 5, true);
  }
  if (id === "one_touch") {
    roundRect(ctx, 62, 102, 96, 50, 12, true);
    roundRect(ctx, 62, 88, 42, 16, 5, true);
    ctx.fillStyle = "rgba(228,235,241,0.3)";
    roundRect(ctx, 72, 118, 74, 10, 5, true);
  }
  if (id === "screw_cap") {
    roundRect(ctx, 58, 94, 104, 58, 20, true);
    ctx.fillStyle = "rgba(210,220,230,0.78)";
    for (let y = 104; y <= 146; y += 8) ctx.fillRect(68, y, 84, 2);
  }

  metalSpec();
  return canvas.toDataURL("image/png");
}

function getIcon(type, id) {
  const key = `${type}:${id}`;
  if (!iconCache.has(key)) iconCache.set(key, type === "capType" ? drawCapIcon(id) : drawBodyIcon(id));
  return iconCache.get(key);
}

function renderTrack(track, items, activeId, type, onClick) {
  track.innerHTML = "";
  items.forEach((item) => {
    const card = document.createElement("button");
    const typeClass = type === "capType" ? "cap-card" : "body-card";
    card.className = `carousel-card ${typeClass} ${activeId === item.id ? "active" : ""}`;
    card.innerHTML = type === "capType"
      ? `<span class="name top">${item.label}</span><img src="${getIcon(type, item.id)}" alt="" aria-hidden="true"/>`
      : `<img src="${getIcon(type, item.id)}" alt="" aria-hidden="true"/><span>${item.label}</span>`;
    card.addEventListener("click", () => onClick(item.id));
    track.appendChild(card);
  });
}

function slideTo(track, index) {
  const cardWidth = 162;
  track.style.transform = `translateX(${-index * cardWidth}px)`;
}

function validBodies() {
  return catalog.bodyShapes.filter((b) => compatibility[state.capType].includes(b.id));
}

function syncPreview() {
  previewCap.src = getIcon("capType", state.capType);
  previewBody.src = getIcon("bodyShape", state.bodyShape);
}

function makeChip(label, key, value, formatter = (v) => v) {
  const chip = document.createElement("button");
  chip.className = "chip";
  chip.textContent = formatter(label);
  chip.setAttribute("aria-pressed", "false");
  chip.addEventListener("click", () => {
    state[key] = state[key] === value ? null : value;
    render();
  });
  return chip;
}

function filterProducts() {
  return products.filter((p) => {
    if (state.capType && p.capType !== state.capType) return false;
    if (state.bodyShape && p.bodyShape !== state.bodyShape) return false;
    if (state.volume && p.volume !== state.volume) return false;
    if (state.material && p.material !== state.material) return false;
    if (state.neck && p.neck !== state.neck) return false;
    return true;
  });
}

function renderChips() {
  volumeWrap.innerHTML = ""; materialWrap.innerHTML = ""; neckWrap.innerHTML = "";
  catalog.volumes.forEach((v) => { const chip = makeChip(v, "volume", v, (l) => `${l}ml`); if (state.volume === v) chip.setAttribute("aria-pressed", "true"); volumeWrap.appendChild(chip); });
  catalog.materials.forEach((m) => { const chip = makeChip(m, "material", m); if (state.material === m) chip.setAttribute("aria-pressed", "true"); materialWrap.appendChild(chip); });
  catalog.neckSizes.forEach((n) => { const chip = makeChip(`${n}Ø`, "neck", n); if (state.neck === n) chip.setAttribute("aria-pressed", "true"); neckWrap.appendChild(chip); });
}

function renderSummary(filtered) {
  const capLabel = catalog.capTypes.find((c) => c.id === state.capType)?.label;
  const bodyLabel = catalog.bodyShapes.find((b) => b.id === state.bodyShape)?.label;
  const parts = [`캡: ${capLabel}`, `용기: ${bodyLabel}`];
  if (state.volume) parts.push(`용량: ${state.volume}ml`);
  if (state.material) parts.push(`소재: ${state.material}`);
  if (state.neck) parts.push(`넥: ${state.neck}Ø`);
  summary.textContent = `선택: ${parts.join(" · ")}`;
  resultButton.textContent = `결과 ${filtered.length}개 보기`;
  resultCount.textContent = `총 ${filtered.length}개 상품`;
}

function renderResults(filtered) {
  resultGrid.innerHTML = "";
  if (!filtered.length) {
    const empty = document.createElement("div"); empty.className = "empty"; empty.textContent = "조건에 맞는 상품이 없습니다. 필터를 완화해 주세요."; resultGrid.appendChild(empty); return;
  }
  filtered.forEach((p) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `<h3>${p.name}</h3><div class="meta">SKU: ${p.sku}</div><div class="meta">${p.volume}ml · ${p.material} · ${p.neck}Ø</div>`;
    resultGrid.appendChild(card);
  });
}

function renderCarousels() {
  renderTrack(capTrack, catalog.capTypes, state.capType, "capType", (id) => {
    state.capType = id;
    ui.capIndex = catalog.capTypes.findIndex((c) => c.id === id);
    const bodies = validBodies();
    if (!bodies.some((b) => b.id === state.bodyShape)) {
      state.bodyShape = bodies[0].id;
      ui.bodyIndex = 0;
    }
    render();
  });

  const bodies = validBodies();
  renderTrack(bodyTrack, bodies, state.bodyShape, "bodyShape", (id) => {
    state.bodyShape = id;
    ui.bodyIndex = bodies.findIndex((b) => b.id === id);
    render();
  });

  slideTo(capTrack, ui.capIndex);
  slideTo(bodyTrack, ui.bodyIndex);
  syncPreview();
}


async function generateImageWithApi() {
  generateBtn.disabled = true;
  generateStatus.textContent = "생성 중...";
  try {
    const res = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        capType: state.capType,
        bodyShape: state.bodyShape,
        styleNote: styleNoteInput.value?.trim() || ""
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "이미지 생성 실패");

    const img = data?.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : data?.data?.[0]?.url;
    if (!img) throw new Error("응답에 이미지가 없습니다.");

    generatedImage.src = img;
    generatedImage.style.display = "block";
    generateStatus.textContent = "생성 완료";
  } catch (err) {
    generateStatus.textContent = `오류: ${String(err.message || err)}`;
  } finally {
    generateBtn.disabled = false;
  }
}

function render() {
  renderCarousels();
  renderChips();
  const filtered = filterProducts();
  renderSummary(filtered);
  renderResults(filtered);
}

document.getElementById("cap-prev").addEventListener("click", () => {
  ui.capIndex = (ui.capIndex - 1 + catalog.capTypes.length) % catalog.capTypes.length;
  state.capType = catalog.capTypes[ui.capIndex].id;
  const bodies = validBodies();
  if (!bodies.some((b) => b.id === state.bodyShape)) { state.bodyShape = bodies[0].id; ui.bodyIndex = 0; }
  render();
});

document.getElementById("cap-next").addEventListener("click", () => {
  ui.capIndex = (ui.capIndex + 1) % catalog.capTypes.length;
  state.capType = catalog.capTypes[ui.capIndex].id;
  const bodies = validBodies();
  if (!bodies.some((b) => b.id === state.bodyShape)) { state.bodyShape = bodies[0].id; ui.bodyIndex = 0; }
  render();
});

document.getElementById("body-prev").addEventListener("click", () => {
  const bodies = validBodies();
  ui.bodyIndex = (ui.bodyIndex - 1 + bodies.length) % bodies.length;
  state.bodyShape = bodies[ui.bodyIndex].id;
  render();
});

document.getElementById("body-next").addEventListener("click", () => {
  const bodies = validBodies();
  ui.bodyIndex = (ui.bodyIndex + 1) % bodies.length;
  state.bodyShape = bodies[ui.bodyIndex].id;
  render();
});

document.getElementById("reset-button").addEventListener("click", () => {
  state.capType = catalog.capTypes[0].id;
  state.bodyShape = "round";
  state.volume = null; state.material = null; state.neck = null;
  ui.capIndex = 0; ui.bodyIndex = 0;
  render();
});

document.getElementById("result-button").addEventListener("click", () => {
  document.querySelector(".results").scrollIntoView({ behavior: "smooth" });
});

generateBtn.addEventListener("click", generateImageWithApi);

render();
