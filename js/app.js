const STORAGE_KEY = "nyc-gallery-radar-saved";

let map;
let markers = [];
let selectedShowId = null;
let viewMode = "map";
let filterMode = "all";
let activeTiers = new Set(Object.keys(TIER_LABELS));

function getSavedIds() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveShowId(id) {
  const saved = getSavedIds();
  if (!saved.includes(id)) {
    saved.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }
  renderAll();
}

function removeShowId(id) {
  const saved = getSavedIds().filter((item) => item !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  renderAll();
}

function formatDate(dateStr) {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatReception(isoStr) {
  if (!isoStr) return null;
  const date = new Date(isoStr);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getShowStatus(show) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(show.startDate + "T00:00:00");
  const end = new Date(show.endDate + "T23:59:59");

  if (today < start) return "Upcoming";
  if (today > end) return "Closed";
  return "On now";
}

function getShowById(id) {
  return SHOWS.find((show) => show.id === id);
}

function getVisibleShows() {
  const savedIds = new Set(getSavedIds());
  return SHOWS.filter((show) => {
    if (!activeTiers.has(show.tier)) return false;
    if (filterMode === "saved" && !savedIds.has(show.id)) return false;
    return true;
  });
}

function artistLinksHtml(artists) {
  if (!artists.length) {
    return "<p class='muted'>No individual artists listed for this show.</p>";
  }

  return artists
    .map((artist) => {
      const links = [];
      if (artist.website) {
        links.push(
          `<a href="${artist.website}" target="_blank" rel="noopener">Website</a>`
        );
      }
      if (artist.artsyUrl) {
        links.push(
          `<a href="${artist.artsyUrl}" target="_blank" rel="noopener">Artsy</a>`
        );
      }
      const linkText = links.length
        ? links.join(" · ")
        : "<span class='muted'>No links yet</span>";
      return `<li><strong>${artist.name}</strong><br>${linkText}</li>`;
    })
    .join("");
}

function updateSavedCount() {
  document.getElementById("saved-count").textContent = getSavedIds().length;
}

function openDetailSheet() {
  document.getElementById("detail-sheet").classList.add("open");
  document.getElementById("detail-sheet").setAttribute("aria-hidden", "false");
  document.getElementById("sheet-backdrop").classList.remove("hidden");
}

function closeDetailSheet() {
  document.getElementById("detail-sheet").classList.remove("open");
  document.getElementById("detail-sheet").setAttribute("aria-hidden", "true");
  document.getElementById("sheet-backdrop").classList.add("hidden");
  selectedShowId = null;
  renderDetailPanel();
  renderListView();
  updateMarkerStyles();
}

function renderDetailPanel() {
  const panel = document.getElementById("detail-panel");
  const show = selectedShowId ? getShowById(selectedShowId) : null;

  if (!show) {
    panel.innerHTML = `
      <p class="panel-label">Show details</p>
      <h2>Select a show</h2>
      <p class="muted">Tap a pin or list row to see dates, artists, and links.</p>
    `;
    return;
  }

  const saved = getSavedIds().includes(show.id);
  const reception = formatReception(show.openingReception);

  panel.innerHTML = `
    <p class="panel-label">${TIER_LABELS[show.tier]}</p>
    <h2>${show.title}</h2>
    <p class="venue-name">${show.venueName}</p>
    <p class="muted">${show.neighborhood} · ${show.address}</p>

    <div class="status-row">
      <span class="status-pill status-${getShowStatus(show).toLowerCase().replace(" ", "-")}">${getShowStatus(show)}</span>
    </div>

    <dl class="meta-list">
      <div>
        <dt>On view</dt>
        <dd>${formatDate(show.startDate)} – ${formatDate(show.endDate)}</dd>
      </div>
      ${
        reception
          ? `<div><dt>Opening reception</dt><dd>${reception}</dd></div>`
          : ""
      }
    </dl>

    <h3>Artists</h3>
    <ul class="artist-list">${artistLinksHtml(show.artists)}</ul>

    <button
      type="button"
      class="save-btn ${saved ? "saved" : ""}"
      id="save-toggle"
    >
      ${saved ? "Saved ✓" : "Save show"}
    </button>
  `;

  document.getElementById("save-toggle").addEventListener("click", () => {
    if (getSavedIds().includes(show.id)) {
      removeShowId(show.id);
    } else {
      saveShowId(show.id);
    }
  });
}

function renderListView() {
  const listEl = document.getElementById("list-view");
  const shows = getVisibleShows();

  if (!shows.length) {
    listEl.innerHTML =
      "<p class='empty-state'>No shows match this filter.</p>";
    return;
  }

  listEl.innerHTML = shows
    .map((show) => {
      const reception = show.openingReception
        ? formatReception(show.openingReception)
        : null;
      return `
        <button
          type="button"
          class="show-row ${selectedShowId === show.id ? "active" : ""}"
          data-show-id="${show.id}"
        >
          <div class="show-row-top">
            <span class="show-row-title">${show.title}</span>
            <span class="show-row-tier" style="background:${TIER_COLORS[show.tier]}"></span>
          </div>
          <div class="show-row-meta">${show.venueName} · ${show.neighborhood}</div>
          <div class="show-row-dates">
            ${formatDate(show.startDate)} – ${formatDate(show.endDate)}
            ${reception ? ` · Opening ${reception}` : ""}
          </div>
        </button>
      `;
    })
    .join("");

  listEl.querySelectorAll(".show-row").forEach((row) => {
    row.addEventListener("click", () => selectShow(row.dataset.showId));
  });
}

function updateMarkerStyles() {
  markers.forEach(({ marker, showId }) => {
    const show = getShowById(showId);
    const visible = getVisibleShows().some((item) => item.id === showId);
    const el = marker.getElement();
    const inner = el ? el.querySelector(".custom-marker") : null;

    if (visible) {
      if (!map.hasLayer(marker)) marker.addTo(map);
    } else if (map.hasLayer(marker)) {
      map.removeLayer(marker);
    }

    if (inner) {
      inner.classList.toggle("marker-active", showId === selectedShowId);
      inner.style.background = TIER_COLORS[show.tier];
    }
  });
}

function selectShow(id) {
  selectedShowId = id;
  renderDetailPanel();
  renderListView();
  updateMarkerStyles();
  openDetailSheet();

  const show = getShowById(id);
  if (show && map) {
    map.setView([show.lat, show.lng], Math.max(map.getZoom(), 14), {
      animate: true,
    });
  }
}

function createMarkerIcon(tier, isActive) {
  const color = TIER_COLORS[tier];
  return L.divIcon({
    className: "custom-marker-wrap",
    html: `<div class="custom-marker ${isActive ? "marker-active" : ""}" style="background:${color}"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function initMap() {
  map = L.map("map", { zoomControl: true }).setView([40.73, -73.98], 11);

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }
  ).addTo(map);

  SHOWS.forEach((show) => {
    const marker = L.marker([show.lat, show.lng], {
      icon: createMarkerIcon(show.tier, false),
    });

    marker.on("click", () => selectShow(show.id));
    markers.push({ marker, showId: show.id });
  });

  updateMarkerStyles();
}

function initFilters() {
  const filterBar = document.getElementById("tier-filters");
  const tiers = Object.keys(TIER_LABELS);

  filterBar.innerHTML = tiers
    .map(
      (tier) => `
      <button type="button" class="tier-chip active" data-tier="${tier}" style="--chip-color:${TIER_COLORS[tier]}">
        ${TIER_LABELS[tier]}
      </button>
    `
    )
    .join("");

  filterBar.querySelectorAll(".tier-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const tier = chip.dataset.tier;
      if (activeTiers.has(tier)) {
        activeTiers.delete(tier);
        chip.classList.remove("active");
      } else {
        activeTiers.add(tier);
        chip.classList.add("active");
      }
      renderAll();
    });
  });
}

function setViewMode(mode) {
  viewMode = mode;
  const listView = document.getElementById("list-view");
  const mapView = document.getElementById("map-view");

  document.querySelectorAll("[data-view]").forEach((btn) => {
    const isActive = btn.dataset.view === mode;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  if (mode === "list") {
    listView.classList.remove("hidden");
    mapView.classList.add("hidden");
  } else {
    listView.classList.add("hidden");
    mapView.classList.remove("hidden");
    setTimeout(() => map.invalidateSize(), 120);
  }
}

function setFilterMode(mode) {
  filterMode = mode;
  document.querySelectorAll("[data-filter]").forEach((btn) => {
    const isActive = btn.dataset.filter === mode;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  renderAll();
}

function initToolbar() {
  document.querySelectorAll("[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => setViewMode(btn.dataset.view));
  });

  document.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => setFilterMode(btn.dataset.filter));
  });
}

function updateHeaderOffset() {
  const header = document.querySelector(".top-bar");
  const toolbar = document.querySelector(".toolbar");
  const tierBar = document.querySelector(".tier-bar");
  const total =
    (header?.offsetHeight || 0) +
    (toolbar?.offsetHeight || 0) +
    (tierBar?.offsetHeight || 0);
  document.documentElement.style.setProperty("--header-offset", `${total}px`);
}

function setRefreshNote(message) {
  document.getElementById("refresh-note").textContent = message;
}

function initRefresh() {
  document.getElementById("refresh-btn").addEventListener("click", () => {
    const now = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    setRefreshNote(`↻ refreshed ${now}`);
    renderAll();
  });
}

function renderAll() {
  updateSavedCount();
  renderListView();
  renderDetailPanel();
  updateMarkerStyles();
}

document.addEventListener("DOMContentLoaded", () => {
  initMap();
  initFilters();
  initToolbar();
  initRefresh();
  updateHeaderOffset();
  window.addEventListener("resize", updateHeaderOffset);
  document.getElementById("sheet-close").addEventListener("click", closeDetailSheet);
  document.getElementById("sheet-backdrop").addEventListener("click", closeDetailSheet);
  renderAll();
});
