// VS Code API Reference: https://code.visualstudio.com/api/references/vscode-api

const vscode = require('vscode');

let emmetHelper;
function getEmmetHelper() {
    // Lazy load vscode-emmet-helper instead of importing it
    // directly to reduce the start-up time of the extension
    if (!emmetHelper) {
        emmetHelper = require('vscode-emmet-helper');
    }
    return emmetHelper;
}

function expand(abbr) {
    let helper = getEmmetHelper(),
        expandOptions = helper.getExpandOptions('html'), // TODO: consider editor.document.languageId
        parsedAbbr = helper.parseAbbreviation(abbr);
    return helper.expandAbbreviation(parsedAbbr, expandOptions);
}

function expandPreview(abbr) {
    let result = expand(abbr);
    // replace tabstops with their placeholders (if any)
    return result.replace(/\$\{\d+\:?(.*?)\}/g, '$1');
}

function activate(context) {
    const disposable = vscode.commands.registerCommand('ysemeniuk.emmetLive', () => {

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('Emmet Live: no active text editor');
            return; // No open text editor
        }

        let originalText = editor.document.getText(editor.selection);

        // if selection is empty then try to select current line
        // TODO: improve this behavior with emmetHelper.extractAbbreviation and/or emmetHelper.extractAbbreviationFromText
        if (!originalText) {
            let currentLineIndex = editor.selection.active.line;
            let currentLine = editor.document.lineAt(currentLineIndex);
            originalText = currentLine ? currentLine.text : originalText;

            // select current line
            let selectionFrom = new vscode.Position(currentLineIndex, 0);
            let selectionTo = new vscode.Position(currentLineIndex, originalText.length);
            editor.selections = [new vscode.Selection(selectionFrom, selectionTo)];
        }

        let recordUndoStops = true;

        vscode.window.showInputBox({
            placeHolder: 'Emmet Abbreviation',
            prompt: 'Type your Emmet abbreviation',
            value: originalText.trim(),
            validateInput: function (abbr) {
                try {
                    let result = expandPreview(abbr);
                    editor.edit((editBuilder) => {
                        editBuilder.replace(editor.selection, result);
                    }, { undoStopAfter: false, undoStopBefore: recordUndoStops });
                    // record only first edit
                    recordUndoStops = false;
                } catch (e) {
                    return 'Invalid Emmet abbreviation';
                }
            }
        }).then((abbr) => {
            if (abbr) {
                let result = expand(abbr);
                editor.insertSnippet(new vscode.SnippetString(result));
            } else {
                // if input dismissed (abbr is undefined) then restore original text
                editor.edit((editBuilder) => {
                    editBuilder.replace(editor.selection, originalText);
                }, { undoStopAfter: false, undoStopBefore: false });
            }
        });

    });

    context.subscriptions.push(disposable);
}

function deactivate() {
}

exports.activate = activate;
exports.deactivate = deactivate;