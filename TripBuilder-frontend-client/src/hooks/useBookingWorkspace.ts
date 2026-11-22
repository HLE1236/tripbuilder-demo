import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getBookingByIdApi } from '../api/booking';
import { serviceModeMeta, statusMeta } from '../config/constants/meta';
import { formatVnd } from '../utils/format';
import type { Booking, BookingStep, PhotoItem } from '../api/types';
import {
  bookingKeys,
  useCancelBookingMutation,
  useConfirmBookingMutation,
  useCustomizeBookingMutation,
  useReviewBookingMutation,
} from './api';

export function useBookingWorkspace(
  booking: Booking,
  onUpdated: (booking: Booking) => void
) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const [rating, setRating] = useState(booking.customerRating || 5);
  const [reviewText, setReviewText] = useState(booking.customerReview || '');
  const [reviewSaved, setReviewSaved] = useState(false);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  const confirmMutation = useConfirmBookingMutation();
  const cancelMutation = useCancelBookingMutation();
  const customizeMutation = useCustomizeBookingMutation();
  const reviewMutation = useReviewBookingMutation();

  const busy =
    confirmMutation.isPending ||
    cancelMutation.isPending ||
    customizeMutation.isPending ||
    reviewMutation.isPending;

  const st = statusMeta(booking.status);
  const mode = serviceModeMeta(booking.serviceMode);
  const isCancelled = booking.status === 'CANCELLED';

  const photos: PhotoItem[] = useMemo(() => {
    if (booking.tour.galleryItems && booking.tour.galleryItems.length > 0) {
      return booking.tour.galleryItems;
    }
    const urls = booking.tour.galleryUrls?.length
      ? booking.tour.galleryUrls
      : [booking.tour.imageUrl];
    return urls.map((url, idx) => ({
      id: idx + 1,
      url,
      landmarkName: booking.tourTitleSnapshot,
      caption: `${booking.tour.regionName} · Ảnh ${idx + 1}`,
      category: 'Hành trình',
      credit: `Guide ${booking.guide.fullName}`,
    }));
  }, [booking]);

  const activeStepZeroBased = isCancelled
    ? 0
    : booking.status === 'CONFIRMED'
      ? 3
      : booking.status === 'REQUOTED' || booking.status === 'CHANGE_REQUESTED'
        ? 2
        : booking.status === 'WAITING_REQUOTE'
          ? 1
          : 0;

  const canCustomerEdit =
    booking.status === 'BOOKED_ORIGINAL' ||
    booking.status === 'WAITING_REQUOTE' ||
    booking.status === 'REQUOTED' ||
    booking.status === 'CONFIRMED' ||
    booking.status === 'CHANGE_REQUESTED';

  const hasUnpricedCustom = booking.steps.some(
    (s) => s.noteType === 'CUSTOM' || (s.noteType !== 'REMOVED' && s.pricePerPerson == null)
  );
  const canConfirm =
    (booking.status === 'BOOKED_ORIGINAL' || booking.status === 'REQUOTED') && !hasUnpricedCustom;

  const groupedDays = useMemo(() => {
    const maxDay = Math.max(booking.days, ...booking.steps.map((s) => s.dayNumber), 1);
    const indexed = booking.steps.map((step, origIdx) => ({ step, origIdx }));
    return Array.from({ length: maxDay }, (_, i) => {
      const dayNumber = i + 1;
      const items: Array<{ step: BookingStep; origIdx: number }> = indexed.filter(
        ({ step }) => step.dayNumber === dayNumber
      );
      const daySubtotal = items
        .filter(({ step }) => step.noteType !== 'REMOVED')
        .reduce((acc, { step }) => acc + (step.pricePerPerson || 0), 0);
      return { dayNumber, items, daySubtotal };
    }).filter((d) => d.items.length > 0 || d.dayNumber <= booking.days);
  }, [booking.days, booking.steps]);

  const serviceDiffPerPerson = booking.currentPricePerPerson - booking.originalPricePerPerson;
  const serviceDiffTotal = serviceDiffPerPerson * booking.guests;
  const diffFromConfirmed =
    booking.confirmedTotalPrice != null ? booking.totalPrice - booking.confirmedTotalPrice : null;

  const nextActionGuidance = useMemo(() => {
    switch (booking.status) {
      case 'BOOKED_ORIGINAL':
        return {
          tone: 'indigo' as const,
          title: 'Lịch trình chuẩn · Sẵn sàng chốt ngay',
          body: 'Bạn có thể bấm "Chốt chuyến" ngay với giá niêm yết hoặc bấm "Chỉnh sửa lịch" để thay đổi dịch vụ theo ý muốn.',
        };
      case 'WAITING_REQUOTE':
        return {
          tone: 'amber' as const,
          title: `Đang chờ Guide ${booking.guide.fullName} kiểm tra & báo giá`,
          body: 'Guide sẽ kiểm tra tình trạng phòng/dịch vụ, điền giá cho các yêu cầu thêm và gửi lại báo giá từng dòng cho bạn.',
        };
      case 'REQUOTED':
        return {
          tone: 'coral' as const,
          title: booking.postConfirmAdjustment
            ? 'Guide đã gửi báo giá điều chỉnh sau chốt'
            : 'Guide đã gửi báo giá mới · Chờ bạn duyệt & chốt chuyến',
          body:
            booking.guideNote ||
            'Kiểm tra bảng đối chiếu 4 cột chi phí và từng dòng lịch trình bên dưới, sau đó bấm "Chốt chuyến" nếu đồng ý.',
        };
      case 'CHANGE_REQUESTED':
        return {
          tone: 'amber' as const,
          title: 'Đang chờ Guide báo giá thay đổi sau chốt',
          body: `Mức giá đã chốt trước đó là ${formatVnd(
            booking.confirmedTotalPrice
          )}. Guide đang tính phần chênh lệch mới.`,
        };
      case 'CONFIRMED':
        return {
          tone: 'emerald' as const,
          title: 'Hồ sơ chuyến đi đã được chốt & giữ chỗ',
          body: 'Chuyến đi đã sẵn sàng khởi hành. Nếu lịch có phát sinh, bạn vẫn có thể gửi yêu cầu điều chỉnh sau chốt bất cứ lúc nào.',
        };
      case 'CANCELLED':
        return {
          tone: 'crimson' as const,
          title: 'Đơn đặt tour đã huỷ',
          body: 'Hồ sơ này đã đóng. Bạn có thể quay lại danh sách để đặt một hành trình mới.',
        };
    }
  }, [booking]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError('');
    try {
      const fresh = await queryClient.fetchQuery({
        queryKey: bookingKeys.detail(booking.id),
        queryFn: () => getBookingByIdApi(booking.id),
        staleTime: 0,
      });
      queryClient.setQueryData<Booking[]>(bookingKeys.list(), (prev) =>
        prev ? prev.map((b) => (b.id === fresh.id ? fresh : b)) : [fresh]
      );
      onUpdated(fresh);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể cập nhật trạng thái đơn');
    } finally {
      setRefreshing(false);
    }
  };

  const handleConfirm = async () => {
    setError('');
    try {
      const updated = await confirmMutation.mutateAsync(booking.id);
      setConfirmCancel(false);
      onUpdated(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể chốt chuyến');
    }
  };

  const handleCancel = async () => {
    setError('');
    try {
      const updated = await cancelMutation.mutateAsync(booking.id);
      setConfirmCancel(false);
      onUpdated(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể huỷ đơn');
    }
  };

  const acceptAlternative = async (idx: number) => {
    setError('');
    try {
      const nextSteps = booking.steps.map((s, i) =>
        i === idx ? { ...s, noteType: 'GUIDE' } : s
      );
      const updated = await customizeMutation.mutateAsync({
        bookingId: booking.id,
        payload: {
          startDate: booking.startDate,
          days: booking.days,
          guests: booking.guests,
          serviceMode: mode.mode,
          customerNote: booking.customerNote || 'Đồng ý phương án thay thế từ Guide.',
          steps: nextSteps,
        },
      });
      onUpdated(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể cập nhật phương án');
    }
  };

  const handleReview = async () => {
    setError('');
    setReviewSaved(false);
    try {
      const updated = await reviewMutation.mutateAsync({
        bookingId: booking.id,
        payload: {
          rating,
          review: reviewText,
        },
      });
      onUpdated(updated);
      setReviewSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể gửi đánh giá');
    }
  };

  return {
    busy,
    refreshing,
    error,
    editOpen,
    setEditOpen,
    confirmCancel,
    setConfirmCancel,
    rating,
    setRating,
    reviewText,
    setReviewText,
    reviewSaved,
    lightboxOpen,
    setLightboxOpen,
    lightboxIdx,
    setLightboxIdx,
    st,
    mode,
    isCancelled,
    photos,
    activeStepZeroBased,
    canCustomerEdit,
    canConfirm,
    groupedDays,
    serviceDiffPerPerson,
    serviceDiffTotal,
    diffFromConfirmed,
    nextActionGuidance,
    handleRefresh,
    handleConfirm,
    handleCancel,
    acceptAlternative,
    handleReview,
  };
}
