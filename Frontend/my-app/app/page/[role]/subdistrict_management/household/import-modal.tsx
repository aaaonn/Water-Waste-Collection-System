import React, { useState, useRef } from "react";
import { Upload, X, FileSpreadsheet, Download, AlertCircle, CheckCircle2, BookOpen, ChevronDown } from "lucide-react";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data?: any) => void;
}

export default function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setResults(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8080/api/households/import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการนำเข้าข้อมูล");
      }

      setResults(data);
      if (data.success_count > 0 || (data.skipped_count && data.skipped_count > 0)) {
        onSuccess(data);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // URL or generate CSV on fly
    const csvContent = "VillageID,HouseNumber,HouseCode,TitleName,FirstName,LastName,CitizenID,PhoneNumber,WaterUserID,WaterStatus,PrevReading,GarbageStatus,GarbageSizeID\n1,123/4,12345678901,นาย,สมชาย,ใจดี,1111111111111,0812345678,W001,active,150.5,active,1\n1,125/1,12345678902,นาง,สมหญิง,รักดี,2222222222222,0898765432,W002,active,100,inactive,\n2,55/2,12345678903,นางสาว,สวย,งามตา,3333333333333,0811112222,W003,inactive,0,active,2";
    const blob = new Blob(["\uFEFF", csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "household_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#0B409C]" />
            นำเข้าข้อมูลครัวเรือน
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-slate-200">
          
          {/* Action & Info */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
            <div>
              <p className="text-[14px] font-bold text-slate-700">อัปโหลดไฟล์ข้อมูล (CSV หรือ Excel)</p>
              <p className="text-[12px] text-slate-500 mt-1">ไฟล์ต้องมีหัวคอลัมน์และข้อมูลตามรูปแบบที่กำหนด</p>
            </div>
            <button 
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-white text-[#0B409C] border border-blue-200 hover:border-[#0B409C] font-bold text-[13px] rounded-xl shadow-sm transition cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              ดาวน์โหลดเทมเพลต
            </button>
          </div>

          {/* Instructions Accordion */}
          <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-sm">
            <button 
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer focus:outline-none"
            >
              <div className="flex items-center gap-2.5">
                <div className="bg-blue-100 p-1.5 rounded-lg">
                  <BookOpen className="w-4 h-4 text-[#0B409C]" />
                </div>
                <span className="text-[13.5px] font-bold text-slate-700">คู่มือการเตรียมไฟล์ข้อมูล <span className="text-slate-400 font-normal">(คลิกเพื่อดูรายละเอียด)</span></span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showInstructions ? 'rotate-180' : ''}`} />
            </button>
            
            {showInstructions && (
              <div className="p-5 border-t border-slate-100 bg-white animate-in slide-in-from-top-2 duration-200">
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-[12.5px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700">
                        <th className="py-2.5 px-4 border-b border-r border-slate-200 font-extrabold w-1/3">ชื่อคอลัมน์ (Excel)</th>
                        <th className="py-2.5 px-4 border-b border-slate-200 font-extrabold w-2/3">วิธีการกรอกที่ถูกต้อง</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-600 divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 border-r border-slate-200 font-bold text-slate-700">VillageID</td>
                        <td className="py-2.5 px-4">หมู่ที่ (ใส่ตัวเลข) <span className="text-rose-500 font-bold ml-1">*ห้ามเว้นว่าง</span></td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 border-r border-slate-200 font-bold text-slate-700">HouseNumber</td>
                        <td className="py-2.5 px-4">บ้านเลขที่ (เช่น 123/4) <span className="text-rose-500 font-bold ml-1">*ห้ามเว้นว่าง</span></td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 border-r border-slate-200 font-bold text-slate-700">HouseCode</td>
                        <td className="py-2.5 px-4">รหัสประจำบ้าน 11 หลัก <span className="text-rose-500 font-bold ml-1">*ห้ามเว้นว่าง และ ห้ามซ้ำในระบบ</span></td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 border-r border-slate-200 font-bold text-slate-700">TitleName, FirstName, LastName</td>
                        <td className="py-2.5 px-4">คำนำหน้า (เช่น "นาย","นาง","นางสาว" ), ชื่อจริง, นามสกุล <span className="text-rose-500 font-bold ml-1">*ห้ามเว้นว่าง</span></td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 border-r border-slate-200 font-bold text-slate-700">CitizenID</td>
                        <td className="py-2.5 px-4">เลขบัตร ปชช. 13 หลัก <span className="text-rose-500 font-bold ml-1">*ห้ามเว้นว่าง และ ห้ามซ้ำในระบบ</span></td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 border-r border-slate-200 font-bold text-slate-700">PhoneNumber</td>
                        <td className="py-2.5 px-4">เบอร์โทรศัพท์ 10 หลัก (ตัวเลขติดกัน)</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 border-r border-slate-200 font-bold text-slate-700">WaterUserID</td>
                        <td className="py-2.5 px-4">รหัสผู้ใช้น้ำ <span className="text-amber-600 font-bold ml-1">*ห้ามซ้ำถ้ามี</span></td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 border-r border-slate-200 font-bold text-slate-700">PrevReading</td>
                        <td className="py-2.5 px-4">เลขมาตรวัดน้ำปัจจุบัน (ตัวเลข หรือ ทศนิยม)</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 border-r border-slate-200 font-bold text-slate-700">WaterStatus, GarbageStatus</td>
                        <td className="py-2.5 px-4">พิมพ์ <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#0B409C] font-bold">active</code> หรือ <code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-600 font-bold">inactive</code></td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 border-r border-slate-200 font-bold text-slate-700">GarbageSizeID</td>
                        <td className="py-2.5 px-4">ขนาดถังขยะ (ตัวเลข) <span className="text-amber-600 font-bold ml-1">*บังคับถ้าสถานะขยะ active</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mt-4 flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                  <p className="text-[12px] text-amber-700 leading-relaxed">
                    <strong className="font-extrabold text-amber-800">หมายเหตุ:</strong> หากอัปโหลดข้อมูลที่ซ้ำกับในระบบ 100% ทุกตัวอักษร 
                    ระบบจะทำการ <strong className="font-extrabold text-amber-800">"ข้าม"</strong> ข้อมูลนั้นให้โดยอัตโนมัติ (ไม่แจ้ง Error)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* File input area */}
          {!results ? (
            <div 
              className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all ${file ? 'border-[#0B409C] bg-blue-50/30' : 'border-slate-300 hover:border-[#0B409C] bg-slate-50 hover:bg-blue-50/30'} cursor-pointer`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv, .xlsx"
                className="hidden" 
              />
              <FileSpreadsheet className={`w-12 h-12 mx-auto mb-4 ${file ? 'text-[#0B409C]' : 'text-slate-300'}`} />
              
              {file ? (
                <div>
                  <p className="text-[16px] font-bold text-[#0B409C]">{file.name}</p>
                  <p className="text-[13px] text-slate-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                  <p className="text-[13px] text-blue-600 font-bold mt-4 underline decoration-blue-200 underline-offset-4">คลิกเพื่อเปลี่ยนไฟล์</p>
                </div>
              ) : (
                <div>
                  <p className="text-[16px] font-bold text-slate-600">คลิกเพื่อเลือกไฟล์ที่นี่</p>
                  <p className="text-[13px] text-slate-400 mt-1">รองรับ .csv และ .xlsx ขนาดไม่เกิน 5MB</p>
                </div>
              )}
            </div>
          ) : (
            /* Results Area */
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                  <p className="text-[12px] text-slate-500 font-bold">ทั้งหมด</p>
                  <p className="text-2xl font-black text-slate-700 mt-1">{results.total_rows}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl text-center border border-emerald-100">
                  <p className="text-[12px] text-emerald-600 font-bold">สำเร็จ</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">{results.success_count}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-2xl text-center border border-amber-100">
                  <p className="text-[12px] text-amber-600 font-bold">ข้ามซ้ำ</p>
                  <p className="text-2xl font-black text-amber-600 mt-1">{results.skipped_count || 0}</p>
                </div>
                <div className="bg-rose-50 p-4 rounded-2xl text-center border border-rose-100">
                  <p className="text-[12px] text-rose-600 font-bold">ล้มเหลว</p>
                  <p className="text-2xl font-black text-rose-600 mt-1">{results.failed_count}</p>
                </div>
              </div>

              {results.failed_count > 0 && (
                <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 max-h-48 overflow-y-auto">
                  <h4 className="text-[13px] font-bold text-rose-700 flex items-center gap-1.5 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    รายการที่เกิดข้อผิดพลาด:
                  </h4>
                  <ul className="space-y-1.5 text-[12px] text-rose-600">
                    {results.results.filter((r: any) => !r.success && !r.skipped).map((r: any, idx: number) => (
                      <li key={idx} className="flex gap-2 bg-white px-3 py-2 rounded-lg border border-rose-100">
                        <span className="font-bold min-w-[50px]">แถว {r.row_number}:</span>
                        <span>{r.error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-[14px] font-bold text-slate-600 hover:bg-slate-200/50 rounded-xl transition cursor-pointer"
          >
            {results ? "ปิดหน้าต่าง" : "ยกเลิก"}
          </button>
          
          {!results && (
            <button 
              onClick={handleUpload}
              disabled={!file || isUploading}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 text-[14px] font-bold rounded-xl shadow-md transition cursor-pointer ${
                (!file || isUploading) 
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                  : 'bg-[#0B409C] hover:bg-[#09337d] text-white hover:shadow-lg transform active:scale-95'
              }`}
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isUploading ? "กำลังนำเข้า..." : "ยืนยันนำเข้าข้อมูล"}
            </button>
          )}

          {results && (
            <button 
              onClick={() => {
                setFile(null);
                setResults(null);
              }}
              className="flex items-center justify-center gap-2 px-6 py-2.5 text-[14px] font-bold bg-[#0B409C] hover:bg-[#09337d] text-white rounded-xl shadow-md transition cursor-pointer hover:shadow-lg transform active:scale-95"
            >
              นำเข้าไฟล์อื่นเพิ่มเติม
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
