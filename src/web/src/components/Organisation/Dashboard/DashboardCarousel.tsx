import React from "react";
import type { EmblaOptionsType } from "embla-carousel";
import {
  PrevButton,
  NextButton,
  usePrevNextButtons,
} from "../../Carousel/ArrowButtons";
import useEmblaCarousel from "embla-carousel-react";
import { OpportunityCard } from "./OpportunityCard";
import {
  SelectedSnapDisplay,
  useSelectedSnapDisplay,
} from "../../Carousel/SelectedSnapDisplay";
import type {
  OpportunityInfoAnalytics,
  YouthInfo,
} from "~/api/models/organizationDashboard";
import { YouthCompletedCard } from "./YouthCompletedCard";

interface PropType {
  slides: OpportunityInfoAnalytics[] | YouthInfo[];
  orgId: string;
}

const OPTIONS: EmblaOptionsType = {
  dragFree: false,
  containScroll: "keepSnaps",
  watchSlides: true,
  watchResize: true,
};

const DashboardCarousel: React.FC<PropType> = (props: PropType) => {
  const { slides, orgId } = props;
  const [emblaRef, emblaApi] = useEmblaCarousel(OPTIONS);

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  const { selectedSnap, snapCount } = useSelectedSnapDisplay(emblaApi);

  return (
    <div>
      <div className="embla">
        <div className="embla__viewport" ref={emblaRef}>
          <div className="embla__container max-1">
            {slides?.map((item: any, index) => (
              <div className="embla__slide" key={index}>
                <div className="embla__slide__number">
                  {/* Check if item has a unique property of YouthInfo */}
                  {"userDisplayName" in item ? (
                    <YouthCompletedCard
                      key={`${item.id}_component`}
                      opportunity={item}
                      orgId={orgId}
                    />
                  ) : (
                    <OpportunityCard
                      key={`${item.id}_component`}
                      opportunity={item}
                      orgId={orgId}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {snapCount > 1 && selectedSnap < snapCount && (
          <div className="mt-2 flex w-full place-content-center justify-center">
            <div className="flex justify-center gap-4">
              <SelectedSnapDisplay
                selectedSnap={selectedSnap}
                snapCount={slides.length ?? snapCount}
              />
              <PrevButton
                onClick={onPrevButtonClick}
                disabled={prevBtnDisabled}
              />
              <NextButton
                onClick={onNextButtonClick}
                disabled={nextBtnDisabled}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCarousel;
