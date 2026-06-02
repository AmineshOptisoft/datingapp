"use client";

const STRIP_STYLE = {
  width: "120vw",
  height: "30vh",
  left: "-10%",
  transform: "rotate(-72deg)",
} as const;

export default function BackgroundAnimation() {
  return (
    <div className="backgroundAnimation fixed inset-0 pointer-events-none" aria-hidden>
      <div
        className="absolute bg-lightStrip blur-[60px]"
        style={{ ...STRIP_STYLE, top: "20%" }}
      />
      <div
        className="absolute bg-lightStrip blur-[60px]"
        style={{ ...STRIP_STYLE, top: "60%" }}
      />
    </div>
  );
}
