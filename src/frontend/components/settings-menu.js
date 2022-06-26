import '../styles/settings-menu-styles.scss';
import playerList from './player-list.js';
import spinner from './spinner.js';

import { getImageData, toggleButton } from '../util';

class SectionSettings extends HTMLElement {
    _images = [];
    _ul = this.querySelector('ul');
    _template = this._ul.querySelector('template');

    set value(val) {
        this._ul.innerHTML = '';
        this._ul.append(
            ...val.map((e, index) => this.#buildSettingForm(index, e))
        );
    }

    async getImages() {
        let images = this.#getSavedImages();
        const lis = Array.from(this._ul.querySelectorAll('li'));

        for (const [index, li] of lis.entries()) {
            const imgField = li.querySelector('[type="file"]');
            const image = imgField.files[0];

            if (image && imgField.dataset.dirty == 'true') {
                imgField.dataset.dirty = 'false';
                images[index] = await getImageData(image, 200);
            }
        }

        this.#saveImages(images);

        return images;
    }

    get value() {
        let values = [];

        const lis = Array.from(this._ul.querySelectorAll('li'));

        for (const li of lis) {
            const section = { 
                size: li.querySelector('[type="number"]').value, 
                text: li.querySelector('[type="text"]').value,
                image: null
            };

            values.push(section);
        }

        return values;
    }

    #saveImages(images) {
        this._images = images;
    }

    #getSavedImages() { 
        return this._images;
    }

    _deleteImage(index) {
        if (!window.sessionStorage.getItem('images')) return;
        const images = JSON.parse(window.sessionStorage.getItem('images'));

        delete images[index];

        for (const [image_index, element] of Object.entries(images)) {
            if (image_index <= index) continue;
            images[image_index - 1] = element;
            delete images[image_index];
        }

        window.sessionStorage.setItem('images', JSON.stringify(images));

        this.#updateLiIndices();
    }

    _cloneImage(index) {
        if (!window.sessionStorage.getItem('images')) return;
        const images = JSON.parse(window.sessionStorage.getItem('images'));

        const new_index = Object.entries(images).length;

        images[new_index] = images[index];

        window.sessionStorage.setItem('images', JSON.stringify(images));

        this.#updateLiIndices();
    }

    #updateLiIndices() {
        const lis = Array.from(this._ul.querySelectorAll('li'));

        for (const [index, li] of Object.entries(lis)) {
            li.dataset.index = index;
        }
    }

    #buildSettingForm(index, { size, text }) {
        const tpl = this._template.content.cloneNode(true);
        const li = tpl.querySelector('li');
        li.dataset.index = index;

        const textInput = li.querySelector('input[type="text"]');
        textInput.value = text;

        const sizePicker = li.querySelector('input[type="number"]');
        sizePicker.value = size;

        const fileInput = li.querySelector('input[type="file"]');
        fileInput.addEventListener('input', (e) => {
            console.log('asdf');
            console.log(e);
            fileInput.dataset.dirty = 'true';
        });

        const settingsForm = this;

        const onDelete = function (e) {
            if (e.buttons) return;
            this.remove();
            settingsForm._deleteImage(index);
            settingsForm.dispatchEvent(new CustomEvent('delete', { bubbles: true, detail: index }));
        };

        const onClone = function (e) {
            if (e.buttons) return;
            const clone = this.cloneNode(true);
            clone.querySelector('button.clone-btn').addEventListener('click', onClone.bind(clone));
            clone.querySelector('button.delete-btn').addEventListener('click', onDelete.bind(clone));
            settingsForm._cloneImage(index);
            settingsForm._ul.append(clone);
            settingsForm.dispatchEvent(new CustomEvent('clone', { bubbles: true }));
        };

        const deleteBtn = li.querySelector('button.delete-btn');
        deleteBtn.addEventListener('click', onDelete.bind(li)); 

        const cloneBtn = li.querySelector('button.clone-btn');
        cloneBtn.addEventListener('click', onClone.bind(li));

        return li;
    }
}

window.customElements.define('section-settings', SectionSettings);

class ColorPicker extends HTMLElement {
    _input = null;
    _label = null;
    _delBtn = null;

    connectedCallback() {
        this._input = document.createElement('input');
        this._input.setAttribute('type', 'color');

        this._label = document.createElement('label');
        this._label.append(this._input);

        this.append(this._label);

        this._delBtn = document.createElement('button');
        this._delBtn.classList = 'delete-btn';
        this._delBtn.setAttribute('type', 'button');
        this._delBtn.addEventListener('click', (e) => {
            if (e.buttons) return;
            this.remove();
            document.querySelector('color-settings')
                .dispatchEvent(new Event('input', { bubbles: true }));
        });

        this.append(this._delBtn);

        this._input.addEventListener('input', () => this.#setBGColor());
    }

    set value(value) {
        this._input.value = value;
        this.#setBGColor();
    }

    get value() {
        return this._input.value;
    }

    #setBGColor() {
        this._label.style.backgroundColor = this.value;
    }
}

window.customElements.define('color-picker', ColorPicker);

class ColorSettings extends HTMLElement {
    #colorList   = this.querySelector('ul.section-colors');
    #addColorBtn = this.querySelector('.add-color-btn');
    #delColorBtn = toggleButton(this.querySelector('.delete-color-btn'));

    connectedCallback() {
        this.#addColorBtn.addEventListener('click', (e) => {
            if (e.buttons) return;
            const picker = new ColorPicker();
            this.#colorList.append(picker);
            picker.value = '#FFFFFF';
            this.dispatchEvent(new Event('input', { bubbles: true }));
        });

        this.#delColorBtn.addEventListener('toggle', () => {
            this.dataset.deleteMode = this.#delColorBtn.pressed;
        });
    }

    set value(value) {
        this.#colorList.innerHTML = '';
        for (const color of value) {
            const colorPicker = document.createElement('color-picker');
            this.#colorList.append(colorPicker);
            colorPicker.value = color;
        }
    }

    get value() {
        const pickers = Array.from(this.#colorList.querySelectorAll('color-picker'));
        return pickers.map((p) => p.value);
    }
}

window.customElements.define('color-settings', ColorSettings);

class SettingsMenu extends HTMLElement {
    _settingsPopup   = this.querySelector('.settings-popup');
    _menuButton      = this.querySelector('button.settings-menu');
    _sectionSettings = this.querySelector('section-settings');
    _colorSettings   = this.querySelector('color-settings');
    _open = false;

    connectedCallback() {
        this._menuButton.addEventListener('click', () => (
            this._open ? this._closeSettingsMenu() : this._openSettingsMenu()
        ));
    }

    _openSettingsMenu() {
        this._open = true;
        playerList.hidden = true;
        this._settingsPopup.hidden = false;

        this._sectionSettings.value = spinner.settings.sections;
        this._colorSettings.value = spinner.settings.colors;
    }

    _closeSettingsMenu() {
        this._open = false;
        playerList.hidden = false;
        this._settingsPopup.hidden = true;
    }

    getSettings() {
        return {
            colors: this._colorSettings.value,
            sections: this._sectionSettings.value
        };
    }

    async getImages() {
        return await this._sectionSettings.getImages();
    }
}

window.customElements.define('settings-menu', SettingsMenu);

const settingsMenu = document.querySelector('settings-menu');

export default settingsMenu;
