import { IoMdAlert } from "react-icons/io";

const FormRequiredFieldMessage: React.FC = () => {
  return (
    <div className="border-gray flex flex-row items-center rounded-lg border-[1px] border-dashed p-2 text-xs italic">
      <IoMdAlert className="text-yellow mr-2 h-5 w-5" />
      indicates a required field
    </div>
  );
};

export default FormRequiredFieldMessage;
