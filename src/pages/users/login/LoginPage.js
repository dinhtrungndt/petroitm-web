import { Eye, EyeOff, Loader2, Lock, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { Images } from '../../../constants/images/Images';
import { loginAction } from '../../../stores/redux/auth/authActions';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginAction(username, password));
    if (result.success) {
      toast.success('Đăng nhập thành công!');
      window.location.href = '/dashboard';
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-500 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden transition-all transform hover:scale-[1.01]">
        <div className="p-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-2xl mb-4 shadow-inner">
              <img src={Images.logoLogin} alt="Logo" className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">PETRO ITM</h1>
            <p className="text-gray-500 mt-2 font-medium">Hệ thống quản lý nội bộ 2.0</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                placeholder="Mã nhân viên / SĐT"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                className="block w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-gray-600 cursor-pointer">
                <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 mr-2" />
                Ghi nhớ đăng nhập
              </label>
              <button type="button" className="text-blue-600 hover:underline font-semibold">Quên mật khẩu?</button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:transform active:scale-95 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Đang xác thực...
                </>
              ) : (
                'Đăng Nhập Hệ Thống'
              )}
            </button>
          </form>
        </div>

        <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500 font-medium">
            Bạn chưa có tài khoản? <span className="text-blue-600 cursor-pointer hover:underline">Liên hệ quản trị viên</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
