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

const state = { capType: null, bodyShape: null, volume: null, material: null, neck: null };
const iconCache = new Map();
// 아이콘은 외부 이미지를 직접 사용하지 않고, 캔버스로 자체 생성한 data URL을 사용합니다.

const capWrap = document.getElementById("cap-options");
const bodyWrap = document.getElementById("body-options");
const volumeWrap = document.getElementById("volume-chips");
const materialWrap = document.getElementById("material-chips");
const neckWrap = document.getElementById("neck-chips");
const summary = document.getElementById("selection-summary");
const resultButton = document.getElementById("result-button");
const resultCount = document.getElementById("result-count");
const resultGrid = document.getElementById("result-grid");
const resetButton = document.getElementById("reset-button");

function canvasBase() {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, 160, 160);
  return { canvas, ctx };
}

function drawBodyIcon(id) {
  const { canvas, ctx } = canvasBase();
  ctx.fillStyle = "rgba(210,220,230,0.6)";
  ctx.beginPath();
  ctx.ellipse(80, 140, 38, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(205,232,250,0.55)";
  ctx.strokeStyle = "rgba(125,155,178,0.85)";
  ctx.lineWidth = 3;

  const drawRR = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  if (id === "round") drawRR(56, 28, 48, 104, 24);
  if (id === "slim_round") drawRR(62, 20, 36, 112, 18);
  if (id === "square") drawRR(54, 28, 52, 104, 10);
  if (id === "oval") drawRR(50, 28, 60, 104, 28);
  if (id === "jar") drawRR(42, 74, 76, 56, 14);
  if (id === "tube") {
    ctx.beginPath();
    ctx.moveTo(58, 34); ctx.lineTo(102, 34); ctx.lineTo(95, 132); ctx.lineTo(65, 132); ctx.closePath();
    ctx.fill(); ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(67, 40, 10, 78);
  return canvas.toDataURL("image/png");
}

function drawCapIcon(id) {
  const { canvas, ctx } = canvasBase();
  const cap = "#697381";
  ctx.fillStyle = "rgba(210,220,230,0.6)";
  ctx.beginPath();
  ctx.ellipse(80, 132, 44, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = cap;
  const rr = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  };

  if (id === "spray_mist") { rr(46, 66, 68, 40, 10); ctx.fillRect(74, 46, 12, 20); ctx.fillRect(88, 56, 20, 6); }
  if (id === "pump_lotion") { rr(48, 74, 64, 34, 10); ctx.fillRect(74, 56, 12, 18); rr(84, 52, 36, 8, 4); }
  if (id === "pump_foam") { rr(46, 70, 68, 38, 10); ctx.fillRect(72, 50, 16, 20); rr(82, 46, 38, 10, 5); }
  if (id === "dropper") {
    rr(62, 66, 36, 44, 10);
    ctx.beginPath(); ctx.moveTo(80, 34); ctx.lineTo(90, 66); ctx.lineTo(70, 66); ctx.closePath(); ctx.fill();
  }
  if (id === "one_touch") { rr(50, 72, 60, 34, 8); ctx.fillRect(50, 66, 32, 8); }
  if (id === "screw_cap") {
    rr(48, 68, 64, 40, 16);
    ctx.fillStyle = "#9fa9b4";
    for (let y = 74; y < 102; y += 6) ctx.fillRect(54, y, 52, 2);
  }

  ctx.fillStyle = "rgba(205,215,224,0.85)";
  ctx.fillRect(56, 74, 3, 26);
  return canvas.toDataURL("image/png");
}

function getIconSrc(type, id) {
  const key = `${type}:${id}`;
  if (!iconCache.has(key)) {
    iconCache.set(key, type === "capType" ? drawCapIcon(id) : drawBodyIcon(id));
  }
  return iconCache.get(key);
}

function iconMarkup(type, id) {
  return `<img class="option-icon" src="${getIconSrc(type, id)}" alt="" aria-hidden="true" loading="lazy" />`;
}

function makeChoiceButton(item, type) {
  const button = document.createElement("button");
  button.className = "option-btn";
  button.innerHTML = `${iconMarkup(type, item.id)}<span>${item.label}</span>`;
  button.setAttribute("aria-pressed", "false");
  button.dataset.id = item.id;
  button.dataset.type = type;
  button.addEventListener("click", () => {
    if (state[type] === item.id) {
      state[type] = null;
    } else {
      state[type] = item.id;
      if (type === "capType" && state.bodyShape && !compatibility[item.id]?.includes(state.bodyShape)) state.bodyShape = null;
      if (type === "bodyShape" && state.capType && !compatibility[state.capType]?.includes(item.id)) state.capType = null;
    }
    render();
  });
  return button;
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

function renderOptions() {
  capWrap.innerHTML = "";
  bodyWrap.innerHTML = "";

  catalog.capTypes.forEach((cap) => {
    const btn = makeChoiceButton(cap, "capType");
    if (state.capType === cap.id) btn.setAttribute("aria-pressed", "true");
    capWrap.appendChild(btn);
  });

  catalog.bodyShapes.forEach((body) => {
    const btn = makeChoiceButton(body, "bodyShape");
    if (state.bodyShape === body.id) btn.setAttribute("aria-pressed", "true");
    if (state.capType && !compatibility[state.capType]?.includes(body.id)) {
      btn.disabled = true;
      btn.title = "선택한 캡과 호환되지 않는 형태입니다.";
    }
    bodyWrap.appendChild(btn);
  });
}

function renderChips() {
  volumeWrap.innerHTML = "";
  materialWrap.innerHTML = "";
  neckWrap.innerHTML = "";

  catalog.volumes.forEach((v) => {
    const chip = makeChip(v, "volume", v, (label) => `${label}ml`);
    if (state.volume === v) chip.setAttribute("aria-pressed", "true");
    volumeWrap.appendChild(chip);
  });

  catalog.materials.forEach((m) => {
    const chip = makeChip(m, "material", m);
    if (state.material === m) chip.setAttribute("aria-pressed", "true");
    materialWrap.appendChild(chip);
  });

  catalog.neckSizes.forEach((n) => {
    const chip = makeChip(`${n}Ø`, "neck", n);
    if (state.neck === n) chip.setAttribute("aria-pressed", "true");
    neckWrap.appendChild(chip);
  });
}

function renderSummary(filtered) {
  const selections = [];
  if (state.capType) selections.push(`캡: ${catalog.capTypes.find((c) => c.id === state.capType)?.label}`);
  if (state.bodyShape) selections.push(`용기: ${catalog.bodyShapes.find((b) => b.id === state.bodyShape)?.label}`);
  if (state.volume) selections.push(`용량: ${state.volume}ml`);
  if (state.material) selections.push(`소재: ${state.material}`);
  if (state.neck) selections.push(`넥: ${state.neck}Ø`);

  summary.textContent = selections.length ? `선택: ${selections.join(" · ")}` : "선택: 없음";
  resultButton.textContent = `결과 ${filtered.length}개 보기`;
  resultCount.textContent = `총 ${filtered.length}개 상품`;
}

function renderResults(filtered) {
  resultGrid.innerHTML = "";
  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "조건에 맞는 상품이 없습니다. 필터를 완화해 주세요.";
    resultGrid.appendChild(empty);
    return;
  }

  filtered.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `<h3>${product.name}</h3><div class="meta">SKU: ${product.sku}</div><div class="meta">${product.volume}ml · ${product.material} · ${product.neck}Ø</div>`;
    resultGrid.appendChild(card);
  });
}

function render() {
  renderOptions();
  renderChips();
  const filtered = filterProducts();
  renderSummary(filtered);
  renderResults(filtered);
}

resetButton.addEventListener("click", () => {
  Object.keys(state).forEach((key) => { state[key] = null; });
  render();
});

resultButton.addEventListener("click", () => {
  document.querySelector(".results").scrollIntoView({ behavior: "smooth" });
});

render();
