// ===========================
// Leaflet setup
// ===========================
const map = L.map("map", { scrollWheelZoom: true });

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const cluster = L.markerClusterGroup({ showCoverageOnHover: false });
cluster.addTo(map);

const els = {
  // ✅ rimosso q (filtro generico)
  category: document.getElementById("category"),
  reset: document.getElementById("reset"),
  kpiVisible: document.getElementById("kpi-visible"),
  kpiTotal: document.getElementById("kpi-total"),

  // dropdown checkbox
  ddGroup: document.getElementById("dd-group"),
  ddService: document.getElementById("dd-service"),
  ddRegion: document.getElementById("dd-region"),
  ddProvince: document.getElementById("dd-province"),
  ddCity: document.getElementById("dd-city"),
};

const state = {
  geojson: null,
  items: [],

  // GROUPS
  groupMode: "auto", // "auto" | "manual"
  selectedGroups: new Set(),
  allGroups: new Set(),

  // SERVICES
  selectedServices: new Set(),

  // ✅ GEO: separo manual vs derived
  manualRegions: new Set(),
  derivedRegions: new Set(),
  selectedProvinces: new Set(),
  selectedCities: new Set(),
};

const norm = (s) => (s ?? "").toString().trim().toLowerCase();

// ===========================
// Helpers: Group
// ===========================
const GROUP_INDEPENDENT = "Indipendenti";
function groupValue(p){
  const g = (p?.group_name ?? "").toString().trim();
  return g ? g : GROUP_INDEPENDENT;
}

