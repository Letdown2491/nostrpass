export async function copyText(text?: string, clearSec?: number) {
  if (!text) return;

  const write = async (value: string) => {
    if (navigator?.clipboard?.writeText) {
      const ok = await write(text);
      if (!ok) {
        alert("Your browser does not support copying to the clipboard.");
        return;
      }

      return true;
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed"; // avoid scrolling to bottom
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch (e) {
      console.error("execCommand copy failed", e);
      return false;
    }
  };

  try {
    await navigator.clipboard.writeText(text);
    if (clearSec) {
      setTimeout(() => {
        write("").catch((e) => {
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
