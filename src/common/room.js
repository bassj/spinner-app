/** 
 * @module common/room
 */

import bcrypt from 'bcrypt';
import config from 'src/config.js';
import words from 'random-words';

let id_counter = 0;

const rooms_by_id = {};
const rooms_by_slug = {};

/**
 * Generates a random string of words for the room slug.
 *
 * @returns {string} randomly generated room slug.
 */
function generateRoomSlug() {
    const slug = words({min: 3, max: 4}).reduce((acc, word) => `${acc}${acc ? '-':''}${word}`, '');
    return (slug in rooms_by_slug)? generateRoomSlug() : slug;
}

/**
 * @typedef {object} Player
 * @property {string} user_id The id of the player.
 * @property {string} display_name The display name of the player.
 * @property {boolean} controlling Is this user the controller?
 * @property {boolean} connected Is this user currently connected?
 */

export class Room {
    id             = ++id_counter;
    slug           = generateRoomSlug();
    users          = new Map();
    display_names  = new Set(); 
    password_hash  = null;
    creator        = null;
    controller     = null;
    name           = null;
    settings       = {
        sections: [
            { size: 1, text: 'One' },
            { size: 1, text: 'Two' },
            { size: 1, text: 'Three' },
            { size: 1, text: 'Four' },
            { size: 1, text: 'Five' },
            { size: 1, text: 'Six' },
            { size: 1, text: 'Seven' },
            { size: 1, text: 'Eight' },
        ],
        colors: ['#efefef', '#cfcfcf']
    };

    #images = {};

    /**
     * Room Constructor
     *
     * @param {string} name The name of the room.
     * @param {string} creator The user_id of the creator of the room.
     */
    constructor(name, creator) {
        this.name = name;
        this.creator = creator;
    }

    /**
     * Returns the hashed password value to compare against.
     *
     * @returns {string|null} The hashed password for the room. 
     */
    get password() {
        return this.password_hash;
    }

    /**
     * Sets the password of the room.
     * @memberof Room
     * @param {string} password The new password of the room in paintext.
     */
    async set_password(password) {
        const password_hash = await bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS);
        this.password_hash = password_hash;
    }

    /**
     * Check whether the given password is correct.
     *
     * @param {string} password The plaintext passord to check.
     * @returns {Promise<boolean>} Whether the passed password matches the hash.
     */
    check_password(password) {
        return bcrypt.compare(password, this.password_hash);
    }

    /**
     * Add an image to our cache of images.
     *
     * @param {string} hash hash of the image to add.
     * @param {string} image Base64 encoded image string.
     */
    addImage(hash, image) {
        this.#images[hash] = image;
    }

    /**
     * Deletes an image from our cache of images.
     *
     * @param {string} hash The hash of the image to delete.
     */
    deleteImage(hash) { 
        delete this.#images[hash];
    }

    get images() {
        return Object.entries(this.#images).map(([hash, image]) => ({ hash, image }));
    }

    /**
     * Get all of the players in the room.
     *
     * @returns {Array<Player>} All of the players in the room.
     */
    get players() {
        return [...this.users.entries()]
            .map(([user_id, player_data]) => 
                ({
                    user_id,
                    display_name: player_data.display_name,
                    controlling: user_id == this.controller,
                    connected: player_data.connected
                }));
    }

    /**
     * Disconnect the specified user from the room.
     *
     * @param {string} user_id The id of the user to disconnect from the room.
     */
    disconnect(user_id) {
        const user = {
            ...this.users.get(user_id),
            connected: false
        };

        this.users.set(user_id, user);
    }

    /**
     * Reconnect a user to the room.
     *
     * @param {string} user_id The id of the user to reconnect.
     */
    reconnect(user_id) {
        const user = {
            ...this.users.get(user_id),
            connected: true
        };

        this.users.set(user_id, user);
    }

    /**
     * Attempt to join a user to this room.
     *
     * @param {object} user The user that is attempting to join.
     * @param {string} user.user_id The id of the user connecting.
     * @param {string} user.display_name The display name of the user connecting.
     * @param {string} password The password this user attempted to connect with.
     * @returns {Promise<boolean>} Whether the user successfully joined the room.
     */
    async join({user_id, display_name}, password) {
        const authed = (!this.password_hash) 
            || user_id === this.creator
            || await this.check_password(password || '');

        if (!authed) {
            throw {
                message: 'Invalid Password',
                type: 'invalid_password'
            };
        }

        if (this.display_names.has(display_name)) {
            throw {
                message: 'Display Name taken.',
                type: 'name_taken'
            };
        }

        this.users.set(user_id, { display_name, connected: true });
        this.display_names.add(display_name);

        return authed;
    }
}

/**
 * Creates a room.
 *
 * @param {object} root0 Options for the room to be created.
 * @param {string} root0.name The name of the room.
 * @param {string} root0.password The password of the room in plaintext.
 * @param {string|number} root0.creator The guid for the creator of the room.
 * @returns {Promise<Room>} the room you've created.
 */
export async function createRoom({ name, password, creator }) {
    const room = new Room(name, creator);

    if (password) {
        await room.set_password(password);
    }

    rooms_by_id[room.id] = room;
    rooms_by_slug[room.slug] = room;

    return room;
}

/**
 * Get the room with the given slug.
 *
 * @param {string} room_slug the slug of the room to retrieve.
 * @returns {Room} The room with the given slug.
 */
export function getRoom(room_slug) {
    return rooms_by_slug[room_slug];
}
