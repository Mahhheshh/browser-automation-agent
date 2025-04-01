import { z } from "zod";
import AgentBrowser from "./browser";
import { tool } from "@langchain/core/tools";

export const createBrowserTools = (browserService: AgentBrowser) => [
  // open a new tab
  tool(
    async ({ query }) => {
      await browserService.new_tab(query);
      return `New Tab opened for the query: ${query}`;
    },
    {
      name: "new_browser_tab",
      description:
      "Opens a new tab in the browser with the specified URL. The query must be a complete URL (e.g., https://example.com). If you have keywords instead of a URL, use https://google.com and type your query in the search box.",
      schema: z.object({
      query: z.string().describe("The URL to open in the new tab. Must be a complete URL with protocol (e.g., https://example.com)"),
      }),
    }
    ),

  // // tool to close the browser tab
  // tool(browserService.close_tab, {
  //   name: "close_browser_tab",
  //   description: "close all the broswer tabs",
  // }),

  // tool to update the navigation url of the current tab
  tool(
    async ({ newUrl }) => {
      const result = await browserService.update_url(newUrl);

      return result;
    },
    {
      name: "update_tab_url",
      description:
        "Updates the current page URL to a new URL. This is particularly useful for quickly navigating to different pages using known href values.",
      schema: z.object({
        newUrl: z
          .string()
          .describe(
            "The new URL to navigate the current tab to. This strictly has to be a URL."
          ),
      }),
    }
  ),

  // tool to get page content
  tool(
    async () => {
      const content = await browserService.extractTextContent();
      return content;
    },
    {
      name: "extract_page_content",
      description:
        "extracts the human redable visible text of the page ur currently on, useful for getting idea of the web page, also thins returns a string and not a html",
    }
  ),

  // tool to list interactive elemets of the page
  tool(
    async () => {
      const content = await browserService.findInteractiveElements();
      return content;
    },
    {
      name: "list_interactive_elements",
      description:
        "Extracts a stringified json, object, returns interactive html tags, the format is tage, text of the element if has any, and class name. this things are useful for generating the css selector to interact with the tags when needed",
    }
  ),

  // tool to interact with element of the page
  tool(
    async ({ html_selector, clickable, input_data }) => {
      console.log(
        `html_selector = ${html_selector}, clickable=${clickable}, input_data=${input_data}`
      );
      const result = await browserService.interactWithElement(
        html_selector,
        clickable ?? false,
        input_data ?? ""
      );
      return result;
    },
    {
      name: "interact_with_page",
      description:
        "This tool interacts with a specified HTML element on the page using a CSS selector. If the element is clickable, it will perform a click action. If the element is an input field, it will input the provided data and then press Enter.",
      schema: z.object({
        html_selector: z
          .string()
          .describe(
            "CSS selector of the HTML element to interact with. Should be as specific as possible"
          ),
        input_data: z
          .string()
          .optional()
          .describe(
            "If the element is an input field, the data to fill in. Leave empty if not applicable."
          ),
        clickable: z
          .boolean()
          .optional()
          .describe(
            "Indicates whether the element is clickable (e.g., a button or a link). Defaults to false."
          ),
      }),
    }
  ),
];

export default createBrowserTools;
