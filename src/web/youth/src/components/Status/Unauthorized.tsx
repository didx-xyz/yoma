import { FaExclamationTriangle } from "react-icons/fa";

export const Unauthorized = () => (
  <div className="container max-w-md">
    <div className="flex flex-col place-items-center justify-center rounded-xl bg-white p-4">
      <h4>401 - Not authorized</h4>

      <FaExclamationTriangle size={100} className="my-10 text-yellow" />

      <p className="p-4 text-sm">Please sign in to view this page.</p>
    </div>
  </div>
);
