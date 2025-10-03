export const CONTEXT_STEPS = [
  {
    key: 'problem',
    kind: 'context',
    color: {
      border: 'border-logic-problem',
      background: 'bg-logic-problem'
    },
    defaultTitle: { en: 'Problem / Need', sv: 'Problem / Behov' }
  },
  {
    key: 'target',
    kind: 'context',
    color: {
      border: 'border-logic-target',
      background: 'bg-logic-target'
    },
    defaultTitle: { en: 'Target group / Beneficiaries', sv: 'Målgrupp / Förmånstagare' }
  }
];

export const PIPELINE_STEPS = [
  {
    key: 'inputs',
    kind: 'lane',
    color: {
      border: 'border-logic-inputs',
      background: 'bg-logic-inputs'
    },
    defaultTitle: { en: 'Inputs / Resources', sv: 'Insatser / Resurser' }
  },
  {
    key: 'activities',
    kind: 'lane',
    color: {
      border: 'border-logic-activities',
      background: 'bg-logic-activities'
    },
    defaultTitle: { en: 'Activities / Interventions', sv: 'Aktiviteter / Insatser' }
  },
  {
    key: 'outputs',
    kind: 'lane',
    color: {
      border: 'border-logic-outputs',
      background: 'bg-logic-outputs'
    },
    defaultTitle: { en: 'Outputs', sv: 'Resultat (Outputs)' },
    hasIndicators: true
  },
  {
    key: 'outcomesShort',
    kind: 'lane',
    color: {
      border: 'border-logic-short',
      background: 'bg-logic-short'
    },
    defaultTitle: { en: 'Short-term outcomes', sv: 'Kortsiktiga effekter' },
    hasIndicators: true
  },
  {
    key: 'outcomesLong',
    kind: 'lane',
    color: {
      border: 'border-logic-long',
      background: 'bg-logic-long'
    },
    defaultTitle: { en: 'Long-term outcomes', sv: 'Långsiktiga effekter' },
    hasIndicators: true
  },
  {
    key: 'impact',
    kind: 'lane',
    color: {
      border: 'border-logic-impact',
      background: 'bg-logic-impact'
    },
    defaultTitle: { en: 'Impact', sv: 'Effekt / Påverkan' },
    hasIndicators: true
  }
];

export const ALL_STEP_DEFINITIONS = [...CONTEXT_STEPS, ...PIPELINE_STEPS];

export const INITIAL_TEMPLATE = {
  id: 'blank',
  label: { en: 'Blank canvas', sv: 'Tom modell' },
  description: {
    en: 'Start from scratch and add the components you need.',
    sv: 'Börja från början och lägg till de komponenter du behöver.'
  },
  nodes: [],
  edges: []
};

export const BASIC_TEMPLATE = {
  id: 'basic',
  label: { en: 'Full logic model', sv: 'Full logikmodell' },
  description: {
    en: 'Pre-populated with the standard logic model components.',
    sv: 'Förifylld med standardkomponenterna i en logikmodell.'
  },
  nodes: [
    ...CONTEXT_STEPS.map((step, index) => ({
      id: step.key,
      type: 'logicNode',
      position: { x: index * 320, y: -180 },
      data: {
        stepKey: step.key,
        title: step.defaultTitle,
        description: { en: '', sv: '' },
        indicators: [],
        assumptions: []
      }
    })),
    ...PIPELINE_STEPS.map((step, index) => ({
      id: step.key,
      type: 'logicNode',
      position: { x: index * 280, y: 40 },
      data: {
        stepKey: step.key,
        title: step.defaultTitle,
        description: { en: '', sv: '' },
        indicators: [],
        assumptions: []
      }
    }))
  ],
  edges: PIPELINE_STEPS.slice(0, -1).map((step, index) => ({
    id: `${step.key}-${PIPELINE_STEPS[index + 1].key}`,
    source: step.key,
    target: PIPELINE_STEPS[index + 1].key,
    data: {
      assumptions: { en: '', sv: '' }
    }
  }))
};

