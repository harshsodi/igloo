const vscode = require('vscode');
const path = require("path");
const constants = require('./constants');

class Utils {
    constructor() {

    }

    getConfigPath() {
        return path.join(this.getRootPath(), "iglooconfig.txt").toString();
    }

    getRegisterPath() {
        const root_path = this.getRootPath();
        const register_path = path.join(root_path, constants.outdir, "register.json");
        return register_path;
    }

    getFilePath() {
        const file_path = vscode.window.activeTextEditor.document.fileName;
        return file_path;
    }

    getFileName(file_path=null) {
        if(file_path == null)
            file_path = this.getFilePath();
        return path.basename(file_path);
    }

    getDirPath() {
        const file_path = vscode.window.activeTextEditor.document.fileName;
        var dir_path = path.dirname(file_path);
        return dir_path;
    }

    getDirName() {
        const dir_list = this.getDirPath().split(/(\\|\/)/);
        return dir_list[dir_list.length - 1];
    }

    getFileTypeByDir(dir_name) {
        var type_dir_map = constants.TYPE_DIRECTORY_MAP;
        return Object.keys(type_dir_map).find(key => type_dir_map[key] === dir_name);
    }

    getRootPath() {
        return vscode.workspace.rootPath;
    }
}

exports.Utils = Utils;