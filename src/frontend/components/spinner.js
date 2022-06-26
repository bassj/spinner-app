const lightGray = '#efefef';
const darkGray  = '#cfcfcf';

export class SpinnerWheel extends HTMLElement {
    sections = [];
    pegs = [];
    secImages = [];

    settings = {
        sections: [
            { size: 1, text: 'One' },
            { size: 1, text: 'Two' },
            { size: 1, text: 'Three' },
            { size: 1, text: 'Four' },
            { size: 1, text: 'Five' },
            { size: 1, text: 'Six' },
            { size: 1, text: 'Seven' },
            { size: 1, text: 'Eight' },
        ],
        colors: [lightGray, darkGray]
    }

    images = {};

    canGrab = false;
    grabState = {
        grabbed: false,
        startX: 0, 
        startY: 0,
        targetX: 0,
        targetY: 0,
        startAngle: 0
    };

    lastPegDist = 0;
    lastAnim = Date.now();
    lastPhys = Date.now();
    angularVelocity = 0;
    rotation = 0;

    clickSound = new Audio('/static/click.mp3');
    imageSize = 10;

    // Child elements
    #svg              = this.querySelector('svg');
    #svgDefs          = this.querySelector('svg defs');
    #sectionContainer = this.querySelector('svg g.sections');
    #imageContainer   = this.querySelector('svg g.images');
    #ticker           = document.querySelector('spinner-ticker');

    connectedCallback() {
        const circleClip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
              circleClip.setAttribute('id', 'circle-clip');
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
              circle.setAttribute('r', this.imageSize / 2);
              circle.setAttribute('cx', this.imageSize / 2);
              circle.setAttribute('cy', this.imageSize / 2);
              circle.setAttribute('fill', '#000000');
        circleClip.append(circle);

        this.#svgDefs.append(circleClip);

        this.#buildSections();
        this.#buildImages();

        this.addEventListener('mousedown', (e) => this.handleGrab(e));
        addEventListener('mousemove', (e) => this.handleMouseMove(e));
        addEventListener('mouseup', (e) => this.handleUnGrab(e));
        requestAnimationFrame(() => {
            this.doAnim();
        });

        setInterval(() => {
            this.doPhys();
        }, 1000.0 / 20.0);
    }

    setImages(images) {
        this.images = images;
        this.#imageContainer.innerHTML = "";
        this.#buildImages();
    }

    setSections(sections) {
        this.settings.sections = sections;
        this.#sectionContainer.innerHTML = "";
        this.#buildSections();
    }

    setColors(colors) {
        this.settings.colors = colors;
        this.#sectionContainer.innerHTML = "";
        this.#buildSections();
    }

    get delta() {
        return ((Date.now() - this.lastAnim) / 1000).toFixed(6);
    }

    get physDelta() {
        return ((Date.now() - this.lastPhys) / 1000).toFixed(6);
    }

    doPhys() {
        if (this.grabState.grabbed) {
            const startAngle = Math.atan2(this.grabState.startY, this.grabState.startX);

            const grabAngle = (startAngle + this.rotation - this.grabState.startAngle) % (Math.PI * 2);
            const targetAngle = Math.atan2(this.grabState.targetY, this.grabState.targetX);

            const deltas = [
                targetAngle - grabAngle,
                (targetAngle + Math.PI * 2 - grabAngle),
                (targetAngle - Math.PI * 2 - grabAngle)
            ];

            this.angularVelocity -= this.angularVelocity * 2 * this.physDelta;
            const delta = deltas.reduce((min, val) => (Math.abs(val) < Math.abs(min) ? val : min), Number.MAX_VALUE);
            this.angularVelocity += delta / Math.PI * 60 * this.physDelta; 
        } else {
            this.angularVelocity -= this.angularVelocity * 0.20 * this.physDelta;
        }

        this.doTickerPhys();

        const updateEvent = new CustomEvent('tick');
        this.dispatchEvent(updateEvent);

        this.lastPhys = Date.now();
    }

    doAnim() { 
        this.rotation += this.angularVelocity * this.delta;
        this.#svg.style.transform = `rotateZ(${this.rotation}rad)`;
        this.updatePegShadows();

        this.doTickAnim();
        this.lastAnim = Date.now();

        requestAnimationFrame(() => {
            this.doAnim();
        });
    }

    #buildSections() {
        const numSections = this.settings.sections.length;
        const totalFrUnits = this.settings.sections.reduce((acc, val) => (acc + parseInt(val.size)), 0);
        const radius = 32;

        let prevEndAngle = 0;
        let sections     = [];
        let texts        = [];
        let pegs         = [];

        for (const path of this.#svgDefs.querySelectorAll('path')) {
            this.#svgDefs.removeChild(path);
        }

