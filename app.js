import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const GEOJSON_URL =
  "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";
const DATA_URL = "./data/world_metrics_merged.csv";

const METRIC_META = [
  { value: "life_expectancy", label: "Life expectancy (years)", format: d3.format(".1f") },
  { value: "pm25", label: "PM2.5 air pollution", format: d3.format(".1f") },
  { value: "undernourishment", label: "Undernourishment (%)", format: d3.format(".1f") },
  { value: "gdp_per_capita", label: "GDP per capita", format: d3.format(",.0f") },
  // Optional later if added to CSV:
  // { value: "obesity_prevalence", label: "Obesity prevalence (%)", format: d3.format(".1f") },
];

const state = {
  data: [],
  geojson: null,
  metrics: [],
  metricX: "pm25",
  metricY: "life_expectancy",
  mapMetric: "life_expectancy",
  yearLabel: "TBD",
  hoveredCode: null,
  hoveredCountry: null,
  selectedCodes: new Set(),
};

const tooltip = d3.select("#tooltip");

function metricMeta(key) {
  return state.metrics.find((m) => m.value === key) || { value: key, label: key, format: d3.format(".2f") };
}

function getData() {
  return state.data.filter(
    (d) =>
      Number.isFinite(d[state.metricX]) &&
      Number.isFinite(d[state.metricY]) &&
      Number.isFinite(d[state.mapMetric])
  );
}

function showTooltip(event, html) {
  tooltip.classed("hidden", false).html(html);
  moveTooltip(event);
}
function moveTooltip(event) {
  tooltip
    .style("left", `${event.clientX + 14}px`)
    .style("top", `${event.clientY + 14}px`);
}
function hideTooltip() {
  tooltip.classed("hidden", true);
}

function populateMetricControls() {
  const metricIds = ["metricX", "metricY", "mapMetric"];
  metricIds.forEach((id) => {
    const sel = document.getElementById(id);
    sel.innerHTML = "";
    state.metrics.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m.value;
      opt.textContent = m.label;
      sel.appendChild(opt);
    });
  });

  // sane defaults if present
  if (state.metrics.some(m => m.value === "pm25")) state.metricX = "pm25";
  if (state.metrics.some(m => m.value === "life_expectancy")) state.metricY = "life_expectancy";
  if (state.metrics.some(m => m.value === "life_expectancy")) state.mapMetric = "life_expectancy";

  document.getElementById("metricX").value = state.metricX;
  document.getElementById("metricY").value = state.metricY;
  document.getElementById("mapMetric").value = state.mapMetric;
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
  document.getElementById("resetSelection").addEventListener("click", () => {
    state.selectedCodes.clear();
    renderAll();
  });
}

function setHover(d) {
  state.hoveredCountry = d ? d.country : null;
  state.hoveredCode = d ? d.code : null;
  updateDetailsPanel();
}

function updateDetailsPanel() {
  const el = document.getElementById("details");
  const mX = metricMeta(state.metricX);
  const mY = metricMeta(state.metricY);
  const mM = metricMeta(state.mapMetric);

  if (state.hoveredCode) {
    const d = state.data.find((r) => r.code === state.hoveredCode);
    if (d) {
      el.innerHTML = `
        <div style="display:grid; gap:6px;">
          <div><strong>${d.country}</strong> (${d.code}) · Year ${d.year}</div>
          <div>${mX.label}: <strong>${mX.format(d[state.metricX])}</strong></div>
          <div>${mY.label}: <strong>${mY.format(d[state.metricY])}</strong></div>
          <div>${mM.label}: <strong>${mM.format(d[state.mapMetric])}</strong></div>
        </div>
      `;
      return;
    }
  }

  if (state.selectedCodes.size > 0) {
    const selected = state.data.filter((d) => state.selectedCodes.has(d.code));
    const avgX = d3.mean(selected, (d) => d[state.metricX]);
    const avgY = d3.mean(selected, (d) => d[state.metricY]);

    el.innerHTML = `
      <div style="display:grid; gap:6px;">
        <div><strong>${selected.length}</strong> countries selected (scatter brush)</div>
        <div>Avg ${mX.label}: <strong>${mX.format(avgX)}</strong></div>
        <div>Avg ${mY.label}: <strong>${mY.format(avgY)}</strong></div>
        <div class="muted">Selection is highlighted across map and plots.</div>
      </div>
    `;
    return;
  }

  el.innerHTML = `<p class="muted">Hover a country or brush the scatterplot to inspect details and linked highlights.</p>`;
}

