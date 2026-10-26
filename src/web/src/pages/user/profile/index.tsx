import { QueryClient, dehydrate, useQuery } from "@tanstack/react-query";
import type { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { type ReactElement } from "react";
import { toast } from "react-toastify";
import {
  getCountries,
  getEducations,
  getGenders,
} from "~/api/services/lookups";
import { getUserProfile } from "~/api/services/user";
import MainLayout from "~/components/Layout/Main";
import { PageBackground } from "~/components/PageBackground";
import { Loading } from "~/components/Status/Loading";
import { Unauthorized } from "~/components/Status/Unauthorized";
import {
  UserProfileFilterOptions,
  UserProfileForm,
} from "~/components/User/UserProfileForm";
import { OPPORTUNITIES_SEARCH_URL } from "~/lib/constants";
import { hasPreviousRoute } from "~/lib/previousRoute";
import { config } from "~/lib/react-query-config";
import { getSafeUrl } from "~/lib/utils";
import type { NextPageWithLayout } from "~/pages/_app";
import { authOptions } from "~/server/auth";

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
      queryFn: async () => await getGenders(context),
    }),
    await queryClient.prefetchQuery({
      queryKey: ["countries"],
      queryFn: async () => await getCountries(true, context),
    }),
    await queryClient.prefetchQuery({
      queryKey: ["educations"],
      queryFn: async () => await getEducations(context),
    }),
    await queryClient.prefetchQuery({
      queryKey: ["userProfile"],
      queryFn: async () => await getUserProfile(context),
    }),
  ]);

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
      user: session?.user ?? null,
    },
  };
}

const MyProfile: NextPageWithLayout<{
  error?: string;
}> = ({ error }) => {
  const router = useRouter();
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => await getUserProfile(),
    enabled: !error,
  });

  // Where Cancel and Save go. A caller that needs the youth back somewhere specific passes
  // `returnUrl` (the discovery wizard's "Change in your profile", which reopens the wizard on its
  // step — `features/discovery/lib/wizardReturn.ts`); it wins over history. Without one, Cancel
  // steps back only when the previous page was in this app (`hasPreviousRoute`; the browser's
  // `history.length` also counts other sites), else to the youth search; Save stays on the page.
  const returnUrl =
    typeof router.query.returnUrl === "string"
      ? getSafeUrl(router.query.returnUrl, OPPORTUNITIES_SEARCH_URL)
      : null;
  const handleCancel = () => {
    if (returnUrl) void router.push(returnUrl);
    else if (hasPreviousRoute()) router.back();
    else void router.push(OPPORTUNITIES_SEARCH_URL);
  };

  if (error) return <Unauthorized />;

  return (
    <>
      <Head>
        <title>Yoma | Profile</title>
      </Head>

      <PageBackground />

      <div className="overflow-x-hiddenx z-10 mt-20 w-full max-w-2xl p-4 md:mt-24">
        <div className="mb-4 text-xs font-bold tracking-wider text-white md:text-base">
          🕶️ Profile
        </div>

        <div className="flex w-full flex-col rounded-lg bg-white p-4 md:p-8">
          {isLoading && <Loading />}

          {!isLoading && (
            <UserProfileForm
              userProfile={userProfile}
              onSubmit={() => {
                toast("Your profile has been updated", {
                  type: "success",
                  toastId: "patchUserProfile",
                });
                if (returnUrl) void router.push(returnUrl);
              }}
              onCancel={handleCancel}
              filterOptions={[
                UserProfileFilterOptions.EMAIL,
                UserProfileFilterOptions.FIRSTNAME,
                UserProfileFilterOptions.SURNAME,
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
    </>
  );
};

MyProfile.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default MyProfile;
