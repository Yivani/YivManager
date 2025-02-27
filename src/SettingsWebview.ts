import * as vscode from "vscode";

interface KeyboardShortcuts {
  openProject: string;
  addProject: string;
  copyProject: string;
  selectTargetFolder: string;
}

interface Settings {
  showInStatusBar: boolean;
  targetFolder: string;
  shortcuts: KeyboardShortcuts;
}

export class SettingsWebview {
  private panel: vscode.WebviewPanel | undefined;

  constructor(private context: vscode.ExtensionContext) {}

  public show() {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "yivmanagerSettings",
      "YivManager Settings",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    this.panel.webview.html = this.getWebviewContent();
    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });

    this.panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "saveSettings":
          await this.saveSettings(message.settings);
          break;
      }
    });
  }

  private async saveSettings(settings: Settings) {
    const config = vscode.workspace.getConfiguration("projectManager");
    await config.update(
      "keyboardShortcuts",
      settings.shortcuts,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      "targetFolder",
      settings.targetFolder,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      "showInStatusBar",
      settings.showInStatusBar,
      vscode.ConfigurationTarget.Global
    );
    vscode.window.showInformationMessage("Settings saved successfully!");
  }

  private getWebviewContent() {
    const config = vscode.workspace.getConfiguration("projectManager");
    const shortcuts = config.get<KeyboardShortcuts>("keyboardShortcuts") ?? {
      openProject: "ctrl+alt+p",
      addProject: "ctrl+alt+a",
      copyProject: "ctrl+alt+c",
      selectTargetFolder: "ctrl+alt+t",
    };
    const targetFolder = config.get<string>("targetFolder");
    const showInStatusBar = config.get<boolean>("showInStatusBar");

    return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { padding: 20px; }
                    .setting-group { margin-bottom: 20px; }
                    label { display: block; margin-bottom: 5px; }
                    input { width: 200px; margin-bottom: 10px; }
                </style>
            </head>
            <body>
                <h2>YivManager Settings</h2>
                
                <div class="setting-group">
                    <h3>General Settings</h3>
                    <label>
                        <input type="checkbox" id="showInStatusBar" ${
                          showInStatusBar ? "checked" : ""
                        }>
                        Show in Status Bar
                    </label>
                    <label>Target Folder:</label>
                    <input type="text" id="targetFolder" value="${
                      targetFolder || ""
                    }">
                </div>

                <div class="setting-group">
                    <h3>Keyboard Shortcuts</h3>
                    <label>Open Project:</label>
                    <input type="text" id="shortcut-openProject" value="${
                      shortcuts.openProject
                    }">
                    
                    <label>Add Project:</label>
                    <input type="text" id="shortcut-addProject" value="${
                      shortcuts.addProject
                    }">
                    
                    <label>Copy Project:</label>
                    <input type="text" id="shortcut-copyProject" value="${
                      shortcuts.copyProject
                    }">
                    
                    <label>Select Target Folder:</label>
                    <input type="text" id="shortcut-selectTargetFolder" value="${
                      shortcuts.selectTargetFolder
                    }">
                </div>

                <button onclick="saveSettings()">Save Settings</button>

                <script>
                    function saveSettings() {
                        const settings: Settings = {
                            showInStatusBar: document.getElementById('showInStatusBar').checked,
                            targetFolder: document.getElementById('targetFolder').value,
                            shortcuts: {
                                openProject: document.getElementById('shortcut-openProject').value,
                                addProject: document.getElementById('shortcut-addProject').value,
                                copyProject: document.getElementById('shortcut-copyProject').value,
                                selectTargetFolder: document.getElementById('shortcut-selectTargetFolder').value
                            }
                        };
                        vscode.postMessage({ command: 'saveSettings', settings });
                    }
                </script>
            </body>
            </html>
        `;
  }
}
