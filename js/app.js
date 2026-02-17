/**
 * 主應用程式入口
 */
import { CalendarComponent } from './calendar.js';
import { CountdownTimer } from './countdown.js';
import { StrategiesManager } from './strategies.js';
import * as utils from './utils.js';
import * as exportFuncs from './export.js';
import { CONFIG } from './config.js';

// 全域變數
let calendar;
let countdown;
let strategies;

// 綁定匯出與分享功能到 window，以便 HTML 呼叫
window.downloadExcel = exportFuncs.downloadExcel;
window.downloadPDF = exportFuncs.downloadPDF;
window.downloadICal = exportFuncs.downloadICal;
window.downloadPNG = exportFuncs.downloadPNG;
window.shareToLine = exportFuncs.shareToLine;
window.shareToFacebook = exportFuncs.shareToFacebook;
window.copyLink = exportFuncs.copyLink;


// 應用程式初始化
async function initApp() {
    console.log(`🚀 正在初始化 ${CONFIG.YEAR} 請假攻略網站...`);

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

        // 初始化漢堡選單
        initMobileMenu();

        // 匯出全域變數（供除錯用）— 必須在 init 完成後才賦值
        window.calendar = calendar;
        window.countdown = countdown;
        window.strategies = strategies;

        console.log('🎉 應用程式初始化完成！');

    } catch (error) {
        console.error('初始化錯誤:', error);
        // 顯示使用者可見的錯誤提示
        const heroTitle = document.getElementById('nextHolidayName');
        if (heroTitle) {
            heroTitle.textContent = '⚠️ 資料載入失敗';
        }
        const heroDates = document.getElementById('nextHolidayDates');
        if (heroDates) {
            heroDates.textContent = '請重新整理頁面，或確認網路連線';
        }
    }
}

// DOM 載入完成後初始化
document.addEventListener('DOMContentLoaded', initApp);

// 漢堡選單功能
function initMobileMenu() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('overlay');
    const mobileThemeToggle = document.getElementById('mobileThemeToggle');
    const mobileLinks = document.querySelectorAll('.mobile-menu__link');

    // 開啟選單
    hamburgerBtn?.addEventListener('click', () => {
        mobileMenu?.classList.add('mobile-menu--open');
        overlay?.classList.add('overlay--visible');
        document.body.style.overflow = 'hidden';
    });

    // 關閉選單
    function closeMenu() {
        mobileMenu?.classList.remove('mobile-menu--open');
        overlay?.classList.remove('overlay--visible');
        document.body.style.overflow = '';
    }

    closeMenuBtn?.addEventListener('click', closeMenu);
    overlay?.addEventListener('click', closeMenu);

    // 點擊連結後關閉選單
    mobileLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // 手機版主題切換
    mobileThemeToggle?.addEventListener('click', () => {
        utils.themeManager.toggle();
        updateMobileThemeBtn();
    });

    // 初始化手機版主題按鈕狀態
    updateMobileThemeBtn();
}

// 更新手機版主題按鈕文字
function updateMobileThemeBtn() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const mobileThemeIcon = document.getElementById('mobileThemeIcon');
    const mobileThemeText = document.getElementById('mobileThemeText');

    if (mobileThemeIcon) mobileThemeIcon.textContent = isDark ? '☀️' : '🌙';
    if (mobileThemeText) mobileThemeText.textContent = isDark ? '淺色模式' : '深色模式';
}
