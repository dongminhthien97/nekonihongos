// src/pages/admin/DashboardAdmin.tsx (FULL CODE HOÀN CHỈNH - GIỮ NGUYÊN 100% UI/UX + STYLE, FIX REDIRECT LOGIN BẰNG AUTH GUARD + LOADING)

import { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

interface User {
  id: number;
  username: string;
  fullName?: string;
  email: string;
  role: "USER" | "ADMIN";
  level: number;
  points: number;
  streak?: number;
  joinDate: string;
  avatarUrl?: string;
  password?: string;
  status?: "ACTIVE" | "INACTIVE" | "BANNED";
}

interface DashboardAdminProps {
  onNavigate: (page: string) => void;
}

export function DashboardAdmin({ onNavigate }: DashboardAdminProps) {
  const { user, loading: authLoading } = useAuth();

  const PLACEHOLDER_AVATAR =
    "https://ui-avatars.com/api/?background=4f46e5&color=fff&name=";

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit" | "">("");
  const [formData, setFormData] = useState<Partial<User>>({
    username: "",
    email: "",
    fullName: "",
    role: "USER",
    level: 1,
    points: 0,
    streak: 0,
    status: "ACTIVE",
    password: "123456",
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "USER" | "ADMIN">("ALL");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE" | "BANNED"
  >("ALL");
  const [sortBy, setSortBy] = useState<
    "level" | "points" | "joinDate" | "username"
  >("joinDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [unreadTestsCount, setUnreadTestsCount] = useState(0);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast.error("Bạn cần đăng nhập để truy cập 😿");
      onNavigate("login");
      return;
    }

    if (user.role !== "ADMIN") {
      toast.error("Bạn không có quyền truy cập trang admin 😿");
      onNavigate("landing");
      return;
    }

    fetchUsers();
    fetchUnreadTestsCount();
  }, [authLoading, user, onNavigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users");
      let userList: User[] = res.data?.data || res.data || [];

      userList = userList.map((user: any) => ({
        ...user,
        status: user.status || "ACTIVE",
      }));

      setUsers(userList);
      if (userList.length > 0 && !selectedUser) {
        setSelectedUser(userList[0]);
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Phiên hết hạn hoặc không có quyền 😿");
        onNavigate("login");
      } else {
        toast.error("Không tải được danh sách user 😿");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadTestsCount = async () => {
    try {
      const res = await api.get("/admin/mini-test/pending-count");
      setUnreadTestsCount(res.data.count || 0);
    } catch (err: any) {
      if (err.response?.status === 401) {
        onNavigate("login");
      }
    }
  };

  const handleCreateUser = async () => {
    if (!formData.username?.trim() || !formData.email?.trim()) {
      alert("Vui lòng nhập tên đăng nhập và email!");
      return;
    }

    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        fullName: formData.fullName?.trim() || null,
        avatarUrl: formData.avatarUrl?.trim() || null,
        password: formData.password?.trim() || "123456",
        role: formData.role || "USER",
        level: formData.level || 1,
        points: formData.points || 0,
        streak: formData.streak || 0,
        status: formData.status || "ACTIVE",
      };

      await api.post("/admin/users", payload);
      alert("🎉 Tạo user thành công!");
      handleCloseModal();
      fetchUsers();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Tạo user thất bại";
      alert(`😿 ${msg}`);
    }
  };

  const handleUpdateUser = async () => {
    if (!formData.id || !formData.username?.trim() || !formData.email?.trim()) {
      alert("Thông tin không hợp lệ");
      return;
    }

    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        fullName: formData.fullName?.trim() || null,
        avatarUrl: formData.avatarUrl?.trim() || null,
        role: formData.role || "USER",
        level: formData.level || 1,
        points: formData.points || 0,
        streak: formData.streak || 0,
        status: formData.status || "ACTIVE",
      };

      await api.put(`/admin/users/${formData.id}`, payload);
      toast.success("✅ Cập nhật thành công!");
      handleCloseModal();
      await fetchUsers();
    } catch (err: any) {
      toast.error(`😿 ${err.response?.data?.message || "Cập nhật thất bại"}`);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa user này?")) return;

    try {
      await api.delete(`/admin/users/${id}`);
      alert("🗑️ Xóa user thành công!");
      fetchUsers();
      if (selectedUser?.id === id) {
        setSelectedUser(users[0] || null);
      }
    } catch (err: any) {
      alert(`😿 ${err.response?.data?.message || "Xóa thất bại"}`);
    }
  };

  const openModal = (type: "create" | "edit", user?: User) => {
    setModalType(type);
    if (type === "edit" && user) {
      setFormData({
        ...user,
        password: "",
      });
    } else {
      setFormData({
        username: "",
        email: "",
        fullName: "",
        role: "USER",
        level: 1,
        points: 0,
        streak: 0,
        status: "ACTIVE",
        password: "123456",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalType("");
    setFormData({
      username: "",
      email: "",
      fullName: "",
      role: "USER",
      level: 1,
      points: 0,
      streak: 0,
      status: "ACTIVE",
      password: "123456",
    });
  };

  const getStatusDisplay = (status: string = "ACTIVE") => {
    switch (status) {
      case "ACTIVE":
        return {
          text: "Đang hoạt động",
          className: "badge-success",
        };
      case "INACTIVE":
        return {
          text: "Không hoạt động",
          className: "badge-inactive",
        };
      case "BANNED":
        return { text: "Đã khóa", className: "badge-danger" };
      default:
        return {
          text: "Đang hoạt động",
          className: "badge-success",
        };
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "ALL" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case "level":
        aValue = a.level;
        bValue = b.level;
        break;
      case "points":
        aValue = a.points;
        bValue = b.points;
        break;
      case "joinDate":
        aValue = new Date(a.joinDate).getTime();
        bValue = new Date(b.joinDate).getTime();
        break;
      case "username":
        aValue = a.username.toLowerCase();
        bValue = b.username.toLowerCase();
        break;
      default:
        return 0;
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = sortedUsers.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleBack = () => {
    onNavigate("landing");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p className="text-indigo-600 text-xl mt-4">
            Đang kiểm tra quyền truy cập...
          </p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  if (loading) {
    return (
      <div className="main-layout">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p className="text-indigo-600 text-lg">Đang tải dữ liệu admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="max-w-7xl mx-auto">
        <div className="header-container">
          <div>
            <h1 className="section-title">Admin Dashboard 👑</h1>
            <p className="text-gray-600 mt-1">Quản lý người dùng hệ thống</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => openModal("create")}
              className="success-button"
            >
              <span className="text-lg">+</span> Thêm User
            </button>
            <button
              onClick={() => onNavigate("historytracking")}
              className="btn-primary-gradient"
            >
              📊 <span className="truncate">Lịch sử hoạt động</span>
            </button>

            <button
              onClick={() => onNavigate("test-management")}
              className="btn-secondary-gradient relative"
            >
              📝 <span className="truncate">Quản lý Mini Test</span>
              {unreadTestsCount > 0 && (
                <span className="badge-pulse">
                  {unreadTestsCount > 9 ? "9+" : unreadTestsCount}
                </span>
              )}
            </button>

            <button onClick={handleBack} className="danger-button">
              Quay lại
            </button>
          </div>
        </div>

        <div className="responsive-grid">
          <div className="content-card">
            <div className="sub-title">{users.length}</div>
            <div className="helper-text">Tổng số user</div>
          </div>
          <div className="content-card">
            <div className="sub-title">
              {users.filter((u) => u.role === "ADMIN").length}
            </div>
            <div className="helper-text">Admin</div>
          </div>
          <div className="content-card">
            <div className="sub-title">
              {users.filter((u) => u.status === "ACTIVE").length}
            </div>
            <div className="helper-text">Đang hoạt động</div>
          </div>
          <div className="content-card">
            <div className="sub-title">
              {users
                .reduce((sum, user) => sum + user.points, 0)
                .toLocaleString()}
            </div>
            <div className="helper-text">Tổng điểm</div>
          </div>
        </div>

        <div className="premium-card">
          <div className="p-4 border-b">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm user..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  <div className="absolute-icon">🔍</div>
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="input-standard"
                >
                  <option value="ALL">Tất cả vai trò</option>
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="input-standard"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Không hoạt động</option>
                  <option value="BANNED">Đã khóa</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="input-standard"
                >
                  <option value="joinDate">Mới nhất</option>
                  <option value="username">Tên A-Z</option>
                  <option value="level">Level cao nhất</option>
                  <option value="points">Nhiều điểm nhất</option>
                </select>
                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="secondary-item"
                >
                  {sortOrder === "asc" ? "ASC" : "DESC"}
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header-cell">User</th>
                  <th className="table-header-cell">Thông tin</th>
                  <th className="table-header-cell">Stats</th>
                  <th className="table-header-cell">Trạng thái</th>
                  <th className="table-header-cell">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedUsers.map((user) => {
                  const statusDisplay = getStatusDisplay(user.status);

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-indigo-50 transition-colors cursor-pointer ${
                        selectedUser?.id === user.id ? "bg-indigo-50" : ""
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              user.avatarUrl ||
                              `${PLACEHOLDER_AVATAR}${user.username}`
                            }
                            alt={user.username}
                            className="avatar-style"
                            onError={(e) => {
                              e.currentTarget.src = `${PLACEHOLDER_AVATAR}${user.username}`;
                            }}
                          />
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.username}
                            </div>
                            {user.fullName && (
                              <div className="text-sm text-gray-500">
                                {user.fullName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div className="text-gray-900">{user.email}</div>
                          <div className="text-gray-500 capitalize">
                            {user.role.toLowerCase()}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="font-bold text-indigo-600">
                              {user.level}
                            </div>
                            <div className="text-xs text-gray-500">Level</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-purple-600">
                              {user.points}
                            </div>
                            <div className="text-xs text-gray-500">Điểm</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-orange-600">
                              {user.streak || 0}
                            </div>
                            <div className="text-xs text-gray-500">Streak</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`badge-base ${statusDisplay.className}`}
                        >
                          {statusDisplay.text}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(user.joinDate).toLocaleDateString("vi-VN")}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal("edit", user);
                            }}
                            className="chip-button"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUser(user.id);
                            }}
                            className="chip-button"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="card-footer">
              <div className="text-sm text-gray-500">
                Hiển thị {startIndex + 1}-
                {Math.min(startIndex + itemsPerPage, sortedUsers.length)} của{" "}
                {sortedUsers.length} user
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="step-button"
                >
                  Trước
                </button>
                {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = idx + 1;
                  } else if (currentPage <= 3) {
                    pageNum = idx + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + idx;
                  } else {
                    pageNum = currentPage - 2 + idx;
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handlePageChange(pageNum)}
                      className={`input-mini ${
                        currentPage === pageNum
                          ? "btn-primary"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn-nav"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>

        {selectedUser && (
          <div className="main-card">
            <h2 className="section-title">Chi tiết User</h2>
            <div className="responsive-grid">
              <div>
                <div className="flex-header">
                  <img
                    src={
                      selectedUser.avatarUrl ||
                      `${PLACEHOLDER_AVATAR}${selectedUser.username}`
                    }
                    alt={selectedUser.username}
                    className="profile-avatar-lg"
                    onError={(e) => {
                      e.currentTarget.src = `${PLACEHOLDER_AVATAR}${selectedUser.username}`;
                    }}
                  />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedUser.username}
                    </h3>
                    <p className="text-gray-600">{selectedUser.email}</p>
                    {selectedUser.fullName && (
                      <p className="text-gray-700">{selectedUser.fullName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500">Role</label>
                    <div className="font-medium text-gray-900 capitalize">
                      {selectedUser.role.toLowerCase()}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Trạng thái</label>
                    <div className="font-medium">
                      <span
                        className={`tag-flat ${
                          getStatusDisplay(selectedUser.status).className
                        }`}
                      >
                        {getStatusDisplay(selectedUser.status).text}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">
                      Ngày tham gia
                    </label>
                    <div className="font-medium text-gray-900">
                      {new Date(selectedUser.joinDate).toLocaleDateString(
                        "vi-VN",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Thống kê học tập
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Level</span>
                      <span className="text-sm font-medium text-indigo-600">
                        Cấp {selectedUser.level}
                      </span>
                    </div>
                    <div className="progress-container">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.min(selectedUser.level * 10, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Điểm</span>
                      <span className="text-sm font-medium text-purple-600">
                        {selectedUser.points.toLocaleString()} điểm
                      </span>
                    </div>
                    <div className="progress-container">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.min(
                            (selectedUser.points / 10000) * 100,
                            100,
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Streak</span>
                      <span className="text-sm font-medium text-orange-600">
                        {selectedUser.streak || 0} ngày
                      </span>
                    </div>
                    <div className="progress-container">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.min(
                            ((selectedUser.streak || 0) / 30) * 100,
                            100,
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t">
                  <button
                    onClick={() => openModal("edit", selectedUser)}
                    className="btn-gradient"
                  >
                    Chỉnh sửa User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content-box">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {modalType === "create" ? "Tạo User Mới" : "Chỉnh sửa User"}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    X
                  </button>
                </div>

                <div className="content-grid-compact">
                  <div>
                    <label className="content-grid-compact">
                      Tên đăng nhập *
                    </label>
                    <input
                      type="text"
                      value={formData.username || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="input-smart"
                      placeholder="username"
                      required
                    />
                  </div>

                  <div>
                    <label className="content-grid-compact">Email *</label>
                    <input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="input-smart"
                      placeholder="email@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="content-grid-compact">Họ và tên</label>
                    <input
                      type="text"
                      value={formData.fullName || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="input-smart"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>

                  {modalType === "create" && (
                    <div>
                      <label className="content-grid-compact">Mật khẩu</label>
                      <input
                        type="text"
                        value={formData.password || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="input-smart"
                        placeholder="Để trống = 123456"
                      />
                    </div>
                  )}

                  <div>
                    <label className="content-grid-compact">Avatar URL</label>
                    <input
                      type="text"
                      value={formData.avatarUrl || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, avatarUrl: e.target.value })
                      }
                      className="input-smart"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>

                  <div>
                    <label className="content-grid-compact">Vai trò</label>
                    <select
                      value={formData.role || "USER"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          role: e.target.value as "USER" | "ADMIN",
                        })
                      }
                      className="input-smart"
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="content-grid-compact">Trạng thái</label>
                    <select
                      value={formData.status || "ACTIVE"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as
                            | "ACTIVE"
                            | "INACTIVE"
                            | "BANNED",
                        })
                      }
                      className="input-smart"
                    >
                      <option value="ACTIVE">Đang hoạt động</option>
                      <option value="INACTIVE">Không hoạt động</option>
                      <option value="BANNED">Đã khóa</option>
                    </select>
                  </div>

                  <div>
                    <label className="content-grid-compact">Level</label>
                    <input
                      type="number"
                      value={formData.level || 1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          level: parseInt(e.target.value) || 1,
                        })
                      }
                      className="input-smart"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="content-grid-compact">Điểm</label>
                    <input
                      type="number"
                      value={formData.points || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          points: parseInt(e.target.value) || 0,
                        })
                      }
                      className="input-smart"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={
                      modalType === "create"
                        ? handleCreateUser
                        : handleUpdateUser
                    }
                    className="btn-premium-flex"
                  >
                    {modalType === "create" ? "Tạo User" : "Cập nhật"}
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="btn-secondary-flex"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
      .btn-secondary-gradient {
      position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.25rem;
  font-weight: 600;
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
  background-size: 200% auto; /* Để tạo hiệu ứng di chuyển gradient */
  
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.btn-secondary-gradient:hover {
  background-position: right center; /* Di chuyển gradient */
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(168, 85, 247, 0.4);
  filter: brightness(1.1);
}

.btn-secondary-gradient:active {
  transform: translateY(0);
  filter: brightness(0.95);
}
  .badge-pulse {position: absolute;top: -0.5rem;right: -0.5rem; width: 1.5rem;  height: 1.5rem; background-color: #ef4444; color: #ffffff;            font-size: 0.75rem;        
  border-radius: 9999px; display: flex;align-items: center;justify-content: center;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }@keyframes pulse {0%, 100% {opacity: 1;}50% {opacity: .5;}}
        .badge-inactive { background-color: #f3f4f6; color: #1f2937; padding: 0.125rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; display: inline-flex; align-items: center; }
        .badge-danger { background-color: #fee2e2; color: #991b1b; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; display: inline-flex; align-items: center; }
        .badge-success { background-color: #dcfce7; color: #166534; padding-left: 0.625rem; padding-right: 0.625rem; padding-top: 0.125rem; padding-bottom: 0.125rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
        .btn-primary-gradient { flex: 1 1 0%; padding: 0.5rem 0.5rem; background: linear-gradient(to right, #9333ea, #4f46e5); color: #ffffff; border-radius: 0.5rem; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.875rem; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .btn-primary-gradient:hover { background: linear-gradient(to right, #7e22ce, #4338ca); }
        .btn-secondary-flex { flex: 1 1 0%; padding: 0.75rem 1.5rem; background-color: #f3f4f6; color: #374151; border-radius: 0.5rem; font-weight: 600; border: none; cursor: pointer; transition: all 0.3s ease; }
        .btn-secondary-flex:hover { background-color: #e5e7eb; }
        .btn-secondary-flex:active { transform: scale(0.98); }
        .btn-premium-flex { flex: 1 1 0%; padding: 0.75rem 1.5rem; background: linear-gradient(to right, #4f46e5, #9333ea); color: #ffffff; border-radius: 0.5rem; font-weight: 600; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: none; cursor: pointer; }
        .btn-premium-flex:hover { background: linear-gradient(to right, #4338ca, #7e22ce); transform: translateY(-2px); box-shadow: 0 20px 25px -5px rgba(79, 70, 229, 0.4); }
        .input-smart { width: 100%; padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.5rem; outline: none; transition: all 0.2s ease-in-out; }
        .input-smart:focus { border-color: #6366f1; box-shadow: 0 0 0 4px #e0e7ff; }
        .content-grid-compact { display: grid; grid-template-columns: repeat(1, minmax(0, 1fr)); gap: 1rem; }
        @media (min-width: 768px) { .content-grid-compact { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        .modal-content-box { background-color: #ffffff; border-radius: 1rem; width: 100%; max-width: 42rem; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
        .modal-content-box::-webkit-scrollbar { width: 6px; }
        .modal-content-box::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 10px; }
        .modal-overlay { position: fixed; top: 0; right: 0; bottom: 0; left: 0; background-color: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; padding: 1rem; z-index: 50; backdrop-filter: blur(4px); }
        .btn-gradient { width: 100%; padding: 0.5rem 1rem; background: linear-gradient(to right, #6366f1, #9333ea); color: #ffffff; border-radius: 0.5rem; font-weight: 500; border: none; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); transition: all 0.3s ease; }
        .btn-gradient:hover { background: linear-gradient(to right, #4f46e5, #7e22ce); box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3); transform: translateY(-1px); }
        .progress-bar-fill { background-color: #4f46e5; height: 0.5rem; border-radius: 9999px; transition: all 500ms cubic-bezier(0.4, 0, 0.2, 1); width: 0%; }
        .tag-flat { display: inline-flex; align-items: center; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; line-height: 1rem; white-space: nowrap; }
        .profile-avatar-lg { width: 5rem; height: 5rem; border: 4px solid #ffffff; border-radius: 9999px; object-fit: cover; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); background-color: #f3f4f6; }
        .flex-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
        .responsive-grid { display: grid; gap: 1.5rem; grid-template-columns: repeat(1, minmax(0, 1fr)); }
        @media (min-width: 768px) { .responsive-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        .main-card { margin-top: 1.5rem; background-color: #ffffff; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
        .btn-nav { padding: 0.25rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; background-color: #ffffff; color: #374151; font-size: 0.875rem; cursor: pointer; transition: all 0.2s ease; }
        .btn-nav:hover:not(:disabled) { background-color: #f9fafb; border-color: #9ca3af; }
        .btn-nav:disabled { opacity: 0.5; cursor: not-allowed; background-color: #f3f4f6; }
        .btn-primary { background-color: #4f46e5; color: #ffffff; border: 1px solid #4f46e5; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .btn-primary:hover { background-color: #4338ca; border-color: #4338ca; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .btn-primary:active { transform: scale(0.96); }
        .input-mini { width: 2.5rem; padding: 0.25rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; text-align: center; appearance: none; -moz-appearance: textfield; }
        .input-mini::-webkit-inner-spin-button, .input-mini::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .step-button { padding: 0.25rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; background-color: #ffffff; color: #374151; cursor: pointer; transition: all 0.2s; }
        .step-button:hover:not(:disabled) { background-color: #f9fafb; }
        .step-button:disabled { opacity: 0.5; cursor: not-allowed; background-color: #f3f4f6; }
        .progress-container { width: 100%; background-color: #e5e7eb; border-radius: 9999px; height: 0.5rem; overflow: hidden; }
        .card-footer { padding: 1rem; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; background-color: transparent; }
        .chip-button { padding: 0.25rem 0.75rem; font-size: 0.875rem; line-height: 1.25rem; background-color: #eff6ff; color: #2563eb; border-radius: 0.5rem; font-weight: 500; border: none; cursor: pointer; display: inline-flex; align-items: center; transition: all 0.2s ease-in-out; }
        .chip-button:hover { background-color: #dbeafe; color: #1d4ed8; }
        .chip-button:active { transform: scale(0.95); }
        .badge-base { display: inline-flex; align-items: center; padding: 0.125rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; white-space: nowrap; }
        .avatar-style { width: 2.5rem; height: 2.5rem; border-radius: 9999px; border: 2px solid #e0e7ff; object-fit: cover; flex-shrink: 0; }
        .table-header-cell { padding: 1rem; text-align: left; font-size: 0.875rem; line-height: 1.25rem; font-weight: 600; color: #374151; -webkit-font-smoothing: antialiased; }
        .secondary-item { padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; background-color: #ffffff; color: #374151; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: background-color 0.2s ease, border-color 0.2s ease; }
        .secondary-item:hover { background-color: #f9fafb; border-color: #9ca3af; }
        .secondary-item:active { background-color: #f3f4f6; transform: scale(0.98); }
        .input-standard { padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; outline: none; background-color: #ffffff; width: 100%; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .input-standard:focus { border-color: #6366f1; box-shadow: 0 0 0 2px #e0e7ff; }
        .absolute-icon { position: absolute; left: 0.75rem; top: 0.625rem; color: #9ca3af; pointer-events: none; display: flex; align-items: center; }
        .search-input { width: 100%; padding: 0.5rem 1rem 0.5rem 2.5rem; border: 1px solid #d1d5db; border-radius: 0.5rem; outline: none; transition: all 0.2s ease-in-out; background-color: #ffffff; }
        .search-input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px #e0e7ff; }
        .premium-card { background-color: #ffffff; border-radius: 1rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); overflow: hidden; isolation: isolate; }
        .helper-text { font-size: 0.875rem; line-height: 1.25rem; color: #6b7280; font-weight: 400; -webkit-font-smoothing: antialiased; }
        .sub-title { font-size: 1.5rem; line-height: 2rem; font-weight: 700; color: #4f46e5; letter-spacing: -0.01em; }
        .content-card { background-color: #ffffff; border-radius: 0.75rem; padding: 1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid rgba(226, 232, 240, 0.8); }
        .section-title { font-size: 1.875rem; line-height: 2.25rem; font-weight: 700; color: #3730a3; letter-spacing: -0.025em; -webkit-font-smoothing: antialiased; }
        @media (min-width: 768px) { .section-title { font-size: 2.25rem; } }
        .responsive-grid { display: grid; margin-bottom: 1.5rem; grid-template-columns: repeat(1, minmax(0, 1fr)); gap: 1rem; }
        @media (min-width: 768px) { .responsive-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        .danger-button { display: inline-flex; align-items: center; padding: 0.5rem 1rem; color: #ffffff; font-weight: 500; text-align: center; border-radius: 0.5rem; border: none; cursor: pointer; background: linear-gradient(to right, #ef4444, #e11d48); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .danger-button:hover { background: linear-gradient(to right, #dc2626, #be123c); transform: translateY(-1px); box-shadow: 0 10px 15px -3px rgba(225, 29, 72, 0.2); }
        .danger-button:active { transform: scale(0.98); }
        .success-button { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; color: #ffffff; font-weight: 500; border-radius: 0.5rem; border: none; cursor: pointer; background: linear-gradient(to right, #22c55e, #059669); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .success-button:hover { background: linear-gradient(to right, #16a34a, #047857); transform: translateY(-1px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .success-button:active { transform: translateY(0); }
        .header-container { margin-bottom: 1.5rem; display: flex; flex-direction: column; align-items: flex-start; gap: 1rem; }
        @media (min-width: 768px) { .header-container { flex-direction: row; justify-content: space-between; align-items: center; } }
        .app-container { min-height: 100vh; background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #eef2ff 100%); padding: 1rem; }
        @media (min-width: 768px) { .app-container { padding: 1.5rem; } }
        .loading-spinner { width: 4rem; height: 4rem; border: 4px solid #e0e7ff; border-top-color: #4f46e5; border-radius: 50%; animation: spin 1s linear infinite; margin-left: auto; margin-right: auto; margin-bottom: 1rem; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .main-layout { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f8fafc, #eef2ff); background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E"); background-blend-mode: overlay; opacity: 0.95; padding: 2rem; }
      `}</style>
    </div>
  );
}
