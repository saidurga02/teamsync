async function chatWithBot(message) {
  try {
    const res = await fetch('/api/chatbot/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    return data.reply || "❌ No reply received.";
  } catch (err) {
    console.error("❌ Chatbot error:", err);
    return "❌ Failed to contact chatbot.";
  }
}

document.getElementById("chatSend").onclick = async function () {
  const input = document.getElementById("chatInput");
  const userMessage = input.value.trim();
  if (!userMessage) return;

  const chatBox = document.getElementById("chatBox");
  chatBox.innerHTML += `<div><strong>You:</strong> ${userMessage}</div>`;
  input.value = "Thinking...";

  const reply = await chatWithBot(userMessage);
  chatBox.innerHTML += `<div><strong>Bot:</strong> ${reply}</div>`;
  input.value = "";
};
