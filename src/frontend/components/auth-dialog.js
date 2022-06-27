import '../styles/auth-dialog-styles.scss';
import dialogPolyfill from '../../../node_modules/dialog-polyfill/dist/dialog-polyfill.esm.js';

export class AuthDialog extends HTMLElement {
    dialog   = null;
    form     = null;
    errorMsg = null;

    /**
     * Called when the element connects to the document.
     */
    connectedCallback() {
        this.dialog  = this.querySelector('dialog');
        this.form    = this.querySelector('form');
        this.erorMsg = this.querySelector('p.error-message');
        dialogPolyfill.registerDialog(this.dialog);
    }

    /**
     * Makes the call to the api to authenticate the user. Calls the 
     * callback when that completes.
     *
     * @param {Function} callback Called after authentication.
     */
    onAuth(callback) {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            const body = new URLSearchParams(new FormData(event.target));

            fetch(e.target.action, {
                method: 'POST',
                body
            }).then(async (resp) => {
                if (resp.ok) {
                    this.dialog.close();
                    callback();
                } else {
                    this._showError(await resp.text());
                }
            });
        });
    }

    /**
     * Shows the dialog.
     */
    show() {
        this.dialog.show();
    }

    /**
     * Shows an error message.
     *
     * @param {string} msg The error message to show.
     */
    _showError(msg) {
        this.errorMsg.innerText = msg;
        this.errorMsg.hidden = false;
    }
}

window.customElements.define('auth-dialog', AuthDialog);

const authDialog = document.querySelector('auth-dialog');

export default authDialog;
