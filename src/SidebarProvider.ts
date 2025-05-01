/**
 * SidebarProvider.ts - Sidebar UI Implementation
 * ============================================
 *
 * @copyright Copyright (c) 2023-2024 Yivani
 * @license GPL-3.0
 * @author Yivani
 *
 * This module provides the sidebar UI for YivManager. It renders the webview
 * with buttons for accessing all major features and displays the current
 * target folder. It serves as the main interaction point for users.
 *
 * This program is part of YivManager and is governed by its license terms.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'yivmanager.sidebar';

  private _view?: vscode.WebviewView;
  private _disposables: vscode.Disposable[] = [];

  constructor(private readonly _extensionUri: vscode.Uri) {
    // Add configuration change listener
    this._disposables.push(
      vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('projectManager.targetFolder')) {
          this._updateTargetFolder();
        }
      })
    );
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.command) {
        case 'addProject':
          vscode.commands.executeCommand('projectManager.addProject');
          break;
        case 'openProject':
          vscode.commands.executeCommand('projectManager.openProject');
          break;
        case 'copyProject':
          vscode.commands.executeCommand('projectManager.copyProject');
          break;
        case 'selectTargetFolder':
          vscode.commands.executeCommand('projectManager.selectTargetFolder');
          break;
        case 'openSettings':
          vscode.commands.executeCommand('projectManager.openSettings');
          break;
        case 'getTargetFolder':
          this._updateTargetFolder();
          break;
        // Add new template-related commands
        case 'saveAsTemplate':
          vscode.commands.executeCommand('projectManager.saveAsTemplate');
          break;
        case 'createFromTemplate':
          vscode.commands.executeCommand('projectManager.createFromTemplate');
          break;
        case 'manageTemplates':
          vscode.commands.executeCommand('projectManager.manageTemplates');
          break;
      }
    });
  }

  private _updateTargetFolder() {
    if (this._view) {
      const targetFolder = this._getTargetFolder() || 'No target folder set';
      this._view.webview.postMessage({
        command: 'updateTargetFolder',
        targetFolder: targetFolder
      });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css')
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css')
    );

    // Ensure the media directory exists
    const mediaDir = path.join(this._extensionUri.fsPath, 'media');
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }

    // Create the CSS files if they don't exist
    this._ensureCssFiles(mediaDir);

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleResetUri}" rel="stylesheet">
        <link href="${styleVSCodeUri}" rel="stylesheet">
        <title>YivManager</title>
        <style>
          .button {
            display: block;
            width: 100%;
            padding: 10px;
            margin: 8px 0;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
            text-align: left;
          }
          .button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          .icon {
            margin-right: 6px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 8px;
            color: var(--vscode-foreground);
            border-bottom: 1px solid var(--vscode-widget-shadow);
            padding-bottom: 5px;
          }
          .target-path {
            margin: 10px 0;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="section">
          <div class="section-title">Project Management</div>
          <button class="button" id="openProject">
            <span class="icon">📂</span> Switch to Saved Project
          </button>
          <button class="button" id="addProject">
            <span class="icon">➕</span> Save Current Project to List
          </button>
        </div>

        <div class="section">
          <div class="section-title">Project Duplication</div>
          <button class="button" id="selectTargetFolder">
            <span class="icon">🎯</span> Set Destination Folder
          </button>

          <div id="targetPath" class="target-path">
            Destination: ${this._getTargetFolder() || 'No destination folder set'}
          </div>

          <button class="button" id="copyProject">
            <span class="icon">📋</span> Duplicate Current Project
          </button>
        </div>

        <div class="section">
          <div class="section-title">Project Templates</div>
          <button class="button" id="saveAsTemplate">
            <span class="icon">💾</span> Create Template from Current
          </button>
          <button class="button" id="createFromTemplate">
            <span class="icon">🌱</span> Create New from Template
          </button>
          <button class="button" id="manageTemplates">
            <span class="icon">🗂️</span> View & Manage Templates
          </button>
        </div>

        <div class="section">
          <div class="section-title">Options</div>
          <button class="button" id="openSettings">
            <span class="icon">⚙️</span> Configure YivManager
          </button>
        </div>

        <script>
          (function() {
            const vscode = acquireVsCodeApi();

            document.getElementById('openProject').addEventListener('click', () => {
              vscode.postMessage({ command: 'openProject' });
            });

            document.getElementById('addProject').addEventListener('click', () => {
              vscode.postMessage({ command: 'addProject' });
            });

            document.getElementById('copyProject').addEventListener('click', () => {
              vscode.postMessage({ command: 'copyProject' });
            });

            document.getElementById('selectTargetFolder').addEventListener('click', () => {
              vscode.postMessage({ command: 'selectTargetFolder' });
              // Request updated target folder after selection
              setTimeout(() => {
                vscode.postMessage({ command: 'getTargetFolder' });
              }, 1000);
            });

            document.getElementById('openSettings').addEventListener('click', () => {
              vscode.postMessage({ command: 'openSettings' });
            });

            // Template buttons
            document.getElementById('saveAsTemplate').addEventListener('click', () => {
              vscode.postMessage({ command: 'saveAsTemplate' });
            });

            document.getElementById('createFromTemplate').addEventListener('click', () => {
              vscode.postMessage({ command: 'createFromTemplate' });
            });

            document.getElementById('manageTemplates').addEventListener('click', () => {
              vscode.postMessage({ command: 'manageTemplates' });
            });

            // Listen for messages from the extension
            window.addEventListener('message', event => {
              const message = event.data;
              switch (message.command) {
                case 'updateTargetFolder':
                  document.getElementById('targetPath').textContent = 'Destination: ' + message.targetFolder;
                  break;
              }
            });

            // Request initial target folder value
            vscode.postMessage({ command: 'getTargetFolder' });
          }())
        </script>
      </body>
      </html>`;
  }

  private _getTargetFolder(): string {
    return vscode.workspace.getConfiguration('projectManager').get<string>('targetFolder') || '';
  }

  private _ensureCssFiles(mediaDir: string) {
    // Create reset.css if it doesn't exist
    const resetCssPath = path.join(mediaDir, 'reset.css');
    if (!fs.existsSync(resetCssPath)) {
      const resetCss = `
        html {
          box-sizing: border-box;
          font-size: 13px;
        }

        *,
        *:before,
        *:after {
          box-sizing: inherit;
        }

        body, h1, h2, h3, h4, h5, h6, p, ol, ul {
          margin: 0;
          padding: 0;
          font-weight: normal;
        }

        img {
          max-width: 100%;
          height: auto;
        }
      `;
      fs.writeFileSync(resetCssPath, resetCss);
    }

    // Create vscode.css if it doesn't exist
    const vscodeCssPath = path.join(mediaDir, 'vscode.css');
    if (!fs.existsSync(vscodeCssPath)) {
      const vscodeCss = `
        body {
          background-color: transparent;
          color: var(--vscode-foreground);
          font-family: var(--vscode-font-family);
          padding: 10px;
        }

        a {
          color: var(--vscode-textLink-foreground);
        }

        a:hover {
          color: var(--vscode-textLink-activeForeground);
        }
      `;
      fs.writeFileSync(vscodeCssPath, vscodeCss);
    }
  }

  dispose() {
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
