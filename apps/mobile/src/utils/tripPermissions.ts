/**
 * Utility functions for trip permission checks
 */

export function isUserTripAdmin(trip: any, user: any): boolean {
  if (!trip || !user) return false;

  const currentUserId = user._id || user.id || user.userId || user.firebaseUid;
  const currentFirebaseUid = user.firebaseUid;

  // 1. Creator / Owner
  const creatorId =
    typeof trip.createdBy === 'object' && trip.createdBy !== null
      ? trip.createdBy._id || trip.createdBy.id || trip.createdBy.userId
      : trip.createdBy;

  if (
    creatorId &&
    (creatorId === currentUserId ||
      (currentFirebaseUid && creatorId === currentFirebaseUid))
  ) {
    return true;
  }

  // 2. Trip adminId field if any
  if (
    trip.adminId &&
    (trip.adminId === currentUserId ||
      (currentFirebaseUid && trip.adminId === currentFirebaseUid))
  ) {
    return true;
  }

  // 3. Member with role 'admin'
  if (Array.isArray(trip.members)) {
    const member = trip.members.find((m: any) => {
      const mId = m.userId || m._id || m.id;
      return (
        (currentUserId && mId === currentUserId) ||
        (currentFirebaseUid && mId === currentFirebaseUid) ||
        (user.email &&
          m.email &&
          m.email.toLowerCase() === user.email.toLowerCase())
      );
    });
    if (member && member.role === 'admin') {
      return true;
    }
  }

  // 4. Global system admin
  if (user.role === 'admin') {
    return true;
  }

  return false;
}
