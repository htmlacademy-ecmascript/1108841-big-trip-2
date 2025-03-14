import PointView from '../view/point-view.js';
import { render, replace, remove } from '../utils/render-utils.js';
import PointEditView from '../view/point-edit-view.js';
import { UserAction, UpdateType } from '../const.js';
import {
  isEscapeKey,
  addKeydownHandler,
  removeKeydownHandler,
  setComponentSaving,
  setComponentDeleting,
  setComponentAborting
} from '../utils/common.js';

export default class PointPresenter {
  #pointComponent = null;
  #pointEditComponent = null;
  #pointsListContainer = null;
  #destinations = null;
  #offers = null;
  #handleDataChange = null;
  #handleModeChange = null;
  #point = null;
  #isEditFormOpen = false;
  constructor({
    container,
    destinations,
    offers,
    onDataChange,
    onModeChange
  }) {
    this.#pointsListContainer = container;
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
      onRollupClick: this.#handleEditClick,
      onFavoriteClick: this.#handleFavoriteClick
    });
    this.#pointEditComponent = new PointEditView({
      point: this.#point,
      destinations: this.#destinations,
      offers: this.#offers,
      onSubmit: this.#handleFormSubmit,
      onRollupClick: this.#handleFormClose,
      onDeleteClick: this.#handleDeleteClick
    });
    if (prevPointComponent === null || prevPointEditComponent === null) {
      render(this.#pointComponent, this.#pointsListContainer);
      return;
    }
    if (this.#isEditFormOpen) {
      replace(this.#pointEditComponent, prevPointEditComponent);
    } else {
      replace(this.#pointComponent, prevPointComponent);
      remove(prevPointEditComponent);
    }
  }

  destroy() {
    remove(this.#pointComponent);
    remove(this.#pointEditComponent);
    removeKeydownHandler(this.#escKeyDownHandler);
  }

  isEditing() {
    return this.#isEditFormOpen;
  }

  resetView() {
    if (this.#isEditFormOpen) {
      this.#pointEditComponent.reset(this.#point);
      this.#replaceFormToPoint();
    }
  }

  setSaving() {
    setComponentSaving(this.#pointEditComponent);
  }

  setDeleting() {
    setComponentDeleting(this.#pointEditComponent);
  }

  setAborting() {
    if (this.#isEditFormOpen) {
      setComponentAborting(this.#pointEditComponent);
    } else {
      const resetState = () => {
        if (this.#pointComponent) {
          this.#pointComponent.updateElement({
            isFavorite: this.#point.isFavorite
          });
        }
      };

      if (this.#pointComponent) {
        this.#pointComponent.shake(resetState);
      }
    }
  }

  setDeletingFailed() {
    setComponentAborting(this.#pointEditComponent);
  }

  setDisabled() {
    if (this.#pointComponent) {
      const rollupButton = this.#pointComponent.element.querySelector('.event__rollup-btn');
      const favoriteButton = this.#pointComponent.element.querySelector('.event__favorite-btn');
      if (rollupButton) {
        rollupButton.setAttribute('aria-disabled', 'true');
        rollupButton.style.opacity = '0.5';
      }
      if (favoriteButton) {
        favoriteButton.setAttribute('aria-disabled', 'true');
        favoriteButton.style.opacity = '0.5';
      }
      this.#pointComponent.element.classList.add('disabled');
    }
  }

  setEnabled() {
    if (this.#pointComponent) {
      const rollupButton = this.#pointComponent.element.querySelector('.event__rollup-btn');
      const favoriteButton = this.#pointComponent.element.querySelector('.event__favorite-btn');
      if (rollupButton) {
        rollupButton.removeAttribute('aria-disabled');
        rollupButton.style.opacity = '1';
      }
      if (favoriteButton) {
        favoriteButton.removeAttribute('aria-disabled');
        favoriteButton.style.opacity = '1';
      }
      this.#pointComponent.element.classList.remove('disabled');
    }
  }

  #replacePointToForm() {
    replace(this.#pointEditComponent, this.#pointComponent);
    addKeydownHandler(this.#escKeyDownHandler);
    this.#handleModeChange(this.#point.id);
    this.#isEditFormOpen = true;
  }

  #replaceFormToPoint() {
    replace(this.#pointComponent, this.#pointEditComponent);
    removeKeydownHandler(this.#escKeyDownHandler);
    this.#isEditFormOpen = false;
  }

  #escKeyDownHandler = (evt) => {
    if (isEscapeKey(evt)) {
      evt.preventDefault();
      this.#pointEditComponent.reset(this.#point);
      this.#replaceFormToPoint();
    }
  };

  #handleEditClick = () => {
    this.#replacePointToForm();
  };

  #handleFormClose = () => {
    this.#pointEditComponent.reset(this.#point);
    this.#replaceFormToPoint();
  };

  #handleFavoriteClick = () => {
    this.#handleDataChange(
      UserAction.UPDATE_POINT,
      UpdateType.PATCH,
      {...this.#point, isFavorite: !this.#point.isFavorite}
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
}
