

const authDialog = document.getElementById('auth-dialog');

if (authDialog) {
    const authForm = authDialog.querySelector('form');
    
    const onClose = (e) => {

    };

    authForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const body = new URLSearchParams(new FormData(event.target));

        fetch(e.target.action, {
            method: 'POST',
            body 
        }).then(async (resp) => {
            if (resp.ok) {
                authDialog.removeEventListener('close', onClose);
                authDialog.close();
                connectToRoom();
            } else {
                const msg = authForm.querySelector('.error-message');
                msg.innerText = await resp.text();
                msg.hidden = false;
            }
        });
    });

    authDialog.addEventListener('close', onClose);
    authDialog.showModal();
} else {
    connectToRoom();
}

function connectToRoom() {
    const url = new URL(window.location);
          url.protocol = (window.location.protocol == 'https')? 'wss:' : 'ws:';
    const ws = new WebSocket(url.toString());

    ws.addEventListener('open', (e) => {
        console.log(e);
        ws.send('hello world!');
    });
}
