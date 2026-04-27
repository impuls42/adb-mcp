# ADB & Fastboot MCP Server

An actively maintained [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) server that gives AI models direct access to Android devices via **ADB** (Android Debug Bridge) and **Fastboot**. Built in TypeScript, it is a fork of the original [srmorete/adb-mcp](https://github.com/srmorete/adb-mcp) project, extended with full Fastboot support and ongoing maintenance.

## Features

### ADB
- 📱 **Device Management** – List and interact with connected Android devices
- 📦 **App Management** – Install APKs, manage packages, control activities
- 📋 **Logging** – Stream and filter device logs via logcat
- 🔄 **File Transfer** – Push and pull files between host and device
- 📸 **UI Interaction** – Capture screenshots and inspect the UI hierarchy
- 🔧 **Shell Commands** – Execute arbitrary shell commands on a device

### Fastboot
- 🔌 **Device Discovery** – List devices currently in fastboot/bootloader mode
- ⚡ **Flash Partitions** – Flash images to specific device partitions
- 🔁 **Reboot Control** – Reboot to system, bootloader, recovery, or fastboot
- 🔍 **Variable Query** – Read bootloader variables with `getvar`
- 🗑️ **Partition Erase** – Erase individual partitions safely
- 🛠️ **OEM Commands** – Run manufacturer-specific OEM commands
- 💻 **Arbitrary Commands** – Execute any fastboot command directly

## Prerequisites

- **Node.js** v16 or higher (tested with v16, v18, and v20)
- **ADB** installed and available in your `PATH`
- **Fastboot** installed and available in your `PATH` (required for fastboot tools)
- An Android device or emulator connected via USB or network with USB debugging enabled
- Debugging authorization accepted on the device

## Installation

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/impuls42/adb-mcp.git
cd adb-mcp

# Install dependencies
npm install

# Build the TypeScript source
npm run build

# Run the server
npx adb-mcp
```

## Configuration

### Custom ADB / Fastboot Path

By default the server searches for `adb` and `fastboot` in your `PATH`. To override the ADB location:

```bash
export ADB_PATH=/path/to/adb
npx adb-mcp
```

### MCP Client Configuration

Add the following to your MCP client configuration (e.g. `mcp.json` for Cursor or Claude Desktop):

```json
{
  "mcpServers": {
    "adb": {
      "command": "npx",
      "args": ["adb-mcp"]
    }
  }
}
```

For a custom ADB binary path, pass it via the environment:

```json
{
  "mcpServers": {
    "adb": {
      "command": "npx",
      "args": ["adb-mcp"],
      "env": {
        "ADB_PATH": "/path/to/adb"
      }
    }
  }
}
```

## Usage

### Starting the Server

**The server must be running before any tools can be used.**

```bash
npx adb-mcp
```

Expected output:
```
[INFO] ADB MCP Server connected and ready
```

Keep this terminal open while working with ADB/Fastboot tools.

### Available Tools

#### 📱 Device Management

| Tool | Description |
|---|---|
| `adb_devices` | List all connected ADB devices |
| `adb_shell` | Execute a shell command on a device |

#### 📦 App Management

| Tool | Description |
|---|---|
| `adb_install` | Install an APK from a local file path |
| `adb_package_manager` | Run Package Manager (`pm`) commands – list packages, grant/revoke permissions, manage apps |
| `adb_activity_manager` | Run Activity Manager (`am`) commands – start activities, broadcast intents, control app behaviour |

#### 📋 Logging

| Tool | Description |
|---|---|
| `adb_logcat` | Stream device logs with optional tag/level filtering |

#### 🔄 File Transfer

| Tool | Description |
|---|---|
| `adb_pull` | Pull a file from the device to the host |
| `adb_push` | Push a file from the host to the device |

#### 🔍 UI Interaction

| Tool | Description |
|---|---|
| `dump_image` | Capture a screenshot of the current screen |
| `inspect_ui` | Retrieve the UI hierarchy as XML (recommended for AI-driven interaction) |

#### ⚡ Fastboot

| Tool | Description |
|---|---|
| `fastboot_devices` | List devices in fastboot/bootloader mode |
| `fastboot_flash` | Flash an image to a partition |
| `fastboot_boot` | Boot from an image without permanently flashing it |
| `fastboot_reboot` | Reboot to system, bootloader, recovery, or fastboot |
| `fastboot_getvar` | Query a bootloader variable |
| `fastboot_oem` | Run an OEM command |
| `fastboot_erase` | Erase a partition |
| `fastboot_command` | Execute an arbitrary fastboot command |

See [ACTIVITY_MANAGER_EXAMPLES.md](ACTIVITY_MANAGER_EXAMPLES.md) and [PACKAGE_MANAGER_EXAMPLES.md](PACKAGE_MANAGER_EXAMPLES.md) for detailed usage examples.

## Troubleshooting

### Server

- Ensure the server process is running (`npx adb-mcp`)
- Check the terminal output for error messages
- Enable verbose logging: `LOG_LEVEL=3 npx adb-mcp`
- Kill a hung server process:
  ```bash
  ps aux | grep "adb-mcp" | grep -v grep
  kill -9 <PID>
  ```

### Device Connection

- Verify devices are visible: use `adb_devices`
- If status is `unauthorized`, accept the debugging prompt on the device screen
- Check USB cable and port; try a different one if connection is unstable
- Restart the ADB daemon: `adb kill-server && adb start-server`

### ADB / Fastboot Not Found

- Confirm ADB is installed: `adb version`
- Confirm Fastboot is installed: `fastboot --version`
- If installed in a non-standard location, set `ADB_PATH` (see [Configuration](#configuration))

### Real Device Tips

- Enable **USB debugging** in Developer Options
- On Android 11+, also enable **USB debugging (Security settings)** if prompted
- Fastboot requires the device to be in bootloader mode: hold the correct key combination for your device or run `adb reboot bootloader`

## Compatibility

- **Android** 8.0 (Oreo) and higher
- **MCP clients**: Claude Desktop, Cursor IDE, and any standard MCP-compatible client
- **OS**: macOS and Linux (POSIX-compatible); Windows support is untested

## Contributing

Contributions are welcome! Please open an issue to discuss significant changes before submitting a pull request.

1. Fork the repository: `https://github.com/impuls42/adb-mcp`
2. Create a feature branch
3. Submit a pull request against `main`

## License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Original project by [srmorete](https://github.com/srmorete/adb-mcp)
- Built with [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction)
