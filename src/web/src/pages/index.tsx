import { useQuery } from "@tanstack/react-query";
import type { GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { env } from "process";
import imageWoman from "public/images/home/bg-woman.png";
import imageCardYOID from "public/images/home/card-yoid.png";
import imageDiamond from "public/images/home/icon_diamond.svg";
import imageFile from "public/images/home/icon_file.svg";
import imageGlobe from "public/images/home/icon_globe.svg";
import imageHat from "public/images/home/icon_hat.svg";
import imageLock from "public/images/home/icon_lock.svg";
import imagePin from "public/images/home/icon_pin.svg";
import imagePlant from "public/images/home/icon_plant.svg";
import imageWallet from "public/images/home/icon_wallet.svg";
import imageStencilPurple from "public/images/home/stencil-purple.png";
import imageStamp1 from "public/images/stamp-1.png";
import imageStamp2 from "public/images/stamp-2.png";
import { type ReactElement, useCallback } from "react";
import {
  FeedType,
  NewsArticleSearchResults,
  NewsFeed,
} from "~/api/models/newsfeed";
import { listNewsFeeds, searchNewsArticles } from "~/api/services/newsfeed";
import { ScrollableContainer } from "~/components/Carousel";
import { HomeSearchInputLarge } from "~/components/Home/HomeSearchInputLarge";
import PartnerLogos, {
  PartnerLogoOptions,
} from "~/components/Home/PartnerLogos";
import MainLayout from "~/components/Layout/Main";
import { NewsArticleCard } from "~/components/News/NewsArticleCard";
import { PAGE_SIZE_MINIMUM, THEME_WHITE } from "~/lib/constants";
import type { NextPageWithLayout } from "./_app";

// 👇 SSG
// This page undergoes static generation at run time on the server-side.
// The build-time SSG has been disabled due to missing API url configuration in the CI pipeline (see getStaticPaths below).
export const getStaticProps: GetStaticProps = async (context) => {
  // disable build-time SSG in CI environment
  if (env.CI) {
    return {
      props: {
        lookups_NewsArticles: null,
        lookup_NewsFeed: null,
      },

      // Next.js will attempt to re-generate the page:
      // - When a request comes in
      // - At most once every 300 seconds
      revalidate: 300,
    };
  }

  const lookups_NewsArticles = await searchNewsArticles(
    {
      feedType: FeedType.Stories,
      startDate: null,
      endDate: null,
      valueContains: null,
      pageNumber: 1,
      pageSize: PAGE_SIZE_MINIMUM,
    },
    context,
  );

  const lookup_NewsFeed = (await listNewsFeeds(context)).find(
    (feed) => feed.type === "Stories",
  );

  return {
    props: {
      lookups_NewsArticles,
      lookup_NewsFeed,
    },

    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 300 seconds
    revalidate: 300,
  };
};

const Home: NextPageWithLayout<{
  lookups_NewsArticles: NewsArticleSearchResults;
  lookup_NewsFeed: NewsFeed;
}> = ({ lookups_NewsArticles, lookup_NewsFeed }) => {
  const router = useRouter();

  // Fallback client-side data fetching for news articles
  const { data: clientNewsArticles } = useQuery({
    queryKey: ["newsArticles", "home"],
    queryFn: async () =>
      await searchNewsArticles({
        feedType: FeedType.Stories,
        startDate: null,
        endDate: null,
        valueContains: null,
        pageNumber: 1,
        pageSize: PAGE_SIZE_MINIMUM,
      }),
    enabled:
      !lookups_NewsArticles?.items || lookups_NewsArticles.items.length === 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fallback client-side data fetching for news feed
  const { data: clientNewsFeed } = useQuery({
    queryKey: ["newsFeed", "home"],
    queryFn: async () => {
      const feeds = await listNewsFeeds();
      return feeds.find((feed) => feed.type === "Stories");
    },
    enabled: !lookup_NewsFeed,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Use SSG data if available, otherwise fallback to client-side data
  const newsArticles =
    lookups_NewsArticles?.items && lookups_NewsArticles.items.length > 0
      ? lookups_NewsArticles
      : clientNewsArticles;

  const newsFeed = lookup_NewsFeed ?? clientNewsFeed;

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
      <Head>
        <title>Yoma | Home</title>
      </Head>

      <div className="relative right-0 left-0 flex w-screen flex-col overflow-x-hidden">
        {/* HERO SECTION WITH FULL WIDTH BEIGE BACKGROUND */}
        <div className="bg-beige w-full lg:pb-0">
          <div className="relative z-10 flex flex-col items-center justify-center px-4">
            <div className="flex w-full justify-center">
              <div className="flex max-w-7xl flex-row px-6 md:px-0">
                {/* LEFT: HEADERS AND TEXT */}
                <div className="relative flex max-w-md flex-col gap-3 py-6 pt-24 text-center md:mt-20 md:py-14 md:text-start">
                  {/* PURPLE STENCIL */}
                  <div className="absolute top-16 right-0 z-10 hidden lg:block">
                    <Image
                      src={imageStencilPurple}
                      alt="Stencil Purple"
                      sizes="100vw"
                      priority={true}
                      style={{
                        objectFit: "cover",
                      }}
                    />
                  </div>

                  <h6 className="text-xs font-semibold tracking-widest text-[#020304] uppercase">
                    Welcome to Yoma
                  </h6>
                  <h1 className="font-nunito text-3xl font-bold tracking-normal text-black md:text-4xl">
                    Building <span className="text-orange">futures</span>,{" "}
                    <br className="md:hidden" /> one{" "}
                    <span className="text-purple-dark">opportunity</span>{" "}
                    <br className="md:hidden" /> at a time.
                  </h1>
                  <p className="text-gray-dark text-sm tracking-normal md:text-base">
                    Yoma is your friendly platform of trusted partners, bringing
                    you the freshest opportunities to keep your skills sharp and
                    stay in the loop with what&apos;s happening in the working
                    world.
                  </p>
                  <div className="my-2 flex w-full flex-row justify-start md:my-4">
                    <HomeSearchInputLarge
                      onSearch={onSearchInputSubmit}
                      maxWidth={0}
                    />
                  </div>
                </div>

                {/* RIGHT: WOMAN IMAGE */}
                <div className="relativex z-20 mt-20 -mr-10 hidden lg:mb-[-80px] lg:flex">
                  <Image
                    src={imageWoman}
                    alt="Woman smiling"
                    sizes="100vw"
                    priority={true}
                    style={{
                      objectFit: "cover",
                      zIndex: 20,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HERO SECTION WITH FULL WIDTH WHITE BACKGROUND */}
        <div className="bg-beige-light w-full sm:pt-10 lg:pt-24">
          <div className="relative z-10 flex flex-col items-center justify-center px-4">
            {/* CENTER: HEADER AND PARAGRAPH */}
            <div className="my-8 flex max-w-md flex-col items-center gap-2 px-6 text-center md:mt-0 lg:max-w-5xl">
              <h2 className="font-nunito text-[18px] font-semibold tracking-normal text-black md:text-[27px]">
                Yoma is a digital marketplace that upskills and connects young
                people​ to opportunities to transform their future and unlock
                their potential.
              </h2>
              <p className="text-gray-dark font-sans text-sm tracking-tight md:text-base">
                Yoma puts you first. With your Youth Identity (YoID), you can
                easily move across organisations and platforms, unlocking
                opportunities to learn, make an impact, and earn along the way.
                No matter who you are or where you&apos;re from, Yoma is built
                to open doors for every young person.
              </p>
            </div>
          </div>
        </div>

        {/* GREEN SECTION - YO-ID WITH FULL WIDTH BACKGROUND */}
        <div className="bg-green w-full">
          <section className="relative z-10 w-full pt-8 pb-32">
            <div className="flex flex-col items-center justify-center px-4">
              <div className="flex max-w-md flex-col items-center gap-2 text-center text-white lg:max-w-5xl">
                {/* CENTER: HEADERS AND TEXT */}
                <h2 className="font-nunito text-[26px] font-semibold tracking-normal">
                  Meet Yo-ID: Your Passport to Opportunities
                </h2>
                <p className="z-20 px-3 font-sans text-sm tracking-normal text-white md:text-base">
                  With your Yo-ID wallet, all your achievements are recorded.
                  Think of it as a backpack for your digital certificates,
                  powered by the latest technology, so you can carry your future
                  with you wherever you go.
                </p>
                <div className="relative -mt-2 flex items-center justify-center">
                  <Image
                    src={imageStamp1}
                    alt="Stamp 1"
                    width={217}
                    height={163}
                    className="absolute top-32 -left-10 z-10 h-auto -translate-y-1/4"
                    sizes="100vw"
                  />
                  <Image
                    src={imageCardYOID}
                    alt="My YoID Card"
                    width={464}
                    height={216}
                    className="relative z-20 h-auto"
                    sizes="100vw"
                  />
                  <Image
                    src={imageStamp2}
                    alt="Stamp 2"
                    width={197}
                    height={198}
                    className="absolute top-16 -right-14 z-10 h-auto -translate-y-1/2"
                    sizes="100vw"
                  />
                </div>
              </div>

              {/* ROW OF 4 CARDS */}
              <div className="z-20 mt-6 w-full max-w-7xl">
                <ScrollableContainer className="flex gap-4 overflow-x-auto py-4 md:gap-8">
                  {/* CARD 1 */}
                  <div className="bg-green flex w-[300px] flex-shrink-0 flex-col items-center gap-4 rounded-xl border border-white p-4 text-white md:w-[280px]">
                    <Image
                      src={imageDiamond}
                      alt="Diamond"
                      width={56}
                      className="rounded-full bg-[#1C6B53] p-3"
                      sizes="100vw"
                    />

                    <h1 className="font-nunito text-center text-[18px] font-semibold">
                      Showcase Your Skills
                      <br /> &amp; Achievements
                    </h1>
                    <p className="-mt-4 text-center font-sans text-sm font-normal">
                      Every course you finish, challenge you take on, or project
                      you complete becomes a verified digital credential.
                      It&apos;s secure proof of your skills and achievements.
                    </p>
                  </div>

                  {/* CARD 2 */}
                  <div className="bg-green flex w-[300px] flex-shrink-0 flex-col items-center gap-4 rounded-xl border border-white p-4 text-white md:w-[280px]">
                    <Image
                      src={imageLock}
                      alt="Lock"
                      width={56}
                      className="rounded-full bg-[#1C6B53] p-3"
                      sizes="100vw"
                    />

                    <h1 className="font-nunito text-center text-[18px] font-semibold">
                      Localised and Relevant
                    </h1>
                    <p className="-mt-4 text-center font-sans text-sm font-normal">
                      Yoma partners with local opportunity providers to make
                      sure the content is relevant to you. Currently the
                      platform is available in five languages with plans to
                      expand.
                    </p>
                  </div>

                  {/* CARD 3 */}
                  <div className="bg-green flex w-[300px] flex-shrink-0 flex-col items-center gap-4 rounded-xl border border-white p-4 text-white md:w-[280px]">
                    <Image
                      src={imageHat}
                      alt="Hat"
                      width={56}
                      className="rounded-full bg-[#1C6B53] p-3"
                      sizes="100vw"
                    />

                    <h1 className="font-nunito text-center text-[18px] font-semibold">
                      Boost Your Employability -<br /> 100% for free
                    </h1>
                    <p className="-mt-4 text-center font-sans text-sm font-normal">
                      Yoma is completely free and focused on helping you move
                      forward in your career. Verified skills and experiences on
                      Yoma are recognised by our partners, increasing your
                      chances for internships, opportunities, and jobs.
                    </p>
                  </div>

                  {/* CARD 4 */}
                  <div className="bg-green flex w-[300px] flex-shrink-0 flex-col items-center gap-4 rounded-xl border border-white p-4 text-white md:w-[280px]">
                    <Image
                      src={imagePlant}
                      alt="Plant"
                      width={56}
                      className="rounded-full bg-[#1C6B53] p-3"
                      sizes="100vw"
                    />

                    <h1 className="font-nunito text-center text-[18px] font-semibold">
                      Earn While You Grow
                    </h1>
                    <p className="-mt-4 text-center font-sans text-sm font-normal">
                      As you learn, you get the chance to earn digital tokens
                      that can be cashed out or redeemed in the Yoma
                      marketplace. Some options on the marketplace include
                      airtime, data and grocery vouchers.
                    </p>
                  </div>
                </ScrollableContainer>
              </div>
            </div>
          </section>
        </div>

        {/* PURPLE SECTION - VIDEO & STATS WITH FULL WIDTH BACKGROUND */}
        <div className="bg-purple w-full">
          <section className="relative z-10 w-full py-16">
            <div className="-mt-40 flex flex-col items-center justify-center px-4">
              {/* YOUTUBE VIDEO */}
              <div className="flex w-full justify-center">
                <div className="relative aspect-video w-full max-w-[601px]">
                  <iframe
                    className="h-full w-full rounded-lg"
                    src="https://www.youtube.com/embed/77vgI4VE8HY?rel=0&modestbranding=1"
                    title="YouTube Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>

              {/* CENTER: HEADERS AND TEXT */}
              <div className="mt-10 flex flex-col items-center gap-2 px-3 text-center text-white md:max-w-5xl">
                <h2 className="text-[26px] font-semibold tracking-normal">
                  Connecting youth to opportunities
                </h2>
                <p className="font-sans text-sm tracking-normal text-white md:text-base">
                  ​​​​​​​Developed by UNICEF, Partners, and young Africans, Yoma
                  has evolved into a global force in youth skills development,
                  community engagement, and bridge to employment opportunities.
                </p>
              </div>

              {/* ROW OF 4 CARDS */}
              <div className="my-10 grid grid-cols-2 gap-4 px-4 md:grid-cols-4">
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
                  <h1 className="font-nunito -mt-5 text-center text-base font-semibold tracking-normal">
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

                  <h1 className="font-nunito text-center text-base font-semibold tracking-normal">
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

                  <h1 className="font-nunito text-center text-base font-semibold tracking-normal">
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

                  <h1 className="font-nunito text-center text-base font-semibold tracking-normal">
                    70 global
                  </h1>
                  <p className="-mt-4 text-center font-sans md:text-sm">
                    <strong>and local</strong> partners.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* BEIGE SECTION - NEWS & PARTNERS */}
        <div className="bg-beige-light w-full">
          <section className="relative z-10 w-full pt-16 pb-8">
            <div className="-mt-36 flex flex-col items-center justify-center px-4">
              {/* NEWS */}
              {newsArticles?.items && newsArticles.items.length > 0 && (
                <>
                  <div className="w-full max-w-7xl">
                    <ScrollableContainer className="flex gap-4 overflow-x-auto py-4 xl:gap-8">
                      {newsArticles.items.map((article, index) => (
                        <NewsArticleCard key={index} data={article} />
                      ))}
                    </ScrollableContainer>
                  </div>

                  {newsFeed && (
                    <Link
                      href={newsFeed.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-rounded bg-green hover:bg-green/90 mt-10 w-full max-w-[300px] text-sm text-white normal-case"
                    >
                      Read more{" "}
                      <span className="lowercase">{newsFeed.type}</span>
                    </Link>
                  )}
                </>
              )}

              {/* PARTNERS */}
              <PartnerLogos
                options={[
                  PartnerLogoOptions.GEN_UNLIMITED,
                  PartnerLogoOptions.UNICEF,
                  PartnerLogoOptions.ATINGI,
                  PartnerLogoOptions.LEAP,
                  PartnerLogoOptions.HOT,
                  PartnerLogoOptions.CODING_NETWORK,
                  PartnerLogoOptions.THINK_CODE,
                  PartnerLogoOptions.YOMA,
                  PartnerLogoOptions.ATLAS,
                  PartnerLogoOptions.GEOVERSITY,
                  PartnerLogoOptions.GOODWALL,
                  PartnerLogoOptions.SKILLS,
                  PartnerLogoOptions.RLABS,
                  PartnerLogoOptions.SILULO,
                  PartnerLogoOptions.DIGIFY,
                  PartnerLogoOptions.EDC,
                  PartnerLogoOptions.MICROSOFT,
                  PartnerLogoOptions.YES,
                  PartnerLogoOptions.WESSA,
                  PartnerLogoOptions.AFRICA_UNION,
                ]}
              />
            </div>
          </section>
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
