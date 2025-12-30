import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// Shared hourly slot interface matching backend HourlyDataSlot
interface HourlySlot {
  sanluong: number;
  percentage: number;
  sanluongNew?: number;
  percentageNew?: number;
  rft: number;
  tongKiem: number;
  datLan1: number;
  tongDat: number;
  tongKiemV2?: number;
  tuiChuaTaiChe: number;
  tuiChuaTaiCheNew: number;
  loi1: number;
  loi2: number;
  loi3: number;
  loi4: number;
  loi5: number;
  loi6: number;
  loi7: number;
  loi8: number;
  loi9: number;
  loi10: number;
  loi11: number;
  loi12: number;
  loi13: number;
  loi14: number;
  errorpercentage1: number;
  errorpercentage2: number;
  errorpercentage3: number;
  errorpercentage4: number;
  errorpercentage5: number;
  errorpercentage6: number;
  errorpercentage7: number;
  errorpercentage8: number;
  errorpercentage9: number;
  errorpercentage10: number;
  errorpercentage11: number;
  errorpercentage12: number;
  errorpercentage13: number;
  errorpercentage14: number;
  duLieu?: string; // AI: DỮ LIỆU from ENDLINE_DAILY_SHEET
  nguyenNhan?: string; // AJ: NGUYÊN NHÂN from ENDLINE_DAILY_SHEET
}

// Map chính xác với backend GoogleSheetsProductionDto
export interface ProductionData {
  // Line type identifier
  lineType?: "HTM" | "CD";

  // Thông tin cơ bản (A-E)
  maChuyenLine: string; // A: MÃ CHUYỀN
  nhaMay: string; // B: NHÀ MÁY
  line: string; // C: LINE
  to: string; // D: TỔ
  maHang: string; // E: MÃ HÀNG
  canBoQuanLy?: string; // Additional field: CÁN BỘ QUẢN LÝ

  // Sản lượng và công việc (F-L)
  slth: number; // F: SLTH
  congKh: number; // G: Công KH
  congTh: number; // H: Công TH
  pphKh: number; // I: PPH KH
  pphTh: number; // J: PPH TH
  phanTramHtPph: number; // K: %HT PPH (chuẩn hóa tên theo backend)
  gioSx: number; // L: GIỜ SX
  pphThNew?: number; // TEST: PPH TH NEW (tongDat / Công TH / 8)

  // Nhân lực (M-P)
  ldCoMat: number; // M: LĐ CÓ MẶT
  ldLayout: number; // N: LĐ LAYOUT
  ldHienCo: number; // O: LĐ HIỆN CÓ
  nangSuat: number; // P: NĂNG SUẤT

  // PPH và Target (Q-W)
  pphTarget: number; // Q: PPH TARGET
  pphGiao: number; // R: PPH GIAO
  phanTramGiao: number; // S: %GIAO
  targetNgay: number; // T: TARGET NGÀY
  targetGio: number; // U: TARGET GIỜ
  lkth: number; // V: LKTH
  phanTramHt: number; // W: %HT (chuẩn hóa tên theo backend)

  tongDat: number; // Tổng đạt (mới thêm)
  tongLoi: number; // Tổng lỗi (mới thêm)
  datLan1: number; // Đạt lần 1 (mới thêm)
  tuiChuaTaiChe: number; // Túi chứa tái chế (mới thêm)
  tuiChuaTaiCheNew: number; // Túi chứa tái chế mới (mới thêm)

  thoigianlamviec: number; // Thời gian làm việc (mới thêm)
  tongKiemNew: number; // CM: TỔNG KIỂM NEW
  tongDatNew: number; // CN: TỔNG ĐẠT NEW
  tongLoiNew: number; // CO: TỔNG LỖI NEW

  lktuiloiNew: number;
  percentagePPHNew: number;
  percentageSLTHNew: number;
  diffPercentagePPHNew: number;
  diffPercentageSLTHNew: number;