        for (const [index, section] of this.settings.sections.entries()) {
            const sectionAngle = (parseFloat(section.size) / totalFrUnits) * 2 * Math.PI;
            const startAngle = prevEndAngle;
            const endAngle = startAngle + sectionAngle;
            prevEndAngle = endAngle;

            const bgColor = this.settings.colors[index % this.settings.colors.length];

            const startPos = `${Math.cos(startAngle) * radius} ${Math.sin(startAngle) * radius}`;
            const endPos   = `${Math.cos(endAngle) * radius} ${Math.sin(endAngle) * radius}`;

            const largeArc = sectionAngle >= Math.PI ? 1 : 0;

            const path = `M0 0 L ${startPos} A ${radius} ${radius} 0 ${largeArc} 1 ${endPos} Z`;
            const textPath = `M${startPos} A ${radius} ${radius} 0 ${largeArc} 1 ${endPos}`;

            const pathElem = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                  pathElem.setAttribute('d', path);
                  pathElem.setAttribute('fill', bgColor);

            const textPathElem = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                  textPathElem.setAttribute('id', `p-${index}`);
                  textPathElem.setAttribute('d', textPath);

            this.#svgDefs.append(textPathElem);

            // Section Text
            const textWidth = Math.abs(endAngle - startAngle) * radius;
            const sectionText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                  sectionText.setAttributeNS(null, 'width', textWidth);
                  sectionText.setAttributeNS(null, 'dy', 5);
                  sectionText.setAttributeNS(null, 'font-size', 5);
                  sectionText.setAttributeNS(null, 'lengthAdjust', 'spacingAndGlyphs');

            const sectionTextPath = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
                  sectionTextPath.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", `#p-${index}`);
                  sectionTextPath.setAttributeNS(null, "startOffset", "50%");
                  sectionTextPath.setAttributeNS(null, "text-anchor", "middle");
                  sectionTextPath.append(document.createTextNode(section.text));

            sectionText.append(sectionTextPath);
            texts.push(sectionText);

            const sectionGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                  sectionGroup.append(pathElem, sectionText);

            // Build Peg
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                  group.setAttribute('transform', `translate(${Math.cos(startAngle) * (radius - 1)}, ${Math.sin(startAngle) * (radius - 1)})`);
                  group.dataset.startAngle = startAngle;
            const peg = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); 
                  peg.setAttribute('r', 1);
                  peg.setAttribute('fill', 'white');
            const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                  shadow.setAttribute('r', 1);
                  shadow.setAttribute('fill', '#000000ee');
                  shadow.classList = 'shadow';
            group.append(shadow, peg);

            pegs.push(group);
            sections.push(sectionGroup); 

            this.sectionTexts = texts;
            this.sections = sections;
            this.pegs = pegs;

            this.updatePegShadows();

            this.#sectionContainer.append(...sections);
            this.#sectionContainer.append(...pegs);

            this.#resizeSectionText();

            const cap = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                  cap.setAttribute('r', 1.6);
                  cap.setAttribute('fill', 'black');

