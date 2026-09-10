import Link from "next/link";
import { useState, type ReactElement } from "react";
import MainLayout from "./Main";
import { PageBackground } from "../PageBackground";
import Image from "next/image";
import { userProfileAtom } from "~/lib/store";
import { useAtom } from "jotai";
import { toBase64, shimmer } from "~/lib/image";
import Head from "next/head";
import iconZltoWhite from "public/images/icon-zlto-white.svg";
import { CashOutEntry } from "../Payout/CashOutEntry";
import { ZltoLedger } from "../Rewards/ZltoLedger";
import { ZltoModal } from "../YoID/ZltoModal";
import { SignInButton } from "../SignInButton";

export type TabProps = ({
  children,
}: {
  children: ReactElement;
}) => ReactElement;

const MarketplaceLayout: TabProps = ({ children }) => {
  const [whatIsZltoDialogVisible, setWhatIsZltoDialogVisible] = useState(false);
  const [userProfile] = useAtom(userProfileAtom);

  return (
    <MainLayout>
      <>
        <Head>
          <title>Yoma | 🛒 Marketplace</title>
        </Head>

        {/* WHAT IS ZLTO DIALOG */}
        <ZltoModal
          isOpen={whatIsZltoDialogVisible}
          onClose={() => setWhatIsZltoDialogVisible(false)}
        />

        <div className="flex w-full flex-col">
          {/*
            HERO — the blue band *is* this section, in normal flow, so its height is the hero's
            height. Previously the band was an absolutely positioned `h-80` behind the page, which
            meant its 320px and the hero's actual height were two independent numbers: the balance
            ledger grows and shrinks with the wallet's state, so the two could not be kept in step
            and the results grid ended up straddling the boundary. Now the band ends where the
            hero ends and everything after it is on the page background.

            `pt-20` rather than a margin: the navbar is fixed over the top of the page, so the blue
            has to run behind it while the hero content starts below it.
          */}
          <PageBackground className="px-4 pt-24 pb-6">
            {/*
              One box, reserved height, both states centred inside it. The two branches have
              different natural heights and swap the moment the profile atom hydrates, which
              shifted the whole page down on every load. A cash-out in flight is the one state that
              outgrows the reservation — it adds two ledger rows — and that is a deliberate trade
              for not padding the common case out to the tallest possible one.
            */}
            <div className="flex min-h-[168px] flex-col items-center justify-center gap-4 text-white">
              {/* LOG IN TO SEE YOUR ZLTO BALANCE */}
              {!userProfile && (
                <>
                  <div className="flex flex-row items-center justify-center">
                    <h5 className="grow text-center tracking-widest">
                      Log in to see your Zlto balance
                    </h5>
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    <Image
                      src={iconZltoWhite}
                      alt="Zlto Logo"
                      width={60}
                      className="h-auto"
                      sizes="(max-width: 60px) 30vw, 50vw"
                      priority={true}
                      placeholder="blur"
                      blurDataURL={`data:image/svg+xml;base64,${toBase64(
                        shimmer(44, 44),
                      )}`}
                    />
                    <h1>0</h1>
                  </div>

                  <div className="flex flex-row gap-4">
                    <button
                      type="button"
                      className="btn !border-blue-dark rounded-full !border-2 !border-solid !bg-transparent text-white shadow-none brightness-110 hover:!border-white hover:!brightness-100"
                      onClick={() => {
                        setWhatIsZltoDialogVisible(true);
                      }}
                    >
                      What is Zlto?
                    </button>

                    <SignInButton className="btn !border-blue-dark rounded-full !border-2 !border-solid !bg-transparent brightness-110 hover:!border-white hover:!brightness-100" />
                  </div>
                </>
              )}

              {/* ZLTO BALANCE CARD */}
              {userProfile && (
                <>
                  <div className="flex flex-col items-center gap-2">
                    <h5 className="text-center tracking-widest">
                      My Zlto balance
                    </h5>

                    <div className="flex flex-row items-center gap-3">
                      <Image
                        src={iconZltoWhite}
                        alt="Zlto Logo"
                        width={56}
                        className="h-auto"
                        sizes="(max-width: 60px) 30vw, 50vw"
                        priority={true}
                        placeholder="blur"
                        blurDataURL={`data:image/svg+xml;base64,${toBase64(
                          shimmer(44, 44),
                        )}`}
                      />

                      {/*
                      The hero used to show three figures and deliberately hid `pendingPayout`, on
                      the grounds that the header was "about what can be spent". That reasoning does
                      not survive cash-out: ZLTO reserved for a payout leaves `available`
                      immediately, so hiding the reservation made the balance look like it had
                      simply dropped. Both surfaces now render the same ledger.

                      Guarded despite the type saying otherwise — a profile-payload rename has taken
                      this component down at runtime before (see the epic's Cross-Area Notes).
                    */}
                      {userProfile.zlto && (
                        <ZltoLedger zlto={userProfile.zlto} variant="compact" />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row gap-4">
                    <button
                      type="button"
                      className="btn !border-blue-dark rounded-full !border-2 !border-solid !bg-transparent text-white brightness-110 hover:!border-white hover:!brightness-100"
                      onClick={() => {
                        setWhatIsZltoDialogVisible(true);
                      }}
                    >
                      What is Zlto?
                    </button>

                    <Link
                      href="/yoid/wallet"
                      className="btn !border-blue-dark rounded-full !border-2 !border-solid !bg-transparent text-white brightness-110 hover:!border-white hover:!brightness-100"
                    >
                      My vouchers
                    </Link>

                    {/*
                      The Cash Out entry point. `CashOutEntry` is the single implementation —
                      label, disabled state, gate, amount, review and hand-off all live in it, and
                      this surface passes nothing but the variant, so the Yo-ID wallet card cannot
                      drift from it.

                      It sits in this pill row rather than in the ledger's `actions` slot because
                      that is where the board puts it (A1/A4): the slot renders inside the ledger's
                      own column, which the 56px coin offsets from the hero's centre, and it would
                      separate the primary action from the two pills it belongs beside.
                    */}
                    {userProfile.zlto && (
                      <CashOutEntry profile={userProfile} variant="compact" />
                    )}
                  </div>
                </>
              )}
            </div>
          </PageBackground>

          {/* MAIN CONTENT — outside the band, on the page background */}
          <div className="container mx-auto flex items-center justify-center px-4 py-6">
            {children}
          </div>
        </div>
      </>
    </MainLayout>
  );
};

export default MarketplaceLayout;
