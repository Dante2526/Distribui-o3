import { expect, test } from "@playwright/test";

const ITERATIONS = Number(process.env.DAILY_STRESS_ITERATIONS ?? 120);

/** Gera uma sequencia repetivel: uma falha sempre pode ser reproduzida. */
function createRandom(seed = 0xdecafbad) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x1_0000_0000;
  };
}

test.describe("Uso diario - teste de forca bruta", () => {
  test("mantem o quadro estavel durante operacoes repetidas", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    const random = createRandom();

    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    // O modo mock usa somente dados locais; o teste nunca grava no Firebase.
    await page.addInitScript(() => {
      localStorage.setItem("distribui-theme-selected", "true");
      localStorage.setItem("distribui-page", "home");
      localStorage.setItem("distribui-turma", "A");
    });
    await page.goto("/?mock=true");

    const employees = page.locator(".employee-row-card");
    const departments = page.locator(".dept-card-panel");
    await expect(employees).toHaveCount(3);
    await expect(departments).toHaveCount(3);

    let completedDrags = 0;
    for (let iteration = 0; iteration < ITERATIONS; iteration += 1) {
      const employee = employees.nth(
        Math.floor(random() * (await employees.count())),
      );
      const target = departments.nth(
        Math.floor(random() * (await departments.count())),
      );
      const sourceBox = await employee.boundingBox();
      const targetBox = await target.boundingBox();

      expect(
        sourceBox,
        `colaborador indisponivel na iteracao ${iteration}`,
      ).not.toBeNull();
      expect(
        targetBox,
        `setor indisponivel na iteracao ${iteration}`,
      ).not.toBeNull();
      if (!sourceBox || !targetBox) break;

      await page.mouse.move(
        sourceBox.x + sourceBox.width / 2,
        sourceBox.y + 18,
      );
      await page.mouse.down();
      await page.mouse.move(
        sourceBox.x + sourceBox.width / 2 + (random() - 0.5) * 50,
        sourceBox.y + 45,
        { steps: 3 },
      );
      await page.mouse.move(
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height / 2,
        { steps: 6 },
      );
      await page.mouse.up();
      completedDrags += 1;

      if (iteration % 12 === 0)
        await page.getByLabel("Alternar modo escuro").click();
      if (iteration % 20 === 0) {
        await page.reload();
        await expect(employees).toHaveCount(3);
      }
      expect(
        errors,
        `erro na iteracao ${iteration}: ${errors.join("\n")}`,
      ).toEqual([]);
    }

    expect(completedDrags).toBe(ITERATIONS);
    await expect(employees).toHaveCount(3);
    await expect(departments).toHaveCount(3);
    expect(errors).toEqual([]);
  });
});
