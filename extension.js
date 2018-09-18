/*
 *VS Code extension to partially localize the servicenow application devlopment.
 *Author : Harsh Sodiwala
 */

const vscode = require('vscode');
const SyncManager = require('./SyncManager');
const FileSystemManager = require('./FileSystemManager');
const Utils = require('./Utils');

const path = require('path');
const constants = require('./constants');

/*
 * Called as soon as the extension is loaded
 * Register commands with appropriate callback functions
 */
function activate(context) {

    vscode.window.setStatusBarMessage("Igloo : activating");
    console.log('Igloo is being activated');

    var sync_manager = new SyncManager.SyncManager();
    var fs_manager = new FileSystemManager.FileSystemManager();
    var utils = new Utils.Utils();
    
    console.log('Igloo is now active');
    //Display the message in status bar to notify the activity of extension
    vscode.window.setStatusBarMessage("Igloo : active");

    //Create/Repair the directory structure as expected  
    sync_manager.createAndMaintainStructure();

    let downloadAll = vscode.commands.registerCommand('extension.downloadAll', function () {
        //Download all files from snow
        sync_manager.downloadAll();
    });

    let showDiff = vscode.commands.registerCommand('extension.showDiff', function () {
        //Show diff between local file and snow file
        sync_manager.showDiff();
    });

    let uploadToSnow = vscode.commands.registerCommand('extension.uploadToSnow', function () {
        //Export file to snow
        const file_path = utils.getFilePath();
        const text = vscode.window.activeTextEditor.document.getText();
        console.log("Trying to uplaod " + file_path);
        
        sync_manager.uploadFile(text);
    });

    let downloadFromSnow = vscode.commands.registerCommand('extension.downloadFromSnow', function () {
        //Download the current file from snow
        sync_manager.downloadSingleFile();
    });

    let showExternalScript = vscode.commands.registerCommand('extension.showExternalScript', function () {
        //Navigate to the script named as the current selected text
        const selection = vscode.window.activeTextEditor.selection;
        
        var line_start = selection.start.line;
        var line_end = selection.end.line;
        var char_start = selection.start.character;
        var char_end = selection.end.character;

        if(line_start != line_end) {
            vscode.window.showErrorMessage("Invalid selection.");
            return;
        }

        var selection_line_string = vscode.window.activeTextEditor.document.lineAt(line_start).text;
        var selection_string = selection_line_string.slice(char_start, char_end);
        
        sync_manager.showExternalScript(selection_string).then(
            result=>{

            },
            err => {
                console.log(err);
            }
        );

    });
    
    let establishStructure = vscode.commands.registerCommand('extension.establishStructure', function () {
        //Create or repair the required directory structure and files
        sync_manager.createAndMaintainStructure();
    });

    context.subscriptions.push(downloadAll);
    context.subscriptions.push(showDiff);
    context.subscriptions.push(uploadToSnow);
    context.subscriptions.push(downloadFromSnow);
    context.subscriptions.push(showExternalScript);
    context.subscriptions.push(establishStructure);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;