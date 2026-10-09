import React, { useState, useEffect, useRef } from "react";
import "./index.css";
import Auth from "./components/Auth";
import CalendarGrid from "./components/CalendarGrid";
import Profile from "./components/Profile";
import ResetPassword from "./components/ResetPassword";
import { supabase } from "./lib/supabase";
import { VIEWER_EMAILS } from "./lib/viewerConfig";
import { LogOut, FileSpreadsheet, Calendar, CheckCircle2, Clock, Loader2, Eye, User, ChevronDown } from "lucide-react";

function App() {
  const [session, setSession] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [exporting, setExporting] = useState(false);
  const isViewer = VIEWER_EMAILS.includes(session?.user?.email);

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from('logbook_entries')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: true });

      if (error) throw error;
      
      const ExcelJS = (await import('exceljs')).default || await import('exceljs');
      const { saveAs } = await import('file-saver');
      const { GDRIVE_LINKS } = await import('./gdriveLinks');
      const { format, parseISO } = await import('date-fns');
      const { id } = await import('date-fns/locale');

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Logbook Magang');

      // 1. Header & Metadata
      worksheet.mergeCells('A1:F1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'LOGBOOK KEGIATAN MAGANG';
      titleCell.font = { name: 'Arial', size: 14, bold: true };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      worksheet.mergeCells('A2:F2');
      const subtitleCell = worksheet.getCell('A2');
      subtitleCell.value = `PT KERINCI MERANGIN HIDRO - ${session.user.email}`;
      subtitleCell.font = { name: 'Arial', size: 12, bold: true };
      subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      // Set KMH Logo as Faded Center Watermark
      try {
        const fadedBase64 = await new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.globalAlpha = 0.12; // Soft 12% opacity
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl.split(',')[1]);
          };
          img.onerror = reject;
          img.src = '/logo.png';
        });

        const imageId = workbook.addImage({
          base64: fadedBase64,
          extension: 'png',
        });
        
        // Place single centered watermark with natural aspect ratio (B18 to E52)
        worksheet.addImage(imageId, 'B18:E52');
      } catch (e) {
        console.log("Failed to load watermark logo", e);
      }

      // 2. Table Header
      const headerRow = worksheet.getRow(4);
      headerRow.values = [
        'No',
        'Hari / Tanggal',
        'Kegiatan / Aktivitas',
        'Keterangan',
        'Paraf Pembimbing',
        'Dokumentasi'
      ];
      headerRow.height = 30;
      
      headerRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1F4E79' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // 3. Columns Width
      worksheet.columns = [
        { width: 5 },   // A: No
        { width: 25 },  // B: Hari / Tanggal
        { width: 45 },  // C: Kegiatan
        { width: 45 },  // D: Keterangan
        { width: 20 },  // E: Paraf
        { width: 20 }   // F: Dokumentasi
      ];

      // Daftar hari libur nasional selama periode magang
      const HOLIDAY_MAP = {
        '2026-08-17': 'Hari Kemerdekaan RI (HUT RI ke-81)',
        '2026-08-25': 'Maulid Nabi Muhammad SAW',
      };

      // 4. Data Rows
      let currentRowNumber = 5;
      data.forEach((entry, index) => {
        const d = parseISO(entry.date);
        const hariTanggal = format(d, 'EEEE, d MMMM yyyy', { locale: id });
        

        const row = worksheet.getRow(currentRowNumber);
        
        // Col A: No
        row.getCell(1).value = index + 1;
        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
        
        // Col B: Hari / Tanggal
        row.getCell(2).value = hariTanggal;
        row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        
        let activityText = entry.activity || '';
        let descriptionText = entry.description || '';

        // Detect holiday either from DB flag OR from the holiday map
        const isHoliday = entry.is_holiday || !!HOLIDAY_MAP[entry.date];

        if (isHoliday) {
          if (!activityText) activityText = 'LIBUR';
          if (!descriptionText && HOLIDAY_MAP[entry.date]) {
            descriptionText = HOLIDAY_MAP[entry.date];
          }
        }

        // Col C: Kegiatan
        row.getCell(3).value = activityText;
        row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        
        // Col D: Keterangan
        row.getCell(4).value = descriptionText;
        row.getCell(4).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        
        // Col E: Paraf (empty)
        row.getCell(5).value = '';
        
        // Col F: Dokumentasi (Hyperlink)
        if (index < GDRIVE_LINKS.length && GDRIVE_LINKS[index]) {
          const docCell = row.getCell(6);
          docCell.value = {
            text: `📁 Day ${index + 1}`,
            hyperlink: GDRIVE_LINKS[index]
          };
          docCell.font = { name: 'Arial', size: 10, color: { argb: 'FF0563C1' }, underline: true };
          docCell.alignment = { vertical: 'middle', horizontal: 'center' };
        }

        const isFilled = !isHoliday && (activityText.trim() !== '' || descriptionText.trim() !== '');

        // Apply borders and fill for the entire row up to Col F (colNumber 6)
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          if (colNumber > 6) return; // Only style up to column F
          
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          
          if (isHoliday) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFCE4D6' } // Light peach color
            };
          } else if (isFilled) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFEBF1DE' } // Light green color
            };
          }
        });

        currentRowNumber++;
      });

      // 5. Summary Statistics
      const totalDays = data.length;
      const filledDays = data.filter(e => !e.is_holiday && (e.activity?.trim() !== '' || e.description?.trim() !== '')).length;
      const remainingDays = totalDays - filledDays;

      currentRowNumber += 1; // Leave one empty row

      const stat1 = worksheet.getRow(currentRowNumber);
      stat1.getCell(2).value = 'Jumlah Hari Magang Terlaksana';
      stat1.getCell(3).value = filledDays;
      stat1.getCell(2).font = { name: 'Arial', size: 11, bold: true };
      
      const stat2 = worksheet.getRow(currentRowNumber + 1);
      stat2.getCell(2).value = 'Jumlah Hari Tersisa';
      stat2.getCell(3).value = remainingDays;
      stat2.getCell(2).font = { name: 'Arial', size: 11, bold: true };

      const stat3 = worksheet.getRow(currentRowNumber + 2);
      stat3.getCell(2).value = 'Total Hari Magang';
      stat3.getCell(3).value = totalDays;
      stat3.getCell(2).font = { name: 'Arial', size: 11, bold: true };

      // 6. Generate File
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const safeEmail = session.user.email.split('@')[0];
      saveAs(blob, `Logbook_Magang_KMH_${safeEmail}.xlsx`);
    } catch (err) {
      alert("Gagal mengekspor data: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  if (isRecovering) {
    return <ResetPassword onComplete={() => setIsRecovering(false)} />;
  }

  if (!session) {
    return <Auth onLogin={setSession} />;
  }

  return (
    <>
      <div className="bg-photo"></div>

      <nav className="topnav">
        <div className="nav-logo">
          <div className="kmh-mark">
            <img src="/logo.png" alt="Logo KMH" />
          </div>
          <div>
            <div className="nav-brand-main">Logbook Magang</div>
            <div className="nav-brand-sub">PT Kerinci Merangin Hidro</div>
          </div>
        </div>

        <div className="nav-actions">
          <div className="save-pill" id="savePill">
            {isViewer
              ? <><Eye size={14} /> Mode Monitoring</>
              : <><div className="save-dot"></div>Tersimpan</>
            }
          </div>
          
          <div className="profile-menu-container" ref={menuRef} style={{ position: 'relative' }}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'transparent',
                border: 'none', cursor: 'pointer', padding: '0.2rem', textAlign: 'left'
              }}
            >
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'var(--green-50)',
                border: '2px solid var(--green-200)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--green-600)', overflow: 'hidden'
              }}>
                {isViewer ? <Eye size={20} /> : <User size={20} />}
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                  {session.user.email.split('@')[0]}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {isViewer ? 'PENGAWAS' : 'MAHASISWA'}
                </div>
              </div>
              <ChevronDown size={16} color="var(--gray-400)" style={{ transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
            </button>

            {isMenuOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem',
                background: 'white', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                border: '1px solid var(--gray-200)', width: '220px', overflow: 'hidden', zIndex: 1000
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <button 
                    onClick={() => {
                      setCurrentPage('profile');
                      setIsMenuOpen(false);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', padding: '1rem',
                      background: 'none', border: 'none', borderBottom: '1px solid var(--gray-100)',
                      cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: 'var(--gray-700)', textAlign: 'left'
                    }}
                  >
                    <User size={18} /> Profil Saya
                  </button>
                  
                  {!isViewer && (
                    <button 
                      onClick={exportToExcel} disabled={exporting}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', padding: '1rem',
                        background: 'none', border: 'none', borderBottom: '1px solid var(--gray-100)',
                        cursor: exporting ? 'not-allowed' : 'pointer', fontSize: '0.9rem', fontWeight: 600, 
                        color: 'var(--green-600)', textAlign: 'left', opacity: exporting ? 0.6 : 1
                      }}
                    >
                      {exporting ? <Loader2 size={18} className="spin" /> : <FileSpreadsheet size={18} />} 
                      {exporting ? "Menyiapkan..." : "Export Excel"}
                    </button>
                  )}

                  <button 
                    onClick={() => supabase.auth.signOut()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', padding: '1rem',
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, 
                      color: 'var(--danger-text)', textAlign: 'left'
                    }}
                  >
                    <LogOut size={18} /> Keluar Sistem
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {currentPage === 'profile' ? (
        <Profile session={session} isViewer={isViewer} onBack={() => setCurrentPage('dashboard')} />
      ) : (
        <div className="wrapper">
          <CalendarGrid session={session} isViewer={isViewer} />
        </div>
      )}
    </>
  );
}

export default App;