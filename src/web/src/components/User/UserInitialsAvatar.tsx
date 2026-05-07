import React from "react";
import { AvatarImage } from "../AvatarImage";

export const UserInitialsAvatar: React.FC<{
  firstName?: string | null;
  surname?: string | null;
  photoURL?: string | null;
  size: number;
  alt?: string;
}> = ({ firstName, surname, photoURL, size, alt = "User" }) => {
  if (photoURL) {
    return <AvatarImage icon={photoURL} alt={alt} size={size} />;
  }
  const initials = `${firstName ?? ""}${surname ?? ""}`;
  let hash = 0;
  for (let i = 0; i < initials.length; i++) {
    hash = initials.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  const label =
    `${firstName?.[0] ?? ""}${surname?.[0] ?? ""}`.toUpperCase() || "?";
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold text-white select-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        backgroundColor: `hsl(${hue}, 55%, 45%)`,
      }}
    >
      {label}
    </div>
  );
};
