/**
 * 匯出功能模組
 */

// Excel 匯出
async function downloadExcel() {
    utils.showToast('正在產生 Excel 檔案...');

    try {
        // 使用 SheetJS
        if (typeof XLSX === 'undefined') {
            await loadScript('https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js');
        }

        const calendarData = await utils.generateCalendarData();
        const holidayData = await utils.loadHolidayData();

        // 建立工作簿
        const wb = XLSX.utils.book_new();

        // 工作表 1: 年度行事曆
        const calendarSheet = calendarData.map(d => ({
            '日期': d.date,
            '星期': d.dayOfWeek,
            '類型': d.isHoliday ? '假日' : '工作日',
            '備註': d.note
        }));
        const ws1 = XLSX.utils.json_to_sheet(calendarSheet);
        XLSX.utils.book_append_sheet(wb, ws1, '2026年度行事曆');

        // 工作表 2: 請假攻略
        const strategiesSheet = holidayData.strategies.map(s => ({
            '攻略名稱': s.name,
            '開始日期': s.startDate,
            '結束日期': s.endDate,
            '請假天數': s.leaveCount,
            '總休假天數': s.totalDays,
            'CP值': s.cpValue,
            '建議請假日': s.leaveDays?.join(', ') || '',
            '說明': s.description,
            '備註': s.laborOnly ? '僅勞工適用' : ''
        }));
        const ws2 = XLSX.utils.json_to_sheet(strategiesSheet);
        XLSX.utils.book_append_sheet(wb, ws2, '請假攻略');

        // 下載
        XLSX.writeFile(wb, '2026年請假攻略行事曆.xlsx');
        utils.showToast('Excel 下載成功！', 'success');

    } catch (error) {
        console.error('Excel export error:', error);
        utils.showToast('Excel 下載失敗', 'error');
    }
}

// PDF 匯出
async function downloadPDF() {
    utils.showToast('正在產生 PDF 檔案...');

    try {
        // 使用 jsPDF
        if (typeof jspdf === 'undefined') {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape', 'mm', 'a4');

        // 設定中文字型（使用內建字型，中文可能會有問題）
        doc.setFont('helvetica');

        // 標題
        doc.setFontSize(24);
        doc.text('2026 年度行事曆', 148, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text('民國 115 年請假攻略', 148, 30, { align: 'center' });

        // 簡易版本 - 列出主要連假
        const holidayData = await utils.loadHolidayData();
        let y = 50;

        doc.setFontSize(14);
        doc.text('主要連假攻略:', 20, y);
        y += 10;

        doc.setFontSize(10);
        holidayData.strategies.forEach(s => {
            if (y > 180) {
                doc.addPage();
                y = 20;
            }
            const text = `${s.name}: ${s.startDate} ~ ${s.endDate} (請${s.leaveCount}天休${s.totalDays}天)`;
            doc.text(text, 20, y);
            y += 8;
        });

        // 下載
        doc.save('2026年請假攻略行事曆.pdf');
        utils.showToast('PDF 下載成功！', 'success');

    } catch (error) {
        console.error('PDF export error:', error);
        utils.showToast('PDF 下載失敗', 'error');
    }
}

// iCal 匯出
async function downloadICal() {
    utils.showToast('正在產生 iCal 檔案...');

    try {
        const calendarData = await utils.generateCalendarData();
        const holidayData = await utils.loadHolidayData();

        let icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//TWCalendar//2026 Holiday Calendar//ZH',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:2026年行事曆',
            'X-WR-TIMEZONE:Asia/Taipei'
        ];

        // 添加所有假日事件
        holidayData.holidays.forEach(holiday => {
            const dateStr = holiday.date.replace(/-/g, '');
            const uid = `${dateStr}@twcalendar.local`;

            icsContent.push('BEGIN:VEVENT');
            icsContent.push(`UID:${uid}`);
            icsContent.push(`DTSTART;VALUE=DATE:${dateStr}`);
            icsContent.push(`DTEND;VALUE=DATE:${dateStr}`);
            icsContent.push(`SUMMARY:${holiday.name}`);
            icsContent.push(`DESCRIPTION:${holiday.name} - 國定假日`);
            icsContent.push('TRANSP:TRANSPARENT');
            icsContent.push('END:VEVENT');
        });

        // 添加請假攻略提醒
        holidayData.strategies.forEach(strategy => {
            if (strategy.leaveDays && strategy.leaveDays.length > 0) {
                strategy.leaveDays.forEach(leaveDay => {
                    const dateStr = leaveDay.replace(/-/g, '');
                    const uid = `leave-${dateStr}@twcalendar.local`;

                    icsContent.push('BEGIN:VEVENT');
                    icsContent.push(`UID:${uid}`);
                    icsContent.push(`DTSTART;VALUE=DATE:${dateStr}`);
                    icsContent.push(`DTEND;VALUE=DATE:${dateStr}`);
                    icsContent.push(`SUMMARY:💡 建議請假日`);
                    icsContent.push(`DESCRIPTION:${strategy.name} - ${strategy.description}`);
                    icsContent.push('TRANSP:TRANSPARENT');
                    icsContent.push('END:VEVENT');
                });
            }
        });

        icsContent.push('END:VCALENDAR');

        // 下載
        const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '2026年行事曆.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        utils.showToast('iCal 下載成功！可匯入 Google 日曆或 iPhone', 'success');

    } catch (error) {
        console.error('iCal export error:', error);
        utils.showToast('iCal 下載失敗', 'error');
    }
}

// PNG 匯出
async function downloadPNG() {
    utils.showToast('正在產生圖片...');

    try {
        // 使用 html2canvas
        if (typeof html2canvas === 'undefined') {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        }

        const calendarEl = document.querySelector('.calendar-section');
        const canvas = await html2canvas(calendarEl, {
            backgroundColor: getComputedStyle(document.body).getPropertyValue('--color-bg'),
            scale: 2
        });

        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = '2026年行事曆.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        utils.showToast('圖片下載成功！', 'success');

    } catch (error) {
        console.error('PNG export error:', error);
        utils.showToast('圖片下載失敗', 'error');
    }
}

// 分享功能
function shareToLine() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent('2026年請假攻略！請4天休16天的超長假攻略在這裡 👉');
    window.open(`https://social-plugins.line.me/lineit/share?url=${url}&text=${text}`, '_blank');
}

function shareToFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

function copyLink() {
    navigator.clipboard.writeText(window.location.href)
        .then(() => utils.showToast('連結已複製！', 'success'))
        .catch(() => utils.showToast('複製失敗', 'error'));
}

// 動態載入腳本
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// 匯出到全域
window.downloadExcel = downloadExcel;
window.downloadPDF = downloadPDF;
window.downloadICal = downloadICal;
window.downloadPNG = downloadPNG;
window.shareToLine = shareToLine;
window.shareToFacebook = shareToFacebook;
window.copyLink = copyLink;
