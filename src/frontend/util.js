const imageCache = {};

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
 * Generates a hash from a base64 encoded image.
 *
 * @param {string} image_data Image data as a base64 url.
 * @returns {number} A hash signature generated by the image_data.
 */
function calculateImageHash(image_data) {
    let hash = 0, i, chr;
    if (image_data.length === 0) return hash;
    for (i = 0; i < image_data.length; i++) {
        chr   = image_data.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; 
    }

    // Kinda hacky way to make our number unsigned.
    return (new Uint32Array([hash]))[0];  
}

/**
 * Get image data from a file, in a specific size.
 *
 * @param {File} file to extract image data from.
 * @param {null|number} new_size The size to re-size the image to.
 * @returns {Promise<string>} Base64 encoded string of the image.
 */
export async function getImageData(file, new_size = null) {
    if (new_size === null) return await _getImageData(file);

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
    const image_data = cnv.toDataURL();
    const image_hash = calculateImageHash(image_data);
    return [image_data, image_hash];
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

/**
 * Saves an image so that it can be used by the spinner.
 *
 * @param {string} hash The hash of the image to save.
 * @param {string} image A base64 encoded image uri.
 */
export function saveImage(hash, image) {
    imageCache[hash] = image;

    const e = new CustomEvent('add_image', { detail: { hash, image } });
    dispatchEvent(e);
}

/**
 * Deletes an image from the cache of saved images.
 *
 * @param {string} hash The hash of the image to delete.
 */
export function deleteImage(hash) {
    if (!(hash in imageCache))
        return;
    
    delete imageCache[hash];

    const e = new CustomEvent('delete_image', { detail: { hash } });
    dispatchEvent(e);
}

/**
 * Gets an image from the cache of saved images.
 *
 * @param {string} hash The hash of the image to retrieve.
 * @returns {string | null} A base64 encoded image or null if the specified hash doesn't exist.
 */
export function getImage(hash) {
    if (!(hash in imageCache)) 
        return null;
    

    return imageCache[hash];
}
