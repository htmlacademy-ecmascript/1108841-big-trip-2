import PointEditView from '../view/point-edit-view.js';
import { render, remove } from '../utils/render-utils.js';
import { UserAction, UpdateType } from '../const.js';

export default class NewPointPresenter {
  #pointEditComponent = null;
  #pointsListContainer = null;
  #destinations = null;
  #offers = null;
  #handleDataChange = null;
  #handleDestroy = null;

  constructor({
    container,
    destinations,
    offers,
    onDataChange,
    onDestroy
  }) {
    this.#pointsListContainer = container;
    this.#destinations = destinations;
    this.#offers = offers;
    this.#handleDataChange = onDataChange;
    this.#handleDestroy = onDestroy;
  }

  init(point) {
    if (this.#pointEditComponent !== null) {
      return;
    }

    this.#pointEditComponent = new PointEditView({
      point,
      destinations: this.#destinations,
      offers: this.#offers,
      onSubmit: this.#handleFormSubmit,
      onRollupClick: this.#handleFormClose,
      onDeleteClick: this.#handleFormClose
    });

    render(this.#pointEditComponent, this.#pointsListContainer, 'afterbegin');
    document.addEventListener('keydown', this.#escKeyDownHandler);
  }

  destroy() {
    if (this.#pointEditComponent === null) {
      return;
    }

    this.#handleDestroy();

    remove(this.#pointEditComponent);
    this.#pointEditComponent = null;

    document.removeEventListener('keydown', this.#escKeyDownHandler);
  }

  setSaving() {
    if (this.#pointEditComponent) {
      this.#pointEditComponent.updateElement({
        isSaving: true,
        isDisabled: true
      });
    }
  }

  setAborting() {
    const resetFormState = () => {
      this.#pointEditComponent.updateElement({
        isDisabled: false,
        isSaving: false,
        isDeleting: false
      });
    };

    // Добавляем анимацию "качания головой" для формы
    this.#pointEditComponent.shake(resetFormState);
  }

  setDisabled() {
    if (this.#pointEditComponent) {
      this.#pointEditComponent.updateElement({
        isDisabled: true
      });
    }
  }

  setEnabled() {
    if (this.#pointEditComponent) {
      this.#pointEditComponent.updateElement({
        isDisabled: false
      });
    }
  }

  #handleFormSubmit = (point) => {
    this.#handleDataChange(
      UserAction.ADD_POINT,
      UpdateType.MINOR,
      point,
    );
  };

  #handleFormClose = () => {
    this.destroy();
  };

  #escKeyDownHandler = (evt) => {
    if (evt.key === 'Escape' || evt.key === 'Esc') {
      evt.preventDefault();
      this.destroy();
    }
  };
}
