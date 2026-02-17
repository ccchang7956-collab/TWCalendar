/**
 * 專案全域設定檔
 */
export const CONFIG = {
  // 年份設定
  YEAR: 2026,
  ROC_YEAR: 115,

  // 日期範圍（用於邊界檢查）
  DATE_RANGE: {
    START: '2026-01-01',
    END: '2026-12-31'
  },

  // 資料來源
  DATA_SOURCES: {
    HOLIDAYS_JSON: 'data/holidays.json',
    CALENDAR_CSV: '115年中華民國政府行政機關辦公日曆表.csv'
  },

  // Google Analytics ID
  GA_ID: 'G-2NHHHZPTKC'
};
