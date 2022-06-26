function _getImageData(file) {
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

export async function getImageData(file, new_size = null) {
    if (new_size === null) return await _getImageData();

    const imgData = await _getImageData(file);

    const aspect = imgData.width / imgData.height;
    const imgWidth = (aspect > 1) ? new_size * aspect : new_size; 
    const imgHeight = (aspect < 1) ? new_size / aspect : new_size;
    const imgY = (new_size - imgHeight) / 2;
    const imgX = (new_size - imgWidth) / 2;

    const cnv = document.createElement('canvas');
          cnv.width  = new_size;
          cnv.height = new_size;
    const ctx = cnv.getContext('2d');
          ctx.drawImage(imgData, imgX, imgY, imgWidth, imgHeight);

    return cnv.toDataURL();
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


