import Icon from "./Icon";

export default function EmptyState({
  title = "No records found",
  description = "There is no information to display at this moment.",
  icon = "projects",
  actionText,
  onAction,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {typeof icon === "string" ? <Icon name={icon} size={28} /> : icon}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-text">{description}</p>
      {actionText && onAction && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
}
