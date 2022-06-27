import '../styles/player-list-styles.scss';

const is_creator = document.body.dataset.creator === 'true';
const my_user_id    = document.body.dataset.userId;

export class PlayerList extends HTMLElement {
    ul = null;
    #players = new Set();
    #playerElems = new Map();

    /**
     * Called when the element connects to the document.
     */
    connectedCallback() {
        this.ul = this.querySelector('ul');
    }

    /**
     * Builds the LI element for the specified player.
     *
     * @param {string} display_name Display name of the player.
     * @param {string} user_id id of the player.
     * @param {boolean} controlling Whether the player is the controller.
     * @returns {HTMLLIElement} The element built for the player.
     */
    #createPlayerElem(display_name, user_id, controlling) {
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

    /**
     * Adds a user to the player list.
     *
     * @param {object} player The player to add.
     * @param {string} player.user_id The user id of the player.
     * @param {string} player.display_name The display name of the player.
     * @param {boolean} player.controlling Whether this player is the controller or not.
     */
    add({ user_id, display_name, controlling }) {
        if (this.#players.has()) return;
        const playerElem = this.#createPlayerElem(display_name, user_id, controlling);
        this.ul.append(playerElem);
        this.#playerElems.set(display_name, playerElem);
        this.#players.add(display_name);
    }

    /**
     * Removes a player with the specified display_name from the player list.
     *
     * @param {string} display_name The display name of the player to remove.
     */
    remove(display_name) {
        if (this.#players.has(display_name)) return;
        this.#players.delete(display_name); 
        this.#playerElems.get(display_name).remove();
        this.#playerElems.delete(display_name);
    }

    /**
     * Updates who is displayed as controller.
     *
     * @param {object} controller The new controller.
     * @param {string} controller.controller_id The id of the controller.
     * @param {string} controller.display_name The display name of the controller.
     */
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

    /**
     * @typedef {object} Player
     * @property {string} display_name The display name of the player.
     * @property {string} user_id The id of the user.
     * @property {boolean} controlling Whether the user is controlling the wheel.
     */

    /**
     * Returns an array of the players in the list.
     *
     * @returns {Array<Player>} The players currently displayed by the list.
     */
    get players() {
        return [...this.#players];
    }

    /**
     * Sets the players currently displayed by the list.
     *
     * @param {Array<Player>} players The list of players to display.
     */
    set players(players) {
        this.#players.clear();
        this.#playerElems.forEach((v) => (v.remove()));
        this.#playerElems.clear();

        for (const pl of players) {
            if (!pl.connected) continue;
            this.add(pl);
        }
    }
}

window.customElements.define('player-list', PlayerList);

const playerList = document.querySelector('player-list');

export default playerList;
