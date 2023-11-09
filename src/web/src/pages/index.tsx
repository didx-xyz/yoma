/* eslint-disable */
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { type ReactElement } from "react";
import "react-datepicker/dist/react-datepicker.css";
import MainLayout from "~/components/Layout/Main";
import { authOptions, type User } from "~/server/auth";
import { NextPageWithLayout } from "./_app";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const queryClient = new QueryClient();
  const session = await getServerSession(context.req, context.res, authOptions);

  // await queryClient.prefetchQuery(["organisation", id], () =>
  //   getOrganisationById(id, context),
  // );

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
    },
  };
}

// NB: this a placeholder page for the home page
// exported from figma and everything it's absolutely positioned... don't do things like this!!!
const Home: NextPageWithLayout<{
  id: string;
  user: User;
}> = () => {
  // const { data: organisation } = useQuery<Organization>({
  //   queryKey: ["organisation", id],
  // });

  return (
    <div className="bg-lightest-grey text-mid font-p2-regular-14 relative h-[967px] w-full overflow-hidden text-left text-black">
      <div className="absolute bottom-[65.37%] left-[-0.02%] right-[0%] top-[-0.05%] h-[34.68%] w-[100.03%] bg-purple" />
      <div className="bg-aliceblue  absolute left-[1.95px] top-[335.05px] h-[261.04px] w-[1439.3px]" />
      <div className="absolute left-[373.78px] top-[106.79px] flex flex-col items-center justify-start gap-[11px] text-center text-3xl text-white">
        <div className="flex flex-col items-start justify-start gap-[2px]">
          <div className="relative inline-block h-[30.41px] w-[692.43px] shrink-0 font-semibold leading-[134%]">
            <span>{`Find `}</span>
            <span className="text-primary-yellow">opportunities</span>
            <span>{` to `}</span>
            <span className="text-primary-yellow">unlock</span>
            <span> your future.</span>
          </div>
          <div className="text-plum relative inline-block h-[30.41px] w-[692.43px] shrink-0 text-sm leading-[145%]">
            A learning opportunity is a self-paced online course that you can
            finish at your convenience.
          </div>
        </div>
        <div className="bg-darkslateblue box-border flex w-[627px] flex-row items-center justify-start gap-[11px] rounded-[7px] px-4 py-2.5 text-left text-sm">
          <img
            className="relative h-[19px] w-[21.85px] shrink-0 overflow-hidden"
            alt=""
            src="/search.svg"
          />
          <div className="relative leading-[145%]">
            What are you looking for today?
          </div>
        </div>
      </div>
      <div className="text-primary-purple absolute left-[6.31%] top-[55.78%] hidden h-[3.04%] w-[8.54%] font-semibold leading-[166%]">
        Digital CV
      </div>
      <img
        className="absolute bottom-[41.74%] left-[3.15%] right-[95.53%] top-[56.34%] hidden h-[1.93%] max-h-full w-[1.32%] max-w-full overflow-hidden"
        alt=""
        src="/icondigitalcv.svg"
      />
      <div className="text-menu-grey absolute left-[6.28%] top-[19.75%] hidden h-[3.04%] w-[8.54%] font-semibold leading-[166%]">
        Digital CV
      </div>
      <img
        className="absolute bottom-[77.77%] left-[3.12%] right-[95.56%] top-[20.31%] hidden h-[1.93%] max-h-full w-[1.32%] max-w-full overflow-hidden"
        alt=""
        src="/icondigitalcv1.svg"
      />
      <div className="absolute left-[112.5px] top-[434.79px] flex flex-col items-start justify-start gap-[18px] text-xs">
        <div className="flex w-[1214px] flex-row items-start justify-start gap-[18px] text-3xl">
          <div className="relative flex h-[24.69px] w-[904.86px] shrink-0 items-center font-semibold leading-[114%]">
            Welcome back, Linda! ☀️
          </div>
          <div className="text-light-grey relative flex h-[24.69px] w-[290.54px] shrink-0 items-center text-right text-xs font-semibold leading-[137%]">
            My profile
          </div>
        </div>
        <div className="text-grey box-border flex w-[1217px] flex-row items-start justify-start gap-[17px] py-0 pl-0 pr-[125px]">
          <div className="rounded-3xs box-border flex h-[85px] w-[291px] flex-row items-center justify-between bg-white py-0 pl-5 pr-0">
            <div className="flex flex-1 flex-col items-start justify-start gap-[2px]">
              <div className="flex flex-row items-center justify-start gap-[2px]">
                <div className="relative inline-block w-[236.61px] shrink-0 font-semibold leading-[137%]">
                  My Zlto balance
                </div>
                <img
                  className="relative h-[19px] w-[21.85px] shrink-0 overflow-hidden"
                  alt=""
                  src="/info1.svg"
                />
              </div>
              <div className="flex flex-row items-center justify-start gap-[6px] text-xl text-black">
                <img
                  className="relative h-[26px] w-[23.97px] shrink-0 overflow-hidden"
                  alt=""
                  src="/zlto-icon-white1.svg"
                />
                <div className="relative flex h-[36.81px] w-[121.67px] shrink-0 items-center font-semibold leading-[122%]">
                  50 000
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-3xs box-border flex h-[85px] w-[291px] flex-row items-center justify-between bg-white py-0 pl-5 pr-0">
            <div className="flex flex-1 flex-col items-start justify-start gap-[2px]">
              <div className="flex w-64 flex-row items-center justify-start">
                <div className="relative flex h-[20.68px] w-[235.65px] shrink-0 items-center font-semibold leading-[137%]">
                  My saved opportunities
                </div>
              </div>
              <div className="flex flex-row items-center justify-start text-xl text-black">
                <div className="relative flex h-[36.81px] w-[121.67px] shrink-0 items-center font-semibold leading-[122%]">
                  11
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-3xs box-border flex h-[85px] w-[291px] flex-row items-center justify-between bg-white py-0 pl-5 pr-0">
            <div className="flex flex-1 flex-col items-start justify-start gap-[2px]">
              <div className="flex w-64 flex-row items-center justify-start gap-[2px]">
                <div className="relative flex h-[20.68px] w-[235.65px] shrink-0 items-center font-semibold leading-[137%]">
                  Opportunities for approval
                </div>
                <div className="relative inline-block w-[15.24px] shrink-0 text-lg font-semibold leading-[137%]">
                  ⚠️
                </div>
              </div>
              <div className="flex flex-row items-center justify-start text-xl text-black">
                <div className="relative flex h-[36.81px] w-[121.67px] shrink-0 items-center font-semibold leading-[122%]">
                  2
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-3xs box-border flex h-[85px] w-[291px] flex-row items-center justify-between bg-white py-0 pl-5 pr-0">
            <div className="flex flex-1 flex-col items-start justify-start gap-[2px]">
              <div className="flex w-64 flex-row items-center justify-start">
                <div className="relative flex h-[20.68px] w-[235.65px] shrink-0 items-center font-semibold leading-[137%]">
                  Completed opportunities
                </div>
              </div>
              <div className="flex flex-row items-center justify-start text-xl text-black">
                <div className="relative flex h-[36.81px] w-[121.67px] shrink-0 items-center font-semibold leading-[122%]">
                  14
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative inline-block h-[24.69px] w-[290.54px] shrink-0 text-lg font-semibold leading-[134%] opacity-[0]">
          New opportunities 📢
        </div>
        <div className="flex flex-col items-start justify-start gap-[18px]">
          <div className="flex w-[1214px] flex-row items-start justify-start gap-[18px] text-lg">
            <div className="relative flex h-[24.69px] w-[904.86px] shrink-0 items-center font-semibold leading-[134%]">
              Popular 🔥
            </div>
            <div className="text-light-grey relative flex h-[24.69px] w-[290.54px] shrink-0 items-center text-right text-xs font-semibold leading-[137%]">
              View all
            </div>
          </div>
          <div className="text-grey flex flex-row items-start justify-start gap-[17px]">
            <div className="rounded-3xs relative h-[278px] w-[291px] bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
              <img
                className="absolute left-[236px] top-[15.82px] h-10 w-10 object-cover"
                alt=""
                src="/logoshield1@2x.png"
              />
              <div className="absolute left-[15px] top-[22.82px] flex flex-col items-start justify-start gap-[4px]">
                <div className="relative flex h-[11.13px] shrink-0 items-center self-stretch font-semibold leading-[128%]">
                  University of Cape Town
                </div>
                <div className="relative flex w-[217.56px] items-end text-lg font-semibold leading-[134%] text-black">{`Foundations of Food & Beverage Business`}</div>
                <div className="relative inline-block h-[83.87px] w-[260.14px] shrink-0 text-sm leading-[153%]">{`This self-paced course will introduce you to the world of Food and Beverage. You will learn about the various types of F&B businesses, the importance of...`}</div>
              </div>
              <div className="text-primary-green absolute left-[17.24px] top-[239px] flex flex-col items-start justify-start gap-[5px] text-center">
                <div className="flex w-[259px] flex-row items-start justify-start gap-[6px]">
                  <div className="text-secondary-purple relative hidden flex-1 self-stretch">
                    <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                    <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                      Impact
                    </div>
                    <img
                      className="absolute bottom-[20.39%] left-[9.69%] right-[77.51%] top-[21.36%] h-[58.25%] max-h-full w-[12.81%] max-w-full overflow-hidden"
                      alt=""
                      src="/vector1.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[57.95px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[57.95px] rounded opacity-[0.15]" />
                    <div className="absolute left-[29.07%] top-[4.9%] flex h-[91.78%] w-[67.56%] items-center justify-center font-semibold leading-[137%]">
                      4 hrs
                    </div>
                    <img
                      className="absolute left-[calc(50%_-_26.02px)] top-[calc(50%_-_7.35px)] h-3.5 w-[16.1px]"
                      alt=""
                      src="/expire2.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[63.46px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[63.46px] rounded opacity-[0.15]" />
                    <div className="absolute left-[2.15%] top-[4.9%] flex h-[91.78%] w-[96.2%] items-center justify-center font-semibold leading-[137%]">
                      Ongoing
                    </div>
                  </div>
                  <div className="relative hidden h-[20.23px] w-[37.76px] text-white">
                    <div className="bg-primary-yellow absolute bottom-[0%] left-[0%] right-[0%] top-[0%] h-full w-full rounded" />
                    <div className="absolute left-[2.05%] top-[4.9%] flex h-[91.78%] w-[97.95%] items-center justify-center font-semibold leading-[137%]">{`80% `}</div>
                  </div>
                  <div className="relative h-[20.99px] w-[46.23px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[46.23px] rounded opacity-[0.15]" />
                    <div className="absolute left-[39.17%] top-[0%] flex h-[96.69%] w-[57.85%] items-center justify-center font-semibold leading-[137%]">{`30 `}</div>
                    <img
                      className="absolute left-[7.45px] top-[4.15px] h-3 w-[13.8px] overflow-hidden"
                      alt=""
                      src="/profile2.svg"
                    />
                  </div>
                  <div className="text-dark-yellow flex flex-row items-start justify-start">
                    <div className="relative h-[20.99px] w-[49.14px]">
                      <div className="bg-dark-yellow absolute left-[0px] top-[0px] h-[20.99px] w-[48.15px] rounded opacity-[0.15]" />
                      <div className="absolute left-[34.29%] top-[4.9%] flex h-[91.78%] w-[65.71%] items-center justify-center font-semibold leading-[137%]">
                        500
                      </div>
                      <img
                        className="absolute left-[4.15px] top-[3.95px] h-[13px] w-[14.95px] overflow-hidden"
                        alt=""
                        src="/zlto3.svg"
                      />
                      <img
                        className="absolute left-[7.3px] top-[4.86px] hidden h-[11.78px] w-[11.79px] object-cover"
                        alt=""
                        src="/zlto-logos11-11@2x.png"
                      />
                    </div>
                  </div>
                </div>
                <div className="text-secondary-purple relative hidden h-[21px] w-[79px]">
                  <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                  <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                    Learning
                  </div>
                  <img
                    className="absolute left-[3.11px] top-[4.43px] h-3 w-[13.8px] overflow-hidden"
                    alt=""
                    src="/opportunities1.svg"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-3xs relative h-[278px] w-[291px] bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
              <img
                className="absolute left-[236px] top-[15.82px] h-10 w-10"
                alt=""
                src="/logoatingi3.svg"
              />
              <div className="absolute left-[15px] top-[22.82px] flex flex-col items-start justify-start gap-[4px]">
                <div className="relative flex h-[11.13px] shrink-0 items-center self-stretch font-semibold leading-[137%]">
                  Atingi
                </div>
                <div className="relative flex w-[217.56px] items-end text-lg font-semibold leading-[134%] text-black">
                  A Career in Tourism
                </div>
                <div className="relative inline-block h-[83.87px] w-[260.14px] shrink-0 text-sm leading-[153%]">
                  This self-paced course will help you explore tourism as an
                  industry and see the job opportunities it can offer.
                </div>
              </div>
              <div className="text-primary-green absolute left-[17.24px] top-[239px] flex flex-col items-start justify-start gap-[5px] text-center">
                <div className="flex w-[259px] flex-row items-start justify-start gap-[6px]">
                  <div className="text-secondary-purple relative hidden flex-1 self-stretch">
                    <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                    <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                      Impact
                    </div>
                    <img
                      className="absolute bottom-[20.39%] left-[9.69%] right-[77.51%] top-[21.36%] h-[58.25%] max-h-full w-[12.81%] max-w-full overflow-hidden"
                      alt=""
                      src="/vector1.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[57.95px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[57.95px] rounded opacity-[0.15]" />
                    <div className="absolute left-[29.07%] top-[4.9%] flex h-[91.78%] w-[67.56%] items-center justify-center font-semibold leading-[137%]">
                      4 hrs
                    </div>
                    <img
                      className="absolute left-[calc(50%_-_26.02px)] top-[calc(50%_-_7.35px)] h-3.5 w-[16.1px]"
                      alt=""
                      src="/expire3.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[63.46px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[63.46px] rounded opacity-[0.15]" />
                    <div className="absolute left-[2.15%] top-[4.9%] flex h-[91.78%] w-[96.2%] items-center justify-center font-semibold leading-[137%]">
                      Ongoing
                    </div>
                  </div>
                  <div className="relative hidden h-[20.23px] w-[37.76px] text-white">
                    <div className="bg-primary-yellow absolute bottom-[0%] left-[0%] right-[0%] top-[0%] h-full w-full rounded" />
                    <div className="absolute left-[2.05%] top-[4.9%] flex h-[91.78%] w-[97.95%] items-center justify-center font-semibold leading-[137%]">{`80% `}</div>
                  </div>
                  <div className="relative h-[20.99px] w-[46.23px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[46.23px] rounded opacity-[0.15]" />
                    <div className="absolute left-[39.17%] top-[0%] flex h-[96.69%] w-[57.85%] items-center justify-center font-semibold leading-[137%]">{`30 `}</div>
                    <img
                      className="absolute left-[7.45px] top-[4.15px] h-3 w-[13.8px] overflow-hidden"
                      alt=""
                      src="/profile3.svg"
                    />
                  </div>
                  <div className="text-dark-yellow flex flex-row items-start justify-start">
                    <div className="relative h-[20.99px] w-[49.14px]">
                      <div className="bg-dark-yellow absolute left-[0px] top-[0px] h-[20.99px] w-[48.15px] rounded opacity-[0.15]" />
                      <div className="absolute left-[34.29%] top-[4.9%] flex h-[91.78%] w-[65.71%] items-center justify-center font-semibold leading-[137%]">
                        500
                      </div>
                      <img
                        className="absolute left-[4.15px] top-[3.95px] h-[13px] w-[14.95px] overflow-hidden"
                        alt=""
                        src="/zlto4.svg"
                      />
                      <img
                        className="absolute left-[7.3px] top-[4.86px] hidden h-[11.78px] w-[11.79px] object-cover"
                        alt=""
                        src="/zlto-logos11-11@2x.png"
                      />
                    </div>
                  </div>
                </div>
                <div className="text-secondary-purple relative hidden h-[21px] w-[79px]">
                  <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                  <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                    Learning
                  </div>
                  <img
                    className="absolute left-[3.11px] top-[4.43px] h-3 w-[13.8px] overflow-hidden"
                    alt=""
                    src="/opportunities2.svg"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-3xs relative h-[278px] w-[291px] bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
              <img
                className="absolute left-[236px] top-[15.82px] h-10 w-10 object-cover"
                alt=""
                src="/logoshield1@2x.png"
              />
              <div className="absolute left-[15px] top-[22.82px] flex flex-col items-start justify-start gap-[4px]">
                <div className="relative flex h-[11.13px] shrink-0 items-center self-stretch font-semibold leading-[128%]">
                  University of Cape Town
                </div>
                <div className="relative flex w-[217.56px] items-end text-lg font-semibold leading-[134%] text-black">
                  <span className="w-full [line-break:anywhere]">
                    <p className="m-0">
                      Why Tourism Business should be Sustainable
                    </p>
                    <p className="m-0">Training</p>
                  </span>
                </div>
                <div className="relative inline-block h-[83.87px] w-[260.14px] shrink-0 text-sm leading-[153%]">
                  his self-paced course will help you get a better understanding
                  about sustainability. You will learn what sustainability
                  comprises of and why ...
                </div>
              </div>
              <div className="text-primary-green absolute left-[17.24px] top-[239px] flex flex-col items-start justify-start gap-[5px] text-center">
                <div className="flex w-[259px] flex-row items-start justify-start gap-[6px]">
                  <div className="text-secondary-purple relative hidden flex-1 self-stretch">
                    <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                    <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                      Impact
                    </div>
                    <img
                      className="absolute bottom-[20.39%] left-[9.69%] right-[77.51%] top-[21.36%] h-[58.25%] max-h-full w-[12.81%] max-w-full overflow-hidden"
                      alt=""
                      src="/vector2.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[57.95px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[57.95px] rounded opacity-[0.15]" />
                    <div className="absolute left-[29.07%] top-[4.9%] flex h-[91.78%] w-[67.56%] items-center justify-center font-semibold leading-[137%]">
                      4 hrs
                    </div>
                    <img
                      className="absolute left-[calc(50%_-_26.02px)] top-[calc(50%_-_7.35px)] h-3.5 w-[16.1px]"
                      alt=""
                      src="/expire3.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[63.46px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[63.46px] rounded opacity-[0.15]" />
                    <div className="absolute left-[2.15%] top-[4.9%] flex h-[91.78%] w-[96.2%] items-center justify-center font-semibold leading-[137%]">
                      Ongoing
                    </div>
                  </div>
                  <div className="relative hidden h-[20.23px] w-[37.76px] text-white">
                    <div className="bg-primary-yellow absolute bottom-[0%] left-[0%] right-[0%] top-[0%] h-full w-full rounded" />
                    <div className="absolute left-[2.05%] top-[4.9%] flex h-[91.78%] w-[97.95%] items-center justify-center font-semibold leading-[137%]">{`80% `}</div>
                  </div>
                  <div className="relative h-[20.99px] w-[46.23px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[46.23px] rounded opacity-[0.15]" />
                    <div className="absolute left-[39.17%] top-[0%] flex h-[96.69%] w-[57.85%] items-center justify-center font-semibold leading-[137%]">{`30 `}</div>
                    <img
                      className="absolute left-[7.45px] top-[4.15px] h-3 w-[13.8px] overflow-hidden"
                      alt=""
                      src="/profile4.svg"
                    />
                  </div>
                  <div className="text-dark-yellow flex flex-row items-start justify-start">
                    <div className="relative h-[20.99px] w-[49.14px]">
                      <div className="bg-dark-yellow absolute left-[0px] top-[0px] h-[20.99px] w-[48.15px] rounded opacity-[0.15]" />
                      <div className="absolute left-[34.29%] top-[4.9%] flex h-[91.78%] w-[65.71%] items-center justify-center font-semibold leading-[137%]">
                        500
                      </div>
                      <img
                        className="absolute left-[4.15px] top-[3.95px] h-[13px] w-[14.95px] overflow-hidden"
                        alt=""
                        src="/zlto5.svg"
                      />
                      <img
                        className="absolute left-[7.3px] top-[4.86px] hidden h-[11.78px] w-[11.79px] object-cover"
                        alt=""
                        src="/zlto-logos11-11@2x.png"
                      />
                    </div>
                  </div>
                </div>
                <div className="text-secondary-purple relative hidden h-[21px] w-[79px]">
                  <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                  <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                    Learning
                  </div>
                  <img
                    className="absolute left-[3.11px] top-[4.43px] h-3 w-[13.8px] overflow-hidden"
                    alt=""
                    src="/opportunities2.svg"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-3xs relative h-[278px] w-[291px] bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
              <img
                className="absolute left-[236px] top-[15.82px] h-10 w-10"
                alt=""
                src="/logoatingi4.svg"
              />
              <div className="absolute left-[15px] top-[22.82px] flex flex-col items-start justify-start gap-[4px]">
                <div className="relative flex h-[11.13px] shrink-0 items-center self-stretch font-semibold leading-[137%]">
                  Atingi
                </div>
                <div className="relative flex w-[217.56px] items-end text-lg font-semibold leading-[134%] text-black">
                  A Career in Hospitality
                </div>
                <div className="relative inline-block h-[83.87px] w-[260.14px] shrink-0 text-sm leading-[153%]">
                  This self-paced course will help you explore hospitality as an
                  industry and see the job opportunities it can offer. You will
                  find out what skills are ...
                </div>
              </div>
              <div className="text-primary-green absolute left-[17.24px] top-[239px] flex flex-col items-start justify-start gap-[5px] text-center">
                <div className="flex w-[259px] flex-row items-start justify-start gap-[6px]">
                  <div className="text-secondary-purple relative hidden flex-1 self-stretch">
                    <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                    <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                      Impact
                    </div>
                    <img
                      className="absolute bottom-[20.39%] left-[9.69%] right-[77.51%] top-[21.36%] h-[58.25%] max-h-full w-[12.81%] max-w-full overflow-hidden"
                      alt=""
                      src="/vector2.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[57.95px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[57.95px] rounded opacity-[0.15]" />
                    <div className="absolute left-[29.07%] top-[4.9%] flex h-[91.78%] w-[67.56%] items-center justify-center font-semibold leading-[137%]">
                      4 hrs
                    </div>
                    <img
                      className="absolute left-[calc(50%_-_26.02px)] top-[calc(50%_-_7.35px)] h-3.5 w-[16.1px]"
                      alt=""
                      src="/expire3.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[63.46px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[63.46px] rounded opacity-[0.15]" />
                    <div className="absolute left-[2.15%] top-[4.9%] flex h-[91.78%] w-[96.2%] items-center justify-center font-semibold leading-[137%]">
                      Ongoing
                    </div>
                  </div>
                  <div className="relative hidden h-[20.23px] w-[37.76px] text-white">
                    <div className="bg-primary-yellow absolute bottom-[0%] left-[0%] right-[0%] top-[0%] h-full w-full rounded" />
                    <div className="absolute left-[2.05%] top-[4.9%] flex h-[91.78%] w-[97.95%] items-center justify-center font-semibold leading-[137%]">{`80% `}</div>
                  </div>
                  <div className="relative h-[20.99px] w-[46.23px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[46.23px] rounded opacity-[0.15]" />
                    <div className="absolute left-[39.17%] top-[0%] flex h-[96.69%] w-[57.85%] items-center justify-center font-semibold leading-[137%]">{`30 `}</div>
                    <img
                      className="absolute left-[7.45px] top-[4.15px] h-3 w-[13.8px] overflow-hidden"
                      alt=""
                      src="/profile3.svg"
                    />
                  </div>
                  <div className="text-dark-yellow flex flex-row items-start justify-start">
                    <div className="relative h-[20.99px] w-[49.14px]">
                      <div className="bg-dark-yellow absolute left-[0px] top-[0px] h-[20.99px] w-[48.15px] rounded opacity-[0.15]" />
                      <div className="absolute left-[34.29%] top-[4.9%] flex h-[91.78%] w-[65.71%] items-center justify-center font-semibold leading-[137%]">
                        500
                      </div>
                      <img
                        className="absolute left-[4.15px] top-[3.95px] h-[13px] w-[14.95px] overflow-hidden"
                        alt=""
                        src="/zlto4.svg"
                      />
                      <img
                        className="absolute left-[7.3px] top-[4.86px] hidden h-[11.78px] w-[11.79px] object-cover"
                        alt=""
                        src="/zlto-logos11-11@2x.png"
                      />
                    </div>
                  </div>
                </div>
                <div className="text-secondary-purple relative hidden h-[21px] w-[79px]">
                  <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                  <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                    Learning
                  </div>
                  <img
                    className="absolute left-[3.11px] top-[4.43px] h-3 w-[13.8px] overflow-hidden"
                    alt=""
                    src="/opportunities2.svg"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex w-[1214px] flex-row items-start justify-start gap-[18px] text-lg">
            <div className="relative flex h-[24.69px] w-[904.86px] shrink-0 items-center font-semibold leading-[134%]">
              Latest courses 📚
            </div>
            <div className="text-light-grey relative flex h-[24.69px] w-[290.54px] shrink-0 items-center text-right text-xs font-semibold leading-[137%]">
              View all
            </div>
          </div>
          <div className="text-grey flex flex-row items-start justify-start gap-[17px]">
            <div className="rounded-3xs relative h-[278px] w-[291px] bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
              <img
                className="absolute left-[236px] top-[15.82px] h-10 w-10 object-cover"
                alt=""
                src="/logoshield2@2x.png"
              />
              <div className="absolute left-[15px] top-[22.82px] flex flex-col items-start justify-start gap-[4px]">
                <div className="relative flex h-[11.13px] shrink-0 items-center self-stretch font-semibold leading-[128%]">
                  University of Cape Town
                </div>
                <div className="relative flex w-[217.56px] items-end text-lg font-semibold leading-[134%] text-black">{`Foundations of Food & Beverage Business`}</div>
                <div className="relative inline-block h-[83.87px] w-[260.14px] shrink-0 text-sm leading-[153%]">{`This self-paced course will introduce you to the world of Food and Beverage. You will learn about the various types of F&B businesses, the importance of...`}</div>
              </div>
              <div className="text-primary-green absolute left-[17.24px] top-[239px] flex flex-col items-start justify-start gap-[5px] text-center">
                <div className="flex w-[259px] flex-row items-start justify-start gap-[6px]">
                  <div className="text-secondary-purple relative hidden flex-1 self-stretch">
                    <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                    <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                      Impact
                    </div>
                    <img
                      className="absolute bottom-[20.39%] left-[9.69%] right-[77.51%] top-[21.36%] h-[58.25%] max-h-full w-[12.81%] max-w-full overflow-hidden"
                      alt=""
                      src="/vector3.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[57.95px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[57.95px] rounded opacity-[0.15]" />
                    <div className="absolute left-[29.07%] top-[4.9%] flex h-[91.78%] w-[67.56%] items-center justify-center font-semibold leading-[137%]">
                      4 hrs
                    </div>
                    <img
                      className="absolute left-[calc(50%_-_26.02px)] top-[calc(50%_-_7.35px)] h-3.5 w-[16.1px]"
                      alt=""
                      src="/expire4.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[63.46px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[63.46px] rounded opacity-[0.15]" />
                    <div className="absolute left-[2.15%] top-[4.9%] flex h-[91.78%] w-[96.2%] items-center justify-center font-semibold leading-[137%]">
                      Ongoing
                    </div>
                  </div>
                  <div className="relative hidden h-[20.23px] w-[37.76px] text-white">
                    <div className="bg-primary-yellow absolute bottom-[0%] left-[0%] right-[0%] top-[0%] h-full w-full rounded" />
                    <div className="absolute left-[2.05%] top-[4.9%] flex h-[91.78%] w-[97.95%] items-center justify-center font-semibold leading-[137%]">{`80% `}</div>
                  </div>
                  <div className="relative h-[20.99px] w-[46.23px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[46.23px] rounded opacity-[0.15]" />
                    <div className="absolute left-[39.17%] top-[0%] flex h-[96.69%] w-[57.85%] items-center justify-center font-semibold leading-[137%]">{`30 `}</div>
                    <img
                      className="absolute left-[7.45px] top-[4.15px] h-3 w-[13.8px] overflow-hidden"
                      alt=""
                      src="/profile5.svg"
                    />
                  </div>
                  <div className="text-dark-yellow flex flex-row items-start justify-start">
                    <div className="relative h-[20.99px] w-[49.14px]">
                      <div className="bg-dark-yellow absolute left-[0px] top-[0px] h-[20.99px] w-[48.15px] rounded opacity-[0.15]" />
                      <div className="absolute left-[34.29%] top-[4.9%] flex h-[91.78%] w-[65.71%] items-center justify-center font-semibold leading-[137%]">
                        500
                      </div>
                      <img
                        className="absolute left-[4.15px] top-[3.95px] h-[13px] w-[14.95px] overflow-hidden"
                        alt=""
                        src="/zlto6.svg"
                      />
                      <img
                        className="absolute left-[7.3px] top-[4.86px] hidden h-[11.78px] w-[11.79px] object-cover"
                        alt=""
                        src="/zlto-logos11-12@2x.png"
                      />
                    </div>
                  </div>
                </div>
                <div className="text-secondary-purple relative hidden h-[21px] w-[79px]">
                  <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                  <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                    Learning
                  </div>
                  <img
                    className="absolute left-[3.11px] top-[4.43px] h-3 w-[13.8px] overflow-hidden"
                    alt=""
                    src="/opportunities3.svg"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-3xs relative h-[278px] w-[291px] bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
              <img
                className="absolute left-[236px] top-[15.82px] h-10 w-10"
                alt=""
                src="/logoatingi5.svg"
              />
              <div className="absolute left-[15px] top-[22.82px] flex flex-col items-start justify-start gap-[4px]">
                <div className="relative flex h-[11.13px] shrink-0 items-center self-stretch font-semibold leading-[137%]">
                  Atingi
                </div>
                <div className="relative flex w-[217.56px] items-end text-lg font-semibold leading-[134%] text-black">
                  A Career in Tourism
                </div>
                <div className="relative inline-block h-[83.87px] w-[260.14px] shrink-0 text-sm leading-[153%]">
                  This self-paced course will help you explore tourism as an
                  industry and see the job opportunities it can offer.
                </div>
              </div>
              <div className="text-primary-green absolute left-[17.24px] top-[239px] flex flex-col items-start justify-start gap-[5px] text-center">
                <div className="flex w-[259px] flex-row items-start justify-start gap-[6px]">
                  <div className="text-secondary-purple relative hidden flex-1 self-stretch">
                    <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                    <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                      Impact
                    </div>
                    <img
                      className="absolute bottom-[20.39%] left-[9.69%] right-[77.51%] top-[21.36%] h-[58.25%] max-h-full w-[12.81%] max-w-full overflow-hidden"
                      alt=""
                      src="/vector3.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[57.95px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[57.95px] rounded opacity-[0.15]" />
                    <div className="absolute left-[29.07%] top-[4.9%] flex h-[91.78%] w-[67.56%] items-center justify-center font-semibold leading-[137%]">
                      4 hrs
                    </div>
                    <img
                      className="absolute left-[calc(50%_-_26.02px)] top-[calc(50%_-_7.35px)] h-3.5 w-[16.1px]"
                      alt=""
                      src="/expire5.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[63.46px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[63.46px] rounded opacity-[0.15]" />
                    <div className="absolute left-[2.15%] top-[4.9%] flex h-[91.78%] w-[96.2%] items-center justify-center font-semibold leading-[137%]">
                      Ongoing
                    </div>
                  </div>
                  <div className="relative hidden h-[20.23px] w-[37.76px] text-white">
                    <div className="bg-primary-yellow absolute bottom-[0%] left-[0%] right-[0%] top-[0%] h-full w-full rounded" />
                    <div className="absolute left-[2.05%] top-[4.9%] flex h-[91.78%] w-[97.95%] items-center justify-center font-semibold leading-[137%]">{`80% `}</div>
                  </div>
                  <div className="relative h-[20.99px] w-[46.23px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[46.23px] rounded opacity-[0.15]" />
                    <div className="absolute left-[39.17%] top-[0%] flex h-[96.69%] w-[57.85%] items-center justify-center font-semibold leading-[137%]">{`30 `}</div>
                    <img
                      className="absolute left-[7.45px] top-[4.15px] h-3 w-[13.8px] overflow-hidden"
                      alt=""
                      src="/profile6.svg"
                    />
                  </div>
                  <div className="text-dark-yellow flex flex-row items-start justify-start">
                    <div className="relative h-[20.99px] w-[49.14px]">
                      <div className="bg-dark-yellow absolute left-[0px] top-[0px] h-[20.99px] w-[48.15px] rounded opacity-[0.15]" />
                      <div className="absolute left-[34.29%] top-[4.9%] flex h-[91.78%] w-[65.71%] items-center justify-center font-semibold leading-[137%]">
                        500
                      </div>
                      <img
                        className="absolute left-[4.15px] top-[3.95px] h-[13px] w-[14.95px] overflow-hidden"
                        alt=""
                        src="/zlto7.svg"
                      />
                      <img
                        className="absolute left-[7.3px] top-[4.86px] hidden h-[11.78px] w-[11.79px] object-cover"
                        alt=""
                        src="/zlto-logos11-12@2x.png"
                      />
                    </div>
                  </div>
                </div>
                <div className="text-secondary-purple relative hidden h-[21px] w-[79px]">
                  <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                  <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                    Learning
                  </div>
                  <img
                    className="absolute left-[3.11px] top-[4.43px] h-3 w-[13.8px] overflow-hidden"
                    alt=""
                    src="/opportunities4.svg"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-3xs relative h-[278px] w-[291px] bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
              <img
                className="absolute left-[236px] top-[15.82px] h-10 w-10 object-cover"
                alt=""
                src="/logoshield2@2x.png"
              />
              <div className="absolute left-[15px] top-[22.82px] flex flex-col items-start justify-start gap-[4px]">
                <div className="relative flex h-[11.13px] shrink-0 items-center self-stretch font-semibold leading-[128%]">
                  University of Cape Town
                </div>
                <div className="relative flex w-[217.56px] items-end text-lg font-semibold leading-[134%] text-black">
                  <span className="w-full [line-break:anywhere]">
                    <p className="m-0">
                      Why Tourism Business should be Sustainable
                    </p>
                    <p className="m-0">Training</p>
                  </span>
                </div>
                <div className="relative inline-block h-[83.87px] w-[260.14px] shrink-0 text-sm leading-[153%]">
                  his self-paced course will help you get a better understanding
                  about sustainability. You will learn what sustainability
                  comprises of and why ...
                </div>
              </div>
              <div className="text-primary-green absolute left-[17.24px] top-[239px] flex flex-col items-start justify-start gap-[5px] text-center">
                <div className="flex w-[259px] flex-row items-start justify-start gap-[6px]">
                  <div className="text-secondary-purple relative hidden flex-1 self-stretch">
                    <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                    <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                      Impact
                    </div>
                    <img
                      className="absolute bottom-[20.39%] left-[9.69%] right-[77.51%] top-[21.36%] h-[58.25%] max-h-full w-[12.81%] max-w-full overflow-hidden"
                      alt=""
                      src="/vector4.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[57.95px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[57.95px] rounded opacity-[0.15]" />
                    <div className="absolute left-[29.07%] top-[4.9%] flex h-[91.78%] w-[67.56%] items-center justify-center font-semibold leading-[137%]">
                      4 hrs
                    </div>
                    <img
                      className="absolute left-[calc(50%_-_26.02px)] top-[calc(50%_-_7.35px)] h-3.5 w-[16.1px]"
                      alt=""
                      src="/expire5.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[63.46px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[63.46px] rounded opacity-[0.15]" />
                    <div className="absolute left-[2.15%] top-[4.9%] flex h-[91.78%] w-[96.2%] items-center justify-center font-semibold leading-[137%]">
                      Ongoing
                    </div>
                  </div>
                  <div className="relative hidden h-[20.23px] w-[37.76px] text-white">
                    <div className="bg-primary-yellow absolute bottom-[0%] left-[0%] right-[0%] top-[0%] h-full w-full rounded" />
                    <div className="absolute left-[2.05%] top-[4.9%] flex h-[91.78%] w-[97.95%] items-center justify-center font-semibold leading-[137%]">{`80% `}</div>
                  </div>
                  <div className="relative h-[20.99px] w-[46.23px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[46.23px] rounded opacity-[0.15]" />
                    <div className="absolute left-[39.17%] top-[0%] flex h-[96.69%] w-[57.85%] items-center justify-center font-semibold leading-[137%]">{`30 `}</div>
                    <img
                      className="absolute left-[7.45px] top-[4.15px] h-3 w-[13.8px] overflow-hidden"
                      alt=""
                      src="/profile7.svg"
                    />
                  </div>
                  <div className="text-dark-yellow flex flex-row items-start justify-start">
                    <div className="relative h-[20.99px] w-[49.14px]">
                      <div className="bg-dark-yellow absolute left-[0px] top-[0px] h-[20.99px] w-[48.15px] rounded opacity-[0.15]" />
                      <div className="absolute left-[34.29%] top-[4.9%] flex h-[91.78%] w-[65.71%] items-center justify-center font-semibold leading-[137%]">
                        500
                      </div>
                      <img
                        className="absolute left-[4.15px] top-[3.95px] h-[13px] w-[14.95px] overflow-hidden"
                        alt=""
                        src="/zlto8.svg"
                      />
                      <img
                        className="absolute left-[7.3px] top-[4.86px] hidden h-[11.78px] w-[11.79px] object-cover"
                        alt=""
                        src="/zlto-logos11-12@2x.png"
                      />
                    </div>
                  </div>
                </div>
                <div className="text-secondary-purple relative hidden h-[21px] w-[79px]">
                  <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                  <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                    Learning
                  </div>
                  <img
                    className="absolute left-[3.11px] top-[4.43px] h-3 w-[13.8px] overflow-hidden"
                    alt=""
                    src="/opportunities4.svg"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-3xs relative h-[278px] w-[291px] bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
              <img
                className="absolute left-[236px] top-[15.82px] h-10 w-10"
                alt=""
                src="/logoatingi6.svg"
              />
              <div className="absolute left-[15px] top-[22.82px] flex flex-col items-start justify-start gap-[4px]">
                <div className="relative flex h-[11.13px] shrink-0 items-center self-stretch font-semibold leading-[137%]">
                  Atingi
                </div>
                <div className="relative flex w-[217.56px] items-end text-lg font-semibold leading-[134%] text-black">
                  A Career in Hospitality
                </div>
                <div className="relative inline-block h-[83.87px] w-[260.14px] shrink-0 text-sm leading-[153%]">
                  This self-paced course will help you explore hospitality as an
                  industry and see the job opportunities it can offer. You will
                  find out what skills are ...
                </div>
              </div>
              <div className="text-primary-green absolute left-[17.24px] top-[239px] flex flex-col items-start justify-start gap-[5px] text-center">
                <div className="flex w-[259px] flex-row items-start justify-start gap-[6px]">
                  <div className="text-secondary-purple relative hidden flex-1 self-stretch">
                    <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                    <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                      Impact
                    </div>
                    <img
                      className="absolute bottom-[20.39%] left-[9.69%] right-[77.51%] top-[21.36%] h-[58.25%] max-h-full w-[12.81%] max-w-full overflow-hidden"
                      alt=""
                      src="/vector4.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[57.95px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[57.95px] rounded opacity-[0.15]" />
                    <div className="absolute left-[29.07%] top-[4.9%] flex h-[91.78%] w-[67.56%] items-center justify-center font-semibold leading-[137%]">
                      4 hrs
                    </div>
                    <img
                      className="absolute left-[calc(50%_-_26.02px)] top-[calc(50%_-_7.35px)] h-3.5 w-[16.1px]"
                      alt=""
                      src="/expire5.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[63.46px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[63.46px] rounded opacity-[0.15]" />
                    <div className="absolute left-[2.15%] top-[4.9%] flex h-[91.78%] w-[96.2%] items-center justify-center font-semibold leading-[137%]">
                      Ongoing
                    </div>
                  </div>
                  <div className="relative hidden h-[20.23px] w-[37.76px] text-white">
                    <div className="bg-primary-yellow absolute bottom-[0%] left-[0%] right-[0%] top-[0%] h-full w-full rounded" />
                    <div className="absolute left-[2.05%] top-[4.9%] flex h-[91.78%] w-[97.95%] items-center justify-center font-semibold leading-[137%]">{`80% `}</div>
                  </div>
                  <div className="relative h-[20.99px] w-[46.23px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[46.23px] rounded opacity-[0.15]" />
                    <div className="absolute left-[39.17%] top-[0%] flex h-[96.69%] w-[57.85%] items-center justify-center font-semibold leading-[137%]">{`30 `}</div>
                    <img
                      className="absolute left-[7.45px] top-[4.15px] h-3 w-[13.8px] overflow-hidden"
                      alt=""
                      src="/profile6.svg"
                    />
                  </div>
                  <div className="text-dark-yellow flex flex-row items-start justify-start">
                    <div className="relative h-[20.99px] w-[49.14px]">
                      <div className="bg-dark-yellow absolute left-[0px] top-[0px] h-[20.99px] w-[48.15px] rounded opacity-[0.15]" />
                      <div className="absolute left-[34.29%] top-[4.9%] flex h-[91.78%] w-[65.71%] items-center justify-center font-semibold leading-[137%]">
                        500
                      </div>
                      <img
                        className="absolute left-[4.15px] top-[3.95px] h-[13px] w-[14.95px] overflow-hidden"
                        alt=""
                        src="/zlto7.svg"
                      />
                      <img
                        className="absolute left-[7.3px] top-[4.86px] hidden h-[11.78px] w-[11.79px] object-cover"
                        alt=""
                        src="/zlto-logos11-12@2x.png"
                      />
                    </div>
                  </div>
                </div>
                <div className="text-secondary-purple relative hidden h-[21px] w-[79px]">
                  <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                  <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                    Learning
                  </div>
                  <img
                    className="absolute left-[3.11px] top-[4.43px] h-3 w-[13.8px] overflow-hidden"
                    alt=""
                    src="/opportunities4.svg"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex w-[1214px] flex-row items-start justify-start text-lg">
            <div className="relative flex h-[24.69px] w-[904.86px] shrink-0 items-center font-semibold leading-[134%]">
              All courses
            </div>
          </div>
          <div className="text-grey flex flex-row items-start justify-start gap-[17px]">
            <div className="rounded-3xs relative h-[278px] w-[291px] bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
              <img
                className="absolute left-[236px] top-[15.82px] h-10 w-10 object-cover"
                alt=""
                src="/logoshield3@2x.png"
              />
              <div className="absolute left-[15px] top-[22.82px] flex flex-col items-start justify-start gap-[4px]">
                <div className="relative flex h-[11.13px] shrink-0 items-center self-stretch font-semibold leading-[137%]">
                  University of Cape Town
                </div>
                <div className="relative flex w-[217.56px] items-end text-lg font-semibold leading-[134%] text-black">
                  Design Thinking
                </div>
                <div className="relative inline-block h-[83.87px] w-[260.14px] shrink-0 text-sm leading-[153%]">
                  In this self-study course, you will get to know the method of
                  Design Thinking and learn how to apply this method in your
                  projects.
                </div>
              </div>
              <div className="text-primary-green absolute left-[17.24px] top-[239px] flex flex-col items-start justify-start gap-[5px] text-center">
                <div className="flex w-[259px] flex-row items-start justify-start gap-[6px]">
                  <div className="text-secondary-purple relative hidden flex-1 self-stretch">
                    <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                    <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                      Impact
                    </div>
                    <img
                      className="absolute bottom-[20.39%] left-[9.69%] right-[77.51%] top-[21.36%] h-[58.25%] max-h-full w-[12.81%] max-w-full overflow-hidden"
                      alt=""
                      src="/vector5.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[57.95px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[57.95px] rounded opacity-[0.15]" />
                    <div className="absolute left-[29.07%] top-[4.9%] flex h-[91.78%] w-[67.56%] items-center justify-center font-semibold leading-[137%]">
                      4 hrs
                    </div>
                    <img
                      className="absolute left-[calc(50%_-_26.02px)] top-[calc(50%_-_7.35px)] h-3.5 w-[16.1px]"
                      alt=""
                      src="/expire6.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[63.46px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[63.46px] rounded opacity-[0.15]" />
                    <div className="absolute left-[2.15%] top-[4.9%] flex h-[91.78%] w-[96.2%] items-center justify-center font-semibold leading-[137%]">
                      Ongoing
                    </div>
                  </div>
                  <div className="relative hidden h-[20.23px] w-[37.76px] text-white">
                    <div className="bg-primary-yellow absolute bottom-[0%] left-[0%] right-[0%] top-[0%] h-full w-full rounded" />
                    <div className="absolute left-[2.05%] top-[4.9%] flex h-[91.78%] w-[97.95%] items-center justify-center font-semibold leading-[137%]">{`80% `}</div>
                  </div>
                  <div className="relative h-[20.99px] w-[46.23px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[46.23px] rounded opacity-[0.15]" />
                    <div className="absolute left-[39.17%] top-[0%] flex h-[96.69%] w-[57.85%] items-center justify-center font-semibold leading-[137%]">{`30 `}</div>
                    <img
                      className="absolute left-[7.45px] top-[4.15px] h-3 w-[13.8px] overflow-hidden"
                      alt=""
                      src="/profile8.svg"
                    />
                  </div>
                  <div className="text-dark-yellow flex flex-row items-start justify-start">
                    <div className="relative h-[20.99px] w-[49.14px]">
                      <div className="bg-dark-yellow absolute left-[0px] top-[0px] h-[20.99px] w-[48.15px] rounded opacity-[0.15]" />
                      <div className="absolute left-[34.29%] top-[4.9%] flex h-[91.78%] w-[65.71%] items-center justify-center font-semibold leading-[137%]">
                        500
                      </div>
                      <img
                        className="absolute left-[4.15px] top-[3.95px] h-[13px] w-[14.95px] overflow-hidden"
                        alt=""
                        src="/zlto9.svg"
                      />
                      <img
                        className="absolute left-[7.3px] top-[4.86px] hidden h-[11.78px] w-[11.79px] object-cover"
                        alt=""
                        src="/zlto-logos11-13@2x.png"
                      />
                    </div>
                  </div>
                </div>
                <div className="text-secondary-purple relative hidden h-[21px] w-[79px]">
                  <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                  <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                    Action
                  </div>
                  <img
                    className="absolute bottom-[20.39%] left-[9.69%] right-[77.51%] top-[21.36%] h-[58.25%] max-h-full w-[12.81%] max-w-full overflow-hidden"
                    alt=""
                    src="/vector6.svg"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-3xs relative h-[278px] w-[291px] bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
              <img
                className="absolute left-[236px] top-[15.82px] h-10 w-10 object-cover"
                alt=""
                src="/logoshield3@2x.png"
              />
              <div className="absolute left-[15px] top-[22.82px] flex flex-col items-start justify-start gap-[4px]">
                <div className="relative flex h-[11.13px] shrink-0 items-center self-stretch font-semibold leading-[137%]">
                  University of Cape Town
                </div>
                <div className="relative flex w-[217.56px] items-end text-lg font-semibold leading-[134%] text-black">
                  Design Thinking
                </div>
                <div className="relative inline-block h-[83.87px] w-[260.14px] shrink-0 text-sm leading-[153%]">
                  In this self-study course, you will get to know the method of
                  Design Thinking and learn how to apply this method in your
                  projects.
                </div>
              </div>
              <div className="text-primary-green absolute left-[17.24px] top-[239px] flex flex-col items-start justify-start gap-[5px] text-center">
                <div className="flex w-[259px] flex-row items-start justify-start gap-[6px]">
                  <div className="text-secondary-purple relative hidden flex-1 self-stretch">
                    <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                    <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                      Impact
                    </div>
                    <img
                      className="absolute bottom-[20.39%] left-[9.69%] right-[77.51%] top-[21.36%] h-[58.25%] max-h-full w-[12.81%] max-w-full overflow-hidden"
                      alt=""
                      src="/vector5.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[57.95px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[57.95px] rounded opacity-[0.15]" />
                    <div className="absolute left-[29.07%] top-[4.9%] flex h-[91.78%] w-[67.56%] items-center justify-center font-semibold leading-[137%]">
                      4 hrs
                    </div>
                    <img
                      className="absolute left-[calc(50%_-_26.02px)] top-[calc(50%_-_7.35px)] h-3.5 w-[16.1px]"
                      alt=""
                      src="/expire7.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[63.46px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[63.46px] rounded opacity-[0.15]" />
                    <div className="absolute left-[2.15%] top-[4.9%] flex h-[91.78%] w-[96.2%] items-center justify-center font-semibold leading-[137%]">
                      Ongoing
                    </div>
                  </div>
                  <div className="relative hidden h-[20.23px] w-[37.76px] text-white">
                    <div className="bg-primary-yellow absolute bottom-[0%] left-[0%] right-[0%] top-[0%] h-full w-full rounded" />
                    <div className="absolute left-[2.05%] top-[4.9%] flex h-[91.78%] w-[97.95%] items-center justify-center font-semibold leading-[137%]">{`80% `}</div>
                  </div>
                  <div className="relative h-[20.99px] w-[46.23px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[46.23px] rounded opacity-[0.15]" />
                    <div className="absolute left-[39.17%] top-[0%] flex h-[96.69%] w-[57.85%] items-center justify-center font-semibold leading-[137%]">{`30 `}</div>
                    <img
                      className="absolute left-[7.45px] top-[4.15px] h-3 w-[13.8px] overflow-hidden"
                      alt=""
                      src="/profile9.svg"
                    />
                  </div>
                  <div className="text-dark-yellow flex flex-row items-start justify-start">
                    <div className="relative h-[20.99px] w-[49.14px]">
                      <div className="bg-dark-yellow absolute left-[0px] top-[0px] h-[20.99px] w-[48.15px] rounded opacity-[0.15]" />
                      <div className="absolute left-[34.29%] top-[4.9%] flex h-[91.78%] w-[65.71%] items-center justify-center font-semibold leading-[137%]">
                        500
                      </div>
                      <img
                        className="absolute left-[4.15px] top-[3.95px] h-[13px] w-[14.95px] overflow-hidden"
                        alt=""
                        src="/zlto10.svg"
                      />
                      <img
                        className="absolute left-[7.3px] top-[4.86px] hidden h-[11.78px] w-[11.79px] object-cover"
                        alt=""
                        src="/zlto-logos11-13@2x.png"
                      />
                    </div>
                  </div>
                </div>
                <div className="text-secondary-purple relative hidden h-[21px] w-[79px]">
                  <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                  <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                    Action
                  </div>
                  <img
                    className="absolute bottom-[20.39%] left-[9.69%] right-[77.51%] top-[21.36%] h-[58.25%] max-h-full w-[12.81%] max-w-full overflow-hidden"
                    alt=""
                    src="/vector6.svg"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-3xs relative h-[278px] w-[291px] bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
              <img
                className="absolute left-[236px] top-[15.82px] h-10 w-10"
                alt=""
                src="/logoatingi7.svg"
              />
              <div className="absolute left-[15px] top-[22.82px] flex flex-col items-start justify-start gap-[4px]">
                <div className="relative flex h-[11.13px] shrink-0 items-center self-stretch font-semibold leading-[137%]">
                  Atingi
                </div>
                <div className="relative flex w-[217.56px] items-end text-lg font-semibold leading-[134%] text-black">
                  Computer and Online Essentials
                </div>
                <div className="relative inline-block h-[83.87px] w-[260.14px] shrink-0 text-sm leading-[153%]">{`The Computer & Online Essentials module covers the main concepts and skills needed for using computers and devices, file and application..`}</div>
              </div>
              <div className="text-primary-green absolute left-[17.24px] top-[239px] flex flex-col items-start justify-start gap-[5px] text-center">
                <div className="flex w-[259px] flex-row items-start justify-start gap-[6px]">
                  <div className="text-secondary-purple relative hidden flex-1 self-stretch">
                    <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                    <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                      Impact
                    </div>
                    <img
                      className="absolute bottom-[20.39%] left-[9.69%] right-[77.51%] top-[21.36%] h-[58.25%] max-h-full w-[12.81%] max-w-full overflow-hidden"
                      alt=""
                      src="/vector7.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[57.95px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[57.95px] rounded opacity-[0.15]" />
                    <div className="absolute left-[29.07%] top-[4.9%] flex h-[91.78%] w-[67.56%] items-center justify-center font-semibold leading-[137%]">
                      4 hrs
                    </div>
                    <img
                      className="absolute left-[calc(50%_-_26.02px)] top-[calc(50%_-_7.35px)] h-3.5 w-[16.1px]"
                      alt=""
                      src="/expire7.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[63.46px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[63.46px] rounded opacity-[0.15]" />
                    <div className="absolute left-[2.15%] top-[4.9%] flex h-[91.78%] w-[96.2%] items-center justify-center font-semibold leading-[137%]">
                      Ongoing
                    </div>
                  </div>
                  <div className="relative hidden h-[20.23px] w-[37.76px] text-white">
                    <div className="bg-primary-yellow absolute bottom-[0%] left-[0%] right-[0%] top-[0%] h-full w-full rounded" />
                    <div className="absolute left-[2.05%] top-[4.9%] flex h-[91.78%] w-[97.95%] items-center justify-center font-semibold leading-[137%]">{`80% `}</div>
                  </div>
                  <div className="relative h-[20.99px] w-[46.23px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[46.23px] rounded opacity-[0.15]" />
                    <div className="absolute left-[39.17%] top-[0%] flex h-[96.69%] w-[57.85%] items-center justify-center font-semibold leading-[137%]">{`30 `}</div>
                    <img
                      className="absolute left-[7.45px] top-[4.15px] h-3 w-[13.8px] overflow-hidden"
                      alt=""
                      src="/profile10.svg"
                    />
                  </div>
                  <div className="text-dark-yellow flex flex-row items-start justify-start">
                    <div className="relative h-[20.99px] w-[49.14px]">
                      <div className="bg-dark-yellow absolute left-[0px] top-[0px] h-[20.99px] w-[48.15px] rounded opacity-[0.15]" />
                      <div className="absolute left-[34.29%] top-[4.9%] flex h-[91.78%] w-[65.71%] items-center justify-center font-semibold leading-[137%]">
                        500
                      </div>
                      <img
                        className="absolute left-[4.15px] top-[3.95px] h-[13px] w-[14.95px] overflow-hidden"
                        alt=""
                        src="/zlto11.svg"
                      />
                      <img
                        className="absolute left-[7.3px] top-[4.86px] hidden h-[11.78px] w-[11.79px] object-cover"
                        alt=""
                        src="/zlto-logos11-13@2x.png"
                      />
                    </div>
                  </div>
                </div>
                <div className="text-secondary-purple relative hidden h-[21px] w-[79px]">
                  <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                  <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                    Action
                  </div>
                  <img
                    className="absolute bottom-[20.39%] left-[9.69%] right-[77.51%] top-[21.36%] h-[58.25%] max-h-full w-[12.81%] max-w-full overflow-hidden"
                    alt=""
                    src="/vector8.svg"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-3xs relative h-[278px] w-[291px] bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
              <img
                className="absolute left-[236px] top-[15.82px] h-10 w-10 object-cover"
                alt=""
                src="/logoshield3@2x.png"
              />
              <div className="absolute left-[15px] top-[22.82px] flex flex-col items-start justify-start gap-[4px]">
                <div className="relative flex h-[11.13px] shrink-0 items-center self-stretch font-semibold leading-[128%]">
                  University of Cape Town
                </div>
                <div className="relative flex w-[217.56px] items-end text-lg font-semibold leading-[134%] text-black">
                  Safely working from home
                </div>
                <div className="relative inline-block h-[83.87px] w-[260.14px] shrink-0 text-sm leading-[153%]">
                  This online training course offers an introduction to cyber
                  security in the private workplace and provides basic and
                  advanced IT security rules for...
                </div>
              </div>
              <div className="text-primary-green absolute left-[17.24px] top-[239px] flex flex-col items-start justify-start gap-[5px] text-center">
                <div className="flex w-[259px] flex-row items-start justify-start gap-[6px]">
                  <div className="text-secondary-purple relative hidden flex-1 self-stretch">
                    <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                    <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                      Impact
                    </div>
                    <img
                      className="absolute bottom-[20.39%] left-[9.69%] right-[77.51%] top-[21.36%] h-[58.25%] max-h-full w-[12.81%] max-w-full overflow-hidden"
                      alt=""
                      src="/vector7.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[57.95px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[57.95px] rounded opacity-[0.15]" />
                    <div className="absolute left-[29.07%] top-[4.9%] flex h-[91.78%] w-[67.56%] items-center justify-center font-semibold leading-[137%]">
                      4 hrs
                    </div>
                    <img
                      className="absolute left-[calc(50%_-_26.02px)] top-[calc(50%_-_7.35px)] h-3.5 w-[16.1px]"
                      alt=""
                      src="/expire7.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[63.46px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[63.46px] rounded opacity-[0.15]" />
                    <div className="absolute left-[2.15%] top-[4.9%] flex h-[91.78%] w-[96.2%] items-center justify-center font-semibold leading-[137%]">
                      Ongoing
                    </div>
                  </div>
                  <div className="relative hidden h-[20.23px] w-[37.76px] text-white">
                    <div className="bg-primary-yellow absolute bottom-[0%] left-[0%] right-[0%] top-[0%] h-full w-full rounded" />
                    <div className="absolute left-[2.05%] top-[4.9%] flex h-[91.78%] w-[97.95%] items-center justify-center font-semibold leading-[137%]">{`80% `}</div>
                  </div>
                  <div className="relative h-[20.99px] w-[46.23px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[46.23px] rounded opacity-[0.15]" />
                    <div className="absolute left-[39.17%] top-[0%] flex h-[96.69%] w-[57.85%] items-center justify-center font-semibold leading-[137%]">{`30 `}</div>
                    <img
                      className="absolute left-[7.45px] top-[4.15px] h-3 w-[13.8px] overflow-hidden"
                      alt=""
                      src="/profile9.svg"
                    />
                  </div>
                  <div className="text-dark-yellow flex flex-row items-start justify-start">
                    <div className="relative h-[20.99px] w-[49.14px]">
                      <div className="bg-dark-yellow absolute left-[0px] top-[0px] h-[20.99px] w-[48.15px] rounded opacity-[0.15]" />
                      <div className="absolute left-[34.29%] top-[4.9%] flex h-[91.78%] w-[65.71%] items-center justify-center font-semibold leading-[137%]">
                        500
                      </div>
                      <img
                        className="absolute left-[4.15px] top-[3.95px] h-[13px] w-[14.95px] overflow-hidden"
                        alt=""
                        src="/zlto10.svg"
                      />
                      <img
                        className="absolute left-[7.3px] top-[4.86px] hidden h-[11.78px] w-[11.79px] object-cover"
                        alt=""
                        src="/zlto-logos11-13@2x.png"
                      />
                    </div>
                  </div>
                </div>
                <div className="text-secondary-purple relative hidden h-[21px] w-[79px]">
                  <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                  <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                    Action
                  </div>
                  <img
                    className="absolute bottom-[20.39%] left-[9.69%] right-[77.51%] top-[21.36%] h-[58.25%] max-h-full w-[12.81%] max-w-full overflow-hidden"
                    alt=""
                    src="/vector6.svg"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="text-grey flex flex-row items-start justify-start gap-[17px]">
            <div className="rounded-3xs relative h-[278px] w-[291px] bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
              <img
                className="absolute left-[236px] top-[15.82px] h-10 w-10 object-cover"
                alt=""
                src="/logoshield3@2x.png"
              />
              <div className="absolute left-[15px] top-[22.82px] flex flex-col items-start justify-start gap-[4px]">
                <div className="relative flex h-[11.13px] shrink-0 items-center self-stretch font-semibold leading-[137%]">
                  University of Cape Town
                </div>
                <div className="relative flex w-[217.56px] items-end text-lg font-semibold leading-[134%] text-black">
                  Design Thinking
                </div>
                <div className="relative inline-block h-[83.87px] w-[260.14px] shrink-0 text-sm leading-[153%]">
                  In this self-study course, you will get to know the method of
                  Design Thinking and learn how to apply this method in your
                  projects.
                </div>
              </div>
              <div className="text-primary-green absolute left-[17.24px] top-[239px] flex flex-col items-start justify-start gap-[5px] text-center">
                <div className="flex w-[259px] flex-row items-start justify-start gap-[6px]">
                  <div className="text-secondary-purple relative hidden flex-1 self-stretch">
                    <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                    <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                      Impact
                    </div>
                    <img
                      className="absolute bottom-[20.39%] left-[9.69%] right-[77.51%] top-[21.36%] h-[58.25%] max-h-full w-[12.81%] max-w-full overflow-hidden"
                      alt=""
                      src="/vector5.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[57.95px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[57.95px] rounded opacity-[0.15]" />
                    <div className="absolute left-[29.07%] top-[4.9%] flex h-[91.78%] w-[67.56%] items-center justify-center font-semibold leading-[137%]">
                      4 hrs
                    </div>
                    <img
                      className="absolute left-[calc(50%_-_26.02px)] top-[calc(50%_-_7.35px)] h-3.5 w-[16.1px]"
                      alt=""
                      src="/expire8.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[63.46px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[63.46px] rounded opacity-[0.15]" />
                    <div className="absolute left-[2.15%] top-[4.9%] flex h-[91.78%] w-[96.2%] items-center justify-center font-semibold leading-[137%]">
                      Ongoing
                    </div>
                  </div>
                  <div className="relative hidden h-[20.23px] w-[37.76px] text-white">
                    <div className="bg-primary-yellow absolute bottom-[0%] left-[0%] right-[0%] top-[0%] h-full w-full rounded" />
                    <div className="absolute left-[2.05%] top-[4.9%] flex h-[91.78%] w-[97.95%] items-center justify-center font-semibold leading-[137%]">{`80% `}</div>
                  </div>
                  <div className="relative h-[20.99px] w-[46.23px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[46.23px] rounded opacity-[0.15]" />
                    <div className="absolute left-[39.17%] top-[0%] flex h-[96.69%] w-[57.85%] items-center justify-center font-semibold leading-[137%]">{`30 `}</div>
                    <img
                      className="absolute left-[7.45px] top-[4.15px] h-3 w-[13.8px] overflow-hidden"
                      alt=""
                      src="/profile8.svg"
                    />
                  </div>
                  <div className="text-dark-yellow flex flex-row items-start justify-start">
                    <div className="relative h-[20.99px] w-[49.14px]">
                      <div className="bg-dark-yellow absolute left-[0px] top-[0px] h-[20.99px] w-[48.15px] rounded opacity-[0.15]" />
                      <div className="absolute left-[34.29%] top-[4.9%] flex h-[91.78%] w-[65.71%] items-center justify-center font-semibold leading-[137%]">
                        500
                      </div>
                      <img
                        className="absolute left-[4.15px] top-[3.95px] h-[13px] w-[14.95px] overflow-hidden"
                        alt=""
                        src="/zlto12.svg"
                      />
                      <img
                        className="absolute left-[7.3px] top-[4.86px] hidden h-[11.78px] w-[11.79px] object-cover"
                        alt=""
                        src="/zlto-logos11-13@2x.png"
                      />
                    </div>
                  </div>
                </div>
                <div className="text-secondary-purple relative hidden h-[21px] w-[79px]">
                  <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                  <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                    Action
                  </div>
                  <img
                    className="absolute bottom-[20.39%] left-[9.69%] right-[77.51%] top-[21.36%] h-[58.25%] max-h-full w-[12.81%] max-w-full overflow-hidden"
                    alt=""
                    src="/vector6.svg"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-3xs relative h-[278px] w-[291px] bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
              <img
                className="absolute left-[236px] top-[15.82px] h-10 w-10 object-cover"
                alt=""
                src="/logoshield3@2x.png"
              />
              <div className="absolute left-[15px] top-[22.82px] flex flex-col items-start justify-start gap-[4px]">
                <div className="relative flex h-[11.13px] shrink-0 items-center self-stretch font-semibold leading-[137%]">
                  University of Cape Town
                </div>
                <div className="relative flex w-[217.56px] items-end text-lg font-semibold leading-[134%] text-black">
                  Design Thinking
                </div>
                <div className="relative inline-block h-[83.87px] w-[260.14px] shrink-0 text-sm leading-[153%]">
                  In this self-study course, you will get to know the method of
                  Design Thinking and learn how to apply this method in your
                  projects.
                </div>
              </div>
              <div className="text-primary-green absolute left-[17.24px] top-[239px] flex flex-col items-start justify-start gap-[5px] text-center">
                <div className="flex w-[259px] flex-row items-start justify-start gap-[6px]">
                  <div className="text-secondary-purple relative hidden flex-1 self-stretch">
                    <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                    <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                      Impact
                    </div>
                    <img
                      className="absolute bottom-[20.39%] left-[9.69%] right-[77.51%] top-[21.36%] h-[58.25%] max-h-full w-[12.81%] max-w-full overflow-hidden"
                      alt=""
                      src="/vector5.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[57.95px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[57.95px] rounded opacity-[0.15]" />
                    <div className="absolute left-[29.07%] top-[4.9%] flex h-[91.78%] w-[67.56%] items-center justify-center font-semibold leading-[137%]">
                      4 hrs
                    </div>
                    <img
                      className="absolute left-[calc(50%_-_26.02px)] top-[calc(50%_-_7.35px)] h-3.5 w-[16.1px]"
                      alt=""
                      src="/expire9.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[63.46px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[63.46px] rounded opacity-[0.15]" />
                    <div className="absolute left-[2.15%] top-[4.9%] flex h-[91.78%] w-[96.2%] items-center justify-center font-semibold leading-[137%]">
                      Ongoing
                    </div>
                  </div>
                  <div className="relative hidden h-[20.23px] w-[37.76px] text-white">
                    <div className="bg-primary-yellow absolute bottom-[0%] left-[0%] right-[0%] top-[0%] h-full w-full rounded" />
                    <div className="absolute left-[2.05%] top-[4.9%] flex h-[91.78%] w-[97.95%] items-center justify-center font-semibold leading-[137%]">{`80% `}</div>
                  </div>
                  <div className="relative h-[20.99px] w-[46.23px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[46.23px] rounded opacity-[0.15]" />
                    <div className="absolute left-[39.17%] top-[0%] flex h-[96.69%] w-[57.85%] items-center justify-center font-semibold leading-[137%]">{`30 `}</div>
                    <img
                      className="absolute left-[7.45px] top-[4.15px] h-3 w-[13.8px] overflow-hidden"
                      alt=""
                      src="/profile9.svg"
                    />
                  </div>
                  <div className="text-dark-yellow flex flex-row items-start justify-start">
                    <div className="relative h-[20.99px] w-[49.14px]">
                      <div className="bg-dark-yellow absolute left-[0px] top-[0px] h-[20.99px] w-[48.15px] rounded opacity-[0.15]" />
                      <div className="absolute left-[34.29%] top-[4.9%] flex h-[91.78%] w-[65.71%] items-center justify-center font-semibold leading-[137%]">
                        500
                      </div>
                      <img
                        className="absolute left-[4.15px] top-[3.95px] h-[13px] w-[14.95px] overflow-hidden"
                        alt=""
                        src="/zlto13.svg"
                      />
                      <img
                        className="absolute left-[7.3px] top-[4.86px] hidden h-[11.78px] w-[11.79px] object-cover"
                        alt=""
                        src="/zlto-logos11-13@2x.png"
                      />
                    </div>
                  </div>
                </div>
                <div className="text-secondary-purple relative hidden h-[21px] w-[79px]">
                  <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                  <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                    Action
                  </div>
                  <img
                    className="absolute bottom-[20.39%] left-[9.69%] right-[77.51%] top-[21.36%] h-[58.25%] max-h-full w-[12.81%] max-w-full overflow-hidden"
                    alt=""
                    src="/vector6.svg"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-3xs relative h-[278px] w-[291px] bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
              <img
                className="absolute left-[236px] top-[15.82px] h-10 w-10"
                alt=""
                src="/logoatingi7.svg"
              />
              <div className="absolute left-[15px] top-[22.82px] flex flex-col items-start justify-start gap-[4px]">
                <div className="relative flex h-[11.13px] shrink-0 items-center self-stretch font-semibold leading-[137%]">
                  Atingi
                </div>
                <div className="relative flex w-[217.56px] items-end text-lg font-semibold leading-[134%] text-black">
                  Computer and Online Essentials
                </div>
                <div className="relative inline-block h-[83.87px] w-[260.14px] shrink-0 text-sm leading-[153%]">{`The Computer & Online Essentials module covers the main concepts and skills needed for using computers and devices, file and application..`}</div>
              </div>
              <div className="text-primary-green absolute left-[17.24px] top-[239px] flex flex-col items-start justify-start gap-[5px] text-center">
                <div className="flex w-[259px] flex-row items-start justify-start gap-[6px]">
                  <div className="text-secondary-purple relative hidden flex-1 self-stretch">
                    <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                    <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                      Impact
                    </div>
                    <img
                      className="absolute bottom-[20.39%] left-[9.69%] right-[77.51%] top-[21.36%] h-[58.25%] max-h-full w-[12.81%] max-w-full overflow-hidden"
                      alt=""
                      src="/vector7.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[57.95px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[57.95px] rounded opacity-[0.15]" />
                    <div className="absolute left-[29.07%] top-[4.9%] flex h-[91.78%] w-[67.56%] items-center justify-center font-semibold leading-[137%]">
                      4 hrs
                    </div>
                    <img
                      className="absolute left-[calc(50%_-_26.02px)] top-[calc(50%_-_7.35px)] h-3.5 w-[16.1px]"
                      alt=""
                      src="/expire9.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[63.46px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[63.46px] rounded opacity-[0.15]" />
                    <div className="absolute left-[2.15%] top-[4.9%] flex h-[91.78%] w-[96.2%] items-center justify-center font-semibold leading-[137%]">
                      Ongoing
                    </div>
                  </div>
                  <div className="relative hidden h-[20.23px] w-[37.76px] text-white">
                    <div className="bg-primary-yellow absolute bottom-[0%] left-[0%] right-[0%] top-[0%] h-full w-full rounded" />
                    <div className="absolute left-[2.05%] top-[4.9%] flex h-[91.78%] w-[97.95%] items-center justify-center font-semibold leading-[137%]">{`80% `}</div>
                  </div>
                  <div className="relative h-[20.99px] w-[46.23px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[46.23px] rounded opacity-[0.15]" />
                    <div className="absolute left-[39.17%] top-[0%] flex h-[96.69%] w-[57.85%] items-center justify-center font-semibold leading-[137%]">{`30 `}</div>
                    <img
                      className="absolute left-[7.45px] top-[4.15px] h-3 w-[13.8px] overflow-hidden"
                      alt=""
                      src="/profile10.svg"
                    />
                  </div>
                  <div className="text-dark-yellow flex flex-row items-start justify-start">
                    <div className="relative h-[20.99px] w-[49.14px]">
                      <div className="bg-dark-yellow absolute left-[0px] top-[0px] h-[20.99px] w-[48.15px] rounded opacity-[0.15]" />
                      <div className="absolute left-[34.29%] top-[4.9%] flex h-[91.78%] w-[65.71%] items-center justify-center font-semibold leading-[137%]">
                        500
                      </div>
                      <img
                        className="absolute left-[4.15px] top-[3.95px] h-[13px] w-[14.95px] overflow-hidden"
                        alt=""
                        src="/zlto14.svg"
                      />
                      <img
                        className="absolute left-[7.3px] top-[4.86px] hidden h-[11.78px] w-[11.79px] object-cover"
                        alt=""
                        src="/zlto-logos11-13@2x.png"
                      />
                    </div>
                  </div>
                </div>
                <div className="text-secondary-purple relative hidden h-[21px] w-[79px]">
                  <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                  <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                    Action
                  </div>
                  <img
                    className="absolute bottom-[20.39%] left-[9.69%] right-[77.51%] top-[21.36%] h-[58.25%] max-h-full w-[12.81%] max-w-full overflow-hidden"
                    alt=""
                    src="/vector8.svg"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-3xs relative h-[278px] w-[291px] bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
              <img
                className="absolute left-[236px] top-[15.82px] h-10 w-10 object-cover"
                alt=""
                src="/logoshield3@2x.png"
              />
              <div className="absolute left-[15px] top-[22.82px] flex flex-col items-start justify-start gap-[4px]">
                <div className="relative flex h-[11.13px] shrink-0 items-center self-stretch font-semibold leading-[128%]">
                  University of Cape Town
                </div>
                <div className="relative flex w-[217.56px] items-end text-lg font-semibold leading-[134%] text-black">
                  Safely working from home
                </div>
                <div className="relative inline-block h-[83.87px] w-[260.14px] shrink-0 text-sm leading-[153%]">
                  This online training course offers an introduction to cyber
                  security in the private workplace and provides basic and
                  advanced IT security rules for...
                </div>
              </div>
              <div className="text-primary-green absolute left-[17.24px] top-[239px] flex flex-col items-start justify-start gap-[5px] text-center">
                <div className="flex w-[259px] flex-row items-start justify-start gap-[6px]">
                  <div className="text-secondary-purple relative hidden flex-1 self-stretch">
                    <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                    <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                      Impact
                    </div>
                    <img
                      className="absolute bottom-[20.39%] left-[9.69%] right-[77.51%] top-[21.36%] h-[58.25%] max-h-full w-[12.81%] max-w-full overflow-hidden"
                      alt=""
                      src="/vector7.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[57.95px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[57.95px] rounded opacity-[0.15]" />
                    <div className="absolute left-[29.07%] top-[4.9%] flex h-[91.78%] w-[67.56%] items-center justify-center font-semibold leading-[137%]">
                      4 hrs
                    </div>
                    <img
                      className="absolute left-[calc(50%_-_26.02px)] top-[calc(50%_-_7.35px)] h-3.5 w-[16.1px]"
                      alt=""
                      src="/expire9.svg"
                    />
                  </div>
                  <div className="relative h-[20.99px] w-[63.46px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[63.46px] rounded opacity-[0.15]" />
                    <div className="absolute left-[2.15%] top-[4.9%] flex h-[91.78%] w-[96.2%] items-center justify-center font-semibold leading-[137%]">
                      Ongoing
                    </div>
                  </div>
                  <div className="relative hidden h-[20.23px] w-[37.76px] text-white">
                    <div className="bg-primary-yellow absolute bottom-[0%] left-[0%] right-[0%] top-[0%] h-full w-full rounded" />
                    <div className="absolute left-[2.05%] top-[4.9%] flex h-[91.78%] w-[97.95%] items-center justify-center font-semibold leading-[137%]">{`80% `}</div>
                  </div>
                  <div className="relative h-[20.99px] w-[46.23px]">
                    <div className="bg-primary-green absolute left-[0px] top-[0px] h-[20.99px] w-[46.23px] rounded opacity-[0.15]" />
                    <div className="absolute left-[39.17%] top-[0%] flex h-[96.69%] w-[57.85%] items-center justify-center font-semibold leading-[137%]">{`30 `}</div>
                    <img
                      className="absolute left-[7.45px] top-[4.15px] h-3 w-[13.8px] overflow-hidden"
                      alt=""
                      src="/profile9.svg"
                    />
                  </div>
                  <div className="text-dark-yellow flex flex-row items-start justify-start">
                    <div className="relative h-[20.99px] w-[49.14px]">
                      <div className="bg-dark-yellow absolute left-[0px] top-[0px] h-[20.99px] w-[48.15px] rounded opacity-[0.15]" />
                      <div className="absolute left-[34.29%] top-[4.9%] flex h-[91.78%] w-[65.71%] items-center justify-center font-semibold leading-[137%]">
                        500
                      </div>
                      <img
                        className="absolute left-[4.15px] top-[3.95px] h-[13px] w-[14.95px] overflow-hidden"
                        alt=""
                        src="/zlto13.svg"
                      />
                      <img
                        className="absolute left-[7.3px] top-[4.86px] hidden h-[11.78px] w-[11.79px] object-cover"
                        alt=""
                        src="/zlto-logos11-13@2x.png"
                      />
                    </div>
                  </div>
                </div>
                <div className="text-secondary-purple relative hidden h-[21px] w-[79px]">
                  <div className="bg-secondary-purple absolute bottom-[0.35%] left-[-0.45%] right-[-1.19%] top-[-0.28%] h-[99.93%] w-[101.64%] rounded opacity-[0.15]" />
                  <div className="absolute left-[24.56%] top-[4.62%] flex h-[91.72%] w-[68.54%] items-center justify-center font-semibold leading-[137%]">
                    Action
                  </div>
                  <img
                    className="absolute bottom-[20.39%] left-[9.69%] right-[77.51%] top-[21.36%] h-[58.25%] max-h-full w-[12.81%] max-w-full overflow-hidden"
                    alt=""
                    src="/vector6.svg"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gainsboro relative h-[3.86px] w-[3.86px]" />
          <div className="flex w-[1215px] flex-row items-center justify-center gap-[5px] text-center">
            <div className="relative h-[20.75px] w-[17.95px]">
              <div className="rounded-10xs absolute bottom-[0%] left-[0%] right-[0%] top-[0%] h-full w-full bg-white" />
              <img
                className="absolute bottom-[29.93%] left-[80.43%] right-[-47.29%] top-[26.69%] h-[43.38%] max-h-full w-[66.86%] max-w-full overflow-hidden"
                alt=""
                src="/iconforward3.svg"
              />
            </div>
            <div className="relative h-[20.84px] w-[51.34px]">
              <div className="rounded-10xs border-lightest-grey absolute bottom-[0%] left-[0%] right-[0%] top-[0.48%] box-border h-[99.52%] w-full border-[1px] border-solid" />
              <div className="absolute left-[1%] top-[2.39%] flex h-[96.38%] w-[95.09%] items-center justify-center font-semibold leading-[153%] [transform-origin:0_0] [transform:_rotate(-0.59deg)]">
                1 of 10
              </div>
            </div>
            <div className="relative h-[20.75px] w-[17.95px]">
              <div className="rounded-10xs absolute bottom-[0%] left-[0%] right-[0%] top-[0%] h-full w-full bg-white" />
              <img
                className="absolute bottom-[29.93%] left-[18.12%] right-[15.02%] top-[26.69%] h-[43.38%] max-h-full w-[66.86%] max-w-full overflow-hidden"
                alt=""
                src="/iconforward4.svg"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute left-[calc(50%_-_457px)] top-[299.79px] flex flex-row items-start justify-start gap-[13px] text-center text-xs">
        <div className="relative hidden h-[101px] w-[90px] rounded-md bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
          <div className="absolute left-[0px] top-[46.4px] flex flex-col items-start justify-start">
            <div className="relative inline-block w-[90px] font-semibold leading-[137%]">
              Tasks
            </div>
            <div className="text-3xs text-grey relative flex h-[18.52px] w-[90px] shrink-0 items-center justify-center leading-[140%]">
              98 available
            </div>
          </div>
          <img
            className="absolute bottom-[59.55%] left-[32.29%] right-[33.27%] top-[9.76%] h-[30.69%] max-h-full w-[34.44%] max-w-full overflow-hidden"
            alt=""
            src="/icon1.svg"
          />
        </div>
        <div className="relative h-[101px] w-[90px] rounded-md bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
          <div className="absolute left-[0px] top-[46.4px] flex flex-col items-start justify-start">
            <div className="relative inline-block w-[90px] font-semibold leading-[137%]">
              Business
            </div>
            <div className="text-3xs text-grey relative flex h-[18.52px] w-[90px] shrink-0 items-center justify-center leading-[140%]">
              300 available
            </div>
          </div>
          <img
            className="absolute bottom-[59.55%] left-[32.29%] right-[33.27%] top-[9.76%] h-[30.69%] max-h-full w-[34.44%] max-w-full overflow-hidden"
            alt=""
            src="/icon2.svg"
          />
        </div>
        <div className="relative h-[101px] w-[90px] rounded-md bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
          <div className="absolute left-[0px] top-[46.4px] flex flex-col items-start justify-start">
            <div className="relative inline-block w-[90px] font-semibold leading-[137%]">
              Entrepreneur
            </div>
            <div className="text-3xs text-grey relative flex h-[18.52px] w-[90px] shrink-0 items-center justify-center leading-[140%]">
              150 available
            </div>
          </div>
          <img
            className="absolute bottom-[59.55%] left-[32.29%] right-[33.27%] top-[9.76%] h-[30.69%] max-h-full w-[34.44%] max-w-full overflow-hidden"
            alt=""
            src="/icon3.svg"
          />
        </div>
        <div className="relative h-[101px] w-[90px] rounded-md bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
          <div className="absolute left-[0px] top-[46.4px] flex flex-col items-start justify-start">
            <div className="relative inline-block w-[90px] font-semibold leading-[137%]">
              Technology
            </div>
            <div className="text-3xs text-grey relative flex h-[18.52px] w-[90px] shrink-0 items-center justify-center leading-[140%]">
              34 available
            </div>
          </div>
          <img
            className="absolute bottom-[59.55%] left-[32.29%] right-[33.27%] top-[9.76%] h-[30.69%] max-h-full w-[34.44%] max-w-full overflow-hidden"
            alt=""
            src="/icon4.svg"
          />
        </div>
        <div className="relative h-[101px] w-[90px] rounded-md bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
          <div className="absolute left-[0px] top-[46.4px] flex flex-col items-start justify-start">
            <div className="relative inline-block w-[90px] font-semibold leading-[137%]">
              Digitisation
            </div>
            <div className="text-3xs text-grey relative flex h-[18.52px] w-[90px] shrink-0 items-center justify-center leading-[140%]">
              29 available
            </div>
          </div>
          <img
            className="absolute bottom-[59.55%] left-[32.29%] right-[33.27%] top-[9.76%] h-[30.69%] max-h-full w-[34.44%] max-w-full overflow-hidden"
            alt=""
            src="/icon5.svg"
          />
        </div>
        <div className="relative h-[101px] w-[90px] rounded-md bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
          <div className="absolute left-[0px] top-[46.4px] flex flex-col items-start justify-start">
            <div className="relative inline-block w-[90px] font-semibold leading-[137%]">
              Tourism
            </div>
            <div className="text-3xs text-grey relative flex h-[18.52px] w-[90px] shrink-0 items-center justify-center leading-[140%]">
              13 available
            </div>
          </div>
          <img
            className="absolute bottom-[59.55%] left-[32.29%] right-[33.27%] top-[9.76%] h-[30.69%] max-h-full w-[34.44%] max-w-full overflow-hidden"
            alt=""
            src="/icon6.svg"
          />
        </div>
        <div className="relative h-[101px] w-[90px] rounded-md bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
          <div className="absolute left-[0px] top-[46.4px] flex flex-col items-start justify-start">
            <div className="relative inline-block w-[90px] font-semibold leading-[137%]">
              Hospitality
            </div>
            <div className="text-3xs text-grey relative flex h-[18.52px] w-[90px] shrink-0 items-center justify-center leading-[140%]">
              6 available
            </div>
          </div>
          <img
            className="absolute bottom-[59.55%] left-[32.29%] right-[33.27%] top-[9.76%] h-[30.69%] max-h-full w-[34.44%] max-w-full overflow-hidden"
            alt=""
            src="/icon7.svg"
          />
        </div>
        <div className="relative h-[101px] w-[90px] rounded-md bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
          <div className="absolute left-[0px] top-[46.4px] flex flex-col items-start justify-start">
            <div className="relative inline-block w-[90px] font-semibold leading-[137%]">
              Agriculture
            </div>
            <div className="text-3xs text-grey relative flex h-[18.52px] w-[90px] shrink-0 items-center justify-center leading-[140%]">
              67 available
            </div>
          </div>
          <img
            className="absolute bottom-[59.55%] left-[32.29%] right-[33.27%] top-[9.76%] h-[30.69%] max-h-full w-[34.44%] max-w-full overflow-hidden"
            alt=""
            src="/icon8.svg"
          />
        </div>
        <div className="relative h-[101px] w-[90px] rounded-md bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
          <div className="absolute left-[0px] top-[46.4px] flex flex-col items-start justify-start">
            <div className="relative inline-block w-[90px] font-semibold leading-[137%]">
              Environment
            </div>
            <div className="text-3xs text-grey relative flex h-[18.52px] w-[90px] shrink-0 items-center justify-center leading-[140%]">
              110 available
            </div>
          </div>
          <img
            className="absolute bottom-[59.55%] left-[32.29%] right-[33.27%] top-[9.76%] h-[30.69%] max-h-full w-[34.44%] max-w-full overflow-hidden"
            alt=""
            src="/icon9.svg"
          />
        </div>
        <div className="relative h-[101px] w-[90px] rounded-md bg-white shadow-[10px_10px_45px_rgba(108,_109,_133,_0.15)]">
          <div className="absolute left-[0px] top-[46.4px] flex flex-col items-start justify-start">
            <div className="relative inline-block w-[90px] font-semibold leading-[137%]">
              <p className="m-0">{`View all `}</p>
              <p className="m-0">topics</p>
            </div>
            <div className="text-3xs text-grey relative hidden h-[18.52px] w-[90px] shrink-0 items-center justify-center leading-[140%]">
              13 available
            </div>
          </div>
          <img
            className="absolute bottom-[59.55%] left-[32.29%] right-[33.27%] top-[9.76%] h-[30.69%] max-h-full w-[34.44%] max-w-full overflow-hidden"
            alt=""
            src="/icon10.svg"
          />
        </div>
      </div>
    </div>
  );
};

Home.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Home;
/* eslint-enable */
