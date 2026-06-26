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
  dashboardType?: 'room' | 'vehicle';
}

export default function BookingModal({ isOpen, onClose, onSave, initialData, events, dashboardType = 'room' }: BookingModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    president: '',
    department: '',
    permitType: '',
    approver: '',
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
          permitType: initialData.permitType || '',
          approver: initialData.approver || '',
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
          permitType: '',
          approver: '',
          location: '',
          roomType: dashboardType === 'vehicle' ? 'vehicle' : 'medium',
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
    const isActing = formData.permitType.includes('(รักษาราชการแทน)');
    let finalApprover = formData.approver;
    if (isActing && finalApprover && !finalApprover.includes('(รักษาราชการแทน)')) {
      finalApprover += ' (รักษาราชการแทน)';
    }

    const finalLocation = isOther ? customLocation : formData.location;
    const finalData = { ...formData, location: finalLocation, approver: finalApprover };

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
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.3px' }}>{initialData ? (dashboardType === 'vehicle' ? 'แก้ไขการจองยานพาหนะ' : 'แก้ไขการจองห้องประชุม') : (dashboardType === 'vehicle' ? 'แบบฟอร์มจองยานพาหนะ' : 'แบบฟอร์มจองห้องประชุม / ทรัพยากร')}</h2>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none', borderRadius: '50%', minWidth: 'auto', height: 'auto', background: 'transparent', color: 'var(--foreground)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">

          {dashboardType === 'vehicle' ? (
            <>
              <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '1 1 240px' }}>
                  <label className="form-label">ชื่อ</label>
                  <input
                    required
                    className="form-input"
                    placeholder="ระบุชื่อผู้ขอใช้"
                    value={formData.president}
                    onChange={e => setFormData({ ...formData, president: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ flex: '1 1 240px' }}>
                  <label className="form-label">ตำแหน่ง / หน่วยงาน</label>
                  <input
                    required
                    className="form-input"
                    placeholder="เช่น กองช่าง"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">ขออนุญาตใช้ยานพาหนะไปที่ไหน</label>
                <input
                  required
                  className="form-input"
                  placeholder="เช่น ศาลากลางจังหวัด, กทม. (ไป-กลับ)"
                  value={formData.equipment}
                  onChange={e => setFormData({ ...formData, equipment: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">วัตถุประสงค์เพื่อ</label>
                <input
                  required
                  className="form-input"
                  placeholder="เช่น นำส่งเอกสาร, ประชุมราชการ"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '2 1 300px' }}>
                  <label className="form-label">เลือกยานพาหนะ</label>
                  <select
                    className="form-select"
                    value={formData.location}
                    onChange={e => {
                      const val = e.target.value;
                      setIsOther(val === 'อื่นๆ');
                      setFormData({ ...formData, location: val, roomType: val === 'อื่นๆ' ? 'online' : 'vehicle' });
                    }}
                    required
                  >
                    <option value="">-- เลือกยานพาหนะ --</option>
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
                        placeholder="โปรดระบุยานพาหนะ..."
                        value={customLocation}
                        onChange={e => setCustomLocation(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ flex: '1 1 120px' }}>
                  <label className="form-label">จำนวนคน</label>
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
                  <label className="form-label">ในวันที่ / เวลาเริ่มต้น</label>
                  <input
                    type="datetime-local"
                    required
                    className="form-input"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ flex: '1 1 240px' }}>
                  <label className="form-label">ถึงวันที่ / เวลาสิ้นสุด</label>
                  <input
                    type="datetime-local"
                    required
                    className="form-input"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '1 1 240px' }}>
                  <label className="form-label">ใบอนุญาตใช้ยานพาหนะส่วนกลาง</label>
                  <select
                    required
                    className="form-select"
                    value={formData.permitType.replace(' (รักษาราชการแทน)', '')}
                    onChange={e => {
                      const val = e.target.value;
                      let isActing = formData.permitType.includes(' (รักษาราชการแทน)');
                      let finalVal = isActing && val ? `${val} (รักษาราชการแทน)` : val;
                      
                      if (val === 'ตรวจสอบภายใน') {
                        finalVal = 'ตรวจสอบภายใน (รักษาราชการแทน)';
                        isActing = true;
                      }
                      
                      let approver = formData.approver;
                      if (!isActing) {
                        if (val === 'สำนักงานปลัด') approver = 'นางสุกัญญมาส เทพวงศ์';
                        else if (val === 'กองคลัง') approver = 'นางสาวดารารัตน์ เชื้อเมืองพาน';
                        else if (val === 'กองช่าง') approver = 'นายสุพล ปาริมา';
                        else if (val === 'กองการศึกษาศาสนาและวัฒนธรรม') approver = 'นายดิเรก วันมี';
                        else if (val === 'ตรวจสอบภายใน') approver = '';
                      } else {
                        if (val === 'สำนักงานปลัด') approver = 'นายฐิติวัฒน์ รักแม่';
                        else if (val === 'กองคลัง') approver = 'นางสาวรชต จิตนารินทร์';
                        else if (val === 'กองช่าง') approver = 'นางจิดาภา หอมนาน';
                        else if (val === 'กองการศึกษาศาสนาและวัฒนธรรม') approver = 'นางสาวพิชาพร มังคะละ';
                        else if (val === 'ตรวจสอบภายใน') approver = 'นางสาวเจนจิรา กาวี';
                      }
                      setFormData({ ...formData, permitType: finalVal, approver });
                    }}
                  >
                    <option value="">-- เลือกใบอนุญาต --</option>
                    <option value="กองคลัง">กองคลัง</option>
                    <option value="กองช่าง">กองช่าง</option>
                    <option value="สำนักงานปลัด">สำนักงานปลัด</option>
                    <option value="ตรวจสอบภายใน">ตรวจสอบภายใน</option>
                    <option value="กองการศึกษาศาสนาและวัฒนธรรม">กองการศึกษาศาสนาและวัฒนธรรม</option>
                  </select>
                </div>

                <div className="form-group" style={{ flex: '1 1 240px' }}>
                  <label className="form-label">ผู้เซ็นอนุมัติ</label>
                  <select
                    className="form-select"
                    value={formData.approver.replace(' (รักษาราชการแทน)', '')}
                    onChange={e => setFormData({ ...formData, approver: e.target.value })}
                  >
                    <option value="">-- เลือกผู้เซ็นอนุมัติ --</option>
                    {formData.permitType.includes('(รักษาราชการแทน)') ? (
                      <>
                        {formData.permitType.includes('สำนักงานปลัด') && (
                           <>
                             <option value="นายฐิติวัฒน์ รักแม่">นายฐิติวัฒน์ รักแม่ (รักษาราชการแทน)</option>
                             <option value="นางสาวจรรยารักษ์ เสธิปา">นางสาวจรรยารักษ์ เสธิปา (รักษาราชการแทน)</option>
                           </>
                        )}
                        {formData.permitType.includes('กองคลัง') && (
                           <>
                             <option value="นางสาวรชต จิตนารินทร์">นางสาวรชต จิตนารินทร์ (รักษาราชการแทน)</option>
                             <option value="นางสาวอานิจษา ธรรมกุสุมา">นางสาวอานิจษา ธรรมกุสุมา (รักษาราชการแทน)</option>
                             <option value="นางนัยนา น้อยเรือน">นางนัยนา น้อยเรือน (รักษาราชการแทน)</option>
                           </>
                        )}
                        {formData.permitType.includes('กองช่าง') && (
                           <option value="นางจิดาภา หอมนาน">นางจิดาภา หอมนาน (รักษาราชการแทน)</option>
                        )}
                        {formData.permitType.includes('กองการศึกษา') && (
                           <>
                             <option value="นางสาวพิชาพร มังคะละ">นางสาวพิชาพร มังคะละ (รักษาราชการแทน)</option>
                             <option value="นายสุรศักดิ์ อู่เงิน">นายสุรศักดิ์ อู่เงิน (รักษาราชการแทน)</option>
                           </>
                        )}
                        {formData.permitType.includes('ตรวจสอบภายใน') && (
                           <option value="นางสาวเจนจิรา กาวี">นางสาวเจนจิรา กาวี (รักษาราชการแทน)</option>
                        )}
                      </>
                    ) : (
                      <>
                        <option value="นางสุกัญญมาส เทพวงศ์">นางสุกัญญมาส เทพวงศ์ (สำนักงานปลัด)</option>
                        <option value="นางสาวดารารัตน์ เชื้อเมืองพาน">นางสาวดารารัตน์ เชื้อเมืองพาน (กองคลัง)</option>
                        <option value="นายสุพล ปาริมา">นายสุพล ปาริมา (กองช่าง)</option>
                        <option value="นายดิเรก วันมี">นายดิเรก วันมี (กองการศึกษาฯ)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
                <label className="flex items-center gap-2 cursor-pointer" style={{ opacity: formData.permitType ? 1 : 0.5 }}>
                  <input
                    type="checkbox"
                    disabled={!formData.permitType || formData.permitType.includes('ตรวจสอบภายใน')}
                    checked={formData.permitType.includes(' (รักษาราชการแทน)')}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      let basePermit = formData.permitType.replace(' (รักษาราชการแทน)', '');
                      let newPermitType = isChecked ? `${basePermit} (รักษาราชการแทน)` : basePermit;
                      
                      let newApprover = formData.approver.replace(' (รักษาราชการแทน)', '');
                      if (isChecked) {
                        if (basePermit === 'สำนักงานปลัด') newApprover = 'นายฐิติวัฒน์ รักแม่';
                        else if (basePermit === 'กองคลัง') newApprover = 'นางสาวรชต จิตนารินทร์';
                        else if (basePermit === 'กองช่าง') newApprover = 'นางจิดาภา หอมนาน';
                        else if (basePermit === 'กองการศึกษาศาสนาและวัฒนธรรม') newApprover = 'นางสาวพิชาพร มังคะละ';
                        else if (basePermit === 'ตรวจสอบภายใน') newApprover = 'นางสาวเจนจิรา กาวี';
                      } else {
                        if (basePermit === 'สำนักงานปลัด') newApprover = 'นางสุกัญญมาส เทพวงศ์';
                        else if (basePermit === 'กองคลัง') newApprover = 'นางสาวดารารัตน์ เชื้อเมืองพาน';
                        else if (basePermit === 'กองช่าง') newApprover = 'นายสุพล ปาริมา';
                        else if (basePermit === 'กองการศึกษาศาสนาและวัฒนธรรม') newApprover = 'นายดิเรก วันมี';
                        else if (basePermit === 'ตรวจสอบภายใน') newApprover = '';
                      }
                      
                      setFormData({
                        ...formData,
                        permitType: newPermitType,
                        approver: newApprover
                      });
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)' }}>
                    เซ็นในฐานะ "ผู้รักษาราชการแทน"
                  </span>
                </label>
              </div>
            </>
          ) : (
            <>
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
                  <label className="form-label">ผู้ขอใช้ห้องประชุม</label>
                  <input
                    required
                    className="form-input"
                    placeholder="ระบุชื่อ"
                    value={formData.president}
                    onChange={e => setFormData({ ...formData, president: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ flex: '1 1 240px' }}>
                  <label className="form-label">หน่วยงาน (กอง / ฝ่าย / ตำแหน่ง)</label>
                  <input
                    required
                    className="form-input"
                    placeholder="เช่น กองยุทธศาสตร์"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '2 1 300px' }}>
                  <label className="form-label">สถานที่ / ห้องประชุม</label>
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
                              val === 'อื่นๆ' ? 'online' : 'medium'
                      });
                    }}
                    required
                  >
                    <option value="">-- เลือกสถานที่ --</option>
                    <option value="ห้องประชุมสภาฯ">🔴 ห้องประชุมสภาฯ (ห้องประชุมใหญ่)</option>
                    <option value="อาคารดอยงาม">🔵 อาคารดอยงาม</option>
                    <option value="อาคารชมรมผู้สูงอายุ">🟣 อาคารชมรมผู้สูงอายุ</option>
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
            </>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-outline" style={{ borderRadius: 'var(--radius-sm)' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary" style={{ borderRadius: 'var(--radius-sm)' }}>{initialData ? 'บันทึกการแก้ไข' : 'ยืนยันการจอง'}</button>
          </div>

        </form>
      </div>
    </div>
  );
}
