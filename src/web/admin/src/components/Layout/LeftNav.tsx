import type { ReactElement } from "react";
import { IoMdBusiness, IoMdHome } from "react-icons/io";

export type LayoutProps = ({
  children,
}: {
  children: ReactElement;
}) => ReactElement;

const LeftNavLayout: LayoutProps = ({ children }) => {
  return (
    <div className="flex">
      <div className="box-border flex h-[1443px] flex-col items-center justify-start gap-[17px] bg-white px-0 py-7 shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
        <div className="bg-silver relative h-px w-px" />
        <div className="flex flex-col items-center justify-center gap-[4px]">
          <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[6px] px-[17px] py-[11px] shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
            <IoMdHome className="relative h-5 w-[23px] shrink-0 overflow-hidden" />
            <div className="relative flex h-[30px] w-[103.12px] shrink-0 items-center font-medium leading-[135%]">
              Dashboard
            </div>
          </div>
          <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[7px] bg-white px-[18px] py-3 text-black shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
            <IoMdBusiness className="relative h-5 w-[23px] shrink-0 overflow-hidden" />
            <div className="relative flex h-[30px] w-[130.68px] shrink-0 items-center font-medium leading-[135%]">
              Organisations
            </div>
          </div>
          <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[6px] px-[17px] py-3 shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
            <IoMdBusiness className="relative h-5 w-[23px] shrink-0 overflow-hidden" />
            <div className="relative flex h-[30px] w-[130.68px] shrink-0 items-center font-medium leading-[135%]">
              Opportunities
            </div>
          </div>
          <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[7px] px-[17px] py-3 shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
            <IoMdBusiness className="relative h-5 w-[23px] shrink-0 overflow-hidden" />
            <div className="relative flex h-[30px] w-[130.68px] shrink-0 items-center font-medium leading-[135%]">
              Jobs
            </div>
          </div>
          <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[8px] px-5 py-3 shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
            <IoMdBusiness className="relative h-5 w-[23px] shrink-0 overflow-hidden" />
            <div className="relative flex h-[30px] w-[130.68px] shrink-0 items-center font-medium leading-[135%]">
              Connections
            </div>
          </div>
          <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[6px] px-[17px] py-3 shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
            <IoMdBusiness className="relative h-5 w-[23px] shrink-0 overflow-hidden" />
            <div className="relative flex h-[30px] w-[113.5px] shrink-0 items-center font-medium leading-[135%]">
              Credentials
            </div>
          </div>
          <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[6px] px-[18px] py-3 shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
            <IoMdBusiness className="relative h-5 w-[23px] shrink-0 overflow-hidden" />
            <div className="relative flex h-[30px] w-[151.31px] shrink-0 items-center font-medium leading-[166%]">
              Verification Policies
            </div>
          </div>
          <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[6px] px-[17px] py-3 shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
            <IoMdBusiness className="relative h-5 w-[23px] shrink-0 overflow-hidden" />
            <div className="relative flex h-[30px] w-[126.65px] shrink-0 items-center font-medium leading-[135%]">
              Marketing
            </div>
          </div>
          <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[6px] px-[17px] py-3 shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
            <IoMdBusiness className="relative h-5 w-[23px] shrink-0 overflow-hidden" />
            <div className="relative inline-block h-[30px] w-[126.65px] shrink-0 font-medium leading-[166%]">
              Messaging
            </div>
          </div>
          <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[7px] px-[17px] py-3 shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
            <IoMdBusiness className="relative h-5 w-[23px] shrink-0 overflow-hidden" />
            <div className="relative flex h-[30px] w-[126.65px] shrink-0 items-center font-medium leading-[135%]">
              SSI OAuth
            </div>
          </div>
        </div>
        <div className="bg-silver relative h-px w-px" />

        <IoMdBusiness className="relative h-5 w-[23px] shrink-0 overflow-hidden" />

        <div className="bg-silver relative h-px w-px" />
        <div className="flex flex-col items-start justify-start">
          <div className="flex flex-col items-center justify-center gap-[4px]">
            <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[7px] px-[17px] py-3 shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
              <IoMdBusiness className="relative h-5 w-[23px] shrink-0 overflow-hidden" />
              <div className="relative flex h-[30px] w-[120.89px] shrink-0 items-center font-medium leading-[135%]">
                Tech support
              </div>
            </div>
            <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[7px] bg-gray px-[17px] py-3 shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
              <IoMdBusiness className="relative h-5 w-[23px] shrink-0 overflow-hidden" />
              <div className="relative flex h-[30px] w-[71.61px] shrink-0 items-center font-medium leading-[135%]">
                API
              </div>
            </div>
            <div className="rounded-4xs box-border flex w-[204px] flex-row items-center justify-start gap-[6px] bg-gray px-[17px] py-3 shadow-[10px_10px_54px_rgba(108,_109,_133,_0.11)]">
              <IoMdBusiness className="relative h-5 w-[23px] shrink-0 overflow-hidden" />
              <div className="relative flex h-[30px] w-[80.7px] shrink-0 items-center font-medium leading-[135%]">
                Sign out
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
};

export default LeftNavLayout;
