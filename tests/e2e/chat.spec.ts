import { expect, test, type Page, type Route } from "@playwright/test";

/**
 * The chat with a mocked /api/ask (docs/05, M4): every designed state is reachable.
 * /api/challenge is the real route, so the browser solves a real proof of work.
 * Needs a build with NEXT_PUBLIC_CHAT_ENABLED=true (CI sets it).
 */

const sse = (events: object[]) => events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");

async function mockAsk(
  page: Page,
  handler: (route: Route, body: Record<string, unknown>) => Promise<void>,
) {
  await page.route("**/api/ask", async (route) => {
    const body = JSON.parse(route.request().postData() ?? "{}") as Record<string, unknown>;
    await handler(route, body);
  });
}

const streamHeaders = {
  "Content-Type": "text/event-stream",
  "X-RateLimit-Limit": "10",
  "X-RateLimit-Remaining": "9",
};

test.describe("chat", () => {
  test("chip click streams an answer with sources", async ({ page }) => {
    let received: Record<string, unknown> = {};
    await mockAsk(page, async (route, body) => {
      received = body;
      await route.fulfill({
        status: 200,
        headers: streamHeaders,
        body: sse([
          { type: "token", text: "Jan worked at MSD " },
          { type: "token", text: "from 2018 to 2024." },
          { type: "sources", items: [{ title: "Jan Kopecký, CV", url: "/cv/Jan_Kopecky_CV.pdf" }] },
          { type: "done" },
        ]),
      });
    });
    await page.goto("/");
    const chat = page.getByTestId("chat");
    await expect(chat).toHaveAttribute("data-status", "welcome");
    await chat.getByRole("button", { name: "What did he do at MSD?" }).click();

    await expect(chat.getByText("Jan worked at MSD from 2018 to 2024.")).toBeVisible();
    await expect(chat).toHaveAttribute("data-status", "answered");
    await expect(chat.getByRole("link", { name: "Jan Kopecký, CV" })).toHaveAttribute(
      "href",
      "/cv/Jan_Kopecky_CV.pdf",
    );
    await expect(page.getByTestId("chat-counter")).toHaveText("1 / 10 questions");
    expect(received.question).toBe("What did he do at MSD?");
    expect(received.locale).toBe("en");
    expect(received.website).toBe("");
    expect(received.proof).toMatchObject({
      challenge: expect.any(Object),
      solution: expect.any(Object),
    });
    // chips are gone after the first question
    await expect(chat.getByRole("button", { name: "What AI tools does Jan use?" })).toHaveCount(0);
  });

  test("keyboard only: type, Enter, fallback, ask something else", async ({ page }) => {
    await mockAsk(page, (route) =>
      route.fulfill({
        status: 200,
        headers: streamHeaders,
        body: sse([{ type: "fallback" }, { type: "done" }]),
      }),
    );
    await page.goto("/");
    const input = page.locator("#ask-input");
    await input.focus();
    await page.keyboard.type("What is his favourite food?");
    await expect(page.getByTestId("chat")).toHaveAttribute("data-status", "typing");
    await page.keyboard.press("Enter");

    const chat = page.getByTestId("chat");
    await expect(chat).toHaveAttribute("data-status", "fallback");
    await expect(chat.getByText("I don't know that from Jan's documents")).toBeVisible();
    await expect(chat.getByRole("link", { name: "Contact Jan" })).toHaveAttribute(
      "href",
      /^mailto:info@kopecjan\.cz/,
    );
    await chat.getByRole("button", { name: "Ask something else" }).click();
    await expect(chat).toHaveAttribute("data-status", "welcome");
    await expect(input).toBeFocused();
  });

  test("error state retries the last question", async ({ page }) => {
    let calls = 0;
    await mockAsk(page, (route) => {
      calls++;
      return calls === 1
        ? route.fulfill({
            status: 200,
            headers: streamHeaders,
            body: sse([{ type: "error", code: "upstream" }]),
          })
        : route.fulfill({
            status: 200,
            headers: streamHeaders,
            body: sse([
              { type: "token", text: "Second try works." },
              { type: "sources", items: [] },
              { type: "done" },
            ]),
          });
    });
    await page.goto("/");
    const chat = page.getByTestId("chat");
    await chat.getByRole("button", { name: "What AI tools does Jan use?" }).click();
    await expect(chat).toHaveAttribute("data-status", "error");
    await expect(chat.getByText("Something went wrong.")).toBeVisible();
    await chat.getByRole("button", { name: "Retry" }).click();
    await expect(chat.getByText("Second try works.")).toBeVisible();
    await expect(chat).toHaveAttribute("data-status", "answered");
  });

  test("rate limit disables the composer", async ({ page }) => {
    await mockAsk(page, (route) =>
      route.fulfill({
        status: 429,
        headers: { "X-RateLimit-Limit": "10", "X-RateLimit-Remaining": "0", "Retry-After": "1500" },
        contentType: "application/json",
        body: JSON.stringify({ error: "rate_limited", retryAfterSeconds: 1500 }),
      }),
    );
    await page.goto("/");
    const chat = page.getByTestId("chat");
    await chat.getByRole("button", { name: "What did he do at MSD?" }).click();
    await expect(chat).toHaveAttribute("data-status", "ratelimit");
    await expect(
      chat.getByText("You have reached the limit of 10 questions per hour."),
    ).toBeVisible();
    await expect(chat.getByText("Please try again in about 25 minutes")).toBeVisible();
    await expect(page.locator("#ask-input")).toBeDisabled();
    await expect(page.locator("#ask-input")).toHaveAttribute(
      "placeholder",
      "Limit reached, try again later",
    );
    await expect(page.getByTestId("chat-counter")).toHaveText("10 / 10 questions");
  });

  test("streaming shows the writing status and Stop aborts", async ({ page }) => {
    await page.route("**/api/ask", async () => {
      // never answers: the request stays open until the visitor presses Stop
    });
    await page.goto("/");
    const chat = page.getByTestId("chat");
    await chat.getByRole("button", { name: "What AI tools does Jan use?" }).click();
    await expect(chat).toHaveAttribute("data-status", "streaming");
    await expect(chat.getByText("Writing the answer")).toBeVisible();
    await expect(page.locator("#ask-input")).toBeDisabled();
    await chat.getByRole("button", { name: "Stop generating" }).click();
    await expect(chat).not.toHaveAttribute("data-status", "streaming");
  });

  test("Czech chat sends the cs locale", async ({ page }) => {
    let locale = "";
    await mockAsk(page, async (route, body) => {
      locale = String(body.locale);
      await route.fulfill({
        status: 200,
        headers: streamHeaders,
        body: sse([{ type: "token", text: "Jan používá Claude Code." }, { type: "done" }]),
      });
    });
    await page.goto("/cs");
    const chat = page.getByTestId("chat");
    await chat.getByRole("button", { name: "Jaké AI nástroje Jan používá?" }).click();
    await expect(chat.getByText("Jan používá Claude Code.")).toBeVisible();
    expect(locale).toBe("cs");
  });
});

test("the real API rejects a request without proof of work", async ({ request }) => {
  const res = await request.post("/api/ask", {
    headers: { Origin: "http://localhost:3100" },
    data: { question: "What did Jan do at MSD?", locale: "en" },
  });
  expect(res.status()).toBe(403);
  expect(await res.json()).toEqual({ error: "invalid_proof" });

  const noOrigin = await request.post("/api/ask", { data: { question: "Hi there", locale: "en" } });
  expect(noOrigin.status()).toBe(403);
});
