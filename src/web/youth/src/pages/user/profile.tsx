import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { useRouter } from "next/router";
import { useCallback, type ReactElement } from "react";
import { IoMdPerson, IoMdSettings } from "react-icons/io";
import MainBackButton from "~/components/Layout/MainBackButton";
import withAuth from "~/core/withAuth";
import { authOptions } from "~/server/auth";
import type { NextPageWithLayout } from "../_app";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  return {
    props: {
      user: session?.user ?? null, // (required for 'withAuth' HOC component)
    },
  };
}

const UserProfile: NextPageWithLayout = () => {
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

const Settings: NextPageWithLayout = () => {
  const router = useRouter();

  const handleClick = useCallback(async () => {
    await router.push("/user/settings");
  }, [router]);

  return (
    <button
      type="button"
      aria-label="Close"
      className="btn-hover-grow btn btn-square gap-2 border-none bg-transparent hover:border-none hover:bg-transparent"
      onClick={handleClick} // eslint-disable-line @typescript-eslint/no-misused-promises
    >
      <IoMdSettings className="h-6 w-6" />
    </button>
  );
};

UserProfile.getLayout = function getLayout(page: ReactElement) {
  return <MainBackButton rightMenuChildren={<Settings />}>{page}</MainBackButton>;
};

export default withAuth(UserProfile);
