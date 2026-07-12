import type { Service } from "../engine/types";

type SeedService = Omit<Service, "id" | "updatedAt" | "version">;

/**
 * Контрольный кейс №1: «Приобретение вагонов в лизинг» (Фонд развития промышленности).
 * Сложная многоэтапная услуга: I этап — индикативная заявка,
 * II этап — расширенные данные и документы после предварительного одобрения.
 * Собрана целиком в конструкторе: ветвление по типу заявителя и предмету
 * лизинга, расчёт аванса и суммы финансирования формулами схемы.
 */
export const wagonsService: SeedService = {
  code: "wagons_leasing",
  title: "Приобретение вагонов в лизинг",
  summary:
    "Лизинговое финансирование покупки железнодорожного подвижного состава: вагоны, локомотивы, спецтехника на рельсовом ходу.",
  description:
    "Фонд развития промышленности финансирует приобретение железнодорожного транспорта в лизинг. Ставка — от 12,6% годовых, валюта — тенге, собственное участие — от 20% стоимости проекта. Срок определяется индивидуально в зависимости от срока эксплуатации техники.",
  category: "Лизинг",
  direction: "Промышленность и транспорт",
  organization: "АО «Фонд развития промышленности»",
  audience: ["ТОО и АО", "Индивидуальные предприниматели"],
  conditions: [
    { code: "rate", title: "Ставка", value: "от 12,6%" },
    { code: "advance", title: "Аванс", value: "от 20%" },
    { code: "currency", title: "Валюта", value: "тенге" },
    { code: "term", title: "Срок", value: "индивидуально" },
  ],
  status: "published",
  isPopular: false,
  schema: {
    stages: [
      {
        id: "stage1",
        title: "I этап — индикативная заявка",
        description:
          "Предварительная заявка для получения индикативных условий финансирования. Решение — до 10 рабочих дней.",
        steps: [
          {
            id: "applicant",
            title: "Заявитель",
            description: "Данные подтягиваются из eGov и ГБД «Юридические лица» — проверьте и дополните.",
            fields: [
              {
                id: "applicant_type",
                type: "radio",
                label: "Тип заявителя",
                required: true,
                options: [
                  { value: "legal", label: "Юридическое лицо (ТОО, АО)" },
                  { value: "ip", label: "Индивидуальный предприниматель" },
                ],
              },
              {
                id: "company_name",
                type: "text",
                label: "Наименование организации",
                required: true,
                prefill: "company.name",
                condition: { field: "applicant_type", op: "eq", value: "legal" },
              },
              {
                id: "bin",
                type: "bin",
                label: "БИН",
                required: true,
                prefill: "company.bin",
                hint: "По БИН автоматически подтянем данные из ГБД «Юридические лица»",
                condition: { field: "applicant_type", op: "eq", value: "legal" },
              },
              {
                id: "iin",
                type: "iin",
                label: "ИИН",
                required: true,
                prefill: "user.iin",
                condition: { field: "applicant_type", op: "eq", value: "ip" },
              },
              {
                id: "contact_name",
                type: "text",
                label: "Контактное лицо",
                required: true,
                prefill: "user.name",
              },
              { id: "phone", type: "phone", label: "Телефон", required: true, placeholder: "+7 (___) ___-__-__" },
              { id: "email", type: "email", label: "E-mail", required: true, hint: "Сюда придут уведомления о статусе" },
              {
                id: "experience",
                type: "radio",
                label: "Опыт в сфере ж/д перевозок",
                required: true,
                options: [
                  { value: "yes", label: "Более 1 года" },
                  { value: "no", label: "Начинающая компания" },
                ],
              },
              {
                id: "experience_info",
                type: "info",
                label: "",
                content:
                  "Для начинающих компаний потребуется бизнес-план и подтверждение контрактной базы на II этапе. Это не препятствие для подачи заявки.",
                condition: { field: "experience", op: "eq", value: "no" },
              },
            ],
          },
          {
            id: "subject",
            title: "Предмет лизинга",
            fields: [
              {
                id: "wagon_type",
                type: "select",
                label: "Тип подвижного состава",
                required: true,
                options: [
                  { value: "gondola", label: "Полувагоны" },
                  { value: "hopper", label: "Хопперы (зерновозы, цементовозы)" },
                  { value: "tank", label: "Цистерны" },
                  { value: "platform", label: "Фитинговые платформы" },
                  { value: "loco", label: "Локомотивы / маневровая техника" },
                  { value: "other", label: "Другое" },
                ],
              },
              {
                id: "wagon_other",
                type: "text",
                label: "Уточните тип техники",
                required: true,
                condition: { field: "wagon_type", op: "eq", value: "other" },
              },
              {
                id: "tank_cargo",
                type: "select",
                label: "Перевозимый груз",
                required: true,
                hint: "Для цистерн под опасные грузы действуют доп. требования к страхованию",
                options: [
                  { value: "oil", label: "Нефтепродукты" },
                  { value: "chem", label: "Химические грузы" },
                  { value: "food", label: "Пищевые наливные грузы" },
                ],
                condition: { field: "wagon_type", op: "eq", value: "tank" },
              },
              {
                id: "condition_new",
                type: "radio",
                label: "Состояние техники",
                required: true,
                options: [
                  { value: "new", label: "Новая (с завода-изготовителя)" },
                  { value: "used", label: "Бывшая в эксплуатации" },
                ],
              },
              {
                id: "used_year",
                type: "number",
                label: "Год выпуска",
                required: true,
                min: 1995,
                max: 2026,
                hint: "Остаточный срок службы влияет на максимальный срок лизинга",
                condition: { field: "condition_new", op: "eq", value: "used" },
              },
              { id: "units", type: "number", label: "Количество единиц", required: true, min: 1, max: 500 },
              {
                id: "unit_price",
                type: "money",
                label: "Стоимость за единицу",
                required: true,
                unit: "тенге",
                hint: "Ориентировочная цена по данным поставщика",
              },
              {
                id: "total_cost",
                type: "calc",
                label: "Общая стоимость проекта",
                formula: "units * unit_price",
                unit: "тенге",
              },
              {
                id: "advance_pct",
                type: "number",
                label: "Собственное участие (аванс), %",
                required: true,
                min: 20,
                max: 90,
                unit: "%",
                hint: "Минимум 20% от стоимости проекта",
              },
              {
                id: "advance_amount",
                type: "calc",
                label: "Сумма аванса",
                formula: "round(units * unit_price * advance_pct / 100)",
                unit: "тенге",
              },
              {
                id: "financing_amount",
                type: "calc",
                label: "Запрашиваемое финансирование",
                formula: "round(units * unit_price * (100 - advance_pct) / 100)",
                unit: "тенге",
              },
              {
                id: "term_months",
                type: "select",
                label: "Желаемый срок лизинга",
                required: true,
                options: [
                  { value: "36", label: "3 года" },
                  { value: "60", label: "5 лет" },
                  { value: "84", label: "7 лет" },
                  { value: "120", label: "10 лет" },
                ],
              },
            ],
          },
          {
            id: "usage",
            title: "Использование",
            fields: [
              {
                id: "route",
                type: "textarea",
                label: "Планируемые маршруты и грузовая база",
                required: true,
                placeholder: "Например: перевозка зерна Астана — Актау, далее экспорт через порт",
                hint: "2–3 предложения достаточно, детали запросим на II этапе",
              },
              {
                id: "has_contracts",
                type: "radio",
                label: "Есть ли подтверждённые контракты на перевозку?",
                required: true,
                options: [
                  { value: "yes", label: "Да, контракты подписаны" },
                  { value: "negotiation", label: "На стадии переговоров" },
                  { value: "no", label: "Пока нет" },
                ],
              },
              {
                id: "contracts_sum",
                type: "money",
                label: "Совокупная сумма контрактов",
                required: true,
                unit: "тенге",
                condition: { field: "has_contracts", op: "eq", value: "yes" },
              },
              {
                id: "consent",
                type: "checkbox",
                label: "Согласие на сбор и обработку данных, запрос сведений в ГК и БВУ",
                required: true,
              },
            ],
          },
        ],
      },
      {
        id: "stage2",
        title: "II этап — полная заявка",
        description:
          "После предварительного одобрения: расширенные данные, документы и подписание ЭЦП.",
        steps: [
          {
            id: "financials",
            title: "Финансовое состояние",
            fields: [
              {
                id: "revenue_last",
                type: "money",
                label: "Выручка за последний финансовый год",
                required: true,
                unit: "тенге",
              },
              {
                id: "debt_load",
                type: "money",
                label: "Действующая кредитная нагрузка",
                required: true,
                unit: "тенге",
                hint: "Сумма всех действующих кредитов и лизинговых обязательств",
              },
              {
                id: "collateral",
                type: "select",
                label: "Дополнительное обеспечение",
                required: true,
                options: [
                  { value: "none", label: "Только предмет лизинга" },
                  { value: "realty", label: "Недвижимость" },
                  { value: "guarantee", label: "Гарантия банка / фонда «Даму»" },
                ],
              },
              {
                id: "collateral_value",
                type: "money",
                label: "Оценочная стоимость обеспечения",
                required: true,
                unit: "тенге",
                condition: { field: "collateral", op: "ne", value: "none" },
              },
            ],
          },
          {
            id: "documents",
            title: "Документы",
            description: "Документы подписываются ЭЦП онлайн — приезжать в офис не нужно.",
            fields: [
              {
                id: "doc_fin_report",
                type: "file",
                label: "Финансовая отчётность за 2 года",
                required: true,
                accept: ".pdf,.xlsx",
              },
              {
                id: "doc_business_plan",
                type: "file",
                label: "Бизнес-план проекта",
                required: true,
                accept: ".pdf,.docx",
                condition: { field: "experience", op: "eq", value: "no" },
              },
              {
                id: "doc_supplier_offer",
                type: "file",
                label: "Коммерческое предложение поставщика",
                required: true,
                accept: ".pdf",
              },
              {
                id: "doc_contracts",
                type: "file",
                label: "Контракты на перевозку",
                required: true,
                accept: ".pdf",
                condition: { field: "has_contracts", op: "eq", value: "yes" },
              },
              {
                id: "sign_info",
                type: "info",
                label: "",
                content: "Нажимая «Подписать и отправить», вы подписываете пакет документов ЭЦП (NCALayer / eGov mobile).",
              },
            ],
          },
        ],
      },
    ],
  },
};

