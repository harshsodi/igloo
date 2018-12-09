/*
 * Provide methods contributing to the synchronization process.
 * Uploading, Doenloading files and comparing with servicenow instance
 * 
 * Author : Harsh Sodiwala
 */

const vscode = require('vscode');
const path = require("path");
const simpleGit = require("simple-git");

const constants = require("./constants");
const HttpClient = require("./HttpClient");
const FileSystemManager = require("./FileSystemManager");
const Utils = require('./Utils');

var global_register = {};
var filesOnDisk = {};

class SyncManager {
    constructor() {
        this.fs_manager = new FileSystemManager.FileSystemManager();
        this.fs_manager._initiateConfigFile();
        this.utils = new Utils.Utils();

        this._loadConfig()
        this.fs_manager = new FileSystemManager.FileSystemManager();
        this.simple_git = simpleGit(this.utils.getRootPath());
        this._registerOnFileSaveEvent();
    }

    _registerOnFileSaveEvent() {

        var context = this;
        vscode.workspace.onDidSaveTextDocument((textDocument) => {

            var file_name = path.basename(textDocument.fileName);
            if(file_name == "iglooconfig.txt") {
                try {
                    if(file_name == "iglooconfig.txt") {
    
                    }
                    var config_new = JSON.parse(textDocument.getText());
                    var track_changes_new = config_new.track_changes;
    
                    if(this.track_changes != track_changes_new) {
                        
                        if(!track_changes_new) {
    
                            // Delete git folder
                            this._removeGit();

                            // Set track_changes to false
                            this.track_changes = false;
                        }
                        else {
                            this.track_changes = true;
                            this.initGitForTrackingChanges();
                        }
                    }
                }
                catch(exception) {
                    vscode.window.showErrorMessage("Error while reading config.");
                    console.log("Exception while reading saved config : " + exception.toString());
                }
            }
        });
    }

    /*
     * Initiate required objects which are based on the configurations
     */
    _loadConfig() {
        this.config = this._readConfig();
        this.http_client = new HttpClient.HttpClient(
            this.config.url,
            this.config.username,
            this.config.password
        );
        this.app_name = this.config.app_name;
        this.track_changes = this.config.track_changes;
    }

    /*
     * Read the config file and return as JSON
     * Return JSON with empty values if configuration is not done yet
     */
    _readConfig() {
        const config_path = this.utils.getConfigPath();
        const config_content = this.fs_manager.readFile(config_path);
        if(config_content == "") {
            vscode.window.showWarningMessage("Please enter details in config file before starting to operate.");
            return {
                "url" : "https://<instance>.service-now.com/",
                "username" : "",
                "password" : "",
                "app_name" : "",
                "track_changes" : true
            }
        }
        const config = JSON.parse(config_content);
        return config;
    }

    _updateRegister(file_object) {
        //Read register
        //Figure out type of file
        //Make entry under relevant object in dict
        //Update sys_id, name, sys_class, update_time
    }

    /*
     * Read the register file and return as JSON
     */
    _readRegister() {
        const register_path = this.utils.getRegisterPath();
        var register_content = this.fs_manager.readFile(register_path);
        return register_content;
    }

    /*
     * Load the global register variable
     * Global register exist to prevent the async write operations from overwriting content
     */
    _loadGlobalRegister() {
        const root_path = this.utils.getRootPath();
        const register_path = path.join(root_path, constants.outdir, "register.json");
        var register_content_string = this._readRegister();
        register_content_string = register_content_string  ? register_content_string : "{}";
        var register_content = JSON.parse(register_content_string);
        global_register = register_content;
    }

    /* 
     * Load the dictionary that represent the files present in the existing directories
     */
    _loadFilesOnDiskDict() {
        filesOnDisk = this.fs_manager.getFileDirStructure();
    }

