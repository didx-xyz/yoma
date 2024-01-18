import Link from "next/link";
import { type ReactElement } from "react";
import MainLayout from "./Main";
import { PageBackground } from "../PageBackground";
import Image from "next/image";
import { userProfileAtom } from "~/lib/store";
import { useAtom } from "jotai";
import { toBase64, shimmer } from "~/lib/image";
import Head from "next/head";
import iconZltoWhite from "public/images/icon-zlto-white.svg";
import { SignInButton } from "../NavBar/SignInButton";

export type TabProps = ({
  children,
}: {
  children: ReactElement;
}) => ReactElement;

const MarketplaceLayout: TabProps = ({ children }) => {
  const [userProfile] = useAtom(userProfileAtom);

  return (
    <MainLayout>
      <>
        <Head>
          <title>Yoma | Marketplace</title>
        </Head>

        <PageBackground
          //smallHeight={true}
          height={16}
        />

        <div className="container z-10 py-4">
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
                {/* buttons: todo href */}
                <Link
                  href="/yoid/topup"
                  className="btn rounded-full border-2 border-blue-dark brightness-110"
                >
                  What is Zlto?
                </Link>

                {/* <Link
                  href="/yoid/topup"
                  className="btn rounded-full border-2 border-blue-dark brightness-110"
                >
                  Sign in
                </Link> */}
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
                  <h1>
                    {userProfile?.zltoBalance
                      ? userProfile.zltoBalance
                          .toLocaleString("en-US")
                          .replace(/,/g, " ")
                      : 0}
                  </h1>
                </div>
              </div>
              <div className="flex flex-row gap-4">
                {/* buttons: todo href */}
                <Link
                  href="/yoid/topup"
                  className="btn rounded-full border-2 border-blue-dark brightness-110"
                >
                  What is Zlto?
                </Link>

                <Link
                  href="/yoid/topup"
                  className="btn rounded-full border-2 border-blue-dark brightness-110"
                >
                  My vouchers
                </Link>
              </div>
            </div>
          )}

          {/* MAIN CONTENT */}
          <div className="flex flex-grow items-center justify-center p-4">
            {children}
          </div>
        </div>
      </>
    </MainLayout>
  );
};

export default MarketplaceLayout;
