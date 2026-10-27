import Icon from "./Icon";

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  tone = "green",
}) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-card-top">
        <span className="stat-card-label">{title}</span>
        {icon && (
          <div className="stat-card-icon">
            {typeof icon === "string" ? <Icon name={icon} size={18} /> : icon}
          </div>
        )}
      </div>
      <div className="stat-card-value">{value}</div>
      {subtitle && <div className="stat-card-subtext">{subtitle}</div>}
    </article>
  );
}
