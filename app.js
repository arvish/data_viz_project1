import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const state = {
  data: [],
  geojson: null,
  selectedCountries: new Set(),
  hoveredCountry: null,
  metrics: [],
  metricX: null,
  metricY: null,
  mapMetric: null,
  yearLabel: "TBD"
};

// ---- Quick setup test ----
document.getElementById("year-label").textContent = "TBD (data not loaded yet)";

document.getElementById("resetSelection").addEventListener("click", () => {
  state.selectedCountries.clear();
  updateDetailsPanel();
  // later: re-render all charts/maps
});

function populateMetricControls() {
  const metricIds = ["metricX", "metricY", "mapMetric"];
  for (const id of metricIds) {
    const sel = document.getElementById(id);
    sel.innerHTML = "";
    state.metrics.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.value;
      opt.textContent = m.label;
      sel.appendChild(opt);
    });
  }

  if (state.metrics.length >= 2) {
    state.metricX = state.metrics[0].value;
    state.metricY = state.metrics[1].value;
    state.mapMetric = state.metrics[0].value;
    document.getElementById("metricX").value = state.metricX;
    document.getElementById("metricY").value = state.metricY;
    document.getElementById("mapMetric").value = state.mapMetric;
  }
}

function wireControls() {
  document.getElementById("metricX").addEventListener("change", (e) => {
    state.metricX = e.target.value;
    renderAll();
  });

  document.getElementById("metricY").addEventListener("change", (e) => {
    state.metricY = e.target.value;
    renderAll();
  });

  document.getElementById("mapMetric").addEventListener("change", (e) => {
    state.mapMetric = e.target.value;
    renderAll();
  });
}

function updateDetailsPanel() {
  const el = document.getElementById("details");
  const selected = [...state.selectedCountries];
  if (!selected.length) {
    el.innerHTML = `<p class="muted">Hover or select countries to see details here.</p>`;
    return;
  }
  el.innerHTML = `
    <p><strong>${selected.length}</strong> countr${selected.length === 1 ? "y" : "ies"} selected.</p>
    <p class="muted">${selected.slice(0, 12).join(", ")}${selected.length > 12 ? " ..." : ""}</p>
  `;
}

function drawPlaceholders() {
  const placeholders = [
    { id: "#map", label: "Map placeholder" },
    { id: "#scatter", label: "Scatterplot placeholder" },
    { id: "#histX", label: "Histogram X placeholder" },
    { id: "#histY", label: "Histogram Y placeholder" }
  ];

  placeholders.forEach(({ id, label }) => {
    const root = d3.select(id);
    root.selectAll("*").remove();
    const { width, height } = root.node().getBoundingClientRect();

    const svg = root.append("svg")
      .attr("viewBox", `0 0 ${Math.max(320, width)} ${Math.max(180, height)}`);

    svg.append("rect")
      .attr("x", 8)
      .attr("y", 8)
      .attr("width", Math.max(304, width - 16))
      .attr("height", Math.max(164, height - 16))
      .attr("rx", 12)
      .attr("fill", "rgba(255,255,255,0.02)")
      .attr("stroke", "rgba(255,255,255,0.08)");

    svg.append("text")
      .attr("x", (Math.max(320, width)) / 2)
      .attr("y", (Math.max(180, height)) / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#98a6bd")
      .attr("font-size", 14)
      .text(label);
  });
}

function renderAll() {
  // Later: renderMap(), renderScatter(), renderHistograms()
  drawPlaceholders();
  updateDetailsPanel();
}

async function init() {
  // TEMP metric placeholders so UI works immediately
  state.metrics = [
    { value: "life_expectancy", label: "Life expectancy" },
    { value: "gdp_per_capita", label: "GDP per capita" },
    { value: "co2_per_capita", label: "CO₂ per capita" }
  ];

  populateMetricControls();
  wireControls();
  renderAll();

  // Next step:
  // 1) Load merged CSV
  // 2) Load world geojson
  // 3) Normalize country names/ids
  // 4) Replace placeholders with real charts
}

init();