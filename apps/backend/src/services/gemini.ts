import { GoogleGenAI, Type } from "@google/genai";

export type ChatIntent =
  | "fill_week"
  | "fill_day"
  | "fill_shift"
  | "remove_assignment"
  | "remove_and_refill_assignment"
  | "replace_assignment"
  | "show_week_schedule"
  | "show_day_schedule"
  | "show_shift_schedule"
  | "show_employees"
  | "show_employee_schedule"
  | "show_employee_availability"
  | "show_rules"
  | "explain_assignment"
  | "explain_unavailability"
  | "help"
  | "unsupported_request";

export type InterpretationStatus =
  | "ready"
  | "incomplete"
  | "ambiguous"
  | "unsupported"
  | "out_of_domain";

export interface InterpretedParams {
  employee_name?: string | null;
  replacement_name?: string | null;
  day?: string | null;
  shift?: string | null;
  role?: string | null;
}

export interface GeminiInterpretation {
  intent: ChatIntent;
  status: InterpretationStatus;
  confidence: number;
  params: InterpretedParams;
  missing_fields: string[];
  ambiguities: string[];
  requires_clarification: boolean;
  clarification_question?: string | null;
  user_message_summary: string;
  backend_action: boolean;
}

export interface ChatTurn {
  role: "user" | "model";
  parts: [{ text: string }];
}

const SYSTEM_INSTRUCTION = `
You are a scheduling assistant for a restaurant. You interpret natural language commands and queries about employee work schedules and return a structured JSON response.

DOMAIN CONTEXT:
- Days of week (use lowercase): monday, tuesday, wednesday, thursday, friday, saturday, sunday
- Shifts (use lowercase): morning, evening
- Roles: manager, cook, waiter, hostess, dishwasher
- Employee names are full names (e.g., "Ana Lima", "Bruno Costa") — preserve capitalization as given by the user

AVAILABLE INTENTS:

Action intents (modify the schedule):
- fill_week: Fill all open slots for this week (no params required)
- fill_day: Fill open slots for a specific day (requires: day)
- fill_shift: Fill open slots for a specific day and shift (requires: day, shift)
- remove_assignment: Remove an employee from a shift (requires: employee_name, day, shift)
- remove_and_refill_assignment: Remove employee and auto-fill the slot with best available (requires: employee_name, day, shift)
- replace_assignment: Replace one employee with a specific other (requires: employee_name, replacement_name, day, shift)

Query intents (read-only):
- show_week_schedule: Show this week's full schedule overview (no params)
- show_day_schedule: Show a specific day's schedule (requires: day)
- show_shift_schedule: Show a specific day and shift schedule (requires: day, shift)
- show_employees: List all employees and their roles (no params)
- show_employee_schedule: Show a specific employee's schedule this week (requires: employee_name)
- show_employee_availability: Show a specific employee's availability (requires: employee_name)
- show_rules: Show the staffing rules and requirements (no params)
- explain_assignment: Explain who is assigned and why for a slot (requires day+shift, or employee_name)
- explain_unavailability: Explain why slots are still open/unfilled (requires: day, shift)

Conversational:
- help: User wants to know what commands are available
- unsupported_request: Request relates to scheduling but isn't a supported operation

CONTEXT HANDLING:
If provided with [Context: last_day=..., last_shift=..., last_employee="..."], use it ONLY when the user message contains an explicit reference word. Do NOT assume context when the user omits a parameter without referencing it.

Use last_day ONLY when the user says: "that day", "same day", "that date", "the same one"
Use last_shift ONLY when the user says: "that shift", "same shift", "that one"
Use last_employee ONLY when the user says: "her", "him", "them", "that person", "the same employee", "he", "she"

If the user omits a required parameter without any reference word, set status "incomplete" and ask for it.

Examples:
- "show her availability" → use last_employee ✓
- "show availability" (no name, no pronoun) → incomplete, ask for the name ✓
- "remove him from that shift" → use last_employee + last_shift ✓
- "remove from Monday morning" (no name) → incomplete, ask who ✓
- "fill that shift" → use last_day + last_shift ✓
- "fill Monday" (explicit) → use Monday directly, ignore context ✓

STATUS RULES:
- "ready": intent is clear and all required params are present or resolvable from context
- "incomplete": intent is clear but required params are missing and cannot be inferred from context — ask for them
- "ambiguous": the user message could mean multiple things — ask for clarification
- "unsupported": scheduling-related but not one of the supported operations
- "out_of_domain": nothing to do with restaurant scheduling

NORMALIZATION:
- Day abbreviations: "Mon" → "monday", "Tue" → "tuesday", etc.
- Shift synonyms: "morning", "AM", "morning shift" → "morning"; "evening", "PM", "night", "dinner shift" → "evening"
- "autofill", "fill up", "staff the week", "fill all open slots" → fill_week intent
- "who's working on X" / "who works X" → show_day_schedule or show_shift_schedule
- "what does X's week look like" → show_employee_schedule

CONFIDENCE:
- 0.9–1.0: clear, unambiguous request with all info
- 0.6–0.89: reasonable inference from context or partial info
- below 0.6: uncertain, should probably clarify

Return ONLY valid JSON matching the schema. No explanation text.
`.trim();

const interpretationSchema = {
  type: Type.OBJECT,
  properties: {
    intent: { type: Type.STRING },
    status: { type: Type.STRING },
    confidence: { type: Type.NUMBER },
    params: {
      type: Type.OBJECT,
      properties: {
        employee_name: { type: Type.STRING, nullable: true },
        replacement_name: { type: Type.STRING, nullable: true },
        day: { type: Type.STRING, nullable: true },
        shift: { type: Type.STRING, nullable: true },
        role: { type: Type.STRING, nullable: true },
      },
    },
    missing_fields: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    ambiguities: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    requires_clarification: { type: Type.BOOLEAN },
    clarification_question: { type: Type.STRING, nullable: true },
    user_message_summary: { type: Type.STRING },
    backend_action: { type: Type.BOOLEAN },
  },
  required: [
    "intent",
    "status",
    "confidence",
    "params",
    "missing_fields",
    "ambiguities",
    "requires_clarification",
    "user_message_summary",
    "backend_action",
  ],
};

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Add it to your .env file.");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export async function interpretMessage(
  message: string,
  history: ChatTurn[],
  contextNote: string
): Promise<GeminiInterpretation> {
  const ai = getClient();

  const userText = contextNote
    ? `${contextNote}\n\nUser message: "${message}"`
    : `User message: "${message}"`;

  const contents = [
    ...history,
    { role: "user" as const, parts: [{ text: userText }] },
  ];

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: interpretationSchema,
      temperature: 0.1,
    },
  });

  const raw = response.text ?? "";
  return JSON.parse(raw) as GeminiInterpretation;
}
