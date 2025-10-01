import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
// import imageWoman from "public/images/home/bg-woman.webp";
import imageWoman2 from "public/images/home/bg-woman2.png";
import imageCardYOID from "public/images/home/card-yoid.png";
import imageCardID from "public/images/home/card-id.png";
import iconGreenCheck from "public/images/home/icon-check.png";
import iconImpact from "public/images/home/icon-impact.png";
import imageMtn from "public/images/home/icon-mtn.png";
import iconBlueUpload from "public/images/home/icon-upload.png";
import imageVodacom from "public/images/home/icon-vodacom.png";
import iconOrangeZlto from "public/images/home/icon-zlto.png";
import imageThrive from "public/images/home/image-thrive.png";
import imageLogoAppStore from "public/images/home/logo-app-store.png";
import imageLogoCartedo from "public/images/home/logo-cartedo.png";
// Partner logos
import partnerGenU from "public/images/partners/01_gen-u-logo.png";
import partnerUnicef from "public/images/partners/02_unicef-logo.png";
import partnerAtingi from "public/images/partners/03_atingi-logo.png";
import partnerLeap from "public/images/partners/04_leap-logo.png";
import partnerHot from "public/images/partners/05_hot-logo.png";
import partnerCodingNetwork from "public/images/partners/06_codingnetwork-logo.png";
import partnerThinkCode from "public/images/partners/07_thinkcode-logo.png";
import partnerYoma from "public/images/partners/08_yoma-logo.png";
import partnerAtlas from "public/images/partners/09_atlas-logo.png";
import partnerGeoversity from "public/images/partners/10_geoversity-logo.png";
import partnerGoodwall from "public/images/partners/11_goodwall-logo.png";
import partnerSkills from "public/images/partners/12_skills-logo.png";
import partnerRlabs from "public/images/partners/13_rlabs-logo.png";
import partnerSilulo from "public/images/partners/14_silulo-logo.png";
import partnerDigify from "public/images/partners/15_digify-logo.png";
import partnerEdc from "public/images/partners/16_edc-logo.png";
import partnerMicrosoft from "public/images/partners/17_microsoft-logo.png";
import partnerYes from "public/images/partners/18_yes-logo.png";
import partnerWessa from "public/images/partners/19_wessa-logo.png";
import partnerAfricaUnion from "public/images/partners/20_africaunion-logo.png";
import imageDiamond from "public/images/home/diamond.svg";
import imageGlobe from "public/images/home/globe.svg";
import imageFile from "public/images/home/file.svg";
import imageWallet from "public/images/home/wallet.svg";
import imagePin from "public/images/home/pin.svg";
import imageLock from "public/images/home/lock.svg";
import imageHat from "public/images/home/hat.svg";
import imagePlant from "public/images/home/plant.svg";
import imageStamp1 from "public/images/stamp-1.png";
import imageStamp2 from "public/images/stamp-2.png";
import imageVideoYoutube from "public/images/home/video_youtube.png";
import imageThumbnailWoman from "public/images/home/thumbnail-woman.png";
import imageLogoPlayStore from "public/images/home/logo-play-store.png";
import imageLogoUCT from "public/images/home/logo-uct.png";
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
import { ScrollableContainer } from "~/components/Carousel";
import { THEME_WHITE } from "~/lib/constants";
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
      <PageBackground className="h-[458px] !bg-[#F7F5EB] md:h-[520px]" />

      <div className="px-4x z-10 flex flex-col items-center justify-center">
        <div className="flex w-full justify-center">
          <div className="grid grid-cols-1 gap-0 px-6 md:max-w-5xl md:px-0 lg:grid-cols-2">
            {/* LEFT: HEADERS AND TEXT */}
            <div className="flex max-w-md flex-col gap-3 pt-24 text-center md:text-start lg:mt-20">
              <h6 className="font-sans text-xs font-semibold tracking-widest text-[#020304] uppercase">
                Welcome to Yoma
              </h6>
              <h1 className="text-3xl font-bold tracking-normal text-black md:text-4xl">
                Building <span className="text-orange">futures</span>,{" "}
                <br className="md:hidden" /> one{" "}
                <span className="text-purple-dark">opportunity</span>{" "}
                <br className="md:hidden" /> at a time.
              </h1>
              <p className="text-gray-dark font-sans text-sm tracking-normal md:text-base">
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

            {/* RIGHT: WOMAN & CARDS IMAGES */}
            <div className="relative hidden h-[636px] w-[680px] lg:flex">
              <Image
                src={imageWoman2}
                alt="Woman smiling"
                fill
                sizes="100vw"
                priority={true}
                style={{
                  objectFit: "cover",
                  zIndex: 10,
                }}
                //className="absolute top-0 left-0"
              />
            </div>
          </div>
        </div>

        {/* CENTER: OUR MISSION HEADER AND PARAGRAPH */}
        <div className="md:max-w-5xlxxx mt-20 flex max-w-md flex-col items-center gap-2 text-center md:mt-0">
          <h2 className="text-[18px] font-semibold tracking-normal text-black md:text-[27px]">
            Yoma is a digital marketplace that
            <br className="visible md:hidden" /> upskills and connects young
            people​ to
            <br /> opportunities to transform their
            <br className="visible md:hidden" /> future and unlock their
            potential.
          </h2>
          <p className="text-gray-dark font-sans text-sm tracking-tight md:text-base">
            Yoma puts you first. With your Youth Identity (YoID),
            <br className="visible md:hidden" /> you can easily move across
            organisations and <br className="visible md:hidden" />
            platforms, unlocking opportunities to learn, make an <br /> impact,
            and earn along the way. No matter who
            <br className="visible md:hidden" /> you are or where you&apos;re
            from, Yoma is built to open
            <br className="visible md:hidden" /> doors for every young person.
          </p>
        </div>

        {/* GREEN BACKGROUND */}
        <div className="bg-green absolute top-[780px] mt-10 flex h-[1860px] w-screen justify-center md:top-[820px] md:h-[980px]"></div>

        <div className="z-20 mt-36 flex flex-col items-center gap-2 px-3 text-center text-white md:max-w-5xl">
          {/* CENTER: HEADERS AND TEXT */}
          <h2 className="text-[26px] font-semibold tracking-normal">
            Meet Yo-ID: Your Passport to Opportunities
          </h2>
          <p className="font-sans text-sm tracking-normal text-white md:text-base">
            With your Yo-ID wallet, all your achievements are recorded. Think of
            it as a backpack for your digital certificates, powered by the
            latest technology, so you can carry your future with you wherever
            you go.
          </p>
          <div className="relative mt-4 flex items-center justify-center overflow-hidden">
            <Image
              src={imageStamp1}
              alt="Stamp 1"
              width={217}
              height={163}
              className="absolute top-1/2 left-0 z-10 h-auto -translate-x-16 -translate-y-1/2"
              sizes="100vw"
            />
            <Image
              src={imageCardYOID}
              alt="My YoID Card"
              width={464}
              height={216}
              className="max-wxxx-[461px] w-fullxxx relative z-20 h-auto"
              sizes="100vw"
            />
            <Image
              src={imageStamp2}
              alt="Stamp 2"
              width={197}
              height={198}
              className="absolute top-1/2 right-0 z-10 h-auto translate-x-16 -translate-y-1/2"
              sizes="100vw"
            />
          </div>
        </div>

        {/* ROW OF 4 CARDS */}
        <div className="z-20 mt-6 max-w-screen px-4">
          <ScrollableContainer className="scrollbar-hide flex gap-4 overflow-x-auto py-4 md:gap-20">
            {/* CARD 1 */}
            <div className="bg-green flex h-[340px] w-[300px] flex-shrink-0 flex-col items-center gap-4 rounded-xl border-1 border-solid border-white px-6 py-4 text-white md:h-[290px] md:w-[280px]">
              <Image
                src={imageDiamond}
                alt="Diamond"
                width={56}
                className="rounded-full bg-[#1C6B53] p-3"
                sizes="100vw"
              />

              <h1 className="text-center text-[18px] font-semibold">
                Showcase Your Skills
                <br /> & Achievements
              </h1>
              <p className="-mt-4 text-center font-sans md:text-sm">
                Every course you finish, challenge you take on, or project you
                complete becomes a verified digital credential. It&apos;s secure
                proof of your skills and achievements.
              </p>
            </div>

            {/* CARD 2 */}
            <div className="bg-green flex h-[340px] w-[300px] flex-shrink-0 flex-col items-center gap-4 rounded-xl border-1 border-solid border-white px-6 py-4 text-white md:h-[290px] md:w-[280px]">
              <Image
                src={imageLock}
                alt="Lock"
                width={56}
                className="rounded-full bg-[#1C6B53] p-3"
                sizes="100vw"
              />

              <h1 className="text-center text-[18px] font-semibold">
                Localised and Relevant
              </h1>
              <p className="-mt-4 text-center font-sans md:text-sm">
                Yoma partners with local opportunity providers to make sure the
                content is relevant to you. Currently the platform is available
                in five languages with plans to expand.
              </p>
            </div>

            {/* CARD 3 */}
            <div className="bg-green flex h-[340px] w-[300px] flex-shrink-0 flex-col items-center gap-4 rounded-xl border-1 border-solid border-white px-6 py-4 text-white md:h-[290px] md:w-[280px]">
              <Image
                src={imageHat}
                alt="Hat"
                width={56}
                className="rounded-full bg-[#1C6B53] p-3"
                sizes="100vw"
              />

              <h1 className="text-center text-[18px] font-semibold">
                Boost Your Employability -<br /> 100% for free
              </h1>
              <p className="-mt-4 text-center font-sans md:text-sm">
                Yoma is completely free and focused on helping you move forward
                in your career. Verified skills and experiences on Yoma are
                recognised by our partners, increasing your chances for
                internships, opportunities, and jobs.
              </p>
            </div>

            {/* CARD 4 */}
            <div className="bg-green flex h-[340px] w-[300px] flex-shrink-0 flex-col items-center gap-4 rounded-xl border-1 border-solid border-white px-6 py-4 text-white md:h-[290px] md:w-[280px]">
              <Image
                src={imagePlant}
                alt="Plant"
                width={56}
                className="rounded-full bg-[#1C6B53] p-3"
                sizes="100vw"
              />

              <h1 className="text-center text-[18px] font-semibold">
                Earn While You Grow
              </h1>
              <p className="-mt-4 text-center font-sans md:text-sm">
                As you learn, you get the chance to earn digital tokens that can
                be cashed out or redeemed in the Yoma marketplace. Some options
                on the marketplace include airtime, data and grocery vouchers.
              </p>
            </div>
          </ScrollableContainer>
        </div>

        {/* PURPLE BACKGROUND */}
        <div className="bg-purple absolute top-[2640px] flex h-[868px] w-screen justify-center md:top-[1760px] md:h-[690px]"></div>

        {/* YOUTUBE VIDEO */}
        <div className="z-20 mt-14 px-4">
          <Image
            src={imageVideoYoutube}
            alt="YouTube Video"
            width={601}
            height={354}
            className="relative z-20 h-auto"
            sizes="100vw"
          />
        </div>

        {/* CENTER: HEADERS AND TEXT */}
        <div className="z-20 flex flex-col items-center gap-2 px-3 text-center text-white md:max-w-5xl">
          <h2 className="text-[26px] font-semibold tracking-normal">
            Connecting youth to opportunities
          </h2>
          <p className="font-sans text-sm tracking-normal text-white md:text-base">
            ​​​​​​​Developed by UNICEF, Partners, and young Africans, Yoma has
            evolved into a global force in youth skills development, community
            engagement, and bridge to employment opportunities. 
          </p>
        </div>

        {/* ROW OF 4 CARDS */}
        <div className="z-20 mt-10 grid grid-cols-2 px-4 md:grid-cols-4 md:flex-row">
          {/* CARD 1 */}
          <div className="flex flex-col items-center gap-5 rounded-xl py-4 text-white">
            <Image
              src={imageGlobe}
              alt="Globe"
              width={56}
              className="bg-orange rounded-full p-3"
              sizes="100vw"
            />

            <p className="text-center font-sans md:text-sm">Active in</p>
            <h1 className="-mt-5 text-center text-base font-semibold tracking-normal md:text-nowrap">
              12 countries
            </h1>
          </div>

          {/* CARD 2 */}
          <div className="flex flex-col items-center gap-4 rounded-xl py-4 text-white">
            <Image
              src={imageFile}
              alt="File"
              width={56}
              className="bg-orange rounded-full p-3"
              sizes="100vw"
            />

            <h1 className="text-center text-base font-semibold tracking-normal md:text-nowrap">
              More than 400 opportunities offered,
            </h1>
            <p className="-mt-4 text-center font-sans md:text-sm">
              including learning courses, impact challenges.
            </p>
          </div>

          {/* CARD 3 */}
          <div className="flex flex-col items-center gap-4 rounded-xl py-4 text-white">
            <Image
              src={imageWallet}
              alt="Wallet"
              width={56}
              className="bg-orange rounded-full p-3"
              sizes="100vw"
            />

            <h1 className="text-center text-base font-semibold tracking-normal md:text-nowrap">
              More than 255K YoIDs created
            </h1>
            <p className="-mt-4 text-center font-sans md:text-sm">
              and 165k credentials verified.
            </p>
          </div>

          {/* CARD 4 */}
          <div className="flex flex-col items-center gap-4 rounded-xl py-4 text-white">
            <Image
              src={imagePin}
              alt="Pin"
              width={56}
              className="bg-orange rounded-full p-3"
              sizes="100vw"
            />

            <h1 className="text-center text-base font-semibold tracking-normal md:text-nowrap">
              70 global
            </h1>
            <p className="-mt-4 text-center font-sans md:text-sm">
              <strong>and local</strong> partners.
            </p>
          </div>
        </div>

        {/* BAIGE BACKGROUND */}
        <div className="absolute top-[3480px] mt-10 flex h-[840px] w-screen justify-center bg-[#F7F5EB] md:top-[2400px] md:h-[607px]"></div>

        {/* ROW OF 3 CARDS */}
        <div className="z-20 mt-6 max-w-screen px-4">
          <ScrollableContainer className="scrollbar-hide flex gap-4 overflow-x-auto py-4 md:gap-20">
            {/* WOMAN */}
            <div className="flex h-[327px] w-[320px] flex-shrink-0 flex-col items-center gap-4 rounded-xl bg-white p-6 shadow-lg md:w-[380px] md:py-8">
              <div className="flex flex-row gap-6">
                <Image
                  src={imageThumbnailWoman}
                  alt="Woman"
                  className="w-full max-w-[90px] rounded-full"
                  sizes="100vw"
                />

                <h1 className="text-[18px] font-bold">
                  Closing The Digital Skills Gap: How we are empowering youth
                  worldwide
                </h1>
              </div>
              <p className="text-gray-dark text-sm">
                As digital technology rapidly transforms the workforce, a global
                digital skills gap is leaving many young people behind,
                especially girls and young women. UNICEF and committed private
                sector partners are equipping the next generation with essential
                digital, entrepreneurial and AI skills.. <br />
                Read more.
              </p>
            </div>

            {/* WOMAN */}
            <div className="flex h-[327px] w-[320px] flex-shrink-0 flex-col items-center gap-4 rounded-xl bg-white p-6 shadow-lg md:w-[380px] md:py-8">
              <div className="flex flex-row gap-6">
                <Image
                  src={imageThumbnailWoman}
                  alt="Woman"
                  className="w-full max-w-[90px] rounded-full"
                  sizes="100vw"
                />

                <h1 className="text-[18px] font-bold">
                  Closing The Digital Skills Gap: How we are empowering youth
                  worldwide
                </h1>
              </div>
              <p className="text-gray-dark text-sm">
                As digital technology rapidly transforms the workforce, a global
                digital skills gap is leaving many young people behind,
                especially girls and young women. UNICEF and committed private
                sector partners are equipping the next generation with essential
                digital, entrepreneurial and AI skills.. <br />
                Read more.
              </p>
            </div>

            {/* UNICEF */}
            <div className="flex h-[327px] w-[320px] flex-shrink-0 flex-col items-center gap-4 rounded-xl bg-white p-6 shadow-lg md:w-[380px] md:py-8">
              <div className="flex flex-row gap-6">
                <Image
                  src={imageThumbnailWoman}
                  alt="Woman"
                  className="w-full max-w-[90px] rounded-full"
                  sizes="100vw"
                />

                <h1 className="text-[18px] font-bold">
                  Closing The Digital Skills Gap: How we are empowering youth
                  worldwide
                </h1>
              </div>
              <p className="text-gray-dark text-sm">
                As digital technology rapidly transforms the workforce, a global
                digital skills gap is leaving many young people behind,
                especially girls and young women. UNICEF and committed private
                sector partners are equipping the next generation with essential
                digital, entrepreneurial and AI skills.. <br />
                Read more.
              </p>
            </div>
          </ScrollableContainer>
        </div>

        <button
          type="button"
          className="btn btn-rounded bg-green hover:bg-green/90 z-20 mt-10 w-full max-w-[300px] text-base text-white normal-case"
        >
          Read more stories
        </button>

        {/* PARTNERS */}
        <div className="z-20 mt-0 flex justify-center md:mt-6 md:h-60">
          <div className="my-8 flex flex-col items-center justify-center gap-4 lg:my-0">
            <h2 className="text-2xl font-semibold text-black">
              Our opportunity partners
            </h2>

            {/* PARTNER LOGOS */}
            <ScrollableContainer className="scrollbar-hide flex w-screen gap-14 overflow-x-scroll px-4 py-4 md:gap-20">
              <Image
                src={partnerGenU}
                alt="Generation Unlimited"
                width={75}
                height={75}
                className="pointer-events-none flex-shrink-0 object-contain select-none"
                draggable={false}
                quality={100}
                unoptimized={true}
              />
              <Image
                src={partnerUnicef}
                alt="UNICEF"
                width={101}
                height={57}
                className="pointer-events-none flex-shrink-0 object-contain select-none"
                draggable={false}
                quality={100}
                unoptimized={true}
              />
              <Image
                src={partnerAtingi}
                alt="Atingi"
                width={73}
                height={73}
                className="pointer-events-none flex-shrink-0 object-contain select-none"
                draggable={false}
                quality={100}
                unoptimized={true}
              />
              <Image
                src={partnerLeap}
                alt="LEAP"
                width={92}
                height={92}
                className="pointer-events-none flex-shrink-0 object-contain select-none"
                draggable={false}
                quality={100}
                unoptimized={true}
              />
              <Image
                src={partnerHot}
                alt="HOT"
                width={104}
                height={63}
                className="pointer-events-none flex-shrink-0 object-contain select-none"
                draggable={false}
                quality={100}
                unoptimized={true}
              />
              <Image
                src={partnerCodingNetwork}
                alt="Coding Network"
                width={105}
                height={61}
                className="pointer-events-none flex-shrink-0 object-contain select-none"
                draggable={false}
                quality={100}
                unoptimized={true}
              />
              <Image
                src={partnerThinkCode}
                alt="Think Code"
                width={75}
                height={71}
                className="pointer-events-none flex-shrink-0 object-contain select-none"
                draggable={false}
                quality={100}
                unoptimized={true}
              />
              <Image
                src={partnerYoma}
                alt="Yoma"
                width={104}
                height={47}
                className="pointer-events-none flex-shrink-0 object-contain select-none"
                draggable={false}
                quality={100}
                unoptimized={true}
              />
              <Image
                src={partnerAtlas}
                alt="Atlas"
                width={128}
                height={55}
                className="pointer-events-none flex-shrink-0 object-contain select-none"
                draggable={false}
                quality={100}
                unoptimized={true}
              />
              <Image
                src={partnerGeoversity}
                alt="Geoversity"
                width={201}
                height={75}
                className="pointer-events-none flex-shrink-0 object-contain select-none"
                draggable={false}
                quality={100}
                unoptimized={true}
              />
              <Image
                src={partnerGoodwall}
                alt="Goodwall"
                width={140}
                height={27}
                className="pointer-events-none flex-shrink-0 object-contain select-none"
                draggable={false}
                quality={100}
                unoptimized={true}
              />
              <Image
                src={partnerSkills}
                alt="Skills"
                width={114}
                height={57}
                className="pointer-events-none flex-shrink-0 object-contain select-none"
                draggable={false}
                quality={100}
                unoptimized={true}
              />
              <Image
                src={partnerRlabs}
                alt="RLabs"
                width={85}
                height={49}
                className="pointer-events-none flex-shrink-0 object-contain select-none"
                draggable={false}
                quality={100}
                unoptimized={true}
              />
              <Image
                src={partnerSilulo}
                alt="Silulo"
                width={110}
                height={39}
                className="pointer-events-none flex-shrink-0 object-contain select-none"
                draggable={false}
                quality={100}
                unoptimized={true}
              />
              <Image
                src={partnerDigify}
                alt="Digify"
                width={93}
                height={47}
                className="pointer-events-none flex-shrink-0 object-contain select-none"
                draggable={false}
                quality={100}
                unoptimized={true}
              />
              <Image
                src={partnerEdc}
                alt="EDC"
                width={149}
                height={23}
                className="pointer-events-none flex-shrink-0 object-contain select-none"
                draggable={false}
                quality={100}
                unoptimized={true}
              />
              <Image
                src={partnerMicrosoft}
                alt="Microsoft"
                width={158}
                height={35}
                className="pointer-events-none flex-shrink-0 object-contain select-none"
                draggable={false}
                quality={100}
                unoptimized={true}
              />
              <Image
                src={partnerYes}
                alt="YES"
                width={70}
                height={71}
                className="pointer-events-none flex-shrink-0 object-contain select-none"
                draggable={false}
                quality={100}
                unoptimized={true}
              />
              <Image
                src={partnerWessa}
                alt="WESSA"
                width={92}
                height={77}
                className="pointer-events-none flex-shrink-0 object-contain select-none"
                draggable={false}
                quality={100}
                unoptimized={true}
              />
              <Image
                src={partnerAfricaUnion}
                alt="Africa Union"
                width={140}
                height={53}
                className="pointer-events-none flex-shrink-0 object-contain select-none"
                draggable={false}
                quality={100}
                unoptimized={true}
              />
            </ScrollableContainer>

            {/* SIGN UP AS PARTNER BUTTON */}
            {/* <Link
              href="/organisations/register"
              className="btn my-4 md:my-0 md:mt-8 w-[260px] rounded-xl border-none bg-green normal-case text-white hover:bg-green hover:text-white hover:brightness-110"
            >
              Sign up as a partner
            </Link> */}
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
  return THEME_WHITE;
};

export default Home;
