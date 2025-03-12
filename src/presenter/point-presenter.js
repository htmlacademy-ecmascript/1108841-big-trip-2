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
  #isEditFormOpen = false;

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
    this.#point = structuredClone(point);

    const prevPointComponent = this.#pointComponent;
    const prevPointEditComponent = this.#pointEditComponent;

    this.#createPointComponent();
    this.#createPointEditComponent();

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
      this.#pointEditComponent.setEventListeners();
    }

    remove(prevPointComponent);
    remove(prevPointEditComponent);
  }

  destroy() {
    remove(this.#pointComponent);
    remove(this.#pointEditComponent);
  }

  resetView() {
    if (this.#isEditFormOpen) {
      this.#createPointComponent();
      this.#closeEditForm();
    }
  }

  setSaving() {
    if (this.#isEditFormOpen) {
      this.#pointEditComponent.updateElement({
        isSaving: true,
        isDisabled: true
      });
    }
  }

  setDeleting() {
    if (this.#isEditFormOpen) {
      this.#pointEditComponent.updateElement({
        isDeleting: true,
        isDisabled: true
      });
    }
  }

  setAborting() {
    if (this.#isEditFormOpen) {
      this.#pointEditComponent.shake(() => {
        this.#pointEditComponent.updateElement({
          isDisabled: false,
          isSaving: false,
          isDeleting: false
        });
      });
    } else {
      this.#pointComponent.shake();
    }
  }

  #createPointComponent() {
    this.#pointComponent = new PointView({
      point: this.#point,
      destinations: this.#destinations,
      offers: this.#offers,
      onClick: this.#openEditForm,
      onFavoriteClick: this.#handleFavoriteClick
    });
  }

  #createPointEditComponent() {
    this.#pointEditComponent = new PointEditView({
      point: this.#point,
      destinations: this.#destinations,
      offers: this.#offers,
      onSubmit: this.#handleFormSubmit,
      onRollupClick: this.#closeEditForm,
      onDeleteClick: this.#handleDeleteClick
    });
  }

  #openEditForm = () => {
    if (!this.#pointEditComponent) {
      this.#createPointEditComponent();
    }

    replace(this.#pointEditComponent, this.#pointComponent);
    this.#pointEditComponent.setEventListeners();
    document.addEventListener('keydown', this.#escKeyDownHandler);
    this.#handleModeChange(this.#point.id);
    this.#isEditFormOpen = true;
  };

  #closeEditForm = () => {
    this.#createPointComponent();

    if (this.#pointEditComponent && this.#pointEditComponent.element && this.#pointEditComponent.element.parentElement) {
      replace(this.#pointComponent, this.#pointEditComponent);
    } else if (this.#pointEditComponent) {
      remove(this.#pointEditComponent);
    }

    this.#pointComponent.setEventListeners();
    document.removeEventListener('keydown', this.#escKeyDownHandler);
    this.#isEditFormOpen = false;

    this.#pointEditComponent = null;
  };

  #closeFormAndRemoveListeners() {
    document.removeEventListener('keydown', this.#escKeyDownHandler);
    this.#isEditFormOpen = false;
  }

  #escKeyDownHandler = (evt) => {
    if (evt.key === 'Escape') {
      evt.preventDefault();
      this.#createPointComponent();
      this.#closeEditForm();
    }
  };

  #handleFormSubmit = (point) => {
    this.#closeFormAndRemoveListeners();

    const updatedPoint = {...point};
    this.#handleDataChange(
      UserAction.UPDATE_POINT,
      UpdateType.MINOR,
      updatedPoint,
    );
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

  #handleDeleteClick = (point) => {
    this.#closeFormAndRemoveListeners();

    this.#handleDataChange(
      UserAction.DELETE_POINT,
      UpdateType.MINOR,
      point,
    );
  };
}
