export async function copyText(text?: string, clearSec?: number) {
  if (!text) return;

  const write = async (value: string) => {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }

    let textarea: HTMLTextAreaElement | null = null;
    try {
      textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed"; // avoid scrolling to bottom
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      return document.execCommand("copy");
    } catch (e) {
      console.error("execCommand copy failed", e);
      return false;
    } finally {
      if (textarea) {
        textarea.value = "";
        textarea.parentNode?.removeChild(textarea);
      }
    }
  };

  try {
    const ok = await write(text);
    if (!ok) {
      alert("Your browser does not support copying to the clipboard.");
      return;
    }
    if (clearSec) {
      setTimeout(() => {
        write("").catch((e) => {
          if (e instanceof DOMException) return; // likely blocked by lack of user activation
          console.error("Failed to clear clipboard", e);
        });
      }, clearSec * 1000);
    }
  } catch (e) {
    console.error("Failed to copy text", e);
  }
}

export async function copyPassword(pw?: string, clearSec?: number) {
  return copyText(pw, clearSec);
}