    initGitForTrackingChanges() {

        const config = this._readConfig();

        if(typeof config.track_changes == "undefined") {
            this._updateConfigTrackChanges();
            config.track_changes = true;
        }

        const track_changes = config.track_changes;
        
        if(track_changes) {

            // If the track_changes is set to true
            const root_path = this.utils.getRootPath();
            const git_path = path.join(root_path, ".git");
            if(!this.fs_manager.exist(git_path)) {

                // If the git is not initiated
                this.simple_git.init(false, ()=>{
                    
                    console.log("Initiated git");    
                    this.simple_git.add(
                        path.join(this.utils.getRootPath(), '*')
                    ).commit("Initial Commit");

                    // Create gitignore
                    const gitignore_path = path.join(this.utils.getRootPath(), '.gitignore');
                    const gitignore_content = "iglooconfig.txt\nregister.json\n.gitignore";
                    this.fs_manager.writeFile(gitignore_path, gitignore_content);
                })
            } else {

                console.log("Git already initiated.");
            }

            this.track_changes = true;
        }
    }

    /**
     * Delete the git folder
     * 
     * @returns null
     */
    _removeGit() {

        const root_path = this.utils.getRootPath();
        const git_path = path.join(root_path, ".git");
        const gitignore_path = path.join(root_path, ".gitignore");

        this.fs_manager.removeDirectory(git_path);
        this.fs_manager.removeFile(gitignore_path);
    }

    _updateConfigTrackChanges() {
        var config = this._readConfig();
        const git_path = path.join(this.utils.getRootPath(), ".git");
        
        var track_changes = true;
        if(this.fs_manager.exist(git_path)) {
            // track_changes: false
            track_changes = false;
        }
        config['track_changes'] = track_changes;
        
        this.fs_manager.writeFile(
            this.utils.getConfigPath(),
            JSON.stringify(config, null, 4)
        );
    }

    /*
     * Crete the required directory structure.
     * Re-create the entities that are missing
     * Write the empty register file if not already present
     */
    createAndMaintainStructure() {
        console.log("Creating structure.");
        this._loadConfig();
        const root_path = this.utils.getRootPath();

        //get outdir path
        const outpath = path.join(root_path, constants.outdir);

        //create outdir
        this.fs_manager.makeDir(outpath);

        //create sub-directories
        const file_types = constants.FILE_TYPES;
        var dir_list_len = file_types.length;
        for(var dir_index=0; dir_index < dir_list_len; dir_index++) {
            this.fs_manager.makeDir(path.join(outpath, constants.TYPE_DIRECTORY_MAP[file_types[dir_index]]));
        }

        //create register file
        this.fs_manager._createRegisterFile(outpath);
    }

    _commitFile(file_path, commit_message) {
        // Commit the file

        this.simple_git.add(
            path.join(file_path)
        ).commit(commit_message);
    
        // Check the status, if no more files untracked, re-init git to prevent unnecessary growing size of .git
        this.simple_git.status( (err, status) => {

            if(!err) {

                if(!status.files.length) { // One of more files are untracked
                    // Re-init git
                    this._removeGit();
                    this.initGitForTrackingChanges();
                }

            } else {
                console.log("Error while checking status: " + err.toString());
            }
        });
    }

