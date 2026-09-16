export type Medication = {
  id: string;
  name: string;
  schedule: string;
  notes: string;
  active: boolean;
};

export type InvestigationStatus = 'planned' | 'completed' | 'discussed';
export type Investigation = {
  id: string;
  title: string;
  status: InvestigationStatus;
  scheduledOn: string;
  notes: string;
};

const id = (value: unknown) => {
  if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/i.test(value)) throw new Error('Invalid record id.');
  return value;
};
const text = (value: unknown, maximum: number, required = false) => {
  if (typeof value !== 'string' || value.length > maximum || (required && !value.trim())) throw new Error('Please check the text fields.');
  return value.trim();
};
const date = (value: unknown) => {
  if (value === '') return '';
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T12:00:00Z`)) || new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) !== value) throw new Error('Choose a valid date.');
  return value;
};

export function validateMedication(input: unknown): Medication {
  if (!input || typeof input !== 'object') throw new Error('Invalid medicine or supplement.');
  const value = input as Partial<Medication>;
  if (typeof value.active !== 'boolean') throw new Error('Invalid active state.');
  return { id: id(value.id), name: text(value.name, 150, true), schedule: text(value.schedule, 300), notes: text(value.notes, 2000), active: value.active };
}

export function validateInvestigation(input: unknown): Investigation {
  if (!input || typeof input !== 'object') throw new Error('Invalid investigation.');
  const value = input as Partial<Investigation>;
  if (!['planned', 'completed', 'discussed'].includes(String(value.status))) throw new Error('Choose a valid investigation status.');
  return { id: id(value.id), title: text(value.title, 150, true), status: value.status as InvestigationStatus, scheduledOn: date(value.scheduledOn), notes: text(value.notes, 2000) };
}
