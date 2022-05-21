export function getImageData(file) {
    return new Promise((resolve, reject) => {
        const fr = new FileReader();
              fr.onload = () => {
                  createImageBitmap(new Blob([fr.result])).then((img) => {
                      resolve(img);
                  }).catch(reject);
              };
            fr.onerror = reject;
            fr.readAsArrayBuffer(file);
    });
}

export function toggleButton(button) {
    let _pressed = false;

    button.setAttribute("aria-pressed", _pressed);

    button.addEventListener('click', (e) => {
        _pressed = !_pressed;
        button.setAttribute("aria-pressed", _pressed);
        button.dispatchEvent(new CustomEvent('toggle'));
        button.dispatchEvent(new CustomEvent(_pressed ? 'pressed' : 'unpressed'));
    });

    Object.defineProperty(button, 'pressed', {
        get: function () { return _pressed; },
        set: function (p) { _pressed = p; button.setAttribute("aria-pressed", _pressed); }
    });

    return button;
}