  // Hourly data object - MUST match backend TV response structure EXACTLY
  hourlyData: {
    // Backend ALWAYS returns this nested structure - DO NOT flatten!
    hourly?: {
      h830?: HourlySlot;
      h930?: HourlySlot;
      h1030?: HourlySlot;
      h1130?: HourlySlot;
      h1330?: HourlySlot;
      h1430?: HourlySlot;
      h1530?: HourlySlot;
      h1630?: HourlySlot;
      h1800?: HourlySlot;
      h1900?: HourlySlot;
      h2000?: HourlySlot;
    };
    cumulative?: {
      h830: number;
      h930: number;
      h1030: number;
      h1130: number;
      h1330: number;
      h1430: number;
      h1530: number;
      h1630: number;
      h1800: number;
      h1900: number;
      h2000: number;
    };
    total?: number;
    latest?: { hour: string; value: number };
  };

  // Thông tin bổ sung (AI-AM)
  lean: string; // AI: LEAN
  phanTram100: number; // AJ: 100% (chuẩn hóa tên)
  t: number; // AK: T
  l: number; // AL: L
  image: string; // AM: IMAGE

  // Chỉ số chất lượng (AN-AS)
  lkkh: number; // AN: LKKH
  bqTargetGio: number; // AO: BQ TARGET GIỜ (chuẩn hóa tên)
  slcl: number; // AP: SLCL
  rft: number; // AQ: RFT
  tongKiem: number; // AR: TỔNG KIỂM
  mucTieuRft: number; // AS: MỤC TIÊU RFT

  // Additional fields (AT-AX)
  lktuiloi: number; // AT: LKTUI LOI
  nhipsx: number; // AU: NHIP SX
  tansuat: number; // AV: TAN SUAT
  tyleloi: number; // AW: TY LE LOI
  QCTarget: number; // BD: QC TARGET

  // Compatibility fields (deprecated, use above fields)
  actual_quantity?: number; // Use slth instead
  targetDay?: number; // Use targetNgay instead

  // Metadata
  // Metadata
  _renderKey?: number;
  _lastUpdate?: number;
  _lastSocketUpdate?: number;

  // Calculated diff/comparison fields
  diffLdCoMatLayout?: number; // 1. Diff ldCoMat vs ldLayout
  diffLkthTarget?: number; // 2. Diff lkth vs targetNgay
  diffRftTarget?: number; // 3. RFT so với 95%
  diffBqTargetSlcl?: number; // 4. bqTargetGio so với slcl
  ratioPphThKh?: number; // 5. Tỷ lệ pphTh/pphKh
  ratioPphThKhNew?: number; // 5. Tỷ lệ pphThNew/pphKh
  diffPhanTramHt100?: number; // 6. %HT so với 100%
  diffPhanTramHtPph100?: number; // 7. %HT PPH so với 100%

  // CD-specific fields (only for CD lines)
  // Removed - not in new CD structure (A-AU)
  loiDinhKeo?: number;
  loiBungKeo?: number;
  loiLang?: number;
  loiDuongMay?: number;
  loiVatTu?: number;
  loiMauKDB?: number;
  loiNhan?: number;
  loiEpNhiet?: number;
  loiFoil?: number;
  loiKhac?: number;

  khCd?: number;
  slthCd?: number;
  slclCd?: number;
  phanTramTienDo?: number;

  phanTramLoiDinhKeo?: number;
  phanTramLoiBungKeo?: number;
  phanTramLoiLang?: number;
  phanTramLoiDuongMay?: number;
  phanTramLoiVatTu?: number;
  phanTramLoiMauKDB?: number;
  phanTramLoiNhan?: number;
  phanTramLoiEpNhiet?: number;
  phanTramLoiFoil?: number;
  phanTramLoiKhac?: number;

