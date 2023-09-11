import Image from "next/image";
import Link from "next/link";
import logoPic from "public/images/logo.svg";
import React from "react";

export const LogoImage: React.FC = () => {
  return (
    <Link href="/">
      {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
      <Image src={logoPic} alt="Logo" priority={true} width={85} height={41} />
    </Link>
  );
};
