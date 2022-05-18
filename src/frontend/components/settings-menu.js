import '../styles/settings-menu-styles.scss';
import playerList from './player-list.js';
import spinner from './spinner.js';

class SectionSettings extends HTMLElement {
    _ul = this.querySelector('ul');
    _template = this._ul.querySelector('template');

    set value(val) {
        this._ul.innerHTML = '';
        this._ul.append(
            ...val.map((e) => this._buildSettingForm(e))
        );
    }

    get value() {
        let values = [];

        this._ul.querySelectorAll('li').forEach((li) => {
            values.push({ 
                size: li.querySelector('[type="number"]').value, 
                color: li.querySelector('[type="color"]').value 
            });
        });

        return values;
    }

    _buildSettingForm({ size, color }) {
        const tpl = this._template.content.cloneNode(true);
        const li = tpl.querySelector('li');

        const colorPicker = li.querySelector('input[type="color"]');
              colorPicker.value = color;

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

class SettingsMenu extends HTMLElement {
    _settingsPopup = this.querySelector('.settings-popup');
    _menuButton    = this.querySelector('button.settings-menu');
    _sectionSettings = this.querySelector('section-settings');
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

        this._sectionSettings.value = spinner.sectionsMeta;
    }

    _closeSettingsMenu() {
        this._open = false;
        playerList.hidden = false;
        this._settingsPopup.hidden = true;
    }

    get settings() {
        return {
            sections: this._sectionSettings.value
        };
    }
}

window.customElements.define('settings-menu', SettingsMenu);

const settingsMenu = document.querySelector('settings-menu');

export default settingsMenu;
