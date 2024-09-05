class SegmentsViewer {
    constructor(node, segmentTypesCount) {
        this.node = node;
        this.segmentTypesCount = segmentTypesCount;
        this.twilioLogo = this.createTwilioLogo();
        console.log(this.createTwilioLogo())
        this.blockMap = new Map();
        this.selectedBlocks = [];
    }

    createTwilioLogo() {
        let img = document.createElement('img');
        const twilio_logo = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1718.76 1456.78"><defs><style>.cls-1 {fill: #59bb6c;}</style></defs><!-- Generator: Adobe Illustrator 28.6.0, SVG Export Plug-In . SVG Version: 1.2.0 Build 709) --><g><g id="Layer_1"><path class="cls-1" d="M1145.96,359.19V48.77c0-26.9-21.8-48.77-48.77-48.77H48.77C21.87,0,0,21.8,0,48.77v1000.39c0,26.9,21.8,48.77,48.77,48.77h135.31c12.77,0,25.06-5.09,34.17-14.13l152.02-152.02h202.55v310.42c0,26.9,21.8,48.77,48.77,48.77h728.42l151.68,151.68c9.03,9.03,21.33,14.13,34.17,14.13h134.15c26.9,0,48.77-21.8,48.77-48.77V407.89c0-26.9-21.8-48.77-48.77-48.77h-523.97l-.07.07ZM1527.56,1198.26l-84.23-84.23c-9.03-9.03-21.33-14.13-34.17-14.13h-645.35v-168.11h190.46v-190.46h-190.46v-191.07h-191.07v190.46h-261.71c-12.77,0-25.06,5.09-34.17,14.13l-85.79,85.79V191h763.74v168.11h-191.07v191.07h191.07v191.07h191.07v-191.07h381.6v648l.07.07Z"/></g></g></svg>';
        img.setAttribute("src", "data:image/svg+xml;base64," + btoa(twilio_logo));
        console.log(img)
        return img;
    }

    createTwilioReservedCodeUnitBlock(segmentType) {
        let block = document.createElement("div");
        block.setAttribute("class", `block twilio ${segmentType}`);
        let twilioLogo = this.twilioLogo.cloneNode();
        block.appendChild(twilioLogo);
        return block;
    }

    createCodeUnitBlock(codeUnit, segmentType, mapKey, isGSM7) {
        let block = document.createElement('div');
        block.setAttribute('class', `block ${segmentType} ${isGSM7 ? '' : 'non-gsm'}`);

        block.setAttribute("data-key", mapKey);
        this.blockMap.get(mapKey).push(block);

        let span = document.createElement('span');
        span.textContent = "0x" + codeUnit.toString(16).padStart(4, '0').toUpperCase();

        block.appendChild(span);
        return block;
    }

    update(segmentedMessage) {
        this.blockMap.clear();

        let newSegments = document.createElement("div");
        newSegments.setAttribute("id", "segments-viewer");

        for (let segmentIndex = 0; segmentIndex < segmentedMessage.segments.length; segmentIndex++) {
            const segmentType = `segment-type-${segmentIndex % this.segmentTypesCount}`;
            const segment = segmentedMessage.segments[segmentIndex];

            for (let charIndex = 0; charIndex < segment.length; charIndex++) {
                const encodedChar = segment[charIndex];
                const mapKey = `${segmentIndex}-${charIndex}`;
                this.blockMap.set(mapKey, []);

                if (encodedChar.isReservedChar) {
                    newSegments.appendChild(this.createTwilioReservedCodeUnitBlock(segmentType));
                } else {
                    if (encodedChar.codeUnits) {
                        for (const codeUnit of encodedChar.codeUnits) {
                            newSegments.appendChild(
                                this.createCodeUnitBlock(codeUnit, segmentType, mapKey, encodedChar.isGSM7)
                            );
                        }
                    }
                }
            }
        }

        this.node.replaceWith(newSegments);
        this.node = newSegments;
    }

    select(mapKey) {
        this.clearSelection();

        for (let block of this.blockMap.get(mapKey)) {
            block.classList.add("selected");
            this.selectedBlocks.push(block);
        }
    }

    clearSelection() {
        for (let block of this.selectedBlocks) {
            block.classList.remove("selected");
        }

        this.selectedBlocks.length = 0;
    }
}


class MessageViewer {
    constructor(node, segmentTypesCount) {
        this.node = node;
        this.segmentTypesCount = segmentTypesCount;
        this.blockMap = new Map();
        this.selectedBlock = null;
    }

    createCharBlock(encodedChar, segmentType, mapKey) {
        let block = document.createElement('div');
        block.setAttribute('class', `block ${segmentType}`);
        if (!encodedChar.codeUnits) {
            block.classList.add('error');
        }

        block.setAttribute("data-key", mapKey);
        this.blockMap.set(mapKey, block);

        let span = document.createElement('span');
        span.textContent = encodedChar.raw.replace(' ', '\u00A0');
        block.appendChild(span);
        return block;
    }

    update(segmentedMessage) {
        this.blockMap.clear();
        let newMessage = document.createElement("div");
        newMessage.setAttribute("id", "message-viewer");

        for (let segmentIndex = 0; segmentIndex < segmentedMessage.segments.length; segmentIndex++) {
            const segmentType = `segment-type-${segmentIndex % this.segmentTypesCount}`;
            const segment = segmentedMessage.segments[segmentIndex];

            for (let charIndex = 0; charIndex < segment.length; charIndex++) {
                const encodedChar = segment[charIndex];
                const mapKey = `${segmentIndex}-${charIndex}`;

                if (!(encodedChar.isReservedChar)) {
                    newMessage.appendChild(this.createCharBlock(encodedChar, segmentType, mapKey));
                }
            }
        }

        this.node.replaceWith(newMessage);
        this.node = newMessage;

        this.markInvisibleCharacters();
    }

    markInvisibleCharacters() {
        for (let span of this.node.querySelectorAll("span")) {
            if (span.offsetWidth === 0) {
                span.classList.add("invisible");
            }
        }
    }

    select(mapKey) {
        this.clearSelection();

        this.selectedBlock = this.blockMap.get(mapKey);
        this.selectedBlock.classList.add("selected");
    }

    clearSelection() {
        if (this.selectedBlock) {
            this.selectedBlock.classList.remove("selected");
        }
        this.selectedBlock = null;        
    }
}

class WarningsViewer {
    constructor(node) {
        this.node = node;
    }

    createWarningBlock(warning){
        const warningParagraph = document.createElement("p");
        warningParagraph.innerText = warning;
        return warningParagraph;
    }

    update(warnings){
        this.node.innerHTML = '';
        warnings.forEach(warning => {
            this.node.appendChild(this.createWarningBlock(warning))
        });
    }
}