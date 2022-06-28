import {getRoom} from '@utils/room.js';
import express from 'express';
import socketio from 'socket.io';
import controller from '../controller/room';

/**
 * Builds an express middleware function that attaches a users current room to the
 * request.
 *
 * @param {object} root0 options used to build the middleware function.
 * @param {boolean} root0.redirect if true the user is redirected back to / when not in a room.
 * @returns { Function } express middleware function.
 */
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

/**
 * Builds the room router.
 *
 * @param {Function} csrf CSRF middleware.
 * @param {socketio.Server} io socket.io server
 * @param {Function} sessionMiddleware session middleware.
 * @returns {express.Router} The room router.
 */
export default (csrf, io, sessionMiddleware) => {
    const router = express.Router();
   
    router.get('/:room', csrf, useRoom({redirect: true}), controller.getRoom);
    router.post('/create', csrf, controller.createRoom);
    router.post('/:room/auth', csrf, useRoom(), controller.authRoom);
    
    io.of(/\/room\/([A-z]+-?)+/)
        .use(sessionMiddleware)
        .on('connection', controller.handleSocket(io));

    return router;
};
