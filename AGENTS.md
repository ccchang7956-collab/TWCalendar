# AGENTS.md - TWCalendar 專案指南

## 專案概述

這是一個靜態 vanilla JavaScript 網站，用於顯示台灣政府行政機關辦公日曆和請假攻略。專案為 PWA，可離線使用。

## 執行方式

此專案為靜態網站，無需建置流程：

- 開發時使用任意本地伺服器（如 `python -m http.server 8000` 或 VS Code Live Server）
- 部署時直接將檔案複製到網頁伺服器即可

## 資料結構

### js/ 目錄

| 檔案 | 用途 |
|------|------|
| `config.js` | 全域設定（年份、資料來源等） |
| `utils.js` | 工具函式（日期格式化、LocalStorage、CSV 解析等） |
| `calendar.js` | 行事曆元件（月份/年度檢視切換） |
| `strategies.js` | 請假攻略管理（CP 值排序顯示） |
| `countdown.js` | 倒數計時器 |
| `export.js` | 匯出功能（Excel、PDF、iCal、PNG） |
| `app.js` | 主應用程式入口 |

### data/ 目錄

- `holidays.json` - 假日與請假攻略資料

### 其他根目錄檔案

- `sw.js` - Service Worker（PWA 離線快取）
- `manifest.json` - PWA 資訊清單

## 程式碼風格規範

### 縮排與格式

- 使用 4 空格縮排（不使用 Tab）
- 大括號风格：`if (...) {\n    ...\n}`（K&R 风格）
- 每行不超過 120 字元

### 命名規範

- 類別名稱：PascalCase（如 `CalendarComponent`）
- 函式與變數：camelCase（如 `initApp`、`calendarData`）
- 常數：全大寫加底線（如 `CONFIG.YEAR`）
- CSS 类名：BEM 命名（如 `calendar-grid__day--holiday`）
- 檔案名稱：kebab-case（如 `app.js`、`index.css`）

### 模組導入導出

```javascript
// 導入
import { CalendarComponent } from './calendar.js';
import * as utils from './utils.js';

// 導出
export class MyClass { }
export function myFunction() { }
export const CONSTANT = value;
```

### 註解規範

- 檔案開頭需有中文模組說明（必填）
- 函式需有中文用途說明（必填）
- 複雜邏輯可添加行內註解

```javascript
/**
 * 請假攻略模組
 */
import * as utils from './utils.js';

export class StrategiesManager {
    /**
     * 初始化攻略資料
     */
    async init() { }
}
```

### 類別設計

- 使用 ES6 Class 語法
- 建構子傳入 DOM 元素 ID
- 方法使用 async/await 處理非同步
- 公開方法放在前面，私有方法放在後面

```javascript
export class CalendarComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    async init() { }

    render() { }
}
```

### 錯誤處理

- 使用 try/catch 包裹非同步操作
- 錯誤時記錄 console.error 並顯示使用者訊息
- 使用 utils.showToast() 顯示錯誤提示

```javascript
try {
    const data = await utils.loadHolidayData();
    this.holidays = data.holidays;
} catch (error) {
    console.error('Failed to load holiday data:', error);
    utils.showToast('資料載入失敗', 'error');
}
```

### CSS 規範

- 使用 CSS 自訂屬性（Variables）管理顏色
- BEM 命名法：`區塊__元素--修飾符`
- 深色模式使用 `data-theme` 屬性

```css
.calendar-grid__day--holiday {
    color: var(--color-holiday);
}
```

## Service Worker 快取策略

sw.js 採用混合策略：

1. **Network First** - 導航請求、.json/.csv/.txt 檔案（確保最新資料）
2. **Cache First** - 靜態資源（HTML、CSS、JS、圖示）

更新版本需修改 `CACHE_NAME` 常數。

## PWA 更新流程

1. 修改 sw.js 中的 `CACHE_NAME` 版本號
2. 更新 Service Worker 後，使用 `self.skipWaiting()` 強制立即接管
3. 使用 `self.clients.claim()` 讓現有頁面立即取得控制權

## 注意事項

- 此專案無單元測試、無 Lint 工具
- 修改 config.js 中的 `YEAR` 需同步更新 CSV 檔案
- 生產環境部署時確保 GA_ID 正確