"use client";

import dynamic from "next/dynamic";

const CameraLogic = dynamic(() => import("./CameraLogic"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-black" />
});

export const VideoFeed = () => {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-black">
      <CameraLogic />

      {/* Scanline effect for "Smart Glass" feel */}
      <div className="pointer-events-none absolute inset-0 bg-[url('/scanline.png')] opacity-10" />

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
    </div>
  );
};