    /*
     * @file_type : the type of file to download. Eg. sys_ui_action 
     * 
     * Download the files of the given type and save in respective directory 
     */
    async _downloadSingleTypeOfFile(file_type) {
        console.log("Collecting " + file_type + " files"); 
        global_register = {};
        this._loadGlobalRegister();
        var table_name = file_type;

        // set parameter to filter by application scope
        var query_params = {
            "sysparm_query" : "sys_scope.name="+ this.app_name
        };

        var success = true;
        var all_files_response = await this.http_client.get(table_name, query_params=query_params).then(
            response=>{
                return response.body;
            }, 
            err=>{
                success = false;
                vscode.window.showErrorMessage("Error (" + err + ") while downloading file type " + table_name);
                console.log(err);
                return err;
            })

        if(!success) {
            //If downloading failed
            return false;
        } else if(all_files_response.result.length == 0) {
            vscode.window.showWarningMessage("No " + constants.TYPE_DIRECTORY_MAP[file_type] + " scripts found");
            console.log("No " + file_type + " scripts found");
            return true;
        }

        var result = all_files_response.result
        var file_list_length = result.length;

        const root_path = this.utils.getRootPath();
        const register_path = this.utils.getRegisterPath();

        for(var i=0; i<file_list_length; i++) {

            try {
                const file_name = result[i].sys_name; // TODO : Use in other places
                if(filesOnDisk[file_type] && filesOnDisk[file_type][result[i].name]) {
                    console.log("File already present");
                    continue;
                }

                const file_path = path.join(
                    root_path, 
                    constants.outdir, 
                    constants.TYPE_DIRECTORY_MAP[file_type],
                    result[i].sys_name + ".js"
                )

                this.fs_manager.writeFile(file_path, result[i].script);

                // Commit file
                if(this.track_changes) {

                    // If needed
                    const commit_message = "Imported " + constants.TYPE_SIMPLE_MAP[file_type] + file_name;
                    this._commitFile(file_path, commit_message);
                }

                if(!global_register[file_type]) {
                    global_register[file_type] = {}
                }

                global_register[file_type][result[i].sys_name] = {
                    "name" : result[i].sys_name,
                    "sys_created_on" : result[i].sys_created_on,
                    "sys_updated_on" : result[i].sys_updated_on,
                    "sys_class_name" : file_type,
                    "sys_id" : result[i].sys_id
                }            
                this.fs_manager.writeFile(register_path, JSON.stringify(global_register, null, 4))
            }
            catch(err) {
                vscode.window.showErrorMessage("Error while downloading + " + file_type + " s");
            }

        }
        console.log("Collected " + file_type + " files");
        return true;
    }

    /*
     * @current_file_name
     * Download the given file from the given table on SNOW
     * Retuen a promise that resolves to the file contents
     */
    _downloadSingleFile(file_name, table_name) {
        var query_params = {
            "sysparm_query" : "name="+ file_name + "^sys_scope.name=" + this.app_name
        };
        return this.http_client.get(table_name, query_params=query_params);
    }

    async downloadSingleFile() {
        this._loadConfig();

        var selection = "";
        await vscode.window.showQuickPick(['Confirm Import', 'Compare with local', 'Abort']).then(
            res => {
                selection = res ? res : "undefined";
                return res; //TODO : Remove
            },
            err => {
                console.log("No selection made");
                console.log(err);
                selection = "undefined";
                return "undefined"; //TODO : remove
            }
        );

        if(selection == "Abort" || selection == "undefined") {
            vscode.window.showWarningMessage("Export operation aborted");
            return;
        } else if(selection == "Compare with local") {
            this.showDiff("Local ↔ Remote");
            return;
        }

        const file_type = this.utils.getFileTypeByDir(this.utils.getDirName());
        const file_name = this.utils.getFileName().replace("\.js", "");
        const table = file_type;

        this._downloadSingleFile(file_name, table).then(
            result=>{
                const resp = result.body;
                if(resp.result.length) {
                    var res = resp.result[0];

                    const file_path = path.join(
                        this.utils.getRootPath(), 
                        constants.outdir, 
                        constants.TYPE_DIRECTORY_MAP[file_type],
                        res.sys_name + ".js"
                    )

                    try {
                        this.fs_manager.writeFile(file_path, res.script);

                        // Commit file
                        if(this.track_changes) {

                            // If needed
                            const commit_message = "Imported " + constants.TYPE_SIMPLE_MAP[file_type] + file_name; 
                            this._commitFile(file_path, commit_message);
                        }
                        
                        var register = JSON.parse(this._readRegister());
                        const register_path = this.utils.getRegisterPath();
                        if(!register[file_type]) {
                            register[file_type] = {};    
                        }
                        register[file_type][res.sys_name] = {
                            "name" : res.sys_name,
                            "sys_created_on" : res.sys_created_on,
                            "sys_updated_on" : res.sys_updated_on,
                            "sys_class_name" : file_type,
                            "sys_id" : res.sys_id
                        }            
                        this.fs_manager.writeFile(register_path, JSON.stringify(register, null, 4));
                        vscode.window.showInformationMessage("Downloaded " + file_name);
                    }
                    catch(err) {
                        vscode.window.showInformationMessage("An error has occured. Please download the script again to maintain consistency.");
                        console.log("An error has occured. Please download the script again to maintain consistency.");
                        console.log(err);
                    }
                }
                else {
                    vscode.window.showErrorMessage("Could not find " + file_name);
                }
            },
            err=>{
                console.log("Err");
                console.log(err);
                vscode.window.showErrorMessage("Error (" + err + ") while fetching " + file_name);
            }
        );
    }

