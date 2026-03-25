import { useState } from "react";
import type { FormEvent } from "react";

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
          <h2>Schedule Assistant</h2>
          <p>Ask about schedules, employees, rules, or staffing changes.</p>
        </div>
      </div>

      <div className="chat-history">
        {history.length === 0 ? (
          <div className="chat-empty">
            <p>Try something like:</p>
            <ul>
              <li>
                <code>Show me this week&apos;s schedule</code>
              </li>
              <li>
                <code>Who is working on Monday morning?</code>
              </li>
              <li>
                <code>Show all employees</code>
              </li>
              <li>
                <code>What are the scheduling rules?</code>
              </li>
              <li>
                <code>Fill this week</code>
              </li>
              <li>
                <code>Remove Ana Lima from Monday morning</code>
              </li>
              <li>
                <code>Remove and refill Bruno Costa from Friday evening</code>
              </li>
              <li>
                <code>Replace Ana Lima with Bruno Costa on Monday morning</code>
              </li>
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
          placeholder="Ask about the schedule..."
          disabled={submitting}
        />
        <button type="submit" disabled={submitting || !input.trim()}>
          {submitting ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}
