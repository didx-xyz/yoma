/* eslint-disable */
import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { type ParsedUrlQuery } from "querystring";
import { type ReactElement } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { type Organization } from "~/api/models/organisation";
import { getOrganisationById } from "~/api/services/organisations";
import MainLayout from "~/components/Layout/Main";
import { LogoTitle } from "~/components/Organisation/LogoTitle";
import { authOptions, type User } from "~/server/auth";
import Link from "next/link";
import {
  ROLE_ADMIN,
  ROLE_ORG_ADMIN,
  THEME_BLUE,
  THEME_GREEN,
} from "~/lib/constants";
import { AccessDenied } from "~/components/Status/AccessDenied";
import { NextPageWithLayout } from "~/pages/_app";

interface IParams extends ParsedUrlQuery {
  id: string;
}

// ⚠️ SSR
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

  // 👇 set theme based on role
  let theme;

  if (session?.user?.roles.includes(ROLE_ADMIN)) {
    theme = THEME_BLUE;
  } else if (session?.user?.roles.includes(ROLE_ORG_ADMIN)) {
    theme = THEME_GREEN;
  } else {
    return {
      props: {
        error: "Unauthorized",
      },
    };
  }

  const { id } = context.params as IParams;
  const queryClient = new QueryClient();

  // 👇 prefetch queries on server
  await queryClient.prefetchQuery(["organisation", id], () =>
    getOrganisationById(id, context),
  );

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
      id: id,
      theme: theme,
    },
  };
}

