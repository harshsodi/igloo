const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const Utils = require('./Utils');
const constants = require("./constants");

class FileSystemManager {
    constructor() {
        this.utils = new Utils.Utils();
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
}

exports.FileSystemManager = FileSystemManager