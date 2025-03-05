import PointView from '../view/point-view.js';
import PointEditView from '../view/point-edit-view.js';
import { render, replace, remove } from '../framework/render.js';
import { UserAction, UpdateType } from '../const.js';

export default class PointPresenter {
  #pointComponent = null;
  #pointEditComponent = null;
  #point = null;
  #container = null;
  #destinations = null;
  #offers = null;
  #handleDataChange = null;
  #handleModeChange = null;

  constructor({
    container,
    destinations,
    offers,
    onDataChange,
    onModeChange
  }) {
    this.#container = container;
    this.#destinations = destinations;
    this.#offers = offers;
    this.#handleDataChange = onDataChange;
    this.#handleModeChange = onModeChange;
  }

  init(point) {
    this.#point = point;

    const prevPointComponent = this.#pointComponent;
    const prevPointEditComponent = this.#pointEditComponent;

    this.#pointComponent = new PointView({
      point: this.#point,
      destinations: this.#destinations,
      offers: this.#offers,
      onClick: this.#handlePointClick,
      onFavoriteClick: this.#handleFavoriteClick
    });

    this.#pointEditComponent = new PointEditView({
      point: this.#point,
      destinations: this.#destinations,
      offers: this.#offers,
      onSubmit: this.#handleFormSubmit,
      onRollupClick: this.#handleFormRollupClick,
      onDeleteClick: this.#handleDeleteClick
    });

    if (prevPointComponent === null || prevPointEditComponent === null) {
      render(this.#pointComponent, this.#container);
      this.#pointComponent.setEventListeners();
      return;
    }

    if (this.#container.contains(prevPointComponent.element)) {
      replace(this.#pointComponent, prevPointComponent);
      this.#pointComponent.setEventListeners();
    }

    if (this.#container.contains(prevPointEditComponent.element)) {
      replace(this.#pointEditComponent, prevPointEditComponent);
    }

    remove(prevPointComponent);
    remove(prevPointEditComponent);
  }

  destroy() {
    remove(this.#pointComponent);
    remove(this.#pointEditComponent);
  }

  resetView() {
    if (this.#pointEditComponent && this.#pointEditComponent.element &&
        this.#pointEditComponent.element.parentElement) {

      // Используем прямой подход без вызова ModeChange
      const prevPointComponent = this.#pointComponent;

      // Создаем новый компонент точки
      this.#pointComponent = new PointView({
        point: this.#point,
        destinations: this.#destinations,
        offers: this.#offers,
        onClick: this.#handlePointClick,
        onFavoriteClick: this.#handleFavoriteClick
      });

      // Заменяем форму на точку
      replace(this.#pointComponent, this.#pointEditComponent);
      this.#pointComponent.setEventListeners();

      // Удаляем старый компонент
      if (prevPointComponent) {
        remove(prevPointComponent);
      }

      document.removeEventListener('keydown', this.#escKeyDownHandler);
    }

    // Убедимся, что точка отображается
    if (this.#pointComponent && !this.#pointComponent.element.parentElement &&
        this.#point) {
      render(this.#pointComponent, this.#container);
      this.#pointComponent.setEventListeners();
    }
  }

  #replacePointToForm() {
    replace(this.#pointEditComponent, this.#pointComponent);
    this.#pointEditComponent.setEventListeners();
    document.addEventListener('keydown', this.#escKeyDownHandler);

    // Вызываем handleModeChange для уведомления о редактировании точки
    this.#handleModeChange(this.#point.id);
  }

  #handleFormRollupClick = () => {
    // Закрываем форму
    replace(this.#pointComponent, this.#pointEditComponent);
    this.#pointComponent.setEventListeners();
    document.removeEventListener('keydown', this.#escKeyDownHandler);

    // Уведомляем BoardPresenter о закрытии формы
    this.#handleDataChange(
      UserAction.UPDATE_POINT,
      UpdateType.MINOR,
      this.#point
    );
  };

  #escKeyDownHandler = (evt) => {
    if (evt.key === 'Escape') {
      evt.preventDefault();
      // Закрываем форму
      replace(this.#pointComponent, this.#pointEditComponent);
      this.#pointComponent.setEventListeners();
      document.removeEventListener('keydown', this.#escKeyDownHandler);

      // Уведомляем BoardPresenter о закрытии формы
      this.#handleDataChange(
        UserAction.UPDATE_POINT,
        UpdateType.MINOR,
        this.#point
      );
    }
  };

  #handlePointClick = () => {
    this.#replacePointToForm();
  };

  #handleFavoriteClick = () => {
    const updatedPoint = {
      ...this.#point,
      isFavorite: !this.#point.isFavorite
    };

    this.#handleDataChange(
      UserAction.UPDATE_POINT,
      UpdateType.MINOR,
      updatedPoint
    );
  };

  #handleFormSubmit = (update) => {
    this.#handleDataChange(
      UserAction.UPDATE_POINT,
      UpdateType.MINOR,
      update
    );
  };

  #handleDeleteClick = (point) => {
    this.#handleDataChange(
      UserAction.DELETE_POINT,
      UpdateType.MINOR,
      point
    );
  };

  // Метод для установки состояния "Сохранение"
  setSaving() {
    if (this.#pointEditComponent) {
      // Проверяем, что форма еще присутствует в DOM
      if (this.#pointEditComponent.element.parentElement) {
        this.#pointEditComponent.updateElement({
          isSaving: true,
          isDisabled: true
        });
      } else {
        throw new Error('Form is not in DOM');
      }
    }
  }

  // Метод для установки состояния "Удаление"
  setDeleting() {
    if (this.#pointEditComponent) {
      // Проверяем, что форма еще присутствует в DOM
      if (this.#pointEditComponent.element.parentElement) {
        this.#pointEditComponent.updateElement({
          isDeleting: true,
          isDisabled: true
        });
      } else {
        throw new Error('Form is not in DOM');
      }
    }
  }

  // Метод для сброса состояния формы при ошибке
  setAborting() {
    const resetFormState = () => {
      if (this.#pointEditComponent) {
        // Проверяем, что форма еще присутствует в DOM
        if (this.#pointEditComponent.element.parentElement) {
          this.#pointEditComponent.updateElement({
            isDisabled: false,
            isSaving: false,
            isDeleting: false
          });
        }
      } else if (this.#pointComponent) {
        this.#pointComponent.shake();
      }
    };

    this.#pointComponent.shake(resetFormState);
  }
}
