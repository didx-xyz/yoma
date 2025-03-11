import { useEffect, useRef, useState } from "react";
import type { OpportunitySkillTopCompleted } from "~/api/models/organizationDashboard";
import CustomSlider from "~/components/Carousel/CustomSlider";
import NoRowsMessage from "~/components/NoRowsMessage";

interface SkillsListChartProps {
  data: OpportunitySkillTopCompleted | undefined;
}

interface SkillBubble {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  name: string;
  count: number;
}

export const SkillsList: React.FC<SkillsListChartProps> = ({ data }) => {
  // Refs and state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const skillColors = useRef<Map<string, string>>(new Map());
  const [bubbles, setBubbles] = useState<SkillBubble[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [hoverBubble, setHoverBubble] = useState<string | null>(null);
  const [draggedBubble, setDraggedBubble] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [clickWithoutDrag, setClickWithoutDrag] = useState<boolean>(false);

  // Constants
  const COLOR_GRAY = "#f3f6fa";
  const MIN_RADIUS = 30;
  const MAX_RADIUS = 75;

  /**
   * Generate a unique color for each skill with an evenly distributed hue
   * on the color wheel with soft, pastel-like appearance
   */
  const getColorForSkill = (id: string) => {
    if (skillColors.current.has(id)) {
      return skillColors.current.get(id)!;
    }

    const totalSkills = data?.topCompleted.length || 1;
    const skillIndex =
      data?.topCompleted.findIndex((skill) => skill.id === id) || 0;

    // Distribute hues evenly around the color wheel
    const hue = (skillIndex / totalSkills) * 360;

    // Use pastel colors (low saturation, high lightness)
    const saturation = 60 + (skillIndex % 3) * 3; // 60-69%
    const lightness = 70 + (skillIndex % 5) * 2; // 70-79%

    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    skillColors.current.set(id, color);
    return color;
  };

  /**
   * Legend component showing color-coded skills and counts
   */
  const Legend = () => (
    <>
      {data?.topCompleted.map((skill) => (
        <div
          key={`legend-${skill.id}`}
          className="flex cursor-pointer select-none flex-col gap-1"
          onClick={() =>
            setSelectedSkill((prevSkill) =>
              prevSkill === skill.id ? null : skill.id,
            )
          }
        >
          <div className="flex flex-row items-center gap-3">
            <div
              className="rounded-lg p-1"
              style={{
                backgroundColor:
                  selectedSkill !== null && selectedSkill !== skill.id
                    ? COLOR_GRAY
                    : getColorForSkill(skill.id),
              }}
            >
              🎖️
            </div>
            <div
              className="text-md max-w-20 truncate font-semibold"
              title={skill.name}
            >
              {skill.name}
            </div>
          </div>
          <div
            className="text-xl font-semibold md:text-3xl"
            style={{
              color:
                selectedSkill === null || selectedSkill === skill.id
                  ? getColorForSkill(skill.id)
                  : "#000000",
            }}
          >
            {skill.countCompleted.toLocaleString()}
          </div>
        </div>
      ))}
    </>
  );

  /**
   * Initialize canvas and calculate bubble positions in a grid layout
   * with bubble size proportional to skill count
   */
  useEffect(() => {
    if (!canvasRef.current || !data?.topCompleted.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const maxCount = Math.max(
      ...data.topCompleted.map((skill) => skill.countCompleted),
    );
    const minCount = Math.min(
      ...data.topCompleted.map((skill) => skill.countCompleted),
    );

    // Sort skills by count (ascending)
    const sortedSkills = [...data.topCompleted].sort(
      (a, b) => a.countCompleted - b.countCompleted,
    );

    const newBubbles: SkillBubble[] = [];
    const padding = 30; // Padding from canvas edges
    const totalSkills = sortedSkills.length;

    // Create an approximately square grid
    const columns = Math.ceil(Math.sqrt(totalSkills));
    const rows = Math.ceil(totalSkills / columns);
    const cellWidth = (canvas.width - padding * 2) / columns;
    const cellHeight = (canvas.height - padding * 2) / rows;

    sortedSkills.forEach((skill, index) => {
      // Scale radius based on count
      const radius =
        MIN_RADIUS +
        ((skill.countCompleted - minCount) / (maxCount - minCount || 1)) *
          (MAX_RADIUS - MIN_RADIUS);

      // Position in grid with some random jitter
      const col = index % columns;
      const row = Math.floor(index / columns);
      const cellX = padding + col * cellWidth;
      const cellY = padding + row * cellHeight;

      // Add randomness while keeping bubbles within their cells
      const jitterX = (cellWidth - radius * 2) * 0.8;
      const jitterY = (cellHeight - radius * 2) * 0.8;
      const x = cellX + radius + (jitterX > 0 ? Math.random() * jitterX : 0);
      const y = cellY + radius + (jitterY > 0 ? Math.random() * jitterY : 0);

      newBubbles.push({
        id: skill.id,
        x,
        y,
        radius,
        color: getColorForSkill(skill.id),
        name: skill.name,
        count: skill.countCompleted,
      });
    });

    // Sort bubbles so higher counts appear on top
    newBubbles.sort((a, b) => a.count - b.count);
    setBubbles(newBubbles);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Draw the bubbles on canvas with text and hover effects
   */
  useEffect(() => {
    if (!canvasRef.current || !bubbles.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /**
     * Truncate text to fit within a maximum width
     */
    const truncateText = (
      text: string,
      maxWidth: number,
      fontSize: number,
    ): string => {
      ctx.font = `bold ${fontSize}px Arial`;

      // Return text as-is if it already fits
      if (ctx.measureText(text).width <= maxWidth) return text;

      // Binary search for optimal length with ellipsis
      const ellipsis = "...";
      let start = 0;
      let end = text.length;
      let mid;

      while (start < end) {
        mid = Math.floor((start + end) / 2);
        const truncated = text.substr(0, mid) + ellipsis;

        if (ctx.measureText(truncated).width <= maxWidth) {
          start = mid + 1;
        } else {
          end = mid;
        }
      }

      return text.substr(0, Math.max(1, start - 1)) + ellipsis;
    };

    /**
     * Determine whether a color should be considered "dark" for contrast purposes
     */
    const isColorDark = (color: string): boolean => {
      // Parse HSL color values
      const match = color.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/);
      if (match) {
        const h = parseInt(match[1]!, 10) / 360;
        const s = parseInt(match[2]!, 10) / 100;
        const l = parseInt(match[3]!, 10) / 100;

        // Special handling for red/orange hues
        const isRedOrOrange = h < 0.1 || h > 0.9;
        if (isRedOrOrange && s > 0.4) return l < 0.7;

        // Convert HSL to RGB
        let r, g, b;

        if (s === 0) {
          r = g = b = l; // achromatic
        } else {
          const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
          };

          const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          const p = 2 * l - q;
          r = hue2rgb(p, q, h + 1 / 3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1 / 3);
        }

        // Calculate perceived brightness using the WCAG formula
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness < 0.5;
      }

      // Handle predefined colors
      if (color === COLOR_GRAY) return false; // Gray is light

      return true; // Default to dark if unknown
    };

    /**
     * Draw tooltip for hovered bubble
     */
    const drawTooltip = (bubble: SkillBubble) => {
      if (hoverBubble === bubble.id && !draggedBubble) {
        const padding = 8;
        const tooltipText = `${bubble.name}: ${bubble.count.toLocaleString()}`;

        // Set tooltip style and measure text
        ctx.font = "14px Arial";
        const metrics = ctx.measureText(tooltipText);
        const tooltipWidth = metrics.width + padding * 2;
        const tooltipHeight = 28;

        // Position tooltip above bubble
        const tooltipX = Math.min(
          bubble.x - tooltipWidth / 2,
          canvas.width - tooltipWidth - 5,
        );
        const tooltipY = Math.max(
          bubble.y - bubble.radius - tooltipHeight - 10,
          5,
        );

        // Draw tooltip background
        ctx.fillStyle = "#565b6f";
        ctx.beginPath();
        ctx.rect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
        ctx.fill();

        // Draw tooltip text
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(
          `🎖️${tooltipText}`,
          tooltipX + padding,
          tooltipY + tooltipHeight / 2,
        );
      }
    };

    // Clear canvas before redrawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw non-selected bubbles first
    bubbles.forEach((bubble) => {
      if (
        (selectedSkill !== null && selectedSkill === bubble.id) ||
        (draggedBubble !== null && draggedBubble === bubble.id)
      ) {
        // Skip selected/dragged bubble (will draw last)
        return;
      }

      // Draw bubble circle
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
      const isGrayed = selectedSkill !== null;
      const bubbleColor = isGrayed ? COLOR_GRAY : bubble.color;
      ctx.fillStyle = bubbleColor;
      ctx.fill();

      // Add text to bubble if large enough
      if (bubble.radius >= MIN_RADIUS) {
        // Choose text color based on background
        ctx.fillStyle = isGrayed
          ? "#000000"
          : isColorDark(bubbleColor)
            ? "#ffffff"
            : "#000000";

        // Draw skill name
        const nameSize = Math.max(14, bubble.radius / 3);
        ctx.font = `bold ${nameSize}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Truncate text if needed
        const maxTextWidth = bubble.radius * (bubble.radius < 30 ? 1.2 : 1.8);
        const truncatedName = truncateText(bubble.name, maxTextWidth, nameSize);

        // For very small bubbles, just show first letter
        const displayName =
          bubble.radius < 28 && bubble.name.length > 3
            ? bubble.name.charAt(0).toUpperCase()
            : truncatedName;

        // For normal bubbles - change these positioning values
        ctx.fillText(displayName, bubble.x, bubble.y - bubble.radius / 2.5); // Move name higher up

        // Draw count
        const countSize = Math.max(16, bubble.radius / 2);
        ctx.font = `bold ${countSize}px Arial`;
        ctx.fillText(
          `🎖️${bubble.count.toLocaleString()}`,
          bubble.x,
          bubble.y + bubble.radius / 3, // Move count lower down
        );
      }

      // Show tooltip on hover
      if (hoverBubble === bubble.id) {
        drawTooltip(bubble);
      }
    });

    // Draw selected/dragged bubble on top
    const topBubble = bubbles.find(
      (bubble) =>
        (selectedSkill !== null && bubble.id === selectedSkill) ||
        (draggedBubble !== null && bubble.id === draggedBubble),
    );

    if (topBubble) {
      // Draw bubble circle
      ctx.beginPath();
      ctx.arc(topBubble.x, topBubble.y, topBubble.radius, 0, Math.PI * 2);
      ctx.fillStyle = topBubble.color;
      ctx.fill();

      if (topBubble.radius >= MIN_RADIUS) {
        // Choose text color based on background
        ctx.fillStyle = isColorDark(topBubble.color) ? "#ffffff" : "#000000";

        // Draw skill name
        const nameSize = Math.max(14, topBubble.radius / 3);
        ctx.font = `bold ${nameSize}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Truncate text if needed
        const maxTextWidth =
          topBubble.radius * (topBubble.radius < 30 ? 1.2 : 1.8);
        const truncatedName = truncateText(
          topBubble.name,
          maxTextWidth,
          nameSize,
        );

        // For very small bubbles, just show first letter
        const displayName =
          topBubble.radius < 28 && topBubble.name.length > 3
            ? topBubble.name.charAt(0).toUpperCase()
            : truncatedName;

        ctx.fillText(
          displayName,
          topBubble.x,
          topBubble.y - topBubble.radius / 2.5, // Match the same spacing here
        );

        // Draw count
        const countSize = Math.max(16, topBubble.radius / 2);
        ctx.font = `bold ${countSize}px Arial`;
        ctx.fillText(
          `🎖️${topBubble.count.toLocaleString()}`,
          topBubble.x,
          topBubble.y + topBubble.radius / 3, // Match the same spacing here
        );
      }

      // Show tooltip on hover
      if (hoverBubble === topBubble.id) {
        drawTooltip(topBubble);
      }
    }
  }, [bubbles, selectedSkill, draggedBubble, hoverBubble]);

  /**
   * Handle mouse down event for bubble selection and drag initiation
   */
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find which bubble is being clicked (reverse order for proper z-index)
    const clickedBubble = [...bubbles].reverse().find((bubble) => {
      const dx = bubble.x - x;
      const dy = bubble.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= bubble.radius;
    });

    if (clickedBubble) {
      // Track click without drag for toggle behavior
      if (selectedSkill === clickedBubble.id) {
        setClickWithoutDrag(true);
      }

      setDraggedBubble(clickedBubble.id);
      setDragOffset({ x: x - clickedBubble.x, y: y - clickedBubble.y });

      // Set selected skill if not already selected
      if (selectedSkill !== clickedBubble.id) {
        setSelectedSkill(clickedBubble.id);
      }
    } else {
      // Clicking outside bubbles clears selection
      setSelectedSkill(null);
    }
  };

  /**
   * Handle mouse up event, including selection toggle behavior
   */
  const handleMouseUp = () => {
    // Toggle selection off if clicked without dragging
    if (clickWithoutDrag && selectedSkill === draggedBubble) {
      setSelectedSkill(null);
    }

    setClickWithoutDrag(false);
    setDraggedBubble(null);
    setDragOffset(null);
  };

  /**
   * Handle mouse move for dragging bubbles and hover effects
   */
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggedBubble && dragOffset) {
      // Update dragged bubble position
      const newBubbles = bubbles.map((bubble) => {
        if (bubble.id === draggedBubble) {
          // Keep bubble within canvas boundaries
          const newX = Math.min(
            Math.max(x - dragOffset.x, bubble.radius),
            canvas.width - bubble.radius,
          );
          const newY = Math.min(
            Math.max(y - dragOffset.y, bubble.radius),
            canvas.height - bubble.radius,
          );

          return { ...bubble, x: newX, y: newY };
        }
        return bubble;
      });
      setBubbles(newBubbles);
    } else {
      // Update hover state
      const hovered = [...bubbles].reverse().find((bubble) => {
        const dx = bubble.x - x;
        const dy = bubble.y - y;
        return Math.sqrt(dx * dx + dy * dy) <= bubble.radius;
      });

      setHoverBubble(hovered?.id || null);
      canvas.style.cursor = hovered ? "grab" : "default";
    }
  };

  // Show placeholder when no data available
  if (!data?.topCompleted.length) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg bg-gray-light">
        <NoRowsMessage
          title={"Not enough data to display."}
          description={
            "This chart will display data as more activity is recorded on the system."
          }
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col rounded-lg border-2 border-dotted border-gray">
      <CustomSlider
        className="!m-4 !min-h-[80px]"
        sliderClassName="!md:gap-8 !gap-4"
      >
        <Legend />
      </CustomSlider>

      <canvas
        ref={canvasRef}
        className="mt-4 h-full w-full flex-grow rounded"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setHoverBubble(null);
          setDraggedBubble(null);
        }}
      />
    </div>
  );
};
