import { useEffect, useState } from 'react';
import userApi from '../api/userApi';

interface User{
    name: string,
    email: string
}

const Navbar = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await userApi.getProfile();
        setCurrentUser(res.data);
      } catch (err) {
        console.error("Không lấy được thông tin tài khoản");
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <nav className="bg-white shadow-sm border-b px-6 py-3 flex justify-between items-center">
      <div className="text-xl font-bold text-blue-600">DevManager</div>
      
      <div className="flex items-center gap-4">
        {currentUser ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold uppercase">
              {currentUser.name?.charAt(0)}
            </div>
            <div className="text-sm">
              <p className="font-semibold text-gray-800 leading-none">{currentUser.name}</p>
              <p className="text-xs text-gray-500">{currentUser.email}</p>
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-400">Đang tải...</span>
        )}
        
        <button 
          onClick={handleLogout}
          className="text-sm text-red-500 hover:text-red-700 font-medium ml-4 border-l pl-4"
        >
          Thoát
        </button>
      </div>
    </nav>
  );
};

export default Navbar;