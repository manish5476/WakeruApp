import { storage } from '../../utils/storage';

export interface Friend {
  id: string;
  userId: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  email?: string;
  upiId?: string;
  addedAt: string;
  tags: string[];
  totalSharedTrips: number;
  netBalance: number; // positive = they owe you
  notes?: string;
}

export const friendsService = {
  getAll(): Friend[] {
    return storage.getObject<Friend[]>('friends') || [];
  },

  getById(userId: string): Friend | undefined {
    return this.getAll().find(f => f.userId === userId);
  },

  add(
    friend: Omit<Friend, 'id' | 'addedAt' | 'totalSharedTrips' | 'netBalance'>,
  ): Friend {
    const friends = this.getAll();

    // Check if already exists
    if (friends.find(f => f.userId === friend.userId)) {
      throw new Error('Already in your friends list');
    }

    const newFriend: Friend = {
      ...friend,
      id: Date.now().toString(),
      addedAt: new Date().toISOString(),
      totalSharedTrips: 0,
      netBalance: 0,
    };

    friends.push(newFriend);
    storage.setObject('friends', friends);
    return newFriend;
  },

  remove(userId: string): void {
    const friends = this.getAll().filter(f => f.userId !== userId);
    storage.setObject('friends', friends);
  },

  update(userId: string, updates: Partial<Friend>): void {
    const friends = this.getAll();
    const index = friends.findIndex(f => f.userId === userId);
    if (index !== -1) {
      friends[index] = { ...friends[index], ...updates };
      storage.setObject('friends', friends);
    }
  },

  search(query: string): Friend[] {
    const q = query.toLowerCase();
    return this.getAll().filter(
      f =>
        f.displayName.toLowerCase().includes(q) ||
        f.email?.toLowerCase().includes(q) ||
        f.phoneNumber?.includes(q) ||
        f.tags.some(t => t.toLowerCase().includes(q)),
    );
  },

  getByTag(tag: string): Friend[] {
    return this.getAll().filter(f => f.tags.includes(tag));
  },

  getAllTags(): string[] {
    const tags = new Set<string>();
    this.getAll().forEach(f => f.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  },

  incrementSharedTrips(userId: string): void {
    const friend = this.getById(userId);
    if (friend) {
      this.update(userId, { totalSharedTrips: friend.totalSharedTrips + 1 });
    }
  },

  // Called after settlement to update balances
  recalculateBalances(settlements: any[], currentUserId: string): void {
    const friends = this.getAll();

    friends.forEach(friend => {
      let balance = 0;

      settlements.forEach((s: any) => {
        s.transactions?.forEach((txn: any) => {
          if (txn.from === currentUserId && txn.to === friend.userId) {
            balance -= txn.amountBase; // You paid them
          }
          if (txn.to === currentUserId && txn.from === friend.userId) {
            balance += txn.amountBase; // They owe you
          }
        });
      });

      friend.netBalance = balance;
    });

    storage.setObject('friends', friends);
  },
};