// ===========================
// Province -> { name, region }
// ===========================
const PROVINCE_INFO = {
  AQ:{name:"L'Aquila", region:"Abruzzo"}, CH:{name:"Chieti", region:"Abruzzo"}, PE:{name:"Pescara", region:"Abruzzo"}, TE:{name:"Teramo", region:"Abruzzo"},
  MT:{name:"Matera", region:"Basilicata"}, PZ:{name:"Potenza", region:"Basilicata"},
  CS:{name:"Cosenza", region:"Calabria"}, CZ:{name:"Catanzaro", region:"Calabria"}, KR:{name:"Crotone", region:"Calabria"}, RC:{name:"Reggio Calabria", region:"Calabria"}, VV:{name:"Vibo Valentia", region:"Calabria"},
  AV:{name:"Avellino", region:"Campania"}, BN:{name:"Benevento", region:"Campania"}, CE:{name:"Caserta", region:"Campania"}, NA:{name:"Napoli", region:"Campania"}, SA:{name:"Salerno", region:"Campania"},
  BO:{name:"Bologna", region:"Emilia-Romagna"}, FE:{name:"Ferrara", region:"Emilia-Romagna"}, FC:{name:"Forlì-Cesena", region:"Emilia-Romagna"}, MO:{name:"Modena", region:"Emilia-Romagna"},
  PR:{name:"Parma", region:"Emilia-Romagna"}, PC:{name:"Piacenza", region:"Emilia-Romagna"}, RA:{name:"Ravenna", region:"Emilia-Romagna"}, RE:{name:"Reggio Emilia", region:"Emilia-Romagna"}, RN:{name:"Rimini", region:"Emilia-Romagna"},
  GO:{name:"Gorizia", region:"Friuli-Venezia Giulia"}, PN:{name:"Pordenone", region:"Friuli-Venezia Giulia"}, TS:{name:"Trieste", region:"Friuli-Venezia Giulia"}, UD:{name:"Udine", region:"Friuli-Venezia Giulia"},
  FR:{name:"Frosinone", region:"Lazio"}, LT:{name:"Latina", region:"Lazio"}, RI:{name:"Rieti", region:"Lazio"}, RM:{name:"Roma", region:"Lazio"}, VT:{name:"Viterbo", region:"Lazio"},
  GE:{name:"Genova", region:"Liguria"}, IM:{name:"Imperia", region:"Liguria"}, SP:{name:"La Spezia", region:"Liguria"}, SV:{name:"Savona", region:"Liguria"},
  BG:{name:"Bergamo", region:"Lombardia"}, BS:{name:"Brescia", region:"Lombardia"}, CO:{name:"Como", region:"Lombardia"}, CR:{name:"Cremona", region:"Lombardia"},
  LC:{name:"Lecco", region:"Lombardia"}, LO:{name:"Lodi", region:"Lombardia"}, MB:{name:"Monza e Brianza", region:"Lombardia"}, MI:{name:"Milano", region:"Lombardia"},
  MN:{name:"Mantova", region:"Lombardia"}, PV:{name:"Pavia", region:"Lombardia"}, SO:{name:"Sondrio", region:"Lombardia"}, VA:{name:"Varese", region:"Lombardia"},
  AN:{name:"Ancona", region:"Marche"}, AP:{name:"Ascoli Piceno", region:"Marche"}, FM:{name:"Fermo", region:"Marche"}, MC:{name:"Macerata", region:"Marche"}, PU:{name:"Pesaro e Urbino", region:"Marche"},
  CB:{name:"Campobasso", region:"Molise"}, IS:{name:"Isernia", region:"Molise"},
  AL:{name:"Alessandria", region:"Piemonte"}, AT:{name:"Asti", region:"Piemonte"}, BI:{name:"Biella", region:"Piemonte"}, CN:{name:"Cuneo", region:"Piemonte"},
  NO:{name:"Novara", region:"Piemonte"}, TO:{name:"Torino", region:"Piemonte"}, VB:{name:"Verbano-Cusio-Ossola", region:"Piemonte"}, VC:{name:"Vercelli", region:"Piemonte"},
  BA:{name:"Bari", region:"Puglia"}, BR:{name:"Brindisi", region:"Puglia"}, BT:{name:"Barletta-Andria-Trani", region:"Puglia"}, FG:{name:"Foggia", region:"Puglia"}, LE:{name:"Lecce", region:"Puglia"}, TA:{name:"Taranto", region:"Puglia"},
  CA:{name:"Cagliari", region:"Sardegna"}, NU:{name:"Nuoro", region:"Sardegna"}, OR:{name:"Oristano", region:"Sardegna"}, SS:{name:"Sassari", region:"Sardegna"}, SU:{name:"Sud Sardegna", region:"Sardegna"},
  AG:{name:"Agrigento", region:"Sicilia"}, CL:{name:"Caltanissetta", region:"Sicilia"}, CT:{name:"Catania", region:"Sicilia"}, EN:{name:"Enna", region:"Sicilia"},
  ME:{name:"Messina", region:"Sicilia"}, PA:{name:"Palermo", region:"Sicilia"}, RG:{name:"Ragusa", region:"Sicilia"}, SR:{name:"Siracusa", region:"Sicilia"}, TP:{name:"Trapani", region:"Sicilia"},
  AR:{name:"Arezzo", region:"Toscana"}, FI:{name:"Firenze", region:"Toscana"}, GR:{name:"Grosseto", region:"Toscana"}, LI:{name:"Livorno", region:"Toscana"},
  LU:{name:"Lucca", region:"Toscana"}, MS:{name:"Massa-Carrara", region:"Toscana"}, PI:{name:"Pisa", region:"Toscana"}, PO:{name:"Prato", region:"Toscana"},
  PT:{name:"Pistoia", region:"Toscana"}, SI:{name:"Siena", region:"Toscana"},
  BZ:{name:"Bolzano", region:"Trentino-Alto Adige"}, TN:{name:"Trento", region:"Trentino-Alto Adige"},
  PG:{name:"Perugia", region:"Umbria"}, TR:{name:"Terni", region:"Umbria"},
  AO:{name:"Aosta", region:"Valle d'Aosta"},
  BL:{name:"Belluno", region:"Veneto"}, PD:{name:"Padova", region:"Veneto"}, RO:{name:"Rovigo", region:"Veneto"}, TV:{name:"Treviso", region:"Veneto"},
  VE:{name:"Venezia", region:"Veneto"}, VI:{name:"Vicenza", region:"Veneto"}, VR:{name:"Verona", region:"Veneto"},
};

const provCode = (p) => (p?.address_district || "").toUpperCase().trim();
const provRegion = (code) => PROVINCE_INFO[code]?.region || "";
const provLabel = (code) => PROVINCE_INFO[code] ? `${code} — ${PROVINCE_INFO[code].name}` : code;

// ===========================
// Region helpers (manual vs derived)
// ===========================
function effectiveRegionsSet(){
  return new Set([...state.manualRegions, ...state.derivedRegions]);
}
function hasManualScope(){
  return state.manualRegions.size > 0;
}
function inManualScope(region){
  return !hasManualScope() || state.manualRegions.has(region);
}

