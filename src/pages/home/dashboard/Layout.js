import {
  Calendar, ChevronLeft, Fuel, LayoutDashboard, LogOut, Menu, User
} from 'lucide-react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutAction } from '../../../stores/redux/auth/authActions';

const Layout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const { user, menus } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutAction());
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* 1. SIDEBAR */}
      <aside className={`bg-slate-900 text-slate-300 transition-all duration-300 flex flex-col shadow-2xl z-20 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950">
          {!isSidebarCollapsed && <span className="font-black text-blue-500 tracking-tighter text-xl">PETRO ITM</span>}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-white"
          >
            {isSidebarCollapsed ? <Menu size={24} /> : <ChevronLeft size={24} />}
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          <div className="flex items-center gap-4 p-3 rounded-xl bg-blue-600 text-white cursor-pointer shadow-lg shadow-blue-900/20">
            <LayoutDashboard size={24} />
            {!isSidebarCollapsed && <span className="font-bold">Bảng điều khiển</span>}
          </div>

          {/* Menu động từ Database */}
          {menus?.map((m) => (
            <div key={m.Module_id || m.DanhMuc_id} className="flex items-center gap-4 p-3 hover:bg-slate-800 rounded-xl cursor-pointer text-slate-400 hover:text-white transition group">
              <Fuel size={24} className="group-hover:text-blue-400 transition-colors" />
              {!isSidebarCollapsed && <span className="text-sm font-medium">{m.Module_Name || m.TenDanhMuc}</span>}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 p-3 text-red-400 hover:bg-red-900/30 rounded-xl transition-all font-bold">
            <LogOut size={24} />
            {!isSidebarCollapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* 2. MAIN AREA & HEADER */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center gap-4 text-slate-400">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              <Calendar size={16} className="text-blue-500" />
              <span className="text-xs font-bold text-slate-600 uppercase">{new Date().toLocaleDateString('vi-VN')}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-800 uppercase leading-tight">{user?.User_Name}</p>
              <p className="text-[10px] font-bold text-blue-500 tracking-widest">{user?.User_Code}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-blue-400 text-white rounded-xl flex items-center justify-center shadow-md">
              <User size={20} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
