import Image from "next/image";
import React, { useState } from "react";
import { IoStorefrontOutline } from "react-icons/io5";

/**
 * The provider's logo: any external image URL (2026-10-11), so it is never optimised (the
 * optimiser only takes the allow-listed storage hosts) and falls back to the storefront tile
 * when it is missing or fails to load. Keyed on the URL, so a corrected link loads again.
 */
export const ProviderLogo: React.FC<{
  url: string | null | undefined;
  /** The provider's name, for the image's alt text. */
  name: string | null | undefined;
  size?: number;
}> = ({ url, name, size = 40 }) => (
  <ProviderLogoImage key={url ?? ""} url={url} name={name} size={size} />
);

const ProviderLogoImage: React.FC<{
  url: string | null | undefined;
  name: string | null | undefined;
  size: number;
}> = ({ url, name, size }) => {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };

  if (!url || failed)
    return (
      <span
        className="bg-gray-light text-gray-dark flex shrink-0 items-center justify-center rounded-xl"
        style={style}
      >
        <IoStorefrontOutline className="h-5 w-5" aria-hidden="true" />
      </span>
    );

  return (
    <span
      className="border-gray flex shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white"
      style={style}
    >
      <Image
        src={url}
        alt={name ? `${name} logo` : "Provider logo"}
        width={size}
        height={size}
        className="h-full w-full object-contain"
        unoptimized
        onError={() => setFailed(true)}
      />
    </span>
  );
};
