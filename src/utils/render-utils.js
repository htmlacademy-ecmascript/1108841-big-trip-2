import { RenderPosition, createElement, replace, remove } from '../framework/render.js';

// Импортируем функцию render как renderOriginal чтобы избежать конфликта имен
import { render as renderOriginal } from '../framework/render.js';

/**
 * Обертка для функции render из фреймворка
 * @param {AbstractView} component - компонент для рендеринга
 * @param {HTMLElement} container - контейнер для рендеринга
 * @param {string} place - позиция для рендеринга
 */
export const render = (component, container, place = 'beforeend') => {
  renderOriginal(component, container, place);
};

// Экспортируем остальные функции без изменений
export { RenderPosition, createElement, replace, remove };
