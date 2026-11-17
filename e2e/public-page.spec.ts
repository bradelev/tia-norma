import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("every piece shows its number, photo, name and price", async ({
  page,
}) => {
  await page.goto("/");
  const pieces = page.getByRole("listitem");
  await expect(pieces).not.toHaveCount(0);
  for (const piece of await pieces.all()) {
    await expect(piece.getByText(/^\d+$/)).toBeVisible();
    await expect(piece).toContainText(/Número\s*\d+/);
    await expect(piece.getByRole("heading", { level: 2 })).toBeVisible();
    await expect(piece.getByText(/^\$\s[\d.]+$/)).toBeVisible();
    await expect(piece.getByRole("img")).toHaveAttribute("alt", /, \$/);
  }
});

test("only pieces published this week carry the Nueva stamp", async ({
  page,
}) => {
  await page.goto("/");
  const stamped = page.getByRole("listitem").filter({ hasText: "Nueva" });
  await expect(stamped).toHaveCount(1);
  await expect(stamped.getByRole("heading")).toHaveText("Jarra con relieve");
});

test("has no axe violations, AAA contrast included", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag2aaa", "wcag21aa", "best-practice"])
    .analyze();
  expect(results.violations).toEqual([]);
});

const zoomCases = [
  { name: "320px screen (WCAG reflow)", width: 320, height: 640, text: "100%" },
  {
    name: "200% browser zoom on a 1280px window",
    width: 640,
    height: 400,
    text: "100%",
  },
  { name: "phone with large text", width: 390, height: 844, text: "150%" },
];

for (const zoom of zoomCases) {
  test(`no horizontal scroll or clipped caption: ${zoom.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: zoom.width, height: zoom.height });
    await page.goto("/");
    await page.evaluate((size) => {
      document.documentElement.style.fontSize = size;
    }, zoom.text);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const clippedCaptions = await page
      .locator("article h2, article p")
      .evaluateAll(
        (els) => els.filter((el) => el.scrollWidth > el.clientWidth).length,
      );
    expect(clippedCaptions).toBe(0);
  });
}

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the photo opens full size and closes back to its piece", async ({
    page,
  }) => {
    await page.goto("/");
    const first = page.getByRole("listitem").first();
    await expect(first.getByRole("heading", { level: 2 })).toBeVisible();
    const viewer = page.getByRole("dialog");
    await expect(viewer).toHaveCount(0);

    await first.getByRole("link", { name: /Ver la foto grande/ }).click();
    await expect(viewer).toBeVisible();
    await expect(viewer.getByRole("img")).toBeVisible();

    await viewer.getByRole("link", { name: "Cerrar" }).click();
    await expect(viewer).toHaveCount(0);
    await expect(first).toBeInViewport();
  });
});
