import { useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { type ReactElement } from "react";
import { type User, authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";
import NoRowsMessage from "~/components/NoRowsMessage";
import { Unauthorized } from "~/components/Status/Unauthorized";
import YoID from "~/components/Layout/YoID";
import Link from "next/link";
import { AvatarImage } from "~/components/AvatarImage";
import { getUserSkills } from "~/api/services/user";
import Suspense from "~/components/Common/Suspense";
import Breadcrumb from "~/components/Breadcrumb";
import Head from "next/head";
import { PaginationInfoComponent } from "~/components/PaginationInfo";
import { PAGE_SIZE } from "~/lib/constants";

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
    queryKey: ["User", "Skills"],
    queryFn: () => getUserSkills(),
    enabled: !error,
  });

  if (error) return <Unauthorized />;

  return (
    <>
      <Head>
        <title>Yoma | ⚡ Skills</title>
      </Head>

      <div className="w-full lg:max-w-7xl">
        <div className="mb-4 text-xs font-bold tracking-wider text-black md:text-base">
          <Breadcrumb
            items={[
              { title: "💳 Yo-ID", url: "/yoid" },
              {
                title: "⚡ Skills",
                selected: true,
              },
            ]}
          />
        </div>

        <Suspense isLoading={dataIsLoading} error={dataError}>
          {/* NO ROWS */}
          {!data?.length && (
            <div className="flex justify-center rounded-lg bg-white p-8 text-center">
              <NoRowsMessage
                title={"No completed skills found"}
                description={
                  "Skills that you receive by completing opportunities will be diplayed here."
                }
              />
            </div>
          )}

          {/* GRID */}
          {!!data?.length && (
            <div className="flex flex-col gap-4">
              {/* PAGINATION INFO */}
              <PaginationInfoComponent
                currentPage={1}
                itemCount={data?.length ?? 0}
                totalItems={data?.length ?? 0}
                pageSize={PAGE_SIZE}
                query={null}
              />

              {/* GRID */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.map((item, index) => (
                  <Link
                    key={`${item.id}_${index}`}
                    href={item?.infoURL ? (item?.infoURL as any) : "#noaction"}
                    className="shadow-custom flex h-[150px] flex-col rounded-lg bg-white p-4"
                    aria-disabled={item?.infoURL ? false : true}
                  >
                    <div className="flex h-full flex-col gap-2">
                      <div className="flex grow flex-row items-start justify-start">
                        <div className="flex flex-col items-start justify-start gap-2">
                          <p className="line-clamp-2 max-h-[45px] overflow-hidden text-base font-semibold text-ellipsis text-black">
                            {item.name}
                          </p>
                        </div>
                      </div>

                      <div className="text-gray-dark flex flex-row text-xs">
                        Skill issued by {item.organizations.length} partner
                        {item.organizations.length > 1 ? "s" : ""}
                      </div>

                      <div className="flex flex-row items-start overflow-hidden">
                        {item.organizations.map((org, index) => (
                          <div
                            className="-mr-4 flex w-fit items-center justify-center overflow-visible rounded-full bg-white"
                            style={{
                              zIndex: item.organizations.length - index,
                            }}
                            key={`${item.id}_${index}`}
                          >
                            <AvatarImage
                              icon={org.logoURL ?? null}
                              alt={`${org.name} Logo`}
                              size={40}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Suspense>
      </div>
    </>
  );
};

MySkills.getLayout = function getLayout(page: ReactElement) {
  return <YoID>{page}</YoID>;
};

export default MySkills;