/**
 * Контрольный кейс №2: «Агробизнес — животноводство» (Аграрная кредитная корпорация).
 * Популярная услуга с ветвлением по типу заёмщика (прямой заёмщик vs КТ/БВУ/МФО)
 * и расчётом процентной нагрузки.
 */
export const agroService: SeedService = {
  code: "agro_animal",
  title: "Агробизнес — животноводство",
  summary:
    "Льготное кредитование откормочных площадок и птицефабрик на пополнение оборотных средств. Ставка 5% для прямых заёмщиков.",
  description:
    "Программа «Агробизнес» Аграрной кредитной корпорации: финансирование откормочных площадок и птицефабрик. Прямые заёмщики — 5% годовых, кредитные товарищества, БВУ и МФО — 1,5% с маржой до 3,5% при кредитовании конечных заёмщиков. Срок — до 36 месяцев.",
  category: "Кредитование",
  direction: "Агропромышленный комплекс",
  organization: "АО «Аграрная кредитная корпорация»",
  audience: ["Фермерские хозяйства", "ТОО и АО", "Кредитные товарищества", "БВУ и МФО"],
  conditions: [
    { code: "rate", title: "Ставка", value: "5% / 1,5%" },
    { code: "term", title: "Срок", value: "до 36 мес." },
    { code: "target", title: "Цель", value: "оборотные средства" },
  ],
  status: "published",
  isPopular: true,
  schema: {
    stages: [
      {
        id: "main",
        title: "Заявка на финансирование",
        steps: [
          {
            id: "borrower",
            title: "Заёмщик",
            fields: [
              {
                id: "borrower_type",
                type: "radio",
                label: "Кто подаёт заявку",
                required: true,
                hint: "От этого зависят ставка и состав документов",
                options: [
                  { value: "direct", label: "Прямой заёмщик (фермерское хозяйство, ТОО)" },
                  { value: "kt", label: "Кредитное товарищество" },
                  { value: "bank", label: "БВУ / МФО / РИЦ" },
                ],
              },
              {
                id: "rate_info_direct",
                type: "info",
                label: "",
                content: "Ваша ставка: **5% годовых** (ГЭСВ от 5%). Решение — до 7 рабочих дней.",
                condition: { field: "borrower_type", op: "eq", value: "direct" },
              },
              {
                id: "rate_info_inter",
                type: "info",
                label: "",
                content:
                  "Ставка фондирования: **1,5% годовых**. При кредитовании конечных заёмщиков маржа — не более 3,5% годовых.",
                condition: { field: "borrower_type", op: "in", value: ["kt", "bank"] },
              },
              { id: "org_name", type: "text", label: "Наименование организации", required: true, prefill: "company.name" },
              { id: "org_bin", type: "bin", label: "БИН", required: true, prefill: "company.bin" },
              { id: "region", type: "select", label: "Регион деятельности", required: true, reference: "regions" },
              { id: "phone", type: "phone", label: "Телефон", required: true },
            ],
          },
          {
            id: "project",
            title: "Направление",
            fields: [
              {
                id: "direction",
                type: "radio",
                label: "Направление деятельности",
                required: true,
                options: [
                  { value: "feedlot", label: "Откормочная площадка (КРС)" },
                  { value: "poultry", label: "Птицефабрика" },
                ],
              },
              {
                id: "heads",
                type: "number",
                label: "Поголовье КРС на откорме",
                required: true,
                min: 50,
                unit: "голов",
                hint: "Минимальное поголовье для участия в программе — 50 голов",
                condition: { field: "direction", op: "eq", value: "feedlot" },
              },
              {
                id: "poultry_capacity",
                type: "number",
                label: "Производственная мощность",
                required: true,
                unit: "тонн/год",
                condition: { field: "direction", op: "eq", value: "poultry" },
              },
              {
                id: "loan_amount",
                type: "money",
                label: "Запрашиваемая сумма",
                required: true,
                unit: "тенге",
                min: 5000000,
                max: 3000000000,
              },
              {
                id: "loan_term",
                type: "select",
                label: "Срок",
                required: true,
                options: [
                  { value: "12", label: "12 месяцев" },
                  { value: "24", label: "24 месяца" },
                  { value: "36", label: "36 месяцев" },
                ],
              },
              {
                id: "yearly_interest",
                type: "calc",
                label: "Ориентировочное вознаграждение в год (5%)",
                formula: "round(loan_amount * 0.05)",
                unit: "тенге",
                condition: { field: "borrower_type", op: "eq", value: "direct" },
              },
              {
                id: "purpose",
                type: "select",
                label: "Целевое использование",
                required: true,
                options: [
                  { value: "fodder", label: "Закуп кормов" },
                  { value: "livestock", label: "Закуп молодняка" },
                  { value: "mixed", label: "Корма + молодняк" },
                  { value: "relending", label: "Последующее кредитование конечных заёмщиков" },
                ],
              },
            ],
          },
          {
            id: "docs",
            title: "Документы и отправка",
            fields: [
              { id: "doc_statement", type: "file", label: "Справка об отсутствии налоговой задолженности", required: true, accept: ".pdf" },
              {
                id: "doc_vet",
                type: "file",
                label: "Ветеринарный паспорт / учёт в ИСЖ",
                required: true,
                accept: ".pdf",
                condition: { field: "direction", op: "eq", value: "feedlot" },
              },
              {
                id: "doc_portfolio",
                type: "file",
                label: "Отчёт о кредитном портфеле",
                required: true,
                accept: ".pdf,.xlsx",
                condition: { field: "borrower_type", op: "in", value: ["kt", "bank"] },
              },
              { id: "consent", type: "checkbox", label: "Согласие на обработку данных и запрос в ГКБ", required: true },
            ],
          },
        ],
      },
    ],
  },
};

