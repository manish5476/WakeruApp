import { LinkingOptions } from '@react-navigation/native';

export const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: ['tripsplit://', 'https://wakeru.com', 'https://www.wakeru.com'],
  config: {
    screens: {
      Tabs: {
        screens: {
          Dashboard: 'dashboard',
          Trips: 'trips',
          Friends: 'friends',
          Profile: 'profile',
        },
      },
      TripDetails: 'trip/:id',
      ExpenseDetails: 'expense/:id',
      TripJoin: 'join/:tripId',
      Explore: 'explore',
      Bookings: 'bookings',
      NotFound: '*',
    },
  },
};

export default linking;
