'use strict';


function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

class BruteBart {
    constructor(min, max, dict, entropy) {
        this.min = min;
        this.max = max;

        this.curLenght = min;
        this.vector = Array(min).fill(0);

        try {
            this.dict = dict.split("").filter(onlyUnique);
        } catch (e) {
            this.dict = dict;
        }
        console.log('Established dictionary: ', JSON.stringify(this.dict));

        this.maxDic = dict.length - 1;

        this.entropy = entropy; // how any of same characters are allowed in the 

    }

    showInernals() {
        console.log("Vector ", this.vector);
        console.log("Dict ", this.dict);
        console.log("MaxDic ", this.maxDic, "(+1)");
        console.log("Dict range", this.min, this.max);

        console.log('Current ', this.currentWord());
    }

    currentWord() {
        return this.wordFromVector(this.vector);
    }

    wordFromVector(vector) {
        let word = '';
        for (let single of vector) {
            word += this.dict[single];
        }

        return word;
    }

    next() {
        while (1) {
            let propagation = 1;
            for (let i = 0; i < this.curLenght; i++) {

                if (propagation) {
                    this.vector[i]++;
                    propagation = 0;
                }

                if (this.vector[i] > this.maxDic) {
                    this.vector[i] = 0;
                    propagation = 1;
                }

            }

            if (propagation) {
                if (this.vector.length == this.max) {
                    throw new Error('Reached end of dictionary')
                }

                this.vector.push(0);
                this.curLenght++;
                console.log('expanding vector [ ' + (this.vector.length - 1) + ' -> ' + this.vector.length + ' ]');
            }

            if (!this.entropyLookUp(this.vector)) {
                // console.log('next [missing: ' + this.currentWord() + '][' + this.vector + ']');
                return true;
            }
        }

    }

    entropyLookUp(vector) {
        if (this.entropy) {
            for (let i = 0; i < vector.length; i++) {
                let mark = 0;
                for (let j = 1; j <= this.entropy; j++) {
                    if (vector[i + j] !== undefined) {
                        if (vector[i + j] == vector[i]) {
                            mark++;
                            if (mark >= this.entropy) {
                                return true;
                            }
                            //else check next character
                        }
                    } else {
                        //out of range no need to check anything entropy should be there
                        return false;
                    }
                }
            }
        }

        return false; // we dont care or it was ok
    }

    nextWord() {
        this.next();
        return this.currentWord();
    }

}

var dickBase = require('./dictionary') || "a";


var dickGenerator = new BruteBart(7, 12, dickBase, 2);


const cp = require('child_process');

class SlavsMaster {
    constructor(maxSlavs, generator, ssid) {
        this.maxSlavs = maxSlavs;
        this.generator = generator;
        this.cp = Array(maxSlavs);
        this.ssid = ssid;
        this.go();
    }

    attach(index) {
        this.cp[index] = cp.fork('./chp.js');
        let msg = { network: this.ssid, password: this.generator.nextWord() };

        this.cp[index].send(msg);

        this.cp[index].on('message', (m) => {
            console.log("======================================================")
            console.log('MESSAGE: ' + JSON.stringify(m));
            console.log("======================================================")
            process.exit(0);
            return; // got it!
        });

        this.cp[index].on('exit', (m) => {
            this.attach(index);
        });

        this.cp[index].on('err', (m) => {
            this.attach(index);
        });
    }

    go() {
        for (let i = 0; i < this.maxSlavs; i++) {
            this.attach(i);
        }
    }
}

try {
    let bruting = new SlavsMaster(1, dickGenerator, require('./ssid'));
} catch (e) {
    console.log(e);
    throw new Error('Failed to initate the scanner');
}