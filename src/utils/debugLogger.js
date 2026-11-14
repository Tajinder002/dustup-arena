import { $ } from "./dom.js";

export class DebugLogger {
  constructor(state) {
    this.state = state;
  }

  log(message) {
    const timestamp = new Date().toLocaleTimeString();
    this.state.debugLines.push(`[${timestamp}] ${message}`);
    if (this.state.debugLines.length > 60) this.state.debugLines.shift();

    const panel = $("dbg");
    if (panel) panel.textContent = this.state.debugLines.join("\n");
  }

  getText() {
    return this.state.debugLines.join("\n");
  }

  bindPanel() {
    const button = $("dbgbtn");
    const panel = $("dbg");
    if (button && panel) {
      button.addEventListener("click", () => {
        const shouldShow = panel.hidden;
        panel.hidden = !shouldShow;
        button.textContent = shouldShow ? "Hide debug log" : "Show debug log";
      });
    }

    const copyButton = $("copydbg");
    if (copyButton) {
      copyButton.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(this.getText());
          copyButton.textContent = "Copied!";
        } catch {
          copyButton.textContent = "Copy failed";
        }
        window.setTimeout(() => { copyButton.textContent = "Copy debug log"; }, 1400);
      });
    }
  }
}
