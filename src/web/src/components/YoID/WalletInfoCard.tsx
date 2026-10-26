import Link from "next/link";
import {
  IoBagHandleOutline,
  IoTimeOutline,
  IoTrophyOutline,
} from "react-icons/io5";
import { OPPORTUNITIES_SEARCH_URL } from "~/lib/constants";
import { INTRO_LINK_CLASS } from "./YoIDIntro";

const BULLET_ICON = "text-green mt-0.5 h-4 w-4 shrink-0";

/**
 * The wallet page's "How ZLTO works" body (Jason, 2026-10-22): presentation only, no data. It
 * sits in a `DetailDisclosure` like the overview's sections, whose header carries the icon and
 * the headline, so this is just the three one-line bullets with the links inline.
 */
export const WalletInfoCard: React.FC = () => (
  <div className="flex flex-col gap-3">
    <ul className="flex flex-col gap-1.5 text-sm text-black">
      <li className="flex items-start gap-2">
        <IoTrophyOutline aria-hidden className={BULLET_ICON} />
        <span>
          Every verified{" "}
          <Link href={OPPORTUNITIES_SEARCH_URL} className={INTRO_LINK_CLASS}>
            opportunity
          </Link>{" "}
          pays the ZLTO shown on its page.
        </span>
      </li>
      <li className="flex items-start gap-2">
        <IoTimeOutline aria-hidden className={BULLET_ICON} />
        Pending rewards arrive within 24 hours.
      </li>
      <li className="flex items-start gap-2">
        <IoBagHandleOutline aria-hidden className={BULLET_ICON} />
        <span>
          Spend it in the{" "}
          <Link href="/marketplace" className={INTRO_LINK_CLASS}>
            marketplace
          </Link>
          ; purchases appear under My Products.
        </span>
      </li>
    </ul>
  </div>
);
