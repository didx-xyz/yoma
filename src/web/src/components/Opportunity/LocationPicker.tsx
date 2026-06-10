import { GoogleMap, MarkerF } from "@react-google-maps/api";
import React, { useEffect, useState, type ReactElement } from "react";
import { FcGlobe } from "react-icons/fc";
import { toast } from "react-toastify";
import { fetchClientEnv } from "~/lib/utils";

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

const LocationPicker: React.FC<InputProps> = ({
  id,
  label = "Select pin",
  children,
  onSelect,
}) => {
  //* Google Maps
  // load the google map script async as the api key needs to be fetched async
  const [googleInstanceLoaded, setGoogleInstanceLoaded] = useState(false);
  const [googleInstanceLoading, setGoogleInstanceLoading] = useState(false);
  const [googleInstanceError, setGoogleInstanceError] = useState(false);
  const [mapKeyMissing, setMapKeyMissing] = useState(false);
  useEffect(() => {
    const loadGoogleInstance = async () => {
      try {
        // get api key
        const env = await fetchClientEnv();
        const apiKey = env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

        // Skip the map when no valid key is configured (e.g. the dev
        // placeholder). Real Google Maps keys start with "AIza"; anything else
        // makes Google throw an opaque InvalidKeyMapError at runtime.
        if (!apiKey?.startsWith("AIza")) {
          setMapKeyMissing(true);
          return;
        }

        // configure and load the maps API.
        // Imported dynamically (client-only) so this browser-only library is
        // never evaluated server-side during the build's page-data collection
        // (it reads `window` at module load → "window is not defined").
        const { importLibrary, setOptions } =
          await import("@googlemaps/js-api-loader");
        setOptions({ key: apiKey });
        await importLibrary("places");

        setGoogleInstanceLoaded(true);
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
  }, []);

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
      if (onSelect) {
        onSelect(result);
      }
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
      if (onSelect) {
        onSelect(result);
      }
    },
    [onSelect],
  );

  const iconPath =
    "M 12 2 C 8.1 2 5 5.1 5 9 c 0 5.3 7 13 7 13 s 7 -7.8 7 -13 c 0 -3.9 -3.1 -7 -7 -7 z M 7 9 c 0 -2.8 2.2 -5 5 -5 s 5 2.2 5 5 c 0 2.9 -2.9 7.2 -5 9.9 C 9.9 16.2 7 11.8 7 9 z M 10 9 C 10 8 11 7 12 7 C 13 7 14 8 14 9 C 14 10 13 11 12 11 C 11 11 10 10 10 9 M 12 7";

  //* Google Maps
  if (googleInstanceLoading) return "Loading Maps";
  if (mapKeyMissing)
    return (
      <div className="bg-gray-light text-gray-dark w-full rounded-lg p-4 text-sm italic">
        Map preview unavailable — no Google Maps key configured.
      </div>
    );
  if (googleInstanceError || !googleInstanceLoaded) return "Error loading maps";

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
      className="bg-gray-light flex w-full flex-col rounded-lg border-dotted"
    >
      <div className="flex w-full flex-row">
        <div className="ml-2 p-4 md:p-6">
          <FcGlobe className="size-10" />
        </div>
        <div className="flex grow flex-col p-4">
          <div className="font-semibold">{label}</div>
          <div className="text-gray-dark text-sm italic">
            Select a pin location below or
            <button
              onClick={onClick_UseCurrentLocation}
              type="button"
              className="text-purple ml-1 text-sm underline"
            >
              use your current location
            </button>
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
      <div>{children && children}</div>
    </div>
  );
};

export default LocationPicker;
