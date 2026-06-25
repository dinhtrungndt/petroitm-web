import { DownloadCloud, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../../services/api';

const AutoUpdater = () => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusText, setStatusText] = useState('CẬP NHẬT NGAY');

  useEffect(() => {
    checkUpdate();
  }, []);

  const checkUpdate = async () => {
    try {
      const res = await api.get('/update/check');
      if (res.data && res.data.update_available) {
        setUpdateInfo(res.data);
      }
    } catch (error) {
      console.log("Lỗi check update:", error);
    }
  };

  const handleDoUpdate = async () => {
    if (!window.confirm(`Xác nhận cập nhật lên phiên bản ${updateInfo.latest_version}?`)) return;

    setIsUpdating(true);
    setStatusText('Đang tải file xuống (Khoảng 15s)...');

    try {
      await api.post('/update/do-update');
      setStatusText('Đang cài đặt và khởi động lại...');

      let isServerDown = false;

      const checkInterval = setInterval(async () => {
        try {
          await api.get('/update/check', { timeout: 2000 });

          if (isServerDown) {
            clearInterval(checkInterval);
            setStatusText('Hoàn tất! Đang tải lại trang...');
            window.location.reload();
          }
        } catch (err) {
          isServerDown = true;
        }
      }, 3000);

    } catch (error) {
      alert("Có lỗi khi gọi API cập nhật! Vui lòng thử lại sau.");
      setIsUpdating(false);
      setStatusText('CẬP NHẬT NGAY');
    }
  };

  if (!updateInfo) return null;

  if (isDismissed) {
    return (
      <button
        onClick={() => setIsDismissed(false)}
        className="fixed bottom-4 right-4 z-[9999] bg-blue-600 hover:bg-blue-700 text-white p-3 pb-1 pt-2 rounded-full shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 group animate-in slide-in-from-bottom-5"
      >
        <DownloadCloud size={20} className="animate-bounce" />
        <span className="text-xs font-bold max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">Có bản cập nhật!</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-white p-4 rounded-2xl shadow-2xl border border-blue-200 flex flex-col gap-3 max-w-sm animate-in slide-in-from-bottom-5">
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-3 mt-1">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-full shrink-0 animate-bounce">
          <DownloadCloud size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Có bản cập nhật mới!</h3>
          <p className="text-xs text-slate-500 mt-1">Phiên bản hiện tại: {updateInfo.current_version}</p>
          <p className="text-xs font-bold text-blue-600">Phiên bản mới: {updateInfo.latest_version}</p>
          {updateInfo.release_notes && (
            <p className="text-[10px] text-slate-400 mt-2 p-2 bg-slate-50 rounded italic border border-slate-100">
              "{updateInfo.release_notes}"
            </p>
          )}
        </div>
      </div>

      <button
        onClick={handleDoUpdate}
        disabled={isUpdating}
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-200"
      >
        {isUpdating && <Loader2 size={16} className="animate-spin" />}
        {statusText}
      </button>
    </div>
  );
};

export default AutoUpdater;
