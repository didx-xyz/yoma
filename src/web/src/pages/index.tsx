import { QueryClient, dehydrate } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { useState, type ReactElement, useCallback } from "react";
import "react-datepicker/dist/react-datepicker.css";
import MainLayout from "~/components/Layout/Main";
import { authOptions, type User } from "~/server/auth";
import { NextPageWithLayout } from "./_app";
import Link from "next/link";
import { config } from "~/lib/react-query-config";
import { PageBackground } from "~/components/PageBackground";
import { RoundedImage } from "~/components/RoundedImage";
import { THEME_ORANGE } from "~/lib/constants";
import Image from "next/image";

import imageWoman from "public/images/home/bg-woman.png";
import imageCardID from "public/images/home/card-id.png";
import imageLogoGoodwall from "public/images/home/logo-goodwall.png";
import imageLogoAppStore from "public/images/home/logo-appstore.png";
import imageLogoPlayStore from "public/images/home/logo-playstore.png";
import imageLogoYoma from "public/images/logo-dark.webp";
import imageLogoWhatsapp from "public/images/home/logo-whatsapp.png";
import imageLogoAtingi from "public/images/home/logo-atingi.png";
import imageLogoUCT from "public/images/home/logo-UCT.png";
import imageLogoCartedo from "public/images/home/logo-cartedo.png";
import imageImpact from "public/images/home/impact.png";
import imageThrive from "public/images/home/thrive.png";
import imageLogoZltoBig from "public/images/home/logo-zlto-big.png";
import iconGreenCheck from "public/images/home/icon-green-check.png";
import iconBlueUpload from "public/images/home/icon-blue-upload.png";
import iconOrangeZlto from "public/images/home/icon-orange-zlto.png";
import iconSap from "public/images/home/logo-sap.png";
import iconAccenture from "public/images/home/logo-accenture.png";
import iconUmuzi from "public/images/home/logo-umuzi.png";
import iconFoundationBotnar from "public/images/home/logo-foundation-botnar.png";
import iconRlabs from "public/images/home/logo-rlabs.png";
import iconGiz from "public/images/home/logo-giz.png";
import iconUnlimitedGeneration from "public/images/home/logo-unlimitedgeneration.png";
import iconDidx from "public/images/home/logo-didx.png";
import imageLogoDelta from "public/images/home/logo-delta.png";
import imageLogoJobberman from "public/images/home/logo-jobberman.png";
import iconUnicef from "public/images/home/logo-unicef.png";

import OpportunityCard from "~/components/Home/OpportunityCard";
import { IoMdCheckmark } from "react-icons/io";
import { SearchInputLarge } from "~/components/SearchInputLarge";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const queryClient = new QueryClient(config);
  const session = await getServerSession(context.req, context.res, authOptions);

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
    },
  };
}

