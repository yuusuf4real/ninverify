import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #22c55e 0%, #059669 100%)",
        borderRadius: "40px",
      }}
    >
      <svg
        width="100"
        height="100"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z"
          fill="white"
          opacity="0.95"
        />
        <path
          d="M10 14L7 11L8.41 9.59L10 11.17L15.59 5.58L17 7L10 14Z"
          fill="#22c55e"
        />
      </svg>
      <div
        style={{
          marginTop: "16px",
          fontSize: "24px",
          fontWeight: "bold",
          color: "white",
          letterSpacing: "0.05em",
        }}
      >
        VN
      </div>
      <div
        style={{
          fontSize: "14px",
          color: "rgba(255,255,255,0.8)",
          letterSpacing: "0.2em",
        }}
      >
        VERIFY
      </div>
    </div>,
    {
      ...size,
    },
  );
}
