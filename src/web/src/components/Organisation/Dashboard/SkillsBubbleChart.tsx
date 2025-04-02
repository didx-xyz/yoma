import { useAtomValue } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import Chart, { type ReactGoogleChartEvent } from "react-google-charts";
import { screenWidthAtom } from "~/lib/store";
import CustomSlider from "~/components/Carousel/CustomSlider";
import type { OpportunitySkillTopCompleted } from "~/api/models/organizationDashboard";

// Converts HSL color values to Hex color format.
function hslToHex(h: number, s: number, l: number): string {
  // Convert HSL to RGB
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

interface SkillsBubbleChartProps {
  data: OpportunitySkillTopCompleted | undefined;
}

export const SkillsBubbleChart: React.FC<SkillsBubbleChartProps> = ({
  data,
}) => {
  const chartRef = useRef<any>(null);

  // Index of the selected skill in the sorted skills array. Null if no skill is selected.
  const [selectedSkillIndex, setSelectedSkillIndex] = useState<number | null>(
    null,
  );

  // Forces a redraw of the chart when the screen width changes.
  const [key, setKey] = useState("");

  const screenWidth = useAtomValue(screenWidthAtom);

  useEffect(() => {
    setKey(`org-skills-bubble-chart-${screenWidth}`);
  }, [screenWidth]);

  // Calculates the chart height based on the screen width.
  const chartHeight = useMemo(() => {
    return screenWidth < 768 ? 300 : 440;
  }, [screenWidth]);

  // Sorts the skills alphabetically by name.
  const sortedSkills = useMemo(() => {
    if (!data || !data.topCompleted) return [];
    return [...data.topCompleted].sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  // Generates a color palette for the skills.
  const colorPalette = useMemo(() => {
    const numSkills = sortedSkills.length;
    if (numSkills === 0) return [];

    // Generate colors with good distribution in hex format
    return Array.from({ length: numSkills }, (_, i) => {
      const hue = ((i * 360) / numSkills) % 360;
      return hslToHex(hue, 70, 50);
    });
  }, [sortedSkills.length]);

  // Prepares the data in the format required by the BubbleChart.
  const localData = useMemo(() => {
    if (sortedSkills.length === 0) return [];

    const maxCount = Math.max(...sortedSkills.map((s) => s.countCompleted), 0);

    const header = [
      "ID", // Skill Name
      "X", // X position
      "Y", // Completed Count
      { role: "style" }, // Bubble color
      "Size", // Bubble size
    ];

    const rows = sortedSkills.map((skill, index) => {
      const bubbleSize =
        maxCount > 0 ? (skill.countCompleted / maxCount) * 40 : 10;
      const color = colorPalette[index];

      return [
        skill.name, // ID
        index, // X position
        skill.countCompleted, // Y value
        color, // Style (color)
        bubbleSize, // Size
      ];
    });

    return [header, ...rows];
  }, [sortedSkills, colorPalette]);

  // Renders the legend for the chart.
  const Legend = () => {
    if (sortedSkills.length === 0) return null;

    const handleSkillClick = (index: number) => {
      setSelectedSkillIndex((prevIndex) =>
        prevIndex === index ? null : index,
      );
    };

    return (
      <>
        {sortedSkills.map((skill, index) => {
          const color = colorPalette[index] || "#000000";

          const isSelected = selectedSkillIndex === index;
          const bubbleStyle = {
            backgroundColor: isSelected ? color : "#D3D3D3",
          };

          return (
            <div
              key={skill.id}
              className={`flex cursor-pointer flex-col gap-1 ${
                isSelected ? "selected" : ""
              }`}
              onClick={() => handleSkillClick(index)}
            >
              <div className="flex flex-row items-center gap-3 select-none">
                <div className="rounded-full p-2" style={bubbleStyle}>
                  {/*  */}
                </div>
                <div
                  className="max-w-20 truncate text-sm font-semibold"
                  title={skill.name}
                >
                  {skill.name}
                </div>
              </div>
              <div className="text-xl font-bold select-none">
                {skill.countCompleted.toLocaleString()}
              </div>
            </div>
          );
        })}
      </>
    );
  };

  // Options for the BubbleChart.
  const chartOptions = useMemo(
    () => ({
      legend: "none",
      height: chartHeight,
      hAxis: {
        title: "Skill (sorted alphabetically)",
        textPosition: "out",
        minValue: 0,
        maxValue: sortedSkills.length,
      },
      vAxis: {
        title: "Completed Count",
        minValue: 0,
        maxValue:
          Math.max(...sortedSkills.map((s) => s.countCompleted), 0) + 10,
        format: "#",
        gridlines: { color: "#f5f5f5" },
        textStyle: { fontSize: 10 },
      },
      chartArea: {
        left: "10%",
        right: "10%",
        top: "10%",
        bottom: "15%",
        width: "80%",
        height: "70%",
      },
      bubble: {
        textStyle: {
          fontSize: 12,
          bold: true,
        },
      },
      tooltip: {
        isHtml: true,
      },
      colors:
        selectedSkillIndex !== null
          ? sortedSkills
              .map((_, index) =>
                index === selectedSkillIndex ? colorPalette[index] : "#D3D3D3",
              )
              .filter((color): color is string => color !== undefined)
          : colorPalette.filter(
              (color): color is string => color !== undefined,
            ),
    }),
    [chartHeight, sortedSkills, colorPalette, selectedSkillIndex],
  );

  // Chart events to handle user interactions.
  const chartEvents = useMemo(
    () => [
      {
        eventName: "ready",
        callback: ({ chartWrapper }: { chartWrapper: any }) => {
          chartRef.current = chartWrapper;
        },
      },
      {
        eventName: "select",
        callback: ({ chartWrapper }) => {
          if (!chartWrapper) return;
          const selection = chartWrapper.getChart().getSelection();
          if (selection?.length) {
            const selectedItem = selection[0];
            const rowIndex = selectedItem?.row;
            setSelectedSkillIndex(
              rowIndex === selectedSkillIndex ? null : rowIndex,
            );
          } else {
            setSelectedSkillIndex(null);
          }
        },
      },
      {
        eventName: "statechange",
        callback: ({ chartWrapper }) => {
          if (!chartWrapper) return;
          setSelectedSkillIndex(null);
        },
      },
    ],
    [selectedSkillIndex],
  );

  return (
    <>
      <CustomSlider sliderClassName="!md:gap-8 !gap-4">
        <Legend />
      </CustomSlider>

      {localData.length > 1 ? (
        <Chart
          key={key}
          chartType="BubbleChart"
          loader={
            <div className="flex w-full items-center justify-center">
              <span className="loading loading-spinner loading-lg text-green"></span>
            </div>
          }
          data={localData}
          options={chartOptions}
          chartEvents={chartEvents as ReactGoogleChartEvent[]}
        />
      ) : (
        <div className="bg-gray-light mx-4 flex flex-col items-center justify-center rounded-lg p-4 text-center text-xs">
          Not enough data to display
        </div>
      )}
    </>
  );
};