const Home: NextPageWithLayout<{
  id: string;
  user: User;
}> = () => {
  const [email, setEmail] = useState("");

  const onSubscribe = useCallback(() => {
    alert("TODO: API - " + email);
  }, [email]);

  return (
    <>
      <PageBackground />

      <div className="z-10 mt-20 flex flex-grow flex-col items-center justify-center py-8">
        <div className="grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
          {/* LEFT: HEADERS AND TEXT */}
          <div className="flex flex-col text-white">
            <h6 className="text-xs uppercase tracking-wider">
              Welcome to Yoma
            </h6>
            <h1 className="text-3xl font-bold tracking-wide">
              A world of opportunities
            </h1>
            <p className="text-sm font-thin">
              Yoma is your friendly platform of trusted partners, bringing you
              the freshest opportunities to keep your skills sharp and stay in
              the loop with what's happening in the working world.
            </p>
          </div>

          {/* RIGHT: TWO CARDS AND WOMAN IMAGES */}
          <div className="relative h-96">
            <div className="z-0 opacity-70">
              <OpportunityCard
                title="Foundations of Food & Beverage Business"
                organisation="University of Cape Town"
                description="This self-paced course will introduce you to the world of Food and Beverage. You will learn about the various types of F&amp;B businesses, the importance of..."
                hours={4}
                ongoing={true}
                reward={11}
                students={1}
                image={imageLogoUCT}
                // width={250}
                // height={200}
              />
            </div>
            <div className="absolute left-24 top-28 z-10">
              <OpportunityCard
                title="A Career in Tourism"
                organisation="Atingi"
                description="This self-paced course will help you explore tourism as an industry and see the job opportunities it can offer."
                hours={4}
                ongoing={true}
                reward={11}
                students={1}
                image={imageLogoAtingi}
                // width={250}
                // height={200}
              />
            </div>
            <Image
              src={imageWoman}
              alt="Woman smiling"
              width={250}
              height={423}
              sizes="100vw"
              priority={true}
              style={{
                width: "240px",
                height: "280px",
                position: "absolute",
                top: -24,
                left: 280,
                zIndex: 0,
              }}
            />
          </div>
        </div>

        {/* CENTER: OUR MISSION HEADER AND PARAGRAPH */}
        <div className="mt-36x flex flex-col items-center">
          <h2 className="text-2xl font-semibold tracking-wide text-black">
            Our mission
          </h2>
          <p className="text-sm text-gray-dark">
            We&apos;re here to help you grow, make a positive difference, and
            thrive.
          </p>
        </div>

        {/* ROW OF 3 IMAGES */}
        <div className="my-10 grid max-w-5xl grid-cols-1 gap-4 lg:grid-cols-3">
          {/* CARTEDEO */}
          <div className="z-1 mx-auto max-w-[380px] rounded-xl bg-white shadow-lg">
            {/* GRADIENT CARD */}
            <div className="relative">
              <div className="absolute left-10 top-[-10px] mx-4 w-56 rounded-lg bg-gradient-to-b from-gray to-white p-4 shadow-xl">
                {/* CARTEDEO TITLE AND LOGO */}
                <div className="flex items-center justify-between">
                  <div className="w-full flex-grow">
                    <h2 className="notranslate text-sm font-semibold text-gray-dark">
                      Cartedo
                    </h2>
                    <p className="font-bold text-black">Design Thinking</p>
                  </div>
                  <RoundedImage
                    icon={imageLogoCartedo}
                    alt="Cartedo logo"
                    containerWidth={40}
                    containerHeight={40}
                    imageWidth={40}
                    imageHeight={40}
                  />
                </div>

                <span className="absolute -left-10 mt-4 inline-flex items-center rounded-md bg-green px-3 py-0.5 text-sm font-medium text-white">
                  <IoMdCheckmark className="mr-2 h-4 w-4 text-white" />
                  Verified
                </span>

                <p className="text-gray.dark ml-16 mt-12 text-xs">
                  2024-03-12 07:14:49
                </p>
              </div>
            </div>

            <div className="p-4">
              <h3 className="mt-32 font-semibold">Grow</h3>

              <p className="mt-2 text-gray-dark">
                Improve your skills through learning opportunities, and showcase
                them on Yoma to pursue your dreams.
              </p>
            </div>
          </div>

          <div className="z-1 relative mx-auto max-w-[380px] overflow-hidden rounded-xl bg-white shadow-lg">
            <Image
              src={imageImpact}
              layout="fill"
              objectFit="cover"
              alt="Background Image"
              className="z-0"
            />
            <div className="relative z-10 mt-32 p-8 text-white">
              <h3 className="font-semibold">Impact</h3>
              <p className="text-white">
                Make a difference in your community, and build your profile by
                participating in our impact tasks.
              </p>
            </div>
          </div>

          <div className="z-1 relative mx-auto max-w-[380px] rounded-xl bg-white shadow-lg">
            <div className="absolute left-0 top-[-40px]">
              <Image
                src={imageThrive}
                alt="People sitting at table"
                width={300}
                height={189}
                sizes="100vw"
                style={{ width: "300px", height: "189px" }}
              />
            </div>

            <div className="relative z-10 mt-32 p-8">
              <h3 className="font-semibold">Thrive</h3>
              <p className="text-gray-dark">
                Track your progress on Yoma YoID and unlock new skills by
                completing opportunities.
              </p>
            </div>
          </div>
        </div>

        {/* GREEN BACKGROUND */}
        <div className="mt-10 flex h-96 w-full items-center justify-center bg-green bg-[url('/images/world-map.png')] bg-fixed bg-[center_top_4rem] bg-no-repeat">
          <div className="mt-36 flex max-w-5xl flex-col">
            {/* ID CARD, LEARN MORE */}
            <div className="flex flex-col md:flex-row">
              {/* LEFT: ID CARD AND LEARN MORE BUTTON */}
              <div className="flex w-[448px] flex-col items-center">
                <Image
                  src={imageCardID}
                  alt="ID Card"
                  width={410}
                  height={215}
                  sizes="100vw"
                  priority={true}
                  style={{
                    width: "410px",
                    height: "215px",
                    zIndex: 1,
                  }}
                />

                {/* LEARN MORE BUTTON */}
                <Link
                  href="/about"
                  className="btn z-10 -ml-16 mt-4 w-[260px] rounded-xl border-none bg-purple normal-case text-white hover:bg-purple hover:text-white hover:brightness-110"
                >
                  Learn more
                </Link>
              </div>

              {/* RIGHT: HEADERS AND TEXT */}
              <div className="z-10 mt-40 flex w-[448px] flex-col gap-2 text-white">
                <h6 className="text-xs uppercase tracking-wider">Your YoID</h6>
                <h1 className="text-xl font-bold tracking-wide">
                  All connected with one profile
                </h1>
                <p>
                  YoID is your learning identity passport powered by Yoma, you
                  can simply login with YoID, and use one profile between all
                  apps.
                </p>
              </div>
            </div>

            {/* ROW OF 3 CARDS */}
            <div className="mt-16 grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* GOODWALL */}
              <div className="z-10 flex h-[270px] w-[298px] flex-col items-center gap-4 rounded-lg bg-white p-4 shadow">
                <Image
                  src={imageLogoGoodwall}
                  alt="Logo Goodwall"
                  width={170}
                  height={40}
                  sizes="100vw"
                  style={{
                    width: "170px",
                    height: "40px",
                    zIndex: 1,
                  }}
                />

                <h1 className="text-center text-base font-semibold">
                  Passionate about youth empowerment?
                </h1>
                <p className="flex-grow text-center text-sm text-gray-dark">
                  Collaborate with your community, find and complete
                  opportunities, win prizes!
                </p>
                <div className="flex flex-row gap-2">
                  <Image
                    src={imageLogoAppStore}
                    alt="Logo App Store"
                    width={100}
                    height={40}
                    sizes="120vw"
                    style={{
                      width: "120px",
                      height: "40px",
                      zIndex: 1,
                    }}
                  />
                  <Image
                    src={imageLogoPlayStore}
                    alt="Logo Play Store"
                    width={120}
                    height={40}
                    sizes="100vw"
                    style={{
                      width: "120px",
                      height: "40px",
                      zIndex: 1,
                    }}
                  />
                </div>
              </div>

              {/* YOMA */}
              <div className="z-10 flex h-[270px] w-[298px] flex-col items-center gap-4 rounded-lg bg-white p-4 shadow">
                <Image
                  src={imageLogoYoma}
                  alt="Logo Yoma"
                  width={120}
                  height={40}
                  sizes="100vw"
                  style={{
                    width: "120px",
                    height: "40px",
                    zIndex: 1,
                  }}
                />

                <h1 className="text-center text-base font-semibold">
                  Looking for a more simple experience?
                </h1>
                <p className="flex-grow text-center text-sm text-gray-dark">
                  Less features, less data. Find and complete opportunities, and
                  redeem for reward on the marketplace.
                </p>
                <div className="flex flex-row gap-2">
                  {/* CONTINUE BUTTON */}
                  <Link
                    href="/about"
                    className="btn z-10 w-[220px] border-none bg-purple normal-case text-white hover:bg-purple hover:text-white hover:brightness-110"
                  >
                    Continue
                  </Link>
                </div>
              </div>

              {/* WHATSAPP */}
              <div className="z-10 flex h-[270px] w-[298px] flex-col items-center gap-4 rounded-lg bg-white p-4 shadow">
                <Image
                  src={imageLogoWhatsapp}
                  alt="Logo Whatsapp"
                  width={170}
                  height={50}
                  sizes="100vw"
                  style={{
                    width: "170px",
                    height: "50px",
                    zIndex: 1,
                  }}
                />

                <h1 className="-mt-2 text-center text-base font-semibold">
                  Want to just chat with Yoma?
                </h1>
                <div className="flex rounded-full bg-orange px-6 py-2 text-xs font-semibold uppercase text-white">
                  Coming soon
                </div>
                <p className="flex-grow pt-4 text-center text-sm text-gray-dark">
                  Our AI chatbot will let you into the system with almost no
                  data!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* HOW DO I EARN REWARDS? */}
        <div className="mt-60 flex max-w-5xl flex-col gap-10 lg:flex-row">
          <div className="flex w-[510px] flex-col">
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-semibold text-black">
                How do I earn rewards?
              </h2>
              <p className="text-sm text-gray-dark">
                After you&apos;ve successfully completed opportunities with our
                partners, return to Yoma, upload the necessary verification
                documents for the opportunity, and get ready to enjoy some
                well-deserved rewards!
              </p>
              <div className="flex flex-row"></div>
            </div>

            <div className="flex flex-row items-center justify-center gap-8">
              <Image
                src={imageLogoZltoBig}
                alt="Logo Zlto"
                width={134}
                height={74}
                sizes="100vw"
                style={{
                  width: "130px",
                  height: "74px",
                  zIndex: 1,
                }}
              />
              <p className="text-sm text-gray-dark">
                Zlto is Yoma&apos;s fantastic reward currency. Redeem your
                hard-earned rewards in the Marketplace and experience the
                incredible benefits that await you!
              </p>
            </div>

            {/* MARKETPLACE BUTTON */}
            <div className="flex items-center justify-center">
              <Link
                href="/marketplace"
                className="btn mt-8 w-[260px] rounded-xl border-none bg-green normal-case text-white hover:bg-green hover:text-white hover:brightness-110"
              >
                Visit Marketplace
              </Link>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="flex flex-col">
              <div className="flex flex-row">
                <Image
                  src={iconGreenCheck}
                  alt="Green Check"
                  width={70}
                  height={70}
                  sizes="100vw"
                  style={{ width: "70px", height: "70px" }}
                />
                <p className="mt-3 font-bold text-black">
                  Complete Opportunities
                </p>
              </div>
              <div className="flex flex-row">
                <Image
                  src={iconBlueUpload}
                  alt="Green Check"
                  width={70}
                  height={70}
                  sizes="100vw"
                  style={{ width: "70px", height: "70px" }}
                />
                <p className="mt-3 font-bold text-black">
                  Upload Proof of Completion
                </p>
              </div>
              <div className="flex flex-row">
                <Image
                  src={iconOrangeZlto}
                  alt="Green Check"
                  width={70}
                  height={70}
                  sizes="100vw"
                  style={{ width: "70px", height: "70px" }}
                />
                <p className="mt-3 font-bold text-black">Earn your Rewards</p>
              </div>
            </div>
          </div>
        </div>

        {/* FIND JOB OPPORTUNITIES */}
        <div className="mt-10 flex h-96 w-full items-center justify-center bg-gray bg-[url('/images/world-map.png')] bg-fixed bg-[center_top_4rem] bg-no-repeat">
          <div className="-mt-52 grid max-w-5xl grid-cols-1 md:grid-cols-2">
            <div className="flex flex-col items-center justify-center">
              <div className="relative flex flex-col">
                <OpportunityCard
                  title="General Manager (projects/contracting)"
                  organisation="The Delta"
                  description="Lagos, Nigeria"
                  hours={3}
                  ongoing={true}
                  reward={11}
                  students={1}
                  image={imageLogoDelta}
                />

                <div className="absolute left-24 top-28 z-10">
                  <OpportunityCard
                    title="Assistant Restaurant Floor Manager"
                    organisation="Jobberman"
                    description="Lagos, Nigeria"
                    hours={9}
                    ongoing={true}
                    reward={11}
                    students={1}
                    image={imageLogoJobberman}
                    // width={250}
                    // height={200}
                  />
                </div>
              </div>
            </div>
            <div className="mt-56 flex flex-col items-center justify-center">
              <div className="flex flex-col gap-4">
                <h2 className="text-2xl font-semibold text-black">
                  Find job opportunities
                </h2>
                <p className="text-sm text-gray-dark">
                  On Yoma, you can search through thousands of specially curated
                  Job opportunities made available by our amazing partners.
                </p>
              </div>

              {/* OPPORTUNITIES BUTTON */}
              <Link
                href="/opportunities"
                className="btn mt-8 w-[260px] rounded-xl border-none bg-purple normal-case text-white hover:bg-purple hover:text-white hover:brightness-110"
              >
                Find a job near you
              </Link>
            </div>
          </div>
        </div>

        {/* WHITE BACKGROUND */}
        <div className="flex h-80 w-full items-center justify-center bg-white bg-[url('/images/world-map.png')] bg-fixed bg-[center_top_4rem] bg-no-repeat">
          {/* OUR PARTNERS */}
          <div className=" flex flex-col items-center justify-center gap-4">
            <h2 className="text-2xl font-semibold text-black">Our partners</h2>
            {/* PARTNER LOGOS */}
            <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
              <Image
                src={iconUnicef}
                alt="UNICEF"
                width={126}
                height={35}
                style={{ width: 126, height: 35 }}
              />
              <Image
                src={iconDidx}
                alt="DIDX"
                width={70}
                height={35}
                style={{ width: 70, height: 35 }}
              />
              <Image
                src={iconUnlimitedGeneration}
                alt="Unlimited Generation"
                width={112}
                height={35}
                style={{ width: 112, height: 35 }}
              />
              <Image
                src={iconGiz}
                alt="GIZ"
                width={47}
                height={35}
                style={{ width: 47, height: 35 }}
              />
              <Image
                src={imageLogoGoodwall}
                alt="Goodwall"
                width={160}
                height={38}
                style={{ width: 160, height: 38 }}
              />
              <Image
                src={iconRlabs}
                alt="RLabs"
                width={50}
                height={50}
                style={{ width: 50, height: 50 }}
              />
              <Image
                src={iconFoundationBotnar}
                alt="Foundation Botnar"
                width={95}
                height={35}
                style={{ width: 95, height: 35 }}
              />
              <Image
                src={iconUmuzi}
                alt="Umuzi"
                width={67}
                height={60}
                style={{ width: 67, height: 60 }}
              />
              <Image
                src={iconAccenture}
                alt="Accenture"
                width={135}
                height={50}
              />
              <Image
                src={iconSap}
                alt="SAP"
                width={68}
                height={35}
                style={{ width: 68, height: 35 }}
              />
            </div>

            {/* SIGN UP AS PARTNER BUTTON */}
            <Link
              href="/organisations/register"
              className="btn mt-8 w-[260px] rounded-xl border-none bg-green normal-case text-white hover:bg-green hover:text-white hover:brightness-110"
            >
              Sign up as a partmer
            </Link>
          </div>
        </div>

        {/* PURPLE BACKGROUND */}
        <div className="flex h-80 w-full items-center justify-center bg-purple bg-[url('/images/world-map.png')] bg-fixed bg-[center_top_4rem] bg-no-repeat">
          {/* JOIN THE YOMA COMMUNITY */}
          <div className="flex max-w-5xl flex-col gap-10 lg:flex-row">
            <div className="flex w-[510px] flex-col">
              <div className="flex flex-col gap-4">
                <h1 className="text-4xl font-semibold text-white">
                  Join the Yoma community
                </h1>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="flex flex-col gap-4">
                <p className="text-sm text-white">
                  Yoma connects young people to a global community, creating a
                  network of like-minded, talented individuals. Visit our
                  Facebook community page to be part of this exciting journey.
                  Sign up to our newsletter and get Yoma’s latest updates
                  delivered to your inbox:
                </p>

                <div className="flex flex-row gap-2">
                  <input
                    type="email"
                    placeholder={"Your email..."}
                    className="input-md min-w-[250px] rounded-md bg-[#653A72] py-5 text-sm text-white placeholder-white focus:outline-0 md:w-[250px] md:!pl-8"
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  {/* SUBMIT BUTTON */}
                  <button
                    className="btn w-[100px] rounded-md border-none bg-green normal-case text-white hover:bg-green hover:text-white hover:brightness-110"
                    onClick={onSubscribe}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

Home.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

Home.theme = function getTheme() {
  return THEME_ORANGE;
};

export default Home;
