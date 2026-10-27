export default function Loader({ message = "Loading SmartRoad data...", className = "" }) {
  return (
    <div className={`loader-wrapper ${className}`} role="status">
      <div className="spinner" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
