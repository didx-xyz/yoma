import Image from "next/image";
import Link from "next/link";
import logoPicDark from "public/images/logo-dark.webp";
import logoPicLight from "public/images/logo-light.webp";
import React from "react";

export interface InputProps {
  dark?: boolean;
}

export const LogoImage: React.FC<InputProps> = ({ dark }) => {
  return (
    <Link href="/">
      {/* eslint-disable */}
      <Image
        src={dark ? logoPicDark : logoPicLight}
        alt="Logo"
        priority={true}
        width={85}
        height={41}
      />
      {/* eslint-enable */}
    </Link>
  );
};
