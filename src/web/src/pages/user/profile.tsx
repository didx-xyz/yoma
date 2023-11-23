import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { type ReactElement } from "react";
import { IoMdPerson } from "react-icons/io";
import MainLayout from "~/components/Layout/Main";
import { authOptions } from "~/server/auth";
import type { NextPageWithLayout } from "../_app";
import { Unauthorized } from "~/components/Status/Unauthorized";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      props: {
        error: "Unauthorized",
      },
    };
  }

  return {
    props: {
      user: session?.user ?? null,
    },
  };
}

const UserProfile: NextPageWithLayout<{
  error: string;
}> = ({ error }) => {
  if (error) return <Unauthorized />;

  return (
    <>
      <div className="container-centered">
        <div className="container-content">
          <div className="flex flex-col items-center">
            <div className="relative h-11 w-11 cursor-pointer overflow-hidden rounded-full border-2 hover:border-white">
              <IoMdPerson className="text-gray-400 absolute -left-1 h-12 w-12 animate-in slide-in-from-top-4" />
            </div>
            <h1>Sam Henderson</h1>
            <h2>South Africa</h2>
          </div>

          <div className="flex flex-col items-start gap-2">
            <h1>Wallet</h1>
            <ul className="list-disc pl-8">
              <li>100 $YOMA</li>
              <li>50 $ZLTO</li>
            </ul>
            <div className="flex gap-2 py-4">
              <button className="btn btn-primary">Receive</button>
              <button className="btn btn-primary">Send</button>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2">
            <h1>Skills</h1>
            <ul className="list-disc pl-8">
              <li>Project Management</li>
              <li>3D Mapping</li>
            </ul>
            <div className="flex gap-2 py-4">
              <button className="btn btn-primary">Add to</button>
              <button className="btn btn-primary">Share</button>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2">
            <h1>Achievements</h1>
            <ul className="list-disc pl-8">
              <li>Birth Registration</li>
              <li>Plant 100 Trees</li>
            </ul>
            <div className="flex gap-2 py-4">
              <button className="btn btn-primary">Add to</button>
              <button className="btn btn-primary">Share</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

UserProfile.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default UserProfile;
