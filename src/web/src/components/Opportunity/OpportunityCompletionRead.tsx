import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { IoMdPin } from "react-icons/io";
import iconCertificate from "public/images/icon-certificate.svg";
import iconPicture from "public/images/icon-picture.svg";
import iconVideo from "public/images/icon-video.svg";
import iconLocation from "public/images/icon-location.svg";
import type { MyOpportunityInfo } from "~/api/models/myOpportunity";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { DATE_FORMAT_HUMAN } from "~/lib/constants";
import Moment from "react-moment";
import { Loader } from "@googlemaps/js-api-loader";
import { fetchClientEnv } from "~/lib/utils";
import { AvatarImage } from "../AvatarImage";

interface InputProps {
  [id: string]: any;
  data: MyOpportunityInfo;
}

const libraries: any[] = ["places"];

export const OpportunityCompletionRead: React.FC<InputProps> = ({
  id,
  data,
}) => {
  const [showLocation, setShowLocation] = useState(false);

  function renderVerificationFile(
    icon: any,
    label: string,
    fileUrl: string | null,
  ) {
    return (
      <Link
        href={fileUrl ?? "/"}
        target="_blank"
        className="flex items-center rounded-full bg-gray text-sm text-green"
      >
        <div className="flex w-full flex-row">
          <div className="flex items-center px-4 py-2">
            <Image
              src={icon}
              alt={`Icon ${label}`}
              width={28}
              className="h-auto"
              sizes="100vw"
              priority={true}
            />
          </div>
          <div className="flex items-center">View {label}</div>
        </div>
      </Link>
    );
  }

  //* Google Maps
  // load the google map script async as the api key needs to be fetched async
  const [googleInstance, setGoogleInstance] = useState<Loader | null>(null);
  const [googleInstanceLoading, setGoogleInstanceLoading] = useState(false);
  const [googleInstanceError, setGoogleInstanceError] = useState(false);
  useEffect(() => {
    const loadGoogleInstance = async () => {
      try {
        // get api key
        const env = await fetchClientEnv();

        // load script
        const google = new Loader({
          apiKey: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          libraries: libraries,
        });
        await google.importLibrary(libraries[0]);

        setGoogleInstance(google);
      } catch (error) {
        console.log("Google Maps API failed to load", error);
        alert("Google Maps API failed to load");

        setGoogleInstanceError(true);
      } finally {
        setGoogleInstanceLoading(false);
      }
    };
    setGoogleInstanceLoading(true);
    loadGoogleInstance();
  }, [setGoogleInstance, setGoogleInstanceLoading, setGoogleInstanceError]);

  // memo for geo location based on currentRow
  const markerPosition = useMemo(() => {
    if (data == null || data == undefined) return null;

    const verification = data?.verifications?.find(
      (item) => item.verificationType == "Location",
    );

    const coords = verification?.geometry?.coordinates as number[][];
    if (coords == null || coords == undefined || coords.length == 0)
      return null;
    const first = coords[0];
    if (!first || first.length < 2) return null;

    return {
      lng: first[0],
      lat: first[1],
    };
  }, [data]);

  const iconPath =
    "M 12 2 C 8.1 2 5 5.1 5 9 c 0 5.3 7 13 7 13 s 7 -7.8 7 -13 c 0 -3.9 -3.1 -7 -7 -7 z M 7 9 c 0 -2.8 2.2 -5 5 -5 s 5 2.2 5 5 c 0 2.9 -2.9 7.2 -5 9.9 C 9.9 16.2 7 11.8 7 9 z M 10 9 C 10 8 11 7 12 7 C 13 7 14 8 14 9 C 14 10 13 11 12 11 C 11 11 10 10 10 9 M 12 7";

  return (
    <div
      key={`OpportunityCompletionRead_${id}`}
      className="my-4 flex flex-col gap-4 rounded-lg bg-white p-4"
    >
      <div className="flex flex-row">
        <div className="flex flex-grow flex-col">
          <p className="h-6 text-lg font-bold text-black">
            {data?.userDisplayName}
          </p>
          <p className="text-sm text-gray-dark">
            {data?.userEmail ?? data?.userPhoneNumer}
          </p>
          <p className="mt-2 flex flex-row items-center text-sm text-gray-dark">
            <IoMdPin className="mr-2 h-4 w-4 text-gray-dark" />
            {data?.userCountry}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-4">
          <AvatarImage
            icon={data?.userPhotoURL ?? null}
            alt="Icon User"
            size={60}
          />
        </div>
      </div>
      <div className="divider m-0 h-[1px] bg-gray-light" />
      {data?.verifications?.map((item) => (
        <div key={item.fileId}>
          {item.verificationType == "FileUpload" &&
            renderVerificationFile(
              iconCertificate,
              "Certificate",
              item.fileURL,
            )}
          {item.verificationType == "Picture" &&
            renderVerificationFile(iconPicture, "Picture", item.fileURL)}
          {item.verificationType == "VoiceNote" &&
            renderVerificationFile(iconVideo, "Voice Note", item.fileURL)}
          {item.verificationType == "Location" && (
            <>
              <button
                className="flex w-full items-center rounded-full bg-gray text-sm text-green"
                onClick={() => {
                  setShowLocation(!showLocation);
                }}
              >
                <div className="flex w-full flex-row">
                  <div className="flex items-center px-4 py-2">
                    <Image
                      src={iconLocation}
                      alt={`Icon Location`}
                      width={28}
                      className="h-auto"
                      sizes="100vw"
                      priority={true}
                    />
                  </div>
                  <div className="flex items-center">
                    {showLocation ? "Hide" : "View"} Location
                  </div>
                </div>
              </button>

              {showLocation && (
                <div className="mt-2">
                  {googleInstanceLoading && <div>Loading...</div>}
                  {(googleInstanceError || !googleInstance) && (
                    <div>Error loading maps</div>
                  )}
                  {googleInstance && markerPosition != null && (
                    <>
                      <div className="flex flex-row gap-2 text-gray-dark">
                        <div>Pin location: </div>
                        <div className="font-bold">
                          Lat: {markerPosition.lat} Lng: {markerPosition.lng}
                        </div>
                      </div>

                      <GoogleMap
                        id="map"
                        mapContainerStyle={{
                          width: "100%",
                          height: "350px",
                        }}
                        center={markerPosition as any}
                        zoom={16}
                      >
                        <MarkerF
                          position={markerPosition as any}
                          draggable={false}
                          icon={{
                            strokeColor: "transparent",
                            fillColor: "#41204B",
                            path: iconPath,
                            fillOpacity: 1,
                            scale: 2,
                          }}
                        />
                      </GoogleMap>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ))}
      {data?.dateStart && (
        <div className="flex flex-row gap-2 text-sm text-gray-dark md:h-3">
          <div>Started opportunity on: </div>
          <div className="font-bold">
            <Moment format={DATE_FORMAT_HUMAN} utc={true}>
              {data.dateStart}
            </Moment>
          </div>
        </div>
      )}
      {data?.dateEnd && (
        <div className="flex flex-row gap-2 text-sm text-gray-dark">
          <div>Finished opportunity on: </div>
          <div className="font-bold">
            <Moment format={DATE_FORMAT_HUMAN} utc={true}>
              {data.dateEnd}
            </Moment>
          </div>
        </div>
      )}
      {data?.commitmentInterval && (data?.commitmentIntervalCount ?? 0) > 0 && (
        <div className="flex flex-row gap-2 text-sm text-gray-dark">
          <div>Time to complete: </div>
          <div className="font-bold">
            {data.commitmentIntervalCount} {data.commitmentInterval}
          </div>
        </div>
      )}
    </div>
  );
};
