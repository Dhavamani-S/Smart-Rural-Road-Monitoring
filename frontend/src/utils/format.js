/**
 * Formats a numeric value into Indian Rupee currency format (₹).
 * @param {number|string} value
 * @param {boolean} compact - Whether to format as Lakhs/Crores
 * @returns {string}
 */
export function formatCurrency(value, compact = false) {
  if (value === null || value === undefined || value === "") return "₹0";
  const num = Number(value);
  if (Number.isNaN(num)) return "₹0";

  if (compact) {
    if (Math.abs(num) >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(num) >= 100000) {
      return `₹${(num / 100000).toFixed(2)} L`;
    }
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Formats a date into "05 Oct 2026" style.
 * @param {string|Date} value
 * @returns {string}
 */
export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Formats date and time into "05 Oct 2026, 02:30 PM" style.
 * @param {string|Date} value
 * @returns {string}
 */
export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Formats a decimal number into percentage string e.g. "85.2%".
 * @param {number|string} value
 * @param {number} decimals
 * @returns {string}
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || value === "") return "0%";
  const num = Number(value);
  if (Number.isNaN(num)) return "0%";
  return `${num.toFixed(decimals)}%`;
}

/**
 * Formats a number with Indian numbering grouping (en-IN).
 * @param {number|string} value
 * @returns {string}
 */
export function formatNumber(value) {
  if (value === null || value === undefined || value === "") return "0";
  const num = Number(value);
  if (Number.isNaN(num)) return "0";
  return new Intl.NumberFormat("en-IN").format(num);
}

