import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import assert from "assert";

/**
 * ADB & Fastboot MCP Test Client
 *
 * This test script verifies the functionality of the ADB & Fastboot MCP server by
 * making real calls to its tools and validating the responses.
 *
 * Prerequisites:
 * - An Android device or emulator must be connected (for ADB tests)
 * - A device in fastboot/bootloader mode (for fastboot device-dependent tests)
 * - The project must be built (run 'npm run build' first)
 *
 * The tests exercise multiple functionalities including:
 * - ADB: Device detection, screenshots, UI hierarchy, shell commands
 * - Fastboot: Device listing, getvar, reboot (requires device in fastboot mode)
 */

// Define interfaces for MCP tool responses
interface ToolResponse {
  content?: Array<{ type: string; text?: string }>;
  [key: string]: any;
}

async function main(): Promise<void> {
  try {
    // Create a transport that spawns the server process
    const transport = new StdioClientTransport({
      command: "node",
      args: ["./dist/index.js"]
    });
    
    // Create a client
    const client = new Client({
      name: "ADB MCP Test Client",
      version: "1.0.0"
    });
    
    // Connect to the server
    await client.connect(transport);
    console.log("✅ Connected to ADB MCP server");
    
    // Get device list
    console.log("\n=== Testing adb_devices ===");
    const devicesResult = await client.callTool({
      name: "adb_devices",
      arguments: {}
    }) as ToolResponse;
    console.log(devicesResult);
    
    // Assert device list response
    assert(devicesResult.content, "Expected content in device list response");
    assert(Array.isArray(devicesResult.content), "Expected content to be an array");
    assert(devicesResult.content.length > 0, "Expected at least one content item in device list");
    const deviceListText = devicesResult.content[0]?.text || '';
    assert(deviceListText.includes("List of devices attached"), "Expected device list header");
    console.log("✅ Device list response validated");

    // Check if an ADB device is available for device-dependent tests
    const hasAdbDevice = deviceListText.includes("\tdevice");

    if (hasAdbDevice) {
      console.log("\n🔌 ADB device detected — running device-dependent ADB tests");

      // Test the screenshot tool with default (non-base64) behavior
      console.log("\n=== Testing dump_image (default non-base64) ===");
      const screenshotDefaultResult = await client.callTool({
        name: "dump_image",
        arguments: {}
      }) as ToolResponse;

      console.log("Screenshot result (default):");
      console.log(screenshotDefaultResult);

      // Assert default screenshot response
      assert(screenshotDefaultResult.content, "Expected content in default screenshot response");
      assert(Array.isArray(screenshotDefaultResult.content), "Expected content to be an array");
      assert(screenshotDefaultResult.content.length > 0, "Expected at least one content item");
      assert(!screenshotDefaultResult.isError, "Expected no error in default screenshot response");
      assert(screenshotDefaultResult.content[0]?.text?.includes("Screenshot captured"),
             "Expected success message in default screenshot response");
      console.log("✅ Default screenshot response validated");

      // Test the screenshot tool with explicit base64 request
      console.log("\n=== Testing dump_image (explicit base64) ===");
      const screenshotBase64Result = await client.callTool({
        name: "dump_image",
        arguments: {
          asBase64: true
        }
      }) as ToolResponse;

      console.log("Screenshot result (base64):");
      const base64Content = screenshotBase64Result.content?.[0]?.text || '';
      console.log(`Received base64 data of length: ${base64Content.length}`);
      if (base64Content.length > 100) {
        console.log(`First 100 characters: ${base64Content.substring(0, 100)}...`);
      }

      // Assert base64 screenshot response
      assert(screenshotBase64Result.content, "Expected content in base64 screenshot response");
      assert(Array.isArray(screenshotBase64Result.content), "Expected content to be an array");
      assert(screenshotBase64Result.content.length > 0, "Expected at least one content item");
      assert(!screenshotBase64Result.isError, "Expected no error in base64 screenshot response");
      assert(base64Content.length > 1000, "Expected substantial base64 data in response");
      assert(/^[A-Za-z0-9+/=]+$/.test(base64Content), "Expected valid base64 characters");
      assert(base64Content.startsWith("iVBOR"), "Expected PNG image data signature");
      console.log("✅ Base64 screenshot response validated");

      // Test the UI dump tool
      console.log("\n=== Testing inspect_ui ===");
      const uidumpResult = await client.callTool({
        name: "inspect_ui",
        arguments: {
          asBase64: false
        }
      }) as ToolResponse;

      console.log("Raw response:");
      console.log(uidumpResult);

      // Assert UI dump response
      assert(uidumpResult.content, "Expected content in UI dump response");
      assert(Array.isArray(uidumpResult.content), "Expected content to be an array");
      assert(uidumpResult.content.length > 0, "Expected at least one content item");

      // Check if we got base64 data or direct XML
      const firstContent = uidumpResult.content[0]?.text || '';
      const isBase64 = /^[A-Za-z0-9+/=]+$/.test(firstContent) &&
                      firstContent.length % 4 === 0 &&
                      firstContent.length > 100;

      if (isBase64) {
        console.log("\nDetected base64 encoded data, decoding...");
        try {
          const decodedXml = Buffer.from(firstContent, 'base64').toString('utf8');
          console.log("\nFirst 200 characters of decoded XML:");
          console.log(decodedXml.substring(0, 200) + "...");

          // Assert decoded XML
          assert(decodedXml.trim().startsWith("<?xml"), "Expected XML declaration in decoded content");
          assert(decodedXml.includes("<hierarchy"), "Expected hierarchy tag in XML");
          console.log("✅ UI dump base64 response validated");
        } catch (error) {
          console.error("Error decoding base64:", error);
          assert.fail("Failed to decode base64 UI dump data");
        }
      } else {
        console.log("\nFirst 200 characters of XML (not base64):");
        console.log(firstContent.substring(0, 200) + "...");

        // Assert direct XML
        assert(!uidumpResult.isError, "Expected no error in UI dump response");
        assert(firstContent.trim().startsWith("<?xml"), "Expected XML declaration");
        assert(firstContent.includes("<hierarchy"), "Expected hierarchy tag in XML");
        console.log("✅ UI dump XML response validated");
      }

      // Test adb_shell
      console.log("\n=== Testing adb_shell ===");
      const shellResult = await client.callTool({
        name: "adb_shell",
        arguments: {
          command: "echo 'Test command execution'"
        }
      }) as ToolResponse;

      console.log("Shell command result:");
      console.log(shellResult);

      // Assert shell command response
      assert(shellResult.content, "Expected content in shell command response");
      assert(Array.isArray(shellResult.content), "Expected content to be an array");
      assert(shellResult.content.length > 0, "Expected at least one content item");
      assert(!shellResult.isError, "Expected no error in shell command response");
      const shellOutput = shellResult.content[0]?.text || '';
      assert(shellOutput.includes("Test command execution"), "Expected echo output in shell response");
      console.log("✅ Shell command response validated");

      // Test adb_activity_manager
      console.log("\n=== Testing adb_activity_manager (am start HOME) ===");
      const amResult = await client.callTool({
        name: "adb_activity_manager",
        arguments: {
          amCommand: "start",
          amArgs: "-a android.intent.action.MAIN -c android.intent.category.HOME"
        }
      }) as ToolResponse;

      console.log("Activity Manager result:");
      console.log(amResult);

      // Assert Activity Manager response
      assert(amResult.content, "Expected content in Activity Manager response");
      assert(Array.isArray(amResult.content), "Expected content to be an array");
      assert(amResult.content.length > 0, "Expected at least one content item");
      assert(!amResult.isError, "Expected no error in Activity Manager response");
      const amOutput = amResult.content[0]?.text || '';
      assert(amOutput.length > 0, "Expected some output from Activity Manager");
      console.log("✅ Activity Manager response validated");

      // Test adb_package_manager
      console.log("\n=== Testing adb_package_manager (pm list packages) ===");
      const pmResult = await client.callTool({
        name: "adb_package_manager",
        arguments: {
          pmCommand: "list",
          pmArgs: "packages"
        }
      }) as ToolResponse;

      console.log("Package Manager result:");
      console.log(pmResult);

      // Assert Package Manager response
      assert(pmResult.content, "Expected content in Package Manager response");
      assert(Array.isArray(pmResult.content), "Expected content to be an array");
      assert(pmResult.content.length > 0, "Expected at least one content item");
      assert(!pmResult.isError, "Expected no error in Package Manager response");
      const pmOutput = pmResult.content[0]?.text || '';
      assert(pmOutput.length > 0, "Expected some output from Package Manager");
      assert(pmOutput.includes("package:") || pmOutput.includes("No packages found") || pmOutput.length === 0,
             "Expected package list format or empty result");
      console.log("✅ Package Manager response validated");

    } else {
      console.log("\n⏭️  No ADB device detected — skipping device-dependent ADB tests");
      console.log("   Device may be in fastboot mode or disconnected");
    }

    // ========== Fastboot Tests ==========

    // Test fastboot_devices (works even without a device in fastboot mode — returns empty list)
    console.log("\n=== Testing fastboot_devices ===");
    const fbDevicesResult = await client.callTool({
      name: "fastboot_devices",
      arguments: {}
    }) as ToolResponse;

    console.log("Fastboot devices result:");
    console.log(fbDevicesResult);

    assert(fbDevicesResult.content, "Expected content in fastboot devices response");
    assert(Array.isArray(fbDevicesResult.content), "Expected content to be an array");
    assert(fbDevicesResult.content.length > 0, "Expected at least one content item");
    assert(!fbDevicesResult.isError, "Expected no error in fastboot devices response");
    console.log("✅ Fastboot devices response validated");

    // Check if a device is actually in fastboot mode for device-dependent tests
    const fbDevicesText = fbDevicesResult.content[0]?.text || '';
    const hasFastbootDevice = fbDevicesText.trim().length > 0
      && fbDevicesText.includes("fastboot");

    if (hasFastbootDevice) {
      console.log("\n🔌 Fastboot device detected — running device-dependent tests");

      // Test fastboot_getvar
      console.log("\n=== Testing fastboot_getvar (product) ===");
      const getvarResult = await client.callTool({
        name: "fastboot_getvar",
        arguments: { variable: "product" }
      }) as ToolResponse;

      console.log("Fastboot getvar result:");
      console.log(getvarResult);

      assert(getvarResult.content, "Expected content in getvar response");
      assert(Array.isArray(getvarResult.content), "Expected content to be an array");
      assert(getvarResult.content.length > 0, "Expected at least one content item");
      assert(!getvarResult.isError, "Expected no error in getvar response");
      const getvarOutput = getvarResult.content[0]?.text || '';
      assert(getvarOutput.includes("product"), "Expected 'product' in getvar output");
      console.log("✅ Fastboot getvar response validated");

      // Test fastboot_getvar with 'all'
      console.log("\n=== Testing fastboot_getvar (all) ===");
      const getvarAllResult = await client.callTool({
        name: "fastboot_getvar",
        arguments: { variable: "all" }
      }) as ToolResponse;

      console.log("Fastboot getvar all result (first 500 chars):");
      const getvarAllText = getvarAllResult.content?.[0]?.text || '';
      console.log(getvarAllText.substring(0, 500) + (getvarAllText.length > 500 ? "..." : ""));

      assert(getvarAllResult.content, "Expected content in getvar all response");
      assert(!getvarAllResult.isError, "Expected no error in getvar all response");
      assert(getvarAllText.length > 0, "Expected some output from getvar all");
      console.log("✅ Fastboot getvar all response validated");

      // Test fastboot_command (generic)
      console.log("\n=== Testing fastboot_command (getvar serialno) ===");
      const fbCommandResult = await client.callTool({
        name: "fastboot_command",
        arguments: { command: "getvar serialno" }
      }) as ToolResponse;

      console.log("Fastboot command result:");
      console.log(fbCommandResult);

      assert(fbCommandResult.content, "Expected content in fastboot command response");
      assert(Array.isArray(fbCommandResult.content), "Expected content to be an array");
      assert(fbCommandResult.content.length > 0, "Expected at least one content item");
      assert(!fbCommandResult.isError, "Expected no error in fastboot command response");
      const fbCommandOutput = fbCommandResult.content[0]?.text || '';
      assert(fbCommandOutput.includes("serialno"), "Expected 'serialno' in command output");
      console.log("✅ Fastboot command response validated");

      // Test fastboot_reboot (reboot back to bootloader to keep device in fastboot for further testing)
      console.log("\n=== Testing fastboot_reboot (bootloader) ===");
      const rebootResult = await client.callTool({
        name: "fastboot_reboot",
        arguments: { target: "bootloader" }
      }) as ToolResponse;

      console.log("Fastboot reboot result:");
      console.log(rebootResult);

      assert(rebootResult.content, "Expected content in reboot response");
      assert(Array.isArray(rebootResult.content), "Expected content to be an array");
      assert(rebootResult.content.length > 0, "Expected at least one content item");
      assert(!rebootResult.isError, "Expected no error in reboot response");
      console.log("✅ Fastboot reboot response validated");

    } else {
      console.log("\n⏭️  No fastboot device detected — skipping device-dependent fastboot tests");
      console.log("   To run these tests, reboot a device to bootloader: adb reboot bootloader");
    }

    // Test fastboot_command with empty command (validation test — no device needed)
    console.log("\n=== Testing fastboot_command (empty command validation) ===");
    const fbEmptyResult = await client.callTool({
      name: "fastboot_command",
      arguments: { command: "" }
    }) as ToolResponse;

    assert(fbEmptyResult.content, "Expected content in empty command response");
    assert(fbEmptyResult.isError, "Expected error for empty command");
    const fbEmptyText = fbEmptyResult.content[0]?.text || '';
    assert(fbEmptyText.includes("must not be empty"), "Expected empty command error message");
    console.log("✅ Fastboot empty command validation works");

    // Test fastboot_flash with empty partition (validation test — no device needed)
    console.log("\n=== Testing fastboot_flash (empty partition validation) ===");
    const fbFlashEmptyResult = await client.callTool({
      name: "fastboot_flash",
      arguments: { partition: "", imagePath: "/some/path.img" }
    }) as ToolResponse;

    assert(fbFlashEmptyResult.content, "Expected content in empty partition response");
    assert(fbFlashEmptyResult.isError, "Expected error for empty partition");
    const fbFlashEmptyText = fbFlashEmptyResult.content[0]?.text || '';
    assert(fbFlashEmptyText.includes("Partition name must not be empty"), "Expected partition error message");
    console.log("✅ Fastboot flash empty partition validation works");

    // Test fastboot_flash with empty image path (validation test — no device needed)
    console.log("\n=== Testing fastboot_flash (empty image path validation) ===");
    const fbFlashEmptyImgResult = await client.callTool({
      name: "fastboot_flash",
      arguments: { partition: "boot", imagePath: "" }
    }) as ToolResponse;

    assert(fbFlashEmptyImgResult.content, "Expected content in empty image path response");
    assert(fbFlashEmptyImgResult.isError, "Expected error for empty image path");
    const fbFlashEmptyImgText = fbFlashEmptyImgResult.content[0]?.text || '';
    assert(fbFlashEmptyImgText.includes("Image path must not be empty"), "Expected image path error message");
    console.log("✅ Fastboot flash empty image path validation works");

    // Test fastboot_erase with empty partition (validation test — no device needed)
    console.log("\n=== Testing fastboot_erase (empty partition validation) ===");
    const fbEraseEmptyResult = await client.callTool({
      name: "fastboot_erase",
      arguments: { partition: "" }
    }) as ToolResponse;

    assert(fbEraseEmptyResult.content, "Expected content in empty partition erase response");
    assert(fbEraseEmptyResult.isError, "Expected error for empty partition erase");
    const fbEraseEmptyText = fbEraseEmptyResult.content[0]?.text || '';
    assert(fbEraseEmptyText.includes("Partition name must not be empty"), "Expected erase partition error message");
    console.log("✅ Fastboot erase empty partition validation works");

    // Test fastboot_getvar with empty variable (validation test — no device needed)
    console.log("\n=== Testing fastboot_getvar (empty variable validation) ===");
    const fbGetvarEmptyResult = await client.callTool({
      name: "fastboot_getvar",
      arguments: { variable: "" }
    }) as ToolResponse;

    assert(fbGetvarEmptyResult.content, "Expected content in empty variable response");
    assert(fbGetvarEmptyResult.isError, "Expected error for empty variable");
    const fbGetvarEmptyText = fbGetvarEmptyResult.content[0]?.text || '';
    assert(fbGetvarEmptyText.includes("Variable name must not be empty"), "Expected variable error message");
    console.log("✅ Fastboot getvar empty variable validation works");

    // Test fastboot_oem with empty command (validation test — no device needed)
    console.log("\n=== Testing fastboot_oem (empty command validation) ===");
    const fbOemEmptyResult = await client.callTool({
      name: "fastboot_oem",
      arguments: { oemCommand: "" }
    }) as ToolResponse;

    assert(fbOemEmptyResult.content, "Expected content in empty OEM command response");
    assert(fbOemEmptyResult.isError, "Expected error for empty OEM command");
    const fbOemEmptyText = fbOemEmptyResult.content[0]?.text || '';
    assert(fbOemEmptyText.includes("OEM command must not be empty"), "Expected OEM command error message");
    console.log("✅ Fastboot OEM empty command validation works");

    // Test fastboot_boot with empty path (validation test — no device needed)
    console.log("\n=== Testing fastboot_boot (empty path validation) ===");
    const fbBootEmptyResult = await client.callTool({
      name: "fastboot_boot",
      arguments: { imagePath: "" }
    }) as ToolResponse;

    assert(fbBootEmptyResult.content, "Expected content in empty boot path response");
    assert(fbBootEmptyResult.isError, "Expected error for empty boot path");
    const fbBootEmptyText = fbBootEmptyResult.content[0]?.text || '';
    assert(fbBootEmptyText.includes("Image path must not be empty"), "Expected boot path error message");
    console.log("✅ Fastboot boot empty path validation works");

    // Cleanup
    await client.close();
    console.log("\n✅ All tests passed - Disconnected from ADB & Fastboot MCP server");

  } catch (error) {
    console.error("❌ Test failed:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main(); 