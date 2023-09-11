import { ReactElement } from "react";
import LeftNavLayout from "~/components/Layout/LeftNav";
import MainLayout from "~/components/Layout/Main";
import OrganisationLayout from "~/components/Layout/Organisation";
import withAuth from "~/context/withAuth";
import { NextPageWithLayout } from "~/pages/_app";

const ForApproval: NextPageWithLayout = () => {
  return (
    <div className="bg-lightest-grey font-p-16px-medium relative h-[1443px] w-full overflow-hidden text-left text-base text-black">
      <div className="border-lavender absolute left-[518.25px] top-[899.75px] box-border h-px w-[605.15px] border-t-[1px] border-solid" />
      <div className="absolute left-[389.68px] top-[924.81px] flex w-[660.65px] flex-col items-end justify-center overflow-hidden text-lg">
        <div className="relative inline-block h-[28.5px] w-[531.14px] shrink-0 font-medium leading-[119%]">
          Company registration
        </div>
      </div>
      <div className="absolute left-[518.18px] top-[514.21px] flex w-[403.64px] flex-col items-start justify-center overflow-hidden">
        <div className="relative inline-block h-[25px] w-[286.45px] shrink-0 font-medium leading-[135%]">
          Logo
        </div>
      </div>
      <div className="absolute left-[434.56px] top-[246.97px] flex w-[570.89px] flex-col items-end justify-center overflow-hidden text-lg">
        <div className="relative inline-block h-[28.5px] w-[487.7px] shrink-0 font-medium leading-[119%]">
          Page identity
        </div>
      </div>
      <div className="absolute left-[390.68px] top-[665.72px] flex w-[658.65px] flex-col items-end justify-center overflow-hidden text-lg">
        <div className="relative inline-block h-[28.5px] w-[531.14px] shrink-0 font-medium leading-[119%]">
          Company details
        </div>
      </div>
      <div className="text-grey absolute left-[518.75px] top-[293.18px] flex w-[402.5px] flex-col items-start justify-center overflow-hidden text-sm">
        <div className="relative flex w-[230.53px] items-center leading-[153%]">
          Company name
        </div>
      </div>
      <div className="absolute left-[519.18px] top-[316.72px] flex w-[401.64px] flex-col items-start justify-center overflow-hidden">
        <div className="relative flex w-[230.53px] items-center leading-[140%]">
          Get Smarter
        </div>
      </div>
      <div className="text-grey absolute left-[518.75px] top-[704.11px] flex w-[402.5px] flex-col items-start justify-center overflow-hidden text-sm">
        <div className="relative flex w-[230.53px] items-center leading-[153%]">
          Countries or regions
        </div>
      </div>
      <div className="absolute left-[518.18px] top-[727.25px] flex w-[403.64px] flex-col items-start justify-center overflow-hidden">
        <div className="relative flex w-[230.53px] items-center leading-[140%]">
          Cape Town, Johannesburg
        </div>
      </div>
      <div className="text-grey absolute left-[519.18px] top-[762.75px] flex w-[401.64px] flex-col items-start justify-center overflow-hidden text-sm">
        <div className="relative flex w-[230.53px] items-center leading-[153%]">
          Company tagline
        </div>
      </div>
      <div className="text-grey absolute left-[519.18px] top-[820.82px] flex w-[401.64px] flex-col items-start justify-center overflow-hidden text-sm">
        <div className="relative flex w-[230.53px] items-center leading-[153%]">
          Company description
        </div>
      </div>
      <div className="absolute left-[518.75px] top-[784.64px] flex w-[402.5px] flex-col items-start justify-center overflow-hidden">
        <div className="relative flex w-[274.31px] items-center leading-[140%]">
          Thrive in an ever-changing world
        </div>
      </div>
      <div className="text-grey absolute left-[519.18px] top-[1043px] flex w-[401.64px] flex-col items-start justify-center overflow-hidden">
        <div className="relative flex w-[230.53px] items-center leading-[140%]">
          Contact person
        </div>
      </div>
      <div className="absolute left-[519.18px] top-[1067.44px] flex w-[401.64px] flex-col items-start justify-center overflow-hidden">
        <div className="relative flex w-[274.31px] items-center leading-[140%]">
          Sarah Michaels
        </div>
      </div>
      <div className="text-grey absolute left-[519.18px] top-[1108.73px] flex w-[401.64px] flex-col items-start justify-center overflow-hidden">
        <div className="relative flex w-[230.53px] items-center leading-[140%]">
          Contact email
        </div>
      </div>
      <div className="absolute left-[518.18px] top-[1132.1px] flex w-[403.64px] flex-col items-start justify-center overflow-hidden">
        <div className="relative flex w-[274.31px] items-center leading-[140%]">
          sarah@getsmarter.co.za
        </div>
      </div>
      <div className="text-grey absolute left-[519.18px] top-[1169.85px] flex w-[401.64px] flex-col items-start justify-center overflow-hidden">
        <div className="relative flex w-[230.53px] items-center leading-[140%]">
          Contact number
        </div>
      </div>
      <div className="absolute left-[517.75px] top-[1195.51px] flex w-[404.5px] flex-col items-start justify-center overflow-hidden">
        <div className="relative flex w-[274.31px] items-center leading-[140%]">
          +27 82 345 4736
        </div>
      </div>
      <div className="absolute left-[310.09px] top-[842.72px] flex w-[819.83px] flex-col items-end justify-center overflow-hidden">
        <div className="relative flex w-[610.73px] items-center leading-[140%]">
          With certified online short courses from the world's leading
          universities.
        </div>
      </div>
      <div className="text-grey absolute left-[518.75px] top-[417.95px] flex w-[402.5px] flex-col items-start justify-center overflow-hidden text-sm">
        <div className="relative flex h-[18.68px] w-[230.53px] shrink-0 items-center leading-[153%]">
          Interested in becoming a
        </div>
      </div>
      <div className="absolute left-[517.75px] top-[439.68px] flex w-[404.5px] flex-col items-start justify-center overflow-hidden">
        <div className="relative flex h-[19.31px] w-[230.53px] shrink-0 items-center leading-[140%]">
          Training partner
        </div>
      </div>
      <div className="text-grey absolute left-[518.75px] top-[356.43px] flex w-[402.5px] flex-col items-start justify-center overflow-hidden text-sm">
        <div className="relative flex w-[230.53px] items-center leading-[153%]">
          Company website
        </div>
      </div>
      <div className="text-link-blue absolute left-[517.75px] top-[377.43px] flex w-[404.5px] flex-col items-start justify-center overflow-hidden">
        <div className="relative flex w-[230.53px] items-center leading-[134%] [text-decoration:underline]">
          www.getsmarter.co.za
        </div>
      </div>
      <div className="absolute left-[315.39px] top-[542.97px] flex w-[809.23px] flex-col items-end justify-center overflow-hidden">
        <div className="bg-lightest-grey relative h-[55px] w-[605.86px] rounded-sm" />
      </div>
      <div className="text-link-blue absolute left-[533.81px] top-[557.98px] flex w-[372.37px] flex-col items-start justify-center overflow-hidden">
        <div className="relative inline-block h-[25px] w-[286.45px] shrink-0 leading-[134%] [text-decoration:underline]">
          getsmarterlogo.jpg
        </div>
      </div>
      <div className="absolute left-[315.82px] top-[961.79px] flex w-[808.36px] flex-col items-end justify-center overflow-hidden">
        <div className="bg-lightest-grey relative h-[55px] w-[606.43px] rounded-sm" />
      </div>
      <div className="text-link-blue absolute left-[539.15px] top-[976.79px] flex w-[361.7px] flex-col items-start justify-center overflow-hidden">
        <div className="relative inline-block h-[25px] w-[286.45px] shrink-0 leading-[134%] [text-decoration:underline]">
          getsmarterregisration.pdf
        </div>
      </div>
      <div className="text-grey absolute left-[0px] top-[0px] flex w-[1440px] flex-col items-start justify-center overflow-hidden">
        <div className="box-border flex h-[1443px] flex-col items-center justify-start gap-[17px] bg-white px-0 py-7 shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
          <img
            className="relative h-[46.97px] w-[190.3px] object-cover"
            alt=""
            src="/pset-cloud-logo--colour03-12@2x.png"
          />
          <div className="bg-silver relative h-px w-px" />
          <div className="flex flex-col items-center justify-center gap-[4px]">
            <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[6px] px-[17px] py-[11px] shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
              <img
                className="relative h-5 w-[23px] shrink-0 overflow-hidden"
                alt=""
                src="/dashboard1.svg"
              />
              <div className="relative flex h-[30px] w-[103.12px] shrink-0 items-center font-medium leading-[135%]">
                Dashboard
              </div>
            </div>
            <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[7px] bg-white px-[18px] py-3 text-black shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
              <img
                className="relative h-[21px] w-[21px]"
                alt=""
                src="/group1.svg"
              />
              <div className="relative flex h-[30px] w-[130.68px] shrink-0 items-center font-medium leading-[135%]">
                Organisations
              </div>
            </div>
            <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[6px] px-[17px] py-3 shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
              <img
                className="relative h-5 w-[23px] shrink-0 overflow-hidden"
                alt=""
                src="/opportunities1.svg"
              />
              <div className="relative flex h-[30px] w-[130.68px] shrink-0 items-center font-medium leading-[135%]">
                Opportunities
              </div>
            </div>
            <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[7px] px-[17px] py-3 shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
              <img
                className="relative h-5 w-[23px] shrink-0 overflow-hidden"
                alt=""
                src="/jobs1.svg"
              />
              <div className="relative flex h-[30px] w-[130.68px] shrink-0 items-center font-medium leading-[135%]">
                Jobs
              </div>
            </div>
            <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[8px] px-5 py-3 shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
              <img
                className="relative h-[18px] w-[18px]"
                alt=""
                src="/icon1.svg"
              />
              <div className="relative flex h-[30px] w-[130.68px] shrink-0 items-center font-medium leading-[135%]">
                Connections
              </div>
            </div>
            <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[6px] px-[17px] py-3 shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
              <img
                className="relative h-5 w-[23px] shrink-0 overflow-hidden"
                alt=""
                src="/credentials2.svg"
              />
              <div className="relative flex h-[30px] w-[113.5px] shrink-0 items-center font-medium leading-[135%]">
                Credentials
              </div>
            </div>
            <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[6px] px-[18px] py-3 shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
              <img
                className="relative h-5 w-[23px] shrink-0 overflow-hidden"
                alt=""
                src="/policies2.svg"
              />
              <div className="relative flex h-[30px] w-[151.31px] shrink-0 items-center font-medium leading-[166%]">
                Verification Policies
              </div>
            </div>
            <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[6px] px-[17px] py-3 shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
              <img
                className="relative h-5 w-[23px] shrink-0 overflow-hidden"
                alt=""
                src="/insights2.svg"
              />
              <div className="relative flex h-[30px] w-[126.65px] shrink-0 items-center font-medium leading-[135%]">
                Marketing
              </div>
            </div>
            <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[6px] px-[17px] py-3 shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
              <img
                className="relative h-5 w-[23px] shrink-0 overflow-hidden"
                alt=""
                src="/messaging2.svg"
              />
              <div className="relative inline-block h-[30px] w-[126.65px] shrink-0 font-medium leading-[166%]">
                Messaging
              </div>
            </div>
            <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[7px] px-[17px] py-3 shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
              <img
                className="relative h-5 w-[23px] shrink-0 overflow-hidden"
                alt=""
                src="/oauth1.svg"
              />
              <div className="relative flex h-[30px] w-[126.65px] shrink-0 items-center font-medium leading-[135%]">
                SSI OAuth
              </div>
            </div>
          </div>
          <div className="bg-silver relative h-px w-px" />
          <img
            className="relative h-0.5 w-[239.99px]"
            alt=""
            src="/vector-491.svg"
          />
          <div className="bg-silver relative h-px w-px" />
          <div className="flex flex-col items-start justify-start">
            <div className="flex flex-col items-center justify-center gap-[4px]">
              <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[7px] px-[17px] py-3 shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
                <img
                  className="relative h-5 w-[23px] shrink-0 overflow-hidden"
                  alt=""
                  src="/support1.svg"
                />
                <div className="relative flex h-[30px] w-[120.89px] shrink-0 items-center font-medium leading-[135%]">
                  Tech support
                </div>
              </div>
              <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[7px] bg-gray px-[17px] py-3 shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
                <img
                  className="relative h-5 w-[23px] shrink-0 overflow-hidden"
                  alt=""
                  src="/settings2.svg"
                />
                <div className="relative flex h-[30px] w-[71.61px] shrink-0 items-center font-medium leading-[135%]">
                  API
                </div>
              </div>
              <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[6px] bg-gray px-[17px] py-3 shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
                <img
                  className="relative h-5 w-[23px] shrink-0 overflow-hidden"
                  alt=""
                  src="/logout2.svg"
                />
                <div className="relative flex h-[30px] w-[80.7px] shrink-0 items-center font-medium leading-[135%]">
                  Sign out
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute left-[317.1px] top-[1256px] flex w-[805.8px] flex-col items-end justify-center overflow-hidden text-center text-white">
        <div className="rounded-6xs bg-yoma-green box-border flex w-[170px] flex-row items-center justify-center px-[21px] py-2">
          <div className="relative font-medium leading-[132%]">Approve</div>
        </div>
      </div>
      <div className="text-primary-red absolute left-[507.23px] top-[1256px] flex w-[425.54px] flex-col items-end justify-center overflow-hidden text-center">
        <div className="rounded-6xs border-primary-red box-border flex h-[37px] w-[170px] flex-row items-center justify-center border-[1.2px] border-solid bg-white px-[21px] py-2">
          <div className="relative font-medium leading-[132%]">Deny</div>
        </div>
      </div>
      <div className="text-grey absolute left-[332.26px] top-[109.06px] flex w-[775.48px] flex-col items-start justify-center overflow-hidden text-sm">
        <div className="relative inline-block h-[25.64px] w-[599.53px] shrink-0 leading-[153%]">
          <span>Organisations</span>
          <span className="text-dimgray">{`  `}</span>
          <span className="text-lightslategray">| Get Smarter</span>
        </div>
      </div>
      <img
        className="absolute left-[0px] top-[0px] h-[75px] w-[1444.42px] overflow-hidden"
        alt=""
        src="/frame.svg"
      />
      <div className="text-19xl absolute left-[0px] top-[135.9px] flex w-[1440px] flex-col items-start justify-center overflow-hidden">
        <div className="flex w-[933.33px] flex-col items-end justify-center overflow-hidden">
          <b className="relative inline-block w-[600.63px] leading-[110%] tracking-[0.02em]">
            Get Smarter
          </b>
        </div>
      </div>
      <div className="absolute left-[0px] top-[205px] flex w-[1440px] flex-col items-start justify-center overflow-hidden">
        <div className="flex w-[1165.77px] flex-col items-end justify-center overflow-hidden">
          <div className="box-border flex h-[1129px] w-[690px] flex-col items-start justify-start rounded-2xl bg-white px-[50px] py-[483px] shadow-[10px_10px_45px_rgba(108,_109,_133,_0.08)]">
            <div className="relative h-[67px] w-[558px]" />
          </div>
        </div>
      </div>
      <div className="border-lavender absolute left-[518.25px] top-[488.24px] box-border h-px w-[605.15px] border-t-[1px] border-solid" />
      <div className="border-lavender absolute left-[518.25px] top-[633.22px] box-border h-px w-[605.15px] border-t-[1px] border-solid" />
    </div>
  );
};

ForApproval.getLayout = function getLayout(page: ReactElement) {
  return (
    <MainLayout>
      <LeftNavLayout>
        <OrganisationLayout>{page}</OrganisationLayout>
      </LeftNavLayout>
    </MainLayout>
  );
};

export default withAuth(ForApproval);
