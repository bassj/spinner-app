import '../styles/settings-menu-styles.scss';
import playerList from './player-list.js';
import spinner from './spinner.js';

import { getImageData, toggleButton } from '../util';

class SectionSettings extends HTMLElement {
    _images = [];
    _ul = this.querySelector('ul');
    _template = this._ul.querySelector('template');

    /**
     * Sets the value of the section settings form.
     *
     * @param {Array<spinner.Section>} val The new value of the section settings form.
     */
    set value(val) {
        this._ul.innerHTML = '';
        this._ul.append(
            ...val.map((e, index) => this.#buildSettingForm(index, e))
        );
    }

    /**
     * Gets the images for each section.
     * 
     * @deprecated
     * @returns {Promise<Array<string>>} An array of the base64 image urls.
     */
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

    /**
     * Gets the current value of the form.
     *
     * @returns {Array<spinner.Section>} The new settings for each section of the spinner.
     */
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

    /**
     * Save the images
     *
     * @deprecated
     * @param {object} images the images
     */
    #saveImages(images) {
        this._images = images;
    }

    /**
     * Get the saved images
     *
     * @deprecated
     * @returns {object} images
     */
    #getSavedImages() { 
        return this._images;
    }

    /**
     * Deletes the image at the specified index.
     *
     * @deprecated
     * @param {number} index the index of the image to delete.
     */
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

    /**
     * Clone an image at the specified index.
     *
     * @deprecated
     * @param {number} index The index of the image to clone.
     */
    _cloneImage(index) {
        if (!window.sessionStorage.getItem('images')) return;
        const images = JSON.parse(window.sessionStorage.getItem('images'));

        const new_index = Object.entries(images).length;

        images[new_index] = images[index];

        window.sessionStorage.setItem('images', JSON.stringify(images));

        this.#updateLiIndices();
    }

    /**
     * Update the "data-index" attribute of the `li` elements for each section.
     */
    #updateLiIndices() {
        const lis = Array.from(this._ul.querySelectorAll('li'));

        for (const [index, li] of Object.entries(lis)) {
            li.dataset.index = index;
        }
    }

    /**
     * Builds the settings form for a specific section.
     *
     * @param {number} index The index of the section that's being built.
     * @param {spinner.Section} section The settings of this section of the spinner.
     * @returns {HTMLLIElement} The new settings form for the specified section.
     */
    #buildSettingForm(index, { size, text }) {
        const tpl = this._template.content.cloneNode(true);
        const li = tpl.querySelector('li');
        li.dataset.index = index;

        const textInput = li.querySelector('input[type="text"]');
        textInput.value = text;

        const sizePicker = li.querySelector('input[type="number"]');
        sizePicker.value = size;

        const fileInput = li.querySelector('input[type="file"]');
        fileInput.addEventListener('input', () => {
            fileInput.dataset.dirty = 'true';
        });

        const settingsForm = this;

        /**
         * Event handler for when the section is deleted.
         *
         * @param {CustomEvent} e event.
         */
        const onDelete = function (e) {
            if (e.buttons) return;
            this.remove();
            settingsForm._deleteImage(index);
            settingsForm.dispatchEvent(new CustomEvent('delete', { bubbles: true, detail: index }));
        };

        /**
         * Event handler for when the section is cloned.
         *
         * @param {CustomEvent} e event.
         */
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
    #input = null;
    #label = null;
    #delBtn = null;

    /**
     * Called when the element is connected to the document
     */
    connectedCallback() {
        this.#input = document.createElement('input');
        this.#input.setAttribute('type', 'color');

        this.#label = document.createElement('label');
        this.#label.append(this.#input);

        this.append(this.#label);

        this.#delBtn = document.createElement('button');
        this.#delBtn.classList = 'delete-btn';
        this.#delBtn.setAttribute('type', 'button');
        this.#delBtn.addEventListener('click', (e) => {
            if (e.buttons) return;
            this.remove();
            document.querySelector('color-settings')
                .dispatchEvent(new Event('input', { bubbles: true }));
        });

        this.append(this.#delBtn);

        this.#input.addEventListener('input', () => this.#setBGColor());
    }

    /**
     * Set the value of this color picker.
     *
     * @param {string} value the new value of the color picker.
     */
    set value(value) {
        this.#input.value = value;
        this.#setBGColor();
    }

    /**
     * Get the value of this color picker.
     *
     * @returns {string} The value of this color picker.
     */
    get value() {
        return this.#input.value;
    }

    /**
     * Sets the background color of the element to it's current value.
     */
    #setBGColor() {
        this.#label.style.backgroundColor = this.value;
    }
}

window.customElements.define('color-picker', ColorPicker);

class ColorSettings extends HTMLElement {
    #colorList   = this.querySelector('ul.section-colors');
    #addColorBtn = this.querySelector('.add-color-btn');
    #delColorBtn = toggleButton(this.querySelector('.delete-color-btn'));

    /**
     * Called when the element connects to the document.
     */
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

    /**
     * Sets the value of the color settings form.
     *
     * @param {spinner.Colors} value The new value of the color settings form.
     */
    set value(value) {
        this.#colorList.innerHTML = '';
        for (const color of value) {
            const colorPicker = document.createElement('color-picker');
            this.#colorList.append(colorPicker);
            colorPicker.value = color;
        }
    }

    /**
     * Gets the value of the color settings form.
     *
     * @returns {spinner.Colors} The value of the color settings form.
     */
    get value() {
        const pickers = Array.from(this.#colorList.querySelectorAll('color-picker'));
        return pickers.map((p) => p.value);
    }
}

window.customElements.define('color-settings', ColorSettings);

class SettingsMenu extends HTMLElement {
    #settingsPopup   = this.querySelector('.settings-popup');
    #menuButton      = this.querySelector('button.settings-menu');
    #sectionSettings = this.querySelector('section-settings');
    #colorSettings   = this.querySelector('color-settings');
    #open = false;

    /**
     * Called when the element is connected to the document.
     */
    connectedCallback() {
        this.#menuButton.addEventListener('click', () => (
            this.#open ? this.#closeSettingsMenu() : this.#openSettingsMenu()
        ));
    }

    /**
     * Opens the settings menu.
     */
    #openSettingsMenu() {
        this.#open = true;
        playerList.hidden = true;
        this.#settingsPopup.hidden = false;

        this.#sectionSettings.value = spinner.settings.sections;
        this.#colorSettings.value = spinner.settings.colors;
    }

    /**
     * Closes the settings menu.
     */
    #closeSettingsMenu() {
        this.#open = false;
        playerList.hidden = false;
        this.#settingsPopup.hidden = true;
    }

    /**
     * @typedef {object} SpinnerSettings
     * @property {spinner.Colors} colors Colors of the spinner.
     * @property {Array<spinner.Section>} sections Settings of each section of the spinner.
     */
    /**
     * Get the current value of the settings menu.
     *
     * @returns {SpinnerSettings} Current value of the settings menu.
     */
    getSettings() {
        return {
            colors:   this.#colorSettings.value,
            sections: this.#sectionSettings.value
        };
    }

    /**
     * Get the current images from the settings menu.
     *
     * @deprecated
     * @returns {object} images.
     */
    async getImages() {
        return await this.#sectionSettings.getImages();
    }
}

window.customElements.define('settings-menu', SettingsMenu);

const settingsMenu = document.querySelector('settings-menu');

export default settingsMenu;
