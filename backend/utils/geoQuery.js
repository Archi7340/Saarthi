const User = require("../models/User");

/**
 * Find nearby volunteers using MongoDB 2dsphere index.
 * For SOS: ignores isVerified/isAvailable — emergency notifies ALL volunteers.
 * For help requests: only verified + available volunteers.
 *
 * @param {Array}   coordinates - [longitude, latitude]
 * @param {number}  radiusKm    - Search radius in kilometers
 * @param {number}  limit       - Max volunteers to return
 * @param {boolean} sosMode     - If true, skip isVerified/isAvailable filters
 */
const findNearbyVolunteers = async (coordinates, radiusKm = 2, limit = 10, sosMode = false) => {
  const radiusMeters = radiusKm * 1000;

  const filter = {
    role: "volunteer",
    location: {
      $nearSphere: {
        $geometry: { type: "Point", coordinates },
        $maxDistance: radiusMeters,
      },
    },
  };

  // For normal requests, only ping verified + available volunteers
  // For SOS, notify everyone nearby regardless of status
  if (!sosMode) {
    filter.isVerified = true;
    filter.isAvailable = true;
  }

  const volunteers = await User.find(filter).limit(limit);

  console.log(
    `[GeoQuery] radius=${radiusKm}km sosMode=${sosMode} found=${volunteers.length} volunteers`
  );

  return volunteers;
};

/**
 * Progressive SOS: try increasing radii until at least 1 volunteer is found.
 * Tries 2km → 10km → 50km → all volunteers as last resort.
 */
const findNearbyVolunteersSOS = async (coordinates) => {
  const radii = [2, 10, 50];

  for (const km of radii) {
    const found = await findNearbyVolunteers(coordinates, km, 10, true);
    if (found.length > 0) {
      console.log(`[SOS GeoQuery] Found ${found.length} volunteers within ${km}km`);
      return found;
    }
  }

  // Last resort: return ALL volunteers regardless of location
  console.log("[SOS GeoQuery] No nearby volunteers — notifying ALL volunteers");
  const all = await User.find({ role: "volunteer" }).limit(20);
  console.log(`[SOS GeoQuery] Total volunteers in DB: ${all.length}`);

  // Debug: log each volunteer's location
  all.forEach((v) => {
    console.log(`  Volunteer: ${v.name} | location: ${JSON.stringify(v.location?.coordinates)} | verified: ${v.isVerified} | available: ${v.isAvailable}`);
  });

  return all;
};

/**
 * Find all family members linked to an elderly user
 */
const findFamilyMembers = async (elderlyId) => {
  return User.find({ role: "family", linkedElderlyId: elderlyId });
};

module.exports = { findNearbyVolunteers, findNearbyVolunteersSOS, findFamilyMembers };