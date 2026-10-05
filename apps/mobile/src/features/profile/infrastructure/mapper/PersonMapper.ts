import type {
  ActivityItem,
  Person,
  SharedExpense,
  SharedTrip,
} from '../../types/person.types';
import type {
  ActivityItemAPIModel,
  PersonAPIModel,
  SharedExpenseAPIModel,
  SharedTripAPIModel,
} from '../dto/PersonDTO';

/**
 * Maps raw API DTOs to clean domain objects.
 * All methods are static — no instantiation required.
 */
export class PersonMapper {
  /** Maps a raw `PersonAPIModel` (with `_id`) to the domain `Person` (with `id`). */
  static toDomain(dto: PersonAPIModel): Person {
    return {
      id: dto._id,
      email: dto.email,
      displayName: dto.displayName,
      photoURL: dto.photoURL,
      avatar: dto.avatar,
      phoneNumber: dto.phoneNumber,
      bio: dto.bio,
      role: dto.role,
      totalOwed: dto.totalOwedAcrossTrips,
      totalLent: dto.totalLentAcrossTrips,
      isActive: dto.isActive,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  }

  /** Maps a raw `SharedExpenseAPIModel` to the domain `SharedExpense`. */
  static expenseToDomain(dto: SharedExpenseAPIModel): SharedExpense {
    return {
      id: dto._id,
      title: dto.title,
      amount: dto.amount,
      currency: dto.currency,
      paidBy: dto.paidBy,
      userShare: dto.userShare,
      status: dto.status,
      tripId: dto.tripId,
      tripName: dto.tripName,
      createdAt: dto.createdAt,
    };
  }

  /** Maps a raw `SharedTripAPIModel` to the domain `SharedTrip`. */
  static tripToDomain(dto: SharedTripAPIModel): SharedTrip {
    return {
      id: dto._id,
      title: dto.title,
      destination: dto.destination,
      memberCount: dto.memberCount,
      userBalance: dto.userBalance,
      status: dto.status,
      startDate: dto.startDate,
      endDate: dto.endDate,
    };
  }

  /** Maps a raw `ActivityItemAPIModel` to the domain `ActivityItem`. */
  static activityToDomain(dto: ActivityItemAPIModel): ActivityItem {
    return {
      id: dto._id,
      type: dto.type,
      description: dto.description,
      timestamp: dto.timestamp,
      metadata: dto.metadata,
    };
  }
}
