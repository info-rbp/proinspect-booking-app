export async function validateAddress(address: string) {
  return {
    connected: Boolean(process.env.GOOGLE_MAPS_API_KEY),
    rawAddress: address,
    validatedAddress: address,
    latitude: null,
    longitude: null,
    placeId: null,
    message: 'Maps integration stub. Connect Google Maps Platform before production routing.'
  };
}

export async function estimateTravelMinutes() {
  return {
    connected: Boolean(process.env.GOOGLE_MAPS_API_KEY),
    travelMinutes: null,
    message: 'Route Matrix integration stub. No travel time calculated yet.'
  };
}
