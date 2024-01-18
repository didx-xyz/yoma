export const PageBackground: React.FC<{ height?: number }> = ({
  height = 23,
}) => {
  // return an absolute positioned page header background based on the color of the theme (bg-theme)
  return (
    <div
      style={{ height: `${height}rem` }}
      className="bg-theme absolute left-0 top-0 z-0 h-32 w-full bg-[url('/images/world-map.svg')] bg-fixed bg-top bg-no-repeat"
    />
  );
};
