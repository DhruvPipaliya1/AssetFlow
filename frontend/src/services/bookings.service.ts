import { apiClient } from './apiClient';
import type { Booking, Paginated } from '../types/models';
import type { BookingStatus } from '../types/enums';

export interface BookingFilters {
  assetId?: string;
  status?: BookingStatus;
  mine?: 'true' | 'false';
  page?: number;
  take?: number;
}

export interface CreateBookingPayload {
  assetId: string;
  startTime: string;
  endTime: string;
  onBehalfOfDepartmentId?: string;
}

export interface ReschedulePayload {
  startTime: string;
  endTime: string;
}

export const bookingsService = {
  list: (filters: BookingFilters = {}) =>
    apiClient.get<Paginated<Booking>>('/bookings', { params: filters }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<{ booking: Booking }>(`/bookings/${id}`).then((r) => r.data.booking),

  create: (data: CreateBookingPayload) =>
    apiClient.post<{ booking: Booking }>('/bookings', data).then((r) => r.data.booking),

  cancel: (id: string) =>
    apiClient.patch<{ booking: Booking }>(`/bookings/${id}/cancel`).then((r) => r.data.booking),

  reschedule: (id: string, data: ReschedulePayload) =>
    apiClient.patch<{ booking: Booking }>(`/bookings/${id}/reschedule`, data).then((r) => r.data.booking),

  assetFeed: (assetId: string) =>
    apiClient.get<{ bookings: Booking[] }>(`/assets/${assetId}/bookings`).then((r) => r.data.bookings),
};
