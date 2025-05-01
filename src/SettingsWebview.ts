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
  cacheTTL: number;
  defaultExcludePatterns: string;
  confirmProjectOverwrite: boolean;
  confirmTemplateOverwrite: boolean;
  autoOpenNewProjects: boolean;
  showPathInStatusBar: boolean;
  statusBarPriority: number;
}

export class SettingsWebview {
  private panel: vscode.WebviewPanel | undefined;
  private disposed = false;

  constructor(private context: vscode.ExtensionContext) {}

  public show() {
    if (this.disposed) {
      // Reinitialize if it was disposed
      this.disposed = false;
    }

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
      this.disposed = true; // Mark as disposed for potential garbage collection
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
    await config.update(
      "cacheTTL",
      settings.cacheTTL,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      "defaultExcludePatterns",
      settings.defaultExcludePatterns,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      "confirmProjectOverwrite",
      settings.confirmProjectOverwrite,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      "confirmTemplateOverwrite",
      settings.confirmTemplateOverwrite,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      "autoOpenNewProjects",
      settings.autoOpenNewProjects,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      "showPathInStatusBar",
      settings.showPathInStatusBar,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      "statusBarPriority",
      settings.statusBarPriority,
      vscode.ConfigurationTarget.Global
    );

    vscode.window.showInformationMessage("Settings saved successfully!");
  }

  private getWebviewContent() {
    const config = vscode.workspace.getConfiguration("projectManager");
    const targetFolder = config.get<string>("targetFolder") ?? "";
    const showInStatusBar = config.get<boolean>("showInStatusBar") ?? true;
    const cacheTTL = config.get<number>("cacheTTL") ?? 300;
    const defaultExcludePatterns = config.get<string>("defaultExcludePatterns") ?? "node_modules,.git,dist,build,out";
    const confirmProjectOverwrite = config.get<boolean>("confirmProjectOverwrite") ?? true;
    const confirmTemplateOverwrite = config.get<boolean>("confirmTemplateOverwrite") ?? true;
    const autoOpenNewProjects = config.get<boolean>("autoOpenNewProjects") ?? true;
    const showPathInStatusBar = config.get<boolean>("showPathInStatusBar") ?? false;
    const statusBarPriority = config.get<number>("statusBarPriority") ?? 10;

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

                    input[type='number'] {
                        width: 80px;
                    }

                    .settings-container {
                        padding: 0 20px;
                    }

                    .settings-card {
                        background-color: #1e2230;
                        padding: 16px;
                        border-radius: 4px;
                        margin-bottom: 16px;
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

                    .tabs {
                        display: flex;
                        margin-bottom: 15px;
                    }

                    .tab {
                        padding: 8px 16px;
                        cursor: pointer;
                        background-color: transparent;
                        border: none;
                        border-bottom: 2px solid transparent;
                        color: var(--vscode-descriptionForeground);
                    }

                    .tab.active {
                        color: var(--vscode-foreground);
                        border-bottom: 2px solid var(--vscode-button-background);
                    }

                    .tab-content {
                        display: none;
                    }

                    .tab-content.active {
                        display: block;
                    }
                </style>
            </head>
            <body>
                <div class="settings-header">
                    <h1>YivManager Settings</h1>
                </div>

                <div class="tabs">
                    <button class="tab active" onclick="openTab('general')">General</button>
                    <button class="tab" onclick="openTab('templates')">Templates</button>
                    <button class="tab" onclick="openTab('appearance')">Appearance</button>
                    <button class="tab" onclick="openTab('advanced')">Advanced</button>
                </div>

                <div class="settings-container">
                    <!-- General Settings Card -->
                    <div id="general" class="tab-content active">
                        <div class="settings-card">
                            <h2>Location Settings</h2>
                            <div class="setting-group">
                                <label for="targetFolder">Project Destination Folder</label>
                                <div class="setting-description">
                                    Default location for new and copied projects
                                </div>
                                <input type="text" id="targetFolder" value="${
                                targetFolder || ""
                                }">
                            </div>

                            <div class="setting-group">
                                <div class="checkbox-label">
                                    <input type="checkbox" id="confirmProjectOverwrite" ${
                                    confirmProjectOverwrite ? "checked" : ""
                                    }>
                                    <span>Confirm before overwriting existing projects</span>
                                </div>
                                <div class="setting-description">
                                    Show a confirmation dialog when creating a project that would overwrite existing files
                                </div>
                            </div>

                            <div class="setting-group">
                                <div class="checkbox-label">
                                    <input type="checkbox" id="autoOpenNewProjects" ${
                                    autoOpenNewProjects ? "checked" : ""
                                    }>
                                    <span>Automatically open new projects</span>
                                </div>
                                <div class="setting-description">
                                    Open newly created projects in VS Code immediately after creation
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Templates Settings Card -->
                    <div id="templates" class="tab-content">
                        <div class="settings-card">
                            <h2>Template Settings</h2>
                            <div class="setting-group">
                                <label for="defaultExcludePatterns">Default Exclude Patterns</label>
                                <div class="setting-description">
                                    Files and folders to exclude when creating templates (comma separated)
                                </div>
                                <input type="text" id="defaultExcludePatterns" value="${
                                defaultExcludePatterns || ""
                                }">
                            </div>

