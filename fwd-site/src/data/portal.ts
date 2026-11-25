// Shared by the client area (src/components/portal) and its API (server/portal).
// Change stages, brief questions or the starting checklist here.

export const STAGES = [
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'design', label: 'Design' },
  { id: 'build', label: 'Build' },
  { id: 'review', label: 'Review' },
  { id: 'live', label: 'Live' },
  { id: 'paused', label: 'On hold' },
] as const;

export type StageId = (typeof STAGES)[number]['id'];

export const stageLabel = (id: string) => STAGES.find((s) => s.id === id)?.label ?? id;

export interface BriefQuestion {
  key: string;
  label: string;
  hint?: string;
  long?: boolean;
}

export const BRIEF_QUESTIONS: BriefQuestion[] = [
  { key: 'business', label: 'What does your business do?', hint: 'A few sentences, as you would explain it to a new customer.', long: true },
  { key: 'customers', label: 'Who are your customers?', hint: 'Who buys from you, and where are they?', long: true },
  { key: 'goal', label: 'What is the main thing you want this project to achieve?', hint: 'More enquiries, online bookings, less admin, something else?', long: true },
  { key: 'pages', label: 'What pages or features do you need?', hint: 'A rough list is fine.', long: true },
  { key: 'likes', label: 'Websites or apps you like', hint: 'Links, and what you like about each.', long: true },
  { key: 'dislikes', label: 'Anything you want to avoid?', long: true },
  { key: 'brand', label: 'Brand colours, fonts or guidelines', hint: 'If you have them. You can upload files in the next section.' },
  { key: 'deadline', label: 'Is there a date this needs to be live by?' },
  { key: 'contact', label: 'Best way and time to reach you' },
  { key: 'other', label: 'Anything else I should know?', long: true },
];

export type ItemKind = 'upload' | 'access';

// Every new project starts with these. Sam can add or remove items per project.
export const DEFAULT_ITEMS: { kind: ItemKind; label: string; help: string }[] = [
  { kind: 'upload', label: 'Logo', help: 'The best quality version you have. SVG, AI, EPS or a large PNG.' },
  { kind: 'upload', label: 'Photos', help: 'Photos of your work, team, premises or products.' },
  { kind: 'upload', label: 'Text for your pages', help: 'Word documents or notes are fine. Rough is fine too.' },
  { kind: 'upload', label: 'Brand guidelines', help: 'Only if you have them.' },
  { kind: 'access', label: 'Domain name', help: 'Tell me who it is registered with (GoDaddy, 123 Reg and so on). I will send steps to add me as a user.' },
  { kind: 'access', label: 'Current website or hosting', help: 'Where the current site lives, if there is one.' },
  { kind: 'access', label: 'Google Business Profile', help: 'Add thinking@f-w-d.co.uk as a manager, then tick this off.' },
  { kind: 'access', label: 'Google Analytics and Search Console', help: 'Add thinking@f-w-d.co.uk as a user, then tick this off.' },
];

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
