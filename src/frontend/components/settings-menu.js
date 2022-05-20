import '../styles/settings-menu-styles.scss';
import playerList from './player-list.js';
import spinner from './spinner.js';

import { getImageData } from '../util';

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

        console.log(lis);

        for (const li of lis) {
            const section = { 
                size: li.querySelector('[type="number"]').value, 
                color: li.querySelector('[type="color"]').value,
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

                console.log(imgWidth);
                console.log(imgHeight);

                const ctx = cnv.getContext('2d');
                      ctx.drawImage(imgData, imgX, imgY, imgWidth, imgHeight);
                
                section.image = cnv.toDataURL();
            }

            values.push(section);
        }

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

    async getSettings() {
        console.log('getsettings');
        return {
            sections: await this._sectionSettings.getValue()
        };
    }
}

window.customElements.define('settings-menu', SettingsMenu);

const settingsMenu = document.querySelector('settings-menu');

export default settingsMenu;
