import { useState, useRef, useEffect } from "react";

export type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

type ChatBoxProps = {
  history: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
};

const examplePrompts = [
  "Fill this week",
  "Who is working Monday morning?",
  "Show all employees",
  "What are the scheduling rules?",
  "Remove Ana Lima from Monday morning",
  "Replace Ana with Bruno on Friday evening",
];

export function ChatBox({ history, onSendMessage }: ChatBoxProps) {
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, submitting]);

  async function handleSubmit(event: { preventDefault(): void }) {
    event.preventDefault();

    const message = input.trim();
    if (!message) return;

    try {
      setSubmitting(true);
      setInput("");
      await onSendMessage(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="chat-panel">
      <div className="chat-panel-header">
        <div className="chat-panel-icon">✦</div>
        <div>
          <h2>Schedule Assistant</h2>
          <p>Ask about schedules, employees, rules, or staffing changes.</p>
        </div>
      </div>

      <div className="chat-history">
        {history.length === 0 ? (
          <div className="chat-empty">
            <p>Try asking:</p>
            <div className="chat-prompts">
              {examplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="chat-prompt-chip"
                  onClick={() => setInput(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
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

        {submitting && (
          <div className="chat-message chat-assistant">
            <div className="chat-role">Assistant</div>
            <div className="chat-typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
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
          {submitting ? "Sending…" : "Send"}
        </button>
      </form>
    </section>
  );
}
