/**
 * 行事曆元件模組
 */
import { CONFIG } from './config.js';
import * as utils from './utils.js';
import * as lunar from './lunar.js';

export class CalendarComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.monthViewEl = document.getElementById('monthView');
        this.yearViewEl = document.getElementById('yearView');
        this.titleEl = document.getElementById('calendarTitle');
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        this.calendarData = [];
        this.holidays = [];
        this.strategies = [];
        this.leaveDays = new Set();
        this.calendarDataMap = new Map(); // O(1) 日期查詢索引
        this.showLeaveDays = false; // 預設不顯示建議請假日
        this.showLunar = true; // 預設顯示農曆
        // 桌面版預設年度檢視，手機版預設月份檢視
        this.viewMode = window.innerWidth > 768 ? 'year' : 'month';
    }

    async init() {
        // 載入資料
        this.calendarData = await utils.generateCalendarData(CONFIG.DATA_SOURCES.CALENDAR_CSV);
        const holidayData = await utils.loadHolidayData();
        if (holidayData) {
            this.holidays = holidayData.holidays;
            this.strategies = holidayData.strategies;

            // 收集所有建議請假日
            this.strategies.forEach(s => {
                if (s.leaveDays) {
                    s.leaveDays.forEach(d => this.leaveDays.add(d));
                }
            });
        }

        // 建立日期查詢索引 (Map)
        this.calendarData.forEach(d => {
            this.calendarDataMap.set(d.date, d);
        });

        // 初始化檢視模式（同步按鈕狀態和 DOM）
        this.initViewMode();

        this.render();
        this.bindEvents();
    }

    initViewMode() {
        const monthViewBtn = document.getElementById('monthViewBtn');
        const yearViewBtn = document.getElementById('yearViewBtn');

        if (this.viewMode === 'year') {
            monthViewBtn?.classList.remove('view-toggle__btn--active');
            yearViewBtn?.classList.add('view-toggle__btn--active');
            this.monthViewEl?.classList.add('hidden');
            this.yearViewEl?.classList.remove('hidden');
        } else {
            monthViewBtn?.classList.add('view-toggle__btn--active');
            yearViewBtn?.classList.remove('view-toggle__btn--active');
            this.monthViewEl?.classList.remove('hidden');
            this.yearViewEl?.classList.add('hidden');
        }
    }

    bindEvents() {
        document.getElementById('prevMonth').addEventListener('click', () => this.prevMonth());
        document.getElementById('nextMonth').addEventListener('click', () => this.nextMonth());
        document.getElementById('todayBtn').addEventListener('click', () => this.goToToday());

        // 顯示建議請假日開關
        const showLeaveDaysCheckbox = document.getElementById('showLeaveDays');
        if (showLeaveDaysCheckbox) {
            showLeaveDaysCheckbox.addEventListener('change', (e) => {
                this.showLeaveDays = e.target.checked;
                this.render();
            });
        }

        // 顯示農曆開關
        const showLunarCheckbox = document.getElementById('showLunar');
        if (showLunarCheckbox) {
            showLunarCheckbox.addEventListener('change', (e) => {
                this.showLunar = e.target.checked;
                this.render();
            });
        }

        // 檢視模式切換
        const monthViewBtn = document.getElementById('monthViewBtn');
        const yearViewBtn = document.getElementById('yearViewBtn');

        if (monthViewBtn) {
            monthViewBtn.addEventListener('click', () => this.setViewMode('month'));
        }
        if (yearViewBtn) {
            yearViewBtn.addEventListener('click', () => this.setViewMode('year'));
        }
    }

    setViewMode(mode) {
        this.viewMode = mode;

        // 更新按鈕狀態
        const monthViewBtn = document.getElementById('monthViewBtn');
        const yearViewBtn = document.getElementById('yearViewBtn');

        if (mode === 'month') {
            monthViewBtn?.classList.add('view-toggle__btn--active');
            yearViewBtn?.classList.remove('view-toggle__btn--active');
            this.monthViewEl?.classList.remove('hidden');
            this.yearViewEl?.classList.add('hidden');
        } else {
            monthViewBtn?.classList.remove('view-toggle__btn--active');
            yearViewBtn?.classList.add('view-toggle__btn--active');
            this.monthViewEl?.classList.add('hidden');
            this.yearViewEl?.classList.remove('hidden');
        }

        this.render();
    }

    prevMonth() {
        if (this.viewMode === 'year') {
            // 年度檢視不允許切換年份（只限 CONFIG.YEAR 年）
            return;
        } else {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                // 不允許切換到 CONFIG.YEAR 年之前
                this.currentMonth = 0;
            }
        }
        this.render();
    }

    nextMonth() {
        if (this.viewMode === 'year') {
            // 年度檢視不允許切換年份（只限 CONFIG.YEAR 年）
            return;
        } else {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                // 不允許切換到 CONFIG.YEAR 年之後
                this.currentMonth = 11;
            }
        }
        this.render();
    }

    goToToday() {
        const today = new Date();
        // 確保回到 CONFIG.YEAR 的今天，如果今天不在 CONFIG.YEAR，則回到 CONFIG.YEAR 的 1 月
        if (today.getFullYear() === CONFIG.YEAR) {
            this.currentMonth = today.getMonth();
            this.currentYear = today.getFullYear();
        } else {
            this.currentMonth = 0;
            this.currentYear = CONFIG.YEAR;
        }
        this.render();
    }

    render() {
        if (this.viewMode === 'year') {
            this.renderYearView();
        } else {
            this.renderMonthView();
        }
    }

    renderMonthView() {
        // 更新標題
        const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        this.titleEl.textContent = `${CONFIG.YEAR} 年 ${monthNames[this.currentMonth]}`;

        // 清除現有日期（保留表頭）
        const headers = this.container.querySelectorAll('.calendar-grid__header');
        this.container.innerHTML = '';

        const fragment = document.createDocumentFragment();
        headers.forEach(h => fragment.appendChild(h.cloneNode(true)));

        // 取得當月第一天與最後一天
        // 使用 CONFIG.YEAR 確保年份正確
        const firstDay = new Date(CONFIG.YEAR, this.currentMonth, 1);
        const lastDay = new Date(CONFIG.YEAR, this.currentMonth + 1, 0);
        const startDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        // 填充空白日期
        for (let i = 0; i < startDayOfWeek; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'calendar-grid__day calendar-grid__day--empty';
            fragment.appendChild(emptyDiv);
        }

        // 填充日期
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${CONFIG.YEAR}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayData = this.calendarDataMap.get(dateStr);

            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-grid__day';
            dayDiv.setAttribute('data-date', dateStr);

            // 判斷日期類型
            const isHoliday = dayData?.isHoliday;
            const isWeekendDay = utils.isWeekend(dateStr);
            const isTodayDate = utils.isToday(dateStr);
            const isLeaveDay = this.leaveDays.has(dateStr) && this.showLeaveDays; // 只有開啟時才顯示
            const holidayInfo = this.holidays.find(h => h.date === dateStr);

            // 添加樣式類別
            if (isLeaveDay) {
                // 建議請假日（開啟時才顯示）
                dayDiv.classList.add('calendar-grid__day--leave');
            } else if (isTodayDate) {
                dayDiv.classList.add('calendar-grid__day--today');
            } else if (isHoliday || isWeekendDay) {
                // 所有假日與週末統一使用紅色
                dayDiv.classList.add('calendar-grid__day--holiday');
            }

            // 日期數字
            const numberSpan = document.createElement('span');
            numberSpan.className = 'calendar-grid__day-number';
            numberSpan.textContent = day;
            dayDiv.appendChild(numberSpan);

            // 農曆日期
            if (this.showLunar) {
                const lunarData = lunar.getLunarDate(this.currentMonth + 1, day);
                if (lunarData) {
                    const lunarSpan = document.createElement('span');
                    const isImportant = lunar.isImportantFestival(lunarData);
                    const isFirstFifteenth = lunar.isFirstOrFifteenth(lunarData);
                    
                    lunarSpan.className = 'calendar-grid__day-lunar';
                    if (isImportant || isFirstFifteenth) {
                        lunarSpan.classList.add('calendar-grid__day-lunar--important');
                    }
                    
                    let lunarText = lunarData.lunar;
                    if (lunarData.festival) {
                        lunarText = lunarData.festival;
                    }
                    lunarSpan.textContent = lunarText;
                    dayDiv.appendChild(lunarSpan);
                }
            }

            // 節日標籤
            if (dayData?.note || holidayInfo) {
                const labelSpan = document.createElement('span');
                labelSpan.className = 'calendar-grid__day-label';
                labelSpan.textContent = dayData?.note || holidayInfo?.name || '';
                labelSpan.title = dayData?.note || holidayInfo?.name || '';
                dayDiv.appendChild(labelSpan);
            } else if (isLeaveDay) {
                const labelSpan = document.createElement('span');
                labelSpan.className = 'calendar-grid__day-label';
                labelSpan.textContent = '請假';
                labelSpan.style.color = 'var(--color-accent)';
                dayDiv.appendChild(labelSpan);
            }

            // 點擊事件與無障礙支援
            dayDiv.setAttribute('role', 'button');
            dayDiv.setAttribute('tabindex', '0');

            const handleDayAction = () => this.handleDayClick(dateStr, dayData, holidayInfo);
            dayDiv.addEventListener('click', handleDayAction);
            dayDiv.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleDayAction();
                }
            });

            fragment.appendChild(dayDiv);
        }

        this.container.appendChild(fragment);
    }

    renderYearView() {
        // 更新標題
        this.titleEl.textContent = `${CONFIG.YEAR} 年`;

        // 清空年度檢視容器
        this.yearViewEl.innerHTML = '';

        const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        const dayHeaders = ['日', '一', '二', '三', '四', '五', '六'];
        const fragment = document.createDocumentFragment();

        for (let month = 0; month < 12; month++) {
            const monthDiv = document.createElement('div');
            monthDiv.className = 'year-view__month';
            monthDiv.setAttribute('data-month', month);

            // 月份標題
            const titleDiv = document.createElement('div');
            titleDiv.className = 'year-view__month-title';
            titleDiv.textContent = monthNames[month];
            monthDiv.appendChild(titleDiv);

            // 迷你月曆格線
            const gridDiv = document.createElement('div');
            gridDiv.className = 'year-view__mini-grid';

            // 星期表頭
            dayHeaders.forEach(header => {
                const headerDiv = document.createElement('div');
                headerDiv.className = 'year-view__mini-header';
                headerDiv.textContent = header;
                gridDiv.appendChild(headerDiv);
            });

            // 取得當月資料 (使用 CONFIG.YEAR)
            const firstDay = new Date(CONFIG.YEAR, month, 1);
            const lastDay = new Date(CONFIG.YEAR, month + 1, 0);
            const startDayOfWeek = firstDay.getDay();
            const daysInMonth = lastDay.getDate();

            // 空白日期
            for (let i = 0; i < startDayOfWeek; i++) {
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'year-view__mini-day year-view__mini-day--empty';
                emptyDiv.textContent = '.';
                gridDiv.appendChild(emptyDiv);
            }

            // 填充日期
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${CONFIG.YEAR}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayData = this.calendarDataMap.get(dateStr);

                const dayDiv = document.createElement('div');
                dayDiv.className = 'year-view__mini-day';
                dayDiv.textContent = day;

                const isHoliday = dayData?.isHoliday;
                const isWeekendDay = utils.isWeekend(dateStr);
                const isTodayDate = utils.isToday(dateStr);
                const isLeaveDay = this.leaveDays.has(dateStr) && this.showLeaveDays;

                if (isLeaveDay) {
                    dayDiv.classList.add('year-view__mini-day--leave');
                } else if (isTodayDate) {
                    dayDiv.classList.add('year-view__mini-day--today');
                } else if (isHoliday || isWeekendDay) {
                    dayDiv.classList.add('year-view__mini-day--holiday');
                }

                gridDiv.appendChild(dayDiv);
            }

            monthDiv.appendChild(gridDiv);

            // 點擊月份縮圖切換到月份檢視（無障礙支援）
            monthDiv.setAttribute('role', 'button');
            monthDiv.setAttribute('tabindex', '0');

            const changeToMonthView = () => {
                this.currentMonth = month;
                this.setViewMode('month');
            };
            monthDiv.addEventListener('click', changeToMonthView);
            monthDiv.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    changeToMonthView();
                }
            });

            fragment.appendChild(monthDiv);
        }

        this.yearViewEl.appendChild(fragment);
    }

    handleDayClick(dateStr, dayData, holidayInfo) {
        // 找出該日期相關的攻略
        const relatedStrategy = this.strategies.find(s => {
            return dateStr >= s.startDate && dateStr <= s.endDate;
        });

        let message = `📅 ${utils.formatDate(dateStr, 'YYYY年M月D日')} (${utils.getDayOfWeek(dateStr)})`;

        if (dayData?.note) {
            message += `\n🎉 ${dayData.note}`;
        }

        if (this.leaveDays.has(dateStr)) {
            message += '\n💡 建議請假日';
        }

        if (relatedStrategy) {
            message += `\n\n🎯 相關攻略：${relatedStrategy.name}`;
            message += `\n${relatedStrategy.description}`;
        }

        utils.showToast(message.split('\n')[0]);
    }

    // 跳轉到指定日期
    goToDate(dateStr) {
        const date = new Date(dateStr);
        this.currentMonth = date.getMonth();
        this.currentYear = CONFIG.YEAR; // 強制使用 CONFIG.YEAR

        // 如果在年度檢視，切換到月份檢視
        if (this.viewMode === 'year') {
            this.setViewMode('month');
        } else {
            this.render();
        }

        // 高亮動畫
        setTimeout(() => {
            const dayEl = this.container.querySelector(`[data-date="${dateStr}"]`);
            if (dayEl) {
                dayEl.style.animation = 'pulse 0.5s ease 3';
                dayEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }

    // 切換顯示建議請假日
    toggleLeaveDays(show) {
        this.showLeaveDays = show;
        this.render();
    }

    // 切換顯示農曆
    toggleLunar(show) {
        this.showLunar = show;
        this.render();
    }
}
