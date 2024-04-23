import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, type ReactElement, useState } from "react";
import MainLayout from "./Main";
import { PageBackground } from "../PageBackground";
import Image from "next/image";
import { userProfileAtom } from "~/lib/store";
import { useAtom } from "jotai";
import { IoMdArrowForward } from "react-icons/io";
import { toBase64, shimmer } from "~/lib/image";
import iconZlto from "public/images/icon-zlto-rounded.webp";
import iconZltoColor from "public/images/icon-zlto-rounded-color.webp";
import iconCheckmark from "public/images/icon-checkmark.png";
import iconTools from "public/images/icon-tools.png";
import iconCredential from "public/images/icon-credential.png";
import iconCog from "public/images/icon-cog.webp";
import type { TabItem } from "~/api/models/common";
import Head from "next/head";
import { AvatarImage } from "../AvatarImage";
import { IoIosInformationCircleOutline } from "react-icons/io";
import { ZltoModal } from "../Modals/ZltoModal";
import stamps from "public/images/stamps.svg";
import { ethers } from "ethers";
import { formatEther } from "ethers/lib/utils";

//*
interface EthereumProvider {
  request: (request: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, listener: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum: EthereumProvider;
  }
}
//*

export type TabProps = ({
  children,
}: {
  children: ReactElement;
}) => ReactElement;

