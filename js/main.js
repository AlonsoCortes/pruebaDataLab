/* 
   Geovisor – Expansión de heladerías
*/

const GEOJSON_URL = 'datos/colonias_interes_heladerias.geojson';

//  Colores por clasificación k4cls 
const CLUSTER_COLORS = {
  'Colonias Equilibradas':          '#22c55e',
  'Colonias Familiares con niños':  '#f59e0b',
  'Colonias Adultos Activas':       '#3b82f6',
  'Colonias Mayores':               '#a855f7',
};
const COLOR_DEFAULT = '#94a3b8';

function clusterColor(nombre) {
  return CLUSTER_COLORS[nombre] ?? COLOR_DEFAULT;
}

//  Mapa 
const map = L.map('map', {
  center: [19.42, -99.13],
  zoom: 12,
  zoomControl: true,
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 20,
}).addTo(map);

//  Leyenda
const legend = L.control({ position: 'bottomleft' });
legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'map-legend');
  div.innerHTML = '<div class="legend-title">Clasificación de colonias</div>' +
    Object.entries(CLUSTER_COLORS).map(([label, color]) =>
      `<div class="legend-item">
        <span class="legend-swatch" style="background:${color}"></span>
        <span>${label}</span>
      </div>`
    ).join('');
  return div;
};
legend.addTo(map);

//  Estado
let geojsonLayer = null;
let allFeatures  = [];
let activeItem   = null;   // li activo en el sidebar
let layerIndex   = {};     // colonia name layer

//  Render sidebar 
function renderList(features) {
  const ul = document.getElementById('colony-list');
  ul.innerHTML = '';

  features.forEach(feature => {
    const p    = feature.properties;
    const rank = p.ranking;
    const name = p.colonia ?? 'Sin nombre';
    const alc  = p.alc ?? '';
    const cls  = p.k4cls_nombre ?? '';

    const li = document.createElement('li');
    li.className = 'colony-item';
    li.dataset.colonia = name;

    const rankEl = document.createElement('div');
    rankEl.className = 'colony-rank' + (rank == null ? ' no-rank' : '');
    rankEl.textContent = rank != null ? rank : '–';

    const info = document.createElement('div');
    info.className = 'colony-info';
    info.innerHTML = `
      <div class="colony-name">${name}</div>
      <div class="colony-meta">${alc}${cls ? ' · ' + cls : ''}</div>
    `;

    li.append(rankEl, info);
    li.addEventListener('click', () => flyToColony(name, li));
    ul.appendChild(li);
  });
}

//  Zoom a colonia 
function flyToColony(name, liEl) {
  const layer = layerIndex[name];
  if (!layer) return;

  // Resaltar item en sidebar
  if (activeItem) activeItem.classList.remove('active');
  activeItem = liEl;
  liEl.classList.add('active');

  // Zoom al bounds de la capa
  const bounds = layer.getBounds();
  map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 15, duration: 1 });

  // Abrir popup al terminar la animación para que el autoPan funcione correctamente
  map.once('moveend', () => layer.openPopup());
}

//  Popup content ─
function buildPopup(p) {
  const fmt   = v => (v == null ? '–' : typeof v === 'number' ? v.toLocaleString('es-MX', { maximumFractionDigits: 2 }) : v);
  const fmtPct = v => (v == null ? '–' : (v * 100).toFixed(1) + '%');
  const rows = [
    ['Alcaldía',          p.alc],
    ['Clasificación',     p.k4cls_nombre],
    ['Ranking',           p.ranking],
    ['Población total',   fmt(p.pob_total)],
    ['Superficie (ha)',   fmt(p.sup_ha)],
    ['Densidad (hab/ha)', fmt(p.densidad_pob)],
    ['Heladerías',        fmt(p.n_heladerias)],
    ['Heladerías/ha',     fmt(p.den_helado_ha)],
    ['% Niños',           fmtPct(p.pct_grupo_ninos)],
    ['% Jóvenes',         fmtPct(p.pct_grupo_jovenes)],
    ['% Adulto joven',    fmtPct(p.pct_grupo_adulto_joven)],
    ['% Adulto',          fmtPct(p.pct_grupo_adulto)],
    ['% Mayor',           fmtPct(p.pct_grupo_mayor)],
  ];

  const rowsHtml = rows.map(([label, value]) => `
    <div class="popup-row">
      <span class="label">${label}</span>
      <span class="value">${value ?? '–'}</span>
    </div>
  `).join('');

  return `
    <div class="popup-title">${p.colonia ?? 'Sin nombre'}</div>
    <div class="popup-body">${rowsHtml}</div>
  `;
}

//  Cargar GeoJSON 
fetch(GEOJSON_URL)
  .then(r => { if (!r.ok) throw new Error('No se pudo cargar el GeoJSON'); return r.json(); })
  .then(data => {
    allFeatures = data.features;

    // Ordenar: primero con ranking numérico 
    allFeatures.sort((a, b) => {
      const ra = a.properties.ranking;
      const rb = b.properties.ranking;
      if (ra != null && rb != null) return ra - rb;
      if (ra != null) return -1;
      if (rb != null) return  1;
      return (a.properties.colonia ?? '').localeCompare(b.properties.colonia ?? '', 'es');
    });

    // Capa GeoJSON
    geojsonLayer = L.geoJSON(data, {
      style: feature => ({
        color:       '#fff',
        weight:      1,
        fillColor:   clusterColor(feature.properties.k4cls_nombre),
        fillOpacity: 0.6,
      }),
      onEachFeature: (feature, layer) => {
        const p = feature.properties;
        const name = p.colonia ?? 'Sin nombre';

        // Índice para acceso rápido
        layerIndex[name] = layer;

        layer.bindPopup(buildPopup(p), { maxWidth: 280, autoPan: true, autoPanPaddingTopLeft: [10, 60], autoPanPaddingBottomRight: [10, 20] });

        layer.on('mouseover', function () {
          this.setStyle({ fillOpacity: 0.85, weight: 2, color: '#1e293b' });
        });
        layer.on('mouseout', function () {
          geojsonLayer.resetStyle(this);
        });
        layer.on('click', function () {
          // Sincronizar sidebar
          const li = document.querySelector(`.colony-item[data-colonia="${CSS.escape(name)}"]`);
          if (li) {
            if (activeItem) activeItem.classList.remove('active');
            activeItem = li;
            li.classList.add('active');
            li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        });
      },
    }).addTo(map);

    map.fitBounds(geojsonLayer.getBounds(), { padding: [20, 20], maxZoom: 13 });

    // Render del sidebar con el orden ya calculado
    renderList(allFeatures);

    //  Botón scroll-top ─
    const scrollTopBtn = document.getElementById('scroll-top');
    const colonyList   = document.getElementById('colony-list');

    colonyList.addEventListener('scroll', () => {
      scrollTopBtn.classList.toggle('visible', colonyList.scrollTop > 80);
    });

    scrollTopBtn.addEventListener('click', () => {
      colonyList.scrollTo({ top: 0, behavior: 'smooth' });
    });

    //  Búsqueda en sidebar 
    document.getElementById('search').addEventListener('input', function () {
      const q = this.value.trim().toLowerCase();
      const filtered = q
        ? allFeatures.filter(f => (f.properties.colonia ?? '').toLowerCase().includes(q))
        : allFeatures;
      renderList(filtered);
      // Reasignar listeners
    });
  })
  .catch(err => {
    console.error(err);
    document.getElementById('colony-list').innerHTML =
      `<li style="padding:1rem;color:#ef4444;font-size:.85rem;">Error al cargar datos: ${err.message}</li>`;
  });
