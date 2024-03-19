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
import { SignInButton } from "../NavBar/SignInButton";
import { IoMdClose } from "react-icons/io";
import ReactModal from "react-modal";
import iconZlto from "public/images/icon-zlto.svg";

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
          <title>Yoma | Marketplace</title>
        </Head>

        <PageBackground />

        {/* WHAT IS ZLTO DIALOG */}
        <ReactModal
          isOpen={whatIsZltoDialogVisible}
          shouldCloseOnOverlayClick={false}
          onRequestClose={() => {
            setWhatIsZltoDialogVisible(false);
          }}
          className={`fixed bottom-0 left-0 right-0 top-0 flex-grow overflow-hidden bg-white animate-in fade-in md:m-auto md:max-h-[450px] md:max-w-[600px] md:rounded-3xl`}
          portalClassName={"fixed z-40"}
          overlayClassName="fixed inset-0 bg-overlay"
        >
          <div className="flex h-full flex-col gap-2 overflow-y-auto pb-12">
            <div className="flex flex-row p-4">
              <h1 className="flex-grow"></h1>
              <button
                type="button"
                className="btn rounded-full border-0 bg-gray-light p-3 text-gray-dark hover:bg-gray"
                onClick={() => {
                  setWhatIsZltoDialogVisible(false);
                }}
              >
                <IoMdClose className="h-6 w-6"></IoMdClose>
              </button>
            </div>
            <div className="flex flex-col items-center justify-center gap-4 p-4 md:p-0">
              <div className="-mt-8 flex h-14 w-14 items-center justify-center rounded-full border-green-dark bg-white shadow-lg">
                <Image
                  src={iconZlto}
                  alt="Icon Zlto"
                  width={40}
                  height={40}
                  sizes="100vw"
                  priority={true}
                  style={{ width: "40px", height: "40px" }}
                />
              </div>
              <h3>What is Zlto?</h3>
              <p className="rounded-lg bg-gray-light p-4 text-center md:w-[450px]">
                Introducing Zlto, Yoma&apos;s fantastic reward system. Earn Zlto
                by completing tasks and opportunities. Redeem your well-deserved
                rewards in the marketplace and enjoy the amazing benefits that
                await you!
              </p>

              <div className="mt-4 flex w-full flex-grow justify-center gap-4">
                <button
                  type="button"
                  className="btn w-3/4 max-w-[300px] rounded-full border-purple bg-white normal-case text-purple hover:bg-purple hover:text-white"
                  onClick={() => {
                    setWhatIsZltoDialogVisible(false);
                  }}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </ReactModal>

        <div className="container z-10 mt-24 py-4">
          {/* SIGN IN TO SEE YOUR ZLTO BALANCE */}
          {!userProfile && (
            <div className="mb-8 flex h-36 flex-col items-center justify-center gap-4 text-white">
              <div className="flex flex-row items-center justify-center">
                <h5 className="flex-grow text-center tracking-widest">
                  Sign in to see your Zlto balance
                </h5>
              </div>
              <div className="flex flex-row gap-2">
                <div className="flex">
                  <Image
                    src={iconZltoWhite}
                    alt="Zlto Logo"
                    width={60}
                    height={60}
                    sizes="(max-width: 60px) 30vw, 50vw"
                    priority={true}
                    placeholder="blur"
                    blurDataURL={`data:image/svg+xml;base64,${toBase64(
                      shimmer(44, 44),
                    )}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      maxWidth: "60px",
                      maxHeight: "60px",
                    }}
                  />
                </div>
                <div className="flex flex-grow flex-col">
                  <h1>0</h1>
                </div>
              </div>
              <div className="flex flex-row gap-4">
                <button
                  type="button"
                  className="btn rounded-full border-2 border-blue-dark brightness-110"
                  onClick={() => {
                    setWhatIsZltoDialogVisible(true);
                  }}
                >
                  What is Zlto?
                </button>

                <SignInButton className="btn rounded-full border-2 border-blue-dark brightness-110" />
              </div>
            </div>
          )}

          {/* ZLTO BALANCE CARD */}
          {userProfile && (
            <div className="mb-8 flex h-36 flex-col items-center justify-center gap-4 text-white">
              <div className="flex flex-row items-center justify-center">
                <h5 className="flex-grow text-center tracking-widest">
                  My Zlto balance
                </h5>
              </div>
              <div className="flex flex-row gap-2">
                <div className="flex items-center">
                  <Image
                    src={iconZltoWhite}
                    alt="Zlto Logo"
                    width={60}
                    height={60}
                    sizes="(max-width: 60px) 30vw, 50vw"
                    priority={true}
                    placeholder="blur"
                    blurDataURL={`data:image/svg+xml;base64,${toBase64(
                      shimmer(44, 44),
                    )}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      maxWidth: "60px",
                      maxHeight: "60px",
                    }}
                  />
                </div>
                {/* ZLTO Balances */}
                <div className="mt-2 flex flex-col gap-1">
                  <div className="flex flex-row items-center gap-2">
                    <p className="w-28 text-xs uppercase tracking-widest">
                      Processing:
                    </p>

                    <div className="badge bg-gray-light py-2 text-xs font-bold text-black">
                      <Image
                        src={iconZlto}
                        className="mr-2"
                        alt="ZLTO"
                        width={18}
                        height={18}
                      />
                      {processing ?? "Loading..."}
                    </div>
                  </div>

                  <div className="flex flex-row items-center gap-2">
                    <p className="w-28 text-xs uppercase tracking-widest">
                      Available:
                    </p>

                    <div className="badge bg-gray-light py-2 text-xs font-bold text-black">
                      <Image
                        src={iconZlto}
                        className="mr-2"
                        alt="ZLTO"
                        width={18}
                        height={18}
                      />
                      {available ?? "Loading..."}
                    </div>
                  </div>

                  <div className="flex flex-row items-center gap-2">
                    <p className="w-28 text-xs uppercase tracking-widest">
                      Total:
                    </p>
                    <div className="badge bg-gray-light py-2 text-xs font-bold text-black">
                      <Image
                        src={iconZlto}
                        className="mr-2"
                        alt="ZLTO"
                        width={18}
                        height={18}
                      />
                      {total ?? "Loading..."}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-4">
                <button
                  type="button"
                  className="btn rounded-full border-2 border-blue-dark brightness-110"
                  onClick={() => {
                    setWhatIsZltoDialogVisible(true);
                  }}
                >
                  What is Zlto?
                </button>

                <Link
                  href="/marketplace/transactions"
                  className="btn rounded-full border-2 border-blue-dark brightness-110"
                >
                  My vouchers
                </Link>
              </div>
            </div>
          )}
          {/* MAIN CONTENT */}
          <div className="mt-20 flex flex-grow items-center justify-center p-4">
            {children}
          </div>
        </div>
      </>
    </MainLayout>
  );
};

export default MarketplaceLayout;
