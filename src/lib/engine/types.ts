/**
 * Ядро ЕППБ: декларативная схема услуги.
 *
 * Услуга целиком описывается JSON-схемой: этапы, шаги, поля, условия
 * видимости, расчётные формулы, требования к документам. Портал не содержит
 * ни одной "захардкоженной" формы — и клиентский wizard, и админ-конструктор
 * работают с одной и той же схемой. Новая мера поддержки = новая запись в БД.
 */

/** Условие: примитив сравнения или логическая комбинация */
export type Condition =
  | { field: string; op: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "notEmpty" | "empty"; value?: unknown }
  | { and: Condition[] }
  | { or: Condition[] };

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "money"
  | "select"
  | "radio"
  | "checkbox"
  | "date"
  | "iin"
  | "bin"
  | "phone"
  | "email"
  | "file"
  | "calc"
  | "info";

export interface FieldOption {
  value: string;
  label: string;
}

export interface Field {
  id: string;
  type: FieldType;
  label: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  /** Поле показывается только если условие истинно */
  condition?: Condition;
  /** Варианты для select/radio; либо код справочника */
  options?: FieldOption[];
  /** Код справочника (регионы, ОКЭД и т.п.) — options подтягиваются из него */
  reference?: string;
  /** Формула для calc-полей: выражение над id других полей, например "amount * 0.2" */
  formula?: string;
  /** Путь предзаполнения из профиля/интеграций: "user.name", "company.name", "company.oked" */
  prefill?: string;
  /** Ограничения для number/money */
  min?: number;
  max?: number;
  /** Единица измерения для отображения (тенге, %, мес.) */
  unit?: string;
  /** Текст для info-полей (markdown-lite) */
  content?: string;
  /** Для file: допустимые расширения / подсказка по документу */
  accept?: string;
}

export interface Step {
  id: string;
  title: string;
  description?: string;
  condition?: Condition;
  fields: Field[];
}

/**
 * Этап услуги. Сложные услуги многоэтапны: этап 1 — первичная заявка,
 * этап 2 — расширенные данные и документы после предварительного одобрения.
 */
export interface Stage {
  id: string;
  title: string;
  description?: string;
  steps: Step[];
}

export interface ServiceSchema {
  stages: Stage[];
}

/** Ключевые условия услуги для карточки (сумма/ставка/срок) */
export interface ServiceCondition {
  code: string;
  title: string;
  value: string;
}

export type ServiceStatus = "draft" | "published" | "archived";

export interface Service {
  id: number;
  code: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  direction: string;
  organization: string;
  organizationLogo?: string;
  audience: string[];
  conditions: ServiceCondition[];
  schema: ServiceSchema;
  status: ServiceStatus;
  version: number;
  isPopular?: boolean;
  updatedAt: string;
}

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "need_info"
  | "pre_approved"
  | "stage2_available"
  | "stage2_submitted"
  | "approved"
  | "rejected";

export interface HistoryEntry {
  at: string;
  status: ApplicationStatus;
  title: string;
  comment?: string;
  actor: string;
}

export interface Application {
  id: number;
  number: string;
  serviceId: number;
  serviceCode: string;
  serviceTitle: string;
  userId: number;
  stageIndex: number;
  status: ApplicationStatus;
  data: Record<string, unknown>;
  documents: { fieldId: string; name: string; signedAt?: string }[];
  history: HistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "Черновик",
  submitted: "Заявка подана",
  in_review: "На рассмотрении",
  need_info: "Требуются уточнения",
  pre_approved: "Предварительно одобрена",
  stage2_available: "Доступен II этап",
  stage2_submitted: "II этап подан",
  approved: "Одобрена",
  rejected: "Отклонена",
};
