export const Feedback: React.FC = () => {
  const handleClick = () => {
    window.open(
      "https://docs.google.com/forms/d/e/1FAIpQLSeukoAGVucKi0b0DJklw_4OGpE74z4K7wx9lw5VfXdJ4yb-Rg/formResponse",
      "_blank",
    );
  };

  return (
    <button
      aria-label="Feedback"
      className="fixed right-0 top-1/2 z-50 -mr-12 hidden -translate-y-1/2 -rotate-90 transform !rounded-none !rounded-t-md bg-green px-8 py-2 pb-4 text-sm text-white hover:bg-purple md:block"
      onClick={handleClick}
    >
      Feedback
    </button>
  );
};
