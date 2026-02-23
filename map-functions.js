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
  q: document.getElementById("q"),
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

  selectedGroups: new Set(),
  selectedServices: new Set(),

  // ✅ GEO: separo manual vs derived
  manualRegions: new Set(),     // regioni selezionate manualmente
  derivedRegions: new Set(),    // regioni dedotte da province/città
  selectedProvinces: new Set(),
  selectedCities: new Set(),
};

const norm = (s) => (s ?? "").toString().trim().toLowerCase();

// Province -> { name, region }
const PROVINCE_INFO = {
  // Abruzzo
  AQ:{name:"L'Aquila", region:"Abruzzo"}, CH:{name:"Chieti", region:"Abruzzo"}, PE:{name:"Pescara", region:"Abruzzo"}, TE:{name:"Teramo", region:"Abruzzo"},
  // Basilicata
  MT:{name:"Matera", region:"Basilicata"}, PZ:{name:"Potenza", region:"Basilicata"},
  // Calabria
  CS:{name:"Cosenza", region:"Calabria"}, CZ:{name:"Catanzaro", region:"Calabria"}, KR:{name:"Crotone", region:"Calabria"}, RC:{name:"Reggio Calabria", region:"Calabria"}, VV:{name:"Vibo Valentia", region:"Calabria"},
  // Campania
  AV:{name:"Avellino", region:"Campania"}, BN:{name:"Benevento", region:"Campania"}, CE:{name:"Caserta", region:"Campania"}, NA:{name:"Napoli", region:"Campania"}, SA:{name:"Salerno", region:"Campania"},
  // Emilia-Romagna
  BO:{name:"Bologna", region:"Emilia-Romagna"}, FE:{name:"Ferrara", region:"Emilia-Romagna"}, FC:{name:"Forlì-Cesena", region:"Emilia-Romagna"}, MO:{name:"Modena", region:"Emilia-Romagna"},
  PR:{name:"Parma", region:"Emilia-Romagna"}, PC:{name:"Piacenza", region:"Emilia-Romagna"}, RA:{name:"Ravenna", region:"Emilia-Romagna"}, RE:{name:"Reggio Emilia", region:"Emilia-Romagna"}, RN:{name:"Rimini", region:"Emilia-Romagna"},
  // Friuli-Venezia Giulia
  GO:{name:"Gorizia", region:"Friuli-Venezia Giulia"}, PN:{name:"Pordenone", region:"Friuli-Venezia Giulia"}, TS:{name:"Trieste", region:"Friuli-Venezia Giulia"}, UD:{name:"Udine", region:"Friuli-Venezia Giulia"},
  // Lazio
  FR:{name:"Frosinone", region:"Lazio"}, LT:{name:"Latina", region:"Lazio"}, RI:{name:"Rieti", region:"Lazio"}, RM:{name:"Roma", region:"Lazio"}, VT:{name:"Viterbo", region:"Lazio"},
  // Liguria
  GE:{name:"Genova", region:"Liguria"}, IM:{name:"Imperia", region:"Liguria"}, SP:{name:"La Spezia", region:"Liguria"}, SV:{name:"Savona", region:"Liguria"},
  // Lombardia
  BG:{name:"Bergamo", region:"Lombardia"}, BS:{name:"Brescia", region:"Lombardia"}, CO:{name:"Como", region:"Lombardia"}, CR:{name:"Cremona", region:"Lombardia"},
  LC:{name:"Lecco", region:"Lombardia"}, LO:{name:"Lodi", region:"Lombardia"}, MB:{name:"Monza e Brianza", region:"Lombardia"}, MI:{name:"Milano", region:"Lombardia"},
  MN:{name:"Mantova", region:"Lombardia"}, PV:{name:"Pavia", region:"Lombardia"}, SO:{name:"Sondrio", region:"Lombardia"}, VA:{name:"Varese", region:"Lombardia"},
  // Marche
  AN:{name:"Ancona", region:"Marche"}, AP:{name:"Ascoli Piceno", region:"Marche"}, FM:{name:"Fermo", region:"Marche"}, MC:{name:"Macerata", region:"Marche"}, PU:{name:"Pesaro e Urbino", region:"Marche"},
  // Molise
  CB:{name:"Campobasso", region:"Molise"}, IS:{name:"Isernia", region:"Molise"},
  // Piemonte
  AL:{name:"Alessandria", region:"Piemonte"}, AT:{name:"Asti", region:"Piemonte"}, BI:{name:"Biella", region:"Piemonte"}, CN:{name:"Cuneo", region:"Piemonte"},
  NO:{name:"Novara", region:"Piemonte"}, TO:{name:"Torino", region:"Piemonte"}, VB:{name:"Verbano-Cusio-Ossola", region:"Piemonte"}, VC:{name:"Vercelli", region:"Piemonte"},
  // Puglia
  BA:{name:"Bari", region:"Puglia"}, BR:{name:"Brindisi", region:"Puglia"}, BT:{name:"Barletta-Andria-Trani", region:"Puglia"}, FG:{name:"Foggia", region:"Puglia"}, LE:{name:"Lecce", region:"Puglia"}, TA:{name:"Taranto", region:"Puglia"},
  // Sardegna
  CA:{name:"Cagliari", region:"Sardegna"}, NU:{name:"Nuoro", region:"Sardegna"}, OR:{name:"Oristano", region:"Sardegna"}, SS:{name:"Sassari", region:"Sardegna"}, SU:{name:"Sud Sardegna", region:"Sardegna"},
  // Sicilia
  AG:{name:"Agrigento", region:"Sicilia"}, CL:{name:"Caltanissetta", region:"Sicilia"}, CT:{name:"Catania", region:"Sicilia"}, EN:{name:"Enna", region:"Sicilia"},
  ME:{name:"Messina", region:"Sicilia"}, PA:{name:"Palermo", region:"Sicilia"}, RG:{name:"Ragusa", region:"Sicilia"}, SR:{name:"Siracusa", region:"Sicilia"}, TP:{name:"Trapani", region:"Sicilia"},
  // Toscana
  AR:{name:"Arezzo", region:"Toscana"}, FI:{name:"Firenze", region:"Toscana"}, GR:{name:"Grosseto", region:"Toscana"}, LI:{name:"Livorno", region:"Toscana"},
  LU:{name:"Lucca", region:"Toscana"}, MS:{name:"Massa-Carrara", region:"Toscana"}, PI:{name:"Pisa", region:"Toscana"}, PO:{name:"Prato", region:"Toscana"},
  PT:{name:"Pistoia", region:"Toscana"}, SI:{name:"Siena", region:"Toscana"},
  // Trentino-Alto Adige
  BZ:{name:"Bolzano", region:"Trentino-Alto Adige"}, TN:{name:"Trento", region:"Trentino-Alto Adige"},
  // Umbria
  PG:{name:"Perugia", region:"Umbria"}, TR:{name:"Terni", region:"Umbria"},
  // Valle d'Aosta
  AO:{name:"Aosta", region:"Valle d'Aosta"},
  // Veneto
  BL:{name:"Belluno", region:"Veneto"}, PD:{name:"Padova", region:"Veneto"}, RO:{name:"Rovigo", region:"Veneto"}, TV:{name:"Treviso", region:"Veneto"},
  VE:{name:"Venezia", region:"Veneto"}, VI:{name:"Vicenza", region:"Veneto"}, VR:{name:"Verona", region:"Veneto"},
};