                            <div class="setting-group">
                                <div class="checkbox-label">
                                    <input type="checkbox" id="confirmTemplateOverwrite" ${
                                    confirmTemplateOverwrite ? "checked" : ""
                                    }>
                                    <span>Confirm before overwriting templates</span>
                                </div>
                                <div class="setting-description">
                                    Show a confirmation dialog when creating a template with the same name as an existing one
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Appearance Settings Card -->
                    <div id="appearance" class="tab-content">
                        <div class="settings-card">
                            <h2>Status Bar Settings</h2>
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
                                <div class="checkbox-label">
                                    <input type="checkbox" id="showPathInStatusBar" ${
                                    showPathInStatusBar ? "checked" : ""
                                    }>
                                    <span>Show current project path in status bar</span>
                                </div>
                                <div class="setting-description">
                                    Display the current project's path in the status bar item
                                </div>
                            </div>

                            <div class="setting-group">
                                <label for="statusBarPriority">Status Bar Priority</label>
                                <div class="setting-description">
                                    Position priority in the status bar (lower number = further left)
                                </div>
                                <input type="number" id="statusBarPriority" min="0" max="1000" value="${statusBarPriority}">
                            </div>
                        </div>
                    </div>

                    <!-- Advanced Settings Card -->
                    <div id="advanced" class="tab-content">
                        <div class="settings-card">
                            <h2>Performance Settings</h2>
                            <div class="setting-group">
                                <label for="cacheTTL">Cache Duration (seconds)</label>
                                <div class="setting-description">
                                    Time to cache project lists before refreshing from disk (0 to disable cache)
                                </div>
                                <input type="number" id="cacheTTL" min="0" max="3600" value="${cacheTTL}">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="actions">
                    <button onclick="resetSettings()" class="secondary">Reset to Defaults</button>
                    <button onclick="saveSettings()">Save Settings</button>
                </div>

                <script>
                    function openTab(tabName) {
                        // Hide all tab contents
                        const tabContents = document.querySelectorAll('.tab-content');
                        tabContents.forEach(tab => {
                            tab.classList.remove('active');
                        });

                        // Deactivate all tabs
                        const tabs = document.querySelectorAll('.tab');
                        tabs.forEach(tab => {
                            tab.classList.remove('active');
                        });

                        // Show the selected tab content
                        document.getElementById(tabName).classList.add('active');

                        // Activate the clicked tab
                        event.currentTarget.classList.add('active');
                    }

                    function resetSettings() {
                        if (confirm('Are you sure you want to reset all settings to their default values?')) {
                            document.getElementById('targetFolder').value = '';
                            document.getElementById('showInStatusBar').checked = true;
                            document.getElementById('cacheTTL').value = '300';
                            document.getElementById('defaultExcludePatterns').value = 'node_modules,.git,dist,build,out';
                            document.getElementById('confirmProjectOverwrite').checked = true;
                            document.getElementById('confirmTemplateOverwrite').checked = true;
                            document.getElementById('autoOpenNewProjects').checked = true;
                            document.getElementById('showPathInStatusBar').checked = false;
                            document.getElementById('statusBarPriority').value = '10';

                            saveSettings();
                        }
                    }

                    function saveSettings() {
                        const settings = {
                            showInStatusBar: document.getElementById('showInStatusBar').checked,
                            targetFolder: document.getElementById('targetFolder').value,
                            cacheTTL: parseInt(document.getElementById('cacheTTL').value),
                            defaultExcludePatterns: document.getElementById('defaultExcludePatterns').value,
                            confirmProjectOverwrite: document.getElementById('confirmProjectOverwrite').checked,
                            confirmTemplateOverwrite: document.getElementById('confirmTemplateOverwrite').checked,
                            autoOpenNewProjects: document.getElementById('autoOpenNewProjects').checked,
                            showPathInStatusBar: document.getElementById('showPathInStatusBar').checked,
                            statusBarPriority: parseInt(document.getElementById('statusBarPriority').value)
                        };

                        const vscode = acquireVsCodeApi();
                        vscode.postMessage({ command: 'saveSettings', settings });
                    }
                </script>
            </body>
            </html>
        `;
  }

  public dispose() {
    if (this.panel) {
      this.panel.dispose();
      this.panel = undefined;
    }
    this.disposed = true;
  }
}
