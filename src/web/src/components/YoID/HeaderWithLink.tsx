import { useAtom } from "jotai";
import Image from "next/image";
import Link from "next/link";
import iconZltoColor from "public/images/icon-zlto-rounded-color.webp";
import iconZlto from "public/images/icon-zlto-rounded.webp";
import stamps from "public/images/stamps.svg";
import { useEffect, useState } from "react";
import {
  IoIosArrowDropright,
  IoIosArrowRoundForward,
  IoIosInformationCircleOutline,
  IoMdArrowDropright,
  IoMdArrowForward,
} from "react-icons/io";
import { userProfileAtom } from "~/lib/store";
import { AvatarImage } from "../AvatarImage";
import { ZltoModal } from "./ZltoModal";
import { SlArrowRight } from "react-icons/sl";
import { MdKeyboardArrowRight } from "react-icons/md";

interface InputProps {
  title: string;
  url?: string | null;
}

export const HeaderWithLink: React.FC<InputProps> = ({ title, url }) => {
  return (
    <div className="flex flex-row items-center gap-2 text-black">
      <span className="w-full truncate">{title}</span>

      {url && (
        <Link
          href={url}
          className="my-auto items-end whitespace-nowrap text-sm text-gray-dark"
        >
          <MdKeyboardArrowRight className="mr-2 h-6 w-6"></MdKeyboardArrowRight>
        </Link>
      )}
    </div>
  );
};
