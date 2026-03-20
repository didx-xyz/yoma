import { IoMdClose } from "react-icons/io";
import { ProgramInfo } from "~/api/models/referrals";
import CustomModal from "~/components/Common/CustomModal";

interface RefereeWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  program: ProgramInfo;
}

export const RefereeWelcomeModal: React.FC<RefereeWelcomeModalProps> = ({
  isOpen,
  onClose,
  userName,
  program,
}) => {
  return (
    <CustomModal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="md:max-h-[800px] md:w-[700px]"
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
              aria-label="Welcome"
            >
              🎉
            </span>
          </div>

          <h3 className="max-w-full truncate text-lg font-semibold text-black sm:text-xl md:text-2xl">
            Hi {userName}!
          </h3>
          <p className="text-gray-dark max-w-[95%] text-sm leading-relaxed md:max-w-[90%] md:text-base">
            Welcome to the <strong>{program.name}</strong> programme.
          </p>
          <p className="text-gray-dark max-w-[95%] text-sm leading-relaxed md:max-w-[90%] md:text-base">
            Watch the short intro video below to understand how this programme
            works and how to complete your pathway tasks successfully.
          </p>

          <div className="mt-1 flex w-full justify-center md:mt-2">
            <div className="relative aspect-video w-full max-w-[601px] overflow-hidden rounded-lg border border-white/20 shadow-md">
              <iframe
                className="h-full w-full"
                src="https://www.youtube.com/embed/77vgI4VE8HY?rel=0&modestbranding=1"
                title="YouTube Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          <button
            type="button"
            className="btn hover:btn-outline hover:text-green bg-green border-green btn-sm mt-1 w-full max-w-[240px] text-white normal-case hover:bg-white md:w-1/2"
            onClick={onClose}
          >
            Got it!
          </button>
        </div>
      </div>
    </CustomModal>
  );
};
