export type QuestionType = "single" | "multi" | "text";

export type Option = {
  value: string;
  label: string;
  hint?: string;
};

export type Question = {
  id: string;
  type: QuestionType;
  prompt: string;
  help?: string;
  placeholder?: string;
  optional?: boolean;
  options?: Option[];
};

export type Answers = Record<string, string | string[]>;

export const QUESTIONS: Question[] = [
  {
    id: "industry",
    type: "single",
    prompt: "What does the business do?",
    options: [
      { value: "manufacturing", label: "Manufacturing" },
      { value: "construction", label: "Construction or the trades" },
      { value: "agriculture", label: "Agriculture or food processing" },
      { value: "distribution", label: "Distribution, logistics or wholesale" },
      { value: "services", label: "Professional or business services" },
      { value: "other", label: "Something else" },
    ],
  },
  {
    id: "headcount",
    type: "single",
    prompt: "How many people work there?",
    options: [
      { value: "lt25", label: "Under 25" },
      { value: "25_75", label: "25 to 75" },
      { value: "76_200", label: "76 to 200" },
      { value: "201_500", label: "201 to 500" },
      { value: "gt500", label: "More than 500" },
    ],
  },
  {
    id: "role",
    type: "single",
    prompt: "What is your role?",
    options: [
      { value: "owner", label: "Owner, CEO or president" },
      { value: "operations", label: "Operations leader" },
      { value: "finance", label: "Finance or administration" },
      { value: "technology", label: "Technology or IT" },
      { value: "other", label: "Something else" },
    ],
  },
  {
    id: "stance",
    type: "single",
    prompt: "Where does the business stand with AI today?",
    help: "Pick the one closest to the truth. There is no wrong answer here.",
    options: [
      { value: "nothing", label: "Nothing yet", hint: "We have talked about it, that is all" },
      {
        value: "informal",
        label: "A few people use it on their own",
        hint: "Nothing official, nothing written down",
      },
      {
        value: "regular",
        label: "We use it for one or two regular tasks",
        hint: "Same job, same way, most weeks",
      },
      {
        value: "built",
        label: "We have built or bought something for our own work",
        hint: "Set up for how we specifically operate",
      },
      {
        value: "embedded",
        label: "Several parts of the business run on it",
        hint: "With rules and someone accountable for it",
      },
    ],
  },
  {
    id: "uses",
    type: "multi",
    prompt: "Where is it being used today, if anywhere?",
    help: "Pick as many as apply.",
    options: [
      { value: "none", label: "Nowhere yet" },
      { value: "writing", label: "Writing, email and proposals" },
      { value: "quoting", label: "Quoting and estimating" },
      { value: "scheduling", label: "Scheduling, planning or routing" },
      { value: "customer", label: "Answering customer questions" },
      { value: "paperwork", label: "Paperwork, compliance and reporting" },
      { value: "quality", label: "Quality checks or inspection" },
      { value: "forecasting", label: "Forecasting demand or inventory" },
      { value: "maintenance", label: "Maintenance and equipment" },
    ],
  },
  {
    id: "data",
    type: "multi",
    prompt: "Where does the information the business runs on live?",
    help: "Orders, jobs, costs, customers. Pick as many as apply.",
    options: [
      { value: "paper", label: "On paper or in filing cabinets" },
      { value: "heads", label: "In people's heads and their own notes" },
      { value: "spreadsheets", label: "Spreadsheets" },
      { value: "accounting", label: "An accounting or ERP system" },
      { value: "crm", label: "A CRM or sales system" },
      { value: "operational", label: "Job, production or field software" },
      { value: "unsure", label: "Honestly, I am not sure" },
    ],
  },
  {
    id: "owner",
    type: "single",
    prompt: "If you started something in the next 90 days, who would own it?",
    options: [
      { value: "nobody", label: "Nobody yet" },
      { value: "me", label: "Me" },
      { value: "ops_person", label: "An operations person here" },
      { value: "it", label: "Our IT person or outside IT company" },
      { value: "next_gen", label: "A family member coming up in the business" },
      { value: "team", label: "A small group already meeting on it" },
    ],
  },
  {
    id: "blockers",
    type: "multi",
    prompt: "What is getting in the way?",
    help: "Pick as many as apply.",
    options: [
      { value: "where_to_start", label: "We do not know where to start" },
      { value: "cost", label: "Cost, or no idea what it should cost" },
      { value: "messy_data", label: "Our information is messy or scattered" },
      { value: "team", label: "The team is not sold on it" },
      { value: "security", label: "Security, privacy or customer data" },
      { value: "time", label: "No time to run a project" },
      { value: "trust", label: "I do not trust it to be right" },
      { value: "nothing", label: "Nothing in particular" },
    ],
  },
  {
    id: "priority",
    type: "text",
    prompt: "What is the one part of the business you would most want to run better?",
    help: "A sentence is plenty. This is what shapes the recommendations.",
    placeholder: "For example: quoting takes us three days and we lose jobs over it",
    optional: true,
  },
];

export const QUESTION_COUNT = QUESTIONS.length;

const COUNT_WORDS: Record<number, string> = {
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  10: "ten",
  11: "eleven",
  12: "twelve",
};

/** "nine" for 9 questions, falling back to the digits. */
export const QUESTION_COUNT_WORD = COUNT_WORDS[QUESTION_COUNT] ?? String(QUESTION_COUNT);

/** Human label for an option value, falling back to the raw value. */
export function optionLabel(questionId: string, value: string): string {
  const question = QUESTIONS.find((q) => q.id === questionId);
  return question?.options?.find((o) => o.value === value)?.label ?? value;
}