  tonBqNgay?: number;
  ngayTon?: number;
  tonMay?: number;
  ngayTonMay?: number;

  kiemNew?: number;
  datNew?: number;

  rftDetail?: {
    rft: number;
    tongKiem: number;
    datLan1: number;
    tongDat: number;
    loiDinhKeo: number;
    loiBungKeo: number;
    loiLang: number;
    loiDuongMay: number;
    loiVatTu: number;
    loiMauKDB: number;
    loiNhan: number;
    loiEpNhiet: number;
    loiFoil: number;
    loiKhac: number;
    targetRft: number;
    phanTramLoiDinhKeo: number;
    phanTramLoiBungKeo: number;
    phanTramLoiLang: number;
    phanTramLoiDuongMay: number;
    phanTramLoiVatTu: number;
    phanTramLoiMauKDB: number;
    phanTramLoiNhan: number;
    phanTramLoiEpNhiet: number;
    phanTramLoiFoil: number;
    phanTramLoiKhac: number;
    lkthCd: number;
    slTuiTongKiem: number;
  };

  // CD new structure fields (AI-AV: index 34-46)
  khGiaoThang?: number; // AM (38): KH GIAO THÁNG
  khbqGQ?: number; // AN (39): KH BQ GQ
  slkh_bqlk?: number; // AO (40): SL KH BQ LK
  slthThang?: number; // AP (41): SL TH THÁNG
  phanTramThang?: number; // AQ (41): % THÁNG
  conlai?: number; // AR (42): CÒN LẠI
  bqCansxNgay?: number; // AS (43): BQ CẦN SX NGÀY
  tglv?: number; // AT (44): TGLV
  ncdv?: number; // AU (45): NCĐV (main row value)
  dbcu?: number; // AV (46): ĐBCỨ (main row value)

  // CD Sub-rows data (NEW) - Each line has multiple sub-rows (teams/products)
  subRows?: Array<{
    tglv: number; // AT (45): TGLV (team number from sheet)
    to: string; // D (3): TỔ (team)
    maHang: string; // E (4): MÃ HÀNG (product code)
    targetNgay: number; // T (19): TARGET NGÀY (daily target)
    targetGio: number; // U (20): TARGET GIỜ (hourly target)
    lkkh: number; // AL (37): LKKH (cumulative plan)
    lkth: number; // V (21): LKTH (cumulative actual)
    ncdv: number; // AU (46): NCĐV (demand)
    dbcu: number; // AV (47): ĐBCỨ (supply commitment)
    phanTramDapUng: number; // AW (48): %ĐÁP ỨNG (response percentage)
    tonMay: number; // AX (49): TỒN MAY (inventory)
    nc1ntt: number; // AY (50): NC1NTT (next day 1)
    nc2ntt: number; // AZ (51): NC2NTT (next day 2)
    nc3ntt: number; // BA (52): NC3NTT (next day 3)
    note: string; // BB (53): NOTE (notes)
    db1ntt: number; // BC (54): ĐB1NTT (special supply 1)
    db2ntt: number; // BD (55): ĐB2NTT (special supply 2)
    db3ntt: number; // BE (56): ĐB3NTT (special supply 3)
    dbNgay: number; // BF (57): DB NGÀY (Daily DB)
  }>;
  ncdvTotal?: number; // Total NCDV (main + sum of sub-rows)
  dbcuTotal?: number; // Total ĐBCỨ (main + sum of sub-rows)
  tonMayTotal?: number; // Total TỒN MAY (sum of sub-rows)
  nc1nttTotal?: number; // Total NC1NTT (sum of sub-rows)
  nc2nttTotal?: number; // Total NC2NTT (sum of sub-rows)
  nc3nttTotal?: number; // Total NC3NTT (sum of sub-rows)
  db1nttTotal?: number; // Total ĐB1NTT (sum of sub-rows)
  db2nttTotal?: number; // Total ĐB2NTT (sum of sub-rows)
  db3nttTotal?: number; // Total ĐB3NTT (sum of sub-rows)
  dbNgayTotal?: number; // Total DB NGÀY (sum of sub-rows)

