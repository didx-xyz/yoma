import styles from "./Loading.module.scss";

export const Loading: React.FC = () => {
  return (
    <div className={styles.overlay}>
      <div
        className={`fixed inset-0 z-50 m-auto h-[120px] w-[120px] rounded-lg bg-white opacity-0 shadow-2xl transition-all duration-300 ease-in-out motion-safe:animate-[fadeIn_0.3s_ease-out_forwards]`}
      >
        <div className="flex h-full w-full flex-col place-items-center justify-center gap-2">
          <div className={styles["lds-dual-ring-lg"]}></div>
          <div className="text-sm">Loading...</div>
        </div>
      </div>
    </div>
  );
};
