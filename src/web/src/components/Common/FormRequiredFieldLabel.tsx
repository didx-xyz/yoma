import { IoMdAlert } from "react-icons/io";

const FormRequiredFieldLabel: React.FC = () => {
  return (
    <div className="text-yellowx flex flex-row items-center rounded-lg border-[1px] border-dashed border-gray p-2 text-xs italic">
      <IoMdAlert className="mr-2 h-5 w-5 text-yellow" />
      indicates a required field
    </div>
    // <div className="flex flex-row items-center text-xs italic">
    //   <IoMdAlert className="mr-2 h-5 w-5 text-yellow" />
    //   indicates a required field
    // </div>
  );
};

export default FormRequiredFieldLabel;