function renderMap() {
  const root = d3.select("#map");
  root.selectAll("*").remove();

  const container = root.node().getBoundingClientRect();
  const width = Math.max(420, container.width);
  const height = Math.max(320, container.height);

  const svg = root.append("svg").attr("viewBox", `0 0 ${width} ${height}`);
  const g = svg.append("g");

  if (!state.geojson) return;

  const projection = d3.geoNaturalEarth1().fitSize([width, height], state.geojson);
  const path = d3.geoPath(projection);

  const valueByCode = new Map(state.data.map((d) => [d.code, d[state.mapMetric]]));

  const values = state.data.map((d) => d[state.mapMetric]).filter(Number.isFinite);
  const [vmin, vmax] = d3.extent(values);

  const color = d3.scaleSequential(d3.interpolateCividis).domain([vmin, vmax]);

  g.selectAll("path.country")
    .data(state.geojson.features)
    .join("path")
    .attr("class", "country")
    .attr("d", path)
    .attr("fill", (f) => {
      const code = f.id || f.properties?.iso_a3;
      const v = valueByCode.get(code);
      if (!Number.isFinite(v)) return "rgba(255,255,255,0.05)";
      return color(v);
    })
    .attr("stroke", "rgba(255,255,255,0.18)")
    .attr("stroke-width", 0.5)
    .attr("opacity", (f) => {
      if (state.selectedCodes.size === 0) return 1;
      const code = f.id || f.properties?.iso_a3;
      return state.selectedCodes.has(code) ? 1 : 0.28;
    })
    .on("mousemove", function (event, f) {
      const code = f.id || f.properties?.iso_a3;
      const d = state.data.find((r) => r.code === code);
      if (!d) {
        showTooltip(event, `<strong>${f.properties?.name || "Unknown"}</strong><br/><span class="muted">No data</span>`);
        return;
      }
      setHover(d);
      const m = metricMeta(state.mapMetric);
      showTooltip(
        event,
        `<strong>${d.country}</strong><br/>${m.label}: <strong>${m.format(d[state.mapMetric])}</strong><br/>Year: ${d.year}`
      );
    })
    .on("mouseleave", () => {
      setHover(null);
      hideTooltip();
    });

  // simple legend
  const legendW = 180, legendH = 10;
  const legendX = 14, legendY = height - 28;
  const defs = svg.append("defs");
  const gradId = "mapGrad";
  const lg = defs.append("linearGradient").attr("id", gradId);
  lg.attr("x1", "0%").attr("x2", "100%").attr("y1", "0%").attr("y2", "0%");
  d3.range(0, 1.01, 0.1).forEach((t) => {
    lg.append("stop").attr("offset", `${t * 100}%`).attr("stop-color", color(vmin + t * (vmax - vmin)));
  });

  svg.append("rect")
    .attr("x", legendX).attr("y", legendY)
    .attr("width", legendW).attr("height", legendH)
    .attr("rx", 4)
    .attr("fill", `url(#${gradId})`)
    .attr("stroke", "rgba(255,255,255,0.15)");

  const m = metricMeta(state.mapMetric);
  svg.append("text")
    .attr("x", legendX).attr("y", legendY - 6)
    .attr("fill", "#98a6bd").attr("font-size", 11)
    .text(m.label);

  svg.append("text")
    .attr("x", legendX).attr("y", legendY + 24)
    .attr("fill", "#98a6bd").attr("font-size", 10)
    .text(m.format(vmin));

  svg.append("text")
    .attr("x", legendX + legendW).attr("y", legendY + 24)
    .attr("text-anchor", "end")
    .attr("fill", "#98a6bd").attr("font-size", 10)
    .text(m.format(vmax));
}

