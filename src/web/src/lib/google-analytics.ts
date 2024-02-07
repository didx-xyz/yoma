import ReactGA from "react-ga4";
import { env } from "~/env.mjs";

const initializeGA = (): void => {
  if (env.NEXT_PUBLIC_GA_MEASUREMENT_ID)
    ReactGA.initialize(env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
  // TODO:on't forget to remove the console.log() statements
  // when you are done
  console.log("GA INITIALIZED");
};

const trackGAEvent = (
  category: string,
  action: string,
  label: string,
): void => {
  console.log("GA event:", category, ":", action, ":", label);
  // Send GA4 Event
  ReactGA.event({
    category: category,
    action: action,
    label: label,
  });
};

export default initializeGA;
export { initializeGA, trackGAEvent };
