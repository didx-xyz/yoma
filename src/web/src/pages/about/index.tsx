import { GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import router from "next/router";
import { env } from "process";
import imageAboutInfo from "public/images/home/about_info.png";
import imageExclaimation from "public/images/home/icon_exclaimation.svg";
import imageLink from "public/images/home/icon_link.svg";
import imagePeople from "public/images/home/icon_people.svg";
import imagePlant from "public/images/home/icon_plant.svg";
import imageStats from "public/images/home/icon_stats.svg";
import { useCallback, type ReactElement } from "react";
import "react-datepicker/dist/react-datepicker.css";
import {
  FeedType,
  NewsArticleSearchResults,
  NewsFeed,
} from "~/api/models/newsfeed";
import { OpportunityCategory, PublishedState } from "~/api/models/opportunity";
import { listNewsFeeds, searchNewsArticles } from "~/api/services/newsfeed";
import { getOpportunityCategories } from "~/api/services/opportunities";
import { ScrollableContainer } from "~/components/Carousel";
import PartnerLogos from "~/components/Home/PartnerLogos";
import MainLayout from "~/components/Layout/Main";
import { NewsArticleCard } from "~/components/News/NewsArticleCard";
import OpportunityCategoriesHorizontalFilter from "~/components/Opportunity/OpportunityCategoriesHorizontalFilter";
import { PAGE_SIZE_MINIMUM, THEME_WHITE } from "~/lib/constants";
import { type NextPageWithLayout } from "../_app";

// 👇 SSG
// This page undergoes static generation at run time on the server-side.
// The build-time SSG has been disabled due to missing API url configuration in the CI pipeline (see getStaticPaths below).
export const getStaticProps: GetStaticProps = async (context) => {
  // disable build-time SSG in CI environment
  if (env.CI) {
    return {
      props: {
        lookups_categories: null,
        lookups_NewsArticles: null,
        lookup_NewsFeed: null,
      },

      // Next.js will attempt to re-generate the page:
      // - When a request comes in
      // - At most once every 300 seconds
      revalidate: 300,
    };
  }

  const lookups_categories = await getOpportunityCategories(
    [PublishedState.Active, PublishedState.NotStarted],
    context,
  );

  const lookups_NewsArticles = await searchNewsArticles(
    {
      feedType: FeedType.News,
      startDate: null,
      endDate: null,
      valueContains: null,
      pageNumber: 1,
      pageSize: PAGE_SIZE_MINIMUM,
    },
    context,
  );

  const lookup_NewsFeed = (await listNewsFeeds(context)).find(
    (feed) => feed.type === "News",
  );

  return {
    props: {
      lookups_categories,
      lookups_NewsArticles,
      lookup_NewsFeed,
    },

    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 300 seconds
    revalidate: 300,
  };
};

const About: NextPageWithLayout<{
  lookups_categories: OpportunityCategory[];
  lookups_NewsArticles: NewsArticleSearchResults;
  lookup_NewsFeed: NewsFeed;
}> = ({ lookups_categories, lookups_NewsArticles, lookup_NewsFeed }) => {
  const onClickCategoryFilter = useCallback((cat: OpportunityCategory) => {
    void router.push(
      `/opportunities?categories=${encodeURIComponent(cat.name)}`,
    );
  }, []);

  return (
    <>
      <Head>
        <title>Yoma | About Us</title>
      </Head>
      <div className="relative right-0 left-0 flex w-screen flex-col overflow-x-hidden">
        {/* HERO SECTION WITH FULL WIDTH WHITE BACKGROUND */}
        <div className="bg-orange w-full py-4 md:py-16">
          <div className="relative z-10 flex flex-col items-center justify-center px-4">
            {/* CENTER: HEADER AND PARAGRAPH */}
            {/* LEFT: HEADERS AND TEXT */}
            <div className="md:py-20x flex max-w-4xl flex-col gap-3 py-14 pt-24 text-center md:text-start">
              <h6 className="text-center font-sans text-xs font-semibold tracking-widest text-[#020304] uppercase">
                About Us
              </h6>
              <h1 className="text-4xl font-bold tracking-normal text-black md:text-4xl">
                Yoma is a{" "}
                <span className="text-purple-light">digital marketplace</span>{" "}
                that opens up a world of{" "}
                <span className="text-green">
                  opportunities to young people
                </span>
                .
              </h1>
              <p className="text-gray-darkx font-sans text-sm tracking-normal md:text-base">
                Yoma is a partnership ecosystem, enabled by technology, that
                creates pathways that improve youth&amp;s employability. This
                collaborative approach seeks to disrupt the fragmented youth
                development landscape with young people using a unique digital
                identity to seamlessly navigate opportunities to 
                <strong>learn</strong>, <strong>earn</strong>, and{" "}
                <strong>impact their environment and communities</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* BEIGE SECTION - VIDEO & HEADER */}
        <div className="bg-beige w-full">
          <section className="relative z-10 -mt-10 w-full">
            <div className="-mt-8 flex flex-col items-center justify-center px-4 md:-mt-16">
              {/* YOUTUBE VIDEO */}
              <div className="flex w-full justify-center">
                <div className="relative aspect-video w-full max-w-[601px]">
                  <iframe
                    className="h-full w-full rounded-lg"
                    src="https://www.youtube.com/embed/WjTpSPYIZvE?rel=0&modestbranding=1"
                    title="YouTube Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>

              {/* CENTER: HEADERS AND TEXT */}
              <div className="flex flex-col items-center gap-2 px-3 text-center md:max-w-5xl">
                <h2 className="mt-10 text-[26px] font-semibold tracking-normal">
                  Understanding the challenge and the opportunity
                </h2>
                {/* <p className="font-sans text-sm tracking-normal text-white md:text-base">
                  ​​​​​​​Developed by UNICEF, Partners, and young Africans, Yoma
                  has evolved into a global force in youth skills development,
                  community engagement, and bridge to employment opportunities.
                </p> */}
              </div>

              <div className="my-10 flex flex-col gap-4 rounded-xl bg-white p-4 md:max-w-5xl">
                <p className="font-sans text-sm font-semibold tracking-normal text-black md:text-base">
                  More than
                  <span className="text-orange mx-2 text-2xl">
                    1 billion young talents
                  </span>
                  are expected to enter the workforce by 2030. Given the limited
                  opportunities and to meet the changing demands of the labor
                  market, young people will need to be equipped with a set of
                  skills and competencies to compete globally and locally.
                </p>

                <p className="text-gray-dark font-sans text-sm tracking-tight md:text-base">
                  To address this issue, UNICEF and Foundation Botnar organised
                  workshops in 2019 with youth across Africa to gain a deeper
                  understanding of the challenges contributing to high youth
                  unemployment. Using a human-centered design thinking approach,
                  youth identified two key challenges:
                </p>

                {/* ROW OF 2 CARDS */}
                <div className="flex w-full flex-col gap-4 md:flex-row md:gap-0">
                  {/* CARD 1 */}
                  <div className="border-green flex w-full flex-col gap-4 border-l-2 bg-white px-6 py-4 text-white md:w-1/2">
                    <div className="flex flex-row items-center gap-4">
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#1C6B53] p-3">
                        <Image
                          src={imageLink}
                          alt="Link"
                          width={23}
                          height={23}
                          sizes="100vw"
                        />
                      </div>

                      <h1 className="font-sans text-sm font-semibold tracking-normal text-black md:text-base">
                        Fragmented Opportunities
                      </h1>
                    </div>
                    <p className="text-gray-dark -mt-4x font-sans text-sm tracking-tight md:text-base">
                      Youth expressed they feel lost in a fragmented system and
                      they struggle to identify meaningful opportunities that
                      will result in a job.
                    </p>
                  </div>

                  {/* CARD 2 */}
                  <div className="border-green flex w-full flex-col gap-4 border-l-2 bg-white px-6 py-4 text-white md:w-1/2">
                    <div className="flex flex-row items-center gap-4">
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#1C6B53] p-3">
                        <Image
                          src={imageExclaimation}
                          alt="Exclaimation"
                          width={6}
                          height={26}
                          sizes="100vw"
                        />
                      </div>

                      <h1 className="font-sans text-sm font-semibold tracking-normal text-black md:text-base">
                        Limited Access to Opportunities
                      </h1>
                    </div>
                    <p className="text-gray-dark -mt-4x font-sans text-sm tracking-tight md:text-base">
                      Opportunities are scarce, primarily concentrated in large
                      cities, and mostly accessible to more privileged
                      socio-economic groups. Additionally, there is a
                      significant mismatch between the growing number of youth
                      seeking employment and the limited availability of
                      suitable opportunities. Youth emphasised the need to
                      significantly increase access to opportunities.
                    </p>
                  </div>
                </div>

                {/* ROW */}
                <div className="bg-gray-light text-gray-dark rounded p-4 text-sm font-semibold">
                  Building on these insights, youth prototyped solutions, two of
                  which merged into the Youth Agency Marketplace - Yoma was
                  launched in 2020.
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* GREEN SECTION - YO-ID WITH FULL WIDTH BACKGROUND */}
        <div className="bg-green w-full">
          <div className="relative hidden justify-center pt-16 pb-16 lg:flex">
            <Image
              src={imageAboutInfo}
              alt="About Info"
              sizes="100vw"
              priority={true}
              style={{
                objectFit: "cover",
                zIndex: 20,
              }}
            />
          </div>

          <div className="relative justify-center px-4 pt-16 pb-16 lg:hidden">
            <div className="flex flex-col gap-8 text-white">
              <div className="flex flex-col gap-2">
                <h1 className="text-center text-[18px] font-semibold">Grow</h1>
                <div className="flex flex-row gap-4">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#1C6B53] p-3">
                    <Image
                      src={imagePlant}
                      alt="Grow"
                      width={42}
                      height={37}
                      sizes="100vw"
                    />
                  </div>

                  <p className="font-sans md:text-sm">
                    Improve young people&apos;s skills through learning
                    opportunities and showcase them on Yoma to pursue their
                    dreams
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="text-center text-[18px] font-semibold">
                  Impact
                </h1>
                <div className="flex flex-row gap-4">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#1C6B53] p-3">
                    <Image
                      src={imagePeople}
                      alt="People"
                      width={38}
                      height={32}
                      sizes="100vw"
                    />
                  </div>

                  <p className="font-sans md:text-sm">
                    Young people can make a difference in their community and
                    build a profile by participating in Yoma impact tasks
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="text-center text-[18px] font-semibold">
                  Thrive
                </h1>
                <div className="flex flex-row gap-4">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#1C6B53] p-3">
                    <Image
                      src={imageStats}
                      alt="Stats"
                      width={34}
                      height={33}
                      sizes="100vw"
                    />
                  </div>

                  <p className="font-sans md:text-sm">
                    Young people can track their progress on Yoma YoID and
                    unlock new skills by completing opportunities
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BEIGE SECTION - NEWS */}
        <div className="bg-beige w-full pb-8">
          <section className="z-10 w-full py-8">
            <div className="flex flex-col items-center justify-center px-4">
              {/* NEWS */}
              {lookups_NewsArticles?.items &&
                lookups_NewsArticles.items.length > 0 && (
                  <>
                    <div className="w-full max-w-7xl">
                      <ScrollableContainer className="flex gap-4 overflow-x-auto py-4 xl:gap-8">
                        {lookups_NewsArticles.items.map((article, index) => (
                          <NewsArticleCard key={index} data={article} />
                        ))}
                      </ScrollableContainer>
                    </div>

                    {lookup_NewsFeed && (
                      <Link
                        href={lookup_NewsFeed.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-rounded bg-green hover:bg-green/90 mt-10 w-full max-w-[300px] text-base text-white normal-case"
                      >
                        Read more{" "}
                        <span className="lowercase">
                          {lookup_NewsFeed.type}
                        </span>
                      </Link>
                    )}
                  </>
                )}

              {/* CENTER: HEADER AND CATEGORIES */}
              <div className="mt-8 flex flex-col items-center gap-2 px-6 text-center text-sm">
                <h2 className="text-[18px] font-semibold tracking-normal text-black md:text-[27px]">
                  Would you like to become a #Youth4Change? Explore Yoma.World
                  for more opportunities:
                </h2>
              </div>
            </div>
          </section>

          {/* FILTER: CATEGORIES */}
          {lookups_categories && lookups_categories.length > 0 && (
            <OpportunityCategoriesHorizontalFilter
              lookups_categories={lookups_categories}
              selected_categories={undefined}
              onClick={onClickCategoryFilter}
            />
          )}
        </div>

        {/* PURPLE SECTION - CONTACT US */}
        {/* <div className="bg-purple w-full">
          <section className="z-10 w-full pt-8 pb-8">
            <div className="flex flex-col items-center justify-center">

              <div className="flex w-full max-w-5xl flex-col gap-8 px-6 text-white md:flex-row">
                <div className="flex w-full flex-col gap-4">
                  <div className="flex flex-row items-center gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1C6B53]">
                      <Image
                        src={imageMessage}
                        alt="Link"
                        width={26}
                        height={26}
                        sizes="100vw"
                      />
                    </div>

                    <h1 className="text-2xl font-semibold">Contact Us</h1>
                  </div>
                  <p className="md:text-basex font-sans text-sm tracking-tight">
                    Whether you&apos;re curious about partnering with us,
                    working together on a project, or simply have a question
                    about what we do, let&apos;s talk! We&apos;d love to hear
                    from you, share ideas, and explore how we can create impact
                    together.
                  </p>
                </div>

                <div className="flex w-full flex-col gap-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const name = formData.get("name");
                      const email = formData.get("email");
                      const message = formData.get("message");

                      // Show success toast
                      toast.success(
                        "Thank you for your message! We'll get back to you soon.",
                      );

                      // Reset form
                      e.currentTarget.reset();
                    }}
                    className="flex flex-col gap-4"
                  >
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="focus:border-green focus:ring-green rounded-md bg-white px-4 py-2 text-black focus:ring-2 focus:outline-none"
                      placeholder="Your name"
                    />

                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="focus:border-green focus:ring-green rounded-md bg-white px-4 py-2 text-black focus:ring-2 focus:outline-none"
                      placeholder="Email"
                    />

                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      className="focus:border-green focus:ring-green rounded-md bg-white px-4 py-2 text-black focus:ring-2 focus:outline-none"
                      placeholder="Message"
                    />

                    <button
                      type="submit"
                      className="bg-green hover:bg-green-dark rounded-md px-6 py-3 font-semibold text-white transition-colors"
                    >
                      Submit
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </section>
        </div> */}

        {/* BEIGE SECTION - PARTNERS */}
        <div className="bg-beige w-full">
          <section className="pt-8x z-10 w-full pb-8">
            <div className="flex flex-col items-center justify-center px-4">
              {/* PARTNERS */}
              <PartnerLogos headerText="Our partners" />
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

About.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

About.theme = function getTheme() {
  return THEME_WHITE;
};

export default About;
