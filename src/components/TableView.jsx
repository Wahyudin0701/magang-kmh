import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { CheckCircle2, Circle } from "lucide-react";

export default function TableView({ entries, onSelectEntry, isViewer }) {
  const [filterMonth, setFilterMonth] = useState("all");

  const monthOptions = [...new Set(
    entries.map(e => format(parseISO(e.date), "yyyy-MM"))
  )].map(ym => ({
    value: ym,
    label: format(parseISO(ym + "-01"), "MMMM yyyy", { locale: id })
  }));

  const filtered = filterMonth === "all"
    ? entries
    : entries.filter(e => format(parseISO(e.date), "yyyy-MM") === filterMonth);

  const getRowStatus = (entry) => {
    if (entry.is_holiday) return "holiday";
    if (entry.activity?.trim() || entry.description?.trim()) return "filled";
    return "empty";
  };

  const filledCount = entries.filter(e => !e.is_holiday && (e.activity?.trim() || e.description?.trim())).length;
  const totalNonHoliday = entries.filter(e => !e.is_holiday).length;

  return (
    <div className="table-view-wrapper">
      <div className="table-toolbar">
        <div className="table-toolbar-left">
          <span className="table-summary">
            <CheckCircle2 size={14} style={{ color: "var(--green-600)" }} />
            <strong>{filledCount}</strong> dari <strong>{totalNonHoliday}</strong> hari terisi
          </span>
        </div>
        <div className="table-toolbar-right">
          <label className="table-filter-label">Filter Bulan:</label>
          <select
            className="table-filter-select"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
          >
            <option value="all">Semua Bulan</option>
            {monthOptions.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-scroll">
        <table className="logbook-table">
          <thead>
            <tr>
              <th style={{ width: "60px" }}>No</th>
              <th style={{ width: "160px" }}>Hari / Tanggal</th>
              <th>Kegiatan Harian</th>
              <th>Keterangan / Hasil</th>
              <th style={{ width: "110px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => {
              const dayIndex = entries.findIndex(e => e.id === entry.id);
              const status = getRowStatus(entry);
              const d = parseISO(entry.date);

              return (
                <tr
                  key={entry.id}
                  className={"logbook-row logbook-row--" + status}
                  onClick={() => {
                    if (isViewer || !entry.is_holiday) onSelectEntry(entry);
                  }}
                  style={{ cursor: entry.is_holiday && !isViewer ? "default" : "pointer" }}
                >
                  <td className="td-no">
                    <span className="day-badge">Day {dayIndex + 1}</span>
                  </td>
                  <td className="td-date">
                    <div className="td-day-name">{format(d, "EEEE", { locale: id })}</div>
                    <div className="td-date-str">{format(d, "d MMM yyyy", { locale: id })}</div>
                  </td>
                  <td className="td-content">
                    {entry.is_holiday
                      ? <span className="holiday-label">🎉 {entry.holiday_name || "Hari Libur"}</span>
                      : <span className="cell-truncate">{entry.activity?.trim() || <span className="cell-empty">—</span>}</span>
                    }
                  </td>
                  <td className="td-content">
                    {entry.is_holiday
                      ? <span className="cell-empty">—</span>
                      : <span className="cell-truncate">{entry.description?.trim() || <span className="cell-empty">—</span>}</span>
                    }
                  </td>
                  <td className="td-status">
                    {status === "filled" && (
                      <span className="status-badge status-filled">
                        <CheckCircle2 size={12} /> Terisi
                      </span>
                    )}
                    {status === "empty" && (
                      <span className="status-badge status-empty">
                        <Circle size={12} /> Kosong
                      </span>
                    )}
                    {status === "holiday" && (
                      <span className="status-badge status-holiday">
                        🎉 Libur
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="table-empty">Tidak ada data untuk bulan ini.</div>
        )}
      </div>
    </div>
  );
}
