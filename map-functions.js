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

    // ✅ NEW: regione + provincia + città (cascade)
    region: document.getElementById("region"),
    province: document.getElementById("province"),
    city: document.getElementById("city"),

    reset: document.getElementById("reset"),
    kpiVisible: document.getElementById("kpi-visible"),
    kpiTotal: document.getElementById("kpi-total"),

    ddGroup: document.getElementById("dd-group"),
    ddService: document.getElementById("dd-service"),
  };

  const state = {
    geojson: null,
    items: [],
    selectedGroups: new Set(),
    selectedServices: new Set(),
  };

  const norm = (s) => (s ?? "").toString().trim().toLowerCase();

  // ✅ Province -> { name, region }
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

  function provCode(p){
    return (p?.address_district || "").toUpperCase().trim();
  }
  function provRegion(code){
    return PROVINCE_INFO[code]?.region || "";
  }
  function provLabel(code){
    const info = PROVINCE_INFO[code];
    return info ? `${code} — ${info.name}` : code;
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
      clear(){
        selected.clear();
        updateHeader();
        renderList();
        opts.onChange([]);
      },
      getSelected(){
        return [...selected];
      }
    };
  }

  // Dropdown instances
  const ddGroup = createCheckboxDropdown(els.ddGroup, {
    placeholder: "Tutti i gruppi",
    onChange: (arr) => {
      state.selectedGroups = new Set(arr);
      applyFilters();
    }
  });

  const ddService = createCheckboxDropdown(els.ddService, {
    placeholder: "Tutti i servizi",
    onChange: (arr) => {
      state.selectedServices = new Set(arr);
      applyFilters();
    }
  });

  // single selects
  function buildSingleSelect(select, values, allLabel = "Tutte"){
    const current = select.value;
    const sorted = [...values].filter(Boolean).sort((a,b)=>a.localeCompare(b, "it"));
    select.innerHTML =
      `<option value="">${allLabel}</option>` +
      sorted.map(v => `<option value="${v}">${v}</option>`).join("");
    if (sorted.includes(current)) select.value = current;
  }

  function buildProvinceSelect(provinceCodes){
    const current = els.province.value;
    const sorted = [...provinceCodes].filter(Boolean).sort((a,b)=>a.localeCompare(b,"it"));

    els.province.innerHTML =
      `<option value="">Tutte</option>` +
      sorted.map(code => `<option value="${code}">${provLabel(code)}</option>`).join("");

    if (sorted.includes(current)) els.province.value = current;
  }

  function buildCitySelect(cityNames){
    const current = els.city.value;
    const sorted = [...cityNames].filter(Boolean).sort((a,b)=>a.localeCompare(b,"it"));

    els.city.innerHTML =
      `<option value="">Tutte</option>` +
      sorted.map(c => `<option value="${c}">${c}</option>`).join("");

    if (sorted.includes(current)) els.city.value = current;
  }

  function computeAvailableSets(){
    const regionSel = els.region.value;
    const provSel = els.province.value;

    const provinces = new Set();
    const cities = new Set();

    for (const item of state.items){
      const p = item.feature.properties || {};
      const code = provCode(p);
      const reg = provRegion(code);

      if (regionSel && reg !== regionSel) continue;
      if (provSel && code !== provSel) continue;

      if (code) provinces.add(code);
      if (p.address_city) cities.add(p.address_city);
    }

    return { provinces, cities };
  }

  function onRegionChange(){
    // regione selezionata -> reset provincia, aggiorna province + città coerenti
    els.province.value = "";
    const { provinces, cities } = computeAvailableSets();
    buildProvinceSelect(provinces);
    buildCitySelect(cities);
    applyFilters();
  }

  function onProvinceChange(){
    // provincia selezionata -> auto-seleziona regione, aggiorna città coerenti
    const provSel = els.province.value;
    if (provSel){
      const reg = provRegion(provSel);
      if (reg) els.region.value = reg;
    }
    const { provinces, cities } = computeAvailableSets();
    buildProvinceSelect(provinces);
    buildCitySelect(cities);
    applyFilters();
  }

  function rebuildFilters(features){
    const cats = new Set();
    const regions = new Set();
    const provinces = new Set();
    const cities = new Set();
    const services = new Set();
    const groups = new Set();

    for (const f of features){
      const p = f.properties || {};
      if (p.establishment_category) cats.add(p.establishment_category);

      const code = provCode(p);
      if (code) provinces.add(code);

      const reg = provRegion(code);
      if (reg) regions.add(reg);

      if (p.address_city) cities.add(p.address_city);
      if (p.group_name) groups.add(p.group_name);

      if (p.services){
        p.services.split(",").map(s => s.trim()).filter(Boolean).forEach(s => services.add(s));
      }
    }

    buildSingleSelect(els.category, cats, "Tutte");
    buildSingleSelect(els.region, regions, "Tutte");
    buildProvinceSelect(provinces);
    buildCitySelect(cities);

    ddGroup.setValues(groups);
    ddService.setValues(services);
  }

  function applyFilters(){
    const q = norm(els.q.value);
    const cat = els.category.value;

    const region = els.region.value;      // ✅ NEW
    const province = els.province.value;  // ✅ NEW
    const city = els.city.value;

    const selectedGroups = [...state.selectedGroups];
    const selectedServices = [...state.selectedServices];

    cluster.clearLayers();
    let visible = 0;

    for (const item of state.items){
      const p = item.feature.properties || {};

      if (cat && p.establishment_category !== cat) continue;

      // ✅ region/province filters
      const code = provCode(p);
      const itemRegion = provRegion(code);
      if (region && itemRegion !== region) continue;
      if (province && code !== province) continue;

      // city filter
      if (city && p.address_city !== city) continue;

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

  // ✅ cascade listeners
  els.region.addEventListener("change", onRegionChange);
  els.province.addEventListener("change", onProvinceChange);
  els.city.addEventListener("change", applyFilters);

  els.reset.addEventListener("click", (e) => {
    e.preventDefault();
    els.q.value = "";
    els.category.value = "";
    els.region.value = "";
    els.province.value = "";
    els.city.value = "";

    ddGroup.clear();
    ddService.clear();

    // ripopola province/città complete dopo reset
    if (state.geojson?.features) rebuildFilters(state.geojson.features);

    applyFilters();
  });

  init().catch(err => {
    console.error(err);
    alert("Errore inizializzazione mappa. Controlla console e locations.geojson.");
  });