const provCode = (p) => (p?.address_district || "").toUpperCase().trim();
const provRegion = (code) => PROVINCE_INFO[code]?.region || "";
const provLabel = (code) => PROVINCE_INFO[code] ? `${code} — ${PROVINCE_INFO[code].name}` : code;

// ✅ region sets helpers
function effectiveRegionsSet(){
  return new Set([...state.manualRegions, ...state.derivedRegions]);
}
function hasManualScope(){
  return state.manualRegions.size > 0;
}
function inManualScope(region){
  return !hasManualScope() || state.manualRegions.has(region);
}

// ✅ recompute derived regions from selected provinces/cities
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
  const group = p.group_name ? `<div><strong>Gruppo:</strong> ${esc(p.group_name)}</div>` : "";
  const hubspot = p.hubspot_id ? `<div style="color:#64748b;font-size:12px;margin-top:6px;">HubSpot id: ${esc(p.hubspot_id)}</div>` : "";

  return `<div style="min-width:240px">
    <div style="font-weight:800;margin-bottom:6px;">${name}</div>
    ${cat}${services}${address}${group}${hubspot}
  </div>`;
}

function featureText(p){
  return norm([
    p.name, p.address_line_1, p.address_city, p.address_district,
    p.address_zipcode, p.establishment_category, p.services, p.group_name, p.hubspot_id
  ].filter(Boolean).join(" "));
}

