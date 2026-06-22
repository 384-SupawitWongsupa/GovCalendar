'use client';

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export default function PrintVehiclePermit() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const printData = localStorage.getItem('printData');
    if (printData) {
      setData(JSON.parse(printData));
      setTimeout(() => {
        window.print();
      }, 1000); // Wait a bit longer for the background image to load
    }
  }, []);

  if (!data) return <div className="p-8">กำลังโหลดข้อมูล หรือไม่มีข้อมูล...</div>;

  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  const directorTitle = 
    data.permitType === 'ตรวจสอบภายใน' ? 'ผู้อำนวยการหน่วยตรวจสอบภายใน' :
    data.permitType === 'กองการศึกษาศาสนาและวัฒนธรรม' ? 'ผู้อำนวยการกองการศึกษาศาสนาและวัฒนธรรม' :
    data.permitType ? `ผู้อำนวยการ${data.permitType}` : '';

  const formatMonth = (date: Date) => format(date, 'MMMM', { locale: th });
  const formatYear = (date: Date) => (parseInt(format(date, 'yyyy')) + 543).toString();

  // กำหนดชื่อไฟล์รูปภาพพื้นหลังตามประเภทของใบอนุญาต
  // ตอนนี้ตั้งค่าเบื้องต้นให้เป็นไฟล์เดียวกันก่อน (คุณสามารถเปลี่ยนชื่อไฟล์ให้ตรงกับรูปภาพในโฟลเดอร์ public ได้เลย)
  let bgImage = '/template-vehicle.png';
  if (data.permitType === 'กองคลัง') bgImage = '/template-finance.png';
  else if (data.permitType === 'กองช่าง') bgImage = '/template-engineer.png';
  else if (data.permitType === 'กองปลัด') bgImage = '/template-palad.png';

  return (
    <div className="print-page" style={{ position: 'relative', width: '210mm', height: '297mm', margin: '0 auto', fontFamily: '"Sarabun", "Cordia New", sans-serif', fontSize: '15pt', color: 'black' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; margin: 0; background: white; color: black; }
          .no-print { display: none; }
          .print-page { box-shadow: none !important; margin: 0 !important; }
        }
        body { background: #525659; display: flex; justify-content: center; padding: 2rem 0; }
        .print-page { background-color: white; background-image: url('${bgImage}'); background-size: cover; background-position: center; background-repeat: no-repeat; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
        .absolute-text { position: absolute; white-space: nowrap; }
      `}</style>
      
      {/* 
        หมายเหตุถึงผู้พัฒนา: 
        ตัวเลข top และ left ด้านล่างนี้เป็นการกะระยะคร่าวๆ จากรูปภาพต้นฉบับ 
        หลังจากคุณใส่ไฟล์รูปภาพ template-vehicle.png (หรืออื่นๆ) ลงในโฟลเดอร์ public แล้ว
        คุณจะต้องปรับตัวเลข top (ตำแหน่งแกน Y) และ left (ตำแหน่งแกน X) ให้ตรงกับช่องว่างในไฟล์รูปภาพของคุณ
      */}

      {/* วันที่ด้านบน */}
      <div className="absolute-text" style={{ top: '10.5%', left: '46%' }}>{format(startDate, 'd')}</div>
      <div className="absolute-text" style={{ top: '10.5%', left: '57%' }}>{formatMonth(startDate)}</div>
      <div className="absolute-text" style={{ top: '10.5%', left: '76%' }}>{formatYear(startDate)}</div>

      {/* ชื่อและตำแหน่ง */}
      <div className="absolute-text" style={{ top: '19.5%', left: '26%' }}>{data.president}</div>
      <div className="absolute-text" style={{ top: '19.5%', left: '62%' }}>{data.department}</div>

      {/* ไปที่ไหน */}
      <div className="absolute-text" style={{ top: '23.8%', left: '42%', maxWidth: '350px', whiteSpace: 'normal', lineHeight: '1.2' }}>{data.equipment}</div>

      {/* เพื่อ */}
      <div className="absolute-text" style={{ top: '32.5%', left: '16%', maxWidth: '500px', whiteSpace: 'normal', lineHeight: '1.2' }}>{data.title}</div>
      
      {/* จำนวนคน */}
      <div className="absolute-text" style={{ top: '36.8%', left: '68%' }}>{data.attendees}</div>

      {/* วันที่เริ่มต้น */}
      <div className="absolute-text" style={{ top: '41%', left: '18%' }}>{format(startDate, 'd MMMM yyyy', { locale: th })}</div>
      <div className="absolute-text" style={{ top: '41%', left: '54%' }}>{format(startDate, 'HH:mm')}</div>

      {/* วันที่สิ้นสุด */}
      <div className="absolute-text" style={{ top: '45.2%', left: '18%' }}>{format(endDate, 'd MMMM yyyy', { locale: th })}</div>
      <div className="absolute-text" style={{ top: '45.2%', left: '54%' }}>{format(endDate, 'HH:mm')}</div>

      {/* ชื่อผู้ขออนุญาต (พิมพ์ไว้ใต้ลายเซ็น) */}
      <div className="absolute-text" style={{ top: '51%', left: '32%', transform: 'translateX(-50%)' }}>{data.president}</div>
      <div className="absolute-text" style={{ top: '55.2%', left: '32%', transform: 'translateX(-50%)' }}>{data.department}</div>

      {/* ชื่อผู้อำนวยการ (พิมพ์ไว้ใต้ลายเซ็น) */}
      <div className="absolute-text" style={{ top: '61.5%', left: '53%' }}>{directorTitle}</div>

    </div>
  );
}
