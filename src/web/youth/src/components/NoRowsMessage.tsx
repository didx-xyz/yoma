import React from "react";

interface InputProps {
  title?: string | null;
  description?: string | null;
}

const NoRowsMessage: React.FC<InputProps> = ({ title, description }) => {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <svg
        className="text-gray-400 mb-4 h-16 w-16"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
      <h2 className="text-gray-900 mb-2 text-lg font-medium">
        {title ?? "No rows found"}
      </h2>
      <p className="text-gray-500 text-center">
        {description ??
          "There are no rows to display at the moment. Please check back later."}
      </p>
    </div>
  );
};

export default NoRowsMessage;
