const vscode = require('vscode');
const os = require('os');

class auxilClass {
    constructor() {
        
    }

    auxil() {
        console.log(os.platform());
    }
}
exports.auxilClass = auxilClass;