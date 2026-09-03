import React, { useState, useEffect } from "react";
import "./index.css";
import Auth from "./components/Auth";
import CalendarGrid from "./components/CalendarGrid";
import { supabase } from "./lib/supabase";
import { VIEWER_EMAILS } from "./lib/viewerConfig";
import { LogOut, FileSpreadsheet, Calendar, CheckCircle2, Clock, Loader2, Eye } from "lucide-react";

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
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
      subtitleCell.value = 'PT KERINCI MERANGIN HIDRO';
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
      saveAs(blob, 'Logbook_Magang_KMH.xlsx');
    } catch (err) {
      alert("Gagal mengekspor data: " + err.message);
    } finally {
      setExporting(false);
    }
  };

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
          {!isViewer && (
            <button className="btn btn-green" id="btnExport" onClick={exportToExcel} disabled={exporting}>
              {exporting ? <Loader2 size={16} className="spin" /> : <FileSpreadsheet size={16} />}
              <span className="btn-text">{exporting ? "Menyiapkan..." : "Export Excel"}</span>
            </button>
          )}
          <button className="btn btn-outline" id="btnLogout" onClick={() => supabase.auth.signOut()}>
            <LogOut size={16} />
            <span className="btn-text">Logout</span>
          </button>
        </div>
      </nav>

      <div className="wrapper">
        <CalendarGrid session={session} isViewer={isViewer} />
      </div>
    </>
  );
}

export default App;