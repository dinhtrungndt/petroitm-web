import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  CreditCard,
  Filter,
  Info,
  Loader2,
  Printer,
  Search,
  Settings,
  FileText
} from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../../services/api';
import QRCode from 'react-qr-code';

// Component hiển thị QR Code siêu tốc trên trình duyệt (không gọi API ngoài)
const QRCodeDisplay = ({ value, size = 150 }) => {
  if (!value) return null;
  return (
    <div style={{ background: 'white', padding: '8px', borderRadius: '12px' }}>
      <QRCode value={value} size={size} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
    </div>
  );
};

// ==========================================
// CẤU HÌNH NGÂN HÀNG
// ==========================================
const VCB_CONFIG = {
  id: 'Vietcombank',
  account: '0006970436'
};

const PetroSales = () => {
  const [sales, setSales] = useState([]);
  const [pumps, setPumps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [qrValue, setQrValue] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('WAITING');

  // Các State xử lý form thanh toán
  const [showCashConfirm, setShowCashConfirm] = useState(false);
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // State quản lý Phân trang (Pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Batch Issue Invoices
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  const handleSelectAll = (e) => {
    const currentPaginated = sales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    if (e.target.checked) {
      setSelectedInvoices(currentPaginated.map(s => s.DocTru_id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectOne = (e, docTruId) => {
    if (e.target.checked) {
      setSelectedInvoices([...selectedInvoices, docTruId]);
    } else {
      setSelectedInvoices(selectedInvoices.filter(id => id !== docTruId));
    }
  };

  const handleBatchIssueInvoices = async () => {
    if (selectedInvoices.length === 0) {
      alert("Vui lòng chọn ít nhất một hóa đơn cần xuất.");
      return;
    }
    const confirmIssue = window.confirm(`Bạn có chắc chắn muốn phát hành ${selectedInvoices.length} hóa đơn đã chọn?`);
    if (!confirmIssue) return;

    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    // Tạm thời comment code xuất hóa đơn lên cổng VNPT
    /*
    for (const docTruId of selectedInvoices) {
      try {
        const res = await api.post(`/petro/xuat-hoa-don-tu-doctru/${docTruId}`);
        if (res.data && res.data.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }
    */
    
    // Giả lập thành công để không gọi API
    successCount = selectedInvoices.length;
    alert("Đã tạm khóa chức năng xuất hóa đơn lên cổng. Chọn: " + successCount);

    setIsProcessing(false);
    setSelectedInvoices([]);
    alert(`Đã xử lý xong!\nThành công: ${successCount}\nThất bại: ${failCount}`);
    handleSearch();
  };

  // State quản lý AutoInvoice Config
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [config, setConfig] = useState({
    AutoInvoice_Enable: 0,
    AutoInvoice_Threshold: 200000,
    AutoInvoice_DelayMins: 60,
    AutoInvoice_EndOfDay: 21
  });

  // State quản lý danh mục hình thức thanh toán (Combo Box)
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  const [filters, setFilters] = useState({
    tu_ngay: new Date().toISOString().split('T')[0],
    den_ngay: new Date().toISOString().split('T')[0],
    tru_id: '',
    trang_thai_hd: 'CHUA_XUAT'
  });

  // Tải danh sách Trụ bơm và Danh mục thanh toán khi khởi tạo trang
  useEffect(() => {
    fetchPumps();
    fetchPaymentMethods();
    fetchConfig();
    handleSearch({
      tu_ngay: new Date().toISOString().split('T')[0],
      den_ngay: new Date().toISOString().split('T')[0],
      tru_id: '',
      trang_thai_hd: 'CHUA_XUAT'
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get(`/system/auto-invoice-config?t=${new Date().getTime()}`);
      if (res.data) {
        setConfig(res.data);
      }
    } catch (error) { console.error("Lỗi lấy cấu hình:", error); }
  };

  const saveConfig = async () => {
    try {
      const res = await api.post('/system/auto-invoice-config', config);
      if (res.data && res.data.success === false) {
        alert("Lỗi từ máy chủ: " + res.data.error);
        return;
      }
      alert("Lưu cấu hình thành công!");
      setShowConfigModal(false);
    } catch (error) { alert("Lỗi khi lưu cấu hình!"); }
  };

  // Lấy danh mục hình thức chuyển khoản từ API
  const fetchPaymentMethods = async () => {
    try {
      const res = await api.get('/petro/danh-muc-thanh-toan');
      const data = res.data?.data || [];
      setPaymentMethods(data);
      if (data.length > 0) {
        setSelectedPaymentMethod(data[0].Code_id);
      }
    } catch (error) {
      console.error("Lỗi lấy danh mục thanh toán:", error);
    }
  };

  // Reset hình thức thanh toán mặc định mỗi khi mở một hóa đơn mới
  useEffect(() => {
    if (selectedSale && paymentMethods.length > 0) {
      setSelectedPaymentMethod(paymentMethods[0].Code_id);
    }
  }, [selectedSale, paymentMethods]);

  // TỰ ĐỘNG TẠO QR KHI MỞ MODAL HÓA ĐƠN
  useEffect(() => {
    if (selectedSale) {
      const fetchQR = async () => {
        setQrValue('');
        try {
          const res = await api.get('/petro/qr-content', {
            params: {
              bank: VCB_CONFIG.id,
              account: VCB_CONFIG.account,
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

  // SOCKET LẮNG NGHE THANH TOÁN
  useEffect(() => {
    let socket = null;
    if (selectedSale && paymentStatus === 'WAITING') {
      const host = window.location.hostname;
      const wsUrl = `ws://${host}:4111/api/v1/petro/ws/payment/${selectedSale.DocTru_id}`;
      socket = new WebSocket(wsUrl);
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.status === 'PAID') {
          setPaymentStatus('SUCCESS');
          setTimeout(() => { closeModal(); handleSearch(); }, 1500);
        }
      };
    }
    return () => { if (socket) socket.close(); };
  }, [selectedSale, paymentStatus]);

  const closeModal = () => {
    setSelectedSale(null);
    setPaymentStatus('WAITING');
    setShowCashConfirm(false);
    setShowTransferConfirm(false);
    setIsProcessing(false);
  };

  const handlePayCash = async () => {
    setIsProcessing(true);
    try {
      const res = await api.post(`/petro/pay-cash/${selectedSale.DocTru_id}`);
      if (res.data && res.data.success === false) {
        alert("Lỗi: " + res.data.message);
      } else {
        setPaymentStatus('SUCCESS');
        setTimeout(() => { closeModal(); handleSearch(); }, 1500);
      }
    } catch (error) {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayTransfer = async () => {
    setIsProcessing(true);
    try {
      const res = await api.post(`/petro/pay-transfer/${selectedSale.DocTru_id}`, {
        hinh_thuc_thanh_toan: selectedPaymentMethod
      });
      if (res.data && res.data.success === false) {
        alert("Lỗi: " + res.data.message);
      } else {
        setPaymentStatus('SUCCESS');
        setTimeout(() => { closeModal(); handleSearch(); }, 1500);
      }
    } catch (error) {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIssueInvoice = async (docTruId) => {
    setIsProcessing(true);
    try {
      // Tạm thời comment code xuất hóa đơn lên cổng VNPT
      /*
      const res = await api.post(`/petro/xuat-hoa-don-tu-doctru/${docTruId}`);
      if (res.data.success) {
        alert("Phát hành hóa đơn thành công!");
      } else {
        alert("Lỗi: " + res.data.error);
      }
      */
      alert("Tính năng phát hành hóa đơn lên cổng đang tạm khóa để bảo trì!");
    } catch (error) {
      alert("Lỗi kết nối tới server");
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchPumps = async () => {
    try {
      const res = await api.get('/petro/pumps');
      setPumps(res.data);
    } catch (err) { }
  };

  const handleSearch = async (overrideFilters = null) => {
    setLoading(true);
    try {
      const queryParams = { ...(overrideFilters || filters) };
      const trangThai = queryParams.trang_thai_hd;
      delete queryParams.trang_thai_hd;

      if (queryParams.tru_id === '') delete queryParams.tru_id;
      const res = await api.get('/petro/sales', { params: queryParams });
      
      let data = res.data || [];
      if (trangThai === 'DA_XUAT') {
         data = data.filter(s => s.SoHoaDon);
      } else if (trangThai === 'CHUA_XUAT') {
         data = data.filter(s => !s.SoHoaDon);
      }

      setSales(data);
      setCurrentPage(1); // Trở về trang 1 sau khi tìm kiếm
    } catch (err) { } finally { setLoading(false); }
  };

  const totalPages = Math.ceil(sales.length / itemsPerPage);
  const paginatedSales = sales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-4 bg-slate-50 min-h-screen space-y-6 font-sans">
      {/* BỘ LỌC TÌM KIẾM */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-slate-800">
            <Filter size={20} className="text-blue-600" />
            <h2 className="font-bold text-lg text-slate-700">Tra cứu lượt bơm</h2>
          </div>
          <button onClick={() => setShowConfigModal(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold transition-all text-sm">
            <Settings size={16} /> Cài đặt Hóa đơn
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6 items-end">
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
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Trạng thái HĐ</label>
            <select value={filters.trang_thai_hd} onChange={e => setFilters({ ...filters, trang_thai_hd: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 appearance-none">
              <option value="ALL">-- Tất cả --</option>
              <option value="CHUA_XUAT">Chưa phát hành</option>
              <option value="DA_XUAT">Đã phát hành</option>
            </select>
          </div>
          <button onClick={() => handleSearch()} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
            <span>TÌM KIẾM</span>
          </button>
        </div>
      </section>

      {/* DANH SÁCH LƯỢT BƠM */}
      <section className="bg-transparent md:bg-white md:rounded-3xl shadow-none md:shadow-sm border-transparent md:border md:border-slate-200 overflow-hidden">
        {/* THANH CÔNG CỤ XUẤT HÀNG LOẠT */}
        {/* Tạm khóa xuất hàng loạt
        {selectedInvoices.length > 0 && (
          <div className="bg-blue-50 border-b border-blue-100 p-3 flex justify-between items-center">
            <span className="text-sm font-bold text-blue-700">Đã chọn {selectedInvoices.length} hóa đơn</span>
            <button onClick={handleBatchIssueInvoices} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm text-xs transition-all disabled:opacity-50 flex items-center gap-2">
              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              Xuất Hóa Đơn Hàng Loạt
            </button>
          </div>
        )}
        */}

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-black uppercase">
              <tr>
                <th className="p-4 w-12 text-center">
                  <input type="checkbox" onChange={handleSelectAll} checked={paginatedSales.length > 0 && selectedInvoices.length === paginatedSales.length} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                </th>
                <th className="p-4">Mã phiếu</th>
                <th className="p-4">Trụ</th>
                <th className="p-4">Thời gian</th>
                <th className="p-4 text-right">Số lượng (L)</th>
                <th className="p-4 text-right">Thành tiền (đ)</th>
                <th className="p-4 text-center">Trạng thái TT</th>
                <th className="p-4 text-center">Hóa đơn</th>
                <th className="p-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedSales.length > 0 ? paginatedSales.map((s) => (
                <tr key={s.DocTru_id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="p-4 text-center">
                    <input type="checkbox" checked={selectedInvoices.includes(s.DocTru_id)} onChange={(e) => handleSelectOne(e, s.DocTru_id)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  </td>
                  <td className="p-4 font-bold text-blue-600">{s.MaBienLai}</td>
                  <td className="p-4 font-medium text-slate-700">{s.MaTru}</td>
                  <td className="p-4 text-slate-500 text-xs">{new Date(s.ThoiGianLu).toLocaleString('vi-VN')}</td>
                  <td className="p-4 text-right font-mono font-bold text-slate-700">{s.SoLuong?.toLocaleString()}</td>
                  <td className="p-4 text-right font-black text-slate-900">{s.ThanhTien?.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    {s.LoaiThanhToan === 'TM' || s.HinhThucThanhToan === 1 ? <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-[10px] font-bold">TIỀN MẶT</span> :
                      s.LoaiThanhToan === 'CK' || (s.HinhThucThanhToan && s.HinhThucThanhToan !== 1) ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-bold">ĐÃ CK</span> :
                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-[10px] font-bold">CHƯA TT</span>}
                  </td>
                  <td className="p-4 text-center">
                    {s.SoHoaDon ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-bold">ĐÃ XUẤT</span>
                        <span className="text-[9px] text-slate-400 font-mono tracking-wider">{s.SoHoaDon}</span>
                      </div>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-md text-[10px] font-bold">CHƯA XUẤT</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setSelectedSale(s)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg border border-transparent hover:border-blue-100 transition-all" title="Thanh toán / In">
                        <Printer size={18} />
                      </button>
                      {/* Tạm khóa phát hành HĐ
                      <button onClick={() => handleIssueInvoice(s.DocTru_id)} className="p-2 text-slate-400 hover:text-green-600 hover:bg-slate-50 rounded-lg border border-transparent hover:border-green-100 transition-all" title="Phát hành Hóa đơn điện tử">
                        <FileText size={18} />
                      </button>
                      */}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7" className="p-10 text-center text-slate-400 italic font-medium bg-white">Không có dữ liệu.</td></tr>
              )}
            </tbody>
          </table>
          
          {/* PHÂN TRANG (PAGINATION) CHO DESKTOP */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-white border-t border-slate-200">
              <span className="text-xs text-slate-500 font-medium">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sales.length)} trên tổng {sales.length} hóa đơn
              </span>
              <div className="flex gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-200 disabled:opacity-50 border border-slate-200 transition-colors">Đầu</button>
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-200 disabled:opacity-50 border border-slate-200 transition-colors">Trước</button>
                <span className="px-4 py-1.5 text-xs font-black bg-blue-50 text-blue-700 rounded-lg border border-blue-200 shadow-sm">{currentPage} / {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-200 disabled:opacity-50 border border-slate-200 transition-colors">Sau</button>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-200 disabled:opacity-50 border border-slate-200 transition-colors">Cuối</button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile View */}
        <div className="md:hidden flex flex-col gap-4">
          {paginatedSales.length > 0 ? paginatedSales.map((s) => (
            <div key={s.DocTru_id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3 relative">
              <div className="absolute top-4 right-4 z-10">
                 <input type="checkbox" checked={selectedInvoices.includes(s.DocTru_id)} onChange={(e) => handleSelectOne(e, s.DocTru_id)} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
              </div>
              <div className="flex justify-between items-center pr-8">
                <span className="font-bold text-blue-600 text-sm">#{s.MaBienLai}</span>
                <div className="flex gap-2">
                  {s.SoHoaDon ? (
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-bold">HĐ: {s.SoHoaDon}</span>
                  ) : (
                    <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-md text-[10px] font-bold">CHƯA XUẤT</span>
                  )}
                  {s.LoaiThanhToan === 'TM' || s.HinhThucThanhToan === 1 ? <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-[10px] font-bold">TIỀN MẶT</span> :
                    s.LoaiThanhToan === 'CK' || (s.HinhThucThanhToan && s.HinhThucThanhToan !== 1) ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-bold">ĐÃ CK</span> :
                      <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-[10px] font-bold">CHƯA TT</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Trụ bơm</span>
                  <span className="font-bold text-slate-700">{s.MaTru}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Thời gian</span>
                  <span className="text-slate-600 text-[11px] font-medium">{new Date(s.ThoiGianLu).toLocaleString('vi-VN')}</span>
                </div>
                <div className="flex flex-col mt-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Số lượng (L)</span>
                  <span className="font-mono font-bold text-slate-700 text-base">{s.SoLuong?.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-end mt-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Thành tiền (đ)</span>
                  <span className="font-black text-slate-900 text-base text-blue-700">{s.ThanhTien?.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-2 pt-3 border-t border-slate-100 flex justify-end gap-2">
                {/* Tạm khóa phát hành HĐ
                <button onClick={() => handleIssueInvoice(s.DocTru_id)} className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-[11px] transition-colors border border-slate-200">
                  <FileText size={14} className="text-green-600" /> Xuất HĐ
                </button>
                */}
                <button onClick={() => setSelectedSale(s)} className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-[11px] transition-colors border border-slate-200">
                  <Printer size={14} className="text-blue-600" /> TT / In
                </button>
              </div>
            </div>
          )) : (
            <div className="p-10 text-center text-slate-400 italic font-medium bg-white rounded-2xl border border-slate-200 shadow-sm">Không có dữ liệu.</div>
          )}
          
          {/* PHÂN TRANG (PAGINATION) CHO MOBILE */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-center gap-3 p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sales.length)} / {sales.length}
              </span>
              <div className="flex gap-1 w-full">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="flex-1 py-2 text-[10px] font-bold rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-200 disabled:opacity-50 border border-slate-200">Đầu</button>
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="flex-1 py-2 text-[10px] font-bold rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-200 disabled:opacity-50 border border-slate-200">Trước</button>
                <span className="flex-1 py-2 text-[11px] font-black bg-blue-50 text-blue-700 rounded-lg border border-blue-200 shadow-sm flex items-center justify-center">{currentPage}/{totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="flex-1 py-2 text-[10px] font-bold rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-200 disabled:opacity-50 border border-slate-200">Sau</button>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="flex-1 py-2 text-[10px] font-bold rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-200 disabled:opacity-50 border border-slate-200">Cuối</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* MODAL THANH TOÁN */}
      {selectedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white relative max-h-[95vh] flex flex-col">

            <div className="p-4 md:p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Info size={18} className="text-blue-400" />
                <span className="font-bold uppercase tracking-tight text-sm text-white">Thanh toán hóa đơn</span>
              </div>
              <button onClick={closeModal} className="p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white text-xl leading-none">✕</button>
            </div>

            <div className="p-4 md:p-6 space-y-6 overflow-y-auto w-full scrollbar-hide">
              {paymentStatus === 'WAITING' && (
                <>
                  <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-start pt-2">

                    {/* KHU VỰC QR CODE VÀ CHỌN LOẠI CHUYỂN KHOẢN */}
                    <div className="bg-slate-50 p-4 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center shrink-0 w-full max-w-[220px] md:w-auto mx-auto font-bold">
                      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                        {qrValue ? <QRCodeDisplay value={qrValue} size={150} /> : <div className="w-[150px] h-[150px] bg-slate-100 flex items-center justify-center rounded-xl"><Loader2 className="animate-spin text-slate-300" /></div>}
                      </div>
                      <p className="mt-3 text-[10px] font-black text-blue-600 tracking-wider uppercase">Quét QR Vietcombank</p>

                      {/* COMBO BOX HÌNH THỨC THANH TOÁN TÍCH HỢP */}
                      <div className="w-full mt-3">
                        <select
                          className="w-full text-[11px] font-bold text-slate-700 border border-slate-200 rounded-lg p-2.5 bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm transition-all"
                          value={selectedPaymentMethod || ''}
                          onChange={(e) => setSelectedPaymentMethod(parseInt(e.target.value))}
                        >
                          {paymentMethods.map(method => (
                            <option key={method.Code_id} value={method.Code_id}>
                              {method.Name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* THÔNG TIN CHI TIẾT HÓA ĐƠN */}
                    <div className="flex-1 space-y-4 w-full">
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-bold mb-1">Cần thu</p>
                        <p className="text-3xl font-black text-blue-600 tracking-tight">{selectedSale.ThanhTien?.toLocaleString()} đ</p>
                        <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Mã phiếu: {selectedSale.MaBienLai}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-y-3 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div><p className="text-slate-400">Trụ</p><p className="font-bold text-slate-800">{selectedSale.MaTru}</p></div>
                        <div><p className="text-slate-400">Sản phẩm</p><p className="font-bold text-slate-800 text-blue-700">{selectedSale.TenSanPham}</p></div>
                        <div><p className="text-slate-400">Số lượng</p><p className="font-bold text-slate-800">{selectedSale.SoLuong} Lít</p></div>
                        <div><p className="text-slate-400">Đơn giá</p><p className="font-bold text-slate-800">{selectedSale.DonGia?.toLocaleString()}</p></div>
                      </div>
                    </div>
                  </div>

                  {/* BỘ NÚT XÁC NHẬN THỦ CÔNG */}
                  <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
                    {/* BỘ NÚT TIỀN MẶT */}
                    {!showCashConfirm ? (
                      <button onClick={() => { setShowCashConfirm(true); setShowTransferConfirm(false); }} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl transition-all text-xs uppercase">
                        <Banknote size={16} /> Đã thu tiền mặt
                      </button>
                    ) : (
                      <div className="w-full bg-amber-50 p-3 rounded-2xl border border-amber-200 flex items-center justify-between animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 text-amber-700">
                          <AlertTriangle size={16} /> <span className="text-[10px] font-bold uppercase">Xác nhận thu tiền mặt?</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handlePayCash} disabled={isProcessing} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold hover:bg-amber-700 transition-colors">CÓ</button>
                          <button onClick={() => setShowCashConfirm(false)} className="bg-white text-slate-600 px-4 py-2 rounded-lg text-[10px] font-bold border border-slate-200 hover:bg-slate-50 transition-colors">HỦY</button>
                        </div>
                      </div>
                    )}

                    {/* BỘ NÚT CHUYỂN KHOẢN */}
                    {!showTransferConfirm ? (
                      <button onClick={() => { setShowTransferConfirm(true); setShowCashConfirm(false); }} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-blue-200 text-xs uppercase">
                        <CreditCard size={16} /> Đã nhận chuyển khoản
                      </button>
                    ) : (
                      <div className="w-full bg-blue-50 p-3 rounded-2xl border border-blue-200 flex items-center justify-between animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 text-blue-700">
                          <Info size={16} /> <span className="text-[10px] font-bold uppercase">Xác nhận chuyển khoản?</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handlePayTransfer} disabled={isProcessing} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-colors">CÓ</button>
                          <button onClick={() => setShowTransferConfirm(false)} className="bg-white text-slate-600 px-4 py-2 rounded-lg text-[10px] font-bold border border-slate-200 hover:bg-slate-50 transition-colors">HỦY</button>
                        </div>
                      </div>
                    )}
                    
                    {/* BỘ NÚT XUẤT HÓA ĐƠN THỦ CÔNG TRONG MODAL */}
                    {/* Tạm khóa phát hành HĐ
                    <button onClick={() => handleIssueInvoice(selectedSale.DocTru_id)} disabled={isProcessing} className="w-full flex items-center justify-center gap-2 py-3 bg-green-50 hover:bg-green-100 text-green-700 font-black rounded-2xl transition-all text-xs uppercase border border-green-200 mt-2">
                      <FileText size={16} /> Phát hành Hóa đơn điện tử
                    </button>
                    */}
                  </div>
                </>
              )}

              {paymentStatus === 'SUCCESS' && (
                <div className="py-10 flex flex-col items-center justify-center text-center animate-in zoom-in-50 duration-300">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={50} className="text-green-500" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Cập nhật thành công!</h2>
                  <p className="text-slate-500 font-medium mt-2 italic text-sm">Hóa đơn đã được ghi nhận vào hệ thống.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* MODAL CONFIG TỰ ĐỘNG XUẤT HÓA ĐƠN */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-blue-400" />
                <span className="font-bold uppercase tracking-tight text-sm text-white">Cài đặt Hóa đơn Tự động</span>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="p-1 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">✕</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-sm font-bold text-slate-700">Bật Tự động xuất:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={config?.AutoInvoice_Enable === 1} onChange={e => setConfig({...config, AutoInvoice_Enable: e.target.checked ? 1 : 0})} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Giới hạn số tiền (VNĐ):</label>
                <input type="number" value={config?.AutoInvoice_Threshold || 0} onChange={e => setConfig({...config, AutoInvoice_Threshold: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" />
                <p className="text-[10px] text-slate-400 italic">Phiếu dưới số tiền này sẽ tự xuất.</p>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Độ trễ chờ xuất (Phút):</label>
                <input type="number" value={config?.AutoInvoice_DelayMins || 0} onChange={e => setConfig({...config, AutoInvoice_DelayMins: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Giờ chốt cuối ngày (0-23):</label>
                <input type="number" min="0" max="23" value={config?.AutoInvoice_EndOfDay || 0} onChange={e => setConfig({...config, AutoInvoice_EndOfDay: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" />
                <p className="text-[10px] text-slate-400 italic">Đến giờ này sẽ xuất TẤT CẢ hóa đơn còn lại.</p>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={saveConfig} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 text-sm">LƯU CÀI ĐẶT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetroSales;
