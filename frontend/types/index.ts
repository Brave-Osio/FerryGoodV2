// types/index.ts
export type UserRole = 'admin' | 'register' | 'client';

export interface User {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export type ScheduleStatus = 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled';
export type BookingStatus = 'confirmed' | 'waitlisted' | 'cancelled' | 'boarded';
export type TicketClass = 'Economy' | 'Business' | 'Cargo';

export interface Schedule {
  ScheduleID: number;
  FerryID: number;
  FerryName: string;
  FerryCode: string;
  Capacity: number;
  FerryType: string;
  RouteID: number;
  RouteCode: string;
  OriginPort: string;
  OriginCode: string;
  DestPort: string;
  DestCode: string;
  DistanceKM: number;
  EstDurationMin: number;
  DepartureTime: string;
  ArrivalTime: string;
  Status: ScheduleStatus;
  RemarkNotes: string | null;
  CreatedAt: string;
  AssignedCount: number;
}

export interface Customer {
  CustomerID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  IDType: string;
  IDNumber: string;
  Nationality: string;
  Gender: string;
  BirthDate: string | null;
  Address: string | null;
  IsActive: boolean;
  CreatedAt: string;
  CreatedByName: string;
  ActiveBookings?: number;
}

export interface ScheduleCustomer {
  AssignmentID: number;
  CustomerID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  IDType: string;
  IDNumber: string;
  Nationality: string;
  Gender: string;
  SeatNumber: string;
  TicketClass: TicketClass;
  FareAmount: number;
  BookingStatus: BookingStatus;
  AssignedAt: string;
  RemovedAt: string | null;
  RemovalReason: string | null;
  AssignedByName: string;
}

export interface ScheduleDetail extends Schedule {
  customers: ScheduleCustomer[];
}

export interface HistoryRecord {
  AssignmentID: number;
  FullName: string;
  Email: string;
  Phone: string;
  IDType: string;
  IDNumber: string;
  ScheduleID: number;
  DepartureTime: string;
  ArrivalTime: string;
  ScheduleStatus: ScheduleStatus;
  FerryName: string;
  FerryCode: string;
  OriginPort: string;
  DestPort: string;
  RouteCode: string;
  SeatNumber: string;
  TicketClass: TicketClass;
  FareAmount: number;
  BookingStatus: BookingStatus;
  AssignedAt: string;
  AssignedByName: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: Pagination;
  message?: string;
}