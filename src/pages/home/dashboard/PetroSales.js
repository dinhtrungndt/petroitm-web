import { AlertTriangle, Banknote, CheckCircle2, Filter, Info, Loader2, Printer, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import api from '../../../services/api';

const RECEIVER_INFO = {
  bankId: 'TPBank',
  accountNo: '08895415077',
  accountName: 'NGUYEN DINH TRUNG'
};

const PetroSales = () => {
  const [sales, setSales] = useState([]);
  const [pumps, setPumps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [qrValue, setQrValue] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('WAITING');

  // State xác nhận thanh toán tiền mặt
  const [showCashConfirm, setShowCashConfirm] = useState(false);
  const [isProcessingCash, setIsProcessingCash] = useState(false);

  const [filters, setFilters] = useState({
    tu_ngay: new Date().toISOString().split('T')[0],
    den_ngay: new Date().toISOString().split('T')[0],
    tru_id: ''
  });

  useEffect(() => { fetchPumps(); }, []);

  // Lấy QR Code
  useEffect(() => {
    if (selectedSale) {
      const fetchQR = async () => {
        setQrValue('');
        try {
          const res = await api.get('/petro/qr-content', {
            params: {
              bank: RECEIVER_INFO.bankId,
              account: RECEIVER_INFO.accountNo,
              amount: selectedSale.ThanhTien.toString(),
              content: selectedSale.MaBienLai
            }
          });
          setQrValue(res.data.qr_content);
        } catch (err) { setQrValue(""); }
      };
      fetchQR();
    }
  }, [selectedSale]);

  // Kết nối Socket
  useEffect(() => {
    let socket = null;
    if (selectedSale && paymentStatus === 'WAITING') {
      const baseURL = api.defaults.baseURL || 'http://127.0.0.1:8000/api/v1';
      const wsUrl = baseURL.replace('http', 'ws').replace('https', 'wss') + `/petro/ws/payment/${selectedSale.DocTru_id}`;
      socket = new WebSocket(wsUrl);
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.status === 'PAID') {
          setPaymentStatus('SUCCESS');
          setTimeout(() => { closeModal(); handleSearch(); }, 2000);
        }
      };
    }
    return () => { if (socket) socket.close(); };
  }, [selectedSale, paymentStatus]);

  const closeModal = () => {
    setSelectedSale(null);
    setPaymentStatus('WAITING');
    setShowCashConfirm(false);
    setIsProcessingCash(false);
  };

  const handlePayCash = async () => {
    setIsProcessingCash(true);
    try {
      await api.post(`/petro/pay-cash/${selectedSale.DocTru_id}`);
      // Socket Backend sẽ tự động bắn tin nhắn PAID để UI cập nhật
    } catch (error) {
      console.error("Lỗi thanh toán tiền mặt");
      setIsProcessingCash(false);
    }
  };

  const fetchPumps = async () => {
    try {
      const res = await api.get('/petro/pumps');
      setPumps(res.data);
    } catch (err) { }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const queryParams = { ...filters };
      if (queryParams.tru_id === '') delete queryParams.tru_id;
      const res = await api.get('/petro/sales', { params: queryParams });
      setSales(res.data);
    } catch (err) { } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* --- BỘ LỌC TÌM KIẾM --- */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-6 text-slate-800">
          <Filter size={20} className="text-blue-600" />
          <h2 className="font-bold text-lg">Tra cứu lượt bơm</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Từ ngày</label>
            <input type="date" value={filters.tu_ngay} onChange={e => setFilters({ ...filters, tu_ngay: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Đến ngày</label>
            <input type="date" value={filters.den_ngay} onChange={e => setFilters({ ...filters, den_ngay: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Chọn Trụ bơm</label>
            <select value={filters.tru_id} onChange={e => setFilters({ ...filters, tru_id: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 appearance-none">
              <option value="">-- Tất cả các trụ --</option>
              {pumps.map(p => <option key={p.Tru_id} value={p.Tru_id}>{p.MaTru}</option>)}
            </select>
          </div>
          <button onClick={handleSearch} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all">
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
            <span>TÌM KIẾM</span>
          </button>
        </div>
      </section>

      {/* --- DANH SÁCH KẾT QUẢ --- */}
      <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Mã phiếu</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Trụ</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Thời gian</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-right">Số lượng (L)</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-right">Thành tiền (đ)</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-center">Trạng thái</th>
                <th className="p-4 text-center text-[10px] font-black text-slate-400 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.length > 0 ? sales.map((s) => (
                <tr key={s.DocTru_id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="p-4 font-bold text-blue-600">{s.MaBienLai}</td>
                  <td className="p-4 font-medium text-slate-700">{s.MaTru}</td>
                  <td className="p-4 text-slate-500 text-xs">{new Date(s.ThoiGianLu).toLocaleString('vi-VN')}</td>
                  <td className="p-4 text-right font-mono font-bold text-slate-700">{s.SoLuong?.toLocaleString()}</td>
                  <td className="p-4 text-right font-black text-slate-900">{s.ThanhTien?.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    {s.HinhThucThanhToan === 1 ? <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-[10px] font-bold">TIỀN MẶT</span> :
                      s.HinhThucThanhToan === 2 ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-bold">ĐÃ CK</span> :
                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-[10px] font-bold">CHƯA TT</span>}
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => setSelectedSale(s)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-blue-100 transition-all">
                      <Printer size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="8" className="p-10 text-center text-slate-400 italic font-medium">Không có dữ liệu.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- MODAL THANH TOÁN --- */}
      {selectedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white relative">

            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Info size={18} className="text-blue-400" />
                <span className="font-bold uppercase tracking-tight text-sm">Thanh toán hóa đơn</span>
              </div>
              <button onClick={closeModal} className="p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white text-xl">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {paymentStatus === 'WAITING' && (
                <>
                  <div className="flex gap-6 items-center">
                    {/* QR CODE */}
                    <div className="bg-slate-50 p-4 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center shrink-0">
                      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                        {qrValue ? <QRCode value={qrValue} size={150} /> : <div className="w-[150px] h-[150px] bg-slate-100 flex items-center justify-center rounded-xl"><Loader2 className="animate-spin text-slate-300" /></div>}
                      </div>
                      <p className="mt-3 text-[10px] font-black text-blue-600 tracking-wider">CHUYỂN KHOẢN (QR)</p>
                    </div>

                    {/* INFO */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-bold mb-1">Cần thanh toán</p>
                        <p className="text-3xl font-black text-blue-600 tracking-tight">{selectedSale.ThanhTien?.toLocaleString()} đ</p>
                        <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Mã: {selectedSale.MaBienLai}</p>
                      </div>
                      <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-[10px]">
                        <p className="text-blue-600 font-bold">{RECEIVER_INFO.bankId} - {RECEIVER_INFO.accountNo}</p>
                        <p className="font-black text-slate-800">{RECEIVER_INFO.accountName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2 border-t border-slate-100">
                    {/* NÚT TIỀN MẶT VỚI XÁC NHẬN TẠI CHỖ */}
                    {!showCashConfirm ? (
                      <button
                        onClick={() => setShowCashConfirm(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl transition-all text-xs uppercase"
                      >
                        <Banknote size={16} /> Tiền mặt
                      </button>
                    ) : (
                      <div className="flex-1 bg-amber-50 p-3 rounded-2xl border border-amber-200 flex items-center justify-between animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 text-amber-700">
                          <AlertTriangle size={16} />
                          <span className="text-[10px] font-bold uppercase">Xác nhận tiền mặt?</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handlePayCash} disabled={isProcessingCash} className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-amber-700">CÓ</button>
                          <button onClick={() => setShowCashConfirm(false)} className="bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-slate-300">HỦY</button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* SUCCESS STATE */}
              {paymentStatus === 'SUCCESS' && (
                <div className="py-10 flex flex-col items-center justify-center text-center animate-in zoom-in-50 duration-300">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={50} className="text-green-500" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800">Giao dịch thành công!</h2>
                  <p className="text-slate-500 font-medium mt-2">Cửa sổ sẽ tự đóng sau giây lát...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetroSales;
