import { useEffect, useRef } from 'react';
import { ShieldCheckIcon, XIcon } from '../icon';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export function TermsModal({ isOpen, onClose, onAccept }: TermsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="terms-modal-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="p-0 m-auto bg-transparent border-0 max-w-2xl w-[calc(100%-2rem)] max-h-[85dvh] overflow-hidden backdrop:bg-black/55 backdrop:backdrop-blur-xs"
    >
      {isOpen && (
        <div
          className="flagship-card w-full max-h-[85dvh] flex flex-col bg-surface"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-rule bg-surface-2">
            <div className="flex items-center gap-2.5">
              <ShieldCheckIcon size={18} className="text-coral" />
              <h3 id="terms-modal-title" className="text-lg font-semibold text-ink">
                Điều khoản sử dụng &amp; Chính sách bảo mật
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng điều khoản"
              className="h-8 w-8 rounded-lg border border-rule bg-surface hover:bg-surface-2 text-ink-2 flex items-center justify-center cursor-pointer"
            >
              <XIcon size={16} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-5 text-[15px] text-ink-2 leading-relaxed">
            <section className="space-y-1.5">
              <h4 className="text-base font-semibold text-ink">1. Phạm vi dịch vụ TripBuilder</h4>
              <p>
                TripBuilder là nền tảng kết nối hành khách với hướng dẫn viên bản địa để thiết kế
                lịch trình may đo theo từng chặng. Mọi báo giá, điều chỉnh dịch vụ và xác nhận chuyến
                được ghi nhận minh bạch theo từng vòng đối chiếu trên hệ thống.
              </p>
            </section>

            <section className="space-y-1.5">
              <h4 className="text-base font-semibold text-ink">2. Trách nhiệm tài khoản khách hàng</h4>
              <p>
                Bạn cam kết cung cấp họ tên, email và số điện thoại chính xác để hướng dẫn viên liên
                hệ xác nhận lịch trình, điểm đón và xử lý phát sinh trong quá trình khởi hành. Không
                chia sẻ mật khẩu hoặc mã xác thực OTP cho bên thứ ba.
              </p>
            </section>

            <section className="space-y-1.5">
              <h4 className="text-base font-semibold text-ink">3. Báo giá &amp; Huỷ / Điều chỉnh</h4>
              <p>
                Đơn đặt lịch chuẩn có thể xác nhận ngay theo đơn giá niêm yết. Với yêu cầu tuỳ chỉnh,
                tổng chi phí cuối cùng chỉ có hiệu lực sau khi hướng dẫn viên gửi báo giá từng mục và
                bạn nhấn xác nhận chốt chuyến.
              </p>
            </section>

            <section className="space-y-1.5">
              <h4 className="text-base font-semibold text-ink">4. Chính sách bảo mật dữ liệu</h4>
              <p>
                Thông tin cá nhân, lịch sử đặt chuyến và ghi chú hành trình chỉ được sử dụng cho mục
                đích điều phối dịch vụ giữa bạn và hướng dẫn viên phụ trách tuyến đi. TripBuilder
                không bán hoặc chia sẻ dữ liệu cá nhân cho bên quảng cáo thứ ba.
              </p>
            </section>
          </div>

          <div className="px-6 py-4 border-t border-rule bg-surface-2 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="btn btn-ghost text-sm">
              Đóng
            </button>
            {onAccept && (
              <button
                type="button"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="btn btn-primary text-sm font-semibold"
              >
                Tôi đồng ý
              </button>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
