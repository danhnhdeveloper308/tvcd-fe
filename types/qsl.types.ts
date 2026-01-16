// QSL Types - Matching backend QSLSheetsService

export interface QSLHourlyData {
  h8h30: number;
  h9h30: number;
  h10h30: number;
  h11h30: number;
  h13h30: number;
  h14h30: number;
  h15h30: number;
  h16h30: number;
  h18h: number;
  h19h: number;
  h20h: number;
}

export interface QSLGroup {
  nhom: string; // NHÓM: ĐÓNG GÓI, QC KIỂM TÚI, RÁP, THÂN, LÓT, QC KIỂM QUAI, QUAI, SƠN CT/BTP
  ldLayout: number; // LĐ LAYOUT
  thucTe: number; // THỰC TẾ
  keHoach: number; // KẾ HOẠCH
  hourly: QSLHourlyData; // Hourly data (8H30 - 20H)
  luyKeThucHien: number; // LUỸ KẾ THỰC HIỆN
  luyKeKeHoach: number; // LUỸ KẾ KẾ HOẠCH
  percentHT: number; // %HT (Phần trăm hoàn thành)
}

export interface QSLTeam {
  tenTo: string; // TÊN TỔ (TỔ 1, TỔ 2...)
  tglv: number; // TGLV (Thời gian làm việc - số nhóm)
  fixedGroups: QSLGroup[]; // 8 dòng cố định (ĐÓNG GÓI, QC KIỂM TÚI, RÁP, THÂN, LÓT, QC KIỂM QUAI, QUAI, SƠN CT/BTP)
  tuiNhoGroups: QSLGroup[]; // TÚI NHỎ groups (nếu có, Kế hoạch > 0)
}

export interface QSLData {
  line: number; // Line number (1, 2, 3, 4...)
  sheetName: string; // Sheet name (LINE1, LINE2, LINE3, LINE4...)
  totalTeams: number; // Total teams count
  teams: QSLTeam[]; // Teams array
  lastUpdate: string; // ISO timestamp
}

export interface QSLAPIResponse {
  success: boolean;
  data: QSLData;
  timestamp: string;
  _debug?: any;
}

// WebSocket update structure
export interface QSLWebSocketUpdate {
  line: number;
  type: "new" | "updated";
  data: QSLData;
  changes?: {
    teamsAdded: string[];
    teamsRemoved: string[];
    teamsModified: string[];
  };
  timestamp: string;
  _debug?: any;
}
