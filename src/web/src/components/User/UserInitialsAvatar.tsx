import React from "react";
import { AvatarImage } from "../AvatarImage";

export const UserInitialsAvatar: React.FC<{
  displayName?: string | null;
  photoURL?: string | null;
  size: number;
  alt?: string;
}> = ({ displayName, photoURL, size, alt = "User" }) => {
  if (photoURL) {
    return <AvatarImage icon={photoURL} alt={alt} size={size} />;
  }
  let label: string;
  let hash = 0;
  if (displayName) {
    const parts = displayName.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
    label = `${first}${last}`.toUpperCase() || "?";
    for (let i = 0; i < displayName.length; i++) {
      hash = displayName.charCodeAt(i) + ((hash << 5) - hash);
    }
  } else {
    label = "";
  }
  const hue = Math.abs(hash) % 360;
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold text-white select-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        backgroundColor: displayName ? `hsl(${hue}, 55%, 45%)` : "transparent",
      }}
    >
      {label}
    </div>
  );
};
