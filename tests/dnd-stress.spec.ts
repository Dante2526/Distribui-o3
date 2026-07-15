import { test, expect } from "@playwright/test";

test.describe("Drag and Drop Stress Test", () => {
  test("should survive rapid and chaotic drag and drop without throwing React error #185", async ({
    page,
  }) => {
    const errors: string[] = [];

    // Listen to all console errors and uncaught exceptions
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

    // Wait for the app to load and data to appear
    await page.waitForTimeout(3000); // Wait for potential Firebase fetch or initial render

    // Find draggable items
    const locators = [
      page.locator(".employee-row"),
      page.locator(".support-role-row"),
      page.locator(".special-shift-slot"),
    ];

    // Find droppable zones (departments, support cards, special shift container)
    const dropZones = [
      page.locator(".dept-card-panel").first(),
      page.locator(".dept-card-panel").nth(1),
      page.locator(".support-card-panel").first(),
      page.locator(".special-shift-slot").first(), // sometimes dropping on another item works
    ];

    const ITERATIONS = 30; // Brute force limit

    for (let i = 0; i < ITERATIONS; i++) {
      // Pick a random draggable
      const locatorType = locators[Math.floor(Math.random() * locators.length)];
      const count = await locatorType.count();

      if (count === 0) continue;

      const element = locatorType.nth(Math.floor(Math.random() * count));
      const box = await element.boundingBox();

      if (!box) continue;

      // Pick a random drop zone
      const dropZoneType =
        dropZones[Math.floor(Math.random() * dropZones.length)];
      const dropCount = await dropZoneType.count();
      if (dropCount === 0) continue;

      const targetZone = dropZoneType.nth(
        Math.floor(Math.random() * dropCount),
      );
      const targetBox = await targetZone.boundingBox();

      if (!targetBox) continue;

      // Perform the drag and drop
      try {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();

        // Move randomly around to trigger DragOverlay updates heavily
        await page.mouse.move(box.x + 50, box.y - 50, { steps: 5 });
        await page.mouse.move(
          targetBox.x + targetBox.width / 2,
          targetBox.y + targetBox.height / 2,
          { steps: 10 },
        );

        await page.mouse.up();
      } catch (e) {
        // Ignore element detached errors during chaotic drags
      }

      // Small delay to let React commit the render
      await page.waitForTimeout(50);

      // Check for errors early
      if (errors.length > 0) {
        console.error("Errors found during iteration", i, errors);
        break;
      }
    }

    // Final assertion
    expect(
      errors,
      `Found errors during stress test: ${errors.join("\n")}`,
    ).toHaveLength(0);
  });
});
