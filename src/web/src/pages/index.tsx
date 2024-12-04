import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import imageWoman from "public/images/home/bg-woman.webp";
import imageCardID from "public/images/home/card-id.png";
import iconGreenCheck from "public/images/home/icon-check.png";
import iconImpact from "public/images/home/icon-impact.png";
import imageMtn from "public/images/home/icon-mtn.png";
import iconBlueUpload from "public/images/home/icon-upload.png";
import imageVodacom from "public/images/home/icon-vodacom.png";
import iconOrangeZlto from "public/images/home/icon-zlto.png";
import imageThrive from "public/images/home/image-thrive.png";
import iconAccenture from "public/images/home/logo-accenture.png";
import imageLogoAppStore from "public/images/home/logo-app-store.png";
import imageLogoAtingi from "public/images/home/logo-atingi.png";
import imageLogoCartedo from "public/images/home/logo-cartedo.png";
import iconDidx from "public/images/home/logo-didx.png";
import iconFoundationBotnar from "public/images/home/logo-foundation-botnar.png";
import iconUnlimitedGeneration from "public/images/home/logo-generation-unlimited.png";
import iconGiz from "public/images/home/logo-giz.png";
import imageLogoGoodwall from "public/images/home/logo-goodwall.png";
import iconIxo from "public/images/home/logo-ixo.png";
import imageLogoPlayStore from "public/images/home/logo-play-store.png";
import iconRlabs from "public/images/home/logo-rlabs.webp";
import iconSap from "public/images/home/logo-sap.png";
import imageLogoUCT from "public/images/home/logo-uct.png";
import iconUmuzi from "public/images/home/logo-umuzi.png";
import iconUnicef from "public/images/home/logo-unicef.png";
import imageLogoWhatsapp from "public/images/home/logo-whatsapp.png";
import imageLogoZltoBig from "public/images/home/logo-zlto.png";
import imageLogoYoma from "public/images/logo-dark.webp";
import stamp1 from "public/images/stamp-1.png";
import stamp2 from "public/images/stamp-2.png";
import { type ReactElement, useCallback } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { IoMdCheckmark } from "react-icons/io";
import MarketplaceCard from "~/components/Home/MarketplaceCard";
import OpportunityCard from "~/components/Home/OpportunityCard";
import MainLayout from "~/components/Layout/Main";
import { PageBackground } from "~/components/PageBackground";
import { RoundedImage } from "~/components/RoundedImage";
import { HomeSearchInputLarge } from "~/components/Home/HomeSearchInputLarge";
import { THEME_ORANGE } from "~/lib/constants";
import type { NextPageWithLayout } from "./_app";

