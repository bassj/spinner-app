const express = require('express');
const { 
    createRoom,
    getRoom,
    joinRoom,
} = require('../controller/room.js');

function useRoom({ redirect } = {}) {
    return (req, res, next) => {
        const room_slug = req.params.room;
        const room = getRoom(room_slug);

        if (room === undefined) {
            return redirect? res.redirect('/') : res.status(404).send('Room not found');
        } else {
            req.room = room;
            return next();
        }
    };
}

module.exports = (csrf, io, sessionMiddleware) => {
    const router = express.Router();
    router.post('/create', csrf, async (req, res) => {
        const {spinner_name, room_password} = req.body;

        if (!spinner_name) {
            return res.status(400).send("Missing spinner_name"); 
        }

        const room = await createRoom({
            name: spinner_name,
            password: room_password,
            creator: req.session.user_id
        });

        res.redirect(`/room/${room.slug}`);
    });

    router.get('/:room', csrf, useRoom({redirect: true}), (req, res) => {
        const room = req.room;
        const creator = room.creator === req.session.user_id;
        const user_id = req.session.user_id;

        res.render('spinner', {
            csrfToken: req.csrfToken(),
            creator,
            room,
            user_id,
            reconnect: room.users.has(user_id)
        });
    });

    router.post('/:room/auth', csrf, useRoom(), async (req, res) => {
        const room = req.room;
        const user_id = req.session.user_id;
        const { room_password, display_name } = req.body;

        if (!display_name) {
            return res.status(400).send('Missing "display_name" parameter.');
        }

        if (!room_password && room.password != undefined && room.creator != user_id) {
            return res.status(400).send('Missing "room_password" parameter.');
        }

        try {
            await room.join({ user_id, display_name }, room_password);
            req.session.display_name = display_name;
            await req.session.save();
            return res.sendStatus(203);
        } catch (e) {
            if (e.type == 'invalid_password') {
                return res.status(401).send(e.message);
            } else if (e.type == 'name_taken') {
                return res.status(400).send(e.message);
            }
        }

        return res.sendStatus(203);
    });

    io.of(/\/room\/([A-z]+-?)+/).use(sessionMiddleware).on('connection', (sock) => {
        // God, regex is such a cruel thing to bestow upon this world.
        const roomName = sock.nsp.name.match(/(?<=room\/)([A-z]+-?)+/)[0]; 
        const namespace = sock.nsp.name;
        const room = getRoom(roomName);
        const user_id = sock.request.session.user_id;

        const broadcast = (evt, arg) => (io.of(namespace).in(room.slug).emit(evt, arg));
        const setController = (controller_id) => {
            const { display_name } = room.users.get(controller_id);
            room.controller = controller_id;
            broadcast('set_controller', { controller_id, display_name });
        };

        if (room == undefined) {
            sock.emit('kick', { message: 'Room does not exist.' });
            sock.disconnect();
            return;
        }

        if (!(room.creator == user_id || room.users.has(user_id))) {
            sock.emit('kick', { message: 'Not authenticated.' });
            sock.disconnect();
            return;
        } else if (room.users.has(user_id)) {
            room.reconnect(user_id);
        }

        sock.join(room.slug);
        broadcast('players', room.players);

        if (room.controller) {
            const user = room.users.get(room.controller);
            sock.emit('set_controller', { controller_id: room.controller, display_name: user.display_name });
        }

        if (room.creator == user_id) {
            sock.on('room_settings', (settings) => {
                room.settings = settings;
                broadcast('room_settings', room.settings);
            });
        }

        sock.on('set_controller', ({ controller_id }) => {
            if (user_id == room.creator || user_id == room.controller) {
                setController(controller_id);
            }
        });

        sock.on('tick', (tickData) => {
            if (room.controller == user_id) {
                sock.in(room.slug).emit('tick', tickData);
            }
        });

        sock.on('disconnecting', () => {
            room.disconnect(user_id);
            broadcast('players', room.players);
        });

        if (!room.controller && room.users.size == 1) {
            setController(user_id);
        }

        sock.emit('room_settings', room.settings);
    });

    return router;
};
