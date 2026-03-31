const LIST_SECTION_KEYS = [
  'targetGroups',
  'inputs',
  'activities',
  'outputs',
  'shortTermOutcomes',
  'longTermOutcomes',
  'assumptions',
  'indicators',
  'evidenceGaps',
  'confidenceNotes'
];

export const THEORY_SECTION_META = {
  problem: {
    title: 'Problembild',
    helper: 'Beskriv vilket behov eller vilken utmaning insatsen adresserar.',
    type: 'text',
    placeholder:
      'Exempel: Unga i området rapporterar ökad stress, ensamhet och svag tillit till lokala stödresurser.'
  },
  targetGroups: {
    title: 'Målgrupper',
    helper: 'Lista vilka grupper som direkt eller indirekt berörs av insatsen.',
    type: 'list',
    placeholder: 'Exempel: Unga 13–18 år i kommunens skolor'
  },
  inputs: {
    title: 'Resurser och förutsättningar',
    helper: 'Vilka resurser, partnerskap och kapaciteter behövs?',
    type: 'list',
    placeholder: 'Exempel: Projektledare, metodstöd och finansiering'
  },
  activities: {
    title: 'Aktiviteter och insatser',
    helper: 'Vad ska faktiskt genomföras i projektet?',
    type: 'list',
    placeholder: 'Exempel: Grupptträffar, utbildningar eller coachning'
  },
  outputs: {
    title: 'Direkta resultat',
    helper: 'Vad levereras eller produceras på kort sikt?',
    type: 'list',
    placeholder: 'Exempel: Antal genomförda workshops eller deltagare'
  },
  shortTermOutcomes: {
    title: 'Kortsiktiga effekter',
    helper: 'Vilka tidiga förändringar vill ni se hos målgruppen?',
    type: 'list',
    placeholder: 'Exempel: Förbättrad kunskap eller ökad motivation'
  },
  longTermOutcomes: {
    title: 'Långsiktiga effekter',
    helper: 'Vilka mer varaktiga förändringar förväntas över tid?',
    type: 'list',
    placeholder: 'Exempel: Starkare etablering, hållbara beteendeförändringar'
  },
  impact: {
    title: 'Övergripande effekt',
    helper: 'Sammanfatta den långsiktiga samhälls- eller verksamhetsnyttan.',
    type: 'text',
    placeholder:
      'Exempel: Fler unga har hållbara strategier för att hantera stress och fullföljer skolan.'
  },
  assumptions: {
    title: 'Antaganden',
    helper: 'Vilka antaganden måste hålla för att logiken ska fungera?',
    type: 'list',
    placeholder: 'Exempel: Deltagarna fullföljer insatsen över tid'
  },
  indicators: {
    title: 'Indikatorer',
    helper: 'Vilka indikatorer visar om arbetet ger resultat?',
    type: 'list',
    placeholder: 'Exempel: Närvaro, självskattning eller registerdata'
  },
  evidenceGaps: {
    title: 'Oklara delar att verifiera',
    helper: 'Markera delar som behöver utforskas vidare innan ni låser modellen.',
    type: 'list',
    placeholder: 'Exempel: Saknas nulägésdata om målgruppens behov'
  },
  confidenceNotes: {
    title: 'Tillförlitlighet och noter',
    helper: 'Fånga osäkerheter, risker eller kvalitetsnoteringar.',
    type: 'list',
    placeholder: 'Exempel: Bedömningen bygger på ett begränsat underlag'
  }
};

export const THEORY_LIST_SECTION_KEYS = LIST_SECTION_KEYS;

export const createId = (prefix = 'item') =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

export const createListItem = (text = '') => ({
  id: createId('entry'),
  text
});

export const createEmptyTheory = () => ({
  projectTitle: '',
  problem: '',
  targetGroups: [],
  inputs: [],
  activities: [],
  outputs: [],
  shortTermOutcomes: [],
  longTermOutcomes: [],
  impact: '',
  assumptions: [],
  indicators: [],
  evidenceGaps: [],
  confidenceNotes: []
});

export const normalizeListEntries = (entries) => {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => {
      if (typeof entry === 'string') {
        const text = entry.trim();
        return text ? createListItem(text) : null;
      }

      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const text = typeof entry.text === 'string' ? entry.text.trim() : '';
      if (!text) {
        return null;
      }

      return {
        id: typeof entry.id === 'string' && entry.id ? entry.id : createId('entry'),
        text
      };
    })
    .filter(Boolean);
};

export const normalizeTheory = (rawTheory) => {
  const base = createEmptyTheory();
  const source = rawTheory && typeof rawTheory === 'object' ? rawTheory : {};
  const theory = {
    ...base,
    projectTitle: typeof source.projectTitle === 'string' ? source.projectTitle.trim() : '',
    problem: typeof source.problem === 'string' ? source.problem.trim() : '',
    impact: typeof source.impact === 'string' ? source.impact.trim() : ''
  };

  LIST_SECTION_KEYS.forEach((key) => {
    theory[key] = normalizeListEntries(source[key]);
  });

  return theory;
};

export const hasTheoryContent = (theory) => {
  if (!theory) {
    return false;
  }

  if (theory.projectTitle || theory.problem || theory.impact) {
    return true;
  }

  return LIST_SECTION_KEYS.some((key) => (theory[key] ?? []).length > 0);
};

export const isTheoryEmpty = (theory) => !hasTheoryContent(theory);

export const replaceListSection = (theory, key, nextItems) => ({
  ...theory,
  [key]: normalizeListEntries(nextItems)
});

export const countSourcesByKind = (sources) =>
  (sources ?? []).reduce(
    (acc, source) => {
      const kind = source.kind ?? 'other';
      acc[kind] = (acc[kind] ?? 0) + 1;
      return acc;
    },
    { docx: 0, pdf: 0, image: 0, other: 0 }
  );
