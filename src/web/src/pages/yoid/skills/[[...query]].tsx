import { QueryClient, dehydrate } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { type ReactElement } from "react";
import { type User, authOptions } from "~/server/auth";
import { type NextPageWithLayout } from "../../_app";
import { type ParsedUrlQuery } from "querystring";
import NoRowsMessage from "~/components/NoRowsMessage";
import { Unauthorized } from "~/components/Status/Unauthorized";
import YoIDTabbed from "~/components/Layout/YoIDTabbed";
import { userProfileAtom } from "~/lib/store";
import { useAtomValue } from "jotai";
import Link from "next/link";
import { config } from "~/lib/react-query-config";
import { AvatarImage } from "~/components/AvatarImage";

interface IParams extends ParsedUrlQuery {
  query?: string;
  page?: string;
}

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

  const queryClient = new QueryClient(config);
  const { id } = context.params as IParams;
  const { query, page } = context.query;

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      id: id ?? null,
      query: query ?? null,
      page: page ?? "1",
    },
  };
}

const MyCredentials: NextPageWithLayout<{
  user: User;
  query?: string;
  page?: string;
  error: string;
}> = ({ error }) => {
  const userProfile = useAtomValue(userProfileAtom);

  if (error) return <Unauthorized />;

  return (
    <>
      <div className="mb-8 mt-2 flex w-full flex-col gap-4">
        {/* NO ROWS */}
        {(userProfile?.skills === null ||
          userProfile?.skills === undefined ||
          userProfile?.skills.length === 0) && (
          <div className="flex justify-center rounded-lg bg-white p-8 text-center">
            <NoRowsMessage
              title={"No completed skills found"}
              description={
                "Skills that you receive by completing opportunities will be diplayed here."
              }
            />
          </div>
        )}

        {userProfile?.skills !== null &&
          userProfile?.skills !== undefined &&
          userProfile?.skills.length > 0 && (
            <div className="flex flex-col gap-4 px-4 md:px-0">
              <h5 className="font-bold tracking-wider">My Skills</h5>

              {/* GRID */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {userProfile?.skills.map((item, index) => (
                  <Link
                    key={`${item.id}_${index}`}
                    href={item?.infoURL ? (item?.infoURL as any) : "#noaction"}
                    className="flex h-[150px] flex-col rounded-lg bg-white p-4 shadow-custom"
                    aria-disabled={item?.infoURL ? false : true}
                  >
                    <div className="flex h-full flex-col gap-2">
                      <div className="flex flex-grow flex-row items-start justify-start">
                        <div className="flex flex-col items-start justify-start gap-2">
                          <p className="line-clamp-2 max-h-[45px] overflow-hidden text-ellipsis text-base font-semibold text-black">
                            {item.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-row text-xs text-gray-dark">
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
      </div>
    </>
  );
};

MyCredentials.getLayout = function getLayout(page: ReactElement) {
  return <YoIDTabbed>{page}</YoIDTabbed>;
};

export default MyCredentials;
