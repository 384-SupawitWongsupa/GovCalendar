'use client';

import { useState, useEffect } from 'react';
import { format, parseISO, isSameDay, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { th } from 'date-fns/locale';
import { INITIAL_EVENTS, ROOM_COLORS, BookingEvent } from '@/data/mockData';
import { Calendar as CalendarIcon, MapPin, Users, Video, Car, Plus, Info, ChevronLeft, ChevronRight, Edit2, Trash2, Download, X, BarChart3, Award, Printer } from 'lucide-react';
import BookingModal from '@/components/BookingModal';
import ExportModal from '@/components/ExportModal';

export default function Home() {
  const [events, setEvents] = useState<BookingEvent[]>(INITIAL_EVENTS);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-06-01T00:00:00'));
  const [viewMode, setViewMode] = useState<'month' | 'list' | 'dashboard'>('month');
  const [dashboardType, setDashboardType] = useState<'room' | 'vehicle'>('room');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<BookingEvent | null>(null);
  const [eventToEdit, setEventToEdit] = useState<BookingEvent | null>(null);

  const safeFormatDate = (dateStr: string | undefined | null, formatStr: string) => {
    if (!dateStr) return '-';
    try {
      const parsed = parseISO(dateStr);
      if (isNaN(parsed.getTime())) return '-';
      return format(parsed, formatStr, { locale: th });
    } catch {
      return '-';
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/booking', { cache: 'no-store' });
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          const fixedData = result.data.map((event: any) => {
            let evt = { ...event };
            
            // Fix column shift for vehicle
            if (
              (typeof evt.startDate === 'number' || (!isNaN(Number(evt.startDate)) && evt.startDate !== '')) &&
              typeof evt.endDate === 'string' && evt.endDate.includes('T')
            ) {
              evt = {
                ...evt,
                roomType: evt.attendees,
                attendees: evt.startDate,
                startDate: evt.endDate,
                endDate: evt.equipment,
                equipment: evt.roomType,
              };
            }
            
            // Restore approver from permitType since it's not saved in Google Sheets
            if (!evt.approver && evt.permitType) {
              if (evt.permitType.includes('กองปลัด')) evt.approver = 'นางสุกัญญมาส เทพวงศ์';
              else if (evt.permitType.includes('กองคลัง')) evt.approver = 'นางสาวดารารัตน์ เชื้อเมืองพาน';
              else if (evt.permitType.includes('กองช่าง')) evt.approver = 'นายสุพล ปาริมา';
              else if (evt.permitType.includes('กองการศึกษา')) evt.approver = 'นายดิเรก วันมี';
            }
            
            return evt;
          });
          setEvents(fixedData);
        } else if (!result.success) {
          console.warn('Using fallback data because fetch failed:', result);
        }
      } catch (error) {
        console.error('Failed to fetch events', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Generate calendar days based on viewMode
  let startDate = new Date();
  let endDate = new Date();
  let calendarDays: Date[] = [];

  if (viewMode === 'month') {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    startDate = startOfWeek(monthStart);
    endDate = endOfWeek(monthEnd);
    calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  } else if (viewMode === 'list' || viewMode === 'dashboard') {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    startDate = monthStart;
    endDate = monthEnd;
    calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  }

  const navigateNext = () => {
    setCurrentDate(addDays(endOfMonth(currentDate), 1));
  };
  const navigatePrev = () => {
    setCurrentDate(addDays(startOfMonth(currentDate), -1));
  };

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const eventsByDate = events.reduce((acc, event) => {
    // กรองประเภท Dashboard
    if (dashboardType === 'room' && event.roomType === 'vehicle') return acc;
    if (dashboardType === 'vehicle' && event.roomType !== 'vehicle') return acc;

    // ตรวจสอบข้อมูลวันที่ว่าถูกต้องหรือไม่ (ป้องกันแอปค้าง Invalid time value)
    if (!event.startDate) return acc;
    const start = new Date(event.startDate);
    if (isNaN(start.getTime())) return acc;

    // Check if event is in the past (ended before today)
    const end = new Date(event.endDate || event.startDate);
    if (!isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999);
      // ถ้าเวลาสิ้นสุดของกิจกรรม ผ่านเมื่อวานไปแล้ว ให้ข้าม (ไม่แสดงบนปฏิทิน)
      if (end < todayDate) return acc;
    }

    let currentDay = new Date(start);
    currentDay.setHours(0, 0, 0, 0);
    const lastDay = new Date(end);
    lastDay.setHours(23, 59, 59, 999);

    // ป้องกันกรณีที่ข้อมูลวันที่ผิดพลาด ทำให้ลูปทำงานหลายหมื่นรอบ
    const diffDays = (lastDay.getTime() - currentDay.getTime()) / (1000 * 3600 * 24);
    if (diffDays > 30 || currentDay.getFullYear() < 2000) {
      lastDay.setTime(currentDay.getTime()); // บังคับให้แสดงแค่วันเดียวเพื่อป้องกันแอปค้าง
    }

    while (currentDay <= lastDay) {
      const dateKey = format(currentDay, 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(event);
      currentDay.setDate(currentDay.getDate() + 1);
    }
    return acc;
  }, {} as Record<string, BookingEvent[]>);

  const getEventsForDay = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return (eventsByDate[dateKey] || []).sort((a, b) => {
      const tA = new Date(a.startDate).getTime();
      const tB = new Date(b.startDate).getTime();
      return (isNaN(tA) ? 0 : tA) - (isNaN(tB) ? 0 : tB);
    });
  };

  const getPillColor = (event: BookingEvent) => {
    let type = event.roomType;
    if (!['large', 'medium', 'small', 'vehicle', 'online'].includes(type)) {
      const str = JSON.stringify(event);
      if (str.includes('สภา')) type = 'large';
      else if (str.includes('ผู้สูงอายุ')) type = 'small';
      else if (str.includes('รถ')) type = 'vehicle';
      else if (str.includes('Zoom')) type = 'online';
      else type = 'medium';
    }
    switch (type) {
      case 'large': return { bg: 'var(--cat-red-bg)', text: 'var(--cat-red-text)' };
      case 'medium': return { bg: 'var(--cat-blue-bg)', text: 'var(--cat-blue-text)' };
      case 'small': return { bg: 'var(--cat-purple-bg)', text: 'var(--cat-purple-text)' };
      case 'vehicle': return { bg: 'var(--cat-green-bg)', text: 'var(--cat-green-text)' };
      case 'online': return { bg: 'var(--cat-yellow-bg)', text: 'var(--cat-yellow-text)' };
      default: return { bg: 'var(--cat-blue-bg)', text: 'var(--cat-blue-text)' };
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบการจองนี้?')) return;

    // Optimistic update
    setEvents(events.filter(e => e.id !== id));
    setSelectedEvent(null);

    try {
      const res = await fetch('/api/booking', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.simulated) {
        alert('ลบการจองเรียบร้อย (ยังไม่ได้เชื่อมต่อ Google Sheets Webhook จริง)');
      } else if (!data.success) {
        alert('เกิดข้อผิดพลาดในการลบใน Google Sheets');
      } else {
        alert('ลบข้อมูลใน Google Sheets เรียบร้อยแล้ว!');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 animate-fade">
      {/* Dashboard Type Tabs */}
      <div className="flex gap-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setDashboardType('room')}
          style={{ padding: '0.5rem 1rem', borderBottom: dashboardType === 'room' ? '3px solid var(--primary)' : 'none', fontWeight: dashboardType === 'room' ? 700 : 500, color: dashboardType === 'room' ? 'var(--primary)' : 'var(--foreground)', opacity: dashboardType === 'room' ? 1 : 0.6, background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
          🏢 ปฏิทินห้องประชุม
        </button>
        <button 
          onClick={() => setDashboardType('vehicle')}
          style={{ padding: '0.5rem 1rem', borderBottom: dashboardType === 'vehicle' ? '3px solid var(--primary)' : 'none', fontWeight: dashboardType === 'vehicle' ? 700 : 500, color: dashboardType === 'vehicle' ? 'var(--primary)' : 'var(--foreground)', opacity: dashboardType === 'vehicle' ? 1 : 0.6, background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
          🚐 ปฏิทินยานพาหนะ
        </button>
      </div>

      {/* Calendar Header Area */}
      <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div className="flex items-center gap-3">
          <button onClick={navigatePrev} className="btn btn-outline" style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={20} /></button>
          <div style={{ textAlign: 'center', minWidth: '180px' }}>
            <h1 className="text-3xl font-bold" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.5px' }}>
              {format(currentDate, 'MMMM', { locale: th })}
            </h1>
            <p style={{ fontSize: '0.75rem', opacity: 0.6, letterSpacing: '1px', textTransform: 'uppercase', marginTop: '-2px' }}>
              {`${format(currentDate, 'MMMM', { locale: th })} ${format(currentDate, 'yyyy')}`}
            </p>
          </div>
          <button onClick={navigateNext} className="btn btn-outline" style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={20} /></button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex" style={{ background: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)', padding: '0.25rem' }}>
            {(['month', 'list', 'dashboard'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: viewMode === mode ? 700 : 500,
                  background: viewMode === mode ? 'var(--primary)' : 'transparent',
                  color: viewMode === mode ? '#fff' : 'var(--foreground)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {mode === 'month' ? 'เดือน' : mode === 'list' ? 'คิวงาน' : 'สถิติ'}
              </button>
            ))}
          </div>
          <div className="text-2xl font-bold hidden md:block" style={{ color: 'var(--primary)', marginRight: '0.5rem', background: 'rgba(var(--primary-rgb), 0.08)', padding: '0.35rem 0.85rem', borderRadius: '8px' }}>
            พ.ศ. {parseInt(format(currentDate, 'yyyy')) + 543}
          </div>
          <button onClick={() => setIsExportModalOpen(true)} className="btn btn-outline" style={{ borderRadius: 'var(--radius-sm)' }}>
            <Download size={16} />
            <span>รายงาน</span>
          </button>
          <button onClick={() => { setEventToEdit(null); setIsModalOpen(true); }} className="btn btn-primary" style={{ borderRadius: 'var(--radius-sm)' }}>
            <Plus size={16} />
            <span>{dashboardType === 'room' ? 'จองห้องประชุม' : 'จองยานพาหนะ'}</span>
          </button>
        </div>
      </div>

      <div className="flex gap-6 flex-1 flex-wrap-reverse md:flex-nowrap">
        {/* Left: Main Grid */}
        <div className="flex-1 flex flex-col" style={{ minWidth: '320px' }}>
          {viewMode === 'month' ? (
            <>
              {/* Weekday Headers for Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, minmax(0, 1fr))`, background: 'var(--surface-hover)', borderRadius: '12px 12px 0 0', overflow: 'hidden', borderLeft: '1px solid var(--border)', borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'].map((day, i) => (
                  <div key={day} className="calendar-header-cell" style={{
                    color: i === 0 || i === 6 ? 'var(--cat-red-text)' : 'var(--foreground)',
                    borderTop: 'none',
                    borderLeft: i === 0 ? 'none' : '1px solid var(--border)',
                    borderRight: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    padding: '1rem 0.5rem'
                  }}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="calendar-grid flex-1" style={{ position: 'relative', gridTemplateColumns: `repeat(7, minmax(0, 1fr))` }}>
                {isLoading && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(var(--background), 0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                    <div className="card animate-scale" style={{ padding: '1.5rem 2rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)' }}>
                      กำลังโหลดข้อมูลจาก Google Sheets...
                    </div>
                  </div>
                )}
                {calendarDays.map((date, idx) => {
                  const isCurrentMonth = isSameMonth(date, currentDate);
                  const dayEvents = getEventsForDay(date);
                  const isToday = isSameDay(date, new Date());

                  return (
                    <div key={idx} className={`calendar-cell ${!isCurrentMonth && viewMode === 'month' ? 'other-month' : ''}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: isToday ? '26px' : 'auto', height: isToday ? '26px' : 'auto',
                          borderRadius: isToday ? '50%' : 'none', background: isToday ? 'var(--primary)' : 'transparent',
                          color: isToday ? '#ffffff' : 'inherit', opacity: isToday ? 1 : (isCurrentMonth || viewMode !== 'month' ? 1 : 0.4),
                          fontWeight: isToday ? 700 : 500, fontSize: '0.85rem', textAlign: 'center'
                        }}>
                          {format(date, 'd')}
                        </span>
                        {isToday && <span style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>วันนี้</span>}
                      </div>

                      <div className="flex flex-col gap-1 overflow-y-auto flex-1" style={{ maxHeight: viewMode === 'month' ? '90px' : 'none' }}>
                        {dayEvents.map((event, eventIdx) => {
                          const colors = getPillColor(event);
                          return (
                            <div key={`${event.id}-${eventIdx}`} className="event-pill" style={{ background: colors.bg, color: colors.text, padding: viewMode !== 'month' ? '0.5rem' : undefined, whiteSpace: viewMode !== 'month' ? 'normal' : 'nowrap' }} onClick={() => setSelectedEvent(event)}>
                              <span style={{ opacity: 0.8, marginRight: '3px', fontWeight: 700 }}>{safeFormatDate(event.startDate, 'HH:mm')}</span>
                              {event.title}
                              {viewMode !== 'month' && <div style={{ fontSize: '0.7rem', marginTop: '4px', opacity: 0.8 }}><MapPin size={10} style={{ display: 'inline', marginRight: '2px' }} />{event.location}</div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : viewMode === 'list' ? (
            /* List View */
            <div className="flex-1 overflow-y-auto pr-2" style={{ position: 'relative' }}>
              {isLoading && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(var(--background), 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  กำลังโหลดข้อมูล...
                </div>
              )}
              {calendarDays.filter(date => getEventsForDay(date).length > 0).length === 0 ? (
                <div className="flex items-center justify-center h-full opacity-50">ไม่มีคิวงานในเดือนนี้</div>
              ) : (
                calendarDays.map((date, idx) => {
                  const dayEvents = getEventsForDay(date);
                  if (dayEvents.length === 0) return null;

                  const getDerivedTypeForList = (event: BookingEvent) => {
                    let type = event.roomType;
                    if (!['large', 'medium', 'small', 'vehicle', 'online'].includes(type)) {
                      const str = JSON.stringify(event);
                      if (str.includes('สภา')) type = 'large';
                      else if (str.includes('ผู้สูงอายุ')) type = 'small';
                      else if (str.includes('รถ')) type = 'vehicle';
                      else if (str.includes('Zoom')) type = 'online';
                      else type = 'medium';
                    }
                    return type;
                  };

                  const roomEvents = dayEvents.filter(e => {
                    const t = getDerivedTypeForList(e);
                    return ['large', 'medium', 'small'].includes(t);
                  });
                  const vehicleEvents = dayEvents.filter(e => getDerivedTypeForList(e) === 'vehicle');
                  const otherEvents = dayEvents.filter(e => !['large', 'medium', 'small', 'vehicle'].includes(getDerivedTypeForList(e)));

                  const renderEventCard = (event: BookingEvent, eventIdx: number) => {
                    const colors = getPillColor(event);
                    return (
                      <div key={`${event.id}-${eventIdx}`} onClick={() => setSelectedEvent(event)} className="card flex gap-4 p-4 cursor-pointer hover:border-primary transition-colors" style={{ borderLeft: `4px solid ${colors.text}` }}>
                        <div style={{ minWidth: '50px', fontWeight: 700, color: 'var(--foreground)' }}>
                          {safeFormatDate(event.startDate, 'HH:mm')}
                        </div>
                        <div className="flex-1">
                          <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{event.title}</h4>
                          <div className="flex gap-3 opacity-70" style={{ fontSize: '0.8rem', flexWrap: 'wrap' }}>
                            <span className="flex items-center gap-1"><MapPin size={12} /> {event.location}</span>
                            <span className="flex items-center gap-1"><Users size={12} /> {event.department}</span>
                          </div>
                        </div>
                      </div>
                    );
                  };

                  return (
                    <div key={idx} className="mb-8">
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem', color: 'var(--primary)' }}>
                        {format(date, 'EEEEที่ d MMMM yyyy', { locale: th })}
                      </h3>
                      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                        {roomEvents.length > 0 && (
                          <div className="flex flex-col gap-3">
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--foreground)', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ display: 'inline-flex', padding: '0.25rem', background: 'var(--cat-blue-bg)', color: 'var(--cat-blue-text)', borderRadius: '4px' }}><MapPin size={14} /></span>
                              ห้องประชุม
                            </h4>
                            {roomEvents.map(renderEventCard)}
                          </div>
                        )}
                        {vehicleEvents.length > 0 && (
                          <div className="flex flex-col gap-3">
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--foreground)', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ display: 'inline-flex', padding: '0.25rem', background: 'var(--cat-green-bg)', color: 'var(--cat-green-text)', borderRadius: '4px' }}><Car size={14} /></span>
                              ยานพาหนะ
                            </h4>
                            {vehicleEvents.map(renderEventCard)}
                          </div>
                        )}
                        {otherEvents.length > 0 && (
                          <div className="flex flex-col gap-3">
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--foreground)', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ display: 'inline-flex', padding: '0.25rem', background: 'var(--cat-purple-bg)', color: 'var(--cat-purple-text)', borderRadius: '4px' }}><Video size={14} /></span>
                              อื่นๆ
                            </h4>
                            {otherEvents.map(renderEventCard)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Dashboard View */
            <div className="flex-1 overflow-y-auto pr-2 animate-fade">
              {(() => {
                const currentMonthEvents = events.filter(e => isSameMonth(new Date(e.startDate), currentDate));
                const totalEvents = currentMonthEvents.length;

                const locationCounts: Record<string, number> = {};
                const departmentCounts: Record<string, number> = {};

                currentMonthEvents.forEach(e => {
                  locationCounts[e.location] = (locationCounts[e.location] || 0) + 1;
                  departmentCounts[e.department] = (departmentCounts[e.department] || 0) + 1;
                });

                const topLocations = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
                const topDepartments = Object.entries(departmentCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

                if (totalEvents === 0) {
                  return <div className="flex items-center justify-center h-full opacity-50">ไม่มีข้อมูลสถิติในเดือนนี้</div>;
                }

                return (
                  <div className="flex flex-col gap-6">
                    {/* Summary Cards */}
                    <div className="flex gap-4 flex-wrap">
                      <div className="card flex-1 p-5" style={{ minWidth: '200px', borderLeft: '4px solid var(--primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', opacity: 0.7 }}>
                          <BarChart3 size={20} /> <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>จำนวนการจองทั้งหมด</span>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--foreground)' }}>{totalEvents} <span style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.5 }}>ครั้ง</span></div>
                      </div>

                      {topLocations.length > 0 && (
                        <div className="card flex-1 p-5" style={{ minWidth: '200px', borderLeft: '4px solid var(--cat-green-bg)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', opacity: 0.7 }}>
                            <Award size={20} /> <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>สถานที่ยอดนิยม</span>
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.2 }}>{topLocations[0][0]}</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 500, opacity: 0.6, marginTop: '0.25rem' }}>ถูกจอง {topLocations[0][1]} ครั้ง</div>
                        </div>
                      )}

                      {topDepartments.length > 0 && (
                        <div className="card flex-1 p-5" style={{ minWidth: '200px', borderLeft: '4px solid var(--cat-purple-bg)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', opacity: 0.7 }}>
                            <Users size={20} /> <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>หน่วยงานที่ใช้งานสูงสุด</span>
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.2 }}>{topDepartments[0][0]}</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 500, opacity: 0.6, marginTop: '0.25rem' }}>จำนวน {topDepartments[0][1]} ครั้ง</div>
                        </div>
                      )}
                    </div>

                    {/* Charts/Bars */}
                    <div className="flex gap-6 flex-wrap" style={{ alignItems: 'flex-start' }}>
                      <div className="card flex-1 p-6" style={{ minWidth: '300px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--foreground)' }}>สถานที่ / ทรัพยากรที่ถูกจอง</h3>
                        <div className="flex flex-col gap-4">
                          {topLocations.map(([name, count], i) => {
                            const percent = (count / totalEvents) * 100;
                            return (
                              <div key={name}>
                                <div className="flex justify-between" style={{ fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                                  <span>{name}</span>
                                  <span style={{ opacity: 0.7 }}>{count} ครั้ง ({percent.toFixed(0)}%)</span>
                                </div>
                                <div style={{ height: '8px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${percent}%`, background: 'var(--primary)', borderRadius: '4px' }}></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="card flex-1 p-6" style={{ minWidth: '300px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--foreground)' }}>หน่วยงาน (กอง / ฝ่าย / ตำแหน่ง)</h3>
                        <div className="flex flex-col gap-4">
                          {topDepartments.map(([name, count], i) => {
                            const percent = (count / totalEvents) * 100;
                            return (
                              <div key={name}>
                                <div className="flex justify-between" style={{ fontSize: '0.85rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                                  <span>{name}</span>
                                  <span style={{ opacity: 0.7 }}>{count} ครั้ง ({percent.toFixed(0)}%)</span>
                                </div>
                                <div style={{ height: '8px', background: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${percent}%`, background: 'var(--cat-purple-text)', borderRadius: '4px' }}></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Right: Notes & Selected Event Details */}
        <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '300px' }}>

          {selectedEvent ? (
            <div className="card flex-1 flex flex-col animate-fade" style={{ padding: '1.5rem', borderLeft: `6px solid ${getPillColor(selectedEvent).text}`, position: 'relative' }}>
              <div className="flex justify-between items-start mb-4 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, opacity: 0.8 }}>รายละเอียดการจอง</h3>
                <div className="flex gap-1">
                  {selectedEvent.roomType === 'vehicle' && (
                    <>
                      {(() => {
                        const sheetGids: Record<string, string> = {
                          "รถ ขก 9336": "1704221446",
                          "รถ นค 2546": "24057517",
                          "รถ กง 1957": "311292930",
                          "รถ 1ษ 1054": "1914707118",
                          "รถบรรทุกน้ำ": "953418876",
                          "รถกระเช้า": "1990229307"
                        };
                        const gid = sheetGids[selectedEvent.location] || "";
                        let exportUrl = "#";
                        if (process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL) {
                          exportUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL.replace(/\/edit.*$/, `/export?format=pdf&portrait=false&size=A4&fitw=true${gid ? `&gid=${gid}` : ''}`);
                        }
                        
                        return (
                          <>
                            <a href={exportUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', color: 'var(--cat-green-text)', borderColor: 'var(--cat-green-border)', background: 'var(--cat-green-bg)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }} title="ดาวน์โหลดสมุดบันทึกรถ (PDF)">
                              📊 โหลดสมุดรถ
                            </a>
                            {selectedEvent.permitType && (
                              <button onClick={async () => {
                                try {
                                  // 1. ดาวน์โหลดใบอนุญาต (ตอนนี้ API จะดึงสมุดรถมาต่อท้ายให้เป็นไฟล์เดียวแล้ว)
                                  const pdfRes = await fetch('/api/print-pdf', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(selectedEvent),
                                  });
                                  if (pdfRes.ok) {
                                    const blob = await pdfRes.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `ใบขออนุญาต_${selectedEvent.president}.pdf`;
                                    document.body.appendChild(a);
                                    a.click();
                                    a.remove();
                                  } else {
                                    const errorData = await pdfRes.json();
                                    alert(`ไม่สามารถโหลด PDF ได้: ${errorData.error}`);
                                  }
                                } catch (e) {
                                  console.error(e);
                                  alert('เกิดข้อผิดพลาดในการโหลด PDF');
                                }
                              }} className="btn btn-outline" style={{ padding: '0.35rem', borderRadius: '6px', color: 'var(--primary)', borderColor: 'var(--primary)' }} title="พิมพ์ใบอนุญาตและสมุดรถ">
                                <Printer size={14} />
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}
                  <button onClick={() => { setEventToEdit(selectedEvent); setIsModalOpen(true); }} className="btn btn-outline" style={{ padding: '0.35rem', borderRadius: '6px' }} title="แก้ไขข้อมูล">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(selectedEvent.id)} className="btn btn-outline" style={{ padding: '0.35rem', borderRadius: '6px', color: 'var(--cat-red-text)', borderColor: 'var(--cat-red-border)', background: 'var(--cat-red-bg)' }} title="ลบการจอง">
                    <Trash2 size={14} />
                  </button>
                  <button onClick={() => setSelectedEvent(null)} className="btn btn-outline" style={{ padding: '0.35rem', borderRadius: '6px' }} title="ปิด">
                    <X size={14} />
                  </button>
                </div>
              </div>
              <h5 style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: '1.15rem', marginBottom: '1.25rem', lineHeight: '1.4', wordBreak: 'break-word' }}>
                {selectedEvent.title}
              </h5>
              <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="flex items-start gap-3">
                  <div style={{ color: 'var(--primary)', background: 'rgba(var(--primary-rgb), 0.08)', padding: '0.35rem', borderRadius: '6px', display: 'flex' }}>
                    <MapPin size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase' }}>สถานที่</div>
                    <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{selectedEvent.location}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div style={{ color: 'var(--primary)', background: 'rgba(var(--primary-rgb), 0.08)', padding: '0.35rem', borderRadius: '6px', display: 'flex' }}>
                    <CalendarIcon size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase' }}>เวลาจอง</div>
                    <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                      {safeFormatDate(selectedEvent.startDate, 'd MMMM yyyy')} <br />
                      <span style={{ color: 'var(--primary)' }}>{safeFormatDate(selectedEvent.startDate, 'HH:mm')} - {safeFormatDate(selectedEvent.endDate, 'HH:mm')} น.</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div style={{ color: 'var(--primary)', background: 'rgba(var(--primary-rgb), 0.08)', padding: '0.35rem', borderRadius: '6px', display: 'flex' }}>
                    <Info size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase' }}>ผู้ขอใช้ห้องประชุม / ผู้ขอใช้ยานพาหนะ</div>
                    <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{selectedEvent.president}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div style={{ color: 'var(--primary)', background: 'rgba(var(--primary-rgb), 0.08)', padding: '0.35rem', borderRadius: '6px', display: 'flex' }}>
                    <Users size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, opacity: 0.6, fontSize: '0.75rem', textTransform: 'uppercase' }}>หน่วยงาน (กอง / ฝ่าย / ตำแหน่ง)</div>
                    <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{selectedEvent.department} ({selectedEvent.attendees} คน)</div>
                  </div>
                </div>
                {selectedEvent.equipment !== '-' && (
                  <div style={{ background: 'var(--surface-hover)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)', marginTop: '0.5rem' }}>
                    <strong style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.6 }}>อุปกรณ์ที่ต้องการ</strong>
                    <div style={{ opacity: 0.9, fontWeight: 500 }}>{selectedEvent.equipment}</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card flex-1 flex flex-col items-center justify-center animate-fade" style={{ padding: '2rem 1.5rem', minHeight: '400px', textAlign: 'center', borderStyle: 'dashed', borderWidth: '2px', borderColor: 'var(--border)', background: 'transparent' }}>
              <div style={{
                background: 'rgba(var(--primary-rgb), 0.08)',
                color: 'var(--primary)',
                padding: '1.25rem',
                borderRadius: '50%',
                marginBottom: '1.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.08)'
              }}>
                <CalendarIcon size={32} />
              </div>
              <h4 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--foreground)' }}>รายละเอียดกิจกรรม</h4>
              <p style={{ opacity: 0.6, fontSize: '0.85rem', maxWidth: '220px', lineHeight: '1.6' }}>
                คลิกเลือกการจองในปฏิทิน เพื่อตรวจสอบรายละเอียดผู้จัด ประธาน และอุปกรณ์เพิ่มเติม
              </p>
            </div>
          )}

        </div>
      </div>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEventToEdit(null); }}
        initialData={eventToEdit}
        events={events}
        dashboardType={dashboardType}
        onSave={async (newEvent: any) => {
          // 1. เพิ่มข้อมูลลง UI ทันที (Optimistic UI)
          let newEventWithId: BookingEvent;
          const isUpdating = !!newEvent.id;

          if (isUpdating) {
            newEventWithId = { ...eventToEdit, ...newEvent };
            setEvents(events.map(e => e.id === newEvent.id ? newEventWithId : e));
            setSelectedEvent(newEventWithId);
          } else {
            const now = new Date();
            // ใช้ วันที่ + เวลา เป็น ID ไปเลย เพื่อให้แสดงใน Google Sheet สวยงาม
            const id = `${now.toLocaleDateString('th-TH')} ${now.toLocaleTimeString('th-TH')}`;
            newEventWithId = {
              ...newEvent,
              id: id,
              status: 'pending' as const,
              createdBy: 'current_user'
            };
            setEvents([...events, newEventWithId]);
          }

          // 2. ส่งข้อมูลไปที่ API
          try {
            const res = await fetch('/api/booking', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(isUpdating ? { ...newEventWithId, action: 'update' } : newEventWithId)
            });
            const data = await res.json();
            if (data.simulated) {
              alert(isUpdating ? 'บันทึกการแก้ไขเรียบร้อย (ยังไม่ได้เชื่อมต่อ Google Sheets Webhook จริง)' : 'บันทึกข้อมูลเรียบร้อย (ยังไม่ได้เชื่อมต่อ Google Sheets Webhook จริง)');
            } else if (!data.success) {
              alert('เกิดข้อผิดพลาดในการบันทึกลง Google Sheets');
              return;
            } else {
              alert(isUpdating ? 'แก้ไขข้อมูลใน Google Sheets เรียบร้อยแล้ว!' : 'บันทึกข้อมูลลง Google Sheets เรียบร้อยแล้ว!');
            }
          } catch (error) {
            console.error('Save error:', error);
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
          }
        }}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        events={events}
      />
    </div>
  );
}
