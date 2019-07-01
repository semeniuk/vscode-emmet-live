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

        // if selection is empty then try to select current line
        if (!originalText) {
            var currentLineIndex = editor.selection.active.line;
            var currentLine = editor.document.lineAt(currentLineIndex);
            originalText = currentLine ? currentLine.text : originalText;

            // select current line
            var selectionFrom = new vscode.Position(currentLineIndex, 0);
            var selectionTo = new vscode.Position(currentLineIndex, originalText.length);
            editor.selections = [new vscode.Selection(selectionFrom, selectionTo)];
        }

        vscode.window.showInputBox({
            placeHolder: "Emmet Abbreviation",
            prompt: "Type your Emmet abbreviation",
            value: originalText.trim(),
            validateInput: function (abbr) {
                try {
                    var result = expand(abbr);
                } catch (e) {
                    return "Invalid Emmet abbreviation";
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