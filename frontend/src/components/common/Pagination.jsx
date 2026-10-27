import Icon from "./Icon";

export default function Pagination({
  page = 0,
  totalPages = 1,
  totalElements = 0,
  size = 8,
  onPageChange,
}) {
  if (totalPages <= 1 && totalElements <= size) return null;

  const start = totalElements === 0 ? 0 : page * size + 1;
  const end = Math.min((page + 1) * size, totalElements);

  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;
    let startPage = Math.max(0, page - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(0, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="pagination">
      <div className="pagination-info">
        Showing <strong>{start}</strong> to <strong>{end}</strong> of{" "}
        <strong>{totalElements}</strong> entries
      </div>
      <div className="pagination-controls">
        <button
          type="button"
          className="page-btn"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <Icon name="arrow-left" size={14} />
        </button>
        {getPageNumbers().map((p) => (
          <button
            key={p}
            type="button"
            className={`page-btn ${p === page ? "active" : ""}`}
            onClick={() => onPageChange(p)}
          >
            {p + 1}
          </button>
        ))}
        <button
          type="button"
          className="page-btn"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <Icon name="arrow-right" size={14} />
        </button>
      </div>
    </div>
  );
}
