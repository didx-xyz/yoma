import { useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { type ReactElement } from "react";
import { IoFlashOutline } from "react-icons/io5";
import { UserSkillType } from "~/api/models/user";
import { getUserSkills } from "~/api/services/user";
import { AvatarImage } from "~/components/AvatarImage";
import Suspense from "~/components/Common/Suspense";
import YoID from "~/components/Layout/YoID";
import { TONE } from "~/components/Opportunity/TabbedDetails/DetailDisclosure";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { EmptyState, FIND_OPPORTUNITIES } from "~/components/YoID/EmptyState";
import { YoIDBreadcrumb } from "~/components/YoID/YoIDBreadcrumb";
import { INTRO_LINK_CLASS, YoIDIntro } from "~/components/YoID/YoIDIntro";
import {
  LoadingStatus,
  SkillsGridSkeleton,
} from "~/components/YoID/YoIDSkeletons";
import { YOID_TABS } from "~/components/YoID/yoidTabs";
import { OPPORTUNITIES_SEARCH_URL } from "~/lib/constants";
import { type User, authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  // 👇 ensure authenticated
  if (!session) {
    return {
      props: {
        error: "Unauthorized",
      },
    };
  }

  const { query, page } = context.query;

  return {
    props: {
      user: session?.user ?? null,
      query: query ?? null,
      page: page ?? "1",
    },
  };
}

const SKILL_TILE_CLASS =
  "shadow-custom flex flex-col gap-1 rounded-xl bg-white p-3";

const MySkills: NextPageWithLayout<{
  user: User;
  query?: string;
  page?: string;
  error: string;
}> = ({ error }) => {
  const {
    data: data,
    error: dataError,
    isLoading: dataIsLoading,
  } = useQuery({
    queryKey: ["User", "Skills", UserSkillType.Verified],
    queryFn: () => getUserSkills(UserSkillType.Verified),
    enabled: !error,
  });

  if (error) return <Unauthorized />;

  return (
    <>
      <Head>
        <title>Yoma | Skills</title>
      </Head>

      <YoIDBreadcrumb
        trail={[{ title: YOID_TABS.skills.label }]}
        count={data?.length}
      />
      <YoIDIntro>
        {YOID_TABS.skills.blurb}{" "}
        <Link href={OPPORTUNITIES_SEARCH_URL} className={INTRO_LINK_CLASS}>
          Find opportunities
        </Link>{" "}
        to earn more.
      </YoIDIntro>

      <LoadingStatus when={dataIsLoading} />
      <Suspense
        isLoading={dataIsLoading}
        error={dataError}
        loader={<SkillsGridSkeleton />}
      >
        {/* NO ROWS */}
        {!data?.length && (
          <EmptyState
            variant="page"
            icon={<IoFlashOutline />}
            toneClass={TONE.green}
            title="No skills yet"
            description="Each opportunity you complete adds the skills it taught you."
            action={FIND_OPPORTUNITIES}
          />
        )}

        {/* GRID — two columns on phones (tiles are two short lines, unlike the card pages'
            `CARD_GRID_CLASS`); a tile links out only when the skill has an info page */}
        {!!data?.length && (
          <div className="grid grid-cols-2 gap-3 min-[600px]:grid-cols-3 min-[900px]:grid-cols-4">
            {data.map((item, index) => {
              const body = (
                <>
                  <p className="line-clamp-2 text-sm leading-5 font-semibold text-black md:text-base">
                    {item.name}
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-gray-dark text-xs">
                      Skill issued by {item.organizations.length} partner
                      {item.organizations.length > 1 ? "s" : ""}
                    </p>

                    <div className="flex shrink-0 flex-row items-start overflow-hidden pr-2">
                      {item.organizations.map((org, orgIndex) => (
                        <div
                          className="-mr-2 flex w-fit items-center justify-center overflow-visible rounded-full bg-white"
                          style={{
                            zIndex: item.organizations.length - orgIndex,
                          }}
                          key={`${item.id}_${orgIndex}`}
                        >
                          <AvatarImage
                            icon={org.logoURL ?? null}
                            alt={`${org.name} Logo`}
                            size={24}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
              const key = `${item.id}_${index}`;

              return item.infoURL ? (
                <Link
                  key={key}
                  href={item.infoURL}
                  className={SKILL_TILE_CLASS}
                >
                  {body}
                </Link>
              ) : (
                <div key={key} className={SKILL_TILE_CLASS}>
                  {body}
                </div>
              );
            })}
          </div>
        )}
      </Suspense>
    </>
  );
};

MySkills.getLayout = function getLayout(page: ReactElement) {
  return <YoID>{page}</YoID>;
};

export default MySkills;