const YoIDTabbedLayout: TabProps = ({ children }) => {
  const router = useRouter();
  const [userProfile] = useAtom(userProfileAtom);
  const [tabItems, setTabItems] = useState<TabItem[]>([]);
  const [zltoModalVisible, setZltoModalVisible] = useState(false);

  // 🔔 dropdown navigation change event
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(e.target.value);
  };

  // set the tab items based on the current route
  useEffect(() => {
    setTabItems([
      {
        title: "Opportunities",
        description: "Completed, pending & saved",
        url: "/yoid/opportunities/completed",
        badgeCount: null,
        selected: router.asPath.startsWith("/yoid/opportunities"),
        iconImage: iconCheckmark,
      },
      {
        title: "My Skills",
        description: "Skills gained through opportunities",
        url: "/yoid/skills",
        badgeCount: null,
        selected: router.asPath.startsWith("/yoid/skills"),
        iconImage: iconTools,
      },
      {
        title: "Passport",
        description: "Digital credentials",
        url: "/yoid/credentials",
        badgeCount: null,
        selected: router.asPath.startsWith("/yoid/credentials"),
        iconImage: iconCredential,
      },
      {
        title: "User Settings",
        description: "My personal data",
        url: "/yoid/settings",
        badgeCount: null,
        selected: router.asPath.startsWith("/yoid/settings"),
        iconImage: iconCog,
      },
      // {
      //   title: "Open Digital CV",
      //   description: "My opportunities submitted for verification",
      //   url: "/yoid/cv",
      //   badgeCount: null,
      //   selected: router.asPath.startsWith("/yoid/cv"),
      //   iconImage: iconShare,
      // },
    ]);
  }, [router.asPath, setTabItems]);

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
    const balance = await provider.getBalance(account);
    const ethersBalance = formatEther(balance);
    setBalance(ethersBalance);
  }

  return (
    <MainLayout>
      <>
        <Head>
          <title>Yoma | YoID</title>
        </Head>

        <PageBackground className="h-[23rem]" />

        <ZltoModal
          isOpen={zltoModalVisible}
          onClose={() => setZltoModalVisible(false)}
        />

        <div className="container relative z-10 mt-24 py-4">
          {/* USER CARD */}
          <div className="flex items-center justify-center">
            <Image
              src={stamps}
              alt="Stamps"
              height={400}
              width={700}
              sizes="100vw"
              priority={true}
              className="absolute z-0 hidden opacity-25 brightness-200 grayscale md:top-10 md:block"
            />
            <div className="group relative mx-4 flex h-[220px] w-full flex-col items-center justify-center rounded-lg bg-orange shadow-lg before:absolute before:left-0 before:top-0 before:-z-10 before:h-[220px] before:w-full before:rotate-[3deg] before:rounded-lg before:bg-orange before:brightness-75 before:transition-transform before:duration-300 before:ease-linear before:content-[''] md:mx-0 md:h-[200px] md:w-[410px] md:before:h-[200px] md:before:w-[410px] md:hover:before:rotate-0">
              <div className="grid w-full grid-cols-3 gap-4 p-2 md:grid-cols-4 md:p-6">
                <div className="col-span-1 mx-auto my-auto scale-95 md:scale-100">
                  <AvatarImage
                    icon={userProfile?.photoURL ?? null}
                    alt="User Logo"
                    size={85}
                  />
                </div>
                <div className="col-span-2 -ml-2 flex flex-col items-start md:col-span-3 md:ml-0 md:items-stretch">
                  <div className="flex flex-grow flex-col">
                    <div className="flex flex-row items-center justify-between">
                      <p className="flex-grow text-left text-xs !tracking-[.25em] text-[#FFD69C]">
                        MY YoID
                      </p>
                      <Link href="/yoid/credentials">
                        <IoMdArrowForward className="h-8 w-8 cursor-pointer rounded-full p-1 text-white transition-all duration-500 ease-in hover:shadow group-hover:scale-105 group-hover:bg-orange-light group-hover:text-orange md:h-6 md:w-6" />
                      </Link>
                    </div>

                    <h5 className="text-xl tracking-wide text-white">
                      Welcome, {userProfile?.firstName}
                    </h5>

                    {/* ZLTO Balances */}
                    <div className="mt-2 flex flex-col gap-2 text-white">
                      <div className="flex flex-col gap-1 border-y-2 border-dotted border-[#FFD69C] py-px md:py-2">
                        <div className="flex flex-row items-center">
                          <p className="w-28 text-xs tracking-widest">
                            Available:
                          </p>

                          <div className="flex items-center text-xs font-semibold text-white">
                            <Image
                              src={iconZlto}
                              className="mr-2"
                              alt="ZLTO"
                              width={18}
                              height={18}
                            />
                            {/* {available ?? "Loading..."} */}
                            {balance ?? "Loading..."}
                          </div>
                        </div>
                        <div className="flex flex-row items-center">
                          <p className="w-28 text-xs tracking-widest">
                            Processing:
                          </p>

                          <div className="flex items-center text-xs font-semibold text-white">
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
                      </div>

                      <div className="relative flex flex-row items-center">
                        <p className="w-28 text-xs tracking-widest">Total:</p>
                        <div className="badge -ml-2 !rounded-full bg-white px-2 py-2 text-xs !font-semibold text-black">
                          <Image
                            src={iconZltoColor}
                            className="mr-2"
                            alt="ZLTO"
                            width={18}
                            height={18}
                          />
                          {total ?? "Loading..."}
                        </div>
                        <span
                          className="btn absolute left-10 border-none p-0 shadow-none hover:scale-110 md:left-auto md:right-0"
                          onClick={() => setZltoModalVisible(true)}
                        >
                          <IoIosInformationCircleOutline className="h-6 w-6 transform-gpu duration-500 ease-linear group-hover:scale-110 md:h-5 md:w-5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-[5rem] flex flex-col gap-5 md:flex-row">
            {/* TABBED NAVIGATION: MEDIUM DISPLAY */}
            <div className="hidden md:block">
              <ul className="menu w-64 gap-2 rounded-lg bg-gray-light">
                {/* TABS */}
                {tabItems.map((tabItem, index) => (
                  <li key={`MenuNavigation_${index}`}>
                    <Link
                      href={tabItem.url}
                      key={index}
                      className={`hover:bg-gray ${
                        tabItem.selected ? "bg-gray" : "bg-gray-light"
                      }`}
                    >
                      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full shadow">
                        <Image
                          src={tabItem.iconImage}
                          alt={`${tabItem.title} icon`}
                          width={20}
                          height={20}
                          sizes="(max-width: 20px) 30vw, 50vw"
                          priority={true}
                          placeholder="blur"
                          blurDataURL={`data:image/svg+xml;base64,${toBase64(
                            shimmer(20, 20),
                          )}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            maxWidth: "20px",
                            maxHeight: "20px",
                          }}
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="text-sm font-bold uppercase tracking-widest">
                          {tabItem.title}
                        </div>
                        <div className="text-xs text-gray-dark">
                          {tabItem.description}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex flex-grow flex-col">
              {/* DROPDOWN NAVIGATION: SMALL DISPLAY */}
              <div className="visible flex w-full items-center justify-center px-4 pb-4 md:hidden">
                <select
                  className="select w-full"
                  onChange={handleChange}
                  value={router.asPath}
                  title="Select a page"
                >
                  {tabItems.map((tabItem, index) => (
                    <option
                      value={tabItem.url}
                      key={`DropdownNavigation_${index}`}
                    >
                      {tabItem.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* CHILDREN */}
              <div className="flex items-center justify-center">{children}</div>
            </div>
          </div>
        </div>
      </>
    </MainLayout>
  );
};

export default YoIDTabbedLayout;
