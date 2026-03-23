import { FormEvent, useState } from "react";

export type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

type ChatBoxProps = {
  history: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
};

export function ChatBox({ history, onSendMessage }: ChatBoxProps) {
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = input.trim();
    if (!message) return;

    try {
      setSubmitting(true);
      await onSendMessage(message);
      setInput("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="chat-panel">
      <div className="chat-panel-header">
        <div>
          <h2>Chat Commands</h2>
          <p>Control the schedule with text commands instead of buttons.</p>
        </div>
      </div>

      <div className="chat-history">
        {history.length === 0 ? (
          <div className="chat-empty">
            <p>Try one of these commands:</p>
            <ul>
              <li><code>show schedule</code></li>
              <li><code>show employees</code></li>
              <li><code>show rules</code></li>
              <li><code>fill this week</code></li>
              <li><code>remove slot 81</code></li>
              <li><code>refill slot 81</code></li>
              <li><code>remove and refill slot 81</code></li>
            </ul>
          </div>
        ) : (
          history.map((message) => (
            <div
              key={message.id}
              className={`chat-message ${message.role === "user" ? "chat-user" : "chat-assistant"}`}
            >
              <div className="chat-role">
                {message.role === "user" ? "You" : "Assistant"}
              </div>
              <div className="chat-text">{message.text}</div>
            </div>
          ))
        )}
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type a command..."
          disabled={submitting}
        />
        <button type="submit" disabled={submitting || !input.trim()}>
          {submitting ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}
