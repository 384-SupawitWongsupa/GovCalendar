import { NextResponse } from 'next/server';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // 1. อ่านไฟล์ PDF ต้นฉบับ
    // ตั้งสมมติฐานว่าไฟล์ชื่อ template-vehicle.pdf หรือตามประเภท
    let templateName = 'template-vehicle.pdf';

    if (data.permitType === 'กองคลัง') templateName = 'template-finance.pdf';
    else if (data.permitType === 'กองคลัง (รักษาราชการแทน)') templateName = 'template-finance-acting.pdf';
    else if (data.permitType === 'กองช่าง') templateName = 'template-engineer.pdf';
    else if (data.permitType === 'กองช่าง (รักษาราชการแทน)') templateName = 'template-engineer-acting.pdf';
    else if (data.permitType === 'กองปลัด') templateName = 'template-palad.pdf';
    else if (data.permitType === 'กองปลัด (รักษาราชการแทน)') templateName = 'template-palad-acting.pdf';
    else if (data.permitType === 'ตรวจสอบภายใน') templateName = 'template-audit.pdf';
    else if (data.permitType === 'ตรวจสอบภายใน (รักษาราชการแทน)') templateName = 'template-audit-acting.pdf';
    else if (data.permitType === 'กองการศึกษาศาสนาและวัฒนธรรม') templateName = 'template-education.pdf';
    else if (data.permitType === 'กองการศึกษาศาสนาและวัฒนธรรม (รักษาราชการแทน)') templateName = 'template-education-acting.pdf';

    const templatePath = path.join(process.cwd(), 'public', templateName);

    // ถ้าไม่มีไฟล์ จะส่ง Error กลับไป
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({
        error: `ไม่พบไฟล์แม่แบบที่ public/${templateName} โปรดนำไฟล์ PDF ต้นฉบับมาใส่ตามชื่อนี้ก่อนครับ`
      }, { status: 404 });
    }

    const templateBytes = fs.readFileSync(templatePath);

    // 2. โหลด pdf-lib
    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);

    // 3. ฝังฟอนต์ภาษาไทย (Sarabun)
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Sarabun-Regular.ttf');
    const fontBytes = fs.readFileSync(fontPath);
    const customFont = await pdfDoc.embedFont(fontBytes);

    const buggyClusters = [
      { cluster: 'ชื้', base: 'ช' },
      { cluster: 'ฝ่', base: 'ฝ' },
      { cluster: 'ทั่', base: 'ท' },
      { cluster: 'ทั้', base: 'ท' }
    ];

    const getFixedTextWidth = (text: string, size: number) => {
      let width = 0;
      let remaining = String(text);

      while (remaining.length > 0) {
        let foundBuggy = false;
        for (const buggy of buggyClusters) {
          if (remaining.startsWith(buggy.cluster)) {
            width += customFont.widthOfTextAtSize(buggy.base, size);
            remaining = remaining.substring(buggy.cluster.length);
            foundBuggy = true;
            break;
          }
        }
        if (!foundBuggy) {
          let nextIndex = remaining.length;
          for (const buggy of buggyClusters) {
            const idx = remaining.indexOf(buggy.cluster);
            if (idx !== -1 && idx < nextIndex) {
              nextIndex = idx;
            }
          }
          const normalPart = remaining.substring(0, nextIndex);
          width += customFont.widthOfTextAtSize(normalPart, size);
          remaining = remaining.substring(nextIndex);
        }
      }
      return width;
    };

    // 4. เขียนข้อความลงใน PDF
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    const drawText = (text: string | number, x: number, y: number, size = 9) => {
      const strText = String(text);
      let remaining = strText;
      let currentX = x;

      while (remaining.length > 0) {
        let foundBuggy = false;
        for (const buggy of buggyClusters) {
          if (remaining.startsWith(buggy.cluster)) {
            firstPage.drawText(buggy.cluster, { x: currentX, y: height - y, size, font: customFont, color: rgb(0, 0, 0) });
            currentX += customFont.widthOfTextAtSize(buggy.base, size);
            remaining = remaining.substring(buggy.cluster.length);
            foundBuggy = true;
            break;
          }
        }

        if (!foundBuggy) {
          let nextIndex = remaining.length;
          for (const buggy of buggyClusters) {
            const idx = remaining.indexOf(buggy.cluster);
            if (idx !== -1 && idx < nextIndex) {
              nextIndex = idx;
            }
          }

          const normalPart = remaining.substring(0, nextIndex);
          firstPage.drawText(normalPart, { x: currentX, y: height - y, size, font: customFont, color: rgb(0, 0, 0) });
          currentX += customFont.widthOfTextAtSize(normalPart, size);
          remaining = remaining.substring(nextIndex);
        }
      }
    };

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    const formatMonth = (date: Date) => format(date, 'MMMM', { locale: th });
    const formatYear = (date: Date) => (parseInt(format(date, 'yyyy')) + 543).toString();


    const isActing = templateName.includes('-acting');

    // ตั้งค่าพิกัดสำหรับ Template ปกติ
    let coords = {
      y1: 109, // วันที่มุมขวาบน
      y2: 159, // ข้าพเจ้า... ตำแหน่ง...
      y3: 183, // ขออนุญาตใช้ยานพาหนะ...(ไปที่ไหน)
      y4: 258, // เพื่อ...
      y5: 258, // มีคนนั่ง...คน
      y6: 283, // ในวันที่ (1)
      y7: 308, // ในวันที่ (2)
      y8: 384, // ใต้ลายเซ็นผู้ขออนุญาต
      y9: 409, // ตำแหน่งใต้ลายเซ็น
      checkX: 92, checkY: 583, // ติ๊กถูกของนายกฯ
      approverX: 230, approverY: 484, // ชื่อผู้เซ็นอนุมัติ
      date1X: 240, date1Y: 508, // วันที่ใต้ผู้อำนวยการ
      date2X: 420, date2Y: 683, // วันที่ใต้นายกฯ
    };

    // ตั้งค่าพิกัดสำหรับ Template ผู้รักษาราชการแทน (สามารถปรับแก้ตัวเลขได้อิสระ)
    if (isActing) {
      coords = {
        y1: 109, // วันที่มุมขวาบน
        y2: 159, // ข้าพเจ้า... ตำแหน่ง...
        y3: 183, // ขออนุญาตใช้ยานพาหนะ...(ไปที่ไหน)
        y4: 258, // เพื่อ...
        y5: 258, // มีคนนั่ง...คน
        y6: 283, // ในวันที่ (1)
        y7: 308, // ในวันที่ (2)
        y8: 384, // ใต้ลายเซ็นผู้ขออนุญาต
        y9: 409, // ตำแหน่งใต้ลายเซ็น
        checkX: 92, checkY: 608, // ติ๊กถูกของนายกฯ
        approverX: 260, approverY: 506, // ชื่อผู้เซ็นอนุมัติ (รักษาราชการแทน)
        date1X: 240, date1Y: 533, // วันที่ใต้ผู้อำนวยการ (รักษาราชการแทน)
        date2X: 420, date2Y: 708, // วันที่ใต้นายกฯ
      };
    }

    // วาดบรรทัดที่ 1: วันที่มุมขวาบน
    drawText(format(startDate, 'd'), 340, coords.y1);
    drawText(formatMonth(startDate), 410, coords.y1);
    drawText(formatYear(startDate), 500, coords.y1);

    // วาดบรรทัดที่ 2: ชื่อผู้ขออนุญาต / ตำแหน่ง
    drawText(data.president, 140, coords.y2);
    drawText(data.department, 420, coords.y2);

    // ฟังก์ชันช่วยตัดข้อความภาษาไทยไม่ให้ตกขอบ (อิงตามความกว้างที่กำหนด)
    const wrapThaiText = (text: string, maxWidth1: number, maxWidth2: number, size: number = 9) => {
      // จับกลุ่มพยัญชนะและสระ/วรรณยุกต์ที่ตามมา เพื่อไม่ให้ตัดคำผิดพลาดตรงสระบน/ล่าง
      const chars = text.match(/.[ัิีึืฺุู็่้๊๋์ํำ]*/g) || [];
      let firstLine = '';
      let secondLine = '';
      let thirdLine = '';
      let currentLine = 1;

      for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        if (currentLine === 1) {
          if (getFixedTextWidth(firstLine + char, size) <= maxWidth1) {
            firstLine += char;
          } else {
            currentLine = 2;
            secondLine += char;
          }
        } else if (currentLine === 2) {
          if (getFixedTextWidth(secondLine + char, size) <= maxWidth2) {
            secondLine += char;
          } else {
            currentLine = 3;
            thirdLine += char;
          }
        } else {
          thirdLine += char; // ถ้ายาวเกิน 3 บรรทัดก็ปล่อยให้ยาวต่อไปในบรรทัดที่ 3
        }
      }
      return { firstLine, secondLine, thirdLine };
    };

    // วาดบรรทัดที่ 3: สถานที่ที่จะไป (แบบตัดบรรทัดอัตโนมัติ)
    const equipmentText = data.equipment || '';
    const maxWidthLine1 = 290; // เริ่มที่ x=245 สิ้นสุดประมาณ x=535
    const maxWidthLineNext = 445; // เริ่มที่ x=90 สิ้นสุดประมาณ x=535

    const wrappedEquipment = wrapThaiText(equipmentText, maxWidthLine1, maxWidthLineNext, 9);

    drawText(wrappedEquipment.firstLine, 245, coords.y3);
    if (wrappedEquipment.secondLine) {
      drawText(wrappedEquipment.secondLine, 90, coords.y3 + 24); // บรรทัดถัดไปลงมา 26 px
    }
    if (wrappedEquipment.thirdLine) {
      drawText(wrappedEquipment.thirdLine, 90, coords.y3 + 50); // บรรทัดที่สามลงมาอีก 26 px
    }

    // วาดบรรทัดที่ 4: วัตถุประสงค์ (เพื่อ)
    drawText(data.title, 90, coords.y4);

    // วาดบรรทัดที่ 5: จำนวนคน
    drawText(data.attendees, 440, coords.y5);

    // วาดบรรทัดที่ 6: วันที่ไป
    drawText(format(startDate, 'd MMMM yyyy', { locale: th }), 160, coords.y6);
    drawText(format(startDate, 'HH:mm'), 400, coords.y6);

    // วาดบรรทัดที่ 7: วันที่กลับ
    drawText(format(endDate, 'd MMMM yyyy', { locale: th }), 160, coords.y7);
    drawText(format(endDate, 'HH:mm'), 400, coords.y7);

    // วาดบรรทัดที่ 8-9: ลายเซ็นผู้ขออนุญาต และ ตำแหน่ง
    drawText(data.president, 260, coords.y8);
    drawText(data.department, 260, coords.y9);

    // ติ๊กถูกที่ช่อง [ ] อนุญาต ของนายกฯ (คำนวณตำแหน่งจาก OCR)
    drawText('/', coords.checkX, coords.checkY, 15); // ใช้เครื่องหมาย / แทนการติ๊กถูก

    // พิมพ์ชื่อผู้เซ็นอนุมัติ (ผู้อำนวยการ)
    if (data.approver) {
      const isActingApprover = data.approver.includes('(รักษาราชการแทน)');
      const baseApproverName = data.approver.replace(' (รักษาราชการแทน)', '').trim();

      const actingTitles: Record<string, [string, string]> = {
        "นายฐิติวัฒน์ รักแม่": ["หัวหน้าฝ่ายบริหารงานทั่วไป รักษาราชการแทน", "หัวหน้าสำนักปลัด"],
        "นางสาวจรรยารักษ์ เสธิปา": ["นักจัดการงานทั่วไปชำนาญการ รักษาราชการแทน", "หัวหน้าสำนักปลัด"],
        "นางสาวรชต จิตนารินทร์": ["หัวหน้าฝ่ายการเงินและบัญชี รักษาราชการแทน", "ผู้อำนวยการกองคลัง"],
        "นางสาวอานิจษา ธรรมกุสุมา": ["นักวิชาการพัสดุชำนาญการ รักษาราชการแทน", "ผู้อำนวยการกองคลัง"],
        "นางนัยนา น้อยเรือน": ["นักวิชาการเงินและบัญชีชำนาญการ รักษาราชการแทน", "ผู้อำนวยการกองคลัง"],
        "นางจิดาภา หอมนาน": ["นายช่างโยธาอาวุโส รักษาราชการแทน", "ผู้อำนวยการกองช่าง"],
        "นางสาวพิชาพร มังคะละ": ["นักจัดการงานทั่วไปชำนาญการ รักษาราชการแทน", "ผู้อำนวยการกองการศึกษา ศาสนา และวัฒนธรรม"],
        "นายสุรศักดิ์ อู่เงิน": ["นักวิชาการศึกษาชำนาญการ รักษาราชการแทน", "ผู้อำนวยการกองการศึกษา ศาสนา และวัฒนธรรม"],
        "นางสาวเจนจิรา กาวี": ["นักวิชาการตรวจสอบภายในปฏิบัติ รักษาราชการแทน", "หัวหน้าหน่วยตรวจสอบภายใน"]
      };

      if (isActingApprover && actingTitles[baseApproverName]) {
        const titles = actingTitles[baseApproverName];
        const lines = [baseApproverName, titles[0], titles[1]];

        // จุดศูนย์กลางสำหรับจัดเรียงข้อความ (ประมาณ 290 เป็นจุดกึ่งกลางของลายเซ็น)
        const centerX = 310;
        const startY = coords.approverY - 25; // ยกขึ้นไปเหนือบรรทัดเดิมเล็กน้อยเพื่อให้พอดีกับ 3 บรรทัด

        lines.forEach((line, index) => {
          const textWidth = getFixedTextWidth(line, 9);
          // จัดกึ่งกลาง
          const centeredX = centerX - (textWidth / 2);
          drawText(line, centeredX, startY + (index * 14));
        });
      } else {
        drawText(data.approver, coords.approverX, coords.approverY);
      }
    }

    // พิมพ์วันที่ใต้ลายเซ็นผู้อำนวยการและนายกฯ
    const fullDateStr = `${format(startDate, 'd')} ${formatMonth(startDate)} ${formatYear(startDate)}`;
    drawText(fullDateStr, coords.date1X, coords.date1Y); // วันที่ใต้ผู้อำนวยการ
    drawText(fullDateStr, coords.date2X, coords.date2Y); // วันที่ใต้นายกฯ

    // 5. ดึงข้อมูลสมุดบันทึกรถ (ถ้าเป็นยานพาหนะ)
    const sheetUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL || "https://docs.google.com/spreadsheets/d/12lfm49QujrIANFGiV8VaaUWMtesS_EOZgBKUQIuQdPU/edit?usp=sharing";
    const isVehicle = data.roomType === 'vehicle' || (data.location && data.location.includes('รถ'));

    if (isVehicle && sheetUrl && data.location) {
      const sheetGids: Record<string, string> = {
        "รถ ขก 9336": "1704221446",
        "รถตู้ ขก 9336": "1704221446",
        "รถ นค 2546": "24057517",
        "รถตู้ นค 2546": "24057517",
        "รถ กง 1957": "311292930",
        "รถตู้ กง 1957": "311292930",
        "รถ 1ษ 1054": "1914707118",
        "รถตู้ 1ษ 1054": "1914707118",
        "รถบรรทุกน้ำ": "953418876",
        "รถกระเช้า": "1990229307"
      };
      
      const gid = sheetGids[data.location] || sheetGids[data.location.replace('ตู้ ', '')];
      if (gid) {
        const exportUrl = sheetUrl.replace(/\/edit.*$/, `/export?format=pdf&portrait=false&size=A4&fitw=true&gid=${gid}`);/export?format=pdf&portrait=false&size=A4&fitw=true&gid=${gid}`);
        try {
          const response = await fetch(exportUrl);
          if (response.ok) {
            const logbookBuffer = await response.arrayBuffer();
            const logbookDoc = await PDFDocument.load(logbookBuffer);
            const copiedPages = await pdfDoc.copyPages(logbookDoc, logbookDoc.getPageIndices());
            copiedPages.forEach((page) => pdfDoc.addPage(page));
          } else {
            console.warn("Failed to fetch logbook PDF from Google Sheets", response.status);
          }
        } catch (e) {
          console.warn("Error fetching logbook PDF", e);
        }
      }
    }

    // 6. บันทึกผลลัพธ์
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="booking-permit.pdf"',
      },
    });

  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
