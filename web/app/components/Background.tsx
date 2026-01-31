"use client";

import { useSettingsStore, PRESET_BACKGROUNDS } from "../lib/stores";

function ModernMeshBackground({ start, end }: { start: string; end: string }) {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: -1 }}
    >
      {/* Base Layer */}
      <div
        className="absolute inset-0 transition-colors duration-1000"
        style={{
          backgroundColor: start,
          backgroundImage: `
            radial-gradient(at 0% 0%, ${end} 0px, transparent 55%),
            radial-gradient(at 100% 0%, ${start} 0px, transparent 50%),
            radial-gradient(at 100% 100%, ${end} 0px, transparent 60%),
            radial-gradient(at 0% 100%, ${start} 0px, transparent 55%),
            radial-gradient(at 50% 50%, ${end} 0px, transparent 65%)
          `,
          filter: "blur(60px)",
          opacity: 0.25,
        }}
      />

      {/* Grain Overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

function ImageBackground({ url }: { url: string }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const fullUrl = url.startsWith("http") ? url : `${basePath}${url}`;

  return (
    <>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: -1,
          backgroundImage: `url('${fullUrl}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      />
      {/* Subtle Grain even on images */}
      <div
        className="fixed inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none"
        style={{
          zIndex: -1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </>
  );
}

function VideoBackground({ url }: { url: string }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const fullUrl = url.startsWith("http") ? url : `${basePath}${url}`;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -1 }}>
      <video
        key={fullUrl}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
      >
        <source src={fullUrl} type="video/mp4" />
      </video>
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

export function Background() {
  const backgroundEnabled = useSettingsStore((s) => s.backgroundEnabled);
  const backgroundId = useSettingsStore((s) => s.backgroundId);
  const customBackgrounds = useSettingsStore((s) => s.customBackgrounds);

  if (!backgroundEnabled) return null;

  const allBackgrounds = [...PRESET_BACKGROUNDS, ...customBackgrounds];
  const background = allBackgrounds.find((b) => b.id === backgroundId);

  if (!background) return null;

  return (
    <>
      {background.type === "gradient" && (
        <ModernMeshBackground
          key={`gradient-${backgroundId}`}
          start={background.gradientStart || "#667eea"}
          end={background.gradientEnd || "#764ba2"}
        />
      )}
      {background.type === "image" && background.url && (
        <ImageBackground key={`image-${backgroundId}`} url={background.url} />
      )}
      {background.type === "video" && background.url && (
        <VideoBackground key={`video-${backgroundId}`} url={background.url} />
      )}
    </>
  );
}
