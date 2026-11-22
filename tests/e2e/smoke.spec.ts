import { expect, test } from "@playwright/test";

test.describe("kopecjan.cz", () => {
  test("English home renders every section", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Jan Kopecký/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Jan Kopecký");
    for (const id of ["ask", "projects", "skills", "experience", "contact"]) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
    await expect(page.getByTestId("chat-placeholder")).toBeVisible();
    await expect(page.locator("#ask-input")).toBeDisabled();
  });

  test("Czech home is served at /cs", async ({ page }) => {
    await page.goto("/cs");
    await expect(page.locator("html")).toHaveAttribute("lang", "cs");
    await expect(page.getByRole("heading", { name: "Projekty" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Stáhnout CV" }).first()).toHaveAttribute(
      "href",
      "/cv/Jan_Kopecky_CV_CZ.pdf",
    );
  });

  test("language switch links to the other locale", async ({ page }) => {
    await page.goto("/");
    const group = page.getByRole("group", { name: "Language" });
    await expect(group.getByRole("link", { name: "EN" })).toHaveAttribute("aria-current", "true");
    await group.getByRole("link", { name: "CZ" }).click();
    await expect(page).toHaveURL(/\/cs$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "cs");
  });

  test("theme toggle switches html.dark and persists", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Toggle dark mode" });
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await toggle.click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("hero links point to CV, LinkedIn and e-mail", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Download CV" }).first()).toHaveAttribute(
      "href",
      "/cv/Jan_Kopecky_CV.pdf",
    );
    await expect(page.getByRole("link", { name: "LinkedIn" }).first()).toHaveAttribute(
      "href",
      /linkedin\.com\/in\/kopecjan/,
    );
    await expect(page.getByRole("link", { name: "E-mail" })).toHaveAttribute(
      "href",
      "mailto:info@kopecjan.cz",
    );
    const cv = await page.request.get("/cv/Jan_Kopecky_CV.pdf");
    expect(cv.ok()).toBeTruthy();
  });

  test("mobile menu opens and closes", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile only");
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const link = page
      .getByRole("navigation", { name: "Open menu" })
      .getByRole("link", { name: "Projects" });
    await expect(link).toBeVisible();
    await link.click();
    await expect(link).toBeHidden();
  });

  test("sitemap, robots and health respond", async ({ request }) => {
    expect((await request.get("/sitemap.xml")).ok()).toBeTruthy();
    expect((await request.get("/robots.txt")).ok()).toBeTruthy();
    const health = await request.get("/api/health");
    expect(health.ok()).toBeTruthy();
    expect(await health.json()).toMatchObject({ ok: true });
  });
});
