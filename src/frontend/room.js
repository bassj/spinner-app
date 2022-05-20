import './styles/theme-styles.scss';
import './styles/spinner-styles.scss';

import { io } from 'socket.io-client';

import spinner from './components/spinner'; 
import playerList from './components/player-list';
import authDialog from './components/auth-dialog';
import settingsMenu from './components/settings-menu';
import roomTitle from './components/room-title';

const isCreator = document.body.dataset.creator == "true";

if (document.body.dataset.reconnect == "true") {
    connectToRoom();
} else {
    authDialog.onAuth(connectToRoom);
    authDialog.show();
}

function connectToRoom() {
    const spinner = document.querySelector('spinner-wheel');
    const user_id = document.body.dataset.userId;
    const socket = io(window.location.pathname);

    const onTick = (e) => {
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
        settingsMenu.addEventListener('input', async (e) => {
            console.log('input');
            socket.emit('room_settings', await settingsMenu.getSettings());
        });

        roomTitle.addEventListener('input', (e) => {
            socket.emit('room_title', roomTitle.title);
        });
    }

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
    }

    socket.on('set_controller', ( { controller_id, display_name } ) => {
        playerList.setController({ controller_id, display_name });
        setControlling(user_id === controller_id);
    });

    playerList.addEventListener('set_controller', (e) => {
        socket.emit('set_controller', { controller_id: e.detail.user_id });
    });

    socket.on('room_settings', (settings) => {
        spinner.setSections(settings.sections)
    });

    socket.on('room_title', (title) => {
        roomTitle.title = title;
    });

    socket.on('kick', (kick_message) => {
        console.log(kick_message);
    });

    socket.on('tick', onServerTick);

    socket.on('players', (players) => {
       playerList.players = players;
    });

    socket.on('connect', () => {
        spinner.controlling = false;
    });

    socket.on('disconnect', (reason) => {
        console.log('disconnect'); // Handle disconnect
    });
}
