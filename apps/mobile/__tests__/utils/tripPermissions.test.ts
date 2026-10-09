// __tests__/utils/tripPermissions.test.ts
import { isUserTripAdmin } from '../../src/utils/tripPermissions';

const makeTrip = (overrides: Record<string, unknown> = {}) => ({
  createdBy: 'user-creator',
  members: [],
  ...overrides,
});

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  _id: 'user-123',
  firebaseUid: 'fb-uid-123',
  email: 'alice@example.com',
  ...overrides,
});

// ─── isUserTripAdmin ──────────────────────────────────────────────────────────

describe('isUserTripAdmin', () => {
  it('returns false when trip is null', () => {
    expect(isUserTripAdmin(null, makeUser())).toBe(false);
  });

  it('returns false when user is null', () => {
    expect(isUserTripAdmin(makeTrip(), null)).toBe(false);
  });

  // --- Creator / Owner ---

  it('returns true when user._id matches trip.createdBy (string)', () => {
    const trip = makeTrip({ createdBy: 'user-123' });
    const user = makeUser({ _id: 'user-123' });
    expect(isUserTripAdmin(trip, user)).toBe(true);
  });

  it('returns true when firebaseUid matches trip.createdBy', () => {
    const trip = makeTrip({ createdBy: 'fb-uid-123' });
    const user = makeUser({ _id: 'different-id', firebaseUid: 'fb-uid-123' });
    expect(isUserTripAdmin(trip, user)).toBe(true);
  });

  it('returns true when trip.createdBy is an object and _id matches', () => {
    const trip = makeTrip({ createdBy: { _id: 'user-123' } });
    const user = makeUser({ _id: 'user-123' });
    expect(isUserTripAdmin(trip, user)).toBe(true);
  });

  it('returns true when trip.createdBy is an object and id matches', () => {
    const trip = makeTrip({ createdBy: { id: 'user-123' } });
    const user = makeUser({ _id: 'user-123' });
    expect(isUserTripAdmin(trip, user)).toBe(true);
  });

  // --- adminId field ---

  it('returns true when trip.adminId matches user._id', () => {
    const trip = makeTrip({ createdBy: 'someone-else', adminId: 'user-123' });
    const user = makeUser({ _id: 'user-123' });
    expect(isUserTripAdmin(trip, user)).toBe(true);
  });

  it('returns true when trip.adminId matches user.firebaseUid', () => {
    const trip = makeTrip({ createdBy: 'other', adminId: 'fb-uid-123' });
    const user = makeUser({ _id: 'other-id', firebaseUid: 'fb-uid-123' });
    expect(isUserTripAdmin(trip, user)).toBe(true);
  });

  // --- Member with role 'admin' ---

  it('returns true when user is a member with role admin (matched by userId)', () => {
    const trip = makeTrip({
      createdBy: 'other',
      members: [{ userId: 'user-123', role: 'admin' }],
    });
    const user = makeUser({ _id: 'user-123' });
    expect(isUserTripAdmin(trip, user)).toBe(true);
  });

  it('returns false when user is a member but role is not admin', () => {
    const trip = makeTrip({
      createdBy: 'other',
      members: [{ userId: 'user-123', role: 'member' }],
    });
    const user = makeUser({ _id: 'user-123' });
    expect(isUserTripAdmin(trip, user)).toBe(false);
  });

  it('returns true when member matched by email with role admin', () => {
    const trip = makeTrip({
      createdBy: 'other',
      members: [
        { userId: 'some-id', email: 'alice@example.com', role: 'admin' },
      ],
    });
    const user = makeUser({ _id: 'user-123', email: 'alice@example.com' });
    expect(isUserTripAdmin(trip, user)).toBe(true);
  });

  it('is case-insensitive when matching member email', () => {
    const trip = makeTrip({
      createdBy: 'other',
      members: [
        { userId: 'some-id', email: 'ALICE@EXAMPLE.COM', role: 'admin' },
      ],
    });
    const user = makeUser({ _id: 'user-123', email: 'alice@example.com' });
    expect(isUserTripAdmin(trip, user)).toBe(true);
  });

  // --- Global system admin ---

  it('returns true when user.role is admin (global system admin)', () => {
    const trip = makeTrip({ createdBy: 'other', members: [] });
    const user = makeUser({ _id: 'other-user', role: 'admin' });
    expect(isUserTripAdmin(trip, user)).toBe(true);
  });

  it('returns false for a regular member with no special role', () => {
    const trip = makeTrip({
      createdBy: 'other',
      members: [{ userId: 'user-123', role: 'member' }],
    });
    const user = makeUser({ _id: 'user-123', role: 'member' });
    expect(isUserTripAdmin(trip, user)).toBe(false);
  });

  it('returns false when user has no match anywhere', () => {
    const trip = makeTrip({ createdBy: 'other-user', members: [] });
    const user = makeUser({
      _id: 'user-123',
      firebaseUid: 'fb-abc',
      role: 'member',
    });
    expect(isUserTripAdmin(trip, user)).toBe(false);
  });
});
