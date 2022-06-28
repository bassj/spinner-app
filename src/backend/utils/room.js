import { Room } from 'common/room.js';

const rooms_by_id = {};
const rooms_by_slug = {};

/**
 * Creates a room with the given settings.
 *
 * @param {object} settings Settings for the room.
 * @param {string} settings.name The name of the room.
 * @param {string} settings.password plaintext password of the room.
 * @param {string} settings.creator the user_id of the creator of the room.
 * @returns {Promise<Room>} Room that was created.
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
 * Gets the room with the specified slug.
 *
 * @param {string} room_slug The slug of the room to search for.
 * @returns {Room} The specifed room.
 */
export function getRoom(room_slug) {
    return rooms_by_slug[room_slug];
}
