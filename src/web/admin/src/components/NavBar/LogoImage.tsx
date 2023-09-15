import Image from "next/image";
import Link from "next/link";
import logoPicLight from "public/images/logo-light.svg";
import logoPicDark from "public/images/logo-dark.svg";
import React from "react";

export interface InputProps {
  dark?: boolean;
}

export const LogoImage: React.FC<InputProps> = ({ dark }) => {
  return (
    <Link href="/">
      {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
      <Image
        src={dark ? logoPicDark : logoPicLight}
        alt="Logo"
        priority={true}
        width={85}
        height={41}
      />
    </Link>
  );
};