    /*
     * Call the download_single_type for each file_type mentioned in the constants file
     */
    async downloadAll() {
        console.log("Downloading all files from SNOW.");
        this.createAndMaintainStructure();
        this._loadConfig();
        this._loadFilesOnDiskDict();
        var prom_list = [];
        for(var f_index=0, f_list_length = constants.FILE_TYPES.length; f_index < f_list_length; f_index++) {
            var y = this._downloadSingleTypeOfFile(constants.FILE_TYPES[f_index]);
            prom_list.push(y);
        }

        Promise.all(prom_list).then(function(values) {
            //Count of how many file types failed to download
            var failures = 0;
            values.map(item=>{
                failures = item ? failures : failures+1;
            })
            console.log("Downloaded complete. (" + failures + " failed)");
            vscode.window.showInformationMessage("Downloaded complete. (" + failures + " failed)");
        });
    }

    /*
     * Compare the current file wth its counterpart on SNOW instance
     * Give user option to select type of comparision : Local->Remote or Remote->Local
     */
    async showDiff(defaultSelection=null) {
        this._loadConfig();
        console.log("Diffing");
        var selection = "";

        if(defaultSelection) {
            selection = defaultSelection;
        }
        else {
            await vscode.window.showQuickPick(['Remote ↔ Local', 'Local ↔ Remote']).then(
                res => {
                    selection = res ? res : "undefined";
                    return res;
                },
                err => {
                    console.log("Error while resolving QuickPick selection");
                    console.log(err);
                    selection = "undefined";
                    return "undefined";
                }
            );
        }

        if(selection == "undefined") {
            vscode.window.showWarningMessage("Displaying diff operation aborted");
            return;
        }

        const current_file_name = this.utils.getFileName().replace("\.js", "");
        const dir = this.utils.getDirName();
        const file_type = this.utils.getFileTypeByDir(dir);

        console.log("Fetching " + current_file_name + " : " + file_type);

        const register_str = this._readRegister()
        const register = JSON.parse(register_str);

        var table_name = file_type;

        console.log("Looking for " + current_file_name + " in " + table_name);

        this._downloadSingleFile(current_file_name, table_name).then(
            result=>{
                const resp = result.body;
                if(resp.result.length) {
                    var res = resp.result[0].script;
                    vscode.workspace.openTextDocument({
                        content : res, 
                        language : "javascript"
                    }).then(doc => {
                        console.log("Showing diff");
                        var title = selection;
                        var leftUri = doc.uri;
                        var rightUri = vscode.window.activeTextEditor.document.uri
                        if(selection == "Local ↔ Remote") {
                            var leftUri = vscode.window.activeTextEditor.document.uri;
                            var rightUri = doc.uri;
                        }

                        vscode.commands.executeCommand(
                            'vscode.diff', 
                            leftUri,
                            rightUri, 
                        this.utils.getFileName().replace("\.js", "") + ' ' + title);
                    })//vscode.window.showTextDocument(doc))
                }
                else {
                    vscode.window.showErrorMessage("Could not find " + current_file_name);
                }
            },
            err=>{
                console.log("Err");
                console.log(err);
                vscode.window.showErrorMessage("Error (" + err + ") while fetching " + current_file_name);
            }
        );
    }

