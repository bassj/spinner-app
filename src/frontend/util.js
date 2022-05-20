export function getImageData(file) {
    return new Promise((resolve, reject) => {
        const fr = new FileReader();
              fr.onload = () => {
                  console.log(fr.result);
                  createImageBitmap(new Blob([fr.result])).then((img) => {
                      resolve(img);
                  }).catch(reject);
              };
            fr.onerror = reject;
            fr.readAsArrayBuffer(file);
    });
}
