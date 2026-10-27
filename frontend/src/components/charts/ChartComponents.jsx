import { Bar, Doughnut, Line } from "react-chartjs-2";
import "../../utils/chartSetup";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_META,
  HEALTH_CATEGORY_META,
  PROJECT_STATUS,
  PROJECT_STATUS_META,
} from "../../utils/constants";
import { formatCurrency } from "../../utils/format";

/**
 * 1. Status Distribution Doughnut Chart
 */
export function StatusDoughnutChart({ statusDistribution = {} }) {
  const statuses = [
    PROJECT_STATUS.IN_PROGRESS,
    PROJECT_STATUS.DELAYED,
    PROJECT_STATUS.COMPLETED,
    PROJECT_STATUS.ON_HOLD,
    PROJECT_STATUS.NOT_STARTED,
  ];

  const labels = statuses.map(
    (s) => PROJECT_STATUS_META[s]?.label || s
  );
  const dataValues = statuses.map((s) => Number(statusDistribution[s] || 0));
  const bgColors = statuses.map(
    (s) => PROJECT_STATUS_META[s]?.color || "#94a3b8"
  );

  const hasData = dataValues.some((v) => v > 0);

  const data = {
    labels,
    datasets: [
      {
        data: hasData ? dataValues : [1],
        backgroundColor: hasData ? bgColors : ["#e2e8f0"],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 14, padding: 14, font: { size: 13, family: "'Inter', sans-serif" } },
      },
      tooltip: {
        enabled: hasData,
        titleFont: { size: 14 },
        bodyFont: { size: 14 },
        callbacks: {
          label: (context) => ` ${context.label}: ${context.raw} projects`,
        },
      },
    },
    cutout: "68%",
  };

  return (
    <div style={{ position: "relative", height: 260 }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}

/**
 * 2. Planned vs Actual Progress Grouped Bar Chart
 */
export function PlannedVsActualBarChart({ projects = [] }) {
  const slice = projects.slice(0, 7);
  const labels = slice.map((p) =>
    p.name?.length > 18 ? p.name.substring(0, 16) + "..." : p.name
  );
  const actualData = slice.map((p) => Number(p.completedPercentage) || 0);
  const plannedData = slice.map((p) =>
    Math.round(Number(p.plannedProgress) || 0)
  );

  const data = {
    labels: labels.length ? labels : ["No data"],
    datasets: [
      {
        label: "Actual %",
        data: actualData.length ? actualData : [0],
        backgroundColor: "#16a34a",
        borderRadius: 4,
      },
      {
        label: "Planned %",
        data: plannedData.length ? plannedData : [0],
        backgroundColor: "#93c5fd",
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { callback: (v) => `${v}%`, font: { size: 13 } },
      },
      x: {
        ticks: { font: { size: 13 } },
      },
    },
    plugins: {
      legend: { position: "top", labels: { boxWidth: 14, font: { size: 13 } } },
      tooltip: {
        titleFont: { size: 14 },
        bodyFont: { size: 14 },
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}%`,
        },
      },
    },
  };

  return (
    <div style={{ position: "relative", height: 260 }}>
      <Bar data={data} options={options} />
    </div>
  );
}

/**
 * 3. Budget Utilisation Horizontal Bars
 * Blue < 85%, Amber 85-100%, Red > 100%
 */
export function BudgetUtilizationBarChart({ projects = [] }) {
  const slice = projects.slice(0, 7);
  const labels = slice.map((p) =>
    p.name?.length > 18 ? p.name.substring(0, 16) + "..." : p.name
  );
  const utilValues = slice.map((p) =>
    Number(p.budgetUtilizationPercent) || 0
  );

  const bgColors = utilValues.map((val) => {
    if (val > 100) return "#dc2626"; // Red > 100%
    if (val >= 85) return "#d97706"; // Amber 85-100%
    return "#2563eb"; // Blue < 85%
  });

  const data = {
    labels: labels.length ? labels : ["No data"],
    datasets: [
      {
        label: "Utilisation %",
        data: utilValues.length ? utilValues : [0],
        backgroundColor: bgColors,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    indexAxis: "y",
    responsive: true,
    scales: {
      x: {
        beginAtZero: true,
        ticks: { callback: (v) => `${v}%`, font: { size: 13 } },
      },
      y: {
        ticks: { font: { size: 13 } },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        titleFont: { size: 14 },
        bodyFont: { size: 14 },
        callbacks: {
          label: (ctx) => ` Budget Used: ${ctx.raw.toFixed(1)}%`,
        },
      },
    },
  };

  return (
    <div style={{ position: "relative", height: 260 }}>
      <Bar data={data} options={options} />
    </div>
  );
}

/**
 * 4. Health Index Bar Chart
 * Coloured by Category: Green >= 80, Amber 60-79, Red < 60
 */
export function HealthIndexBarChart({ projects = [] }) {
  const slice = projects.slice(0, 7);
  const labels = slice.map((p) =>
    p.name?.length > 18 ? p.name.substring(0, 16) + "..." : p.name
  );
  const scores = slice.map((p) => Number(p.healthIndex) || 0);

  const bgColors = scores.map((score) => {
    if (score >= 80) return HEALTH_CATEGORY_META.HEALTHY.color;
    if (score >= 60) return HEALTH_CATEGORY_META.NEEDS_ATTENTION.color;
    return HEALTH_CATEGORY_META.CRITICAL.color;
  });

  const data = {
    labels: labels.length ? labels : ["No data"],
    datasets: [
      {
        label: "Health Index",
        data: scores.length ? scores : [0],
        backgroundColor: bgColors,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { callback: (v) => `${v}`, font: { size: 13 } },
      },
      x: {
        ticks: { font: { size: 13 } },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        titleFont: { size: 14 },
        bodyFont: { size: 14 },
        callbacks: {
          label: (ctx) => ` Road Health Index: ${ctx.raw}`,
        },
      },
    },
  };

  return (
    <div style={{ position: "relative", height: 260 }}>
      <Bar data={data} options={options} />
    </div>
  );
}

/**
 * 5. Progress Over Time Line Chart
 */
export function ProgressTimelineLineChart({ progressTimeline = [] }) {
  const colors = [
    "#2fa36b",
    "#0284c7",
    "#d97706",
    "#7c3aed",
    "#db2777",
    "#4b5563",
  ];

  // Collect all unique dates
  const dateSet = new Set();
  progressTimeline.forEach((series) => {
    (series.points || []).forEach((pt) => dateSet.add(pt.date));
  });

  const sortedDates = Array.from(dateSet).sort();

  const datasets = progressTimeline.slice(0, 5).map((series, idx) => {
    const pointMap = {};
    (series.points || []).forEach((pt) => {
      pointMap[pt.date] = pt.percentage;
    });

    let lastVal = 0;
    const dataVals = sortedDates.map((d) => {
      if (pointMap[d] !== undefined) {
        lastVal = pointMap[d];
      }
      return lastVal;
    });

    const c = colors[idx % colors.length];
    return {
      label:
        series.projectName?.length > 20
          ? series.projectName.substring(0, 18) + "..."
          : series.projectName,
      data: dataVals,
      borderColor: c,
      backgroundColor: c,
      tension: 0.2,
      pointRadius: 4,
      fill: false,
    };
  });

  const data = {
    labels: sortedDates.length ? sortedDates : ["No history"],
    datasets: datasets.length
      ? datasets
      : [
          {
            label: "Progress",
            data: [0],
            borderColor: "#cbd5e1",
          },
        ],
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { callback: (v) => `${v}%`, font: { size: 13 } },
      },
      x: {
        ticks: { font: { size: 13 }, maxTicksLimit: 8 },
      },
    },
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 14, font: { size: 13 } } },
      tooltip: {
        titleFont: { size: 14 },
        bodyFont: { size: 14 },
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}%`,
        },
      },
    },
  };

  return (
    <div style={{ position: "relative", height: 260 }}>
      <Line data={data} options={options} />
    </div>
  );
}

/**
 * 6. Expense By Category Doughnut Chart
 */
export function ExpenseCategoryDoughnutChart({
  expenseDistribution = {},
  compact = false,
}) {
  const categories = Object.keys(EXPENSE_CATEGORIES);
  const labels = categories.map(
    (c) => EXPENSE_CATEGORY_META[c]?.label || c
  );
  const dataValues = categories.map((c) =>
    Number(expenseDistribution[c] || 0)
  );
  const bgColors = categories.map(
    (c) => EXPENSE_CATEGORY_META[c]?.color || "#94a3b8"
  );

  const hasData = dataValues.some((v) => v > 0);

  const data = {
    labels,
    datasets: [
      {
        data: hasData ? dataValues : [1],
        backgroundColor: hasData ? bgColors : ["#e2e8f0"],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: compact ? "right" : "bottom",
        labels: { boxWidth: 14, padding: 12, font: { size: 13, family: "'Inter', sans-serif" } },
      },
      tooltip: {
        enabled: hasData,
        titleFont: { size: 14 },
        bodyFont: { size: 14 },
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.raw)}`,
        },
      },
    },
    cutout: "65%",
  };

  return (
    <div style={{ position: "relative", height: compact ? 220 : 260 }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}
