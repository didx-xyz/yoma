import ReactGA from "react-ga4";
import { fetchClientEnv } from "~/lib/utils";

const initializeGA = (): void => {
  fetchClientEnv().then((env) => {
    if (env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      ReactGA.initialize(env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
    }
  });
};

const trackGAEvent = (
  category: string,
  action: string,
  label: string,
): void => {
  ReactGA.event({
    category: category,
    action: action,
    label: label,
  });
};

export default initializeGA;
export { initializeGA, trackGAEvent };
