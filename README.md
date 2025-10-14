# Minimalistic Clipboard

A cross-platform desktop clipboard manager built with Electron and React. Simple, clean, and minimalistic - manage your clipboard history, pin important items, search through past copies, and boost your productivity.

## ✨ Features

### Free Version
- 📋 **Automatic Clipboard History** - Captures up to 20 clipboard items
- 📌 **Pin Important Items** - Keep frequently used text snippets at the top
- 🔍 **Fast Search** - Quickly find past clipboard items
- ⌨️ **Global Hotkey** - Open/close with `Ctrl+Shift+V` (customizable)
- 💾 **Persistent Storage** - History survives app restarts
- 🎨 **Modern UI** - Clean, intuitive interface with dark mode
- 🖥️ **System Tray Integration** - Runs in background

### Pro Version ✨
- ♾️ **Unlimited Clipboard History** - No 20-item limit
- ⚙️ **All Free Features** - Plus everything from the free version
- 🎯 **Priority Support** - Get help faster
- 🚀 **Future Premium Features** - Early access to new capabilities

**Upgrade to Pro:** Click the "✨ Upgrade to Pro" button in the app and enter your license key.

**Demo License Keys for Testing:**
- `PRO-MC-2024-PREMIUM`
- `PRO-MC-LIFETIME-KEY`

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm installed

### Installation

1. Clone or download this repository
2. Open terminal in the project folder
3. Install dependencies:

```bash
npm install
```

### Running in Development

```bash
npm start
```

This will:
- Start the React development server on port 3000
- Launch the Electron app
- Enable hot-reload for React components

### Building for Production

```bash
npm run package
```

This creates a distributable package in the `dist` folder for your platform.

## 🎯 Usage

### Basic Operations

- **Copy text** anywhere on your system - it's automatically captured
- **Open app** with `Ctrl+Shift+V` or click tray icon
- **Search** using the search bar at the top
- **Copy again** by clicking the "📋 Copy" button on any item
- **Pin items** to keep them at the top with "📍 Pin"
- **Delete items** with the trash icon

### Global Hotkey

Default: `Ctrl+Shift+V` (Windows/Linux) or `Cmd+Shift+V` (macOS)

Change it in Settings (⚙️ button in top-right).

### Settings

- **Max History Size**: Control how many items to keep (default: 100)
- **Global Hotkey**: Customize the keyboard shortcut to open the app

## 🛠️ Technology Stack

- **Electron** - Desktop application framework
- **React** - UI library
- **electron-store** - Persistent data storage
- **react-scripts** - Build tooling

## 📁 Project Structure

```
minimalistic-clipboard/
├── electron/
│   ├── main.js          # Electron main process
│   └── preload.js       # Preload script (IPC bridge)
├── src/
│   ├── components/
│   │   ├── ClipboardList.js    # History list component
│   │   ├── SearchBar.js        # Search input
│   │   └── Settings.js         # Settings panel
│   ├── App.js           # Main React component
│   └── index.js         # React entry point
├── public/
│   └── index.html       # HTML template
└── package.json         # Dependencies and scripts
```

## 🔧 Development

### Available Scripts

- `npm start` - Run in development mode
- `npm run build` - Build React app for production
- `npm run package` - Create distributable package
- `npm run start:react` - Start React dev server only
- `npm run start:electron` - Start Electron only

### Debugging

The app opens DevTools in development mode automatically. You can also:
- Press `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (macOS) to toggle DevTools
- Check the console for clipboard capture events

## 📦 Building Installers

To create installers (NSIS for Windows, DMG for macOS, AppImage for Linux):

```bash
npm run build:electron
```

Output will be in the `dist` folder.

## 🐛 Troubleshooting

### Clipboard not capturing
- Ensure the app has necessary permissions
- On macOS, grant Accessibility permissions in System Preferences
- Check console for errors

### Global hotkey not working
- Make sure no other app is using the same hotkey
- Try changing it in Settings
- Restart the app after changing hotkey

### App not appearing in tray
- On some Linux systems, you may need to install system tray support
- Try Alt+Tab to find the window

## 🤝 Contributing

Contributions welcome! Please feel free to submit issues or pull requests.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🎉 Enjoy!

Made with ❤️ using Electron and React

---

**Tips:**
- Use search to quickly find old clipboard items
- Pin frequently used snippets for instant access
- Customize the global hotkey to your preference
- Clear old history periodically to keep things tidy

## 🛒 Demo Purchase Flow (Hosted checkout + Automatic Activation)

This project includes a minimal demo server that simulates a hosted checkout and issues license keys. The server shows a success page that contains a deep link which opens the app and automatically activates the license.

Notes: this demo server is for local testing only. For production use Stripe or Paddle with proper webhook verification and secure storage.

Run the demo server:

```powershell
cd server
npm install
npm start
```

Open the demo checkout URL in a browser (for example):

http://localhost:4242/checkout-demo?email=you@example.com

The demo will redirect to a success page that shows a license key and an "Open in app" button that uses the custom protocol:

minimalistic-clipboard://activate?key=YOUR_LICENSE_KEY

When the app receives that deep link it will automatically activate the key and switch to Pro mode.

Production checklist:
- Use Stripe Checkout or Paddle for payments
- Implement server-side webhooks and validate signatures
- Store licenses in a proper database
- Implement revocation checks and refund handling
- Use HTTPS for all endpoints

## Notes
- Need documentation on the website.
- Documentation on code.
- Premium payment method has to be fully functional (need a little bit of research on this)
- Needs to be launch on the microsoft store.
- Future (maybe it can be adapted for androids)

