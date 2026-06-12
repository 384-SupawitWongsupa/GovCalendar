'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { RoomType, BookingEvent } from '@/data/mockData';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: any) => void;
  initialData?: BookingEvent | null;
  events: BookingEvent[];
}

export default function BookingModal({ isOpen, onClose, onSave, initialData, events }: BookingModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    president: '',
    department: '',
    location: '',
    roomType: 'medium' as RoomType,
    startDate: '',
    endDate: '',
    equipment: '',
    attendees: 10,
  });
  const [isOther, setIsOther] = useState(false);
  const [customLocation, setCustomLocation] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const predefinedLocations = [
          "ห้องประชุมสภาฯ", "อาคารดอยงาม", "อาคารชมรมผู้สูงอายุ",
          "รถตู้ ขก 9336", "รถตู้ นค 2546", "รถตู้ กง 1957",
          "รถตู้ 1ษ 1054", "รถบรรทุกน้ำ", "รถกระเช้า"
        ];
        const isPredefined = predefinedLocations.includes(initialData.location);

        setFormData({
          title: initialData.title || '',
          president: initialData.president || '',
          department: initialData.department || '',
          location: isPredefined ? (initialData.location || '') : 'อื่นๆ',
          roomType: initialData.roomType || 'medium',
          startDate: initialData.startDate ? initialData.startDate.slice(0, 16) : '',
          endDate: initialData.endDate ? initialData.endDate.slice(0, 16) : '',
          equipment: initialData.equipment || '',
          attendees: initialData.attendees || 10,
        });

        setIsOther(!isPredefined && !!initialData.location);
        setCustomLocation(isPredefined ? '' : (initialData.location || ''));

      } else {
        setFormData({
          title: '',
          president: '',
          department: '',
          location: '',
          roomType: 'medium',
          startDate: '',
          endDate: '',
          equipment: '',
          attendees: 10,
        });
        setIsOther(false);
        setCustomLocation('');
      }
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalLocation = isOther ? customLocation : formData.location;
    const finalData = { ...formData, location: finalLocation };

    const newStart = new Date(formData.startDate).getTime();
    const newEnd = new Date(formData.endDate).getTime();

    if (newStart >= newEnd) {
      alert('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น');
      return;
    }

    const hasOverlap = events.some(event => {
      if (initialData && event.id === initialData.id) return false;
      
      if (event.location === finalLocation) {
        const eventStart = new Date(event.startDate).getTime();
        const eventEnd = new Date(event.endDate).getTime();
        
        if (newStart < eventEnd && newEnd > eventStart) {
          return true;
        }
      }
      return false;
    });

    if (hasOverlap) {
      alert(`ไม่สามารถจองได้เนื่องจาก "${finalLocation}" มีการจองซ้อนทับในช่วงเวลานี้แล้ว`);
      return;
    }

    if (initialData) {
      onSave({ ...finalData, id: initialData.id });
    } else {
      onSave(finalData);
    }
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
      <div className="card animate-scale" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', borderRadius: 'var(--radius-lg)', padding: '2rem', boxShadow: 'var(--shadow-premium)', border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="flex justify-between items-center mb-6 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.3px' }}>{initialData ? 'แก้ไขการจองห้องประชุม' : 'แบบฟอร์มจองห้องประชุม / ทรัพยากร'}</h2>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none', borderRadius: '50%', minWidth: 'auto', height: 'auto', background: 'transparent', color: 'var(--foreground)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">

          <div className="form-group">
            <label className="form-label">ชื่อกิจกรรม / หัวข้อประชุม</label>
            <input
              required
              className="form-input"
              placeholder="เช่น ประชุมคณะกรรมการ... ครั้งที่ 1/2569"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1 1 240px' }}>
              <label className="form-label">ผู้ขอใช้ห้องประชุม / ผู้ขอใช้ยานพาหนะ</label>
              <input
                required
                className="form-input"
                placeholder="ระบุชื่อหรือตำแหน่ง"
                value={formData.president}
                onChange={e => setFormData({ ...formData, president: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ flex: '1 1 240px' }}>
              <label className="form-label">หน่วยงานผู้จัด (กอง / ฝ่าย)</label>
              <input
                required
                className="form-input"
                placeholder="เช่น กองยุทธศาสตร์และงบประมาณ"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '2 1 300px' }}>
              <label className="form-label">สถานที่ / ห้องประชุม / ยานพาหนะ</label>
              <select
                className="form-select"
                value={formData.location}
                onChange={e => {
                  const val = e.target.value;
                  setIsOther(val === 'อื่นๆ');
                  setFormData({
                    ...formData, location: val, roomType:
                      val.includes('สภา') ? 'large' :
                        val.includes('ผู้สูงอายุ') ? 'small' :
                          val.includes('รถ') ? 'vehicle' :
                            val === 'อื่นๆ' ? 'online' : 'medium'
                  });
                }}
                required
              >
                <option value="">-- เลือกห้องประชุม/ทรัพยากร --</option>
                <option value="ห้องประชุมสภาฯ">🔴 ห้องประชุมสภาฯ (ห้องประชุมใหญ่)</option>
                <option value="อาคารดอยงาม">🔵 อาคารดอยงาม</option>
                <option value="อาคารชมรมผู้สูงอายุ">🟣 อาคารชมรมผู้สูงอายุ</option>
                <option value="รถ ขก 9336">🟢 รถ ขก 9336</option>
                <option value="รถ นค 2546">🟢 รถ นค 2546</option>
                <option value="รถ กง 1957">🟢 รถ กง 1957</option>
                <option value="รถ 1ษ 1054">🟢 รถ 1ษ 1054</option>
                <option value="รถบรรทุกน้ำ">🟢 รถบรรทุกน้ำ</option>
                <option value="รถกระเช้า">🟢 รถกระเช้า</option>
                <option value="อื่นๆ">🟡 อื่นๆ โปรดระบุ</option>
              </select>
              {isOther && (
                <div style={{ marginTop: '0.5rem' }}>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="โปรดระบุสถานที่..."
                    value={customLocation}
                    onChange={e => setCustomLocation(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="form-group" style={{ flex: '1 1 120px' }}>
              <label className="form-label">จำนวนผู้เข้าร่วม (คน)</label>
              <input
                type="number"
                required
                className="form-input"
                min="1"
                value={Number.isNaN(formData.attendees) ? '' : formData.attendees}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  setFormData({ ...formData, attendees: isNaN(val) ? ('' as unknown as number) : val });
                }}
              />
            </div>
          </div>

          <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1 1 240px' }}>
              <label className="form-label">เวลาเริ่มต้น</label>
              <input
                type="datetime-local"
                required
                className="form-input"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ flex: '1 1 240px' }}>
              <label className="form-label">เวลาสิ้นสุด</label>
              <input
                type="datetime-local"
                required
                className="form-input"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">อุปกรณ์ที่ต้องการเพิ่มเติม</label>
            <textarea
              className="form-textarea"
              placeholder="เช่น ไมค์โครโฟนไร้สาย 4 ตัว, โปรเจคเตอร์พร้อมสกรีน (หากไม่มีกรุณาใส่ -)"
              rows={2}
              value={formData.equipment}
              onChange={e => setFormData({ ...formData, equipment: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-outline" style={{ borderRadius: 'var(--radius-sm)' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary" style={{ borderRadius: 'var(--radius-sm)' }}>{initialData ? 'บันทึกการแก้ไข' : 'ยืนยันการจอง'}</button>
          </div>

        </form>
      </div>
    </div>
  );
}
