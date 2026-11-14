export const $ = id => document.getElementById(id);

export function setMessage(message) {
  const messageElement = $("msg");
  if (messageElement) messageElement.textContent = message;
}
