import Image from "next/image";
import Link from "next/link";
import logoPicDark from "public/images/logo-dark.svg";
import logoPicLight from "public/images/logo-light.svg";
import React from "react";
import { useHomeLink } from "~/context/useHomeLink";

export interface InputProps {
  dark?: boolean;
}

export const LogoImage: React.FC<InputProps> = ({ dark }) => {
  const href = useHomeLink();

  return (
    <Link href={href}>
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
