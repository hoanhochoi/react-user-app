import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authApi from '../../api/authApi';

const Login = () => {
  const [username, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const response = await authApi.login({ username, password });
      // ===== QUAN TRỌNG: Lưu token vào localStorage =====
      /**
       * Lưu access_token từ API response
       * - NestJS trả về { access_token, ... }
       * - Lưu token để axiosClient tự động thêm vào Authorization header
       */
      localStorage.setItem('token', response.data.access_token);
      
      // ===== TRIGGER CUSTOM EVENT ĐỂ CẬP NHẬT AUTH STATE =====
      /**
       * Phát sự kiện 'authChanged' để App.tsx biết token đã thay đổi
       * - App.tsx sẽ listen to event này
       * - App sẽ update state isAuthenticated = true
       * - Gói Component re-render → Navigate hoạt động
       * - Trang tự động chuyển sang /users
       */
      window.dispatchEvent(new Event('authChanged'));
      
      // ===== CHUYỂN HƯỚNG SANG TRANG USERS =====
      // navigate() sẽ hoạt động vì App đã re-render với isAuthenticated = true
      navigate('/users');
      
    } catch (err) {
      setError('❌ Email hoặc mật khẩu không chính xác!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-2xl w-96">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">🔐 Đăng Nhập</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <label className="block mb-2 font-semibold text-gray-700">📧 Email</label>
          <input 
            type="email" 
            className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            placeholder="Nhập email của bạn"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-semibold text-gray-700">🔒 Mật khẩu</label>
          <input 
            type="password" 
            className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            placeholder="Nhập mật khẩu của bạn"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400 cursor-pointer"
        >
          {loading ? '⏳ Đang đăng nhập...' : '✓ Đăng nhập'}
        </button>
      </form>
    </div>
  );
};

export default Login;