import React, { useState } from "react";

interface Button {
  id: string;
  title: string;
  selected: boolean;
}

interface SelectButtonsProps {
  id: string;
  buttons: Button[];
  isMulti?: boolean;
  onChange: (buttons: Button[]) => void;
}

const SelectButtons: React.FC<SelectButtonsProps> = ({
  id,
  buttons,
  isMulti,
  onChange,
}) => {
  const [buttonState, setButtonState] = useState<Button[]>(buttons);

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

  return (
    <div className="flex flex-row flex-wrap gap-2">
      {buttonState.map((bt) => (
        <button
          key={`${id}_${bt.id}`}
          type="button"
          onClick={() => handleButton(bt.id)}
          className={`btn btn-sm ${
            bt.selected ? "btn-secondary" : "border-gray hover:border-gray-dark"
          }`}
        >
          {bt.title}
        </button>
      ))}
    </div>
  );
};

export default SelectButtons;
