import React, { useCallback, useEffect, useState } from "react";
import type { EmblaCarouselType } from "embla-carousel";

interface IUseSelectedSnapDisplay {
  selectedSnap: number;
  snapCount: number;
}

export const useSelectedSnapDisplay = (
  emblaApi: EmblaCarouselType | undefined,
): IUseSelectedSnapDisplay => {
  const [selectedSnap, setSelectedSnap] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  const updateScrollSnapState = useCallback((emblaApi: EmblaCarouselType) => {
    setSnapCount(emblaApi.scrollSnapList().length);
    setSelectedSnap(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    updateScrollSnapState(emblaApi);
    emblaApi.on("select", updateScrollSnapState);
    emblaApi.on("reInit", updateScrollSnapState);
  }, [emblaApi, updateScrollSnapState]);

  return {
    selectedSnap,
    snapCount,
  };
};

export const SelectedSnapDisplay: React.FC<{
  selectedSnap: number;
  snapCount: number;
}> = (props) => {
  const { selectedSnap, snapCount } = props;

  return (
    <div className="flex w-24 select-none items-center justify-end font-semibold">
      {selectedSnap + 1} / {snapCount}
    </div>
  );
};
