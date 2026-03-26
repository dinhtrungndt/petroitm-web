import { Banknote, CheckCircle2, Filter, Info, Loader2, Printer, Search } from 'lucide-react';
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

  const [filters, setFilters] = useState({
    tu_ngay: new Date().toISOString().split('T')[0],
    den_ngay: new Date().toISOString().split('T')[0],
    tru_id: ''
  });

  useEffect(() => {
    fetchPumps();
  }, []);

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
        } catch (err) {
          setQrValue("");
        }
      };
      fetchQR();
    }
  }, [selectedSale]);

  useEffect(() => {
    let socket = null;

    if (selectedSale && paymentStatus === 'WAITING') {
      const baseURL = api.defaults.baseURL || process.env.REACT_APP_API_URL;
      const wsUrl = baseURL.replace('http', 'ws').replace('https', 'wss') + `/petro/ws/payment/${selectedSale.DocTru_id}`;

      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.status === 'PAID') {
          setPaymentStatus('SUCCESS');
          setTimeout(() => {
            closeModal();
            handleSearch();
          }, 2000);
        }
      };
    }
    return () => { if (socket) socket.close(); };
  }, [selectedSale, paymentStatus]);

  const closeModal = () => {
    setSelectedSale(null);
    setPaymentStatus('WAITING');
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
    } catch (err) { } finally {
      setLoading(false);
    }
  };

  // Nút giả lập (Dành cho Dev)
  const handleSimulatePayment = async () => {
    try {
      await api.post(`/petro/webhook-mock/${selectedSale.DocTru_id}`);
    } catch (error) { }
  };

  return (
    <div className="space-y-6">
      {/* BỘ LỌC TÌM KIẾM */}
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

      {/* DANH SÁCH KẾT QUẢ */}
      <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Mã phiếu</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Trụ</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Sản phẩm</th>
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
                  <td className="p-4 text-slate-600 text-xs font-semibold">{s.TenSanPham}</td>
                  <td className="p-4 text-slate-500 text-xs">{new Date(s.ThoiGianLu).toLocaleString('vi-VN')}</td>
                  <td className="p-4 text-right font-mono font-bold text-slate-700">{s.SoLuong?.toLocaleString()}</td>
                  <td className="p-4 text-right font-black text-slate-900">{s.ThanhTien?.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    {s.HinhThucThanhToan === 2 ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-bold">ĐÃ CK</span> : <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-[10px] font-bold">CHƯA TT</span>}
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => setSelectedSale(s)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-blue-100 transition-all">
                      <Printer size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="8" className="p-10 text-center text-slate-400 italic font-medium">Không có dữ liệu lượt bán nào được tìm thấy.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL CHI TIẾT PHIẾU & QR */}
      {selectedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white relative">

            <button onClick={handleSimulatePayment} className="absolute top-4 right-16 bg-amber-500 text-white text-[10px] px-3 py-1 rounded-full font-bold animate-pulse hover:bg-amber-600 z-10 shadow-lg">TEST: Giả vờ Khách Đã CK</button>

            <div className="p-6 bg-slate-900 text-white flex justify-between items-center relative z-0">
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
                    {/* CỤC QR CODE */}
                    <div className="bg-slate-50 p-4 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center shrink-0">
                      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                        {qrValue ? <QRCode value={qrValue} size={150} /> : <div className="w-[150px] h-[150px] bg-slate-100 flex items-center justify-center rounded-xl"><Loader2 className="animate-spin text-slate-300" /></div>}
                      </div>
                      <p className="mt-3 text-[10px] font-black text-blue-600 tracking-wider flex items-center gap-1">
                        <Loader2 size={12} className="animate-spin" /> ĐANG CHỜ NHẬN TIỀN...
                      </p>
                    </div>

                    {/* THÔNG TIN */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-bold mb-1">Cần thanh toán</p>
                        <p className="text-3xl font-black text-blue-600 tracking-tight">{selectedSale.ThanhTien?.toLocaleString()} đ</p>
                        <p className="text-[10px] font-bold text-slate-500 mt-1">Nội dung: {selectedSale.MaBienLai}</p>
                      </div>

                      {/* Hiển thị thông tin chủ TK */}
                      <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                        <p className="text-[10px] text-blue-600 font-bold uppercase mb-1">{RECEIVER_INFO.bankId} - {RECEIVER_INFO.accountNo}</p>
                        <p className="text-xs font-black text-slate-800">{RECEIVER_INFO.accountName}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-y-3 text-xs">
                        <div><p className="text-slate-400">Trụ bơm</p><p className="font-bold text-slate-800">{selectedSale.MaTru}</p></div>
                        <div><p className="text-slate-400">Sản phẩm</p><p className="font-bold text-slate-800">{selectedSale.TenSanPham}</p></div>
                        <div><p className="text-slate-400">Số lượng</p><p className="font-bold text-slate-800">{selectedSale.SoLuong} Lít</p></div>
                        <div><p className="text-slate-400">Đơn giá</p><p className="font-bold text-slate-800">{selectedSale.DonGia?.toLocaleString()}</p></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2 border-t border-slate-100">
                    <button className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl transition-all text-xs uppercase">
                      <Banknote size={16} /> Tiền mặt
                    </button>
                  </div>
                </>
              )}

              {paymentStatus === 'SUCCESS' && (
                <div className="py-10 flex flex-col items-center justify-center text-center animate-in zoom-in-50 duration-300">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={50} className="text-green-500" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800">Thanh toán thành công!</h2>
                  <p className="text-slate-500 font-medium mt-2">
                    Đã nhận được <span className="text-green-600 font-bold">{selectedSale.ThanhTien?.toLocaleString()} đ</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-4 animate-pulse">Cửa sổ sẽ tự đóng...</p>
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
