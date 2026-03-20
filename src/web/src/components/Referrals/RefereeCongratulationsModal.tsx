import Link from "next/link";
import { IoMdClose } from "react-icons/io";
import { IoArrowForward } from "react-icons/io5";
import { ProgramInfo } from "~/api/models/referrals";
import CustomModal from "~/components/Common/CustomModal";

interface RefereeCongratulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  program: ProgramInfo;
}

export const RefereeCongratulationsModal: React.FC<
  RefereeCongratulationsModalProps
> = ({ isOpen, onClose, userName, program }) => {
  const normalizedValue = program?.zltoRewardReferee || 0;

  return (
    <CustomModal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="md:max-h-[440px] md:w-[700px]"
    >
      <div className="flex flex-col gap-2">
        <div className="bg-purple flex flex-row p-4 shadow-lg">
          <div className="grow"></div>
          <button
            type="button"
            className="btn btn-circle btn-sm bg-purple-shade border-0 text-white shadow-none hover:opacity-80"
            onClick={onClose}
          >
            <IoMdClose className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 px-4 pb-5 text-center sm:px-6 md:gap-4 md:px-12 md:pb-6">
          <div className="border-green-dark -mt-11 mb-2 flex h-[4rem] w-[4rem] items-center justify-center rounded-full bg-white p-1 shadow-lg md:h-[4.5rem] md:w-[4.5rem]">
            <span
              className="text-xl md:text-2xl"
              role="img"
              aria-label="Congratulations"
            >
              🎉
            </span>
          </div>

          <h3 className="max-w-full truncate text-lg font-semibold text-black sm:text-xl md:text-2xl">
            Congratulations {userName}!
          </h3>
          <p className="text-gray-dark max-w-[95%] text-sm leading-relaxed md:max-w-[90%] md:text-base">
            You have completed the <strong>{program.name}</strong> programme
            {normalizedValue > 0 ? (
              <>
                {" "}
                and received <strong>{normalizedValue} Zlto</strong> in your
                wallet. Check out our{" "}
                <Link
                  href="/marketplace"
                  className="text-purple hover:text-purple-dark inline-flex items-center gap-1 font-semibold underline underline-offset-2"
                >
                  marketplace
                  <IoArrowForward className="h-4 w-4" />
                </Link>
                .
              </>
            ) : (
              <>
                .
                <br />
                <br /> Ready to earn more Zlto?
                <br />
                <Link
                  href="/referrals"
                  className="text-purple hover:text-purple-dark inline-flex items-center gap-1 font-semibold underline underline-offset-2"
                >
                  Refer a Friend
                  <IoArrowForward className="h-4 w-4" />
                </Link>{" "}
                or{" "}
                <Link
                  href="/opportunities"
                  className="text-purple hover:text-purple-dark inline-flex items-center gap-1 font-semibold underline underline-offset-2"
                >
                  Explore Opportunities
                  <IoArrowForward className="h-4 w-4" />
                </Link>{" "}
                to earn more Zlto!
              </>
            )}
          </p>

          <button
            type="button"
            className="btn hover:btn-outline hover:text-green bg-green border-green btn-sm mt-8 w-full max-w-[240px] text-white normal-case hover:bg-white md:w-1/2"
            onClick={onClose}
          >
            Got it!
          </button>
        </div>
      </div>
    </CustomModal>
  );
};