// -------- Checkbox dropdown (no librerie) --------
function createCheckboxDropdown(rootEl, opts){
  rootEl.classList.add("dd");

  rootEl.innerHTML = `
    <button type="button" class="dd-btn">
      <span class="dd-label">${opts.placeholder}</span>
      <span class="dd-meta">0 selezionati</span>
    </button>
    <div class="dd-panel">
      <div class="dd-head">
        <input class="dd-search" placeholder="Cerca..." />
        <div class="dd-actions">
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

  document.addEventListener("click", (e) => {
    if (!rootEl.contains(e.target)) setOpen(false);
  });
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
        opts.onChange([...selected]);
      });
    });
  }

  search.addEventListener("input", renderList);

  rootEl.querySelectorAll(".dd-actions button").forEach(b => {
    b.addEventListener("click", () => {
      const act = b.getAttribute("data-act");
      if (act === "all") values.forEach(v => selected.add(v));
      if (act === "none") selected.clear();
      updateHeader();
      renderList();
      opts.onChange([...selected]);
    });
  });

  return {
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
      if (!silent) opts.onChange([...selected]);
    },
    addSelected(arr, { silent = false } = {}){
      (arr || []).forEach(v => { if (v) selected.add(v); });
      for (const v of [...selected]) if (!values.includes(v)) selected.delete(v);
      updateHeader();
      renderList();
      if (!silent) opts.onChange([...selected]);
    },
    clear({ silent = false } = {}){
      selected.clear();
      updateHeader();
      renderList();
      if (!silent) opts.onChange([]);
    },
    getSelected(){
      return [...selected];
    }
  };
}

// patch: mostra "MI — Milano" nel dropdown province mantenendo value="MI"
function setProvinceLabels(){
  const list = els.ddProvince.querySelector(".dd-list");
  if (!list) return;
  list.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    const code = cb.value;
    const span = cb.closest(".dd-item")?.querySelector("span");
    if (span) span.textContent = provLabel(code);
  });
}
// ogni volta che apri/cerca nel dropdown province, il list viene re-renderizzato → rilabel
els.ddProvince.addEventListener("click", () => setTimeout(setProvinceLabels, 0));

// Dropdown instances: group/service
const ddGroup = createCheckboxDropdown(els.ddGroup, {
  placeholder: "Tutti i gruppi",
  onChange: (arr) => { state.selectedGroups = new Set(arr); applyFilters(); }
});

const ddService = createCheckboxDropdown(els.ddService, {
  placeholder: "Tutti i servizi",
  onChange: (arr) => { state.selectedServices = new Set(arr); applyFilters(); }
});

// ✅ Dropdown instances: region/province/city (multi + cascade "smart")
const ddRegion = createCheckboxDropdown(els.ddRegion, {
  placeholder: "Tutte le regioni",
  onChange: (arr) => {
    // selezione MANUALE regioni
    state.manualRegions = new Set(arr);

    // se ho scope manuale, ripulisci province/città fuori scope
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

    // ricalcola derived (da province/città rimaste)
    recomputeDerivedRegions();

    // UI Regione deve mostrare manual ∪ derived
    ddRegion.setSelected([...effectiveRegionsSet()], { silent: true });

    cascadeGeoOptions();
    applyFilters();
  }
});

const ddProvince = createCheckboxDropdown(els.ddProvince, {
  placeholder: "Tutte le province",
  onChange: (arr) => {
    state.selectedProvinces = new Set(arr);

    // derive regions da province + città
    recomputeDerivedRegions();

    // auto-preseleziona regioni (manual ∪ derived)
    ddRegion.setSelected([...effectiveRegionsSet()], { silent: true });

    cascadeGeoOptions();
    applyFilters();
  }
});

const ddCity = createCheckboxDropdown(els.ddCity, {
  placeholder: "Tutte le città",
  onChange: (arr) => {
    state.selectedCities = new Set(arr);

    // derive regions anche dalle città selezionate
    recomputeDerivedRegions();

    ddRegion.setSelected([...effectiveRegionsSet()], { silent: true });

    cascadeGeoOptions();
    applyFilters();
  }
});

// single select: category
function buildSingleSelect(select, values, allLabel = "Tutte"){
  const current = select.value;
  const sorted = [...values].filter(Boolean).sort((a,b)=>a.localeCompare(b, "it"));
  select.innerHTML =
    `<option value="">${allLabel}</option>` +
    sorted.map(v => `<option value="${v}">${v}</option>`).join("");
  if (sorted.includes(current)) select.value = current;
}

// ✅ calcola opzioni province/città:
// - se manualRegions è vuoto: NON restringere (così posso aggiungere province/città di altre regioni)
// - se manualRegions è valorizzato: restringi a quelle regioni
function computeGeoOptions(){
  const provinces = new Set();
  const cities = new Set();

  for (const item of state.items){
    const p = item.feature.properties || {};
    const code = provCode(p);
    const reg = provRegion(code);
    const city = p.address_city || "";

    if (!inManualScope(reg)) continue; // restringe SOLO se manual scope presente

    if (code) provinces.add(code);
    if (city) cities.add(city);
  }

  return { provinces, cities };
}

function cascadeGeoOptions(){
  const { provinces, cities } = computeGeoOptions();

  ddProvince.setValues(provinces);
  setProvinceLabels();
  ddCity.setValues(cities);

  // se ho scope manuale, devo togliere selezioni non più valide
  if (hasManualScope()){
    state.selectedProvinces = new Set([...state.selectedProvinces].filter(p => provinces.has(p)));
    ddProvince.setSelected([...state.selectedProvinces], { silent: true });

    state.selectedCities = new Set([...state.selectedCities].filter(c => cities.has(c)));
    ddCity.setSelected([...state.selectedCities], { silent: true });

    // derived va ricalcolato dopo eventuali cleanup
    recomputeDerivedRegions();
    ddRegion.setSelected([...effectiveRegionsSet()], { silent: true });
  } else {
    // no scope: mantieni selezioni così come sono (anche se fuori "current")
    ddProvince.setSelected([...state.selectedProvinces], { silent: true });
    ddCity.setSelected([...state.selectedCities], { silent: true });
  }
}

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
    if (p.group_name) groups.add(p.group_name);

    const code = provCode(p);
    const reg = provRegion(code);
    if (reg) regionsAll.add(reg);
    if (code) provincesAll.add(code);
    if (p.address_city) citiesAll.add(p.address_city);

    if (p.services){
      p.services.split(",").map(s => s.trim()).filter(Boolean).forEach(s => services.add(s));
    }
  }

  buildSingleSelect(els.category, cats, "Tutte");

  ddGroup.setValues(groups);
  ddService.setValues(services);

  // region/province/city initial values
  ddRegion.setValues(regionsAll);
  ddProvince.setValues(provincesAll);
  setProvinceLabels();
  ddCity.setValues(citiesAll);

  // all clean at init
  ddRegion.setSelected([], { silent: true });
  ddProvince.setSelected([], { silent: true });
  ddCity.setSelected([], { silent: true });

  state.manualRegions.clear();
  state.derivedRegions.clear();
  state.selectedProvinces.clear();
  state.selectedCities.clear();

  cascadeGeoOptions();
}

function applyFilters(){
  const q = norm(els.q.value);
  const cat = els.category.value;

  const regionsSel = [...effectiveRegionsSet()];
  const provincesSel = [...state.selectedProvinces];
  const citiesSel = [...state.selectedCities];

  const selectedGroups = [...state.selectedGroups];
  const selectedServices = [...state.selectedServices];

  cluster.clearLayers();
  let visible = 0;

  for (const item of state.items){
    const p = item.feature.properties || {};

    if (cat && p.establishment_category !== cat) continue;

    const code = provCode(p);
    const reg = provRegion(code);
    const city = p.address_city || "";

    // geo (AND tra dimensioni)
    if (regionsSel.length > 0 && !regionsSel.includes(reg)) continue;
    if (provincesSel.length > 0 && !provincesSel.includes(code)) continue;
    if (citiesSel.length > 0 && !citiesSel.includes(city)) continue;

    // groups OR
    if (selectedGroups.length > 0 && !selectedGroups.includes(p.group_name)) continue;

    // services OR
    if (selectedServices.length > 0) {
      const itemServices = (p.services || "").split(",").map(s => s.trim()).filter(Boolean);
      const match = selectedServices.some(s => itemServices.includes(s));
      if (!match) continue;
    }

    if (q && !featureText(p).includes(q)) continue;

    cluster.addLayer(item.marker);
    visible += 1;
  }

  els.kpiVisible.textContent = visible.toLocaleString("it-IT");
}

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

els.q.addEventListener("input", applyFilters);
els.category.addEventListener("change", applyFilters);

els.reset.addEventListener("click", (e) => {
  e.preventDefault();
  els.q.value = "";
  els.category.value = "";

  ddGroup.clear({ silent: true });
  ddService.clear({ silent: true });
  ddRegion.clear({ silent: true });
  ddProvince.clear({ silent: true });
  ddCity.clear({ silent: true });

  state.selectedGroups.clear();
  state.selectedServices.clear();

  state.manualRegions.clear();
  state.derivedRegions.clear();
  state.selectedProvinces.clear();
  state.selectedCities.clear();

  if (state.geojson?.features) rebuildFilters(state.geojson.features);

  applyFilters();
});

init().catch(err => {
  console.error(err);
  alert("Errore inizializzazione mappa. Controlla console e locations.geojson.");
});
