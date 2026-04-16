import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/login/Login';
import UserList from './pages/user/Users'; // 1. Import component thực tế từ thư mục pages

function App() {
  // ===== QUAN TRỌNG: Đưa isAuthenticated thành STATE =====
  /**
   * Dùng useState để lưu trạng thái đăng nhập
   * - Khi state thay đổi → App tự động re-render
   * - Cho phép navigation hoạt động đúng sau khi login
   */
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  // ===== LISTEN TO CUSTOM AUTH EVENT =====
  /**
   * Lắng nghe sự kiện 'authChanged' từ Login component
   * Khi token được set:
   * - Login trigger event 'authChanged'
   * - App nhận event và cập nhật state
   * - App re-render → navigate hoạt động đúng
   */
  useEffect(() => {
    const handleAuthChange = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    };

    // Lắng nghe sự kiện custom từ Login component
    window.addEventListener('authChanged', handleAuthChange);

    // Cũng lắng nghe storage event (khi tab khác thay đổi)
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('authChanged', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  return (
    <Routes>
      {/* Nếu đã login mà cố vào trang login thì đá sang trang users */}
      <Route 
        path="/login" 
        element={!isAuthenticated ? <Login /> : <Navigate to="/users" />} 
      />
      
      {/* Nếu chưa login mà cố vào trang users thì đá về trang login */}
      <Route 
        path="/users" 
        element={isAuthenticated ? <UserList /> : <Navigate to="/login" />} 
      />

      {/* Trang mặc định là login */}
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;