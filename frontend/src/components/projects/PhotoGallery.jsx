import { useState } from "react";
import Icon from "../common/Icon";
import { formatDateTime } from "../../utils/format";

export default function PhotoGallery({
  photos = [],
  isEngineer = false,
  isAdmin = false,
  currentUserName = "",
  onOpenUploadModal,
  onDelete,
}) {
  const [previewPhoto, setPreviewPhoto] = useState(null);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">
            <Icon name="photo" size={20} /> Site Construction Photos
          </div>
          <div className="card-subtitle">
            Visual inspection logs & field documentation ({photos.length} photos)
          </div>
        </div>
        {isEngineer && onOpenUploadModal && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onOpenUploadModal}
          >
            <Icon name="plus" size={14} /> Upload Site Photo
          </button>
        )}
      </div>

      {photos.length === 0 ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-muted)" }}>
          <div className="empty-state-icon" style={{ margin: "0 auto 12px" }}>
            <Icon name="camera" size={32} />
          </div>
          <p style={{ fontSize: "var(--text-base)" }}>No site photos uploaded for this project yet.</p>
        </div>
      ) : (
        <div className="photo-gallery-grid">
          {photos.map((photo) => {
            const canDelete =
              isAdmin ||
              (isEngineer &&
                (!photo.uploadedByName ||
                  !currentUserName ||
                  photo.uploadedByName.toLowerCase() === currentUserName.toLowerCase()));

            return (
              <div key={photo.id} className="photo-card">
                <div
                  className="photo-thumbnail-wrap"
                  onClick={() => setPreviewPhoto(photo)}
                  title="Click to view full image"
                >
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption || "Site Photo"}
                    className="photo-thumbnail"
                    loading="lazy"
                  />
                </div>
                <div className="photo-card-info">
                  <div>
                    <div className="photo-caption">
                      {photo.caption || "Site inspection photo"}
                    </div>
                    <div className="photo-meta">
                      <span>{photo.uploadedByName || "Site Engineer"}</span>
                      <span>{formatDateTime(photo.uploadedAt)}</span>
                    </div>
                  </div>
                  {canDelete && (
                    <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ color: "var(--status-red)", height: "32px", padding: "0 10px", fontSize: "var(--text-xs)" }}
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this site photo?")) {
                            onDelete && onDelete(photo.id);
                          }
                        }}
                        title="Delete photo"
                      >
                        <Icon name="trash" size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Photo Lightbox Modal Preview */}
      {previewPhoto && (
        <div
          className="modal-overlay"
          onClick={() => setPreviewPhoto(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              maxWidth: "840px",
              width: "100%",
              background: "#1e293b",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              boxShadow: "var(--shadow-lg)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "14px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: "#ffffff",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "var(--text-md)" }}>
                {previewPhoto.caption || "Site Photo Inspection Preview"}
              </span>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                style={{ color: "#ffffff", padding: "4px" }}
                aria-label="Close photo preview"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <div
              style={{
                maxHeight: "70vh",
                overflow: "hidden",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "#0f172a",
                padding: "16px",
              }}
            >
              <img
                src={previewPhoto.imageUrl}
                alt={previewPhoto.caption || "Full Preview"}
                style={{ maxHeight: "65vh", maxWidth: "100%", objectFit: "contain", borderRadius: "4px" }}
              />
            </div>
            <div
              style={{
                padding: "14px 20px",
                color: "#cbd5e1",
                fontSize: "var(--text-xs)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Uploaded by: <strong>{previewPhoto.uploadedByName || "Site Engineer"}</strong></span>
              <span>{formatDateTime(previewPhoto.uploadedAt)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