const Home: NextPageWithLayout = () => {
  const router = useRouter();

  const onSearchInputSubmit = useCallback(
    (query: string) => {
      if (query && query.length > 2) {
        // uri encode the search value
        const searchValueEncoded = encodeURIComponent(query);
        query = searchValueEncoded;
      } else {
        return;
      }

      let url = "/opportunities";
      const params = new URLSearchParams();

      params.append("query", query);

      if (params != null && params.size > 0)
        url = `/opportunities?${params.toString()}`;

      if (url != router.asPath)
        void router.push(url, undefined, { scroll: false });
    },
    [router],
  );

  return (
    <>
      <PageBackground className="h-[360px] lg:h-[422px]" />

      <div className="z-10 mt-8 flex flex-col items-center justify-center overflow-hidden px-4 pt-8 lg:mt-20">
        <div className="grid grid-cols-1 gap-6 md:max-w-5xl lg:grid-cols-2">
          {/* LEFT: HEADERS AND TEXT */}
          <div className="flex min-h-80 max-w-md flex-col gap-2 overflow-hidden pt-8 text-white md:py-8">
            <h6 className="text-sm uppercase tracking-widest">
              Welcome to Yoma
            </h6>
            <h1 className="text-xl tracking-wide sm:text-xl md:text-2xl">
              A world of opportunities
            </h1>
            <p className="text-md tracking-tight">
              Yoma is your friendly platform of trusted partners, bringing you
              the freshest opportunities to keep your skills sharp and stay in
              the loop with what&apos;s happening in the working world.
            </p>
            <div className="my-2 flex w-full flex-row justify-start md:my-4">
              <HomeSearchInputLarge
                onSearch={onSearchInputSubmit}
                maxWidth={0}
              />
            </div>
          </div>

          {/* RIGHT: TWO CARDS AND WOMAN IMAGES */}
          <div className="hidden h-96 lg:flex">
            <div className="relative ml-auto mr-[7.5rem]">
              <div className="z-0 mt-5 opacity-70">
                <OpportunityCard
                  title="Foundations of Food & Beverage Business"
                  organisation="University of Cape Town"
                  description="This self-paced course will introduce you to the world of Food and Beverage. You will learn about..."
                  hours={4}
                  ongoing={true}
                  reward={11}
                  students={1}
                  image={imageLogoUCT}
                />
              </div>
              <div className="absolute left-[7.5rem] top-32 z-10">
                <OpportunityCard
                  title="A Career in Tourism"
                  organisation="Atingi"
                  description="This self-paced course will help you explore tourism as an industry and see the job opportunities it can offer."
                  hours={4}
                  ongoing={true}
                  reward={11}
                  students={1}
                  image={imageLogoAtingi}
                />
              </div>
            </div>
            <Image
              src={imageWoman}
              alt="Woman smiling"
              width={345}
              sizes="100vw"
              priority={true}
              style={{
                zIndex: 0,
              }}
              className="absolute right-0 top-12 h-auto"
            />
          </div>
        </div>

        {/* CENTER: OUR MISSION HEADER AND PARAGRAPH */}
        <div className="mt-8x flex flex-col items-center gap-2 md:mt-0">
          <h2 className="text-2xl font-semibold tracking-wide text-black">
            Our mission
          </h2>
          <p className="w-60 text-center text-sm text-gray-dark lg:w-full">
            We&apos;re here to help you grow, make a positive difference, and
            thrive.
          </p>
        </div>

        {/* ROW OF 3 IMAGES */}
        <div className="my-10 mt-16 grid max-w-5xl grid-cols-1 gap-8 md:my-20 lg:grid-cols-3 lg:gap-4">
          {/* CARTEDEO */}
          <div className="mx-auto max-w-[380px] rounded-xl bg-white shadow-lg">
            {/* GRADIENT CARD */}
            <div className="-mt-4 flex flex-col items-center justify-center">
              <div className="mx-4 w-56 scale-[0.95] rounded-lg bg-gradient-to-b from-white to-gray p-4 shadow-xl md:scale-100">
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
                    containerSize={49}
                    imageSize={49}
                  />
                </div>

                <span className="absolute -left-10 mt-4 inline-flex items-center rounded-md bg-green px-3 py-0.5 text-sm font-medium text-white">
                  <IoMdCheckmark className="mr-2 h-4 w-4 text-white" />
                  Verified
                </span>

                <p className="ml-16 mt-12 text-xs text-gray-dark">
                  2024-03-12 07:14:49
                </p>
              </div>
            </div>

            {/* GROW */}
            <div className="p-6">
              <h3 className="font-semibold">Grow</h3>

              <p className="mt-2 leading-7 text-gray-dark">
                Improve your skills through learning opportunities, and showcase
                them on Yoma to pursue your dreams.
              </p>
            </div>
          </div>

          {/* IMPACT */}
          <div className="mx-auto max-w-[380px] rounded-xl bg-white p-4 shadow-lg">
            <div className="">
              <div className="-mt-[2rem] flex items-center justify-center">
                <Image
                  src={iconImpact}
                  alt="People sitting at table"
                  width={130}
                  sizes="100vw"
                  className="h-auto drop-shadow-[0_16px_4px_rgba(0,0,0,0.16)]"
                />
              </div>
            </div>

            <div className="z-10 mt-[26px] p-2">
              <h3 className="font-semibold">Impact</h3>
              <p className="mt-2 leading-7 text-gray-dark">
                Make a difference in your community, and build your profile by
                participating in our impact tasks.
              </p>
            </div>
          </div>

          {/* THRIVE */}
          <div className="mx-auto max-w-[380px] rounded-xl bg-white p-4 shadow-lg">
            <div className="">
              <div className="-mt-[2rem] flex items-center justify-center">
                <Image
                  src={imageThrive}
                  alt="People sitting at table"
                  width={140}
                  className="h-auto"
                  sizes="100vw"
                />
              </div>
            </div>

            <div className="z-10 -mt-[6px] p-2">
              <h3 className="font-semibold">Thrive</h3>
              <p className="mt-2 leading-7 text-gray-dark">
                Track your progress on Yoma YoID and unlock new skills by
                completing opportunities.
              </p>
            </div>
          </div>
        </div>

        {/* GREEN BACKGROUND */}
        <div className="mt-10 flex h-[32rem] w-screen justify-center bg-green bg-[url('/images/world-map-transparent.png')] bg-fixed bg-[center_top_4rem] bg-no-repeat lg:h-96">
          <div className="flex w-full flex-col md:max-w-lg lg:max-w-5xl">
            {/* ID CARD & SIGN IN BUTTON */}
            <div className="flex flex-col items-center lg:flex-row lg:items-start">
              {/* LEFT: ID CARD  */}
              <div className="-my-6 mt-0 flex w-[448px] scale-75 flex-col items-center md:-my-0 md:-mt-14 md:scale-100 md:items-start lg:-ml-[45px]">
                <Image
                  src={stamp1}
                  alt="Stamp1"
                  width={135}
                  sizes="100vw"
                  priority={true}
                  className="user-select-none pointer-events-none absolute z-0 h-auto rotate-[-6deg] md:top-32"
                />
                <Image
                  src={stamp2}
                  alt="Stamp2"
                  width={135}
                  sizes="100vw"
                  priority={true}
                  className="user-select-none pointer-events-none absolute -bottom-5 right-0 z-0 h-auto rotate-12 mix-blend-plus-lighter"
                />
                <Image
                  src={imageCardID}
                  alt="ID Card"
                  width={420}
                  className="z-10 h-auto"
                  sizes="100vw"
                  priority={true}
                  quality={100}
                />
              </div>

              {/* RIGHT: HEADERS AND TEXT */}
              <div className="z-10 mt-4 flex flex-col gap-2 px-4 text-white md:max-w-lg lg:-ml-8 lg:mt-[7.5rem] lg:w-[648px] lg:px-0">
                <h6 className="text-xs font-bold uppercase tracking-wider">
                  Your Yo-ID
                </h6>
                <h1 className="text-3xl font-semibold tracking-wide">
                  All connected with one secure profile
                </h1>
                <p>
                  Yo-ID is your learning identity passport powered by Yoma, you
                  can simply login with Yo-ID, and use one profile between all
                  apps.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ROW OF 3 CARDS */}
        <div className="-mt-12 grid max-w-5xl grid-cols-1 gap-8 md:-mt-8 md:gap-4 lg:grid-cols-3">
          {/* GOODWALL */}
          <div className="flex h-[298px] max-w-[380px] flex-col items-center gap-4 rounded-xl bg-white p-6 shadow-lg md:py-8">
            <Image
              src={imageLogoGoodwall}
              alt="Logo Goodwall"
              width={200}
              className="h-auto"
              sizes="100vw"
            />

            <h1 className="text-center text-base font-semibold">
              Passionate about youth empowerment?
            </h1>
            <p className="flex-grow text-center text-sm text-gray-dark">
              Collaborate with your community, find and complete opportunities,
              win prizes!
            </p>
            <div className="flex flex-row gap-4">
              <Link
                href="https://apps.apple.com/us/app/goodwall-level-up-a-skill/id857868585"
                target="_blank"
              >
                <Image
                  src={imageLogoAppStore}
                  alt="App Store"
                  width={120}
                  className="h-auto"
                  sizes="100vw"
                />
              </Link>
              <Link
                href="https://play.google.com/store/apps/details?id=org.goodwall.app&hl=en&gl=US&pli=1"
                target="_blank"
              >
                <Image
                  src={imageLogoPlayStore}
                  alt="Play Store"
                  width={120}
                  className="h-auto"
                  sizes="100vw"
                />
              </Link>
            </div>
          </div>

          {/* YOMA */}
          <div className="flex h-[298px] max-w-[380px] flex-col items-center gap-4 rounded-xl bg-white p-6 shadow-lg md:py-8">
            <Image
              src={imageLogoYoma}
              alt="Logo Yoma"
              width={100}
              className="h-auto"
              sizes="100vw"
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
                href="/opportunities"
                className="btn z-10 w-[220px] border-none bg-purple normal-case text-white hover:bg-purple hover:text-white hover:brightness-110"
              >
                Continue
              </Link>
            </div>
          </div>

          {/* WHATSAPP */}
          <div className="flex h-[298px] max-w-[380px] flex-col items-center gap-4 rounded-xl bg-white p-6 shadow-lg md:py-8">
            <Image
              src={imageLogoWhatsapp}
              alt="Logo Whatsapp"
              width={150}
              className="h-auto"
              sizes="100vw"
              style={{
                zIndex: 1,
              }}
            />

            <h1 className="-mt-2 text-center text-base font-semibold">
              Want to just chat with Yoma?
            </h1>
            <div className="mt-6 flex rounded-full bg-orange px-6 py-2 text-xs font-semibold uppercase text-white">
              Coming soon
            </div>
            <p className="flex-grow pt-6 text-center text-sm text-gray-dark">
              Our AI chatbot will let you into the system with almost no data!
            </p>
          </div>
        </div>

        {/* HOW DO I EARN REWARDS? */}
        <div className="mt-16 flex w-full max-w-5xl flex-col items-center gap-10 py-8 lg:flex-row lg:pb-12">
          <div className="flex flex-col text-center md:max-w-lg md:pb-8 lg:max-w-[500px] lg:text-left">
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-semibold text-black">
                How do I earn rewards?
              </h2>
              <p className="text-sm leading-6 text-gray-dark">
                After you&apos;ve successfully completed opportunities with our
                partners, return to Yoma, upload the necessary verification
                documents for the opportunity, and get ready to enjoy some
                well-deserved rewards!
              </p>
              <div className="flex flex-row"></div>
            </div>

            <div className="flex flex-col items-center justify-center gap-8 lg:flex-row">
              <Image
                src={imageLogoZltoBig}
                alt="Logo Zlto"
                width={134}
                className="h-auto"
                sizes="100vw"
                style={{
                  zIndex: 1,
                }}
              />
              <p className="-mt-4 text-sm leading-6 text-gray-dark lg:-mt-0">
                Zlto is Yoma&apos;s fantastic reward currency. Redeem your
                hard-earned rewards in the Marketplace and experience the
                incredible benefits that await you!
              </p>
            </div>

            {/* MARKETPLACE BUTTON */}
            <div className="flex items-center justify-center">
              <Link
                href="/marketplace"
                className="btn mt-8 w-[260px] rounded-xl border-none bg-green normal-case text-white hover:bg-green hover:text-white hover:brightness-110 lg:mr-auto"
              >
                Visit Marketplace
              </Link>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center lg:ml-auto lg:mr-12">
            <div className="flex flex-col md:gap-3">
              <div className="flex flex-row">
                <Image
                  src={iconGreenCheck}
                  alt="Green Check"
                  width={70}
                  className="h-auto"
                  sizes="100vw"
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
                  className="h-auto"
                  sizes="100vw"
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
                  className="h-auto"
                  sizes="100vw"
                />
                <p className="mt-3 font-bold text-black">Earn your Rewards</p>
              </div>
            </div>
          </div>
        </div>

        {/* GRAY BACKGROUND */}
        <div className="mt-10 flex w-screen justify-center bg-gray bg-[url('/images/world-map.webp')] bg-fixed bg-[center_top_4rem] bg-no-repeat md:h-[560px] lg:mt-8 lg:h-[420px]">
          <div className="flex w-full flex-col md:max-w-lg lg:max-w-5xl lg:flex-row">
            <div className="flex flex-col items-center justify-center md:items-start lg:w-1/2">
              <div className="relative -mt-14 mr-auto flex scale-[0.75] flex-col md:scale-100 lg:-mt-80">
                <MarketplaceCard
                  title="R100 airtime"
                  organisation="Mtn"
                  zlto={11}
                  image={imageMtn}
                />

                <div className="absolute left-24 top-32 -z-10">
                  <MarketplaceCard
                    title="R50 airtime"
                    organisation="Vodacom"
                    zlto={11}
                    image={imageVodacom}
                  />
                </div>
              </div>
            </div>
            <div className="mt-20 flex flex-col items-center justify-center px-6 py-8 md:mt-32 lg:-mt-10 lg:ml-[11.5rem] lg:py-0">
              <div className="flex flex-col items-center gap-4 lg:items-start">
                <h2 className="text-2xl font-semibold text-black">
                  Yoma Marketplace
                </h2>
                <p className="text-center text-sm text-gray-dark lg:text-left">
                  Unlock the power of your Zlto rewards in the Yoma marketplace!
                  Treat yourself to selected products like airtime and data.
                </p>
              </div>

              {/* MARKETPLACE BUTTON */}
              <Link
                href="/marketplace"
                className="btn mt-8 w-[260px] rounded-xl border-none bg-purple normal-case text-white hover:bg-purple hover:text-white hover:brightness-110 lg:mr-auto"
              >
                Start shopping
              </Link>
            </div>
          </div>
        </div>

        {/* WHITE BACKGROUND */}
        <div className="mt-0 flex w-screen justify-center bg-white bg-[url('/images/world-map.webp')] bg-fixed bg-[center_top_4rem] bg-no-repeat lg:-mt-10 lg:h-80">
          {/* OUR PARTNERS */}
          <div className="my-8 flex flex-col items-center justify-center gap-4 lg:my-0">
            <h2 className="text-2xl font-semibold text-black">Our partners</h2>
            {/* PARTNER LOGOS */}
            <div className="my-4 ml-6 grid grid-cols-2 place-items-center items-center justify-center gap-4 overflow-hidden lg:my-0 lg:ml-0 lg:flex lg:flex-row">
              <Image
                src={iconUnicef}
                alt="UNICEF"
                width={126}
                className="h-auto"
              />
              <Image src={iconDidx} alt="DIDX" width={70} className="h-auto" />
              <Image
                src={iconUnlimitedGeneration}
                alt="Unlimited Generation"
                width={112}
                className="h-auto"
              />
              <Image src={iconGiz} alt="GIZ" width={47} className="h-auto" />
              <Image
                src={imageLogoGoodwall}
                alt="Goodwall"
                width={160}
                className="h-auto"
              />
              <Image
                src={iconRlabs}
                alt="RLabs"
                width={50}
                className="h-auto"
              />
              <Image
                src={iconFoundationBotnar}
                alt="Foundation Botnar"
                width={95}
                className="h-auto"
              />
              <Image
                src={iconUmuzi}
                alt="Umuzi"
                width={67}
                className="h-auto"
              />
              <Image
                src={iconAccenture}
                alt="Accenture"
                width={135}
                className="h-auto"
              />
              <Image src={iconSap} alt="SAP" width={68} className="h-auto" />
              <Image src={iconIxo} alt="IXO" width={70} className="h-auto" />
            </div>

            {/* SIGN UP AS PARTNER BUTTON */}
            {/* <Link
              href="/organisations/register"
              className="btn my-4 md:my-0 md:mt-8 w-[260px] rounded-xl border-none bg-green normal-case text-white hover:bg-green hover:text-white hover:brightness-110"
            >
              Sign up as a partner
            </Link> */}
          </div>
        </div>

        {/* PURPLE BACKGROUND */}
        {/* <div className="flex w-screen items-center justify-center bg-purple md:h-80">
          <div className="flex flex-col gap-10 p-8 md:max-w-lg lg:max-w-5xl lg:flex-row">
            <div className="-mb-4 flex flex-col md:-mb-0 md:w-[510px]">
              <div className="flex flex-col gap-4">
                <h1 className="text-left font-semibold text-white lg:text-4xl">
                  Join the Yoma community
                </h1>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="flex flex-col gap-8 md:gap-4">
                <p className="text-sm leading-6 text-white">
                  Yoma connects young people to a global community, creating a
                  network of like-minded, talented individuals. Visit our
                  Facebook community page to be part of this exciting journey.
                  Sign up to our newsletter and get Yoma’s latest updates
                  delivered to your inbox:
                </p>

                <div className="flex flex-col gap-8 md:flex-row md:gap-4">
                  <input
                    type="email"
                    placeholder={"Your email..."}
                    className="input-md min-w-[250px] rounded-md bg-[#653A72] py-5 text-sm text-white placeholder-white focus:outline-0 md:w-[250px] md:!pl-8"
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <button
                    className="btn rounded-md border-none bg-green normal-case text-white hover:bg-green hover:text-white hover:brightness-110 md:w-[140px]"
                    onClick={onSubscribe}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div> */}
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
