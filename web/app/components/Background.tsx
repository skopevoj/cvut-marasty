"use client";

import { useSettingsStore } from "../lib/stores";

const PRESET_BACKGROUNDS = [
  {
    id: "gradient-sunset",
    name: "Gradient - Sunset",
    type: "gradient",
    gradientStart: "#ff6b6b",
    gradientEnd: "#4ecdc4",
    intensity: 0.4,
  },
  {
    id: "gradient-ocean",
    name: "Gradient - Ocean",
    type: "gradient",
    gradientStart: "#667eea",
    gradientEnd: "#764ba2",
    intensity: 0.35,
  },
  {
    id: "gradient-forest",
    name: "Gradient - Forest",
    type: "gradient",
    gradientStart: "#134e5e",
    gradientEnd: "#71b280",
    intensity: 0.3,
  },
  {
    id: "gradient-cherry",
    name: "Gradient - Cherry",
    type: "gradient",
    gradientStart: "#eb3349",
    gradientEnd: "#f45c43",
    intensity: 0.4,
  },
  {
    id: "gradient-night",
    name: "Gradient - Night",
    type: "gradient",
    gradientStart: "#0f0c29",
    gradientEnd: "#302b63",
    intensity: 0.25,
  },
  {
    id: "video-1",
    name: "Video - Nature 1",
    type: "video",
    url: "/bg/1.mp4",
  },
  {
    id: "video-2",
    name: "Video - Nature 2",
    type: "video",
    url: "/bg/2.mp4",
  },
  {
    id: "video-3",
    name: "Video - Nature 3",
    type: "video",
    url: "/bg/3.mp4",
  },
  {
    id: "video-4",
    name: "Video - Nature 4",
    type: "video",
    url: "/bg/4.mp4",
  },
  {
    id: "video-5",
    name: "Video - Nature 5",
    type: "video",
    url: "/bg/5.mp4",
  },
];

function StaticGradientBackground({
  start,
  end,
}: {
  start: string;
  end: string;
}) {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: -1,
        background: `linear-gradient(135deg, ${start} 0%, ${end} 100%)`,
      }}
    />
  );
}

function ImageBackground({ url }: { url: string }) {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: -1,
        backgroundImage: `url('${url}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    />
  );
}

function VideoBackground({ url }: { url: string }) {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -1 }}>
      <video
        key={url}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
      >
        <source src={url} type="video/mp4" />
      </video>
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
        <StaticGradientBackground
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
