import { ButtonBack, ButtonNext } from "react-scroll-snap-anime-slider";

export const NavigationButtons: React.FC<{
  currentSlide: number;
  totalSlides: number;
  visibleSlides: number;
}> = ({ currentSlide, totalSlides, visibleSlides }) => {
  const isPrevDisabled = currentSlide <= 0;
  const isNextDisabled = currentSlide + visibleSlides >= totalSlides;

  return (
    <div className="flex justify-center gap-2">
      <ButtonBack
        className="group btn btn-circle btn-sm h-10 w-10 transform-gpu cursor-pointer border-[1.5px] border-purple bg-transparent text-black transition-all duration-500 ease-bounce md:h-8 md:w-8 xl:hover:scale-110 xl:hover:border-purple xl:hover:bg-purple"
        disabled={isPrevDisabled}
      >
        <svg
          className="mr-[2px] h-[45%] w-[45%] transform text-purple transition-all duration-500 ease-bounce group-disabled:text-gray xl:group-hover:scale-110 xl:group-hover:text-white"
          viewBox="0 0 532 532"
        >
          <path
            fill="currentColor"
            d="M355.66 11.354c13.793-13.805 36.208-13.805 50.001 0 13.785 13.804 13.785 36.238 0 50.034L201.22 266l204.442 204.61c13.785 13.805 13.785 36.239 0 50.044-13.793 13.796-36.208 13.796-50.002 0a5994246.277 5994246.277 0 0 0-229.332-229.454 35.065 35.065 0 0 1-10.326-25.126c0-9.2 3.393-18.26 10.326-25.2C172.192 194.973 332.731 34.31 355.66 11.354Z"
          />
        </svg>
      </ButtonBack>
      <ButtonNext
        className="group btn btn-circle btn-sm h-10 w-10 transform-gpu cursor-pointer border-[1.5px] border-purple bg-transparent text-black transition-all duration-500 ease-bounce md:h-8 md:w-8 xl:hover:scale-110 xl:hover:border-purple xl:hover:bg-purple"
        disabled={isNextDisabled}
      >
        <svg
          className="ml-[2px] h-[45%] w-[45%] transform text-purple transition-all duration-500 ease-bounce group-disabled:text-gray xl:group-hover:scale-110 xl:group-hover:text-white"
          viewBox="0 0 532 532"
        >
          <path
            fill="currentColor"
            d="M176.34 520.646c-13.793 13.805-36.208 13.805-50.001 0-13.785-13.804-13.785-36.238 0-50.034L330.78 266 126.34 61.391c-13.785-13.805-13.785-36.239 0-50.044 13.793-13.796 36.208-13.796 50.002 0 22.928 22.947 206.395 206.507 229.332 229.454a35.065 35.065 0 0 1 10.326 25.126c0 9.2-3.393 18.26-10.326 25.2-45.865 45.901-206.404 206.564-229.332 229.52Z"
          />
        </svg>
      </ButtonNext>
    </div>
  );
};