export const EXAMPLE_TEMPLATE = {
  id: 'youth-wellbeing',
  label: { en: 'Example: Youth wellbeing', sv: 'Exempel: Ungas välmående' },
  description: {
    en: 'An example model for a youth wellbeing program.',
    sv: 'Ett exempel för ett program som stärker ungas välmående.'
  },
  nodes: [
    {
      id: 'problem',
      type: 'logicNode',
      position: { x: 40, y: -180 },
      data: {
        stepKey: 'problem',
        title: {
          en: 'High stress among local youth',
          sv: 'Hög stress bland lokala ungdomar'
        },
        description: {
          en: 'Youth surveys show increased stress and loneliness in the community.',
          sv: 'Ungdomsenkäter visar ökad stress och ensamhet i kommunen.'
        },
        indicators: [],
        assumptions: []
      }
    },
    {
      id: 'target',
      type: 'logicNode',
      position: { x: 360, y: -180 },
      data: {
        stepKey: 'target',
        title: {
          en: 'Youth aged 13-18',
          sv: 'Ungdomar 13-18 år'
        },
        description: {
          en: 'Students from local lower and upper secondary schools.',
          sv: 'Elever från lokala högstadie- och gymnasieskolor.'
        },
        indicators: [],
        assumptions: []
      }
    },
    {
      id: 'inputs',
      type: 'logicNode',
      position: { x: 0, y: 40 },
      data: {
        stepKey: 'inputs',
        title: {
          en: 'Youth workers & funding',
          sv: 'Ungdomsledare och finansiering'
        },
        description: {
          en: 'Three trained youth workers, municipal funding, collaboration with schools.',
          sv: 'Tre utbildade ungdomsledare, kommunal finansiering och samarbete med skolor.'
        },
        indicators: [],
        assumptions: []
      }
    },
    {
      id: 'activities',
      type: 'logicNode',
      position: { x: 780, y: 0 },
      data: {
        stepKey: 'activities',
        title: {
          en: 'Weekly wellbeing sessions',
          sv: 'Veckovisa välmåendeträffar'
        },
        description: {
          en: 'Workshops on stress management, peer support circles, mentor program.',
          sv: 'Workshops om stresshantering, samtalsgrupper och ett mentorprogram.'
        },
        indicators: [],
        assumptions: []
      }
    },
    {
      id: 'outputs',
      type: 'logicNode',
      position: { x: 1040, y: 0 },
      data: {
        stepKey: 'outputs',
        title: {
          en: 'Participation & sessions',
          sv: 'Medverkan och träffar'
        },
        description: {
          en: '50 youth participate, 30 sessions delivered.',
          sv: '50 ungdomar deltar, 30 träffar genomförs.'
        },
        indicators: [
          {
            id: 'out-ind-1',
            label: {
              en: 'Attendance records',
              sv: 'Närvarolistor'
            }
          }
        ],
        assumptions: []
      }
    },
    {
      id: 'outcomesShort',
      type: 'logicNode',
      position: { x: 1040, y: 40 },
      data: {
        stepKey: 'outcomesShort',
        title: {
          en: 'Improved coping skills',
          sv: 'Förbättrade coping-färdigheter'
        },
        description: {
          en: 'Participants report better stress management.',
          sv: 'Deltagare rapporterar bättre hantering av stress.'
        },
        indicators: [
          {
            id: 'short-ind-1',
            label: {
              en: 'Self-assessed coping survey',
              sv: 'Självskattningsenkät om coping'
            }
          }
        ],
        assumptions: [
          {
            id: 'short-assump-1',
            text: {
              en: 'Participants attend most sessions.',
              sv: 'Deltagarna närvarar vid de flesta träffar.'
            }
          }
        ]
      }
    },
    {
      id: 'outcomesLong',
      type: 'logicNode',
      position: { x: 1300, y: 40 },
      data: {
        stepKey: 'outcomesLong',
        title: {
          en: 'Sustained wellbeing',
          sv: 'Bestående välmående'
        },
        description: {
          en: 'Lower stress levels six months after the program.',
          sv: 'Lägre stressnivåer sex månader efter programmet.'
        },
        indicators: [
          {
            id: 'long-ind-1',
            label: {
              en: 'Follow-up wellbeing survey',
              sv: 'Uppföljande välmåendeenkät'
            }
          }
        ],
        assumptions: []
      }
    },
    {
      id: 'impact',
      type: 'logicNode',
      position: { x: 1820, y: 0 },
      data: {
        stepKey: 'impact',
        title: {
          en: 'Healthier youth community',
          sv: 'Hälsosammare ungdomsgemenskap'
        },
        description: {
          en: 'Reduced mental health referrals and improved school engagement.',
          sv: 'Färre remisser till psykiatrin och ökat engagemang i skolan.'
        },
        indicators: [],
        assumptions: []
      }
    }
  ],
  edges: [
    'inputs-activities',
    'activities-outputs',
    'outputs-outcomesShort',
    'outcomesShort-outcomesLong',
    'outcomesLong-impact'
  ].map((pair) => {
    const [source, target] = pair.split('-');
    return {
      id: pair,
      source,
      target,
      data: {
        assumptions: {
          en: '',
          sv: ''
        }
      }
    };
  })
};

export const TEMPLATES = [INITIAL_TEMPLATE, BASIC_TEMPLATE, EXAMPLE_TEMPLATE];

export const TEMPLATE_LOOKUP = TEMPLATES.reduce((acc, template) => {
  acc[template.id] = template;
  return acc;
}, {});
