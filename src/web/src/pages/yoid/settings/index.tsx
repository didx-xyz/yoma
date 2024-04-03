import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import { getServerSession } from "next-auth";
import router from "next/router";
import { type ReactElement } from "react";
import {
  getCountries,
  getEducations,
  getGenders,
} from "~/api/services/lookups";
import { getUserProfile } from "~/api/services/user";
import { authOptions } from "~/server/auth";
import { Unauthorized } from "~/components/Status/Unauthorized";
import type { NextPageWithLayout } from "~/pages/_app";
import YoIDTabbedLayout from "~/components/Layout/YoIDTabbed";
import { config } from "~/lib/react-query-config";
import {
  UserProfileFilterOptions,
  UserProfileForm,
} from "~/components/User/UserProfileForm";
import type { GetServerSidePropsContext } from "next";
import { Loading } from "~/components/Status/Loading";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      props: {
        error: "Unauthorized",
      },
    };
  }

  const queryClient = new QueryClient(config);

  // 👇 prefetch queries on server
  await Promise.all([
    await queryClient.prefetchQuery({
      queryKey: ["genders"],
      queryFn: async () => await getGenders(),
    }),
    await queryClient.prefetchQuery({
      queryKey: ["countries"],
      queryFn: async () => await getCountries(),
    }),
    await queryClient.prefetchQuery({
      queryKey: ["educations"],
      queryFn: async () => await getEducations(),
    }),
    await queryClient.prefetchQuery({
      queryKey: ["userProfile"],
      queryFn: async () => await getUserProfile(),
    }),
  ]);

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
    },
  };
}

const Settings: NextPageWithLayout<{
  error?: string;
}> = ({ error }) => {
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => await getUserProfile(),
    enabled: !error,
  });

  const handleCancel = () => {
    router.back();
  };

  if (error) return <Unauthorized />;

  return (
    <div className="mb-8 mr-auto mt-2 w-full max-w-2xl px-4">
      <h5 className="mb-4 font-bold tracking-wider">User Settings</h5>
      <div className="flex flex-col items-center">
        <div className="flex w-full flex-col rounded-lg bg-white p-4 md:p-8">
          {isLoading && <Loading />}

          {!isLoading && (
            <UserProfileForm
              userProfile={userProfile}
              onCancel={handleCancel}
              filterOptions={[
                UserProfileFilterOptions.EMAIL,
                UserProfileFilterOptions.FIRSTNAME,
                UserProfileFilterOptions.SURNAME,
                UserProfileFilterOptions.DISPLAYNAME,
                UserProfileFilterOptions.PHONENUMBER,
                UserProfileFilterOptions.COUNTRY,
                UserProfileFilterOptions.EDUCATION,
                UserProfileFilterOptions.GENDER,
                UserProfileFilterOptions.DATEOFBIRTH,
                UserProfileFilterOptions.RESETPASSWORD,
                UserProfileFilterOptions.LOGO,
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
};

Settings.getLayout = function getLayout(page: ReactElement) {
  return <YoIDTabbedLayout>{page}</YoIDTabbedLayout>;
};

export default Settings;
