// VS Code API Reference: https://code.visualstudio.com/api/references/vscode-api

var vscode = require('vscode');
var parser = require('emmet/lib/parser/abbreviation');

function expand(abbr) {
    var result = parser.expand(abbr);
    // replace tabstops with their placeholders (if any)
    result = result.replace(/\$\{\d+\:?(.*?)\}/g, "$1");
    return result;
}

function activate(context) {
    var disposable = vscode.commands.registerCommand('ysemeniuk.emmetLive', function () {

        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('Emmet Live: no active text editor');
            return; // No open text editor
        }
                
        var originalText = editor.document.getText(editor.selection);
        // current line text: editor.document.lineAt(editor.selection.active.line).text
        // todo: if selection is empty
        // select current line

        vscode.window.showInputBox({
            placeHolder: "Emmet Abbreviation",
            prompt: "Type your abbreviation",
            value: originalText,
            validateInput: function (abbr) {
                try {
                    var result = expand(abbr);
                } catch (e) {
                    return "Invalid abbreviation";
                }
                editor.edit(function (editBuilder) {
                    editBuilder.replace(editor.selection, result);
                }, { undoStopAfter: false, undoStopBefore: false });
            }
        }).then(function (abbr) {
            // if input dismissed (abbr is undefined) then restore original text
            if (!abbr) {
                editor.edit(function(editBuilder){
                    editBuilder.replace(editor.selection, originalText);
                }, {undoStopAfter: false, undoStopBefore: false});  
            }
        });

    });

    context.subscriptions.push(disposable);
}

function deactivate() {
}

exports.activate = activate;
exports.deactivate = deactivate;