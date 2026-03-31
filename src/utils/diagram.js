const STAGE_META = [
  { id: 'problem', label: 'Problem', x: 0, y: 80, accent: '#e83c63' },
  { id: 'targetGroups', label: 'Malgrupper', x: 360, y: 80, accent: '#482d55' },
  { id: 'inputs', label: 'Resurser', x: 720, y: 80, accent: '#009ca6' },
  { id: 'activities', label: 'Aktiviteter', x: 1080, y: 80, accent: '#0e4e65' },
  { id: 'outputs', label: 'Outputs', x: 1440, y: 80, accent: '#009ca6' },
  {
    id: 'shortTermOutcomes',
    label: 'Kortsiktiga effekter',
    x: 1820,
    y: 0,
    accent: '#482d55'
  },
  {
    id: 'longTermOutcomes',
    label: 'Langsiktiga effekter',
    x: 1820,
    y: 340,
    accent: '#0e4e65'
  },
  { id: 'impact', label: 'Impact', x: 2200, y: 140, accent: '#e83c63' },
  { id: 'assumptions', label: 'Antaganden', x: 1080, y: 460, accent: '#828282' },
  { id: 'indicators', label: 'Indikatorer', x: 1440, y: 460, accent: '#009ca6' }
];

const createNodeItems = (value) => {
  if (typeof value === 'string') {
    return value ? [value] : [];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => item.text).filter(Boolean);
};

export const buildOverviewNodes = (theory) =>
  STAGE_META.map((stage) => ({
    id: stage.id,
    type: 'overviewNode',
    position: { x: stage.x, y: stage.y },
    sourcePosition: 'right',
    targetPosition: 'left',
    data: {
      label: stage.label,
      accent: stage.accent,
      items: createNodeItems(theory?.[stage.id]),
      isEmpty: createNodeItems(theory?.[stage.id]).length === 0
    }
  }));

export const buildOverviewEdges = () => [
  ['problem', 'targetGroups'],
  ['targetGroups', 'inputs'],
  ['inputs', 'activities'],
  ['activities', 'outputs'],
  ['outputs', 'shortTermOutcomes'],
  ['outputs', 'longTermOutcomes'],
  ['shortTermOutcomes', 'impact'],
  ['longTermOutcomes', 'impact'],
  ['assumptions', 'activities'],
  ['indicators', 'outputs']
].map(([source, target]) => ({
  id: `${source}-${target}`,
  source,
  target,
  animated: target === 'impact',
  style: {
    stroke: '#c8c8c8',
    strokeWidth: 1.5
  }
}));
