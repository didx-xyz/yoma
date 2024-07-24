import iconImage from "public/images/icon-rocket.webp";
import { RoundedImage } from "../RoundedImage";

export const CVCard: React.FC = () => {
  return (
    <div className="flex h-[185px] w-full flex-col gap-4 rounded-lg bg-white p-4 shadow">
      <div className="flex w-full max-w-md flex-col place-items-center justify-center rounded-xl bg-white p-4">
        <RoundedImage
          icon={iconImage}
          alt="Icon Rocket"
          imageWidth={28}
          imageHeight={28}
        />

        <h2 className="text-gray-900 my-2 text-lg font-medium">
          Under development
        </h2>
        <p className="text-gray-500 text-center">Coming soon ;)</p>
      </div>
    </div>
  );
};
