import './styles/spinner-styles.scss';
import './styles/theme-styles.scss';

import { io } from 'socket.io-client';

import authDialog from './components/auth-dialog'; 
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
    const socket = io(window.location.pathname);

    const onTick = () => {
        socket.emit('tick', {
            angularVelocity: spinner.angularVelocity,
            rotation: spinner.rotation
        });
    };

    const onServerTick = ({ rotation, angularVelocity }) => {
        spinner.rotation = rotation;
        spinner.angularVelocity = angularVelocity;
    };

    if (isCreator) {
        settingsMenu.addEventListener('input', async () => {
            socket.emit('room_settings', settingsMenu.getSettings());
            const roomImages = await settingsMenu.getImages();

            if (Object.keys(roomImages).length) {
                socket.emit('room_images', roomImages);
            }
        });

        settingsMenu.addEventListener('delete', async () => {
            socket.emit('room_settings', settingsMenu.getSettings());
            const roomImages = await settingsMenu.getImages();
            if (Object.keys(roomImages).length) {
                socket.emit('room_images', roomImages);
            }
        });

        settingsMenu.addEventListener('clone', async () => {
            socket.emit('room_settings', settingsMenu.getSettings());
            const roomImages = await settingsMenu.getImages();
            if (Object.keys(roomImages).length) {
                socket.emit('room_images', roomImages);
            }
        });

        roomTitle.addEventListener('input', () => {
            socket.emit('room_title', roomTitle.title);
        });
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

    socket.on('room_settings', (settings) => {
        spinner.setSections(settings.sections);
        spinner.setColors(settings.colors);
    });

    socket.on('room_images', (images) => {
        spinner.setImages(images);
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
