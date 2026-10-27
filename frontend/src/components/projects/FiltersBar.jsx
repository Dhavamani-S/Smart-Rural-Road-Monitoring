import Icon from "../common/Icon";
import { PROJECT_SORT_OPTIONS, PROJECT_STATUS, PROJECT_STATUS_META } from "../../utils/constants";

export default function FiltersBar({
  search = "",
  onSearchChange,
  status = "",
  onStatusChange,
  location = "",
  onLocationChange,
  engineerId = "",
  onEngineerChange,
  engineers = [],
  sort = "createdAt",
  direction = "desc",
  onSortChange,
  onDirectionToggle,
  onClear,
  isAdmin = false,
}) {
  const hasActiveFilters = Boolean(
    search || status || location || engineerId || sort !== "createdAt" || direction !== "desc"
  );

  return (
    <div className="filter-bar">
      <div className="filter-group">
        {/* Debounced search input */}
        <div className="search-input-wrap">
          <span className="search-icon-pos">
            <Icon name="search" size={16} />
          </span>
          <input
            type="text"
            placeholder="Search projects by name..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Location Filter */}
        <input
          type="text"
          className="filter-select"
          placeholder="Filter by Location..."
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          style={{ minWidth: 160 }}
          aria-label="Filter by Location"
        />

        {/* Status Filter */}
        <select
          className="filter-select"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filter by Status"
        >
          <option value="">All Statuses</option>
          {Object.keys(PROJECT_STATUS).map((s) => (
            <option key={s} value={s}>
              {PROJECT_STATUS_META[s]?.label || s}
            </option>
          ))}
        </select>

        {/* Engineer Filter (Admin only) */}
        {isAdmin && (
          <select
            className="filter-select"
            value={engineerId}
            onChange={(e) => onEngineerChange(e.target.value)}
            aria-label="Filter by Engineer"
          >
            <option value="">All Site Engineers</option>
            {engineers.map((eng) => (
              <option key={eng.id} value={eng.id}>
                {eng.fullName}
              </option>
            ))}
          </select>
        )}

        {/* Sort Column */}
        <select
          className="filter-select"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          aria-label="Sort by"
        >
          {PROJECT_SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Sort: {opt.label}
            </option>
          ))}
        </select>

        {/* Sort Direction Toggle */}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onDirectionToggle}
          title={`Sorting ${direction === "asc" ? "Ascending" : "Descending"}`}
        >
          {direction === "asc" ? "↑ ASC" : "↓ DESC"}
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClear}
            title="Reset all filters"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
