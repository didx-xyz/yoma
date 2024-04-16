import React, { useContext, useMemo, useRef, useState } from "react";
import ReactModal from "react-modal";

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
  //eslint-disable-next-line @typescript-eslint/ban-types
  const resolver = useRef<Function>();

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
        return new Promise(function (resolve) {
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
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (resolver?.current) resolver.current(true);
    onHide();
  };

  const handleCancel = () => {
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (resolver?.current) resolver.current(false);
    onHide();
  };

  return (
    <ConfirmationModalContext.Provider value={modalContext}>
      {props.children}

      {content && (
        <ReactModal
          isOpen={show}
          shouldCloseOnOverlayClick={true}
          onRequestClose={onHide}
          className="fixed inset-0 z-50 m-auto h-[170px] w-[380px] rounded-lg bg-white p-4 font-openSans outline-2 duration-100 animate-in zoom-in md:mt-[10%]"
          portalClassName={"fixed z-40"}
          overlayClassName="fixed inset-0 bg-overlay"
        >
          <div className="flex h-full flex-col space-y-2">
            {/* TITLE */}
            {content.title && <p className="text-lg">{content.title}</p>}

            {/* MESSAGE BODY */}
            {content.message}

            {/* BUTTONS */}
            <div className="mt-10 flex h-full flex-row place-items-center justify-center space-x-2">
              {(content.showCancelButton == null ||
                content.showCancelButton == true) && (
                <button
                  className="btn-default btn btn-sm"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              )}
              {(content.showOkButton == null ||
                content.showOkButton == true) && (
                <button className="btn btn-primary btn-sm" onClick={handleOk}>
                  OK
                </button>
              )}
            </div>
          </div>
        </ReactModal>
      )}
    </ConfirmationModalContext.Provider>
  );
};

const useConfirmationModalContext = (): ModalContextType =>
  useContext(ConfirmationModalContext);

export { useConfirmationModalContext, useModalShow };

export default ConfirmationModalContextProvider;
