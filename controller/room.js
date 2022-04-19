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

async function createRoom({ name, password, creator }) {
    const room_id = ++id_counter;
    const room_slug = generateRoomSlug();
    
    const password_hash = await bcrypt.hash(password, options.BCRYPT_SALT_ROUNDS);

    const room = {
        id: room_id,
        slug: room_slug,
        name,
        password: password? password_hash : undefined, 
        creator,
        users: new Set(),
    };

    rooms_by_id[room_id] = room;
    rooms_by_slug[room_slug] = room;

    return room;
}

async function joinRoom(room, user_id, password) {
    const authed = (room.password === undefined) ? true : (await bcrypt.compare(password, room.password));

    if (authed) {
        room.users.add(user_id);
    }

    return authed;
}

function getRoom(room_slug) {
    return rooms_by_slug[room_slug];
}

function deleteRoom() {

}

module.exports = {
    createRoom,
    getRoom,
    joinRoom,
};