    /*
     * Upload the given file to the given table on SNOW
     */
    async uploadFile(script) {
        this._loadConfig();

        //Ask for confirmation using QuickPick
        var selection = "";
        await vscode.window.showQuickPick(['Confirm Export', 'Compare with remote', 'Abort']).then(
            res => {
                selection = res ? res : "undefined";
                return res; //TODO : Remove
            },
            err => {
                console.log("No selection made");
                console.log(err);
                selection = "undefined";
                return "undefined"; //TODO : remove
            }
        );

        if(selection == "Abort" || selection == "undefined") {
            vscode.window.showWarningMessage("Export operation aborted");
            return;
        } else if(selection == "Compare with remote") {
            this.showDiff("Remote ↔ Local");
            return;
        }

        console.log("Uploading " + this.utils.getFileName());
        var register = this._readRegister()
        register = JSON.parse(register);

        const file_type = this.utils.getFileTypeByDir(this.utils.getDirName());
        const file_name = this.utils.getFileName().replace("\.js", "");
        const file_path = this.utils.getFilePath();
        
        const table = file_type;
        const sys_id = register[file_type][file_name]['sys_id'];
        console.log("Attempting put");
        this.http_client.put(table, sys_id, script).then(result=>{
            var local_update_time = register[file_type][file_name]['sys_updated_on'];
            var result_obj = JSON.parse(result.text);


            var remote_update_ime = result_obj['result']['sys_updated_on'];
            register[file_type][file_name]['sys_updated_on'] = remote_update_ime;
            const register_path = this.utils.getRegisterPath();
            this.fs_manager.writeFile(register_path, JSON.stringify(register, null, 4))
            vscode.window.showInformationMessage("Uploaded " + file_name);
            console.log(remote_update_ime);

            if(this.track_changes) {

                // Commit if needed
                const commit_message = "Updated " + constants.TYPE_SIMPLE_MAP[file_type] + " " + file_name;
                this._commitFile(file_path,);
            }
        }, err=>{
            vscode.window.showErrorMessage("Error (" + err + ") while uploading " + file_name);
            console.log("Failed to upload " + file_name);
            console.log(err);
        })
    }

    async showExternalScript(external_file_name) {
        this._loadConfig();
        const current_file_name = this.utils.getFileName().replace("\.js", "");
        const dir = this.utils.getDirName();
        const file_type = this.utils.getFileTypeByDir(dir);

        console.log("Fetching " + external_file_name + " : " + current_file_name + " : " + file_type);

        const register_str = this._readRegister()
        const register = JSON.parse(register_str);

        if(register[file_type] && register[file_type][current_file_name])
            var table_name = file_type;
        else {
            console.log("Unknown file");
            var current_file_header_str = vscode.window.activeTextEditor.document.lineAt(1).text;
            var current_file_header = JSON.parse(current_file_header_str);
            table_name = current_file_header['table'];
        }

        table_name = table_name=="ecc_agent_script_include" ? table_name : "sys_script_include";

        if(register[table_name] && register[table_name][external_file_name]) {
            console.log("External file already present");
            var file_path = path.join(
                this.utils.getRootPath(),
                constants.outdir,
                constants.TYPE_DIRECTORY_MAP[table_name],
                external_file_name+".js"
            )

            var uri = vscode.Uri.file(file_path);  
            vscode.window.showTextDocument(uri);
            return;
        }

        console.log("Looking for " + external_file_name + " in " + table_name);

        var query_params = {
            "sysparm_query" : "name="+ external_file_name
        };

        this.http_client.get(table_name, query_params=query_params).then(
            result=>{
                const resp = result.body;
                if(resp.result.length) {
                    var res = resp.result[0].script;
                    res  = '/*\n{"table" : '+ '"'+ table_name +'"}\n*/\n' + res;
                    vscode.workspace.openTextDocument({
                        content : res, 
                        language : "javascript"
                    }).then(doc => vscode.window.showTextDocument(doc))
                }
                else {
                    vscode.window.showErrorMessage("Could not find " + external_file_name);
                }
            },
            err=>{
                console.log("Err");
                console.log(err);
                vscode.window.showErrorMessage("Error (" + err + ") while fetching " + external_file_name);
            }
        );

    }
}
exports.SyncManager = SyncManager;