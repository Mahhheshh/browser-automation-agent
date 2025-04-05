import puppeteer from "puppeteer-extra";
import { Browser, LaunchOptions, Page, executablePath } from "puppeteer";

import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

interface InteractiveElement {
  tagId: string;
  tagName: string;
  className: string;
  text?: string;
  href?: string;
}

class StealthBrowser {
  private browser: Browser | null = null;
  private browserOptions: LaunchOptions;
  private interactiveElements: InteractiveElement[] = [];

  constructor(browserOptions: LaunchOptions) {
    this.browserOptions = browserOptions;
    this.initializeBrowser();
  }

  private async initializeBrowser(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        ...this.browserOptions,
        executablePath: executablePath("chrome"),
      });
    } catch (error) {
      console.error(`Unable to launch the browser: ${error}`);
      process.abort();
    }
  }

  private async getActivePage(): Promise<Page> {
    if (!this.browser) {
      throw new Error("Browser not initialized.");
    }

    const pages = await this.browser.pages();
    if (pages.length === 0) {
      throw new Error("No pages open in browser.");
    }

    return pages[0];
  }

  public async new_tab(url: string): Promise<Page> {
    if (!this.browser) {
      throw new Error("Browser not initialized.");
    }

    const pages = await this.browser.pages();
    let page: Page;

    if (pages.length === 0) {
      page = await this.browser.newPage();
    } else {
      page = pages[0];
    }

    try {
      await Promise.all([page.goto(url), page.waitForNavigation()]);
      return page;
    } catch (error) {
      throw new Error(`Failed to navigate to ${url}: ${error}`);
    }
  }

  public async update_url(newUrl: string): Promise<object> {
    try {
      const page = await this.getActivePage();
      const oldUrl = page.url();

      await page.goto(newUrl);

      return {
        TabOldUrl: oldUrl,
        currentUrl: newUrl,
        message: `Changed tab URL to ${newUrl}`,
      };
    } catch (error) {
      return {
        message: `Failed to update URL: ${error}`,
      };
    }
  }

  public async pageScroll(direction: "up" | "down" = "down"): Promise<string> {
    try {
      const page = await this.getActivePage();

      if (direction === "down") {
        await page.evaluate(() =>
          window.scrollTo(0, document.body.scrollHeight)
        );
      } else {
        await page.evaluate(() => window.scrollTo(0, 0));
      }

      await page.evaluate(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      return `Page scrolled ${direction} successfully`;
    } catch (error) {
      return `Failed to scroll page: ${error}`;
    }
  }

  public async findInteractiveElements(): Promise<string> {
    try {
      const page = await this.getActivePage();

      const input_elements = await page.$$eval("input", (els) =>
        els.map((el) => ({
          tagId: el.id,
          tagName: el.tagName,
          className: el.className,
          text: el.textContent?.replace(/\s/g, ""),
        }))
      );

      const buttons = await page.$$eval("button", (els) =>
        els.map((el) => ({
          tagId: el.id,
          tagName: el.tagName,
          className: el.className,
          text: el.textContent?.replace(/\s/g, ""),
        }))
      );

      const links = await page.$$eval("a", (els) =>
        els.map((el) => ({
          tagId: el.id,
          tagName: el.tagName,
          className: el.className,
          text: el.textContent?.replace(/\s/g, ""),
          href: el.href,
        }))
      );

      this.interactiveElements = [
        ...input_elements,
        ...buttons.filter((el) => el.text !== ""),
        ...links.filter((el) => el.text !== ""),
      ];

      return JSON.stringify(this.interactiveElements, null, 2);
    } catch (error) {
      return `Error finding interactive elements: ${error}`;
    }
  }

  public async interactWithElement(
    html_selector: string,
    clickable: boolean,
    input_data: string = ""
  ): Promise<string> {
    try {
      const page = await this.getActivePage();

      await page.waitForSelector(html_selector, { timeout: 5000 });

      if (clickable) {
        await page.click(html_selector);
      } else {
        await page.focus(html_selector);
        await page.keyboard.down("Control");
        await page.keyboard.press("A");
        await page.keyboard.up("Control");
        await page.keyboard.press("Backspace");
        await page.type(html_selector, input_data, { delay: 300 });
        await page.keyboard.press("Enter");
      }

      return `Successfully interacted with element: ${html_selector}`;
    } catch (error) {
      return `Failed to interact with ${html_selector}: ${error}`;
    }
  }

  public async extractTextContent(): Promise<string> {
    try {
      const page = await this.getActivePage();
      const title = await page.title();

      const textContent = await page.evaluate(() => {
        const body = document.querySelector("body");
        return body ? body.innerText : "";
      });

      return textContent || `Failed to extract text content for page: ${title}`;
    } catch (error) {
      return `Error extracting text content: ${error}`;
    }
  }

  public async close_tab(): Promise<string> {
    try {
      const page = await this.getActivePage();
      await page.close();
      return "Tab closed successfully";
    } catch (error) {
      return `Failed to close tab: ${error}`;
    }
  }

  public async close_browser(): Promise<string> {
    if (!this.browser) {
      return "Browser not initialized";
    }

    try {
      await this.browser.close();
      this.browser = null;
      return "Browser closed successfully";
    } catch (error) {
      return `Failed to close browser: ${error}`;
    }
  }
}

export default StealthBrowser;
