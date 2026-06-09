'use client';

import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import { BookingEvent } from '@/data/mockData';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: BookingEvent[];
}

export default function ExportModal({ isOpen, onClose, events }: ExportModalProps) {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  if (!isOpen) return null;

  // Extract unique locations from events
  const uniqueLocations = Array.from(new Set(events.map(e => e.location))).filter(Boolean);

  const handleExport = () => {
    // 1. Filter events
    const filteredEvents = events.filter(e => {
      const matchLocation = selectedLocation === 'all' || e.location === selectedLocation;
      
      let matchDate = true;
      if (startDateFilter || endDateFilter) {
        const eventDate = new Date(e.startDate);
        if (startDateFilter) {
          const start = new Date(startDateFilter);
          start.setHours(0, 0, 0, 0);
          if (eventDate < start) matchDate = false;
        }
        if (endDateFilter) {
          const end = new Date(endDateFilter);
          end.setHours(23, 59, 59, 999);
          if (eventDate > end) matchDate = false;
        }
      }
      
      return matchLocation && matchDate;
    });

    if (filteredEvents.length === 0) {
      alert('ไม่มีข้อมูลสำหรับการส่งออกในสถานที่ที่เลือก');
      return;
    }

    filteredEvents.sort((a, b) => {
      const timeA = new Date(a.startDate).getTime();
      const timeB = new Date(b.startDate).getTime();
      return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
    });

    // 2. Format data for Excel
    const exportData = filteredEvents.map((e, index) => {
      // Safe date formatting function
      const safeFormatDate = (dateStr: string, formatStr: string) => {
        try {
          if (!dateStr) return '-';
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return dateStr;
          return format(d, formatStr, { locale: th });
        } catch (error) {
          return dateStr;
        }
      };

      return {
        'ลำดับ': index + 1,
        'วันที่บันทึก': e.id && e.id.length > 5 ? e.id : '-',
        'ชื่อกิจกรรม': e.title,
        'ประธาน': e.president,
        'หน่วยงานผู้จัด': e.department,
        'สถานที่/ห้องประชุม': e.location,
        'ประเภทห้อง': e.roomType,
        'จำนวนคน': e.attendees,
        'เวลาเริ่ม': safeFormatDate(e.startDate, 'd MMM yyyy HH:mm'),
        'เวลาสิ้นสุด': safeFormatDate(e.endDate, 'd MMM yyyy HH:mm'),
        'อุปกรณ์เพิ่มเติม': e.equipment || '-'
      };
    });

    // 3. Create worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "รายงานการจอง");

    // 4. Download file
    const safeLocationName = selectedLocation === 'all' ? 'ทั้งหมด' : selectedLocation.replace(/[/\\?%*:|"<>]/g, '-');
    const fileName = `รายงานการจอง_${safeLocationName}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    onClose();
  };

  return (
    <div className="animate-fade" style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem'
    }}>
      <div className="card animate-scale" style={{ width: '100%', maxWidth: '450px', borderRadius: 'var(--radius-lg)', padding: '2rem', boxShadow: 'var(--shadow-premium)', border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="flex justify-between items-center mb-6 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--foreground)' }} className="flex items-center gap-2">
            <Download size={20} style={{ color: 'var(--primary)' }} /> ดาวน์โหลดรายงาน
          </h2>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none', borderRadius: '50%', minWidth: 'auto', height: 'auto', background: 'transparent', color: 'var(--foreground)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="form-group">
            <label className="form-label">เลือกสถานที่ที่ต้องการดาวน์โหลด</label>
            <select 
              className="form-select"
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
            >
              <option value="all">-- ดาวน์โหลดทั้งหมด --</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <div className="form-group flex-1">
              <label className="form-label">ตั้งแต่วันที่</label>
              <input 
                type="date" 
                className="form-input" 
                value={startDateFilter}
                onChange={e => setStartDateFilter(e.target.value)}
              />
            </div>
            <div className="form-group flex-1">
              <label className="form-label">ถึงวันที่</label>
              <input 
                type="date" 
                className="form-input" 
                value={endDateFilter}
                onChange={e => setEndDateFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-outline" style={{ borderRadius: 'var(--radius-sm)' }} onClick={onClose}>ยกเลิก</button>
            <button type="button" className="btn btn-primary flex items-center gap-2" style={{ borderRadius: 'var(--radius-sm)' }} onClick={handleExport}>
              <Download size={16} /> โหลดไฟล์ Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
