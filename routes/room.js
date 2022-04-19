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

module.exports = (csrf, io) => {
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
            user_id
        });
    });

    router.post('/:room/auth', csrf, useRoom(), async (req, res) => {
        if (!req.body.room_password) {
            return res.status(400).send('Missing "room_password" parameter.');
        }

        const room = req.room;
        const room_password = req.body.room_password;

        if (!(await joinRoom(room, req.session.user_id, room_password))) {
            return res.status(401).send('Invalid password');
        }

        return res.status(203).send();
    });

    io.of(/\/room\/([A-z]+-?)+/).on('connection', (sock) => {
        // God, regex is such a cruel thing to bestow upon this world.
        const roomName = sock.nsp.name.match(/(?<=room\/)([A-z]+-?)+/)[0]; 
        const namespace = sock.nsp.name;
        const room = getRoom(roomName);
        
        if (room == undefined) {
            sock.emit('kick', { message: 'Room does not exist.' });
            sock.disconnect();
            return;
        }

        sock.on('auth', ({ user_id }) => {
            if (!(room.creator == user_id || room.users.has(user_id))) {
                sock.emit('kick', { message: 'Not authenticated.' });
                sock.disconnect();
                return;
            }

            sock.join(room.slug);

            const setController = (controller_id) => {
                room.controller = controller_id;
                io.of(namespace).in(room.slug).emit('set_controller', { controller_id });
            };

            sock.on('tick', (tickData) => {
                if (room.controller == user_id) {
                    sock.in(room.slug).emit('tick', tickData);
                }
            });

            if (room.creator == user_id) {
                setController(user_id);
            }
        });
    });

    return router;
};
