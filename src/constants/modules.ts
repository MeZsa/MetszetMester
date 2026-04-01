export interface ModuleStep {
  id: string;
  title: string;
  type: 'theory' | 'image' | 'question' | 'explanation' | 'clinical';
  content: string;
  image?: string;
  question?: {
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface LearningModule {
  id: string;
  title: string;
  category: 'Normál szövettan' | 'Gyulladásos eltérések' | 'Neoplasztikus szövetek' | 'Technikai hibák' | 'Eset-alapú diagnosztika';
  description: string;
  steps: ModuleStep[];
}

export const LEARNING_MODULES: LearningModule[] = [
  {
    id: 'norm-1',
    category: 'Normál szövettan',
    title: 'Többrétegű elszarusodó laphám',
    description: 'A bőr hámrétegének (epidermis) szerkezete és sejtjei.',
    steps: [
      {
        id: 's1',
        title: 'Rövid elmélet',
        type: 'theory',
        content: 'A többrétegű elszarusodó laphám a mechanikai védelemre specializálódott. Öt fő rétegből áll: stratum basale, spinosum, granulosum, lucidum és corneum. A sejtek a mélyebb rétegekből a felszín felé vándorolnak, miközben keratinizálódnak.'
      },
      {
        id: 's2',
        title: 'Nézzük a képet',
        type: 'image',
        image: 'https://picsum.photos/seed/histology_skin/800/600',
        content: 'Figyelje meg a bazális réteg sötét sejtmagvait és a felszíni vastag, eosinophil szaruréteget.'
      },
      {
        id: 's3',
        title: 'Interaktív kérdés',
        type: 'question',
        content: 'Melyik réteg felelős a sejtosztódásért?',
        question: {
          text: 'Melyik réteg felelős a sejtosztódásért?',
          options: ['Stratum corneum', 'Stratum basale', 'Stratum granulosum', 'Stratum lucidum'],
          correctIndex: 1,
          explanation: 'A stratum basale (alapi réteg) tartalmazza az őssejteket, amelyek folyamatos osztódással pótolják a felszín felé lökődő sejteket.'
        }
      },
      {
        id: 's4',
        title: 'AI magyarázat',
        type: 'explanation',
        content: 'A képen látható hám vastagsága és az elszarusodás mértéke arra utal, hogy mechanikai igénybevételnek kitett területről (pl. tenyér vagy talp) van szó. A stratum granulosum sejtjeiben látható sötét szemcsék a keratohyalin szemcsék, melyek a keratinizáció kulcsszereplői.'
      },
      {
        id: 's5',
        title: 'Klinikai relevancia',
        type: 'clinical',
        content: 'A hám integritásának megbomlása (pl. égés vagy krónikus irritáció) fertőzésekhez és folyadékvesztéshez vezethet. A pikkelysömör (psoriasis) esetén a sejtosztódás felgyorsul, ami kóros elszarusodást eredményez.'
      }
    ]
  },
  {
    id: 'gyul-1',
    category: 'Gyulladásos eltérések',
    title: 'Akut appendicitis',
    description: 'A féregnyúlvány akut gyulladásának szövettani jelei.',
    steps: [
      {
        id: 's1',
        title: 'Rövid elmélet',
        type: 'theory',
        content: 'Az akut gyulladást a szöveti ödéma, értágulat és a neutrophil granulocyták masszív infiltrációja jellemzi. A nyálkahártya gyakran kifekélyesedik.'
      },
      {
        id: 's2',
        title: 'Nézzük a képet',
        type: 'image',
        image: 'https://picsum.photos/seed/appendix_inflammation/800/600',
        content: 'Keresse a falban elszórtan vagy csoportosan megjelenő, lebenyezett magvú neutrophil sejteket.'
      },
      {
        id: 's3',
        title: 'Interaktív kérdés',
        type: 'question',
        content: 'Melyik sejttípus dominál az akut gennyes gyulladásban?',
        question: {
          text: 'Melyik sejttípus dominál az akut gennyes gyulladásban?',
          options: ['Lymphocyta', 'Neutrophil granulocyta', 'Plazmasejt', 'Macrophag'],
          correctIndex: 1,
          explanation: 'Az akut bakteriális gyulladás és a gennyképződés elsődleges sejtjei a neutrophil granulocyták.'
        }
      },
      {
        id: 's4',
        title: 'AI magyarázat',
        type: 'explanation',
        content: 'A metszeten a muscularis propria rétegeibe hatoló neutrophil infiltráció látható. Ez a transzmuralis gyulladás az appendicitis acuta diagnosztikus kritériuma. Az erek tágak és vörösvértestekkel teltek (hyperaemia).'
      },
      {
        id: 's5',
        title: 'Klinikai relevancia',
        type: 'clinical',
        content: 'A gyulladás tovaterjedése perforációhoz és diffúz hashártyagyulladáshoz (peritonitis) vezethet, ami életveszélyes állapot.'
      }
    ]
  }
];
