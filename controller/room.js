const words   = require('random-words');
const bcrypt  = require('bcrypt');
const options = require('../options.js');

let id_counter = 0;

const rooms_by_id = {};
const rooms_by_slug = {};

function generateRoomSlug() {
    const slug = words({min: 3, max: 4}).reduce((acc, word) => `${acc}${acc ? '-':''}${word}`, '');
    return (slug in rooms_by_slug)? generateRoomSlug() : slug;
}

class Room {
    id = ++id_counter;
    slug           = generateRoomSlug();
    users          = new Map();
    display_names  = new Set(); 
    password_hash  = null;
    creator        = null;
    controller     = null;
    name           = null;
    images         = {};
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

    constructor(name, creator) {
        this.name = name;
        this.creator = creator;
    }

    get password() {
        return this.password_hash;
    }

    async set_password(password) {
        const password_hash = await bcrypt.hash(password, options.BCRYPT_SALT_ROUNDS);
        this.password_hash = password_hash;
    }

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

    disconnect(user_id) {
        const user = {
            ...this.users.get(user_id),
            connected: false
        };

        this.users.set(user_id, user);
    }

    reconnect(user_id) {
        const user = {
            ...this.users.get(user_id),
            connected: true
        };

        this.users.set(user_id, user);
    }

    async join({user_id, display_name}, password) {
        const authed = (!this.password_hash) 
            || (await bcrypt.compare(password || '', this.password_hash))
            || user_id === this.creator;

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

async function createRoom({ name, password, creator }) {
    const room = new Room(name, creator);

    if (password) {
        await room.set_password(password);
    }

    rooms_by_id[room.id] = room;
    rooms_by_slug[room.slug] = room;

    return room;
}

function getRoom(room_slug) {
    return rooms_by_slug[room_slug];
}

module.exports = {
    createRoom,
    getRoom,
};