function recomputeDerivedRegions(){
  const derived = new Set();

  for (const code of state.selectedProvinces){
    const reg = provRegion(code);
    if (reg) derived.add(reg);
  }

  if (state.selectedCities.size > 0){
    for (const item of state.items){
      const p = item.feature.properties || {};
      const city = p.address_city || "";
      if (!city) continue;
      if (!state.selectedCities.has(city)) continue;

      const reg = provRegion(provCode(p));
      if (reg) derived.add(reg);
    }
  }

  state.derivedRegions = derived;
}

function popupHtml(p){
  const esc = (x) => (x ?? "").toString()
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");

  const name = esc(p.name || "Esercente");
  const cat = p.establishment_category ? `<div><strong>Categoria:</strong> ${esc(p.establishment_category)}</div>` : "";
  const services = p.services ? `<div><strong>Servizi:</strong> ${esc(p.services)}</div>` : "";
  const addrParts = [p.address_line_1, p.address_zipcode, p.address_city, p.address_district].filter(Boolean);
  const address = addrParts.length ? `<div><strong>Indirizzo:</strong> ${esc(addrParts.join(", "))}</div>` : "";
  const group = `<div><strong>Gruppo:</strong> ${esc(groupValue(p))}</div>`;
  const hubspot = p.hubspot_id ? `<div style="color:#64748b;font-size:12px;margin-top:6px;">HubSpot id: ${esc(p.hubspot_id)}</div>` : "";

  return `<div style="min-width:240px">
    <div style="font-weight:800;margin-bottom:6px;">${name}</div>
    ${cat}${services}${address}${group}${hubspot}
  </div>`;
}

// ===========================
// Checkbox dropdown (no lib) + search + optional toggle
// ===========================
function createCheckboxDropdown(rootEl, opts){
  rootEl.classList.add("dd");

  const showToggle = !!opts.modeToggle; // solo per "Gruppi" in questo caso

  rootEl.innerHTML = `
    <button type="button" class="dd-btn">
      <span class="dd-label">${opts.placeholder}</span>
      <span class="dd-meta">0 selezionati</span>
    </button>

    <div class="dd-panel">
      <div class="dd-head">
        <input class="dd-search" placeholder="Cerca..." />
        <div class="dd-actions">
          ${showToggle ? `
            <label class="dd-toggle" style="display:flex;align-items:center;gap:6px;margin-right:8px;user-select:none;">
              <input type="checkbox" class="dd-toggle-input" checked />
              <span class="dd-toggle-label">AUTO</span>
            </label>
          ` : ``}
          <button type="button" class="btn" data-act="all">Tutti</button>
          <button type="button" class="btn" data-act="none">Reset</button>
        </div>
      </div>
      <div class="dd-list"></div>
    </div>
  `;

  const btn = rootEl.querySelector(".dd-btn");
  const label = rootEl.querySelector(".dd-label");
  const meta = rootEl.querySelector(".dd-meta");
  const panel = rootEl.querySelector(".dd-panel");
  const list = rootEl.querySelector(".dd-list");
  const search = rootEl.querySelector(".dd-search");

  const toggleInput = rootEl.querySelector(".dd-toggle-input");
  const toggleLabel = rootEl.querySelector(".dd-toggle-label");

  let values = [];
  const selected = new Set();

  function setOpen(open){
    rootEl.classList.toggle("open", open);
    if (open) {
      search.value = "";
      renderList();
      setTimeout(() => search.focus(), 0);
    }
  }

  btn.addEventListener("click", () => setOpen(!rootEl.classList.contains("open")));
  document.addEventListener("click", (e) => { if (!rootEl.contains(e.target)) setOpen(false); });
  panel.addEventListener("click", (e) => e.stopPropagation());

  function updateHeader(){
    const n = selected.size;
    meta.textContent = `${n} selezionati`;
    if (n === 0) label.textContent = opts.placeholder;
    else if (n === 1) label.textContent = [...selected][0];
    else label.textContent = `${n} selezionati`;
  }

  function renderList(){
    const q = norm(search.value);
    const filtered = q ? values.filter(v => norm(v).includes(q)) : values;

    list.innerHTML = filtered.map(v => {
      const checked = selected.has(v) ? "checked" : "";
      return `
        <label class="dd-item">
          <input type="checkbox" value="${v}" ${checked} />
          <span>${v}</span>
        </label>
      `;
    }).join("");

    list.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener("change", (e) => {
        const v = e.target.value;
        if (e.target.checked) selected.add(v);
        else selected.delete(v);
        updateHeader();
        opts.onChange([...selected], { user: true });
      });
    });

    if (opts.afterRender) opts.afterRender();
  }

  search.addEventListener("input", renderList);

  rootEl.querySelectorAll(".dd-actions button[data-act]").forEach(b => {
    b.addEventListener("click", () => {
      const act = b.getAttribute("data-act");
      if (act === "all") values.forEach(v => selected.add(v));
      if (act === "none") selected.clear();
      updateHeader();
      renderList();
      opts.onChange([...selected], { user: true });
    });
  });

  if (showToggle && toggleInput && toggleLabel){
    toggleInput.addEventListener("change", () => {
      const isAuto = toggleInput.checked;
      toggleLabel.textContent = isAuto ? "AUTO" : "MANUAL";
      if (opts.onToggleMode) opts.onToggleMode(isAuto ? "auto" : "manual");
    });
  }

  return {
    setMode(mode){
      if (!showToggle || !toggleInput || !toggleLabel) return;
      toggleInput.checked = (mode === "auto");
      toggleLabel.textContent = (mode === "auto") ? "AUTO" : "MANUAL";
    },
    setValues(newValues){
      values = [...newValues].filter(Boolean).sort((a,b)=>a.localeCompare(b, "it"));
      for (const v of [...selected]) if (!values.includes(v)) selected.delete(v);
      updateHeader();
      renderList();
    },
    setSelected(arr, { silent = false } = {}){
      selected.clear();
      (arr || []).forEach(v => { if (v) selected.add(v); });
      for (const v of [...selected]) if (!values.includes(v)) selected.delete(v);
      updateHeader();
      renderList();
      if (!silent) opts.onChange([...selected], { user: false });
    },
    clear({ silent = false } = {}){
      selected.clear();
      updateHeader();
      renderList();
      if (!silent) opts.onChange([], { user: false });
    },
    getSelected(){
      return [...selected];
    }
  };
}

