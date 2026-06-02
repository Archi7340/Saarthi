import { useState, useEffect } from "react";

/**
 * Hook to get user's current GPS coordinates
 * Returns { coordinates: [lng, lat], error, loading }
 */
const useGeoLocation = () => {
  const [coordinates, setCoordinates] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by this browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // MongoDB expects [longitude, latitude]
        setCoordinates([pos.coords.longitude, pos.coords.latitude]);
        setLoading(false);
      },
      (err) => {
        console.warn("GPS denied, using default location:", err.message);
        // Fallback to Jaipur coordinates — change to your city
        setCoordinates([75.7873, 26.9124]);
        setError(null); // Don't show error — silently fallback
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { coordinates, error, loading };
};

export default useGeoLocation;