/** @module frontend/components/room-title */

import '../styles/room-title-styles.scss';

class RoomTitle extends HTMLElement {
    #editBtn = this.querySelector('button.edit-btn');
    #header  = this.querySelector('h2');

    /**
     * Called when the element connnects to the document.
     */
    connectedCallback() { 
        this.#editBtn.addEventListener('click', () => this.#editTitle());
        this.#header.addEventListener('click', () => this.#editTitle());
        this.#header.addEventListener('blur', () => this.#cancelEdit());
        this.#header.addEventListener('keydown', (e) => (e.key == 'Enter') && this.#cancelEdit());
        this.#header.addEventListener('input', () => this.#updateWindowTitle());
    }

    /**
     * Makes the title editable.
     */
    #editTitle() {
        this.#header.setAttribute('tabindex', '0');
        this.#header.setAttribute('contenteditable', 'true');
        this.#header.setAttribute('role', 'textbox');
        this.#header.focus();

        // Move the mouse cursor to the last character.
        const range = document.createRange();
        range.setStart(this.#header.firstChild, this.#header.innerText.length + 1);
        const set = window.getSelection();
        set.removeAllRanges();
        set.addRange(range);
    }

    /**
     * Makes the title not editable.
     */
    #cancelEdit() { 
        this.#header.removeAttribute('tabindex');
        this.#header.removeAttribute('contenteditable');
        this.#header.removeAttribute('role');
        this.#header.blur();
    }

    /**
     * Updates the title of the window.
     */
    #updateWindowTitle() {
        document.title = `${this.title} | Spinner App`;
    }

    /**
     * Sets the title.
     *
     * @param {string} value The new title.
     */
    set title(value) {
        this.#header.innerText = value;
        this.#updateWindowTitle();
    }

    /**
     * Gets the current title.
     *
     * @returns {string} The current title.
     */
    get title() {
        return this.#header.innerText;
    }
}

window.customElements.define('room-title', RoomTitle);


const roomTitle = document.querySelector('room-title');

export default roomTitle;
