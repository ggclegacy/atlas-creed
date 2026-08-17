import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#09090d",
        color: "#cbaa5e",
        display: "flex",
        fontFamily: "sans-serif",
        fontSize: 112,
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      A
    </div>,
    size,
  );
}
