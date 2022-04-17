const express = require('express');
const { createRoom, getRoom } = require('../controller/room.js');

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

module.exports = (csrf) => {
    const router = express.Router();
    router.use(csrf);

    router.post('/create', async (req, res) => {
        const {spinner_name, room_password} = req.body;

        if (!spinner_name) {
            return res.status(400).send("Missing spinner_name"); 
        }

        const room = await createRoom({
            name: spinner_name,
            password: room_password,
            creator: req.sessionID
        });

        res.redirect(`/room/${room.slug}`);
    });

    router.get('/:room', useRoom({redirect: true}), (req, res) => {
        const room = req.room;
        const creator = room.creator === req.sessionID;

        res.render('spinner', {
            creator,
            room
        });
    });

    router.post('/:room/auth', useRoom(), async (req, res) => {
        if (!req.body.room_password) {
            return res.status(400).send('Missing "room_password" parameter.');
        }

        const room = req.room;
        const room_password = req.body.room_password;

        if (!(await joinRoom(room, req.sessionID, room_password))) {
            return res.status(401).send('Invalid password');
        }

        return res.status(203).send();
    });

    return router;
};
