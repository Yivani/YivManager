/**
 * SettingsWebview.ts - Settings UI Implementation
 * ============================================
 *
 * @copyright Copyright (c) 2023-2024 Yivani
 * @license GPL-3.0
 * @author Yivani
 *
 * This module provides the settings webview UI for YivManager. It allows
 * users to configure various aspects of the extension including target folder
 * and visibility in the status bar.
 *
 * This program is part of YivManager and is governed by its license terms.
 */

import * as vscode from "vscode";

interface Settings {
  showInStatusBar: boolean;
  targetFolder: string;
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
    const targetFolder = config.get<string>("targetFolder") ?? "";
    const showInStatusBar = config.get<boolean>("showInStatusBar") ?? true;

    return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        padding: 0;
                        color: var(--vscode-foreground);
                        font-size: var(--vscode-font-size);
                        font-weight: var(--vscode-font-weight);
                        font-family: var(--vscode-font-family);
                        background-color: var(--vscode-editor-background);
                        line-height: 1.4;
                    }

                    .settings-header {
                        display: flex;
                        align-items: center;
                        margin-bottom: 20px;
                        padding: 0 20px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                        padding-bottom: 10px;
                    }

                    .settings-header h1 {
                        font-size: 24px;
                        font-weight: 600;
                        margin: 0;
                        flex-grow: 1;
                    }

                    button {
                        border: none;
                        padding: 6px 14px;
                        text-align: center;
                        color: var(--vscode-button-foreground);
                        background: var(--vscode-button-background);
                        border-radius: 2px;
                        cursor: pointer;
                    }

                    button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }

                    button.secondary {
                        color: var(--vscode-button-secondaryForeground);
                        background: var(--vscode-button-secondaryBackground);
                    }

                    button.secondary:hover {
                        background: var(--vscode-button-secondaryHoverBackground);
                    }

                    input:not([type='checkbox']),
                    textarea {
                        display: block;
                        border: none;
                        font-family: var(--vscode-font-family);
                        padding: 6px 8px;
                        color: var(--vscode-input-foreground);
                        background-color: var(--vscode-input-background);
                        border: 1px solid var(--vscode-input-background);
                        width: 250px;
                    }

                    .settings-container {
                        padding: 0 20px;
                    }

                    .settings-card {
                        background-color: #1e2230;
                        padding: 16px;
                        border-radius: 4px;
                    }

                    .setting-group {
                        margin-bottom: 20px;
                    }

                    .setting-group:last-child {
                        margin-bottom: 0;
                    }

                    h2 {
                        margin-top: 0;
                        margin-bottom: 16px;
                        font-size: 16px;
                        font-weight: 600;
                    }

                    .setting-description {
                        font-size: 12px;
                        opacity: 0.7;
                        margin-bottom: 10px;
                    }

                    label {
                        display: block;
                        font-weight: 500;
                    }

                    .checkbox-label {
                        display: flex;
                        align-items: center;
                        margin-bottom: 4px;
                    }

                    .checkbox-label span {
                        margin-left: 8px;
                    }

                    #targetFolder {
                        margin-top: 4px;
                    }

                    .actions {
                        display: flex;
                        justify-content: flex-end;
                        margin-top: 24px;
                        padding: 0 20px;
                        gap: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="settings-header">
                    <h1>YivManager Settings</h1>
                </div>

                <div class="settings-container">
                    <!-- General Settings Card -->
                    <div class="settings-card">
                        <h2>General Settings</h2>
                        <div class="setting-group">
                            <div class="checkbox-label">
                                <input type="checkbox" id="showInStatusBar" ${
                                  showInStatusBar ? "checked" : ""
                                }>
                                <span>Show in Status Bar</span>
                            </div>
                            <div class="setting-description">
                                Display YivManager icon in the VS Code status bar for quick access
                            </div>
                        </div>

                        <div class="setting-group">
                            <label for="targetFolder">Target Folder</label>
                            <div class="setting-description">
                                Default location for copying projects
                            </div>
                            <input type="text" id="targetFolder" value="${
                              targetFolder || ""
                            }">
                        </div>
                    </div>
                </div>

                <div class="actions">
                    <button onclick="saveSettings()">Save Settings</button>
                </div>

                <script>
                    function saveSettings() {
                        const settings = {
                            showInStatusBar: document.getElementById('showInStatusBar').checked,
                            targetFolder: document.getElementById('targetFolder').value
                        };

                        const vscode = acquireVsCodeApi();
                        vscode.postMessage({ command: 'saveSettings', settings });
                    }
                </script>
            </body>
            </html>
        `;
  }
}
