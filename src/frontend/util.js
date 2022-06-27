/**
 * Internal function that creates an ImageBitmap from a File.
 *
 * @param {File} file The image to extract an ImageBitmap from.
 * @returns {Promise<ImageBitmap>} ImageBitmap representation of the passed image.
 */
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

/**
 * Get image data from a file, in a specific size.
 *
 * @param {File} file to extract image data from.
 * @param {null|number} new_size The size to re-size the image to.
 * @returns {Promise<string>} Base64 encoded string of the image.
 */
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

/**
 * Turns the passed button element into a toggle button.
 *
 * @param {HTMLButtonElement} button The button to turn into a toggle button.
 * @returns {HTMLButtonElement} The passed button element.
 */
export function toggleButton(button) {
    let _pressed = false;

    button.setAttribute('aria-pressed', _pressed);

    button.addEventListener('click', () => {
        _pressed = !_pressed;
        button.setAttribute('aria-pressed', _pressed);
        button.dispatchEvent(new CustomEvent('toggle'));
        button.dispatchEvent(new CustomEvent(_pressed ? 'pressed' : 'unpressed'));
    });

    Object.defineProperty(button, 'pressed', {
        get: function () { return _pressed; },
        set: function (p) { _pressed = p; button.setAttribute('aria-pressed', _pressed); }
    });

    return button;
}


