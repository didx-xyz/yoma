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
      className="bg-green hover:bg-purple fixed top-1/2 right-0 z-20 -mr-12 hidden -translate-y-1/2 -rotate-90 transform !rounded-none !rounded-t-md px-8 py-2 pb-4 text-sm text-white md:block"
      onClick={handleClick}
      title="Send us your feedback!"
    >
      Feedback
    </button>
  );
};
