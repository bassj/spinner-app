const authDialog = document.getElementById('auth-dialog');
const authForm = authDialog.querySelector('form');
const msg      = authDialog.querySelector('.error-message');

authForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const body = new URLSearchParams(new FormData(event.target));

    fetch(e.target.action, {
        method: 'POST',
        body 
    }).then(async (resp) => {
        if (resp.ok) {
            authDialog.close();
            connectToRoom();
        } else {
            msg.innerText = await resp.text();
            msg.hidden = false;
        }
    });
});

authDialog.show();

function connectToRoom() {
    const spinner = document.querySelector('spinner-wheel');
    const user_id = document.body.dataset.userId;
    const socket = io(window.location.pathname);
    let controlling = false;

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

    socket.on('set_controller', ( { controller_id } ) => {
        if (user_id === controller_id) {
            spinner.addEventListener('tick', onTick);
            spinner.controlling = true;
            socket.off('tick', onServerTick);
        } else {
            spinner.removeEventListener('tick', onTick);
            spinner.controlling = false;
            socket.on('tick', onServerTick);
        }
    });

    socket.on('kick', (kick_message) => {
        console.log(kick_message);
    });

    socket.on('tick', onServerTick);

    socket.on('connect', () => {
        spinner.controlling = false;
    });

    socket.on('disconnect', (reason) => {
        console.log('disconnect'); // Handle disconnect
    });
}
