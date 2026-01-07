/**
 * 倒數計時器模組
 */

class CountdownTimer {
    constructor() {
        this.strategies = [];
        this.basicHolidays = []; // 基本連假（不需請假）
        this.leaveStrategies = []; // 請假攻略（需要請假）
        this.currentHoliday = null;
        this.relatedStrategy = null; // 相關請假攻略
        this.intervalId = null;
    }

    async init() {
        const data = await utils.loadHolidayData();
        if (data) {
            this.strategies = data.strategies;

            // 分離基本連假與請假攻略
            this.basicHolidays = this.strategies.filter(s => s.leaveCount === 0);
            this.leaveStrategies = this.strategies.filter(s => s.leaveCount > 0);
        }

        this.findNextHoliday();
        this.startCountdown();
    }

    findNextHoliday() {
        const now = new Date();
        const today = utils.formatDate(now);

        // 只找基本連假（不需請假的）
        this.currentHoliday = this.basicHolidays.find(s => s.startDate > today);

        // 如果找不到，可能今天正在連假中
        if (!this.currentHoliday) {
            this.currentHoliday = this.basicHolidays.find(s => s.startDate <= today && s.endDate >= today);
        }

        // 找出相關的請假攻略（日期範圍有重疊的）
        if (this.currentHoliday) {
            this.relatedStrategy = this.leaveStrategies.find(s => {
                // 檢查日期是否有重疊
                return (s.startDate <= this.currentHoliday.endDate && s.endDate >= this.currentHoliday.startDate);
            });
        }

        this.updateDisplay();
    }

    startCountdown() {
        this.updateCountdown();
        this.intervalId = setInterval(() => this.updateCountdown(), 1000);
    }

    updateCountdown() {
        if (!this.currentHoliday) {
            document.getElementById('nextHolidayName').textContent = '2026 年假期已結束';
            document.getElementById('nextHolidayDates').textContent = '期待明年的假期！';
            return;
        }

        const now = new Date();
        const startDate = new Date(this.currentHoliday.startDate + 'T00:00:00');

        // 判斷是正在進行中還是尚未開始
        if (now >= startDate) {
            // 連假進行中
            this.showInProgress();
        } else {
            // 倒數計時
            this.showCountdown(startDate, now);
        }
    }

    showInProgress() {
        // 移除攻略的 emoji 和特殊標記，只顯示基本節日名稱
        const holidayName = this.currentHoliday.name.replace(/[🏆⚠️⭐]/g, '').trim();
        document.getElementById('nextHolidayName').textContent = `🎉 ${holidayName} 進行中！`;

        const endDate = new Date(this.currentHoliday.endDate + 'T23:59:59');
        const now = new Date();
        const diff = endDate - now;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('countdownDays').textContent = days;
        document.getElementById('countdownHours').textContent = String(hours).padStart(2, '0');
        document.getElementById('countdownMinutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('countdownSeconds').textContent = String(seconds).padStart(2, '0');

        // 更新標籤
        document.querySelector('.hero__badge').textContent = '🎊 連假進行中！';
        document.getElementById('nextHolidayDates').textContent =
            `還有 ${days} 天 ${hours} 小時可以放`;

        // 更新連假資訊
        const infoEl = document.getElementById('holidayInfo');
        infoEl.innerHTML = `📅 ${utils.formatDate(this.currentHoliday.startDate, 'M月D日')}(${utils.getDayOfWeek(this.currentHoliday.startDate)}) ~ ${utils.formatDate(this.currentHoliday.endDate, 'M月D日')}(${utils.getDayOfWeek(this.currentHoliday.endDate)}) 共 ${this.currentHoliday.totalDays} 天`;
    }

    showCountdown(targetDate, now) {
        const diff = targetDate - now;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        // 更新數字
        document.getElementById('countdownDays').textContent = days;
        document.getElementById('countdownHours').textContent = String(hours).padStart(2, '0');
        document.getElementById('countdownMinutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('countdownSeconds').textContent = String(seconds).padStart(2, '0');

        // 如果倒數結束，切換到進行中狀態
        if (diff <= 0) {
            this.showInProgress();
        }
    }

    updateDisplay() {
        if (!this.currentHoliday) return;

        const nameEl = document.getElementById('nextHolidayName');
        const datesEl = document.getElementById('nextHolidayDates');
        const infoEl = document.getElementById('holidayInfo');

        // 移除攻略的 emoji 和特殊標記，只顯示基本節日名稱
        const holidayName = this.currentHoliday.name.replace(/[🏆⚠️⭐]/g, '').trim();
        nameEl.textContent = holidayName;

        datesEl.textContent =
            `${utils.formatDate(this.currentHoliday.startDate, 'M月D日')}(${utils.getDayOfWeek(this.currentHoliday.startDate)}) ~ ${utils.formatDate(this.currentHoliday.endDate, 'M月D日')}(${utils.getDayOfWeek(this.currentHoliday.endDate)})`;

        // 顯示基本連假天數
        let infoHTML = `共 ${this.currentHoliday.totalDays} 天`;

        // 如果有相關請假攻略，顯示可點擊的連結
        if (this.relatedStrategy) {
            infoHTML += `<br><a href="#strategies" class="strategy-link" style="color: var(--color-accent); font-weight: 600; cursor: pointer; text-decoration: underline;">💡 請假攻略：請 ${this.relatedStrategy.leaveCount} 天休 ${this.relatedStrategy.totalDays} 天 →</a>`;
        }

        infoEl.innerHTML = infoHTML;
    }

    destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
}

// 匯出
window.CountdownTimer = CountdownTimer;
