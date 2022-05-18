const lightGray = '#efefef';
const darkGray  = '#cfcfcf';

export class SpinnerWheel extends HTMLElement {
    sections = [];
    pegs = [];

    sectionsMeta = [
        { size: 1, color: lightGray },
        { size: 1, color: darkGray  },
        { size: 1, color: lightGray },
        { size: 1, color: darkGray  },
        { size: 1, color: lightGray },
        { size: 1, color: darkGray  },
        { size: 1, color: lightGray },
        { size: 1, color: darkGray  },
    ];

    sectionContainer = null;
    ticker = null;

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

    connectedCallback() {
        this.svg = this.querySelector('svg');
        this.sectionContainer = this.querySelector('g');
        this.ticker = document.querySelector('spinner-ticker');
        this.buildSections();

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

    setSections(sections) {
        this.sectionsMeta = sections;
        this.sectionContainer.innerHTML = "";
        this.buildSections();
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
        this.svg.style.transform = `rotateZ(${this.rotation}rad)`;
        this.updatePegShadows();

        this.doTickAnim();
        this.lastAnim = Date.now();

        requestAnimationFrame(() => {
            this.doAnim();
        });
    }

    buildSections() {
        const numSections = this.sectionsMeta.length;
        const totalFrUnits = this.sectionsMeta.reduce((acc, val) => (acc + parseInt(val.size)), 0);
        const radius = 32;

        let prevEndAngle = 0;
        let sections = [];
        let pegs = [];

        this.sectionsMeta.forEach((section) => {
            const sectionAngle = (parseFloat(section.size) / totalFrUnits) * 2 * Math.PI;
            const startAngle = prevEndAngle;
            const endAngle = startAngle + sectionAngle;
            prevEndAngle = endAngle;

            const bgColor = section.color;

            const startPos = `${Math.cos(startAngle) * radius} ${Math.sin(startAngle) * radius}`;
            const endPos   = `${Math.cos(endAngle) * radius} ${Math.sin(endAngle) * radius}`;

            const largeArc = sectionAngle >= Math.PI ? 1 : 0;

            // Build section
            const path = `M0 0 L ${startPos} A ${radius} ${radius} 0 ${largeArc} 1 ${endPos} Z`;
            
            const pathElem = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathElem.setAttribute('d', path);
            pathElem.setAttribute('fill', bgColor);

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
            sections.push(pathElem);
        });

        this.sections = sections;
        this.pegs = pegs;
    
        this.updatePegShadows();

        this.sectionContainer.append(...sections);
        this.sectionContainer.append(...pegs);

        const cap = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
              cap.setAttribute('r', 1.6);
              cap.setAttribute('fill', 'black');

        this.sectionContainer.append(cap);
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

            this.ticker.rotation = ((pegDist > 0)? 1 : -1) * fac * 0.3;
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