// Patch: mostra "MI — Milano" nel dropdown province mantenendo value="MI"
function setProvinceLabels(){
  const list = els.ddProvince.querySelector(".dd-list");
  if (!list) return;
  list.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    const code = cb.value;
    const span = cb.closest(".dd-item")?.querySelector("span");
    if (span) span.textContent = provLabel(code);
  });
}

// ===========================
// Dropdowns
// ===========================

// ✅ Gruppi: AUTO/MANUAL + auto-selection
const ddGroup = createCheckboxDropdown(els.ddGroup, {
  placeholder: "Tutti i gruppi",
  modeToggle: true,
  onToggleMode: (mode) => {
    state.groupMode = mode;
    ddGroup.setMode(mode);

    // se torno in AUTO: azzero filtro gruppo e riallineo subito ai gruppi visibili
    if (mode === "auto") {
      state.selectedGroups.clear();
      // ricalcolo con filtri correnti e aggiorno UI
      updateGroupsAutoFromCurrentView();
      applyFilters();
    } else {
      // in MANUAL: lascia la selezione corrente come filtro
      applyFilters();
    }
  },
  onChange: (arr, meta) => {
    // se l'utente cambia gruppi => passa a MANUAL
    if (meta?.user) {
      state.groupMode = "manual";
      ddGroup.setMode("manual");
    }
    state.selectedGroups = new Set(arr);
    applyFilters();
  }
});

const ddService = createCheckboxDropdown(els.ddService, {
  placeholder: "Tutti i servizi",
  onChange: (arr) => { state.selectedServices = new Set(arr); applyFilters(); }
});

const ddRegion = createCheckboxDropdown(els.ddRegion, {
  placeholder: "Tutte le regioni",
  onChange: (arr) => {
    state.manualRegions = new Set(arr);

    if (hasManualScope()){
      for (const code of [...state.selectedProvinces]){
        const reg = provRegion(code);
        if (reg && !state.manualRegions.has(reg)) state.selectedProvinces.delete(code);
      }
      for (const c of [...state.selectedCities]){
        let ok = false;
        for (const item of state.items){
          const p = item.feature.properties || {};
          if ((p.address_city || "") !== c) continue;
          const reg = provRegion(provCode(p));
          if (reg && state.manualRegions.has(reg)) { ok = true; break; }
        }
        if (!ok) state.selectedCities.delete(c);
      }
    }

    recomputeDerivedRegions();
    ddRegion.setSelected([...effectiveRegionsSet()], { silent: true });

    cascadeGeoOptions();
    applyFilters();
  }
});