const OrganisationOverview: NextPageWithLayout<{
  id: string;
  user: User;
  error: string;
  theme: string;
}> = ({ id, error }) => {
  // 👇 use prefetched queries from server
  const { data: organisation } = useQuery<Organization>({
    queryKey: ["organisation", id],
    enabled: !error,
  });

  if (error) return <AccessDenied />;

  return (
    <div className="bg-lightest-grey font-small-12px-regular relative h-[969px] w-full overflow-hidden text-left text-sm text-white">
      <div className="bg-theme absolute bottom-[72.58%] left-[-0.02%] right-[0%] top-[0.02%] h-[27.41%] w-[100.03%]" />
      <div className="text-13xl absolute left-[112px] top-[105px] flex flex-col items-start justify-center">
        <div className="relative flex h-[38.03px] w-[589px] shrink-0 items-center font-semibold leading-[166%]">
          {/* Good morning, Julie ☀️ */}
          <LogoTitle
            logoUrl={organisation?.logoURL}
            title={organisation?.name}
          />
        </div>
        <div className="relative mt-[-5px] flex h-[38.03px] w-[589px] shrink-0 items-center text-sm leading-[153%]">
          <span className="w-full [line-break:anywhere]">
            <span>{`Your dashboard progress so far for the month of `}</span>
            <span className="font-semibold">April</span>
          </span>
        </div>
      </div>
      <div className="absolute left-[109.99px] top-[215px] flex flex-col items-start justify-start gap-[18px] text-base text-black">
        <div className="flex flex-row items-start justify-start gap-[18px]">
          <div className="relative h-[154px] w-[291px] rounded-2xl bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.08)]">
            <div className="absolute left-[22.99px] top-[12px] flex flex-col items-start justify-start gap-[14px]">
              <div className="flex flex-row items-end justify-start gap-[48px]">
                <div className="relative flex h-[20.59px] w-[178px] shrink-0 items-center leading-[140%]">
                  Total youth
                </div>
                <img
                  className="relative h-[30.27px] w-[30px]"
                  alt=""
                  src="/dashboardgreen.svg"
                />
              </div>
              <b className="text-13xl relative flex h-[25.14px] w-[218.08px] shrink-0 items-center leading-[166%]">
                832,221
              </b>
              <img
                className="relative h-[46.5px] w-[256.93px]"
                alt=""
                src="/charts-micro.svg"
              />
            </div>
          </div>
          <div className="relative h-[154px] w-[291px] rounded-2xl bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.08)]">
            <div className="absolute left-[22.99px] top-[12px] flex flex-col items-start justify-start gap-[13px]">
              <div className="flex flex-row items-end justify-start gap-[48px]">
                <div className="relative flex h-[20.59px] w-[178px] shrink-0 items-center leading-[140%]">
                  Verifications required
                </div>
                <div className="relative h-[30.27px] w-[30px]">
                  <div className="bg-primary-red absolute bottom-[0%] left-[0%] right-[0%] top-[0.89%] h-[99.11%] w-full rounded-md opacity-[0.2]" />
                  <img
                    className="absolute bottom-[16.96%] left-[11.67%] right-[11.67%] top-[16.96%] h-[66.08%] max-h-full w-[76.67%] max-w-full overflow-hidden"
                    alt=""
                    src="/alert2.svg"
                  />
                </div>
              </div>
              <b className="text-13xl relative flex h-[37.07px] w-[218.08px] shrink-0 items-center leading-[166%]">
                10
              </b>
              <div className="text-primary-green flex flex-row items-center justify-start gap-[6px] text-sm">
                <img
                  className="relative h-[22.43px] w-[22.43px]"
                  alt=""
                  src="/indicatorup1.svg"
                />
                <div className="relative flex h-[24.67px] w-[222.69px] shrink-0 items-center leading-[153%]">
                  <span className="w-full [line-break:anywhere]">
                    <span className="font-semibold">
                      <span>+27.02%</span>
                      <span className="text-light-grey">{` `}</span>
                    </span>
                    <span className="text-grey">monthly total so far</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="relative h-[154px] w-[291px] rounded-2xl bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.08)]">
            <div className="absolute left-[22.99px] top-[12px] flex flex-col items-start justify-start gap-[13px]">
              <div className="flex flex-row items-end justify-start gap-[48px]">
                <div className="relative flex h-[20.59px] w-[178px] shrink-0 items-center leading-[140%]">
                  ZLTO remaining
                </div>
                <img
                  className="relative h-[30.27px] w-[30px]"
                  alt=""
                  src="/dashboardgreen1.svg"
                />
              </div>
              <div className="text-13xl flex flex-row items-center justify-start gap-[6px]">
                <img
                  className="relative h-[26px] w-[29.9px] shrink-0 overflow-hidden"
                  alt=""
                  src="/zlto13.svg"
                />
                <b className="relative flex h-[37.07px] w-[218.08px] shrink-0 items-center leading-[166%]">
                  12,000
                </b>
              </div>
              <div className="text-primary-green flex flex-row items-center justify-start gap-[6px] text-sm">
                <img
                  className="relative h-[22.43px] w-[22.43px]"
                  alt=""
                  src="/indicatorup2.svg"
                />
                <div className="relative flex h-[24.67px] w-[222.69px] shrink-0 items-center leading-[153%]">
                  <span className="w-full [line-break:anywhere]">
                    <span className="font-semibold">
                      <span>+27.02%</span>
                      <span className="text-light-grey">{` `}</span>
                    </span>
                    <span className="text-grey">monthly total so far</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="relative h-[154px] w-[291px] rounded-2xl bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.08)]">
            <div className="absolute left-[22.99px] top-[12px] flex flex-col items-start justify-start gap-[13px]">
              <div className="flex flex-row items-end justify-start gap-[48px]">
                <div className="relative flex h-[20.59px] w-[178px] shrink-0 items-center leading-[140%]">
                  Credentials verified
                </div>
                <img
                  className="relative h-[30.27px] w-[30px]"
                  alt=""
                  src="/dashboardgreen2.svg"
                />
              </div>
              <b className="text-13xl relative flex h-[37.07px] w-[218.08px] shrink-0 items-center leading-[166%]">
                832,221
              </b>
              <div className="text-primary-green flex flex-row items-center justify-start gap-[6px] text-sm">
                <img
                  className="relative h-[22.43px] w-[22.43px]"
                  alt=""
                  src="/indicatorup3.svg"
                />
                <div className="relative flex h-[24.67px] w-[222.69px] shrink-0 items-center leading-[153%]">
                  <span className="w-full [line-break:anywhere]">
                    <span className="font-semibold">
                      <span>+27.02%</span>
                      <span className="text-light-grey">{` `}</span>
                    </span>
                    <span className="text-lightslategray">
                      monthly total so far
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <Link
            href={`/organisations/${id}/opportunities`}
            className="font-helvetica-neue relative inline-block h-[20.52px] w-[205.08px] shrink-0 text-lg font-medium leading-[119%]"
          >
            Opportunities
          </Link>
        </div>
        <div className="flex flex-row items-start justify-start gap-[18px]">
          <div className="relative h-[326px] w-[909px]">
            <div className="absolute left-[0px] top-[0px] flex flex-row items-start justify-start gap-[18px]">
              <div className="relative h-[154px] w-[291px] rounded-2xl bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.08)]">
                <div className="absolute left-[22.99px] top-[12px] flex flex-col items-start justify-start gap-[13px]">
                  <div className="flex flex-row items-end justify-start gap-[48px]">
                    <div className="relative flex h-[20.59px] w-[178px] shrink-0 items-center leading-[140%]">
                      Active opportunities
                    </div>
                    <div className="relative h-[30.27px] w-[30px]">
                      <div className="bg-primary-green absolute bottom-[0%] left-[0%] right-[0%] top-[0.89%] h-[99.11%] w-full rounded-md opacity-[0.2]" />
                      <img
                        className="absolute bottom-[18.61%] left-[13.58%] right-[13.58%] top-[18.61%] h-[62.77%] max-h-full w-[72.83%] max-w-full overflow-hidden"
                        alt=""
                        src="/opportunities4.svg"
                      />
                    </div>
                  </div>
                  <b className="text-13xl relative flex h-[37.07px] w-[218.08px] shrink-0 items-center leading-[166%]">
                    10
                  </b>
                  <div className="text-primary-green flex flex-row items-center justify-start gap-[6px] text-sm">
                    <img
                      className="relative h-[22.43px] w-[22.43px]"
                      alt=""
                      src="/indicatorup4.svg"
                    />
                    <div className="relative flex h-[24.67px] w-[222.69px] shrink-0 items-center leading-[153%]">
                      <span className="w-full [line-break:anywhere]">
                        <span className="font-semibold">
                          <span>+27.02%</span>
                          <span className="text-light-grey">{` `}</span>
                        </span>
                        <span className="text-grey">monthly total so far</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative h-[154px] w-[291px] rounded-2xl bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.08)]">
                <div className="absolute left-[22.99px] top-[12px] flex flex-col items-start justify-start gap-[13px]">
                  <div className="flex flex-row items-end justify-start gap-[48px]">
                    <div className="relative flex h-[20.59px] w-[178px] shrink-0 items-center leading-[140%]">
                      Opportunity drafts
                    </div>
                    <div className="relative h-[30.27px] w-[30px]">
                      <div className="bg-primary-green absolute bottom-[0%] left-[0%] right-[0%] top-[0.89%] h-[99.11%] w-full rounded-md opacity-[0.2]" />
                      <img
                        className="absolute bottom-[18.61%] left-[13.58%] right-[13.58%] top-[18.61%] h-[62.77%] max-h-full w-[72.83%] max-w-full overflow-hidden"
                        alt=""
                        src="/edit.svg"
                      />
                    </div>
                  </div>
                  <b className="text-13xl relative flex h-[37.07px] w-[218.08px] shrink-0 items-center leading-[166%]">
                    2
                  </b>
                  <div className="text-primary-green flex flex-row items-center justify-start gap-[6px] text-sm">
                    <img
                      className="relative h-[22.43px] w-[22.43px]"
                      alt=""
                      src="/indicatorup5.svg"
                    />
                    <div className="relative flex h-[24.67px] w-[222.69px] shrink-0 items-center leading-[153%]">
                      <span className="w-full [line-break:anywhere]">
                        <span className="font-semibold">
                          <span>+27.02%</span>
                          <span className="text-light-grey">{` `}</span>
                        </span>
                        <span className="text-grey">monthly total so far</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative h-[154px] w-[291px] rounded-2xl bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.08)]">
                <div className="absolute left-[22.99px] top-[12px] flex flex-col items-start justify-start gap-[13px]">
                  <div className="flex flex-row items-end justify-start gap-[21px]">
                    <div className="relative flex h-[20.59px] w-[203.2px] shrink-0 items-center leading-[140%]">
                      Completed opportunities
                    </div>
                    <div className="relative h-[30.27px] w-[30px]">
                      <div className="bg-primary-green absolute bottom-[0%] left-[0%] right-[0%] top-[0.89%] h-[99.11%] w-full rounded-md opacity-[0.2]" />
                      <img
                        className="absolute bottom-[18.61%] left-[13.58%] right-[13.58%] top-[18.61%] h-[62.77%] max-h-full w-[72.83%] max-w-full overflow-hidden"
                        alt=""
                        src="/opportunities5.svg"
                      />
                    </div>
                  </div>
                  <b className="text-13xl relative flex h-[37.07px] w-[218.08px] shrink-0 items-center leading-[166%]">
                    832,221
                  </b>
                  <div className="text-primary-green flex flex-row items-center justify-start gap-[6px] text-sm">
                    <img
                      className="relative h-[22.43px] w-[22.43px]"
                      alt=""
                      src="/indicatorup4.svg"
                    />
                    <div className="relative flex h-[24.67px] w-[222.69px] shrink-0 items-center leading-[153%]">
                      <span className="w-full [line-break:anywhere]">
                        <span className="font-semibold">
                          <span>+27.02%</span>
                          <span className="text-light-grey">{` `}</span>
                        </span>
                        <span className="text-grey">monthly total so far</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute left-[0px] top-[172px] flex flex-row items-start justify-start gap-[18px]">
              <div className="relative h-[154px] w-[291px] rounded-2xl bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.08)]">
                <div className="absolute left-[22.99px] top-[12px] flex flex-col items-start justify-start gap-[14px]">
                  <div className="flex flex-row items-end justify-start gap-[48px]">
                    <div className="relative flex h-[20.59px] w-[178px] shrink-0 items-center leading-[140%]">
                      Active participants
                    </div>
                    <img
                      className="relative h-[30.27px] w-[30px]"
                      alt=""
                      src="/dashboardgreen3.svg"
                    />
                  </div>
                  <b className="text-13xl relative flex h-[25.14px] w-[218.08px] shrink-0 items-center leading-[166%]">
                    832,221
                  </b>
                  <img
                    className="relative h-[46.5px] w-[256.93px]"
                    alt=""
                    src="/charts-micro1.svg"
                  />
                </div>
              </div>
              <div className="relative h-[154px] w-[291px] rounded-2xl bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.08)]">
                <div className="absolute left-[22.99px] top-[12px] flex flex-col items-start justify-start gap-[13px]">
                  <div className="flex flex-row items-end justify-start gap-[48px]">
                    <div className="relative flex h-[20.59px] w-[178px] shrink-0 items-center leading-[140%]">
                      Atingi trending skills
                    </div>
                    <div className="relative h-[30.27px] w-[30px]">
                      <div className="bg-primary-green absolute bottom-[0%] left-[0%] right-[0%] top-[0.89%] h-[99.11%] w-full rounded-md opacity-[0.2]" />
                      <img
                        className="absolute bottom-[18.61%] left-[13.58%] right-[13.58%] top-[18.61%] h-[62.77%] max-h-full w-[72.83%] max-w-full overflow-hidden"
                        alt=""
                        src="/skills1.svg"
                      />
                    </div>
                  </div>
                  <div className="text-grey relative h-[47px] w-[216px] text-center text-xs">
                    <div className="border-primary-green absolute left-[0px] top-[0px] box-border flex h-[21px] w-[94px] flex-row items-center justify-center rounded border-[1px] border-solid px-2.5 py-px">
                      <div className="relative flex h-[18.8px] w-[94px] shrink-0 items-center justify-center font-semibold leading-[137%]">
                        Data science
                      </div>
                    </div>
                    <div className="border-primary-green absolute left-[0px] top-[26px] box-border flex h-[21px] w-[72px] flex-row items-center justify-center rounded border-[1px] border-solid px-2.5 py-px">
                      <div className="relative flex h-[18.8px] w-[94px] shrink-0 items-center justify-center font-semibold leading-[137%]">
                        AI policy
                      </div>
                    </div>
                    <div className="border-primary-green absolute left-[100px] top-[0px] box-border flex h-[21px] w-11 flex-row items-center justify-center rounded border-[1px] border-solid px-2.5 py-px">
                      <div className="relative flex h-[18.8px] w-[94px] shrink-0 items-center justify-center font-semibold leading-[137%]">
                        AI
                      </div>
                    </div>
                    <div className="border-primary-green absolute left-[152px] top-[0px] box-border flex h-[21px] w-16 flex-row items-center justify-center rounded border-[1px] border-solid px-2.5 py-px">
                      <div className="relative flex h-[18.8px] w-[94px] shrink-0 items-center justify-center font-semibold leading-[137%]">
                        Coding
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="relative h-[327px] w-[291px] text-sm">
            <div className="absolute left-[0px] top-[0px] flex flex-row items-start justify-start">
              <div className="relative h-[327px] w-[291px] rounded-2xl bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.08)]">
                <div className="absolute left-[22.99px] top-[12px] flex flex-col items-start justify-start gap-[13px]">
                  <div className="flex h-[30.27px] flex-col items-start justify-start text-base">
                    <div className="flex flex-row items-end justify-start gap-[48px]">
                      <div className="relative flex h-[20.59px] w-[178px] shrink-0 items-center leading-[140%]">
                        Top opportunities
                      </div>
                      <div className="relative h-[30.27px] w-[30px]">
                        <div className="bg-primary-green absolute bottom-[0%] left-[0%] right-[0%] top-[0.89%] h-[99.11%] w-full rounded-md opacity-[0.2]" />
                        <img
                          className="absolute bottom-[18.61%] left-[13.58%] right-[13.58%] top-[18.61%] h-[62.77%] max-h-full w-[72.83%] max-w-full overflow-hidden"
                          alt=""
                          src="/opportunities6.svg"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex w-64 flex-row items-center justify-start gap-[12px]">
                    <img
                      className="relative h-[33px] w-[33px]"
                      alt=""
                      src="/logoatingi8.svg"
                    />
                    <div className="flex w-[203.47px] flex-row items-center justify-start gap-[1px]">
                      <div className="relative flex w-[164.63px] shrink-0 items-end leading-[153%]">
                        How to Get Involved in Artificial Intelligence
                      </div>
                      <div className="text-primary-green relative h-[20.99px] w-[46.23px] text-center text-xs">
                        <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[46.23px] rounded opacity-[0.15]" />
                        <div className="absolute left-[3.73px] top-[0px] flex flex-row items-center justify-start">
                          <img
                            className="relative h-3 w-[13.8px] shrink-0 overflow-hidden"
                            alt=""
                            src="/profile10.svg"
                          />
                          <div className="relative flex h-[20.29px] w-[26.74px] shrink-0 items-center justify-center font-semibold leading-[128%]">
                            300
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border-text-box-grey relative box-border h-px w-[267.88px] border-t-[1px] border-solid opacity-[0.4]" />
                  <div className="flex w-64 flex-row items-center justify-start gap-[12px]">
                    <img
                      className="relative h-[33px] w-[33px]"
                      alt=""
                      src="/logoatingi8.svg"
                    />
                    <div className="flex w-[203.47px] flex-row items-center justify-start gap-[1px]">
                      <div className="relative flex w-[164.63px] shrink-0 items-end leading-[153%]">
                        Introduction to Digital Marketing for Tourism..
                      </div>
                      <div className="text-primary-green relative h-[20.99px] w-[46.23px] text-center text-xs">
                        <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[46.23px] rounded opacity-[0.15]" />
                        <div className="absolute left-[3.73px] top-[0px] flex flex-row items-center justify-start">
                          <img
                            className="relative h-3 w-[13.8px] shrink-0 overflow-hidden"
                            alt=""
                            src="/profile10.svg"
                          />
                          <div className="relative flex h-[20.29px] w-[26.74px] shrink-0 items-center justify-center font-semibold leading-[128%]">
                            300
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border-text-box-grey relative box-border h-px w-[267.88px] border-t-[1px] border-solid opacity-[0.4]" />
                  <div className="flex w-64 flex-row items-center justify-start gap-[12px]">
                    <img
                      className="relative h-[33px] w-[33px]"
                      alt=""
                      src="/logoatingi9.svg"
                    />
                    <div className="flex w-[203.47px] flex-row items-center justify-start gap-[1px]">
                      <div className="relative flex w-[164.63px] shrink-0 items-end leading-[153%]">
                        Computer and Online Essentials
                      </div>
                      <div className="text-primary-green relative h-[20.99px] w-[46.23px] text-center text-xs">
                        <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[46.23px] rounded opacity-[0.15]" />
                        <div className="absolute left-[3.73px] top-[0px] flex flex-row items-center justify-start">
                          <img
                            className="relative h-3 w-[13.8px] shrink-0 overflow-hidden"
                            alt=""
                            src="/profile10.svg"
                          />
                          <div className="relative flex h-[20.29px] w-[26.74px] shrink-0 items-center justify-center font-semibold leading-[128%]">
                            300
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border-text-box-grey relative box-border h-px w-[267.88px] border-t-[1px] border-solid opacity-[0.4]" />
                  <div className="flex w-64 flex-row items-center justify-start gap-[12px]">
                    <img
                      className="relative h-[33px] w-[33px]"
                      alt=""
                      src="/logoatingi10.svg"
                    />
                    <div className="flex w-[203.47px] flex-row items-center justify-start gap-[1px]">
                      <div className="relative flex w-[164.63px] shrink-0 items-end leading-[153%]">
                        Why Tourism Business should be Sustainable
                      </div>
                      <div className="text-primary-green relative h-[20.99px] w-[46.23px] text-center text-xs">
                        <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[46.23px] rounded opacity-[0.15]" />
                        <div className="absolute left-[3.73px] top-[0px] flex flex-row items-center justify-start">
                          <img
                            className="relative h-3 w-[13.8px] shrink-0 overflow-hidden"
                            alt=""
                            src="/profile10.svg"
                          />
                          <div className="relative flex h-[20.29px] w-[26.74px] shrink-0 items-center justify-center font-semibold leading-[128%]">
                            300
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="font-helvetica-neue relative inline-block h-[20.52px] w-[205.08px] shrink-0 text-lg font-medium leading-[119%]">
          Demographics
        </div>
        <div className="flex flex-row items-start justify-start gap-[18px]">
          <div className="relative h-[167px] w-[291px] rounded-2xl bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.08)]">
            <div className="absolute left-[22.99px] top-[12px] flex flex-col items-start justify-start gap-[9px]">
              <div className="flex flex-row items-end justify-start">
                <div className="relative flex h-[20.59px] w-[178px] shrink-0 items-center leading-[140%]">
                  Location
                </div>
              </div>
              <div className="text-grey font-helvetica-neue flex flex-row items-center justify-start gap-[3px] text-xs">
                <div className="flex w-[145px] flex-col items-start justify-start gap-[7px]">
                  <div className="flex flex-row items-center justify-start gap-[8px]">
                    <div className="bg-primary-purple relative h-[12.6px] w-[12.6px] rounded-sm" />
                    <div className="relative inline-block h-[17px] w-[67.45px] shrink-0 leading-[153%]">
                      Cape Town
                    </div>
                  </div>
                  <div className="flex flex-row items-center justify-start gap-[8px]">
                    <div className="bg-primary-green relative h-[12.6px] w-[12.6px] rounded-sm" />
                    <div className="relative inline-block h-[17px] w-[75.08px] shrink-0 leading-[153%]">
                      Mpumalanga
                    </div>
                  </div>
                  <div className="flex flex-row items-center justify-start gap-[8px]">
                    <div className="bg-deepskyblue relative h-[12.6px] w-[12.6px] rounded-sm" />
                    <div className="relative inline-block h-[17px] w-[59.06px] shrink-0 leading-[153%]">
                      Gauteng
                    </div>
                  </div>
                  <div className="flex flex-row items-start justify-start gap-[8px]">
                    <div className="bg-primary-yellow relative h-[12.6px] w-[12.6px] rounded-sm" />
                    <div className="relative inline-block h-[15.26px] w-[87.48px] shrink-0 leading-[129%]">
                      Northern Cape
                    </div>
                  </div>
                </div>
                <div className="relative h-[104.02px] w-[104.02px] text-center">
                  <img
                    className="absolute bottom-[0%] left-[0%] right-[0%] top-[0%] h-full max-h-full w-full max-w-full overflow-hidden"
                    alt=""
                    src="/mask-group.svg"
                  />
                  <div className="absolute bottom-[6.28%] left-[55.97%] right-[4.58%] top-[70.63%] h-[23.1%] w-[39.45%]">
                    <div className="absolute bottom-[0%] left-[0%] right-[0%] top-[0%] h-full w-full rounded-xl bg-white shadow-[0px_4px_4px_rgba(0,_0,_0,_0.25)]" />
                    <div className="absolute left-[0.95%] top-[9.82%] inline-block h-[70.76%] w-[99.05%] font-medium leading-[153%]">
                      59%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="relative h-[167px] w-[291px] rounded-2xl bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.08)]">
            <div className="absolute left-[22.99px] top-[12px] flex flex-col items-start justify-start gap-[9px]">
              <div className="flex flex-row items-end justify-start">
                <div className="relative flex h-[20.59px] w-[178px] shrink-0 items-center leading-[140%]">
                  Gender
                </div>
              </div>
              <div className="text-grey font-helvetica-neue flex flex-row items-center justify-start gap-[3px] text-xs">
                <div className="flex w-[145px] flex-col items-start justify-start gap-[7px]">
                  <div className="flex flex-row items-center justify-start gap-[8px]">
                    <div className="bg-primary-purple relative h-[12.6px] w-[12.6px] rounded-sm" />
                    <div className="relative inline-block h-[17px] w-[67.45px] shrink-0 leading-[153%]">
                      Male
                    </div>
                  </div>
                  <div className="flex flex-row items-center justify-start gap-[8px]">
                    <div className="bg-primary-green relative h-[12.6px] w-[12.6px] rounded-sm" />
                    <div className="relative inline-block h-[17px] w-[75.08px] shrink-0 leading-[153%]">
                      Female
                    </div>
                  </div>
                  <div className="flex flex-row items-center justify-start gap-[8px]">
                    <div className="bg-primary-yellow relative h-[12.6px] w-[12.6px] rounded-sm" />
                    <div className="relative inline-block h-[17px] w-[59.06px] shrink-0 leading-[153%]">
                      Other
                    </div>
                  </div>
                </div>
                <img
                  className="relative h-[104.02px] w-[104.02px]"
                  alt=""
                  src="/mask-group1.svg"
                />
              </div>
            </div>
          </div>
          <div className="relative h-[167px] w-[291px] rounded-2xl bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.08)]">
            <div className="absolute left-[22.99px] top-[12px] flex flex-col items-start justify-start gap-[10px]">
              <div className="flex flex-row items-end justify-start">
                <div className="relative flex h-[20.59px] w-[178px] shrink-0 items-center leading-[140%]">
                  Age
                </div>
              </div>
              <div className="text-grey font-helvetica-neue flex flex-row items-center justify-start gap-[3px] text-xs">
                <div className="flex w-[145px] flex-col items-start justify-start gap-[5px]">
                  <div className="flex flex-row items-center justify-start gap-[8px]">
                    <div className="bg-primary-purple relative h-[12.6px] w-[12.6px] rounded-sm" />
                    <div className="relative inline-block h-[17px] w-[67.45px] shrink-0 leading-[153%]">
                      0-19
                    </div>
                  </div>
                  <div className="flex flex-row items-center justify-start gap-[8px]">
                    <div className="bg-primary-green relative h-[12.6px] w-[12.6px] rounded-sm" />
                    <div className="relative inline-block h-[17px] w-[75.08px] shrink-0 leading-[153%]">
                      20-24
                    </div>
                  </div>
                  <div className="flex flex-row items-center justify-start gap-[8px]">
                    <div className="bg-deepskyblue relative h-[12.6px] w-[12.6px] rounded-sm" />
                    <div className="relative inline-block h-[17px] w-[59.06px] shrink-0 leading-[153%]">
                      25-29
                    </div>
                  </div>
                  <div className="flex flex-row items-start justify-start gap-[8px]">
                    <div className="bg-primary-yellow relative h-[12.6px] w-[12.6px] rounded-sm" />
                    <div className="relative inline-block h-[15.26px] w-[87.48px] shrink-0 leading-[129%]">
                      30+
                    </div>
                  </div>
                  <div className="flex flex-row items-start justify-start gap-[8px]">
                    <div className="bg-primary-yellow relative h-[12.6px] w-[12.6px] rounded-sm" />
                    <div className="relative inline-block h-[15.26px] w-[87.48px] shrink-0 leading-[129%]">
                      Unspecified
                    </div>
                  </div>
                </div>
                <img
                  className="relative h-[104.02px] w-[104.02px]"
                  alt=""
                  src="/mask-group2.svg"
                />
              </div>
            </div>
          </div>
          <div className="relative h-[167px] w-[291px] rounded-2xl bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.08)]">
            <div className="absolute left-[22.99px] top-[12px] flex flex-col items-start justify-start gap-[9px]">
              <div className="flex flex-row items-end justify-start">
                <div className="relative flex h-[20.59px] w-[178px] shrink-0 items-center leading-[140%]">
                  Activity
                </div>
              </div>
              <div className="text-grey font-helvetica-neue flex flex-row items-center justify-start gap-[3px] text-xs">
                <div className="flex w-[145px] flex-col items-start justify-start gap-[7px]">
                  <div className="flex flex-row items-center justify-start gap-[8px]">
                    <div className="bg-primary-purple relative h-[12.6px] w-[12.6px] rounded-sm" />
                    <div className="relative inline-block h-[17px] w-[67.45px] shrink-0 leading-[153%]">
                      Active
                    </div>
                  </div>
                  <div className="flex flex-row items-center justify-start gap-[8px]">
                    <div className="bg-primary-yellow relative h-[12.6px] w-[12.6px] rounded-sm" />
                    <div className="relative inline-block h-[17px] w-[75.08px] shrink-0 leading-[153%]">
                      Inactive
                    </div>
                  </div>
                </div>
                <img
                  className="relative h-[104.02px] w-[104.02px]"
                  alt=""
                  src="/mask-group3.svg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute left-[210px] top-[372px] h-[15px] w-[83.67px]" />
      <div className="absolute left-[1121px] top-[159px] flex flex-row items-center justify-start gap-[9px] text-center">
        <div className="border-darkslateblue-100 box-border flex h-[38px] w-[171px] flex-row items-center justify-center gap-[10px] rounded-[23px] border-[1px] border-solid px-[19px] py-2">
          <div className="relative font-semibold leading-[153%]">
            1 April - 18 April
          </div>
          <img
            className="relative h-4 w-4 shrink-0 overflow-hidden"
            alt=""
            src="/iconforward3.svg"
          />
        </div>
        <img
          className="relative h-5 w-[23px] shrink-0 overflow-hidden"
          alt=""
          src="/download.svg"
        />
      </div>
    </div>
  );
};

OrganisationOverview.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

// 👇 return theme from component properties. this is set server-side (getServerSideProps)
OrganisationOverview.theme = function getTheme(page: ReactElement) {
  return page.props.theme;
};

export default OrganisationOverview;
/* eslint-enable */
