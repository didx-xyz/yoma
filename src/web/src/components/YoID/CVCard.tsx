import iconImage from "public/images/icon-rocket.webp";
import { RoundedImage } from "../RoundedImage";

export const CVCard: React.FC = () => {
  return (
    <div className="flex w-full max-w-md flex-col place-items-center justify-center rounded-xl bg-white p-4">
      <RoundedImage
        icon={iconImage}
        alt="Icon Rocket"
        imageWidth={28}
        imageHeight={28}
      />
      <div className="text-smx font-mediumx my-2 font-semibold text-black">
        Under development
      </div>
      <p className="text-center text-sm text-gray-dark">Coming soon ;)</p>
    </div>
  );
};