/** Остальной каталог — короткие услуги, показывают масштабируемость */
export const catalogServices: SeedService[] = [
  {
    code: "damu_guarantee",
    title: "Гарантирование кредитов МСБ",
    summary: "Гарантия фонда «Даму» до 85% от суммы кредита для бизнеса без достаточного залога.",
    description: "Фонд «Даму» предоставляет гарантии по кредитам банков второго уровня, когда у предпринимателя недостаточно собственного залогового обеспечения.",
    category: "Гарантирование",
    direction: "Малый и средний бизнес",
    organization: "АО «Фонд развития предпринимательства «Даму»",
    audience: ["Индивидуальные предприниматели", "ТОО и АО"],
    conditions: [
      { code: "cover", title: "Покрытие", value: "до 85%" },
      { code: "amount", title: "Сумма", value: "до 1 млрд ₸" },
    ],
    status: "published",
    isPopular: true,
    schema: {
      stages: [
        {
          id: "main",
          title: "Заявка",
          steps: [
            {
              id: "s1",
              title: "Заявитель",
              fields: [
                { id: "bin", type: "bin", label: "БИН", required: true, prefill: "company.bin" },
                { id: "bank", type: "select", label: "Банк-кредитор", required: true, options: [
                  { value: "halyk", label: "Halyk Bank" },
                  { value: "bcc", label: "Банк ЦентрКредит" },
                  { value: "forte", label: "ForteBank" },
                  { value: "other", label: "Другой" },
                ] },
                { id: "credit_amount", type: "money", label: "Сумма кредита", required: true, unit: "тенге" },
                { id: "guarantee_calc", type: "calc", label: "Максимальная гарантия (85%)", formula: "round(credit_amount * 0.85)", unit: "тенге" },
                { id: "consent", type: "checkbox", label: "Согласие на обработку данных", required: true },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    code: "kazakhexport_insurance",
    title: "Страхование экспортных контрактов",
    summary: "Защита экспортёра от неплатежа иностранного покупателя. Покрытие до 90% контракта.",
    description: "KazakhExport страхует риски неплатежа по экспортным контрактам казахстанских производителей.",
    category: "Страхование",
    direction: "Экспорт",
    organization: "АО «ЭСК KazakhExport»",
    audience: ["ТОО и АО"],
    conditions: [
      { code: "cover", title: "Покрытие", value: "до 90%" },
    ],
    status: "published",
    schema: {
      stages: [
        {
          id: "main",
          title: "Заявка",
          steps: [
            {
              id: "s1",
              title: "Контракт",
              fields: [
                { id: "bin", type: "bin", label: "БИН экспортёра", required: true, prefill: "company.bin" },
                { id: "country", type: "select", label: "Страна покупателя", required: true, reference: "countries" },
                { id: "contract_sum", type: "money", label: "Сумма контракта", required: true, unit: "USD" },
                { id: "consent", type: "checkbox", label: "Согласие на обработку данных", required: true },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    code: "kdb_investment",
    title: "Финансирование инвестиционных проектов",
    summary: "Долгосрочные займы Банка Развития Казахстана для крупных индустриальных проектов от 7 млрд тенге.",
    description: "БРК финансирует крупные инвестиционные проекты в обрабатывающей промышленности и инфраструктуре.",
    category: "Кредитование",
    direction: "Промышленность и транспорт",
    organization: "АО «Банк Развития Казахстана»",
    audience: ["ТОО и АО"],
    conditions: [
      { code: "amount", title: "Сумма", value: "от 7 млрд ₸" },
      { code: "term", title: "Срок", value: "до 20 лет" },
    ],
    status: "published",
    schema: {
      stages: [
        {
          id: "main",
          title: "Заявка",
          steps: [
            {
              id: "s1",
              title: "Проект",
              fields: [
                { id: "bin", type: "bin", label: "БИН", required: true },
                { id: "project_name", type: "text", label: "Наименование проекта", required: true },
                { id: "project_cost", type: "money", label: "Стоимость проекта", required: true, unit: "тенге", min: 7000000000 },
                { id: "consent", type: "checkbox", label: "Согласие на обработку данных", required: true },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    code: "otbasy_housing",
    title: "Жилищные строительные сбережения",
    summary: "Накопительная система Отбасы банка: депозит + льготный жилищный займ от 5% годовых.",
    description: "Система жилстройсбережений: накопите 50% стоимости жилья и получите займ на оставшуюся часть по ставке от 5%.",
    category: "Жильё",
    direction: "Доступное жильё",
    organization: "АО «Отбасы банк»",
    audience: ["Физические лица"],
    conditions: [{ code: "rate", title: "Ставка займа", value: "от 5%" }],
    status: "published",
    schema: {
      stages: [
        {
          id: "main",
          title: "Заявка",
          steps: [
            {
              id: "s1",
              title: "Заявитель",
              fields: [
                { id: "iin", type: "iin", label: "ИИН", required: true, prefill: "user.iin" },
                { id: "goal_sum", type: "money", label: "Целевая стоимость жилья", required: true, unit: "тенге" },
                { id: "saved", type: "calc", label: "Необходимо накопить (50%)", formula: "round(goal_sum / 2)", unit: "тенге" },
                { id: "consent", type: "checkbox", label: "Согласие на обработку данных", required: true },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    code: "kaf_machinery",
    title: "Лизинг сельхозтехники",
    summary: "КазАгроФинанс: тракторы, комбайны и навесное оборудование в лизинг от 6% с авансом от 15%.",
    description: "Лизинг сельскохозяйственной техники отечественного и импортного производства для аграриев.",
    category: "Лизинг",
    direction: "Агропромышленный комплекс",
    organization: "АО «КазАгроФинанс»",
    audience: ["Фермерские хозяйства", "ТОО и АО"],
    conditions: [
      { code: "rate", title: "Ставка", value: "от 6%" },
      { code: "advance", title: "Аванс", value: "от 15%" },
    ],
    status: "published",
    isPopular: true,
    schema: {
      stages: [
        {
          id: "main",
          title: "Заявка",
          steps: [
            {
              id: "s1",
              title: "Техника",
              fields: [
                { id: "bin", type: "bin", label: "БИН / ИИН", required: true },
                { id: "machinery", type: "select", label: "Вид техники", required: true, options: [
                  { value: "tractor", label: "Трактор" },
                  { value: "combine", label: "Комбайн" },
                  { value: "attachment", label: "Навесное оборудование" },
                ] },
                { id: "price", type: "money", label: "Стоимость", required: true, unit: "тенге" },
                { id: "consent", type: "checkbox", label: "Согласие на обработку данных", required: true },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    code: "qic_venture",
    title: "Венчурное финансирование стартапов",
    summary: "QIC инвестирует в казахстанские технологические компании через венчурные фонды-партнёры.",
    description: "Qazaqstan Investment Corporation — фонд фондов: инвестиции в стартапы через управляющие венчурные фонды.",
    category: "Инвестиции",
    direction: "Инновации и стартапы",
    organization: "АО «Qazaqstan Investment Corporation»",
    audience: ["ТОО и АО", "Стартапы"],
    conditions: [{ code: "stage", title: "Стадия", value: "Seed — Series B" }],
    status: "published",
    schema: {
      stages: [
        {
          id: "main",
          title: "Заявка",
          steps: [
            {
              id: "s1",
              title: "Стартап",
              fields: [
                { id: "startup_name", type: "text", label: "Название стартапа", required: true },
                { id: "stage", type: "select", label: "Стадия", required: true, options: [
                  { value: "seed", label: "Seed" },
                  { value: "a", label: "Series A" },
                  { value: "b", label: "Series B" },
                ] },
                { id: "pitch", type: "file", label: "Питч-дек", required: true, accept: ".pdf" },
                { id: "consent", type: "checkbox", label: "Согласие на обработку данных", required: true },
              ],
            },
          ],
        },
      ],
    },
  },
];

export const allSeedServices: SeedService[] = [wagonsService, agroService, ...catalogServices];
