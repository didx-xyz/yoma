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
import iconZltoCircle from "public/images/icon-zlto-rounded.webp";
import { ZltoModal } from "../Modals/ZltoModal";
import { ethers } from "ethers";
import { formatEther, formatUnits } from "ethers/lib/utils";
import { ADDRESS_FROM, ADDRESS_TOKEN } from "~/lib/constants";

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

  //* Meta Mask
  const [provider, setProvider] = useState<any>(null);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  // initialize MetaMask
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);

      window.ethereum
        .request({ method: "eth_requestAccounts" })
        .then((accounts) => {
          setAccount(accounts[0]);
          fetchBalance(provider, accounts[0]);
        })
        .catch((err) => {
          setError(err);
        });

      window.ethereum.on("accountsChanged", (accounts) => {
        setAccount(accounts[0]);
        fetchBalance(provider, accounts[0]);
      });
    } else {
      setError("MetaMask is not installed");
    }
  }, []);

  async function fetchBalance(provider: any, account: any) {
    // You can also use an ENS name for the contract address
    const daiAddress = ADDRESS_TOKEN;

    // The ERC-20 Contract ABI, which is a common contract interface
    // for tokens (this is the Human-Readable ABI format)
    const daiAbi = [
      // Some details about the token
      "function name() view returns (string)",
      "function symbol() view returns (string)",

      // Get the account balance
      "function balanceOf(address) view returns (uint)",

      // Send some of your tokens to someone else
      "function transfer(address to, uint amount)",

      // An event triggered whenever anyone transfers to someone else
      "event Transfer(address indexed from, address indexed to, uint amount)",
    ];

    // The Contract object
    const daiContract = new ethers.Contract(daiAddress, daiAbi, provider);

    const balance = await daiContract.balanceOf(ADDRESS_FROM);

    setBalance(formatUnits(balance, 18));

    // const balance = await provider.getBalance(account);
    // const ethersBalance = formatEther(balance);
    // setBalance(ethersBalance);
  }

  return (
    <MainLayout>
      <>
        <Head>
          <title>Yoma | Marketplace</title>
        </Head>

        <PageBackground />

        {/* WHAT IS ZLTO DIALOG */}
        <ZltoModal
          isOpen={whatIsZltoDialogVisible}
          onClose={() => setWhatIsZltoDialogVisible(false)}
        />

        <div className="container z-10 mt-24 py-4">
          {/* SIGN IN TO SEE YOUR ZLTO BALANCE */}
          {!userProfile && (
            <div className="mb-8 flex h-36 flex-col items-center justify-center gap-4 text-white">
              <div className="flex flex-row items-center justify-center">
                <h5 className="flex-grow text-center tracking-widest">
                  Sign in to see your YOT balance
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
                  What is YOT?
                </button>

                <SignInButton className="btn rounded-full border-2 border-blue-dark brightness-110" />
              </div>
            </div>
          )}

          {/* ZLTO BALANCE CARD */}
          {userProfile && (
            <div className="mb-8 flex h-36 flex-col items-center justify-center gap-4 text-white">
              <div>
                <div className="flex flex-row items-center justify-center">
                  <h5 className="mb-2 flex-grow text-center tracking-widest">
                    My YOT balance
                  </h5>
                </div>
                <div className="flex flex-row gap-2">
                  <div className="flex flex-col items-center justify-center">
                    <Image
                      src={iconZltoWhite}
                      alt="Zlto Logo"
                      width={70}
                      height={70}
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
                      <p className="w-28 text-xs uppercase tracking-widest">
                        Processing:
                      </p>

                      <div className="flex items-center text-xs font-bold text-white">
                        <Image
                          src={iconZltoCircle}
                          className="mr-2"
                          alt="ZLTO"
                          width={20}
                          height={20}
                        />
                        {processing ?? "Loading..."}
                      </div>
                    </div>

                    <div className="flex flex-row items-center gap-2">
                      <p className="w-28 text-xs uppercase tracking-widest">
                        Available:
                      </p>

                      <div className="flex items-center text-xs font-bold text-white">
                        <Image
                          src={iconZltoCircle}
                          className="mr-2"
                          alt="ZLTO"
                          width={20}
                          height={20}
                        />
                        {/* {available ?? "Loading..."} */}
                        {balance ?? "Loading..."}
                      </div>
                    </div>

                    <div className="flex flex-row items-center gap-2">
                      <p className="w-28 text-xs uppercase tracking-widest">
                        Total:
                      </p>
                      <div className="flex items-center text-xs font-bold text-white">
                        <Image
                          src={iconZltoCircle}
                          className="mr-2"
                          alt="ZLTO"
                          width={20}
                          height={20}
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
                  className="btn rounded-full border-2 border-blue-dark brightness-110"
                  onClick={() => {
                    setWhatIsZltoDialogVisible(true);
                  }}
                >
                  What is YOT?
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
          <div className="flex-growx mt-20 flex items-center justify-center p-4">
            {children}
          </div>
        </div>
      </>
    </MainLayout>
  );
};

export default MarketplaceLayout;
