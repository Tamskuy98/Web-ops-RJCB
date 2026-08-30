// Lightweight chart drawing helpers built on pdfkit vector primitives.
// No native/canvas dependency needed, so this stays safe on Docker/Alpine.
const { formatCurrency, formatDateShort } = require("./formatters");

const COLORS = {
  primary: "#dc2626", // red-600 (brand)
  secondary: "#3b82f6", // blue-500
  success: "#10b981", // emerald-500
  warning: "#f59e0b", // amber-500
  grid: "#e5e7eb",
  text: "#374151",
  muted: "#9ca3af",
};

const niceMax = (max) => {
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const normalized = max / magnitude;
  let niceNormalized;
  if (normalized <= 1) niceNormalized = 1;
  else if (normalized <= 2) niceNormalized = 2;
  else if (normalized <= 5) niceNormalized = 5;
  else niceNormalized = 10;
  return niceNormalized * magnitude;
};

// Downsample long series so the x-axis stays readable in a fixed PDF width
const sampleSeries = (data, maxPoints) => {
  if (data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, i) => i % step === 0);
};

function drawChartTitle(doc, title, x, y, width) {
  doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.text);
  doc.text(title, x, y, { width, align: "left" });
  return y + 16;
}

function drawEmptyChart(
  doc,
  x,
  y,
  width,
  height,
  message = "Belum ada transaksi pada periode ini.",
) {
  doc.rect(x, y, width, height).fill("#f9fafb");
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(9);
  doc.text(message, x, y + height / 2 - 5, { width, align: "center" });
  doc.fillColor(COLORS.text);
}

/**
 * Bar chart with a single series. data = [{ label, value }]
 */
function drawBarChart(
  doc,
  {
    x,
    y,
    width,
    height,
    title,
    data,
    color = COLORS.secondary,
    valueFormatter = formatCurrency,
  },
) {
  let chartY = drawChartTitle(doc, title, x, y, width);
  const chartHeight = height - (chartY - y) - 18;

  if (!data || data.length === 0) {
    drawEmptyChart(doc, x, chartY, width, chartHeight + 18);
    return y + height;
  }

  const plotted = sampleSeries(data, 20);
  const maxValue = niceMax(Math.max(...plotted.map((d) => d.value), 0));
  const axisLabelWidth = 48;
  const plotX = x + axisLabelWidth;
  const plotWidth = width - axisLabelWidth;
  const barGap = 4;
  const barWidth = Math.max(plotWidth / plotted.length - barGap, 4);

  // Gridlines + y-axis labels (4 steps)
  doc.font("Helvetica").fontSize(7).fillColor(COLORS.muted);
  for (let i = 0; i <= 4; i += 1) {
    const gy = chartY + chartHeight - chartHeight * (i / 4);
    doc
      .moveTo(plotX, gy)
      .lineTo(plotX + plotWidth, gy)
      .strokeColor(COLORS.grid)
      .lineWidth(0.5)
      .stroke();
    const val = maxValue * (i / 4);
    doc.text(
      val >= 1000 ? `${(val / 1000).toFixed(0)}rb` : `${val.toFixed(0)}`,
      x,
      gy - 3,
      { width: axisLabelWidth - 4, align: "right" },
    );
  }

  plotted.forEach((point, i) => {
    const barHeight = maxValue > 0 ? (point.value / maxValue) * chartHeight : 0;
    const bx = plotX + i * (barWidth + barGap);
    const by = chartY + chartHeight - barHeight;
    doc.rect(bx, by, barWidth, barHeight).fill(color);
    doc.fillColor(COLORS.muted).font("Helvetica").fontSize(6);
    doc.text(point.label, bx - 2, chartY + chartHeight + 3, {
      width: barWidth + 4,
      align: "center",
    });
    doc.fillColor(COLORS.text);
  });

  return y + height;
}

/**
 * Line chart with a single series. data = [{ label, value }]
 */
