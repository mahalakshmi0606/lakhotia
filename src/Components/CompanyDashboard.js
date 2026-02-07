import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const HEADER_HEIGHT = 64;
const API_BASE = "http://localhost:5000/api/dashboard-setter";
const FILE_BASE = "http://localhost:5000";

const DashboardImageSetter = () => {
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageId, setImageId] = useState(null);

  const [pageLoading, setPageLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);

  // =========================
  // GET latest image
  // =========================
  useEffect(() => {
    const fetchLatestImage = async () => {
      try {
        const res = await axios.get(`${API_BASE}/latest`);

        if (res.data?.image_url) {
          setImageId(res.data.id);
          setImageLoading(true);

          // cache busting
          setImagePreview(
            `${FILE_BASE}${res.data.image_url}?v=${Date.now()}`
          );
        }
      } catch {
        // No image yet is OK
      } finally {
        setPageLoading(false);
      }
    };

    fetchLatestImage();
  }, []);

  // =========================
  // Change image (local preview + auto save)
  // =========================
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setImageLoading(true);
    setImagePreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("image", file);

    try {
      setSaving(true);

      let res;
      if (imageId) {
        res = await axios.put(`${API_BASE}/update/${imageId}`, formData);
      } else {
        res = await axios.post(`${API_BASE}/upload`, formData);
        setImageId(res.data?.id || null);
      }

      if (res?.data?.image_url) {
        setImagePreview(
          `${FILE_BASE}${res.data.image_url}?v=${Date.now()}`
        );
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save image");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Spinner animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Content */}
      <div style={styles.content}>
        {pageLoading && <Loader text="Loading dashboard image..." />}

        <input
          type="file"
          accept="image/*"
          hidden
          ref={fileInputRef}
          onChange={handleImageChange}
        />

        {!pageLoading && imagePreview && (
          <>
            {imageLoading && <Loader text="Rendering image..." />}
            <img
              src={imagePreview}
              alt="Dashboard"
              style={{
                ...styles.image,
                display: imageLoading ? "none" : "block",
                cursor: "pointer",
              }}
              onClick={() => fileInputRef.current.click()}
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />
          </>
        )}

        {!pageLoading && !imagePreview && (
          <div
            style={{ ...styles.placeholder, cursor: "pointer" }}
            onClick={() => fileInputRef.current.click()}
          >
            <h2>Click to Upload Image</h2>
            <p>Image will be saved automatically</p>
          </div>
        )}
      </div>
    </div>
  );
};

// =========================
// Loader
// =========================
const Loader = ({ text }) => (
  <div style={styles.loaderWrapper}>
    <div style={styles.spinner}></div>
    <p style={{ marginTop: 12 }}>{text}</p>
  </div>
);

// =========================
// Styles (unchanged)
// =========================
const styles = {
  wrapper: {
    width: "100%",
    height: `calc(100vh - ${HEADER_HEIGHT}px)`,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#0f172a",
  },

  content: {
    flex: 1,
    position: "relative",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  placeholder: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#cbd5f5",
  },

  loaderWrapper: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#cbd5f5",
    backgroundColor: "rgba(15,23,42,0.75)",
    zIndex: 10,
  },

  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #334155",
    borderTop: "4px solid #6366f1",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};

export default DashboardImageSetter;
