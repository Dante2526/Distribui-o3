import { test, expect } from "@playwright/test";

test.describe("Chaos Monkey: Drag and Drop com CPU Throttling e Touch", () => {
  test("should survive 200 chaotic touch interactions with 6x slower CPU", async ({
    page,
    browserName,
  }) => {
    // Only Chromium supports CDP sessions for CPU Throttling
    if (browserName !== "chromium") {
      test.skip();
    }

    const client = await page.context().newCDPSession(page);
    // Simulate a 6x slower CPU (like an older mobile device)
    await client.send("Emulation.setCPUThrottlingRate", { rate: 6 });

    // Simulate slow network (Slow 3G)
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      downloadThroughput: (500 * 1024) / 8, // 500 kbps
      uploadThroughput: (500 * 1024) / 8, // 500 kbps
      latency: 400, // 400ms ping
    });

    const errors: string[] = [];

    page.on("pageerror", (exception) => {
      errors.push(`PageError: ${exception.message}`);
    });

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (
          text.includes("React") ||
          text.includes("185") ||
          text.includes("child")
        ) {
          errors.push(`ConsoleError: ${text}`);
        }
      }
    });

    await page.goto("/");
    await page.waitForTimeout(5000); // Wait longer due to slow network/CPU

    const locators = [
      page.locator(".employee-row"),
      page.locator(".support-role-row"),
      page.locator(".special-shift-slot"),
    ];

    const dropZones = [
      page.locator(".dept-card-panel").first(),
      page.locator(".dept-card-panel").nth(1),
      page.locator(".support-card-panel").first(),
    ];

    const ITERATIONS = 200; // Extreme stress

    for (let i = 0; i < ITERATIONS; i++) {
      const locatorType = locators[Math.floor(Math.random() * locators.length)];
      const count = await locatorType.count();
      if (count === 0) continue;

      const element = locatorType.nth(Math.floor(Math.random() * count));
      const box = await element.boundingBox();
      if (!box) continue;

      const dropZoneType =
        dropZones[Math.floor(Math.random() * dropZones.length)];
      const dropCount = await dropZoneType.count();
      if (dropCount === 0) continue;

      const targetZone = dropZoneType.nth(
        Math.floor(Math.random() * dropCount),
      );
      const targetBox = await targetZone.boundingBox();
      if (!targetBox) continue;

      try {
        // Use touchscreen emulation directly
        await page.touchscreen.tap(
          box.x + box.width / 2,
          box.y + box.height / 2,
        );

        // Emulate drag via mouse since playwright touchscreen drag is experimental/complex,
        // but we'll add random scrolls to mess with dnd-kit's positional sensors
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();

        // Randomly simulate user scrolling while dragging
        if (Math.random() > 0.5) {
          await page.mouse.wheel(0, 500);
        }

        await page.mouse.move(box.x + 100, box.y - 100, { steps: 2 });
        await page.mouse.move(
          targetBox.x + targetBox.width / 2,
          targetBox.y + targetBox.height / 2,
          { steps: 5 },
        );

        // Fire a click out of nowhere while dragging (simulating ghost touch)
        if (Math.random() > 0.8) {
          await page.mouse.click(0, 0);
        }

        await page.mouse.up();
      } catch (e) {
        // Ignore normal element detaches
      }

      // Check errors frequently
      if (errors.length > 0) {
        break;
      }
    }

    expect(
      errors,
      `Found errors during chaos test: ${errors.join("\n")}`,
    ).toHaveLength(0);
  });
});
