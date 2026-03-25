/**
 * 請假攻略模組
 */
import * as utils from './utils.js';

export class StrategiesManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.strategies = [];
    this.calendar = null;
  }

  setCalendar(calendar) {
    this.calendar = calendar;
  }

  async init() {
    const data = await utils.loadHolidayData();
    if (data) {
      this.strategies = data.strategies;
    }
    this.render();
  }

  render() {
    this.container.innerHTML = '';

    // 依 CP 值排序（請假天數越少，休假天數越多越好）
    const sorted = [...this.strategies].sort((a, b) => {
      // CP 值高的排前面
      if (b.cpValue !== a.cpValue) return b.cpValue - a.cpValue;
      // 總天數多的排前面
      return b.totalDays - a.totalDays;
    });

    sorted.forEach((strategy, index) => {
      const card = this.createStrategyCard(strategy);
      this.container.appendChild(card);
    });
  }

  createStrategyCard(strategy) {
    const card = document.createElement('div');
    card.className = 'strategy-card';
    card.setAttribute('data-strategy-id', strategy.id);

    // 計算 CP 值星星
    const stars = this.getCPStars(strategy.cpValue);

    card.innerHTML = `
      <div class="strategy-card__header">
        <h3 class="strategy-card__title">${strategy.name}</h3>
        ${strategy.laborOnly ? '<span class="strategy-card__badge strategy-card__badge--labor">僅勞工</span>' : ''}
      </div>
      <div class="strategy-card__dates">
        📅 ${utils.formatDate(strategy.startDate, 'M月D日')}(${utils.getDayOfWeek(strategy.startDate)}) ~ ${utils.formatDate(strategy.endDate, 'M月D日')}(${utils.getDayOfWeek(strategy.endDate)})
      </div>
      <div class="strategy-card__stats">
        <div class="strategy-card__stat">
          <span class="strategy-card__stat-value">${strategy.leaveCount}</span>
          <span class="strategy-card__stat-label">請假天數</span>
        </div>
        <div class="strategy-card__stat">
          <span class="strategy-card__stat-value">${strategy.totalDays}</span>
          <span class="strategy-card__stat-label">總休假天數</span>
        </div>
        ${strategy.cpValue > 0 ? `
          <div class="strategy-card__stat">
            <span class="strategy-card__stat-value strategy-card__cp">${stars}</span>
            <span class="strategy-card__stat-label">CP 值</span>
          </div>
        ` : ''}
      </div>
      <p class="strategy-card__description">${strategy.description}</p>
      ${strategy.leaveDays && strategy.leaveDays.length > 0 ? `
        <p class="strategy-card__leave-dates mt-sm" style="font-size: 0.8rem; color: var(--color-accent);">
          💡 建議請假：${strategy.leaveDays.map(d => utils.formatDate(d, 'M月D日')).join('、')}
        </p>
      ` : ''}
    `;

    // 點擊卡片跳轉到行事曆並自動勾選「顯示建議請假日」
    const handleCardClick = () => {
      if (this.calendar) {
        // 移除其他卡片的選中狀態
        this.container.querySelectorAll('.strategy-card').forEach(c => {
          c.classList.remove('strategy-card--selected');
        });
        // 新增目前卡片的選中狀態
        card.classList.add('strategy-card--selected');

        // 自動勾選「顯示建議請假日」
        const checkbox = document.getElementById('showLeaveDays');
        if (checkbox && !checkbox.checked) {
          // 需要手動觸發 change 事件以更新行事曆
          checkbox.checked = true;
          // 觸發 change 事件
          const event = new Event('change');
          checkbox.dispatchEvent(event);
        }
        this.calendar.goToDate(strategy.startDate);
      }
    };

    // 掛載事件與無障礙互動屬性
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.addEventListener('click', handleCardClick);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCardClick();
      }
    });

    return card;
  }

  getCPStars(cpValue) {
    if (cpValue <= 0) return '';
    if (cpValue >= 4) return '⭐⭐⭐⭐⭐';
    if (cpValue >= 3) return '⭐⭐⭐⭐';
    if (cpValue >= 2) return '⭐⭐⭐';
    if (cpValue >= 1) return '⭐⭐';
    return '⭐';
  }

  // 篩選功能（未來擴充用）
  filter(options = {}) {
    let filtered = [...this.strategies];

    if (options.minDays) {
      filtered = filtered.filter(s => s.totalDays >= options.minDays);
    }

    if (options.maxLeaveDays !== undefined) {
      filtered = filtered.filter(s => s.leaveCount <= options.maxLeaveDays);
    }

    if (options.laborOnly === false) {
      filtered = filtered.filter(s => !s.laborOnly);
    }

    this.container.innerHTML = '';
    filtered.forEach(strategy => {
      const card = this.createStrategyCard(strategy);
      this.container.appendChild(card);
    });
  }
}