function drawLineChart(
  doc,
  {
    x,
    y,
    width,
    height,
    title,
    data,
    color = COLORS.success,
    valueFormatter = formatCurrency,
  },
) {
  let chartY = drawChartTitle(doc, title, x, y, width);
  const chartHeight = height - (chartY - y) - 18;

  if (!data || data.length === 0) {
    drawEmptyChart(doc, x, chartY, width, chartHeight + 18);
    return y + height;
  }

  const plotted = sampleSeries(data, 24);
  const maxValue = niceMax(Math.max(...plotted.map((d) => d.value), 0));
  const axisLabelWidth = 48;
  const plotX = x + axisLabelWidth;
  const plotWidth = width - axisLabelWidth;

  doc.font("Helvetica").fontSize(7).fillColor(COLORS.muted);
  for (let i = 0; i <= 4; i += 1) {
    const gy = chartY + chartHeight - chartHeight * (i / 4);
    doc
      .moveTo(plotX, gy)
      .lineTo(plotX + plotWidth, gy)
      .strokeColor(COLORS.grid)
      .lineWidth(0.5)
      .stroke();
    const val = maxValue * (i / 4);
    doc.text(
      val >= 1000 ? `${(val / 1000).toFixed(0)}rb` : `${val.toFixed(0)}`,
      x,
      gy - 3,
      { width: axisLabelWidth - 4, align: "right" },
    );
  }

  const stepX = plotted.length > 1 ? plotWidth / (plotted.length - 1) : 0;
  const points = plotted.map((point, i) => ({
    px: plotX + i * stepX,
    py:
      chartY +
      chartHeight -
      (maxValue > 0 ? (point.value / maxValue) * chartHeight : 0),
  }));

  doc.strokeColor(color).lineWidth(1.5);
  doc.moveTo(points[0].px, points[0].py);
  points.slice(1).forEach((p) => doc.lineTo(p.px, p.py));
  doc.stroke();

  points.forEach((p) => doc.circle(p.px, p.py, 1.6).fill(color));

  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(6);
  plotted.forEach((point, i) => {
    if (plotted.length > 12 && i % 2 !== 0) return; // thin out labels on long ranges
    doc.text(point.label, points[i].px - 12, chartY + chartHeight + 3, {
      width: 24,
      align: "center",
    });
  });
  doc.fillColor(COLORS.text);

  return y + height;
}

/**
 * Grouped bar chart comparing two series per label (e.g. Operasional vs Restock).
 * data = [{ label, valueA, valueB }]
 */
function drawGroupedBarChart(
  doc,
  {
    x,
    y,
    width,
    height,
    title,
    data,
    seriesA,
    seriesB,
    colorA = COLORS.warning,
    colorB = COLORS.secondary,
  },
) {
  let chartY = drawChartTitle(doc, title, x, y, width);

  // Keep the legend on its own row so it never overlaps the chart title.
  const legendY = chartY + 2;
  doc.rect(x + width - 160, legendY, 8, 8).fill(colorA);
  doc
    .fillColor(COLORS.text)
    .font("Helvetica")
    .fontSize(7)
    .text(seriesA, x + width - 148, legendY - 1);
  doc.rect(x + width - 80, legendY, 8, 8).fill(colorB);
  doc
    .fillColor(COLORS.text)
    .font("Helvetica")
    .fontSize(7)
    .text(seriesB, x + width - 68, legendY - 1);

  chartY += 14;
  const chartHeight = height - (chartY - y) - 18;

  if (!data || data.length === 0) {
    drawEmptyChart(doc, x, chartY, width, chartHeight + 18);
    return y + height;
  }

  const plotted = sampleSeries(data, 15);
  const maxValue = niceMax(
    Math.max(...plotted.map((d) => Math.max(d.valueA, d.valueB)), 0),
  );
  const axisLabelWidth = 48;
  const plotX = x + axisLabelWidth;
  const plotWidth = width - axisLabelWidth;
  const groupGap = 6;
  const groupWidth = plotWidth / plotted.length - groupGap;
  const barWidth = Math.max(groupWidth / 2 - 1, 3);

  doc.font("Helvetica").fontSize(7).fillColor(COLORS.muted);
  for (let i = 0; i <= 4; i += 1) {
    const gy = chartY + chartHeight - chartHeight * (i / 4);
    doc
      .moveTo(plotX, gy)
      .lineTo(plotX + plotWidth, gy)
      .strokeColor(COLORS.grid)
      .lineWidth(0.5)
      .stroke();
    const val = maxValue * (i / 4);
    doc.text(
      val >= 1000 ? `${(val / 1000).toFixed(0)}rb` : `${val.toFixed(0)}`,
      x,
      gy - 3,
      { width: axisLabelWidth - 4, align: "right" },
    );
  }

  plotted.forEach((point, i) => {
    const gx = plotX + i * (groupWidth + groupGap);
    const hA = maxValue > 0 ? (point.valueA / maxValue) * chartHeight : 0;
    const hB = maxValue > 0 ? (point.valueB / maxValue) * chartHeight : 0;
    doc.rect(gx, chartY + chartHeight - hA, barWidth, hA).fill(colorA);
    doc
      .rect(gx + barWidth + 2, chartY + chartHeight - hB, barWidth, hB)
      .fill(colorB);
    doc.fillColor(COLORS.muted).font("Helvetica").fontSize(6);
    doc.text(point.label, gx - 2, chartY + chartHeight + 3, {
      width: groupWidth + 4,
      align: "center",
    });
    doc.fillColor(COLORS.text);
  });

  return y + height;
}

