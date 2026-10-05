const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'apps/mobile/src/app/(app)/trips/[id]/add-expense.tsx');
let content = fs.readFileSync(file, 'utf8');

const targetBlock = `    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      }
    } catch (error) {
      console.log('Location fetch skipped/failed');
    }`;

const newBlock = `    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      }
    } catch (error) {
      console.log('Location fetch skipped/failed', error);
    }

    // FALLBACK: If user denied location (or it failed), use the Stop's location
    if (!locationData && formData.stopId && activeTrip?.stops) {
      const stop = activeTrip.stops.find(s => s._id === formData.stopId);
      if (stop?.location) {
        locationData = {
          latitude: stop.location.lat,
          longitude: stop.location.lng,
        };
      }
    }`;

if (content.includes('await Location.requestForegroundPermissionsAsync()')) {
  content = content.replace(targetBlock, newBlock);

  // Ensure we are passing latitude and longitude to payload
  content = content.replace(
    'date: formData.date.toISOString(),',
    'date: formData.date.toISOString(),\n      latitude: locationData?.latitude,\n      longitude: locationData?.longitude,',
  );

  fs.writeFileSync(file, content);
  console.log('SUCCESS');
} else {
  console.log('BLOCK NOT FOUND');
}
