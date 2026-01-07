/**
 * 主應用程式入口
 */

// 全域變數
let calendar;
let countdown;
let strategies;

// 應用程式初始化
async function initApp() {
    console.log('🚀 正在初始化 2026 請假攻略網站...');

    try {
        // 初始化深色模式
        utils.themeManager.init();

        // 綁定主題切換按鈕
        document.getElementById('themeToggle').addEventListener('click', () => {
            utils.themeManager.toggle();
        });

        // 初始化行事曆
        calendar = new CalendarComponent('calendarGrid');
        await calendar.init();
        console.log('✅ 行事曆已載入');

        // 初始化倒數計時器
        countdown = new CountdownTimer();
        await countdown.init();
        console.log('✅ 倒數計時器已啟動');

        // 初始化請假攻略
        strategies = new StrategiesManager('strategiesContainer');
        strategies.setCalendar(calendar);
        await strategies.init();
        console.log('✅ 請假攻略已載入');

        // 平滑滾動導覽
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // 註冊 Service Worker (PWA)
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('sw.js');
                console.log('✅ Service Worker 已註冊');
            } catch (error) {
                console.log('Service Worker 註冊失敗:', error);
            }
        }

        console.log('🎉 應用程式初始化完成！');

    } catch (error) {
        console.error('初始化錯誤:', error);
    }
}

// DOM 載入完成後初始化
document.addEventListener('DOMContentLoaded', initApp);

// 匯出
window.calendar = calendar;
window.countdown = countdown;
window.strategies = strategies;
