import React, { useEffect, useState } from "react";
import { IoMdArrowDown, IoMdArrowUp } from "react-icons/io";

interface Button {
  id: string;
  title: string;
  selected: boolean;
}

interface SelectButtonsProps {
  id: string;
  buttons: Button[];
  isMulti?: boolean;
  maxRows?: number;
  onChange: (buttons: Button[]) => void;
}

const SelectButtons: React.FC<SelectButtonsProps> = ({
  id,
  buttons,
  isMulti,
  maxRows,
  onChange,
}) => {
  const [buttonState, setButtonState] = useState<Button[]>(buttons);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    setButtonState(buttons);
  }, [buttons]);

  const handleButton = (buttonId: string) => {
    const newButtons = buttonState.map((btn) => {
      if (isMulti) {
        if (btn.id !== buttonId) return btn;
        btn.selected = !btn.selected;
        return btn;
      } else {
        return {
          ...btn,
          selected: btn.id === buttonId ? true : false,
        };
      }
    });
    setButtonState(newButtons);
    onChange(newButtons);
  };

  const displayedButtons = showMore
    ? buttonState
    : buttonState.slice(0, maxRows);

  return (
    <div className="flex flex-row flex-wrap gap-2">
      {displayedButtons.map((bt) => (
        <button
          key={`${id}_${bt.id}`}
          type="button"
          onClick={() => handleButton(bt.id)}
          className={`btn btn-sm text-gray-dark max-w-[300px] text-xs ${
            bt.selected
              ? "btn-secondary text-white"
              : "border-gray hover:border-gray-dark bg-white"
          }`}
        >
          <p className="truncate">{bt.title}</p>
        </button>
      ))}

      {maxRows && buttonState.length > maxRows && (
        <button
          type="button"
          className="btn btn-sm border-gray text-gray-dark hover:border-gray-dark text-xs"
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? (
            <>
              <IoMdArrowUp />
              <span>Show Less</span>
            </>
          ) : (
            <>
              <IoMdArrowDown />
              <span>Show More</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default SelectButtons;
