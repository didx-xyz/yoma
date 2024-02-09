import React, { useEffect, useState, type ReactElement } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { IoMdPin } from "react-icons/io";
import { toast } from "react-toastify";
import { fetchClientEnv } from "~/lib/utils";
import { Loader } from "@googlemaps/js-api-loader";

export interface InputProps {
  [id: string]: any;
  label?: string;
  children: ReactElement | undefined;
  onSelect?: (coords: Location) => void;
}

interface Location {
  lat: number;
  lng: number;
}

const libraries: any[] = ["places"];

const LocationPicker: React.FC<InputProps> = ({
  id,
  label = "Select pin",
  children,
  onSelect,
}) => {
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

  const [markerPosition, setMarkerPosition] = React.useState<Location>({
    lat: 51.505,
    lng: -0.09,
  });

  const handleMapClick = React.useCallback(
    (event: any) => {
      const result = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      setMarkerPosition(result);
      onSelect && onSelect(result);
    },
    [onSelect],
  );

  const handleMarkerDragEnd = React.useCallback(
    (event: any) => {
      const result = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      setMarkerPosition(result);
      onSelect && onSelect(result);
    },
    [onSelect],
  );

  const iconPath =
    "M 12 2 C 8.1 2 5 5.1 5 9 c 0 5.3 7 13 7 13 s 7 -7.8 7 -13 c 0 -3.9 -3.1 -7 -7 -7 z M 7 9 c 0 -2.8 2.2 -5 5 -5 s 5 2.2 5 5 c 0 2.9 -2.9 7.2 -5 9.9 C 9.9 16.2 7 11.8 7 9 z M 10 9 C 10 8 11 7 12 7 C 13 7 14 8 14 9 C 14 10 13 11 12 11 C 11 11 10 10 10 9 M 12 7";

  //* Google Maps
  if (googleInstanceError || !googleInstance) return "Error loading maps";
  if (googleInstanceLoading) return "Loading Maps";

  const onClick_UseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position: any) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          setMarkerPosition({ lat: latitude, lng: longitude });
        },
        () => {
          toast.error("Unable to retrieve your location");
        },
      );
    } else {
      toast.error("Geolocation not supported");
    }
  };

  return (
    <div
      key={id}
      className="flex w-full flex-col rounded-lg border-dotted bg-gray-light"
    >
      <div className="flex w-full flex-row">
        <div className="flex items-center p-8">
          <IoMdPin className="h-6 w-6 text-gray-dark" />
        </div>
        <div className="flex flex-grow flex-col items-start justify-center">
          <div>{label}</div>
          <div className="text-sm text-gray-dark">
            Select a pin location below or{" "}
            <button
              onClick={onClick_UseCurrentLocation}
              type="button"
              className="text-sm text-purple underline"
            >
              use your current location
            </button>
            .
          </div>
        </div>
      </div>
      <div className="w-full p-4 pt-0">
        <GoogleMap
          id="map"
          mapContainerStyle={{
            width: "100%",
            height: "350px",
          }}
          center={markerPosition}
          zoom={16}
          onClick={handleMapClick}
        >
          <MarkerF
            position={markerPosition}
            draggable={true}
            onDragEnd={handleMarkerDragEnd}
            icon={{
              strokeColor: "transparent",
              fillColor: "#41204B",
              path: iconPath,
              fillOpacity: 1,
              scale: 2,
            }}
          />
        </GoogleMap>
      </div>
      <div className="px-8">{children && children}</div>
    </div>
  );
};

export default LocationPicker;
