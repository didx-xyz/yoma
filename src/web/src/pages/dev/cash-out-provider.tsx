import type { GetStaticProps } from "next";
import Head from "next/head";

/**
 * ⚠️⚠️ **TEMPORARY DEV AID — DELETE THIS FILE WITH `dev/cash-out.tsx` BEFORE MERGING.** ⚠️⚠️
 *
 * A stand-in for the hosted journey, so the iframe has something plausible in it while the real one
 * is unreachable (its sign-in step refuses to be framed, and verification rejects Yoma's gender
 * values). It exists to size and frame the *container* — nothing here is a mock of the provider's
 * actual screens, and no provider is named, in keeping with the epic's neutrality rule.
 *
 * It is deliberately a little taller than the frame so scrolling inside the frame can be checked.
 *
 * NB: Yoma's own navbar and consent banner appear inside the frame, because `_app` renders both
 * outside `getLayout` and a page cannot opt out of them. Ignorable — this is a placeholder for
 * sizing the frame, not a mock of anyone's screens. Pick "blank" in the frame-source dropdown to
 * see the empty frame on its own.
 */

// ⚠️ TEMPORARY — part of the dev aid.
export const getStaticProps: GetStaticProps = async () => {
  if (process.env.NODE_ENV === "production") return { notFound: true };
  return { props: {} };
};

const STEPS = ["Sign in", "Verify", "Account", "Sending", "Paid"];

export default function CashOutProviderStandIn() {
  return (
    <>
      <Head>
        <title>Dev · hosted journey stand-in</title>
      </Head>

      <div className="flex min-h-[140vh] flex-col bg-white text-black">
        <header className="bg-purple flex flex-row items-center justify-between px-6 py-4 text-white">
          <span className="font-bold">Secure cash out</span>
          <span className="bg-purple-tint text-purple flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
            TT
          </span>
        </header>

        <ol className="border-gray flex flex-row justify-between border-b px-6 py-3 text-[11px] font-semibold tracking-wide uppercase">
          {STEPS.map((step, index) => (
            <li
              key={step}
              className={index === 0 ? "text-green" : "text-gray-dark"}
            >
              {step}
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-4 p-6">
          <p className="text-3xl font-bold">
            $2.22 <span className="text-sm font-normal">ready to cash out</span>
          </p>
          <p className="text-gray-dark text-sm leading-6">
            This is a stand-in for the hosted journey, used only to design the
            frame around it. Sign in, identity checks and payment details all
            happen on the partner&apos;s own pages.
          </p>

          <div className="border-gray flex flex-col gap-3 rounded-lg border p-4">
            <label className="flex flex-col gap-1 text-sm">
              Email
              <input
                className="border-gray rounded-lg border px-3 py-2"
                placeholder="you@example.com"
              />
            </label>
            <button
              type="button"
              className="btn bg-purple hover:bg-purple rounded-full text-white normal-case hover:text-white"
            >
              Continue
            </button>
          </div>

          <p className="text-gray-dark text-xs">
            Scroll — this page is taller than the frame on purpose, so the
            frame&apos;s own scrolling can be checked.
          </p>
        </div>
      </div>
    </>
  );
}