            this.#sectionContainer.append(cap);
        }
    }

    #buildImages() {
        const numSections = this.settings.sections.length;
        const totalFrUnits = this.settings.sections.reduce((acc, val) => (acc + parseInt(val.size)), 0);
        const radius = 32;

        let images = [];

        let prevEndAngle = 0;

        for (const [index, section] of this.settings.sections.entries()) {
            if (!(index in this.images)) continue;

            const image = this.images[index];

            const sectionAngle = (parseFloat(section.size) / totalFrUnits) * 2 * Math.PI;
            const startAngle = prevEndAngle;
            const endAngle = startAngle + sectionAngle;
            prevEndAngle = endAngle;

            const imageAngle = startAngle + (endAngle - startAngle) / 2;
            const imageX = Math.cos(imageAngle) * (radius / 2);
            const imageY = Math.sin(imageAngle) * (radius / 2);
            const imageRot = imageAngle * (180 / Math.PI);

            const sectionImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
                  sectionImage.setAttribute('width', this.imageSize);
                  sectionImage.setAttribute('height', this.imageSize);
                  sectionImage.setAttribute('transform', `translate(${imageX} ${imageY}) rotate(${imageRot + 90}) translate(${-this.imageSize / 2} ${-this.imageSize / 2})`);
                  sectionImage.setAttribute('href', image); 
                  sectionImage.setAttributeNS(null, 'clip-path', 'url(#circle-clip)');

            images.push(sectionImage);
            this.#imageContainer.append(sectionImage);
        }

        this.secImages = images;
    }

    #resizeSectionText() {
        const getTextLength = (textPath) => {
            let textLength = 0;

            const numChars = textPath.textContent.trim().length;

            for (let i = 0; i < numChars; i++) {
                const start = textPath.getStartPositionOfChar(i);
                const end   = textPath.getEndPositionOfChar(i);

                const a = start.x - end.x;
                const b = start.y - end.y;

                const glyphLength = Math.sqrt(a*a + b*b);
                textLength += glyphLength;
            }

            return textLength;
        };

        for (const text of this.sectionTexts) {
            const maxWidth = parseFloat(text.getAttribute('width')) * 0.9;
            const textPath = text.firstChild;
            const textWidth = getTextLength(textPath);
            const fontSize = parseFloat(text.getAttribute('font-size'));

            if (textWidth > maxWidth) {
                const newFontSize = ((maxWidth / textWidth) * fontSize);
                text.setAttribute('font-size', newFontSize);
                text.setAttribute('dy', Math.max(newFontSize, 2.5));
            }

        }
    }

    updatePegShadows() {
        this.pegs.forEach((peg) => {
            const tfm = peg.getAttribute('transform'); 
            const [pegX, pegY] = tfm.match(/[0-9]+(\.[0-9]*)?/g).map((num) => (parseFloat(num)));
            const pegAngle = parseFloat(peg.dataset.startAngle);
            const shadow = peg.querySelector('.shadow');

            const offsetX = 0;
            const offsetY = 0.2; 

            shadow.setAttribute('cx', offsetX * Math.cos(this.rotation) + offsetY * Math.sin(this.rotation));
            shadow.setAttribute('cy', offsetY * Math.cos(this.rotation) + offsetX * Math.sin(this.rotation));
        });
    }

    doTickerPhys() {
        const normalizedRotation = 6.28 - (((this.rotation + Math.PI / 2) % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);

        const pegAngles = this.pegs.flatMap((peg) => {
            const pegAngle = parseFloat(peg.dataset.startAngle);
            return [pegAngle, pegAngle - Math.PI * 2, pegAngle + Math.PI * 2 ]
        });

        const pegDist = pegAngles.reduce((min, ang) => {
            const dist = normalizedRotation - ang;
            return (Math.abs(dist) > Math.abs(min)) ? min : dist;
        }, Number.MAX_VALUE);

        const fac = 1 - Math.min(Math.max(-1, Math.abs(pegDist / 0.08)), 1);
        if (fac > 0) {
            this.angularVelocity -= this.angularVelocity * this.physDelta;
            this.angularVelocity += (((pegDist < 0)? 1:-1) * fac * this.physDelta);
       }

       this.lastPegDist = pegDist;
    }

    doTickAnim() {
        const normalizedRotation = 6.28 - (((this.rotation + Math.PI / 2) % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);

        const pegAngles = this.pegs.flatMap((peg) => {
            const pegAngle = parseFloat(peg.dataset.startAngle);
            return [pegAngle, pegAngle - Math.PI * 2, pegAngle + Math.PI * 2 ]
        });

        const pegDist = pegAngles.reduce((min, ang) => {
            const dist = normalizedRotation - ang;
            return (Math.abs(dist) > Math.abs(min)) ? min : dist;
        }, Number.MAX_VALUE);

        const fac = 1 - Math.min(Math.max(-1, Math.abs(pegDist / 0.08)), 1);
        if (fac > 0) {
            if ((this.lastPegDist < 0 && pegDist > 0) || (this.lastPegDist > 0 && pegDist < 0)) {
                const clone = this.clickSound.cloneNode();
                      clone.play().then(() => clone.remove());
            }

            this.#ticker.rotation = ((pegDist > 0)? 1 : -1) * fac * 0.3;
       }

       this.lastPegDist = pegDist;
    }

    handleGrab(e) {
        if (e.button != 0) return;
        if (!this.canGrab) return;

        this.grabState.grabbed = true;

        const rect = this.getBoundingClientRect();
        let grabX = e.clientX - (rect.left + rect.width / 2);
        let grabY = e.clientY - (rect.top + rect.height / 2);

        this.grabState = {
            ...this.grabState,
            startX: grabX,
            startY: grabY,
            targetX: grabX,
            targetY: grabY,
            startAngle: this.rotation,
        };
    }

    handleUnGrab(e) {
        if (e.button != 0) return;
        if (!this.canGrab) return;

        this.grabState = {
            grabbed: false,
            startX: 0,
            startY: 0,
            targetX: 0,
            targetY: 0,
            startAngle: 0
        };
    }

    handleMouseMove(e) {
        if (!this.grabState.grabbed) return;

        const rect = this.getBoundingClientRect();
        const targetX = e.clientX - (rect.left + rect.width / 2);
        const targetY = e.clientY - (rect.top + rect.height / 2);

        this.grabState = {
            ...this.grabState,
            targetX,
            targetY
        };
    }

    set controlling(value) {
        if (value) {
            this.canGrab = true;
            this.style.cursor = null;
        } else {
            this.style.cursor = 'default';
            this.canGrab = false;
        }
    }
}

window.customElements.define('spinner-wheel', SpinnerWheel);

export class SpinnerTicker extends HTMLElement {
    set rotation(rotation) {
        this.style.transform = `rotateZ(${rotation}rad)`;
    }
}

window.customElements.define('spinner-ticker', SpinnerTicker);


const spinner = document.querySelector('spinner-wheel');

export default spinner;

