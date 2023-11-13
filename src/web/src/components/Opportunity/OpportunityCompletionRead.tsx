import Link from "next/link";
import Image from "next/image";
import React, { useMemo, useState } from "react";
import { IoMdPin } from "react-icons/io";
import iconSuccess from "public/images/icon-success.svg";
import iconCertificate from "public/images/icon-certificate.svg";
import iconPicture from "public/images/icon-picture.svg";
import iconVideo from "public/images/icon-video.svg";
import iconLocation from "public/images/icon-location.svg";
import type { MyOpportunityInfo } from "~/api/models/myOpportunity";
import { GoogleMap, MarkerF, useLoadScript } from "@react-google-maps/api";
import { DATETIME_FORMAT_HUMAN } from "~/lib/constants";
import { env } from "~/env.mjs";
import Moment from "react-moment";

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
              height={28}
              sizes="100vw"
              priority={true}
              style={{ width: "28px", height: "28px" }}
            />
          </div>
          <div className="flex items-center">View {label}</div>
        </div>
      </Link>
    );
  }
  //* Google Maps
  const { isLoaded, loadError } = useLoadScript({
    id: "google-map-script",
    googleMapsApiKey: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  });

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
      className="flex flex-col gap-4 rounded-lg bg-white p-4"
    >
      <div className="flex flex-row">
        <div className="flex flex-grow flex-col gap-1">
          <p className="text-lg font-bold text-black">
            {data?.userDisplayName}
          </p>
          <p className="text--dark text-sm">{data?.userEmail}</p>
          <p className="flex flex-row items-center text-sm text-gray-dark">
            <IoMdPin className="mr-2 h-4 w-4 text-gray-dark" />
            {data?.userCountryOfResidence}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="-mt-8 flex h-24 w-24 items-center justify-center rounded-full border-green-dark bg-white p-4 shadow-lg">
            <Image
              src={data?.userPhotoURL ?? iconSuccess}
              alt="Icon User"
              width={60}
              height={60}
              sizes="100vw"
              priority={true}
              style={{
                width: "60px",
                height: "60px",
              }}
            />
          </div>
        </div>
      </div>
      <div className="divider m-0" />
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
                      height={28}
                      sizes="100vw"
                      priority={true}
                      style={{ width: "28px", height: "28px" }}
                    />
                  </div>
                  <div className="flex items-center">
                    {showLocation ? "Hide" : "View"} Location
                  </div>
                </div>
              </button>

              {showLocation && (
                <div className="mt-2">
                  {!isLoaded && <div>Loading...</div>}
                  {loadError && <div>Error loading maps</div>}
                  {isLoaded && markerPosition != null && (
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
        <div className="flex flex-row gap-2 text-gray-dark">
          <div>Started opportunity at: </div>
          <div className="font-bold">
            <Moment format={DATETIME_FORMAT_HUMAN}>{data.dateStart}</Moment>
          </div>
        </div>
      )}
      {data?.dateEnd && (
        <div className="flex flex-row gap-2 text-gray-dark">
          <div>Finished opportunity at: </div>
          <div className="font-bold">
            <Moment format={DATETIME_FORMAT_HUMAN}>{data.dateEnd}</Moment>
          </div>
        </div>
      )}
    </div>
  );
};