  // Grouping metadata from backend (NEW)
  groupingRule?: number[][] | null; // e.g., [[6,8], [7,9]] = group T6+T8, T7+T9
}

export interface ProductionLine {
  code: string;
  nhaMay: string;
  line: string;
  to: string;
  percentagePPH: string;
  percentageHT: string;
  rft: string;
  lineType: "HTM" | "CD";
  // QSL data for HTM lines
  qslGroups?: Array<{
    id: number;
    nhaMay: string;
    line: string;
    nhom: string; // Quai/Sơn/Lót
    layout: number;
    tglv: number;
    keHoachGio: number;
    keHoachNgay: number;
    lkKh: number;
    lkTh: number;
    phanTramHt: number;
    [key: string]: any;
  }>;
  qslSummary?: {
    totalGroups: number;
    groups: Array<{
      name: string;
      code: string;
      layout: number;
      coMat: number;
      keHoachNgay: number;
      lkKh: number;
      lkTh: number;
      phanTramHt: number;
    }>;
  };
}

interface ProductionStore {
  // Current data
  data: ProductionData;

  // Production lines data
  productionLines: ProductionLine[];
  linesLoading: boolean;
  linesError: string | null;
  linesLastFetch: number; // Timestamp of last fetch

  // Update methods
  updateData: (newData: Partial<ProductionData>) => void;
  updateField: (field: keyof ProductionData, value: number) => void;

  // Production lines methods
  fetchProductionLines: () => Promise<void>;
  setProductionLines: (lines: ProductionLine[]) => void;
  setLinesLoading: (loading: boolean) => void;
  setLinesError: (error: string | null) => void;

  // Getters for specific fields
  getLKTH: () => number;
  getSLTH: () => number;
  getActualQuantity: () => number;

  // Force refresh
  forceRefresh: () => void;
}

