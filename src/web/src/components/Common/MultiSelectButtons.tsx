import React, { useState } from "react";

interface Button {
  id: string;
  title: string;
  selected: boolean;
}

interface MultiSelectButtonsProps {
  buttons: Button[];
  onChange: (buttons: Button[]) => void;
}

const MultiSelectButtons: React.FC<MultiSelectButtonsProps> = ({
  buttons,
  onChange,
}) => {
  const [buttonState, setButtonState] = useState<Button[]>(buttons);

  const handleButton = (buttonId: string) => {
    const newButtons = buttonState.map((btn) => {
      if (btn.id !== buttonId) return btn;
      btn.selected = !btn.selected;
      return btn;
    });
    setButtonState(newButtons);
    onChange(newButtons);
  };

  return (
    <div className="flex flex-row gap-2">
      {buttonState.map((bt) => (
        <button
          key={bt.id}
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

export default MultiSelectButtons;
