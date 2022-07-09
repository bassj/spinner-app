/** @module frontend/components/settings-menu */
import '../styles/settings-menu-styles.scss';
import playerList from './player-list.js';
import spinner from './spinner.js';

import { getImageData, saveImage, toggleButton } from '../util';

class SectionSettings extends HTMLElement {
    #ul = this.querySelector('ul');
    #template = this.#ul.querySelector('template');
    #addSectionBtn = this.querySelector('button.add-section-btn');

    connectedCallback() {
        this.#addSectionBtn.addEventListener('click', () => {
            const newForm = this.#buildSettingForm({ text: '', size: 1 });
            this.#ul.append(newForm);
            newForm.scrollIntoView();
            this.dispatchEvent(new CustomEvent('add-section', { bubbles: true }));
        });
    }

    /**
     * Sets the value of the section settings form.
     *
     * @param {Array<spinner.Section>} val The new value of the section settings form.
     */
    set value(val) {
        this.#ul.innerHTML = '';
        this.#ul.append(
            ...val.map((e) => this.#buildSettingForm(e))
        );
    }

    /**
     * Gets the current value of the form.
     *
     * @returns {Array<spinner.Section>} The new settings for each section of the spinner.
     */
    get value() {
        let values = [];

        const lis = Array.from(this.#ul.querySelectorAll('li'));

        for (const li of lis) {
            const section = { 
                size: li.querySelector('[type="number"]').value, 
                text: li.querySelector('[type="text"]').value,
                image: li.querySelector('[type="file"]').dataset.value
            };

            values.push(section);
        }

        return values;
    }

    /**
     * Builds the settings form for a specific section.
     *
     * @param {spinner.Section} section The settings of this section of the spinner.
     * @returns {HTMLLIElement} The new settings form for the specified section.
     */
    #buildSettingForm({ size, text, image }) {
        const tpl = this.#template.content.cloneNode(true);
        const li = tpl.querySelector('li');

        const textInput = li.querySelector('input[type="text"]');
        textInput.value = text;

        const sizePicker = li.querySelector('input[type="number"]');
        sizePicker.value = size;

        const fileInput = li.querySelector('input[type="file"]');
        fileInput.addEventListener('input', async (e) => {
            e.preventDefault(); // Pause propagation of event
            e.stopPropagation();

            const [file] = fileInput.files;
            const [resized_image, hash] = await getImageData(file, 200);
            fileInput.setAttribute('data-value', hash);

            saveImage(hash, resized_image);
            this.dispatchEvent(e); // Resume propagation of event.
        });

        if (image)
            fileInput.setAttribute('data-value', image);

        /**
         * Event handler for when the section is deleted.
         *
         * @param {CustomEvent} e event.
         */
        const onDelete = (e) => {
            if (e.buttons) return;
            li.remove();
            this.dispatchEvent(
                new CustomEvent('delete', { 
                    bubbles: true, 
                })
            );
        };

        const deleteBtn = li.querySelector('button.delete-btn');
        deleteBtn.addEventListener('click', onDelete.bind(li)); 

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
    get settings() {
        return {
            colors:   this.#colorSettings.value,
            sections: this.#sectionSettings.value
        };
    }
}

window.customElements.define('settings-menu', SettingsMenu);

const settingsMenu = document.querySelector('settings-menu');

export default settingsMenu;
