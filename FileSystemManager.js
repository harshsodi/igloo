const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const Utils = require('./Utils');
const constants = require("./constants");

class FileSystemManager {
    constructor() {
        this.utils = new Utils.Utils();
    }

    exist(path) {
        return fs.existsSync(path);
    }

    makeDir(dir_name) {
        if (!fs.existsSync(dir_name)){
            console.log("Creating " + dir_name);
            fs.mkdirSync(dir_name);
        }
        else {
            //Log about existance of the file
        }
    }

    getFileDirStructure() {
        const rootPath = this.utils.getRootPath();
        const servicenowPath = path.join(rootPath, "ServiceNow");
        var dirList = fs.readdirSync(servicenowPath).filter(f => fs.statSync(path.join(servicenowPath, f)).isDirectory());
        var dirPath, dirName, fileType;
        var fileDirStructure = {};
        for(var dirIndex=0, dirListLen = dirList.length; dirIndex<dirListLen; dirIndex++) {
            dirName = dirList[dirIndex];
            dirPath = path.join(servicenowPath, dirName);
            fileType = this.utils.getFileTypeByDir(dirName);
            fileDirStructure[fileType] = {}
            fs.readdirSync(dirPath).map(item=>{
                fileDirStructure[fileType][item.replace(/\.js$/, '')] = true;
            });
        }

        return fileDirStructure;
    }

    _initiateConfigFile() {
        const root_path = this.utils.getRootPath();
        const config_path = path.join(root_path, "iglooconfig.txt");
        var config_content = this.readFile(config_path);
        if(config_content == "") {
            console.log("Initiating configuration in iglooconfig.json");
            var config_content_json = {
                "url" : "https://<instance>.service-now.com/",
                "username" : "",
                "password" : "",
                "app_name" : ""
            }
            this.writeFile(config_path, JSON.stringify(config_content_json, null, 4));
            console.log(this.readFile(config_path));
        }
        
    }

    _createRegisterFile(outdir_path) {
        const register_path = path.join(outdir_path, constants.CONFIG_FILE_NAME)
        if (!fs.existsSync(register_path)) {
            console.log("Creating register " + outdir_path);
            var data_json = {}
            this.writeFile(register_path, JSON.stringify(data_json, null, 4));
        }
    }

    readFile(file_path) {
        if (!fs.existsSync(file_path)) {
            console.log(file_path + " does not exist");
        }
        else {
            var file_content = fs.readFileSync(file_path).toString();
            return file_content;
        }
    }

    writeFile(file_path, data) {
        console.log("Writing to : " + file_path);
        try {
            var writeStream = fs.createWriteStream(file_path);
            writeStream.write(data);
            writeStream.end();
        }
        catch(exception) {
            console.log("Error while writing to : " + file_path);
            console.log(exception);
        }
    }

    /**
     * Remove a directiry
     * @param {String} directory_path Path of directory to remove
     */
    removeDirectory(directory_path) {
        // vscode.window.showErrorMessage("Removing it");
        try {
            var context = this;
            if (fs.existsSync(directory_path)) {
                fs.readdirSync(directory_path).forEach(function(file, index){
                var curPath = directory_path + "/" + file;
                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    console.log("Removing dir : " + curPath);
                    context.removeDirectory(curPath);
                } else { // delete file
                    console.log("Removing file " + curPath);
                    fs.unlinkSync(curPath);
                }
                });
                fs.rmdirSync(directory_path);
            }
        }
        catch(exception) {
            console.log("Excepton while removing directory : " + exception.toString());
        }
    }

    /**
     * Remove a file
     * @param {String} file_path Path of the file to remove 
     */
    removeFile(file_path) {
        try {
            fs.unlinkSync(file_path);
        }
        catch(exception) {
            console.log("Excepton while removing file : " + exception.toString());
        }
    }
}

exports.FileSystemManager = FileSystemManager