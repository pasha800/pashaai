(function () {
  "use strict";

  const chatInput = document.getElementById("chatInput");
  const chatForm = document.getElementById("chatForm");
  const chatWindow = document.getElementById("chatWindow");
  const newChatBtn = document.getElementById("newChatBtn");
  const content = document.querySelector(".content");

  if (!content || document.getElementById("proCommandBar")) return;

  function makeButton(text, className, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className || "pro-action";
    button.textContent = text;
    button.addEventListener("click", onClick);
    return button;
  }

  function showStatus(text) {
    const status = document.getElementById("proStatusText");
    if (status) status.textContent = text;
  }

  function focusChat() {
    document.querySelector('[data-page="chatPage"]')?.click();
    setTimeout(() => {
      chatInput?.focus();
      showStatus("ئامادەی نووسین");
    }, 80);
  }

  async function copyLastReply() {
    const replies = Array.from(chatWindow?.querySelectorAll(".message:not(.user) .bubble") || []);
    const last = replies.at(-1);
    if (!last) {
      showStatus("وەڵامێک نییە بۆ copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(last.textContent.trim());
      showStatus("دوایین وەڵام copy کرا");
    } catch {
      showStatus("copy پێویستی بە مۆڵەتی browser هەیە");
    }
  }

  async function copyChatText() {
    const messages = Array.from(chatWindow?.querySelectorAll(".message .bubble") || [])
      .map((node) => node.textContent.trim())
      .filter(Boolean);
    if (!messages.length) {
      showStatus("هیچ مێژوویەکی چات نییە");
      return;
    }
    try {
      await navigator.clipboard.writeText(messages.join("\n\n---\n\n"));
      showStatus("مێژووی چات copy کرا");
    } catch {
      showStatus("copy پێویستی بە مۆڵەتی browser هەیە");
    }
  }

  function createCommandBar() {
    const bar = document.createElement("section");
    bar.id = "proCommandBar";
    bar.className = "pro-command-bar";
    bar.setAttribute("aria-label", "ئامرازە خێراکانی سیستەم");

    const info = document.createElement("div");
    info.innerHTML = '<strong>Premium Console</strong><br><small id="proStatusText">Ctrl+K بۆ نووسین · Ctrl+N بۆ چاتی نوێ</small>';

    const actions = document.createElement("div");
    actions.className = "pro-command-actions";
    actions.append(
      makeButton("Focus Chat", "pro-action primary", focusChat),
      makeButton("چاتی نوێ", "pro-action", () => newChatBtn?.click()),
      makeButton("Copy وەڵام", "pro-action", copyLastReply),
      makeButton("Copy چات", "pro-action", copyChatText)
    );

    bar.append(info, actions);
    content.prepend(bar);
  }

  function addCounter() {
    if (!chatInput || document.getElementById("chatCounter")) return;
    const counter = document.createElement("div");
    counter.id = "chatCounter";
    counter.className = "char-counter";
    counter.textContent = "0 پیت";
    chatInput.insertAdjacentElement("afterend", counter);
    const update = () => {
      counter.textContent = `${chatInput.value.length} پیت`;
    };
    chatInput.addEventListener("input", update);
    update();
  }

  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === "k") {
      event.preventDefault();
      focusChat();
    }
    if ((event.ctrlKey || event.metaKey) && key === "n") {
      event.preventDefault();
      newChatBtn?.click();
      showStatus("چاتی نوێ دەست پێکرا");
    }
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      if (document.activeElement === chatInput && chatInput.value.trim()) {
        event.preventDefault();
        chatForm?.requestSubmit();
      }
    }
  });

  createCommandBar();
  addCounter();
})();
