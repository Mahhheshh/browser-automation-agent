import puppeteer, { Browser, LaunchOptions, Page } from "puppeteer";

class AgentBrowser {
  private browser: Browser | null = null;
  private browserOptions: LaunchOptions;
  private interactiveElements: any = [];

  constructor(browserOptions: LaunchOptions) {
    this.browserOptions = browserOptions;
    this.initializeBrowser();
  }

  private async initializeBrowser() {
    try {
      this.browser = await puppeteer.launch(this.browserOptions);
    } catch (error) {
      console.error(`Unable to launch the browser Error: ${error}`);
      process.abort();
    }
  }

  public async new_tab(url: string): Promise<Page> {
    if (!this.browser) {
      throw new Error("Browser not initialized.");
    }

    let page: Page;
    const pages = await this.browser.pages();

    if (pages.length === 0) {
      page = await this.browser.newPage();
    } else {
      page = pages[0];
    }
    await page.setViewport({ width: 1080, height: 1024 });
    await Promise.all([page.goto(url), page.waitForNavigation()]);
    return page;
  }

  public async update_url(newUrl: string): Promise<string> {
    if (!this.browser) return "No broswer initilized"

    const page = (await this.browser.pages())[0];

    await page.evaluate((newUrl) => {
      window.location.href = newUrl;
    }, newUrl);
    return `changed the page url to the new one: ${newUrl}`;
  }

  public async findInteractiveElements(): Promise<string> {
    if (!this.browser) {
      throw new Error("Browser not initialized.");
    }

    const pages = await this.browser.pages();
    if (pages.length === 0) {
      throw new Error("No pages found in the browser.");
    }

    const page = pages[0];
    try {
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
          href: el.href
        }))
      );
      
      this.interactiveElements = [];
      this.interactiveElements = [
        ...input_elements,
        ...buttons.filter((el) => el.text !== ""),
        ...links.filter((el) => el.text !== ""),
      ];

      return JSON.stringify(this.interactiveElements, null, 2);
    } catch (error) {
      console.error(`Error in getting interactive elements: ${error}`);
      return `Error in getting interactive elements: ${error}`;
    }
  }

  public async interactWithElement(
    html_selector: string,
    clickable: boolean,
    input_data: string
  ): Promise<string> {
    if (!this.browser) {
      console.log("Browser not initialized.");
      return "Browser not initialized.";
    }

    const page = (await this.browser.pages())[0];

    try {
      if (clickable) {
        await page.click(html_selector);
      } else {
        await page.type(html_selector, input_data, { delay: 300 });
      }
      return `Successfully interacted with element: ${html_selector}.`;
    } catch (error) {
      console.error(
        `An unexpected error has occued interacting with ${html_selector} the error is ${error}`
      );
      return `An unexpected error has occued interacting with ${html_selector} the error is ${error}`;
    }
  }

  public async extractTextContent(): Promise<string> {
    if (!this.browser) {
      return "No tabs are open";
    }

    const page = (await this.browser.pages())[0];

    const textContent = await page.evaluate(() => {
      const body = document.querySelector('body');
      const content = body ? body.innerText : '';
      return content;
    });

    return textContent;
  }

  public async close_tab(): Promise<string | void> {
    if (!this.browser) {
      return "browser not initilized cannot close the tab";
    }

    const page = (await this.browser.pages())[0];

    await page.close();
    return "tabs closed successfully";
  }

  public async close_browser(): Promise<string> {
    if (!this.browser) {
      return "Cannot close browser no broswer open";
    }

    try {
      await this.browser.close();
      this.browser = null;
    } catch (error) {
      console.error(`Error closing browser: ${error}`);
    }
    return "browser closed!";
  }
}

export default AgentBrowser;
