/**
 * The loading bone for the purple hero's white pills (quick searches, the Saved link, the
 * category pills): translucent white on purple, where the results' grey bone (`SKELETON_BONE_CLASS`)
 * would read as a dark smudge. Each placeholder takes its real pill's size, so the hero is as
 * tall on first paint as once the lookups and the profile arrive (Jason, 2026-10-22: the page
 * below jumped as they did). daisyUI's `skeleton` shimmers; under reduced motion it holds still.
 */
export const HERO_BONE_CLASS =
  "skeleton bg-white/20 motion-reduce:animate-none";
