/** @module frontend/room */

import './styles/spinner-styles.scss';
import './styles/theme-styles.scss';

import {
    deleteImage,
    saveImage
} from './util';
import { io } from 'socket.io-client';

import authDialog from './components/auth-dialog'; 
import config from 'config';
import playerList from './components/player-list';
import roomTitle from './components/room-title';
import settingsMenu from './components/settings-menu';
import spinner from './components/spinner';

const isCreator = document.body.dataset.creator == 'true';

if (document.body.dataset.reconnect == 'true') {
    connectToRoom();
} else {
    authDialog.onAuth(connectToRoom);
    authDialog.show();
}

/**
 * Connect to the room.
 */
function connectToRoom() {
    const user_id = document.body.dataset.userId;
    const socket  = io(window.location.pathname, { 
        secure: !config.DEBUG
    });

    const onTick = () => {
        socket.emit('tick', {
            angularVelocity: spinner.angularVelocity,
            rotation:        spinner.rotation
        });
    };

    const onServerTick = ({ rotation, angularVelocity }) => {
        spinner.rotation        = rotation;
        spinner.angularVelocity = angularVelocity;
    };

    if (isCreator) {
        const emitSettings = () => socket.emit('room_settings', settingsMenu.settings);
        settingsMenu.addEventListener('input',  emitSettings);
        settingsMenu.addEventListener('delete', emitSettings);
        settingsMenu.addEventListener('add-section',  emitSettings);
        
        addEventListener('add_image', (e) => 
            socket.emit('add_image', e.detail));

        addEventListener('delete_image', (e) => 
            socket.emit('delete_image', e.detail));
        
        roomTitle.addEventListener('input', () =>
            socket.emit('room_title', roomTitle.title));
    }

    /**
     * Set whether the user is controlling the spinner or not.
     *
     * @param {boolean} isControlling Whether the user is controlling the wheel.
     */
    const setControlling = (isControlling) => {
        if (isControlling) {
            spinner.addEventListener('tick', onTick);
            spinner.controlling = true;
            socket.off('tick', onServerTick);
        } else {
            spinner.removeEventListener('tick', onTick);
            spinner.controlling = false;
            socket.on('tick', onServerTick);
        }
    };

    socket.on('set_controller', ( { controller_id, display_name } ) => {
        playerList.setController({ controller_id, display_name });
        setControlling(user_id === controller_id);
    });

    playerList.addEventListener('set_controller', (e) => {
        socket.emit('set_controller', { controller_id: e.detail.user_id });
    });

    socket.on('room_settings', (settings) => spinner.settings = settings);

    socket.on('add_image',    ({ hash, image }) => saveImage(hash, image));
    socket.on('delete_image', ({ hash })        => deleteImage(hash));

    socket.on('room_images', (images) => {
        for (const { hash, image } of images) {
            saveImage(hash, image);
        }
    });

    socket.on('room_title', (title) => {
        roomTitle.title = title;
    });

    // eslint-disable-next-line no-unused-vars
    socket.on('kick', (kick_message) => {
        // TODO: Display kick message to user. 
    });

    socket.on('tick', onServerTick);

    socket.on('players', (players) => {
        playerList.players = players;
    });

    socket.on('connect', () => {
        spinner.controlling = false;
    });

    // TODO: Show disconnect reason.
    //eslint-disable-next-line no-unused-vars
    socket.on('disconnect', (reason) => {
        // Handle disconnect
    });
}