const ddProvince = createCheckboxDropdown(els.ddProvince, {
  placeholder: "Tutte le province",
  afterRender: () => setProvinceLabels(),
  onChange: (arr) => {
    state.selectedProvinces = new Set(arr);

    recomputeDerivedRegions();
    ddRegion.setSelected([...effectiveRegionsSet()], { silent: true });

    cascadeGeoOptions();
    applyFilters();
  }
});

const ddCity = createCheckboxDropdown(els.ddCity, {
  placeholder: "Tutte le città",
  onChange: (arr) => {
    state.selectedCities = new Set(arr);

    recomputeDerivedRegions();
    ddRegion.setSelected([...effectiveRegionsSet()], { silent: true });

    cascadeGeoOptions();
    applyFilters();
  }
});

// ===========================
// Single select: category
// ===========================
function buildSingleSelect(select, values, allLabel = "Tutte"){
  const current = select.value;
  const sorted = [...values].filter(Boolean).sort((a,b)=>a.localeCompare(b, "it"));
  select.innerHTML =
    `<option value="">${allLabel}</option>` +
    sorted.map(v => `<option value="${v}">${v}</option>`).join("");
  if (sorted.includes(current)) select.value = current;
}

// ===========================
// Geo cascade options
// ===========================
function computeGeoOptions(){
  const provinces = new Set();
  const cities = new Set();

  for (const item of state.items){
    const p = item.feature.properties || {};
    const code = provCode(p);
    const reg = provRegion(code);
    const city = p.address_city || "";

    if (!inManualScope(reg)) continue;

    if (code) provinces.add(code);
    if (city) cities.add(city);
  }

  return { provinces, cities };
}

function cascadeGeoOptions(){
  const { provinces, cities } = computeGeoOptions();

  ddProvince.setValues(provinces);
  ddCity.setValues(cities);

  if (hasManualScope()){
    state.selectedProvinces = new Set([...state.selectedProvinces].filter(p => provinces.has(p)));
    ddProvince.setSelected([...state.selectedProvinces], { silent: true });

    state.selectedCities = new Set([...state.selectedCities].filter(c => cities.has(c)));
    ddCity.setSelected([...state.selectedCities], { silent: true });

    recomputeDerivedRegions();
    ddRegion.setSelected([...effectiveRegionsSet()], { silent: true });
  } else {
    ddProvince.setSelected([...state.selectedProvinces], { silent: true });
    ddCity.setSelected([...state.selectedCities], { silent: true });
  }
}

// ===========================
// Build filters (init)
// ===========================
function rebuildFilters(features){
  const cats = new Set();
  const services = new Set();
  const groups = new Set();

  const regionsAll = new Set();
  const provincesAll = new Set();
  const citiesAll = new Set();

  for (const f of features){
    const p = f.properties || {};
    if (p.establishment_category) cats.add(p.establishment_category);

    // ✅ gruppi, includendo Indipendenti
    groups.add(groupValue(p));

    const code = provCode(p);
    const reg = provRegion(code);
    if (reg) regionsAll.add(reg);
    if (code) provincesAll.add(code);
    if (p.address_city) citiesAll.add(p.address_city);

    if (p.services){
      p.services.split(",").map(s => s.trim()).filter(Boolean).forEach(s => services.add(s));
    }
  }

  state.allGroups = groups;

  buildSingleSelect(els.category, cats, "Tutte");

  ddService.setValues(services);

  ddRegion.setValues(regionsAll);
  ddProvince.setValues(provincesAll);
  ddCity.setValues(citiesAll);

  // reset geo
  ddRegion.setSelected([], { silent: true });
  ddProvince.setSelected([], { silent: true });
  ddCity.setSelected([], { silent: true });

  state.manualRegions.clear();
  state.derivedRegions.clear();
  state.selectedProvinces.clear();
  state.selectedCities.clear();

  // gruppi in AUTO al boot
  state.groupMode = "auto";
  ddGroup.setMode("auto");
  state.selectedGroups.clear();

  cascadeGeoOptions();

  // inizializza gruppi auto su "tutto visibile" (quindi tutti i gruppi presenti nel dataset)
  ddGroup.setValues([...state.allGroups]);
  ddGroup.setSelected([...state.allGroups], { silent: true });
}

