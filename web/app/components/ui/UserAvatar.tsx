"use client";

import React, { useMemo } from "react";

interface UserAvatarProps {
  name?: string;
  size?: number;
  className?: string;
}

export function UserAvatar({
  name = "Anonym",
  size = 64,
  className = "",
}: UserAvatarProps) {
  const avatarColors = [
    "#FF5F6D",
    "#FFC371",
    "#2193b0",
    "#6dd5ed",
    "#00b09b",
    "#96c93d",
    "#8E2DE2",
    "#4A00E0",
    "#ee0979",
    "#ff6a00",
  ];

  const { bgColor, initials } = useMemo(() => {
    // Generate initials
    const parts = name.trim().split(/\s+/);
    const charInitials =
      parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : (name[0] || "?").toUpperCase();

    // Deterministic color based on name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % avatarColors.length;

    return {
      bgColor: avatarColors[index],
      initials: charInitials,
    };
  }, [name]);

  return (
    <div
      className={`relative flex items-center justify-center rounded-full overflow-hidden shadow-lg border-2 border-white/20 select-none ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        fontSize: size * 0.4,
      }}
    >
      <div className="font-bold text-white drop-shadow-md">{initials}</div>

      {/* Modern gloss effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-white/20 pointer-events-none" />
    </div>
  );
}
