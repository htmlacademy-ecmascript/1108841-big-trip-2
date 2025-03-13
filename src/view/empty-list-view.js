import AbstractView from '../framework/view/abstract-view.js';
import { FilterType } from '../const.js';

const NoPointsTextType = {
  [FilterType.EVERYTHING]: 'Click New Event to create your first point',
  [FilterType.FUTURE]: 'There are no future events now',
  [FilterType.PRESENT]: 'There are no present events now',
  [FilterType.PAST]: 'There are no past events now',
};

function createEmptyListTemplate(filterType, isCreating) {
  const noPointsTextValue = NoPointsTextType[filterType];

  return `<p class="trip-events__msg ${isCreating ? 'trip-events__msg--creating' : ''}">
    ${isCreating ? 'Creating a new point...' : noPointsTextValue}
  </p>`;
}

export default class EmptyListView extends AbstractView {
  #filterType = null;
  #isCreating = false;

  constructor({filterType, isCreating = false}) {
    super();
    this.#filterType = filterType;
    this.#isCreating = isCreating;

    // Добавляем стили для сообщения о пустом списке
    this.#addStyles();
  }

  get template() {
    return createEmptyListTemplate(this.#filterType, this.#isCreating);
  }

  #addStyles() {
    // Проверяем, существует ли уже стиль
    const existingStyle = document.getElementById('empty-list-styles');
    if (existingStyle) {
      return;
    }

    // Создаем элемент стиля
    const style = document.createElement('style');
    style.id = 'empty-list-styles';
    style.textContent = `
      .trip-events__msg {
        padding: 20px;
        margin: 20px 0;
        text-align: center;
        font-size: 18px;
        color: #333;
        background-color: #f9f9f9;
        border-radius: 8px;
        border: 1px solid #e0e0e0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        animation: fadeIn 0.5s ease-in-out;
        transition: all 0.3s ease;
      }

      .trip-events__msg--creating {
        background-color: #e8f5e9;
        border-color: #c8e6c9;
        color: #2e7d32;
        animation: pulse 2s infinite;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.4); }
        70% { box-shadow: 0 0 0 10px rgba(46, 125, 50, 0); }
        100% { box-shadow: 0 0 0 0 rgba(46, 125, 50, 0); }
      }
    `;

    // Добавляем стиль в head
    document.head.appendChild(style);
  }
}
