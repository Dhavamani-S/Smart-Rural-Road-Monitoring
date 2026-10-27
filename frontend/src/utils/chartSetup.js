import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register all required Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Global Chart defaults (Typography requirement: ticks/legends 13-14px, tooltip 14px)
ChartJS.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
ChartJS.defaults.font.size = 13;
ChartJS.defaults.color = "#374151";
ChartJS.defaults.responsive = true;
ChartJS.defaults.maintainAspectRatio = false;

// Legend styling
ChartJS.defaults.plugins.legend.labels.font = {
  family: "'Inter', sans-serif",
  size: 13,
  weight: "500",
};
ChartJS.defaults.plugins.legend.labels.color = "#374151";
ChartJS.defaults.plugins.legend.labels.padding = 14;

// Tooltip styling
ChartJS.defaults.plugins.tooltip.titleFont = {
  family: "'Inter', sans-serif",
  size: 14,
  weight: "bold",
};
ChartJS.defaults.plugins.tooltip.bodyFont = {
  family: "'Inter', sans-serif",
  size: 14,
  weight: "normal",
};
ChartJS.defaults.plugins.tooltip.padding = 10;
ChartJS.defaults.plugins.tooltip.cornerRadius = 6;

// Scale ticks styling
if (ChartJS.defaults.scales?.linear?.ticks) {
  ChartJS.defaults.scales.linear.ticks.font = { size: 13 };
  ChartJS.defaults.scales.linear.ticks.color = "#4b5563";
}
if (ChartJS.defaults.scales?.category?.ticks) {
  ChartJS.defaults.scales.category.ticks.font = { size: 13 };
  ChartJS.defaults.scales.category.ticks.color = "#4b5563";
}

export default ChartJS;
