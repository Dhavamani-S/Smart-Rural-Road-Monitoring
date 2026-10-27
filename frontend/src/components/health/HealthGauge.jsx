import { HEALTH_CATEGORY_META } from "../../utils/constants";

export default function HealthGauge({ score = 0, category = "HEALTHY" }) {
  const numScore = Math.round(Number(score) || 0);

  let meta = HEALTH_CATEGORY_META.HEALTHY;
  if (numScore < 60 || category === "CRITICAL") {
    meta = HEALTH_CATEGORY_META.CRITICAL;
  } else if (numScore < 80 || category === "NEEDS_ATTENTION") {
    meta = HEALTH_CATEGORY_META.NEEDS_ATTENTION;
  }

  return (
    <div className="health-gauge-container">
      <div
        className="health-gauge-circle"
        style={{
          borderColor: meta.color,
          backgroundColor: `${meta.color}0a`,
        }}
      >
        <div className="health-gauge-value" style={{ color: meta.color }}>
          {numScore}
        </div>
        <div className="health-gauge-label" style={{ color: meta.color }}>
          {meta.label}
        </div>
      </div>
    </div>
  );
}
