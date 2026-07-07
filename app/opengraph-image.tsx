import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Linea Brava — Comunidad Todoterreno y Overland";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 48,
          backgroundColor: "#08090A",
        }}
      >
        <svg
          width="450"
          height="136"
          viewBox="0 0 225 68"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polyline
            points="4,56 41,22 64.9,43.9 104,8 137.6,38.9 168,11 221,59.8"
            stroke="#F5821F"
            strokeWidth="6"
          />
        </svg>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#F5F3EF",
            }}
          >
            LINEA BRAVA
          </div>
          <div style={{ fontSize: 28, color: "#9CA0A8" }}>
            La plataforma todoterreno de México
          </div>
        </div>
      </div>
    ),
    size
  );
}