export const useProductionStore = create<ProductionStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial data - chính xác theo backend structure
    data: {
      // Thông tin cơ bản (A-E)
      maChuyenLine: "",
      nhaMay: "",
      line: "",
      to: "",
      maHang: "",
      canBoQuanLy: "",

      // Sản lượng và công việc (F-L)
      slth: 0,
      congKh: 0,
      congTh: 0,
      pphKh: 0,
      pphTh: 0,
      phanTramHtPph: 0,
      gioSx: 0,

      // Nhân lực (M-P)
      ldCoMat: 0,
      ldLayout: 0,
      ldHienCo: 0,
      nangSuat: 0,

      // PPH và Target (Q-W)
      pphTarget: 0,
      pphGiao: 0,
      phanTramGiao: 0,
      targetNgay: 0,
      targetGio: 0,
      lkth: 0,
      phanTramHt: 0,

      // Dữ liệu theo giờ chuẩn hóa (X-AH)
      // h830: 0,
      // h930: 0,
      // h1030: 0,
      // h1130: 0,
      // h1330: 0,
      // h1430: 0,
      // h1530: 0,
      // h1630: 0,
      // h1800: 0,
      // h1900: 0,
      // h2000: 0,
      // percentageh830: 0,
      // percentageh930: 0,
      // percentageh1030: 0,
      // percentageh1130: 0,
      // percentageh1330: 0,
      // percentageh1430: 0,
      // percentageh1530: 0,
      // percentageh1630: 0,
      // percentageh1800: 0,
      // percentageh1900: 0,
      // percentageh2000: 0,

      // Hourly data object - MUST preserve backend nested structure
      hourlyData: {},

      // Thông tin bổ sung (AT-AX)
      lean: "",
      phanTram100: 0,
      t: 0,
      l: 0,
      image: "",

      // Chỉ số chất lượng (AY-BD)
      lkkh: 0,
      bqTargetGio: 0,
      slcl: 0,
      rft: 0,
      tongKiem: 0,
      mucTieuRft: 0,

      // Additional fields (BE-BH)
      lktuiloi: 0,
      nhipsx: 0,
      tansuat: 0,
      tyleloi: 0,
      QCTarget: 0,

      tongDat: 0,
      tongLoi: 0,
      datLan1: 0,
      tuiChuaTaiChe: 0,
      tuiChuaTaiCheNew: 0,

      thoigianlamviec: 0,
      tongKiemNew: 0,
      tongDatNew: 0,
      tongLoiNew: 0,

      // New calculated fields (required by ProductionData)
      lktuiloiNew: 0,
      percentagePPHNew: 0,
      percentageSLTHNew: 0,
      diffPercentagePPHNew: 0,
      diffPercentageSLTHNew: 0,

      // Compatibility fields
      actual_quantity: 0,
      targetDay: 0,

      // Metadata
      _lastUpdate: Date.now(),
      _renderKey: Date.now(),

      // Calculated diff fields
      diffLdCoMatLayout: 0,
      diffLkthTarget: 0,
      diffRftTarget: 0,
      diffBqTargetSlcl: 0,
      ratioPphThKh: 0,
      ratioPphThKhNew: 0,
      diffPhanTramHt100: 0,
      diffPhanTramHtPph100: 0,
    },

    // Production lines state
    productionLines: [],
    linesLoading: false,
    linesError: null,
    linesLastFetch: 0,

    // Update entire dataset
    updateData: (newData) => {
      const currentState = get().data;

      // Shallow comparison - only update if data actually changed
      const hasChanges = Object.keys(newData).some(
        (key) =>
          currentState[key as keyof ProductionData] !==
          newData[key as keyof ProductionData]
      );

      if (!hasChanges) return;

      set((state) => ({
        data: {
          ...state.data,
          ...newData,
          _lastUpdate: Date.now(),
          _renderKey: Date.now(),
        },
      }));
    },

    // Update single field
    updateField: (field, value) => {
      set((state) => ({
        data: {
          ...state.data,
          [field]: value,
          _lastUpdate: Date.now(),
          _renderKey: Date.now(),
        },
      }));
    },

    // Getters
    getLKTH: () => {
      const data = get().data;
      return data.lkth || data.slth || data.actual_quantity || 0;
    },

    getSLTH: () => get().data.slth,

    getActualQuantity: () => get().data.actual_quantity || get().data.slth || 0,

    // Production lines methods
    fetchProductionLines: async () => {
      const state = get();
      const now = Date.now();
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

      // Prevent multiple simultaneous calls
      if (state.linesLoading) {
        return;
      }

      // Use cached data if available and fresh (< 5 minutes old)
      if (
        state.productionLines.length > 0 &&
        now - state.linesLastFetch < CACHE_DURATION
      ) {
        return;
      }

      try {
        set({ linesLoading: true, linesError: null });

        // Import apiService dynamically to avoid circular imports
        const { default: apiService } = await import("../services/api.service");
        const response = await apiService.getProductionLines();

        if (response.success) {
          set({
            productionLines: response.lines,
            linesLoading: false,
            linesError: null,
            linesLastFetch: Date.now(),
          });
        } else {
          throw new Error("Failed to fetch production lines");
        }
      } catch (error) {
        console.error("❌ Error fetching production lines:", error);
        set({
          linesLoading: false,
          linesError: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },

    setProductionLines: (lines) => {
      set({ productionLines: lines });
    },

    setLinesLoading: (loading) => {
      set({ linesLoading: loading });
    },

    setLinesError: (error) => {
      set({ linesError: error });
    },

    // Force refresh all components
    forceRefresh: () => {
      set((state) => ({
        data: {
          ...state.data,
          _renderKey: Date.now(),
        },
      }));
    },
  }))
);
