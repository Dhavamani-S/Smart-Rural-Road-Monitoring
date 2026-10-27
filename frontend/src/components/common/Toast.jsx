import { useEffect } from "react";
import Icon from "./Icon";

export default function Toast({ toasts = [], onClose }) {
  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map((t) =>
      setTimeout(() => {
        if (onClose) onClose(t.id);
      }, t.duration || 4000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, onClose]);

  if (!toasts.length) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type || "info"}`}
          role="alert"
        >
          <Icon
            name={
              toast.type === "success"
                ? "check"
                : toast.type === "error"
                ? "alert"
                : "activity"
            }
            size={18}
          />
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            type="button"
            onClick={() => onClose && onClose(toast.id)}
            style={{ color: "rgba(255,255,255,0.8)", padding: "2px" }}
            aria-label="Close notification"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
