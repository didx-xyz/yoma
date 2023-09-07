import styles from "./Loading.module.scss";

export const Loading: React.FC = () => {
  return (
    <div className={styles.overlay}>
      <div
        className={`fixed inset-0 z-50 m-auto mt-36 h-[120px] w-[120px] rounded-lg border-2 bg-white duration-300 animate-in fade-in md:mt-auto md:h-[150px] md:w-[150px]`}
      >
        <div className="flex h-full w-full flex-col place-items-center justify-center gap-2">
          <div className={styles["lds-dual-ring-lg"]}></div>
          <div>Loading...</div>
        </div>
      </div>
    </div>
  );
};
