/**
 * The top bar's loading bone: the bar's own text colour at 20%, so it reads on every page theme
 * (white on purple/green/blue/orange, black on white) — discovery's hero bone, generalised.
 * daisyUI's `skeleton` shimmers; under reduced motion it holds still.
 */
export const NAV_BONE_CLASS =
  "skeleton bg-current/20 motion-reduce:animate-none";

/**
 * Holds the user menu's 44 px avatar while a signed-in youth's profile loads, so the bar doesn't
 * jump when the avatar arrives.
 */
export const AvatarBone: React.FC = () => (
  <span
    aria-hidden
    className={`block h-11 w-11 shrink-0 rounded-full ${NAV_BONE_CLASS}`}
  />
);
