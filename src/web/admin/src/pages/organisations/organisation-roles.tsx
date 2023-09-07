import Head from "next/head";
import router from "next/router";
import { useState, type ReactElement } from "react";
import MainLayout from "~/components/Layout/Main";
import { type NextPageWithLayout } from "../_app";

const OrganisationRoles: NextPageWithLayout = () => {
  const [showModal, setShowModal] = useState(false);

  const handlePost = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    void router.push("/dashboard/opportunities");
  };

  return (
    <>
      <Head>
        <title>Yoma Partner | Organisation Roles</title>
      </Head>
      <main className="flex h-full min-h-screen flex-col items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-32">
          <h1 className="mb-4 text-4xl font-bold text-black">
            Organisation Roles
          </h1>
          <h2 className="mb-10 text-xl font-semibold text-black">
            What role with your organisation play within Yoma?
          </h2>
          <div className="flex justify-center space-x-8">
            <div className="flex flex-col">
              <div className="mb-6 flex items-center justify-center">
                <input type="checkbox" className="form-checkbox mr-2" />
                <label
                  className="w-[auto] border-black bg-white p-2 text-black"
                  htmlFor="opportunityProvider"
                >
                  Opportunity Provider
                </label>
              </div>
              <div className="mb-6 flex items-center justify-center">
                <input type="checkbox" className="form-checkbox mr-2" />
                <label
                  className="w-[auto] border-black bg-white p-2 text-black"
                  htmlFor="educationProvider"
                >
                  Education Provider
                </label>
              </div>
              <div className="mb-6 flex items-center justify-center">
                <input type="checkbox" className="form-checkbox mr-2" />
                <label
                  className="w-[auto] border-black bg-white p-2 text-black"
                  htmlFor="marketplaceProvider"
                >
                  Marketplace Provider
                </label>
              </div>
              <div className="mb-2 flex items-center">
                <input
                  type="text"
                  className="input mb-2 mr-4 w-[300px] border-black bg-white text-black"
                  placeholder="Company Registration Documents"
                />
              </div>
              <div className="mb-2 flex items-center">
                <input
                  type="text"
                  className="input mb-2 mr-4 w-[300px] border-black bg-white text-black"
                  placeholder="Education Provider Documents"
                />
              </div>
              <div className="mb-2 flex items-center">
                <input
                  type="text"
                  className="input mb-2 mr-4 w-[300px] border-black bg-white text-black"
                  placeholder="VAT & Business Documents"
                />
              </div>
            </div>
          </div>
          <div className="mt-20 flex justify-end space-x-4">
            <button
              type="button"
              className="btn-hover-grow border-blue-500 text-blue-500 hover:bg-gray-300 btn btn-square w-[250px] gap-2 border bg-white"
              onClick={handlePost}
            >
              Submit for Approval
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
                    Update
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

OrganisationRoles.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default OrganisationRoles;