function renderScatter() {
  const root = d3.select("#scatter");
  root.selectAll("*").remove();

  const container = root.node().getBoundingClientRect();
  const width = Math.max(420, container.width);
  const height = Math.max(320, container.height);

  const margin = { top: 18, right: 18, bottom: 52, left: 62 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = root.append("svg").attr("viewBox", `0 0 ${width} ${height}`);
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const data = getData();
  if (!data.length) return;

  const xVals = data.map((d) => d[state.metricX]);
  const yVals = data.map((d) => d[state.metricY]);
  const x = d3.scaleLinear().domain(d3.extent(xVals)).nice().range([0, innerW]);
  const y = d3.scaleLinear().domain(d3.extent(yVals)).nice().range([innerH, 0]);

  const xMeta = metricMeta(state.metricX);
  const yMeta = metricMeta(state.metricY);

  g.append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(6).tickSizeOuter(0))
    .call((g) => g.selectAll("text").attr("fill", "#98a6bd"))
    .call((g) => g.selectAll("line,path").attr("stroke", "rgba(255,255,255,0.15)"));

  g.append("g")
    .call(d3.axisLeft(y).ticks(6).tickSizeOuter(0))
    .call((g) => g.selectAll("text").attr("fill", "#98a6bd"))
    .call((g) => g.selectAll("line,path").attr("stroke", "rgba(255,255,255,0.15)"));

  // gridlines
  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y).ticks(6).tickSize(-innerW).tickFormat(""))
    .call((gg) => gg.selectAll("line").attr("stroke", "rgba(255,255,255,0.06)"))
    .call((gg) => gg.select("path").remove());

  const dots = g.append("g")
    .selectAll("circle")
    .data(data, (d) => d.code)
    .join("circle")
    .attr("cx", (d) => x(d[state.metricX]))
    .attr("cy", (d) => y(d[state.metricY]))
    .attr("r", 4.3)
    .attr("fill", (d) => (state.selectedCodes.size === 0 || state.selectedCodes.has(d.code)) ? "#67e8f9" : "rgba(255,255,255,0.20)")
    .attr("opacity", (d) => (state.selectedCodes.size === 0 || state.selectedCodes.has(d.code)) ? 0.85 : 0.4)
    .attr("stroke", "rgba(255,255,255,0.15)")
    .attr("stroke-width", 0.7)
    .on("mousemove", (event, d) => {
      setHover(d);
      showTooltip(
        event,
        `<strong>${d.country}</strong><br/>${xMeta.label}: <strong>${xMeta.format(d[state.metricX])}</strong><br/>${yMeta.label}: <strong>${yMeta.format(d[state.metricY])}</strong>`
      );
    })
    .on("mouseleave", () => {
      setHover(null);
      hideTooltip();
    });

  // axis labels
  svg.append("text")
    .attr("x", margin.left + innerW / 2)
    .attr("y", height - 12)
    .attr("text-anchor", "middle")
    .attr("fill", "#98a6bd")
    .attr("font-size", 12)
    .text(xMeta.label);

  svg.append("text")
    .attr("transform", `translate(14, ${margin.top + innerH / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .attr("fill", "#98a6bd")
    .attr("font-size", 12)
    .text(yMeta.label);

  // brush
  const brush = d3.brush()
    .extent([[0, 0], [innerW, innerH]])
    .on("end", (event) => {
      if (!event.selection) {
        state.selectedCodes.clear();
        renderAll();
        return;
      }
      const [[x0, y0], [x1, y1]] = event.selection;
      const selected = data.filter((d) => {
        const px = x(d[state.metricX]);
        const py = y(d[state.metricY]);
        return x0 <= px && px <= x1 && y0 <= py && py <= y1;
      });
      state.selectedCodes = new Set(selected.map((d) => d.code));
      renderAll();
    });

  g.append("g").attr("class", "brush").call(brush);
}

function renderHistogram(containerSelector, metricKey) {
  const root = d3.select(containerSelector);
  root.selectAll("*").remove();

  const container = root.node().getBoundingClientRect();
  const width = Math.max(320, container.width);
  const height = Math.max(220, container.height);

  const margin = { top: 14, right: 14, bottom: 40, left: 44 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = root.append("svg").attr("viewBox", `0 0 ${width} ${height}`);
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const data = state.data.filter((d) => Number.isFinite(d[metricKey]));
  if (!data.length) return;

  const vals = data.map((d) => d[metricKey]);
  const x = d3.scaleLinear().domain(d3.extent(vals)).nice().range([0, innerW]);

  const bins = d3.bin().domain(x.domain()).thresholds(12).value((d) => d[metricKey])(data);
  const y = d3.scaleLinear().domain([0, d3.max(bins, (b) => b.length) || 1]).nice().range([innerH, 0]);

  g.append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(5).tickSizeOuter(0))
    .call((gg) => gg.selectAll("text").attr("fill", "#98a6bd").attr("font-size", 10))
    .call((gg) => gg.selectAll("line,path").attr("stroke", "rgba(255,255,255,0.15)"));

  g.append("g")
    .call(d3.axisLeft(y).ticks(4).tickSizeOuter(0))
    .call((gg) => gg.selectAll("text").attr("fill", "#98a6bd").attr("font-size", 10))
    .call((gg) => gg.selectAll("line,path").attr("stroke", "rgba(255,255,255,0.15)"));

  const meta = metricMeta(metricKey);

  g.selectAll("rect.bin")
    .data(bins)
    .join("rect")
    .attr("class", "bin")
    .attr("x", (b) => x(b.x0) + 1)
    .attr("y", (b) => y(b.length))
    .attr("width", (b) => Math.max(0, x(b.x1) - x(b.x0) - 2))
    .attr("height", (b) => innerH - y(b.length))
    .attr("rx", 3)
    .attr("fill", (b) => {
      if (state.selectedCodes.size === 0) return "rgba(96,165,250,0.75)";
      const selectedCount = b.filter((d) => state.selectedCodes.has(d.code)).length;
      return selectedCount > 0 ? "rgba(103,232,249,0.9)" : "rgba(255,255,255,0.14)";
    })
    .on("mousemove", (event, b) => {
      const selectedCount = b.filter((d) => state.selectedCodes.has(d.code)).length;
      showTooltip(
        event,
        `<strong>${meta.label}</strong><br/>Range: ${meta.format(b.x0)} – ${meta.format(b.x1)}<br/>Countries: <strong>${b.length}</strong>` +
          (state.selectedCodes.size ? `<br/>Selected in bin: <strong>${selectedCount}</strong>` : "")
      );
    })
    .on("mouseleave", hideTooltip);
}

function renderAll() {
  renderMap();
  renderScatter();
  renderHistogram("#histX", state.metricX);
  renderHistogram("#histY", state.metricY);
  updateDetailsPanel();

  // update panel titles dynamically (nice polish)
  const xLabel = metricMeta(state.metricX).label;
  const yLabel = metricMeta(state.metricY).label;
  const xTitle = document.querySelector("#hist-x-panel .panel-header h2");
  const yTitle = document.querySelector("#hist-y-panel .panel-header h2");
  if (xTitle) xTitle.textContent = `Distribution: ${xLabel}`;
  if (yTitle) yTitle.textContent = `Distribution: ${yLabel}`;
}

async function loadData() {
  const [rows, geojson] = await Promise.all([
    d3.csv(DATA_URL, d3.autoType),
    d3.json(GEOJSON_URL)
  ]);

  // normalize keys
  state.data = rows
    .map((d) => ({
      country: d.country ?? d.Entity ?? d.entity,
      code: d.code ?? d.Code ?? d.iso3,
      year: d.year ?? d.Year,
      life_expectancy: Number(d.life_expectancy),
      pm25: Number(d.pm25),
      undernourishment: Number(d.undernourishment),
      gdp_per_capita: Number(d.gdp_per_capita),
      obesity_prevalence: d.obesity_prevalence != null ? Number(d.obesity_prevalence) : undefined,
    }))
    .filter((d) => d.country && d.code && /^[A-Z]{3}$/.test(String(d.code)));

  state.geojson = geojson;
  state.metrics = METRIC_META.filter((m) =>
    state.data.some((d) => Number.isFinite(d[m.value]))
  );

  // set year label (assume one shared year in merged file)
  const years = [...new Set(state.data.map((d) => d.year).filter((v) => v != null))];
  state.yearLabel = years.length === 1 ? String(years[0]) : years.join(", ");
  document.getElementById("year-label").textContent = state.yearLabel;
}

function debounce(fn, ms = 120) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

async function init() {
  try {
    await loadData();
    populateMetricControls();
    wireControls();
    renderAll();

    window.addEventListener("resize", debounce(() => renderAll(), 140));
  } catch (err) {
    console.error(err);
    document.getElementById("details").innerHTML = `
      <p><strong>Data load error.</strong></p>
      <p class="muted">${String(err.message || err)}</p>
      <p class="muted">Check that <code>data/world_metrics_merged.csv</code> exists and column names match.</p>
    `;
  }
}

init();