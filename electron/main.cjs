const { app, BrowserWindow, desktopCapturer, dialog, session, shell } = require("electron");
const path = require("node:path");

let mainWindow;

function isAppOrigin(url) {
  return typeof url === "string" && url.startsWith("file://");
}

function configureMediaPermissions() {
  const appSession = session.defaultSession;

  appSession.setPermissionCheckHandler((contents, permission, requestingOrigin) => {
    const origin = contents?.getURL() || requestingOrigin;
    return isAppOrigin(origin) && ["media", "display-capture"].includes(permission);
  });

  appSession.setPermissionRequestHandler((contents, permission, callback, details = {}) => {
    if (!isAppOrigin(contents.getURL())) return callback(false);

    if (permission === "media") {
      const mediaTypes = details.mediaTypes || [];
      return callback(mediaTypes.includes("audio") && !mediaTypes.includes("video"));
    }

    if (permission === "display-capture") return callback(true);
    return callback(false);
  });

  appSession.setDisplayMediaRequestHandler(async (request, callback) => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ["screen", "window"],
        thumbnailSize: { width: 0, height: 0 },
      });

      if (!request.videoRequested || sources.length === 0 || !mainWindow) {
        callback({});
        return;
      }

      const labels = sources.map((source) => {
        const kind = source.id.startsWith("screen:") ? "Screen" : "Window";
        const name = source.name.replace(/\s+/g, " ").trim();
        const label = `${kind}: ${name || "Untitled"}`;
        return label.length > 72 ? `${label.slice(0, 69)}…` : label;
      });
      const cancelIndex = labels.length;
      const result = await dialog.showMessageBox(mainWindow, {
        type: "question",
        title: "Choose audio source",
        message: "Choose the screen or window whose audio you want to record.",
        detail: "Only audio is recorded. Screen and window video are not saved.",
        buttons: [...labels, "Cancel"],
        cancelId: cancelIndex,
        defaultId: 0,
        noLink: true,
      });

      if (result.response < 0 || result.response >= sources.length) {
        callback({});
        return;
      }

      callback({
        video: sources[result.response],
        ...(request.audioRequested ? { audio: "loopback" } : {}),
      });
    } catch (error) {
      console.error("Could not prepare desktop audio capture:", error);
      callback({});
    }
  }, { useSystemPicker: true });
}

function configureRecordingDownloads() {
  session.defaultSession.on("will-download", async (_event, item) => {
    item.pause();

    const filename = item.getFilename();
    const extension = path.extname(filename).replace(/^\./, "").toLowerCase();
    const options = {
      title: "Save audio recording",
      defaultPath: path.join(app.getPath("downloads"), filename),
      ...(extension
        ? { filters: [{ name: `${extension.toUpperCase()} audio`, extensions: [extension] }] }
        : {}),
    };

    try {
      const result = mainWindow
        ? await dialog.showSaveDialog(mainWindow, options)
        : await dialog.showSaveDialog(options);
      if (result.canceled || !result.filePath) {
        item.cancel();
        return;
      }
      item.setSavePath(result.filePath);
      item.resume();
    } catch (error) {
      console.error("Could not open the recording save dialog:", error);
      item.cancel();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 860,
    minWidth: 860,
    minHeight: 640,
    title: "DJ Companion",
    autoHideMenuBar: true,
    backgroundColor: "#111016",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isAppOrigin(url)) event.preventDefault();
  });

  mainWindow.webContents.on("did-finish-load", () => {
    console.log("DJ Companion desktop UI loaded.");
  });
  mainWindow.webContents.on("did-fail-load", (_event, code, description, url) => {
    console.error(`Could not load the desktop UI (${code}): ${description} [${url}]`);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  void mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

app.whenReady().then(() => {
  configureMediaPermissions();
  configureRecordingDownloads();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
