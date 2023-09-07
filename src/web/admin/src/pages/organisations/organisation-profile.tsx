import router from "next/router";
import { useState, type ReactElement } from "react";
import MainLayout from "~/components/Layout/Main";
import { type NextPageWithLayout } from "../_app";

const OrganisationProfile: NextPageWithLayout = () => {
  const [showModal, setShowModal] = useState(false);

  const handlePost = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    void router.push("/dashboard/opportunities");
  };

  return (
    <main className="flex h-full min-h-screen flex-col items-center justify-center">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-32">
        <h1 className="mb-4 text-4xl font-bold text-black">
          Organisation Profile
        </h1>
        <h2 className="mb-8 text-xl font-semibold text-black">
          Your organisation profile viewed by youth
        </h2>
        <div className="flex justify-center space-x-8">
          <div className="flex flex-col">
            <div className="mb-2 flex items-center">
              <input
                type="text"
                className="input mb-2 mr-4 w-[300px] border-black bg-white text-black"
                placeholder="Organisation Name"
              />
            </div>
            <div className="mb-2 flex items-center">
              <input
                type="text"
                className="input mb-2 mr-4 w-[300px] border-black bg-white text-black"
                placeholder="Organisation Physical Address"
              />
            </div>
            <div className="mb-2 flex items-center">
              <input
                type="text"
                className="input mb-2 mr-4 w-[300px] border-black bg-white text-black"
                placeholder="Organisation URL"
              />
            </div>
            <div className="mb-2 flex items-center">
              <input
                type="text"
                className="input mb-2 mr-4 w-[300px] border-black bg-white text-black"
                placeholder="Organisation Logo"
              />
            </div>
            <div className="mb-2 flex items-center">
              <input
                type="text"
                className="input mb-2 mr-4 w-[300px] border-black bg-white text-black"
                placeholder="Organisation Tagline"
              />
            </div>
            <div className="mb-2 flex items-center">
              <input
                type="text"
                className="input mb-2 mr-4 w-[300px] border-black bg-white text-black"
                placeholder="Organisation Bioghraphy"
              />
            </div>
          </div>
        </div>
        <div className="mt-20 flex justify-end space-x-4">
          <button
            type="button"
            className="btn-hover-grow border-blue-500 text-blue-500 hover:bg-gray-300 btn btn-square w-[150px] gap-2 border bg-white"
            onClick={handlePost}
          >
            Save
          </button>
          {showModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="rounded-md bg-white p-10 text-center">
                <h2 className="mb-4 text-2xl font-bold text-black">
                  Organisation Profile Successully Updated
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="bg-blue-500 mt-2 rounded-md px-4 py-2 text-white"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

OrganisationProfile.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default OrganisationProfile;
