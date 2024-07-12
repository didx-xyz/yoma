import React from "react";
import {
  IoInformationCircleOutline,
  IoCheckmarkCircleOutline,
  IoWarningOutline,
  IoAlertCircleOutline,
} from "react-icons/io5";

export enum FormMessageType {
  Info = "info",
  Success = "success",
  Warning = "warning",
  Error = "error",
}

interface MessageProps {
  messageType: FormMessageType;
  className?: string;
  children: React.ReactNode;
}

const FormMessage: React.FC<MessageProps> = ({
  messageType,
  className,
  children,
}) => {
  const iconColorClass = {
    [FormMessageType.Info]: "text-blue",
    [FormMessageType.Success]: "text-green",
    [FormMessageType.Warning]: "text-yellow",
    [FormMessageType.Error]: "text-red-500",
  }[messageType];

  const borderColorClass = {
    [FormMessageType.Info]: "border-gray",
    [FormMessageType.Success]: "border-green",
    [FormMessageType.Warning]: "border-yellow",
    [FormMessageType.Error]: "border-red-500",
  }[messageType];

  const Icon = {
    [FormMessageType.Info]: IoInformationCircleOutline,
    [FormMessageType.Success]: IoCheckmarkCircleOutline,
    [FormMessageType.Warning]: IoWarningOutline,
    [FormMessageType.Error]: IoAlertCircleOutline,
  }[messageType];

  return (
    <div
      className={`flex flex-row items-center rounded-lg border-[1px] p-2 ${borderColorClass} ${className}`}
    >
      <Icon className={`mr-2 h-6 w-6 ${iconColorClass}`} />
      <span className="text-xs">{children}</span>
    </div>
  );
};

export default FormMessage;
