import Link from "next/link";
import { useState, type ReactElement, useEffect } from "react";
import MainLayout from "./Main";
import { PageBackground } from "../PageBackground";
import Image from "next/image";
import { userProfileAtom } from "~/lib/store";
import { useAtom } from "jotai";
import { toBase64, shimmer } from "~/lib/image";
import Head from "next/head";
import iconZltoWhite from "public/images/icon-zlto-white.svg";
import iconZltoCircle from "public/images/icon-zlto-rounded.webp";
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

  const [processing, setProcessing] = useState("");
  const [available, setAvailable] = useState("");
  const [total, setTotal] = useState("");

  useEffect(() => {
    if (userProfile?.zlto) {
      if (userProfile.zlto.zltoOffline) {
        setProcessing(userProfile.zlto.pending.toLocaleString());
        setAvailable("Unable to retrieve value");
        setTotal(userProfile.zlto.total.toLocaleString());
      } else {
        setProcessing(userProfile.zlto.pending.toLocaleString());
        setAvailable(userProfile.zlto.available.toLocaleString());
        setTotal(userProfile.zlto.total.toLocaleString());
      }
    }
  }, [userProfile]);

  return (
    <MainLayout>
      <>
        <Head>
          <title>Yoma | 🛒 Marketplace</title>
        </Head>

        <PageBackground />

        {/* WHAT IS ZLTO DIALOG */}
        <ZltoModal
          isOpen={whatIsZltoDialogVisible}
          onClose={() => setWhatIsZltoDialogVisible(false)}
        />

        <div className="z-10 container mt-24 py-4">
          {/* SIGN IN TO SEE YOUR ZLTO BALANCE */}
          {!userProfile && (
            <div className="mb-8 flex h-36 flex-col items-center justify-center gap-4 text-white">
              <div className="flex flex-row items-center justify-center">
                <h5 className="grow text-center tracking-widest">
                  Sign in to see your Zlto balance
                </h5>
              </div>
              <div className="flex flex-row gap-2">
                <div className="flex">
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
                </div>
                <div className="flex grow flex-col justify-center">
                  <h1>0</h1>
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

                <SignInButton className="btn !border-blue-dark rounded-full !border-2 !border-solid !bg-transparent brightness-110 hover:!border-white hover:!brightness-100" />
              </div>
            </div>
          )}

          {/* ZLTO BALANCE CARD */}
          {userProfile && (
            <div className="mb-8 flex h-36 flex-col items-center justify-center gap-4 text-white">
              <div>
                <div className="flex flex-row items-center justify-center">
                  <h5 className="mb-2 grow text-center tracking-widest">
                    My Zlto balance
                  </h5>
                </div>
                <div className="flex flex-row gap-2">
                  <div className="flex flex-col items-center justify-center">
                    <Image
                      src={iconZltoWhite}
                      alt="Zlto Logo"
                      width={70}
                      className="h-auto"
                      sizes="(max-width: 60px) 30vw, 50vw"
                      priority={true}
                      placeholder="blur"
                      blurDataURL={`data:image/svg+xml;base64,${toBase64(
                        shimmer(44, 44),
                      )}`}
                    />
                  </div>
                  {/* ZLTO Balances */}
                  <div className="flex flex-col items-start justify-center gap-1 border-y-2 border-dotted border-white py-1">
                    <div className="flex flex-row items-center gap-2">
                      <p className="w-28 text-xs tracking-widest uppercase">
                        Processing:
                      </p>

                      <div className="flex items-center text-xs font-bold text-white">
                        <Image
                          src={iconZltoCircle}
                          alt="ZLTO"
                          width={20}
                          className="mr-2 h-auto"
                        />
                        {processing ?? "Loading..."}
                      </div>
                    </div>

                    <div className="flex flex-row items-center gap-2">
                      <p className="w-28 text-xs tracking-widest uppercase">
                        Available:
                      </p>

                      <div className="flex items-center text-xs font-bold text-white">
                        <Image
                          src={iconZltoCircle}
                          alt="ZLTO"
                          width={20}
                          className="mr-2 h-auto"
                        />
                        {available ?? "Loading..."}
                      </div>
                    </div>

                    <div className="flex flex-row items-center gap-2">
                      <p className="w-28 text-xs tracking-widest uppercase">
                        Total:
                      </p>
                      <div className="flex items-center text-xs font-bold text-white">
                        <Image
                          src={iconZltoCircle}
                          alt="ZLTO"
                          width={20}
                          className="mr-2 h-auto"
                        />
                        {total ?? "Loading..."}
                      </div>
                    </div>
                  </div>
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
              </div>
            </div>
          )}

          {/* MAIN CONTENT */}
          <div className="growx mt-20 flex items-center justify-center p-4">
            {children}
          </div>
        </div>
      </>
    </MainLayout>
  );
};

export default MarketplaceLayout;
