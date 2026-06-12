import type { Metadata } from 'next';
import './globals.css';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata: Metadata = {
  title: 'GovCalendar - ระบบจองห้องประชุม',
  description: 'ระบบจองห้องประชุมและทรัพยากรส่วนกลางสำหรับหน่วยงานราชการ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>
        <header className="header glass" style={{ padding: '1rem 2rem' }}>
          <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
            <div className="logo" style={{ fontSize: '1.35rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              <span>GovCalendar : อบต.ดอยงาม</span>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem', borderRadius: '50px', fontSize: '0.8rem' }}>
                <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#166534', display: 'inline-block' }}></span>
                พร้อมใช้งาน
              </span>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto w-full p-6" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