// ===========================
// Core matching (no group filter inside if AUTO)
// ===========================
function matchesNonGroupFilters(p){
  const cat = els.category.value;

  // category
  if (cat && p.establishment_category !== cat) return false;

  // geo
  const regionsSel = [...effectiveRegionsSet()];
  const provincesSel = [...state.selectedProvinces];
  const citiesSel = [...state.selectedCities];

  const code = provCode(p);
  const reg = provRegion(code);
  const city = p.address_city || "";

  if (regionsSel.length > 0 && !regionsSel.includes(reg)) return false;
  if (provincesSel.length > 0 && !provincesSel.includes(code)) return false;
  if (citiesSel.length > 0 && !citiesSel.includes(city)) return false;

  // services OR
  const selectedServices = [...state.selectedServices];
  if (selectedServices.length > 0) {
    const itemServices = (p.services || "").split(",").map(s => s.trim()).filter(Boolean);
    const match = selectedServices.some(s => itemServices.includes(s));
    if (!match) return false;
  }

  return true;
}

function matchesGroupFilter(p){
  // in AUTO: NON filtra
  if (state.groupMode === "auto") return true;

  // in MANUAL: filtra solo se c'è selezione
  const selectedGroups = [...state.selectedGroups];
  if (selectedGroups.length === 0) return true;

  const g = groupValue(p);
  return selectedGroups.includes(g);
}

// ===========================
// AUTO GROUPS: compute from current (non-group) view
// ===========================
function updateGroupsAutoFromCurrentView(){
  if (state.groupMode !== "auto") return;

  const visibleGroups = new Set();

  for (const item of state.items){
    const p = item.feature.properties || {};
    if (!matchesNonGroupFilters(p)) continue;

    visibleGroups.add(groupValue(p));
  }

  // Se non c'è niente visibile, lascia almeno le opzioni vuote (e nessuna selezione)
  ddGroup.setValues([...visibleGroups]);
  ddGroup.setSelected([...visibleGroups], { silent: true });
}

// ===========================
// Apply filters (render pins + update KPI + group auto)
// ===========================
function applyFilters(){
  // 1) se AUTO: prima aggiorno i gruppi in base a ciò che rimane visibile dagli altri filtri
  updateGroupsAutoFromCurrentView();

  cluster.clearLayers();
  let visible = 0;

  for (const item of state.items){
    const p = item.feature.properties || {};

    if (!matchesNonGroupFilters(p)) continue;
    if (!matchesGroupFilter(p)) continue;

    cluster.addLayer(item.marker);
    visible += 1;
  }

  els.kpiVisible.textContent = visible.toLocaleString("it-IT");
}

// ===========================
// Init
// ===========================
async function init(){
  const res = await fetch("./locations.geojson", { cache: "no-store" });
  if (!res.ok) throw new Error("Impossibile caricare locations.geojson");
  const geojson = await res.json();
  state.geojson = geojson;

  els.kpiTotal.textContent = geojson.features.length.toLocaleString("it-IT");

  state.items = geojson.features.map(f => {
    const [lng, lat] = f.geometry.coordinates;
    const marker = L.marker([lat, lng]).bindPopup(popupHtml(f.properties || {}));
    return { feature: f, marker };
  });

  const latlngs = state.items.map(x => x.marker.getLatLng());
  map.fitBounds(L.latLngBounds(latlngs).pad(0.08));

  rebuildFilters(geojson.features);
  applyFilters();
}

els.category.addEventListener("change", applyFilters);

els.reset.addEventListener("click", (e) => {
  e.preventDefault();
  els.category.value = "";

  ddService.clear({ silent: true });
  ddRegion.clear({ silent: true });
  ddProvince.clear({ silent: true });
  ddCity.clear({ silent: true });

  state.selectedServices.clear();
  state.manualRegions.clear();
  state.derivedRegions.clear();
  state.selectedProvinces.clear();
  state.selectedCities.clear();

  // reset gruppi
  state.groupMode = "auto";
  ddGroup.setMode("auto");
  state.selectedGroups.clear();

  if (state.geojson?.features) rebuildFilters(state.geojson.features);
  applyFilters();
});

init().catch(err => {
  console.error(err);
  alert("Errore inizializzazione mappa. Controlla console e locations.geojson.");
});
