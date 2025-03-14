import AbstractView from './view/abstract-view.js';

/** @enum {string} Перечисление возможных позиций для отрисовки */
const RenderPosition = {
  BEFOREBEGIN: 'beforebegin',
  AFTERBEGIN: 'afterbegin',
  BEFOREEND: 'beforeend',
  AFTEREND: 'afterend',
};

/**
 * Функция для создания элемента на основе разметки
 * @param {string} template Разметка в виде строки
 * @returns {HTMLElement} Созданный элемент
 */
function createElement(template) {
  const newElement = document.createElement('div');
  newElement.innerHTML = template;

  return newElement.firstElementChild;
}

/**
 * Функция для рендеринга элемента
 * @param {AbstractView} component - компонент, который должен быть отрендерен
 * @param {HTMLElement} container - элемент в DOM, куда должен быть отрендерен компонент
 * @param {string} place - позиция компонента относительно контейнера: 'beforebegin', 'afterbegin', 'beforeend', 'afterend'
 */
const render = (component, container, place = 'beforeend') => {
  const element = component.element;

  const renderPositions = {
    'beforebegin': () => container.before(element),
    'afterbegin': () => container.prepend(element),
    'beforeend': () => container.append(element),
    'afterend': () => container.after(element)
  };

  const renderMethod = renderPositions[place];
  if (renderMethod) {
    renderMethod();
  }

  // Проверяем, успешно ли добавлен элемент
  setTimeout(() => {
    if (!element.isConnected) {
      // Элемент не был подключен к DOM после рендеринга
    }
  }, 0);
};

/**
 * Функция для замены одного компонента на другой
 * @param {AbstractView} newComponent Компонент, который нужно показать
 * @param {AbstractView} oldComponent Компонент, который нужно скрыть
 */
function replace(newComponent, oldComponent) {
  if (!(newComponent instanceof AbstractView && oldComponent instanceof AbstractView)) {
    throw new Error('Can replace only components');
  }

  const newElement = newComponent.element;
  const oldElement = oldComponent.element;

  const parent = oldElement.parentElement;

  if (parent === null) {
    throw new Error('Parent element doesn\'t exist');
  }

  parent.replaceChild(newElement, oldElement);
}

/**
 * Функция для удаления компонента
 * @param {AbstractView} component Компонент, который нужно удалить
 */
function remove(component) {
  if (component === null) {
    return;
  }

  if (!(component instanceof AbstractView)) {
    throw new Error('Can remove only components');
  }

  component.element.remove();
  component.removeElement();
}

export {RenderPosition, createElement, render, replace, remove};
