/**
 * Type definitions for the ADB MCP Server
 */

import { z } from 'zod';

// RequestHandlerExtra interface for MCP SDK
export interface RequestHandlerExtra {
  uri: URL;
  [key: string]: unknown;
}

/**
 * Response type for command execution
 */
export interface CommandResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
  [key: string]: unknown;
}

/**
 * Resource response format
 */
export interface ResourceResponse {
  contents: Array<{ uri: string; text: string }>;
  isError?: boolean;
  [key: string]: unknown;
}

/**
 * Log levels enum
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

// Schema definitions for tool inputs
export const adbDevicesInputSchema = {
  random_string: z.string().optional()
};

export const adbShellInputSchema = {
  command: z.string().describe("Shell command to execute on the device"),
  device: z.string().optional().describe("Specific device ID (optional)")
};

export const adbInstallInputSchema = {
  apkPath: z.string().describe("Local path to the APK file"),
  device: z.string().optional().describe("Specific device ID (optional)")
};

export const adbLogcatInputSchema = {
  filter: z.string().optional().describe("Logcat filter expression (optional)"),
  device: z.string().optional().describe("Specific device ID (optional)"),
  lines: z.number().optional().default(50).describe("Number of lines to return (default: 50)")
};

export const adbPullInputSchema = {
  remotePath: z.string().describe("Remote file path on the device"),
  device: z.string().optional().describe("Specific device ID (optional)"),
  asBase64: z.boolean().optional().default(true).describe("Return file content as base64 (default: true)")
};

export const adbPushInputSchema = {
  fileBase64: z.string().describe("Base64 encoded file content to push"),
  remotePath: z.string().describe("Remote file path on the device"),
  device: z.string().optional().describe("Specific device ID (optional)")
};

export const dumpImageInputSchema = {
  device: z.string().optional().describe("Specific device ID (optional)"),
  asBase64: z.boolean().optional().default(false).describe("Return image as base64 (default: false)")
};

export const inspectUiInputSchema = {
  device: z.string().optional().describe("Specific device ID (optional)"),
  outputPath: z.string().optional().describe("Custom output path on device (default: /sdcard/window_dump.xml)"),
  asBase64: z.boolean().optional().default(false).describe("Return XML content as base64 (default: false)")
};

// Fastboot tool schemas
export const fastbootDevicesInputSchema = {
  random_string: z.string().optional()
};

export const fastbootCommandInputSchema = {
  command: z.string().describe("Fastboot command to execute (e.g. 'getvar all', 'oem unlock')"),
  device: z.string().optional().describe("Specific device serial number (optional)")
};

export const fastbootFlashInputSchema = {
  partition: z.string().describe("Partition to flash (e.g. 'boot', 'recovery', 'system', 'vendor')"),
  imagePath: z.string().describe("Local path to the image file to flash"),
  device: z.string().optional().describe("Specific device serial number (optional)")
};

export const fastbootEraseInputSchema = {
  partition: z.string().describe("Partition to erase (e.g. 'cache', 'userdata')"),
  device: z.string().optional().describe("Specific device serial number (optional)")
};

export const fastbootRebootInputSchema = {
  target: z.enum(["system", "bootloader"]).optional().default("system")
    .describe("Reboot target: 'system' (default) or 'bootloader'"),
  device: z.string().optional().describe("Specific device serial number (optional)")
};

export const fastbootGetvarInputSchema = {
  variable: z.string().describe("Variable to query (e.g. 'all', 'product', 'serialno', 'unlocked', 'battery-voltage')"),
  device: z.string().optional().describe("Specific device serial number (optional)")
};

export const fastbootOemInputSchema = {
  oemCommand: z.string().describe("OEM command to execute (e.g. 'unlock', 'lock', 'device-info')"),
  device: z.string().optional().describe("Specific device serial number (optional)")
};

export const fastbootBootInputSchema = {
  imagePath: z.string().describe("Local path to the boot image to boot from (does not flash)"),
  device: z.string().optional().describe("Specific device serial number (optional)")
};

// Activity Manager tool schema
export const adbActivityManagerSchema = z.object({
  amCommand: z.string().describe("Activity Manager subcommand, e.g. 'start', 'broadcast', 'force-stop', etc."),
  amArgs: z.string().optional().describe("Arguments for the am subcommand, e.g. '-a android.intent.action.VIEW'"),
  device: z.string().optional().describe("Specific device ID (optional)")
});

// Package Manager tool schema
export const adbPackageManagerSchema = z.object({
  pmCommand: z.string().describe("Package Manager subcommand, e.g. 'list', 'install', 'uninstall', 'grant', 'revoke', etc."),
  pmArgs: z.string().optional().describe("Arguments for the pm subcommand, e.g. 'packages', 'com.example.app android.permission.CAMERA'"),
  device: z.string().optional().describe("Specific device ID (optional)")
});



// Zod schema objects
export const AdbDevicesSchema = z.object(adbDevicesInputSchema);
export const AdbShellSchema = z.object(adbShellInputSchema);
export const AdbInstallSchema = z.object(adbInstallInputSchema);
export const AdbLogcatSchema = z.object(adbLogcatInputSchema);
export const AdbPullSchema = z.object(adbPullInputSchema);
export const AdbPushSchema = z.object(adbPushInputSchema);
export const AdbScreenshotSchema = z.object(dumpImageInputSchema);
export const AdbUidumpSchema = z.object(inspectUiInputSchema);
export const AdbActivityManagerSchema = adbActivityManagerSchema;
export const AdbPackageManagerSchema = adbPackageManagerSchema;

export const FastbootDevicesSchema = z.object(fastbootDevicesInputSchema);
export const FastbootCommandSchema = z.object(fastbootCommandInputSchema);
export const FastbootFlashSchema = z.object(fastbootFlashInputSchema);
export const FastbootEraseSchema = z.object(fastbootEraseInputSchema);
export const FastbootRebootSchema = z.object(fastbootRebootInputSchema);
export const FastbootGetvarSchema = z.object(fastbootGetvarInputSchema);
export const FastbootOemSchema = z.object(fastbootOemInputSchema);
export const FastbootBootSchema = z.object(fastbootBootInputSchema);

// Input type definitions
export type AdbDevicesInput = z.infer<typeof AdbDevicesSchema>;
export type AdbShellInput = z.infer<typeof AdbShellSchema>;
export type AdbInstallInput = z.infer<typeof AdbInstallSchema>;
export type AdbLogcatInput = z.infer<typeof AdbLogcatSchema>;
export type AdbPullInput = z.infer<typeof AdbPullSchema>;
export type AdbPushInput = z.infer<typeof AdbPushSchema>;
export type AdbScreenshotInput = z.infer<typeof AdbScreenshotSchema>;
export type AdbUidumpInput = z.infer<typeof AdbUidumpSchema>;
export type AdbActivityManagerInput = z.infer<typeof AdbActivityManagerSchema>;
export type AdbPackageManagerInput = z.infer<typeof AdbPackageManagerSchema>;

export type FastbootDevicesInput = z.infer<typeof FastbootDevicesSchema>;
export type FastbootCommandInput = z.infer<typeof FastbootCommandSchema>;
export type FastbootFlashInput = z.infer<typeof FastbootFlashSchema>;
export type FastbootEraseInput = z.infer<typeof FastbootEraseSchema>;
export type FastbootRebootInput = z.infer<typeof FastbootRebootSchema>;
export type FastbootGetvarInput = z.infer<typeof FastbootGetvarSchema>;
export type FastbootOemInput = z.infer<typeof FastbootOemSchema>;
export type FastbootBootInput = z.infer<typeof FastbootBootSchema>;