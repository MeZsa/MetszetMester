export interface Pathology {
  id: string;
  name: string;
  description: string;
  tissueType: string;
  imageLink?: string;
  furtherReading?: string;
}

export const PATHOLOGIES: Pathology[] = [
  // Hámszövet
  {
    id: "h-1",
    tissueType: "Hámszövet",
    name: "Metaplasia",
    description: "Egy érett sejttípus átalakulása egy másik érett sejttípussá, általában krónikus irritáció hatására (pl. dohányzásnál a légutakban).",
    imageLink: "https://en.wikipedia.org/wiki/Metaplasia",
    furtherReading: "https://hu.wikipedia.org/wiki/Metapl%C3%A1zia"
  },
  {
    id: "h-2",
    tissueType: "Hámszövet",
    name: "Dysplasia",
    description: "A sejtek rendellenes fejlődése, méretbeli és alakbeli eltérésekkel, gyakran daganatmegelőző állapot.",
    imageLink: "https://en.wikipedia.org/wiki/Dysplasia",
    furtherReading: "https://hu.wikipedia.org/wiki/Diszpl%C3%A1zia"
  },
  {
    id: "h-3",
    tissueType: "Hámszövet",
    name: "Hyperplasia",
    description: "A sejtek számának növekedése egy szövetben vagy szervben, ami annak megnagyobbodásához vezet.",
    imageLink: "https://en.wikipedia.org/wiki/Hyperplasia",
    furtherReading: "https://hu.wikipedia.org/wiki/Hiperpl%C3%A1zia"
  },
  {
    id: "h-4",
    tissueType: "Hámszövet",
    name: "Squamous Cell Carcinoma",
    description: "A laphámsejtekből kiinduló rosszindulatú daganat, melyet gyakran keratinizáció (szarugyöngyök) jellemez szövettanilag.",
    imageLink: "https://en.wikipedia.org/wiki/Squamous-cell_carcinoma",
    furtherReading: "https://hu.wikipedia.org/wiki/Laph%C3%A1mrak"
  },

  // Kötőszövet
  {
    id: "k-1",
    tissueType: "Kötőszövet",
    name: "Fibrosis",
    description: "A kötőszövet túlzott felszaporodása egy szervben vagy szövetben, általában gyógyulási folyamat vagy krónikus gyulladás részeként.",
    imageLink: "https://en.wikipedia.org/wiki/Fibrosis",
    furtherReading: "https://hu.wikipedia.org/wiki/Fibr%C3%B3zis"
  },
  {
    id: "k-2",
    tissueType: "Kötőszövet",
    name: "Ödéma (Edema)",
    description: "Folyadékgyülem a szövetek közötti térben, ami duzzanatot okoz.",
    imageLink: "https://en.wikipedia.org/wiki/Edema",
    furtherReading: "https://hu.wikipedia.org/wiki/%C3%96d%C3%A9ma"
  },
  {
    id: "k-3",
    tissueType: "Kötőszövet",
    name: "Lipoma",
    description: "Zsírszövetből álló jóindulatú daganat, melyet érett adipocyták alkotnak, vékony kötőszövetes tokkal körülvéve.",
    imageLink: "https://en.wikipedia.org/wiki/Lipoma",
    furtherReading: "https://hu.wikipedia.org/wiki/Lip%C3%B3ma"
  },

  // Izomszövet
  {
    id: "i-1",
    tissueType: "Izomszövet",
    name: "Atrophia",
    description: "Az izomrostok méretének csökkenése, ami az izom tömegének és erejének vesztésével jár (pl. inaktivitás vagy idegsérülés miatt).",
    imageLink: "https://en.wikipedia.org/wiki/Atrophy",
    furtherReading: "https://hu.wikipedia.org/wiki/Atrofia"
  },
  {
    id: "i-2",
    tissueType: "Izomszövet",
    name: "Hypertrophia",
    description: "Az izomrostok méretének növekedése a sejtek számának változása nélkül (pl. edzés hatására).",
    imageLink: "https://en.wikipedia.org/wiki/Hypertrophy",
    furtherReading: "https://hu.wikipedia.org/wiki/Hipertr%C3%B3fia"
  },
  {
    id: "i-3",
    tissueType: "Izomszövet",
    name: "Leiomyoma",
    description: "Simaizomszövetből kiinduló jóindulatú daganat, leggyakrabban a méhben fordul elő (myoma).",
    imageLink: "https://en.wikipedia.org/wiki/Leiomyoma",
    furtherReading: "https://hu.wikipedia.org/wiki/Leiomyoma"
  },

  // Idegszövet
  {
    id: "id-1",
    tissueType: "Idegszövet",
    name: "Demyelinisatio",
    description: "Az idegrostokat körülvevő velőshüvely (myelin) károsodása vagy elvesztése, ami lassítja az ingerületvezetést.",
    imageLink: "https://en.wikipedia.org/wiki/Demyelination",
    furtherReading: "https://hu.wikipedia.org/wiki/Demyelinisatio"
  },
  {
    id: "id-2",
    tissueType: "Idegszövet",
    name: "Gliosis",
    description: "A gliasejtek (támasztósejtek) felszaporodása a központi idegrendszerben sérülés vagy betegség utáni hegesedésként.",
    imageLink: "https://en.wikipedia.org/wiki/Gliosis",
    furtherReading: "https://en.wikipedia.org/wiki/Gliosis"
  },
  {
    id: "id-3",
    tissueType: "Idegszövet",
    name: "Neurofibroma",
    description: "A perifériás idegek kötőszöveti tokjából kiinduló jóindulatú daganat, melyet Schwann-sejtek és fibroblastok alkotnak.",
    imageLink: "https://en.wikipedia.org/wiki/Neurofibroma",
    furtherReading: "https://hu.wikipedia.org/wiki/Neurofibroma"
  }
];
