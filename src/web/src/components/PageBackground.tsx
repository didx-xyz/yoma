export const PageBackground: React.FC<{ smallHeight?: boolean }> = ({
  smallHeight,
}) => {
  // return an absolute positioned page header background based on the color of the theme (bg-theme)
  if (smallHeight)
    return (
      <div className="bg-theme absolute left-0 top-0 z-0 h-32 w-full bg-[url('/images/world-map.svg')] bg-fixed bg-top bg-no-repeat md:h-[16rem]" />
    );
  else
    return (
      <div className="bg-theme absolute left-0 top-0 z-0 h-64 w-full bg-[url('/images/world-map.svg')] bg-fixed bg-top bg-no-repeat md:h-[23rem]" />
    );
};
