import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Footer } from "../../components/Footer";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  Activity,
  Calendar,
  RefreshCw,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ActivityLog {
  id: number;
  username: string;
  action: string;
  timestamp: string;
}

interface HistoryTrackingProps {
  onNavigate: (page: string) => void;
}

export function HistoryTracking({ onNavigate }: HistoryTrackingProps) {
  const { user: authUser } = useAuth();

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const TOAST_DURATION = 1000;

  // Chỉ admin mới xem được
  if (!authUser) {
    return (
      <div className="app-wrapper">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">
            Đang kiểm tra quyền truy cập...
          </p>
        </div>
      </div>
    );
  }

  if (authUser.role !== "ADMIN") {
    return (
      <div className="app-wrapper">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="status-circle-error">
            <span className="text-4xl">🚫</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Truy cập bị từ chối
          </h2>
          <p className="text-gray-600 mb-6">
            Bạn không có quyền xem trang này. Chỉ Quản trị viên mới được phép.
          </p>
          <button
            onClick={() => onNavigate("mypage")}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Quay lại MyPage
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  useEffect(() => {
    const fetchActivities = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Không tìm thấy token!");
        setTimeout(() => onNavigate("login"), 3000);
        return;
      }

      try {
        setIsLoading(true);

        const res = await api.get("/admin/activity-logs", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
          withCredentials: true,
        });

        let logs: ActivityLog[] = [];

        // Xử lý response format
        if (res.data && typeof res.data === "object") {
          if (res.data.data && Array.isArray(res.data.data)) {
            logs = res.data.data;
          } else if (Array.isArray(res.data)) {
            logs = res.data;
          } else if (res.data.logs && Array.isArray(res.data.logs)) {
            logs = res.data.logs;
          }
        }

        // Sắp xếp theo thời gian mới nhất trước
        logs.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

        setActivities(logs);

        if (logs.length > 0) {
          toast.success(`Đã tải ${logs.length} hoạt động!`);
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          toast.error("Phiên đăng nhập hết hạn!");
          setTimeout(() => onNavigate("login"), 3000);
        } else if (err.response?.status === 403) {
          toast.error("Bạn không có quyền admin!");
          setTimeout(() => onNavigate("mypage"), 3000);
        } else if (err.response?.status === 404) {
          toast.error("Endpoint không tồn tại!");
        } else if (err.response?.status === 500) {
          toast.error("Lỗi server!");
        } else {
          toast.error("Lỗi tải lịch sử hoạt động!");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [onNavigate]);

  const filteredActivities = activities.filter((log) => {
    const logDate = new Date(log.timestamp).toISOString().split("T")[0];
    return logDate === selectedDate;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = filteredActivities.slice(startIndex, endIndex);

  // Reset to page 1 when date changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate]);

  const handleBack = () => {
    onNavigate("admin");
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setActivities([]); // Clear old data

    // Gọi lại fetch function
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Không tìm thấy token!");
      setTimeout(() => onNavigate("login"), 3000);
      return;
    }

    api
      .get("/admin/activity-logs", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        let logs: ActivityLog[] = [];
        if (res.data?.data && Array.isArray(res.data.data)) {
          logs = res.data.data;
        } else if (Array.isArray(res.data)) {
          logs = res.data;
        }

        logs.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

        setActivities(logs);
        toast.success(`Đã tải ${logs.length} hoạt động!`, {
          duration: TOAST_DURATION,
        });
      })
      .catch((err) => {
        toast.error("Lỗi refresh dữ liệu!", { duration: TOAST_DURATION });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  // Thêm hàm delete
  const handleDeleteLog = async (id: number) => {
    try {
      await api.delete(`/admin/activity-logs/${id}`);
      toast.success("Xóa log thành công! 😻");
      // Refresh list
      const updatedActivities = activities.filter((log) => log.id !== id);
      setActivities(updatedActivities);
    } catch (err) {
      toast.error("Xóa log thất bại 😿");
    }
  };
  return (
    <div className="app-container">
      {/* Main Container */}
      <div className="main-container">
        {/* Header Section */}
        <div className="mb-8">
          <div className="responsive-bar">
            {/* Title with Icon */}
            <div>
              <div className="sub-info-row">
                <div className="icon-box-purple">
                  <Activity className="icon-standard" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Lịch sử Hoạt động
                </h1>
              </div>
              <p className="text-gray-600 ml-15">
                Xem lại các hoạt động của người dùng trong hệ thống
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex-row-center">
              <button
                onClick={handleRefresh}
                className="btn-secondary"
                aria-label="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handleBack}
                className="btn-danger"
                aria-label="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="card-container">
          <div className="flex-adaptive-end">
            {/* Date Picker */}
            <div className="flex-1">
              <label className="label-style">Chọn ngày</label>
              <div className="relative">
                <Calendar className="absolute-icon-center-y" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="date-input"
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            {/* Summary Stats */}
            <div className="flex-split-divider">
              <div className="grid-2-cols">
                <div>
                  <p className="sub-label-text">Ngày đã chọn</p>
                  <p className="text-heading-title">
                    {format(new Date(selectedDate), "MMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="sub-label-text">Số record</p>
                  <p className="text-highlight-title">
                    {filteredActivities.length}
                  </p>
                </div>
              </div>
              <div className="divider-top">
                <p className="text-body-small">
                  Tổng số log trong hệ thống:{" "}
                  <span className="text-label-bold">{activities.length}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="card-spacious">
            <div className="text-center">
              <div className="spinner"></div>
              <p className="text-lg text-gray-600">
                Đang tải lịch sử hoạt động...
              </p>
            </div>
          </div>
        )}

        {/* Table Section */}
        {!isLoading && (
          <div className="card-container-clean">
            {filteredActivities.length === 0 ? (
              /* Empty State */
              <div className="text-center py-16 px-4">
                <div className="avatar-placeholder-center">
                  <Activity className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Không có hoạt động nào
                </h3>
                <p className="text-gray-600 mb-1">
                  Không có hoạt động nào cho ngày đã chọn
                </p>
                <p className="text-sm text-gray-500">
                  Thử chọn ngày khác hoặc nhấn nút Refresh.
                </p>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="scroll-container-x">
                  <table className="w-full">
                    <thead>
                      <tr className="header-surface">
                        <th className="table-header">Thời gian</th>
                        <th className="table-header">Tên người dùng</th>
                        <th className="table-header">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-custom > * + *">
                      {currentItems.map((log, index) => (
                        <tr
                          key={log.id}
                          className={`hover-item ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                          }`}
                        >
                          <td className="table-cell text-gray-600">
                            {format(
                              new Date(log.timestamp),
                              "HH:mm:ss dd/MM/yyyy",
                            )}
                          </td>
                          <td className="table-cell">
                            <span className="font-semibold text-purple-700">
                              {log.username}
                            </span>
                          </td>
                          <td className="table-cell text-gray-700">
                            {log.action}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  window.confirm(
                                    "Bạn có chắc chắn muốn xóa log này?",
                                  )
                                ) {
                                  handleDeleteLog(log.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-800 font-medium text-sm"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="card-footer">
                    <div className="flex-adaptive-between">
                      {/* Results Info */}
                      <div className="text-sm text-gray-600">
                        Showing{" "}
                        <span className="font-medium text-gray-900">
                          {startIndex + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium text-gray-900">
                          {Math.min(endIndex, filteredActivities.length)}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium text-gray-900">
                          {filteredActivities.length}
                        </span>{" "}
                        logs
                      </div>

                      {/* Pagination Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className="pagination-btn"
                          aria-label="Previous page"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((page) => {
                              // Show first page, last page, current page, and adjacent pages
                              return (
                                page === 1 ||
                                page === totalPages ||
                                Math.abs(page - currentPage) <= 1
                              );
                            })
                            .map((page, index, array) => {
                              // Add ellipsis if there's a gap
                              const showEllipsisBefore =
                                index > 0 && page - array[index - 1] > 1;

                              return (
                                <div key={page} className="flex items-center">
                                  {showEllipsisBefore && (
                                    <span className="px-2 text-gray-400">
                                      ...
                                    </span>
                                  )}
                                  <button
                                    onClick={() => goToPage(page)}
                                    className={`pagination-number ${
                                      currentPage === page
                                        ? "pagination-number-active"
                                        : ""
                                    }`}
                                  >
                                    {page}
                                  </button>
                                </div>
                              );
                            })}
                        </div>

                        <button
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className="pagination-btn"
                          aria-label="Next page"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-16">
        <Footer />
      </div>

      <style>{`
      .hover-item {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms; /* Tốc độ chuyển đổi mặc định của Tailwind */
}

.hover-item:hover {
  background-color: #f9fafb; /* gray-50 */
}
      .divide-y-custom > * + * {
  border-top-width: 1px;
  border-color: #f3f4f6; /* gray-100 */
}
      .header-surface {
  background-color: #f9fafb; /* gray-50 */
  border-bottom: 1px solid #e5e7eb; /* gray-200 */
}
      .scroll-container-x {
  overflow-x: auto;
  white-space: nowrap; /* Thường dùng để tránh các phần tử xuống dòng */
  -webkit-overflow-scrolling: touch; /* Giúp cuộn mượt hơn trên iOS */
}

/* Tùy chỉnh thanh cuộn cho gọn (Chrome/Safari) */
.scroll-container-x::-webkit-scrollbar {
  height: 4px;
}
.scroll-container-x::-webkit-scrollbar-thumb {
  background: #e5e7eb; /* gray-200 */
  border-radius: 10px;
}
      .card-footer {
  padding-left: 1.5rem;  /* 24px */
  padding-right: 1.5rem; /* 24px */
  padding-top: 1rem;     /* 16px */
  padding-bottom: 1rem;  /* 16px */
  border-top: 1px solid #e5e7eb; /* gray-200 */
  background-color: #f9fafb;     /* gray-50 */
}
      .flex-adaptive-between {
  display: flex;
  flex-direction: column;
  gap: 1rem; /* 16px */
}

@media (min-width: 640px) {
  .flex-adaptive-between {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
      .avatar-placeholder-center {
  width: 5rem; /* 80px */
  height: 5rem; /* 80px */
  background-color: #f3f4f6; /* gray-100 */
  border-radius: 9999px; /* rounded-full */
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 1rem; /* 16px */
}
      .card-container-clean {
  background-color: #ffffff;
  border-radius: 1rem; /* 16px */
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  overflow: hidden; /* Cắt các phần tử con tràn ra ngoài góc bo tròn */
}
      .spinner {
  animation: spin 1s linear infinite;
  border-radius: 9999px; /* rounded-full */
  height: 3rem; /* 48px */
  width: 3rem;  /* 48px */
  border-bottom-width: 2px;
  border-color: #9333ea; /* border-purple-600 */
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 1rem; /* 16px */
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
      .card-spacious {
  background-color: #ffffff;
  border-radius: 1rem; /* 16px */
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  padding: 4rem; /* 64px (p-16) */
}
      .text-label-bold {
  font-weight: 600;
  color: #111827; /* gray-900 */
}
      .text-body-small {
  font-size: 0.875rem; /* 14px */
  color: #4b5563; /* gray-600 */
  line-height: 1.25rem; /* 20px */
}
      .divider-top {
  margin-top: 0.75rem; /* 12px */
  padding-top: 0.75rem; /* 12px */
  border-top: 1px solid #f3f4f6; /* gray-100 */
}
      .text-highlight-title {
  font-size: 1.125rem; /* 18px */
  font-weight: 600;
  color: #9333ea; /* purple-600 */
}
      .text-heading-title {
  font-size: 1.125rem; /* 18px */
  font-weight: 600;
  color: #111827; /* gray-900 */
}
      .sub-label-text {
  font-size: 0.75rem; /* 12px */
  color: #6b7280; /* gray-500 */
  margin-bottom: 0.25rem; /* 4px */
}
      .grid-2-cols {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem; /* 16px */
}
      .flex-split-divider {
  flex: 1 1 0%;
}

@media (min-width: 640px) {
  .flex-split-divider {
    border-left: 1px solid #e5e7eb; /* gray-200 */
    padding-left: 1.5rem; /* 24px */
  }
}
      .absolute-icon-center-y {
  position: absolute;
  left: 0.75rem; /* 12px */
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem; /* 20px */
  height: 1.25rem;
  color: #9ca3af; /* gray-400 */
}
      .label-style {
  display: block;
  font-size: 0.875rem; /* 14px */
  font-weight: 500;
  color: #374151; /* gray-700 */
  margin-bottom: 0.5rem; /* 8px */
}
      .flex-adaptive-end {
  display: flex;
  flex-direction: column;
  gap: 1rem; /* 16px */
}

@media (min-width: 640px) {
  .flex-adaptive-end {
    flex-direction: row;
    align-items: flex-end; /* Căn lề dưới các phần tử */
  }
}
      .card-container {
  background-color: #ffffff;
  border-radius: 1rem; /* 16px */
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  padding: 1.5rem; /* 24px */
  margin-bottom: 1.5rem;
}
      .flex-row-center {
  display: flex;
  align-items: center;
  gap: 0.75rem; /* 12px */
}
      .icon-standard {
  width: 1.5rem;
  height: 1.5rem;
  color: #9333ea;
}
      .icon-box-purple {
  /* w-12 h-12: Kích thước 3rem (48px) - Chuẩn vàng cho UI điện thoại */
  width: 3rem;
  height: 3rem;

  /* bg-purple-100: Màu tím nhạt thanh lịch */
  background-color: #f3e8ff;

  /* rounded-xl: Bo góc 0.75rem (12px), tạo cảm giác "mềm mại nhưng vẫn vững chãi" */
  border-radius: 0.75rem;

  /* flex items-center justify-center: Căn giữa icon hoàn hảo */
  display: flex;
  align-items: center;
  justify-content: center;

  /* Hiệu ứng tương tác */
  transition: all 0.2s ease;
  cursor: pointer;
}

.icon-box-purple:hover {
  background-color: #e9d5ff; /* purple-200 */
  transform: translateY(-2px);
}
      .sub-info-row {
  /* flex items-center: Căn giữa Icon và Chữ theo trục dọc để không bị lệch */
  display: flex;
  align-items: center;

  /* gap-3: Khoảng cách giữa icon và chữ là 0.75rem (12px) */
  gap: 0.75rem;

  /* mb-2: Khoảng cách 8px với dòng bên dưới */
  margin-bottom: 0.5rem;
}
      .responsive-bar {
  display: flex;
  /* Mặc định cho Mobile: Xếp chồng các phần tử theo cột */
  flex-direction: column;
  gap: 1rem; /* gap-4 */
}

/* Từ màn hình Small (sm: 640px) trở lên */
@media (min-width: 640px) {
  .responsive-bar {
    /* Chuyển sang hàng ngang */
    flex-direction: row;
    /* Căn giữa các phần tử theo trục dọc */
    align-items: center;
    /* Đẩy các phần tử ra hai đầu (Ví dụ: Tiêu đề bên trái, Nút bấm bên phải) */
    justify-content: space-between;
  }
}
      .main-container {
  /* max-w-7xl: Giới hạn chiều rộng tối đa khoảng 1280px */
  max-width: 80rem;
  
  /* mx-auto: Căn giữa khối này khi màn hình rộng hơn 1280px */
  margin-left: auto;
  margin-right: auto;

  /* py-8: Khoảng cách trên dưới 2rem (32px) để nội dung không chạm mép trình duyệt */
  padding-top: 2rem;
  padding-bottom: 2rem;

  /* Padding ngang thay đổi theo kích thước màn hình (Responsive Padding) */
  padding-left: 1rem;   /* Mặc định cho Mobile (px-4) */
  padding-right: 1rem;
}

/* Tablet (sm: 640px) */
@media (min-width: 640px) {
  .main-container {
    padding-left: 1.5rem; /* px-6 */
    padding-right: 1.5rem;
  }
}

/* Desktop lớn (lg: 1024px) */
@media (min-width: 1024px) {
  .main-container {
    padding-left: 2rem; /* px-8 */
    padding-right: 2rem;
  }
}
      .app-container {
  /* min-h-screen: Chiều cao tối thiểu bằng 100% khung nhìn người dùng */
  min-height: 100vh;

  /* bg-gray-50: Màu xám cực nhẹ (#f9fafb) */
  background-color: #f9fafb;

  /* Thường đi kèm với Flexbox để căn giữa nội dung */
  display: flex;
  flex-direction: column;
}
      .status-circle-error {
  /* w-20 h-20: Kích thước 80px x 80px */
  width: 5rem;
  height: 5rem;

  /* bg-red-100: Màu nền hồng nhạt nhẹ nhàng */
  background-color: #fee2e2;

  /* rounded-full: Biến hình vuông thành hình tròn hoàn hảo */
  border-radius: 9999px;

  /* flex items-center justify-center: Căn giữa icon bên trong tuyệt đối */
  display: flex;
  align-items: center;
  justify-content: center;

  /* mx-auto mb-6: Căn giữa khối và tạo khoảng cách 24px với nội dung dưới */
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 1.5rem;
  
  /* Hiệu ứng xuất hiện (tùy chọn) */
  animation: scale-up 0.3s ease-out;
}

@keyframes scale-up {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
      .app-wrapper {
  /* min-h-screen: Chiều cao tối thiểu bằng 100% chiều cao màn hình thiết bị */
  min-height: 100vh;

  /* flex items-center justify-center: "Phép thuật" căn giữa mọi thứ */
  display: flex;
  align-items: center;     /* Căn giữa theo chiều dọc */
  justify-content: center;  /* Căn giữa theo chiều ngang */

  /* bg-gray-50: Màu trắng khói, giúp các khối màu trắng (như Flashcard) nổi bật lên */
  background-color: #f9fafb;
  
  /* Đảm bảo nội dung không dính sát mép trên Mobile */
  padding: 1.5rem;
}
        /* Button Styles */
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          color: #374151;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 0.75rem;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background-color: #f9fafb;
          border-color: #d1d5db;
        }

        .btn-danger {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 0.75rem;
          transition: all 0.2s;
        }

        .btn-danger:hover {
          background-color: #fee2e2;
          border-color: #fca5a5;
        }

        /* Date Input */
        .date-input {
          width: 100%;
          padding: 0.625rem 1rem 0.625rem 2.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          color: #111827;
          transition: all 0.2s;
        }

        .date-input:focus {
          outline: none;
          border-color: #7c3aed;
          ring: 2px;
          ring-color: rgba(124, 58, 237, 0.1);
        }

        /* Table Styles */
        .table-header {
          padding: 1rem 1.5rem;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
        }

        .table-cell {
          padding: 1rem 1.5rem;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        /* Pagination Styles */
        .pagination-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          height: 2.5rem;
          border: 1px solid #e5e7eb;
          background-color: #ffffff;
          color: #6b7280;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .pagination-btn:hover:not(:disabled) {
          background-color: #f9fafb;
          border-color: #d1d5db;
          color: #111827;
        }

        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .pagination-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 2.5rem;
          height: 2.5rem;
          padding: 0 0.5rem;
          border: 1px solid transparent;
          background-color: transparent;
          color: #6b7280;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .pagination-number:hover {
          background-color: #f3f4f6;
          color: #111827;
        }

        .pagination-number-active {
          background-color: #7c3aed;
          color: #ffffff;
          border-color: #7c3aed;
        }

        .pagination-number-active:hover {
          background-color: #6d28d9;
          color: #ffffff;
        }

        /* Responsive Table */
        @media (max-width: 640px) {
          .table-header,
          .table-cell {
            padding: 0.75rem 1rem;
            font-size: 0.8125rem;
          }
        }
      `}</style>
    </div>
  );
}
