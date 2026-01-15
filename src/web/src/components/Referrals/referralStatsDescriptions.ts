export const getTotalReferralsDesc = (value: number) => {
  if (value <= 0) return "No referrals yet — share your link to get started.";
  if (value === 1) return "Well done! You got your first referral.";
  if (value < 5) return "Nice start — keep sharing your link.";
  if (value < 10) return "Awesome work! Your network is growing.";
  if (value < 25) return "You're on fire — keep the momentum going.";
  if (value < 50) return "Referral machine — serious momentum.";
  return "Legend status — referrals and counting.";
};

export const getCompletedDesc = (value: number) => {
  if (value <= 0) return "No completions yet — keep sharing your links.";
  if (value === 1) return "First completion unlocked — great start!";
  if (value < 5) return "Solid progress — more wins incoming.";
  if (value < 10) return "Awesome — your referrals are completing.";
  if (value < 25) return "You're crushing it — keep it up.";
  return "Elite performance — big results.";
};

export const getPendingDesc = (value: number) => {
  if (value <= 0) return "No pending referrals right now.";
  if (value === 1) return "1 referral in progress — follow up to help.";
  if (value < 5) return "A few in progress — check in with them.";
  if (value < 10) return "Great pipeline — lots in progress.";
  return "Big pipeline — keep supporting them to completion.";
};

export const getZltoDesc = (value: number) => {
  if (value <= 0) return "Start earning by sharing your link.";
  if (value < 25) return "ZLTO rolling in — keep it going.";
  if (value < 100) return "Great earning pace — nice work.";
  if (value < 250) return "You're stacking rewards fast.";
  return "Big rewards — you're on a roll.";
};
