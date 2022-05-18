import '../styles/room-title-styles.scss';

class RoomTitle extends HTMLElement {
    _editBtn = this.querySelector('button.edit-btn');
    _header  = this.querySelector('h2');
    _editing = false;

    connectedCallback() { 
        this._editBtn.addEventListener('click', () => this._editTitle());
        this._header.addEventListener('blur', () => this._cancelEdit());
        this._header.addEventListener('keydown', (e) => (e.key == 'Enter') && this._cancelEdit());
        this._header.addEventListener('input', (e) => this._updateWindowTitle());
    }

    _editTitle() {
        this._header.setAttribute('tabindex', '0');
        this._header.setAttribute('contenteditable', 'true');
        this._header.setAttribute('role', 'textbox');
        this._header.focus();

        // Move the mouse cursor to the last character.
        const range = document.createRange();
              range.setStart(this._header.firstChild, this._header.innerText.length + 1);
        const set = window.getSelection();
              set.removeAllRanges();
              set.addRange(range);

        this._editing = true;
    }

    _cancelEdit() { 
        this._header.removeAttribute('tabindex');
        this._header.removeAttribute('contenteditable');
        this._header.removeAttribute('role');
        this._editing = false;
    }

    _updateWindowTitle() {
        document.title = `${this.title} | Spinner App`;
    }

    set title(value) {
        this._header.innerText = value;
        this._updateWindowTitle();
    }

    get title() {
        return this._header.innerText;
    }
}

window.customElements.define('room-title', RoomTitle);


const roomTitle = document.querySelector('room-title');

export default roomTitle;
