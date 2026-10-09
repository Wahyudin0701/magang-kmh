import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, TabStopType } from 'docx';
import { saveAs } from 'file-saver';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { supabase } from './supabase';
import { getStudentName } from './studentConfig';

export const exportToWord = async (session) => {
  try {
    const { data, error } = await supabase
      .from('logbook_entries')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: true });

    if (error) throw error;

    const studentName = getStudentName(session.user.email);
    const safeName = studentName.replace(/[^a-zA-Z0-9]/g, '_');

    // Headers
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "LAMPIRAN 1. FORMAT LOGBOOK (BUKU CATATAN)",
                  bold: true,
                  size: 24, // 12pt
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 200, after: 400 },
              children: [
                new TextRun({
                  text: "LOGBOOK MAGANG (JUDUL KEGIATAN)",
                  bold: true,
                  size: 24,
                }),
              ],
            }),
            ...createHeaderField("Nama", studentName.toUpperCase()),
            ...createHeaderField("NIM", ""),
            ...createHeaderField("Program Studi", ""),
            ...createHeaderField("Posisi Magang", ""),
            ...createHeaderField("Pembimbing Magang", "Renaldi Yulvianda, M.Kom."),
            ...createHeaderField("Nama Perusahaan Mitra Magang", "PT KERINCI MERANGIN HIDRO"),
            ...createHeaderField("Topik Kegiatan", ""),
            new Paragraph({ spacing: { before: 200 } }),
            createTable(data)
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Logbook_Magang_KMH_${safeName}.docx`);
  } catch (err) {
    throw err;
  }
};

function createHeaderField(label, value) {
  return [
    new Paragraph({
      spacing: { after: 120 },
      tabStops: [
        { type: TabStopType.LEFT, position: 3500 }
      ],
      children: [
        new TextRun({ text: label, size: 24 }),
        new TextRun({ text: "\t: " + value, size: 24 })
      ]
    })
  ];
}

function createTable(data) {
  const tableRows = [];
  
  // Header Row
  tableRows.push(
    new TableRow({
      children: [
        createHeaderCell("No"),
        createHeaderCell("Hari, Tanggal"),
        createHeaderCell("Nama Kegiatan"),
        createHeaderCell("Deskripsi Kegiatan"),
        createHeaderCell("Foto/Video*) (Dokumentasi)"),
        createHeaderCell("Ttd Pembimbing Lapangan"),
      ],
    })
  );

  // Data Rows
  let currentRowNumber = 1;
  const HOLIDAY_MAP = {
    '2026-08-17': 'Hari Kemerdekaan RI (HUT RI ke-81)',
    '2026-08-25': 'Maulid Nabi Muhammad SAW',
  };

  data.forEach((entry) => {
    const d = parseISO(entry.date);
    const hariTanggal = format(d, 'EEEE, d MMMM yyyy', { locale: id });
    
    let activityText = entry.activity || '';
    let descriptionText = entry.description || '';
    const isHoliday = entry.is_holiday || !!HOLIDAY_MAP[entry.date];

    if (isHoliday) {
      if (!activityText) activityText = 'LIBUR';
      if (!descriptionText && HOLIDAY_MAP[entry.date]) {
        descriptionText = HOLIDAY_MAP[entry.date];
      }
    }

    tableRows.push(
      new TableRow({
        children: [
          createDataCell(currentRowNumber.toString(), AlignmentType.CENTER),
          createDataCell(hariTanggal),
          createDataCell(activityText),
          createDataCell(descriptionText),
          createDataCell(""), // Foto/Video dikosongkan
          createDataCell(""), // Ttd dikosongkan
        ],
      })
    );
    currentRowNumber++;
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
    }
  });
}

function createHeaderCell(text) {
  return new TableCell({
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, size: 22 })],
      }),
    ],
  });
}

function createDataCell(text, align = AlignmentType.LEFT) {
  return new TableCell({
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: align,
        children: [new TextRun({ text, size: 22 })],
      }),
    ],
  });
}
