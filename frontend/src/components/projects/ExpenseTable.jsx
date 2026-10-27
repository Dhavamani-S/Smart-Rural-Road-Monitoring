import Icon from "../common/Icon";
import { EXPENSE_CATEGORY_META } from "../../utils/constants";
import { formatCurrency, formatDate } from "../../utils/format";
import { ExpenseCategoryDoughnutChart } from "../charts/ChartComponents";

export default function ExpenseTable({
  expenses = [],
  isEngineer = false,
  isCompleted = false,
  onOpenAddModal,
}) {
  const totalSpent = expenses.reduce(
    (sum, exp) => sum + (Number(exp.amount) || 0),
    0
  );

  // Compute category distribution for doughnut chart
  const categoryDistribution = expenses.reduce((acc, exp) => {
    const cat = exp.category || "OTHER";
    acc[cat] = (acc[cat] || 0) + (Number(exp.amount) || 0);
    return acc;
  }, {});

  const hasExpenses = expenses.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Category Breakdown Chart & Financial Summary */}
      {hasExpenses && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <Icon name="expenses" size={18} /> Spending by Category
                </div>
                <div className="card-subtitle">Classification of field disbursements</div>
              </div>
            </div>
            <div style={{ height: "240px" }}>
              <ExpenseCategoryDoughnutChart expenseDistribution={categoryDistribution} />
            </div>
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Total Recorded Expenditure
            </span>
            <div style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--text-primary)", margin: "8px 0" }}>
              {formatCurrency(totalSpent)}
            </div>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Aggregated across {expenses.length} site invoices and material vouchers.
            </p>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Icon name="rupee" size={18} /> Recorded Project Expenses
            </div>
            <div className="card-subtitle">
              Total recorded expenditure: <strong>{formatCurrency(totalSpent)}</strong>
            </div>
          </div>
          {isEngineer && !isCompleted && onOpenAddModal && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onOpenAddModal}
            >
              <Icon name="plus" size={14} /> Add Expense
            </button>
          )}
        </div>

        {!hasExpenses ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text-muted)" }}>
            No expenses recorded for this project yet.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Voucher Date</th>
                  <th>Category</th>
                  <th>Description / Vendor</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((item) => {
                  const meta = EXPENSE_CATEGORY_META[item.category] || {};
                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>{formatDate(item.expenseDate)}</strong>
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "var(--text-xs)",
                            fontWeight: 600,
                            backgroundColor: `${meta.color || "#6b7280"}18`,
                            color: meta.color || "var(--text-primary)",
                            border: `1px solid ${meta.color || "#6b7280"}40`,
                          }}
                        >
                          {meta.label || item.category}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-secondary)", maxWidth: 300 }}>
                        {item.description || "—"}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "var(--text-primary)" }}>
                        {formatCurrency(item.amount)}
                      </td>
                      <td>
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                          {item.recordedByName || "Site Engineer"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
