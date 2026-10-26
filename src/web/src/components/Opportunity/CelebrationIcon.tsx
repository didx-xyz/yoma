import { IoSparkles, IoStar } from "react-icons/io5";
import { DIALOG_ICON_CIRCLE } from "./dialog";

/**
 * The icon at the top of the upload and submitted dialogs: a warm gradient circle with the icon
 * in its own colour, and confetti in the site's colours around it. Only the confetti moves —
 * each shape on its own Tailwind animation and delay, the circle and the icon stay still
 * (Jason, 2026-10-26: experimental, may be taken out). Static under reduced motion. Decorative —
 * the heading says what happened.
 */
export const CelebrationIcon: React.FC<{ icon: React.ReactNode }> = ({
  icon,
}) => (
  <div aria-hidden className="relative">
    <div
      className={`${DIALOG_ICON_CIRCLE} from-yellow-light via-orange-light to-pink/30 bg-linear-to-br shadow-md ring-4 ring-white`}
    >
      {icon}
    </div>
    <IoSparkles className="text-orange motion-safe:animate-wiggle absolute -top-1 -right-1 h-6 w-6" />
    <IoStar className="text-blue absolute top-1 -left-3 h-4 w-4 rotate-12 motion-safe:animate-bounce" />
    <span className="bg-pink absolute -bottom-0.5 -left-1 h-2.5 w-2.5 rounded-full motion-safe:animate-bounce motion-safe:[animation-delay:300ms]" />
    <span className="bg-green absolute -right-3 bottom-3 h-2 w-2 rotate-45 rounded-[2px] motion-safe:animate-pulse" />
    <span className="bg-purple-light absolute -top-2 left-5 h-1.5 w-3 -rotate-12 rounded-full motion-safe:animate-bounce motion-safe:[animation-delay:600ms]" />
  </div>
);
