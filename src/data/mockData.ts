export type RoomType = 'large' | 'medium' | 'small' | 'vehicle' | 'online';

export interface BookingEvent {
  id: string;
  title: string;
  president: string;
  department: string;
  location: string;
  roomType: RoomType;
  startDate: string;
  endDate: string;
  equipment: string;
  attendees: number;
  status: 'pending' | 'approved' | 'rejected';
  createdBy: string;
}

export const ROOM_COLORS = {
  large: 'badge-red',
  medium: 'badge-blue',
  vehicle: 'badge-green',
  online: 'badge-yellow',
};

export const INITIAL_EVENTS: BookingEvent[] = [
  {
    id: '1',
    title: 'ประชุมคณะกรรมการติดตามผลงาน ครั้งที่ 1/2569',
    president: 'อธิบดีกรม',
    department: 'กองยุทธศาสตร์',
    location: 'ห้องประชุมใหญ่ ชั้น 3',
    roomType: 'large',
    startDate: '2026-06-03T09:00:00',
    endDate: '2026-06-03T12:00:00',
    equipment: 'ไมค์ 4 ตัว, โปรเจคเตอร์',
    attendees: 50,
    status: 'approved',
    createdBy: 'user1',
  },
  {
    id: '2',
    title: 'ประชุมหารือการจัดทำงบประมาณ',
    president: 'ผู้อำนวยการกอง',
    department: 'กองคลัง',
    location: 'ห้องประชุมย่อย 1',
    roomType: 'medium',
    startDate: '2026-06-04T13:30:00',
    endDate: '2026-06-04T15:00:00',
    equipment: 'โปรเจคเตอร์',
    attendees: 15,
    status: 'approved',
    createdBy: 'user2',
  },
  {
    id: '3',
    title: 'ลงพื้นที่ตรวจงานจังหวัดชลบุรี',
    president: '-',
    department: 'กองตรวจราชการ',
    location: 'รถตู้ ฮค 9999',
    roomType: 'vehicle',
    startDate: '2026-06-05T07:00:00',
    endDate: '2026-06-05T18:00:00',
    equipment: '-',
    attendees: 8,
    status: 'pending',
    createdBy: 'user3',
  },
  {
    id: '4',
    title: 'ประชุมชี้แจงนโยบายออนไลน์',
    president: 'รองอธิบดี',
    department: 'กองการเจ้าหน้าที่',
    location: 'Zoom Meeting (Account 1)',
    roomType: 'online',
    startDate: '2026-06-06T10:00:00',
    endDate: '2026-06-06T12:00:00',
    equipment: 'Host Key',
    attendees: 100,
    status: 'approved',
    createdBy: 'user4',
  }
];
