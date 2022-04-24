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
              btnSetController.setAttribute('title', 'Set Controller');

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

    setController(controller_id) {
        this.ul.querySelector('li[controlling]')?.removeAttribute('controlling');
        this.ul.querySelector(`li[data-user-id="${controller_id}"`).setAttribute('controlling', true);
    }

    get players() {
        return [...this._players];
    }

    set players(players) {
        this._players.clear();
        this._playerElems.forEach((v) => (v.remove()));
        this._playerElems.clear();

        for (const pl of players) {
            this.add(pl);
        }
    }
}

window.customElements.define('player-list', PlayerList);

const playerList = document.querySelector('player-list');

export default playerList;
