import { useEffect, useRef, useState } from 'react';
import userApi from '../../api/userApi';
import Navbar from '../../components/Navbar';



interface User {
  id: number,
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  isActive: boolean
}
const UserList = () => {
  // ===== STATE MANAGEMENT =====
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editingId, setEditingId] = useState<null | number>(null);

  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    // khởi tạo controller
    const controller = new AbortController();
    // Tạo một bộ hẹn giờ
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        // Gọi hàm search khi đủ 300ms
        handleSearch(searchTerm, controller.signal); // truyền thêm signal vào hàm search
      } else {
        // Nếu ô search trống thì quay về danh sách đầy đủ
        fetchUsers();
      }
    }, 300);

    // Hàm cleanup: Hủy bộ hẹn giờ cũ nếu searchTerm thay đổi liên tục
    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort(); // hủy request api nếu người dùng tiếp tục gõ trước khi api gọi
    }
  }, [searchTerm]);


  // Hàm handleSearch chỉnh sửa lại một chút
  const handleSearch = async (email: string, signal: AbortSignal) => {
    try {
      setLoading(true);
      const res = await userApi.getAll(email, { signal });
      const result = res.data.data;
      // Đảm bảo dữ liệu luôn là mảng để .map() hoạt động
      setUsers(Array.isArray(result) ? result : result ? [result] : []);
      setError('');
    } catch (err: any) {

      if (err.name === 'Canceled Error' || err.name === 'AbortError') {
        console.log("request cũ đã bị hủy")
        return;
      }
      setUsers([]);
      setError('❌ Không tìm thấy người dùng!');
    } finally {
      setLoading(false);
    }
  };

  // State cho form thêm/sửa
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', password: '' });

  // ===== 1. HÀM FETCH DANH SÁCH USER TỪ API =====
  /**
   * Lấy danh sách tất cả users từ API NestJS
   * - Gọi userApi.getAll() để fetch dữ liệu
   * - Lưu vào state users
   * - Xử lý lỗi nếu có (vd: không có quyền, API lỗi)
   * - Set loading = false để ẩn loading spinner
   */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await userApi.getAll();
      // res.data chứa mảng users từ API
      console.log(res);
      setUsers(res.data.data); // API trả về { data: [...], statusCode, message }
    } catch (err: any) {
      console.error("Lỗi lấy dữ liệu:", err);
      // Kiểm tra lỗi quyền hạn
      if (err.response?.status === 403) {
        setError('❌ Bạn không có quyền xem danh sách user! (Yêu cầu quyền Admin)');
      }
      else {
        setError(`❌ Lỗi khi tải dữ liệu: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ===== 2. HÀM THÊM HOẶC CẬP NHẬT USER =====
  /**
   * Hàm xử lý thêm mới hoặc cập nhật user:
   * - Nếu editingId !== null: gọi userApi.update()
   * - Nếu editingId === null: gọi userApi.create()
   * - Reset form sau khi thành công
   * - Load lại danh sách
   */
  const handleAddUser = async (e: any) => {
    e.preventDefault();

    // Kiểm tra dữ liệu hợp lệ
    if (!newUser.firstName.trim() || !newUser.lastName.trim() || !newUser.email.trim()) {
      setError('❌ Vui lòng điền đầy đủ tên và email');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccessMsg('');

      if (editingId) {
        // Cập nhật user hiện tại
        await userApi.update(editingId, newUser);
        setSuccessMsg('✅ Cập nhật user thành công!');
      } else {
        // Tạo user mới
        await userApi.create(newUser);
        setSuccessMsg('✅ Thêm user mới thành công!');
      }

      // Reset form và reload danh sách
      setNewUser({ firstName: '', lastName: '', email: '', password: '' });
      setEditingId(null);
      fetchUsers();

      // Ẩn thông báo sau 3 giây
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error("Lỗi:", err);
      setError(`❌ Lỗi: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ===== 3. HÀM XÓA USER =====
  /**
   * Xóa user với xác nhận:
   * - Hiển thị dialog confirm
   * - Gọi userApi.delete(id) nếu user xác nhận
   * - Load lại danh sách
   */
  const handleDelete = async (id: number) => {
    if (window.confirm("⚠️ Bạn có chắc chắn muốn xóa user này không?")) {
      try {
        setError('');
        await userApi.delete(id);
        setSuccessMsg('✅ Xóa user thành công!');
        fetchUsers();
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err: any) {
        setError(`❌ Lỗi xóa: ${err.message}`);
      }
    }
  };

  // ===== 4. HÀM CHẠY EDIT MODE =====
  /**
   * Bật chế độ chỉnh sửa:
   * - Set editingId = id
   * - Điền dữ liệu user vào form
   */
  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setNewUser({ firstName: user.firstName, lastName: user.lastName, email: user.email, password: user.password });
    setError('');
    setSuccessMsg('');
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ===== 5. HÀM CANCEL EDIT =====
  /**
   * Hủy chế độ chỉnh sửa:
   * - Reset form
   * - Clear editingId
   */
  const handleCancel = () => {
    setEditingId(null);
    setNewUser({ firstName: '', lastName: '', email: '', password: '' });
  };

  // ===== 6. HOOK USEEFFECT - CHẠY KHI COMPONENT MOUNT =====
  /**
   * Chạy một lần khi component được render lần đầu tiên
   * - Gọi fetchUsers() để tải danh sách users
   * - Dependency array [] = chỉ chạy 1 lần
   */
  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!loading) {
      focusSearch()
    }
  }, [loading])

  // hàm xử lý cập nhật trạng thái user
  const handleToggleStatus = async (user: any) => {
    try {
      // Gọi API đảo ngược trạng thái hiện tại
      const newStatus = !user.isActive;
      await userApi.updateStatus(user.id, newStatus);

      // Cập nhật lại state cục bộ để giao diện đổi màu ngay mà không cần load lại trang
      setUsers(users.map(u =>
        u.id === user.id ? { ...u, isActive: newStatus } : u
      ));
    } catch (err) {
      alert("Cập nhật trạng thái thất bại!");
    }
  };

  const searchInputRef = useRef<HTMLInputElement>(null);
  const focusSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }


  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Navbar />
      {/* ===== HEADER =====*/}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">👥 Quản lý người dùng</h1>
        <button
          onClick={() => { localStorage.removeItem('token'); window.location.reload(); }}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 font-medium transition"
        >
          🚪 Đăng xuất
        </button>
      </div>

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-400">🔍</span>
        </div>
        <input
          ref={searchInputRef}
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition duration-150 ease-in-out"
          placeholder="Nhập email để tìm kiếm tự động (sau 300ms)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>


      {/* ===== THÔNG BÁO LỖI =====*/}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* ===== THÔNG BÁO THÀNH CÔNG =====*/}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {successMsg}
        </div>
      )}

      {/* ===== FORM THÊM/SỬA USER ===== */}
      <form onSubmit={handleAddUser} className="bg-white p-6 shadow rounded-lg mb-8 border-l-4 border-blue-500">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {editingId ? '✏️ Chỉnh sửa người dùng' : '➕ Thêm người dùng mới'}
        </h2>

        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Nhập tên người dùng"
            className="border border-gray-300 p-3 flex-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newUser.firstName}
            onChange={e => setNewUser({ ...newUser, firstName: e.target.value })}
            required
            disabled={submitting}
          />

          <input
            type="text"
            placeholder="Nhập họ người dùng"
            className="border border-gray-300 p-3 flex-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newUser.lastName}
            onChange={e => setNewUser({ ...newUser, lastName: e.target.value })}
            required
            disabled={submitting}
          />
          <input
            type="email"
            placeholder="Nhập email"
            className="border border-gray-300 p-3 flex-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newUser.email}
            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
            required
            disabled={submitting}
          />

          <input
            type="password"
            placeholder="Nhập password"
            className="border border-gray-300 p-3 flex-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newUser.password}
            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
            // required
            disabled={submitting}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 font-medium transition disabled:bg-gray-400 cursor-pointer"
          >
            {submitting ? '⏳' : '✓'} {editingId ? 'Cập nhật' : 'Thêm'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500 font-medium transition"
            >
              ✕ Hủy
            </button>
          )}
        </div>
      </form>

      {/* ===== BẢNG DANH SÁCH USER ===== */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Tên người dùng</th>
              <th className="p-4">Họ người dùng</th>
              <th className="p-4">Email</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (<div className="p-10 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-lg text-gray-600">⏳ Đang tải dữ liệu...</p>
            </div>) : users && users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-blue-50 transition">
                  <td className="p-4 text-gray-600 font-semibold">#{user.id}</td>
                  <td className="p-4 font-medium text-gray-800">{user.firstName}</td>
                  <td className="p-4 font-medium text-gray-800">{user.lastName}</td>
                  <td className="p-4 text-gray-600">{user.email}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${user.isActive
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                    >
                      {/* Vòng tròn nhỏ biểu thị trạng thái */}
                      <span className={`w-2 h-2 mr-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                    </button>
                  </td>
                  <td className="p-4 text-center flex gap-2 justify-center">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-500 hover:text-blue-700 font-medium hover:underline transition"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-500 hover:text-red-700 font-medium hover:underline transition"
                    >
                      🗑️ Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  📭 Không có dữ liệu user
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserList;