/**
 * 工具函式模組
 */

// 日期格式化
function formatDate(date, format = 'YYYY-MM-DD') {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'YYYY/MM/DD':
      return `${year}/${month}/${day}`;
    case 'MM/DD':
      return `${month}/${day}`;
    case 'M月D日':
      return `${d.getMonth() + 1}月${d.getDate()}日`;
    case 'YYYY年M月D日':
      return `${year}年${d.getMonth() + 1}月${d.getDate()}日`;
    case 'ROC':
      return `${year - 1911}年${month}月${day}日`;
    default:
      return `${year}-${month}-${day}`;
  }
}

// 取得星期幾
function getDayOfWeek(date) {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return days[new Date(date).getDay()];
}

// 判斷是否為週末
function isWeekend(date) {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
}

// 計算兩日期間的天數
function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// 產生日期範圍陣列
function getDateRange(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

// 判斷是否為今天
function isToday(date) {
  const today = new Date();
  const d = new Date(date);
  return d.toDateString() === today.toDateString();
}

// 判斷是否為同一個月
function isSameMonth(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
}

// 顯示 Toast 通知
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : '❌'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// LocalStorage 操作
const storage = {
  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage error:', e);
    }
  },
  remove(key) {
    localStorage.removeItem(key);
  }
};

// 深色模式管理
const themeManager = {
  init() {
    const savedTheme = storage.get('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else if (prefersDark) {
      this.setTheme('dark');
    }
    
    this.updateToggleButton();
  },
  
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    storage.set('theme', theme);
    this.updateToggleButton();
  },
  
  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    this.setTheme(current === 'dark' ? 'light' : 'dark');
  },
  
  updateToggleButton() {
    const btn = document.getElementById('themeToggle');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.textContent = isDark ? '☀️' : '🌙';
  }
};

// 解析 CSV 資料
async function parseCSV(url) {
  const response = await fetch(url);
  const text = await response.text();
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, i) => {
      obj[header.trim()] = values[i]?.trim() || '';
    });
    return obj;
  });
}

// 載入假日資料
async function loadHolidayData() {
  try {
    const response = await fetch('data/holidays.json');
    return await response.json();
  } catch (error) {
    console.error('Failed to load holiday data:', error);
    return null;
  }
}

// 產生完整的行事曆資料
async function generateCalendarData() {
  const csvData = await parseCSV('115年中華民國政府行政機關辦公日曆表.csv');
  
  return csvData.map(row => {
    const dateStr = row['西元日期'];
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    
    return {
      date: `${year}-${month}-${day}`,
      dayOfWeek: row['星期'],
      isHoliday: row['是否放假'] === '2',
      note: row['備註'] || ''
    };
  });
}

// 防抖函式
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 匯出給其他模組使用
window.utils = {
  formatDate,
  getDayOfWeek,
  isWeekend,
  daysBetween,
  getDateRange,
  isToday,
  isSameMonth,
  showToast,
  storage,
  themeManager,
  parseCSV,
  loadHolidayData,
  generateCalendarData,
  debounce
};
