import '../styles/settings-menu-styles.scss';
import playerList from './player-list.js';
import spinner from './spinner.js';

import { getImageData, toggleButton } from '../util';

class SectionSettings extends HTMLElement {
    _ul = this.querySelector('ul');
    _template = this._ul.querySelector('template');

    set value(val) {
        this._ul.innerHTML = '';
        this._ul.append(
            ...val.map((e) => this._buildSettingForm(e))
        );
    }

    async getValue() {
        let values = [];

        const lis = Array.from(this._ul.querySelectorAll('li'));

        for (const li of lis) {
            const section = { 
                size: li.querySelector('[type="number"]').value, 
                text: li.querySelector('[type="text"]').value,
                image: null
            };

            const image = li.querySelector('[type="file"]').files[0];

            if (image) {
                const cnvSize = 200;
                const imgData = await getImageData(image);
                const cnv = document.createElement('canvas');
                      cnv.width = cnvSize;
                      cnv.height = cnvSize;

                const aspect = imgData.width / imgData.height;


                const imgWidth = (aspect > 1) ? cnvSize * aspect : cnvSize; 
                const imgHeight = (aspect < 1) ? cnvSize / aspect : cnvSize;
                const imgY = (cnvSize - imgHeight) / 2;
                const imgX = (cnvSize - imgWidth) / 2;

                const ctx = cnv.getContext('2d');
                      ctx.drawImage(imgData, imgX, imgY, imgWidth, imgHeight);
                section.image = cnv.toDataURL();
            }

            values.push(section);
        }

        return values;
    }

    _buildSettingForm({ size, text }) {
        const tpl = this._template.content.cloneNode(true);
        const li = tpl.querySelector('li');

        const textInput = li.querySelector('input[type="text"]');
              textInput.value = text;

        const sizePicker = li.querySelector('input[type="number"]');
              sizePicker.value = size;

        const deleteBtn = li.querySelector('button.delete-btn');
              deleteBtn.addEventListener('click', (e) => {
                  if (e.buttons) return;
                  li.remove();
                  this.dispatchEvent(new Event('input', { bubbles: true }));
              });

        const cloneBtn = li.querySelector('button.clone-btn');
              cloneBtn.addEventListener('click', (e) => {
                  if (e.buttons) return;
                  const clone = li.cloneNode(true);
                  this._ul.append(clone);
                  this.dispatchEvent(new Event('input', { bubbles: true }));
              });

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
            picker.value = "#FFFFFF";
            this.dispatchEvent(new Event('input', { bubbles: true }));
        });

        this.#delColorBtn.addEventListener('toggle', () => {
            this.dataset.deleteMode = this.#delColorBtn.pressed;
        });
    }

    set value(value) {
        this.#colorList.innerHTML = "";
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

    async getSettings() {
        return {
            colors: this._colorSettings.value,
            sections: await this._sectionSettings.getValue()
        };
    }
}

window.customElements.define('settings-menu', SettingsMenu);

const settingsMenu = document.querySelector('settings-menu');

export default settingsMenu;
