import '../styles/player-list-styles.scss';

const is_creator = document.body.dataset.creator === 'true';
const my_user_id    = document.body.dataset.userId;

export class PlayerList extends HTMLElement {
    ul = null;
    _players = new Set();
    _playerElems = new Map();

    connectedCallback() {
        this.ul = this.querySelector('ul');
    }

    _createPlayerElem(display_name, user_id, controlling) {
        const elem = document.createElement('li');
        elem.innerText = display_name;
        elem.setAttribute('data-user-id', user_id);

        if (controlling) elem.setAttribute('controlling', true);

        const btnSetController = document.createElement('button');
        btnSetController.classList = 'set-controller';
        btnSetController.setAttribute('title', controlling ? `${display_name} is controlling` : 'Set Controller');
        btnSetController.disabled = !is_creator;

        elem.append(btnSetController);

        btnSetController.addEventListener('click', (e) => {
            if (e.button) return;
            const evt = new CustomEvent('set_controller', { detail: { user_id } });
            this.dispatchEvent(evt);
        });

        return elem;
    }

    add({ user_id, display_name, controlling }) {
        if (this._players.has()) return;
        const playerElem = this._createPlayerElem(display_name, user_id, controlling);
        this.ul.append(playerElem);
        this._playerElems.set(display_name, playerElem);
        this._players.add(display_name);
    }

    remove(display_name) {
        if (this._players.has(display_name)) return;
        this._players.delete(display_name); 
        this._playerElems.get(display_name).remove();
        this._playerElems.delete(display_name);
    }

    setController({ controller_id, display_name }) {
        const controlling = this.ul.querySelector('li[controlling]');
        controlling?.removeAttribute('controlling');
        controlling?.querySelector('button').setAttribute('title', 'Set Controller');

        const new_controlling = this.ul.querySelector(`li[data-user-id="${controller_id}"`);
        new_controlling.setAttribute('controlling', true);
        new_controlling.querySelector('button').setAttribute('title', `${display_name} is controlling`);

        const can_use_buttons = (controller_id === my_user_id || is_creator);
        this.ul.querySelectorAll('li button')
            .forEach((btn) => { 
                if (can_use_buttons) {
                    btn.removeAttribute('disabled');
                } else {
                    btn.setAttribute('disabled', true);
                }
            });
    }

    get players() {
        return [...this._players];
    }

    set players(players) {
        this._players.clear();
        this._playerElems.forEach((v) => (v.remove()));
        this._playerElems.clear();

        for (const pl of players) {
            if (!pl.connected) continue;
            this.add(pl);
        }
    }
}

window.customElements.define('player-list', PlayerList);

const playerList = document.querySelector('player-list');

export default playerList;
