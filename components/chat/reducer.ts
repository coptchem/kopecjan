/**
 * Chat state (docs/02-design-spec.md, Chat component). The panel status is derived from the
 * last turn plus the rate limit, so every one of the 7 designed states comes out of one reducer:
 * welcome, typing, streaming, answered, fallback, error, ratelimit.
 */
export type Source = { title: string; url: string | null };

export type TurnStatus = "streaming" | "answered" | "fallback" | "error";
export type ErrorKind = "upstream" | "timeout" | "invalid" | "network";

export type Turn = {
  id: number;
  question: string;
  answer: string;
  status: TurnStatus;
  sources: Source[];
  error?: ErrorKind;
};

export type Limit = { kind: "client" | "daily"; retryAfterSeconds: number } | null;

export type ChatState = {
  turns: Turn[];
  input: string;
  /** true after "Ask something else": the next question starts fresh below the history */
  idle: boolean;
  limit: Limit;
  quota: { limit: number; remaining: number };
};

export type Status =
  "welcome" | "typing" | "streaming" | "answered" | "fallback" | "error" | "ratelimit";

export type Action =
  | { type: "input"; value: string }
  | { type: "ask"; id: number; question: string }
  | { type: "token"; id: number; text: string }
  | { type: "sources"; id: number; items: Source[] }
  | { type: "done"; id: number }
  | { type: "fallback"; id: number }
  | { type: "error"; id: number; error: ErrorKind }
  | { type: "stopped"; id: number }
  | { type: "limited"; id: number; limit: NonNullable<Limit> }
  | { type: "quota"; limit: number; remaining: number }
  | { type: "askElse" };

export const initialState = (limit = 10): ChatState => ({
  turns: [],
  input: "",
  idle: true,
  limit: null,
  quota: { limit, remaining: limit },
});

function update(state: ChatState, id: number, fn: (t: Turn) => Turn): ChatState {
  return { ...state, turns: state.turns.map((t) => (t.id === id ? fn(t) : t)) };
}

export function reducer(state: ChatState, action: Action): ChatState {
  switch (action.type) {
    case "input":
      return { ...state, input: action.value };
    case "ask":
      return {
        ...state,
        input: "",
        idle: false,
        turns: [
          ...state.turns,
          {
            id: action.id,
            question: action.question,
            answer: "",
            status: "streaming",
            sources: [],
          },
        ],
      };
    case "token":
      return update(state, action.id, (t) => ({ ...t, answer: t.answer + action.text }));
    case "sources":
      return update(state, action.id, (t) => ({ ...t, sources: action.items }));
    case "done":
      return update(state, action.id, (t) =>
        t.status === "streaming"
          ? { ...t, answer: t.answer.trim(), status: t.answer.trim() ? "answered" : "fallback" }
          : t,
      );
    case "fallback":
      return update(state, action.id, (t) => ({ ...t, answer: "", status: "fallback" }));
    case "error":
      return update(state, action.id, (t) => ({ ...t, status: "error", error: action.error }));
    case "stopped":
      return update(state, action.id, (t) =>
        t.answer.trim()
          ? { ...t, answer: t.answer.trim(), status: "answered" }
          : { ...t, status: "error", error: "upstream" },
      );
    case "limited":
      return {
        ...state,
        limit: action.limit,
        quota: { ...state.quota, remaining: 0 },
        turns: state.turns.filter((t) => t.id !== action.id),
        input: state.turns.find((t) => t.id === action.id)?.question ?? state.input,
      };
    case "quota":
      return { ...state, quota: { limit: action.limit, remaining: action.remaining } };
    case "askElse":
      return { ...state, idle: true };
  }
}

export function statusOf(state: ChatState): Status {
  if (state.limit) return "ratelimit";
  const last = state.turns.at(-1);
  if (last?.status === "streaming") return "streaming";
  if (!last || state.idle) return state.input.trim() ? "typing" : "welcome";
  return last.status;
}