/**
 * Horizontal percentage usage bars. items = [{ label, value, percentage, color }]
 */
function drawPercentageBars(doc, { x, y, width, title, items }) {
  let curY = drawChartTitle(doc, title, x, y, width);
  const barHeight = 14;
  const rowGap = 10;

  items.forEach((item) => {
    doc.font("Helvetica").fontSize(8).fillColor(COLORS.text);
    doc.text(`${item.label}`, x, curY, { width: width * 0.35 });
    doc.text(
      `${formatCurrency(item.value)} (${item.percentage.toFixed(1)}%)`,
      x + width * 0.35,
      curY,
      {
        width: width * 0.65,
        align: "right",
      },
    );

    const barY = curY + 12;
    const trackWidth = width;
    doc.rect(x, barY, trackWidth, barHeight).fill(COLORS.grid);
    const fillWidth = Math.max(
      (Math.min(item.percentage, 100) / 100) * trackWidth,
      0,
    );
    doc
      .rect(x, barY, fillWidth, barHeight)
      .fill(item.color || COLORS.secondary);

    curY = barY + barHeight + rowGap;
  });

  return curY;
}

/**
 * Debt ratio gauge: a horizontal scale from 0% to 100% with a safe-limit marker
 * and the current position marker.
 */
function drawDebtRatioGauge(
  doc,
  { x, y, width, safeLimitPercent, currentPercent },
) {
  const trackHeight = 18;
  const clampedCurrent = Math.min(Math.max(currentPercent, 0), 100);
  const clampedSafe = Math.min(Math.max(safeLimitPercent, 0), 100);

  // Track: green up to safe limit, red beyond
  const safeWidth = (clampedSafe / 100) * width;
  doc.rect(x, y, safeWidth, trackHeight).fill("#bbf7d0");
  doc.rect(x + safeWidth, y, width - safeWidth, trackHeight).fill("#fecaca");

  // Current position marker
  const markerX = x + (clampedCurrent / 100) * width;
  doc
    .moveTo(markerX, y - 4)
    .lineTo(markerX, y + trackHeight + 4)
    .strokeColor(COLORS.text)
    .lineWidth(2)
    .stroke();
  doc.circle(markerX, y - 4, 3).fill(COLORS.primary);

  // Scale labels
  doc.font("Helvetica").fontSize(7).fillColor(COLORS.muted);
  [0, 25, 50, 75, 100].forEach((tick) => {
    const tx = x + (tick / 100) * width;
    doc.text(`${tick}%`, tx - 10, y + trackHeight + 4, {
      width: 20,
      align: "center",
    });
  });

  doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.primary);
  doc.text(`Posisi saat ini: ${currentPercent.toFixed(1)}%`, x, y - 16, {
    width,
    align: "left",
  });
  doc.font("Helvetica").fontSize(7).fillColor(COLORS.muted);
  doc.text(
    `Batas aman (dapat dikonfigurasi): ${safeLimitPercent}%`,
    x,
    y + trackHeight + 16,
    { width, align: "left" },
  );
  doc.fillColor(COLORS.text);

  return y + trackHeight + 30;
}

module.exports = {
  COLORS,
  drawBarChart,
  drawLineChart,
  drawGroupedBarChart,
  drawPercentageBars,
  drawDebtRatioGauge,
  drawEmptyChart,
};
