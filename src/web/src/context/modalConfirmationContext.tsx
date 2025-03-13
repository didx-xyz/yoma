import React, { useContext, useMemo, useRef, useState } from "react";
import CustomModal from "~/components/Common/CustomModal";

type ResolverType = (value: boolean) => void;

interface UseModalShowReturnType {
  show: boolean;
  setShow: (value: boolean) => void;
  onHide: () => void;
}

const useModalShow = (): UseModalShowReturnType => {
  const [show, setShow] = useState(false);

  const handleOnHide = () => {
    setShow(false);
  };

  return {
    show,
    setShow,
    onHide: handleOnHide,
  };
};

interface ModalContextType {
  showConfirmation: (
    title: string,
    message: string | JSX.Element,
    showCancelButton?: boolean,
    showOkButton?: boolean,
  ) => Promise<boolean>;
}

interface ConfirmationModalContextProviderProps {
  children: React.ReactNode;
}

const ConfirmationModalContext = React.createContext<ModalContextType>(
  {} as ModalContextType,
);

const ConfirmationModalContextProvider: React.FC<
  ConfirmationModalContextProviderProps
> = (props) => {
  const { setShow, show, onHide } = useModalShow();
  const [content, setContent] = useState<{
    title: string;
    message: string | JSX.Element;
    showCancelButton?: boolean;
    showOkButton?: boolean;
  } | null>();
  const resolver = useRef<ResolverType | null>(null);

  const handleShow = useMemo(
    () =>
      (
        title: string,
        message: string | JSX.Element,
        showCancelButton?: boolean,
        showOkButton?: boolean,
      ): Promise<boolean> => {
        setContent({
          title,
          message,
          showCancelButton,
          showOkButton,
        });
        setShow(true);
        return new Promise<boolean>((resolve) => {
          resolver.current = resolve;
        });
      },
    [setContent, setShow],
  );

  const modalContext = useMemo<ModalContextType>(
    () => ({
      showConfirmation: handleShow,
    }),
    [handleShow],
  );

  const handleOk = () => {
    resolver.current?.(true);
    onHide();
  };

  const handleCancel = () => {
    resolver.current?.(false);
    onHide();
  };

  return (
    <ConfirmationModalContext.Provider value={modalContext}>
      {props.children}

      {content && (
        <CustomModal
          isOpen={show}
          shouldCloseOnOverlayClick={true}
          onRequestClose={onHide}
          className="md:h-fit md:w-[400px]"
        >
          <div className="flex flex-col p-4">
            {/* TITLE */}
            {content.title && <p className="text-lg">{content.title}</p>}

            {/* MESSAGE BODY */}
            <div className="text-center md:text-start">{content.message}</div>

            {/* BUTTONS */}
            <div className="mt-10 flex h-full flex-row place-items-center justify-center space-x-2">
              {(content.showCancelButton == null ||
                content.showCancelButton == true) && (
                <button
                  className="btn btn-outline btn-primary btn-sm w-1/2 flex-shrink rounded-full border-purple bg-white normal-case text-purple"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              )}
              {(content.showOkButton == null ||
                content.showOkButton == true) && (
                <button
                  className="btn btn-primary btn-sm w-1/2 flex-shrink rounded-full bg-purple normal-case text-white"
                  onClick={handleOk}
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </CustomModal>
      )}
    </ConfirmationModalContext.Provider>
  );
};

const useConfirmationModalContext = (): ModalContextType =>
  useContext(ConfirmationModalContext);

export { useConfirmationModalContext, useModalShow };

export default ConfirmationModalContextProvider;
