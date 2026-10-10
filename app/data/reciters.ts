// Qur'an reciters. Each one's complete recitation is hosted as one archive.org item with the
// surahs named by number: 001.mp3 … 114.mp3.

import type { Localized } from "./curriculum";

export type Reciter = {
  id: string;
  name: Localized;
  hue: number;
  riwayah: Localized;
  /** archive.org item holding 001.mp3 … 114.mp3. */
  item: string;
  /** Length of each surah's recording in seconds, surah 1 first. */
  seconds: number[];
  /** Where the recordings come from, credited on the reciter's page. */
  source: { name: Localized; url: string };
  /** Square portrait in public/reciters/, from Wikimedia Commons; credited on the reciter's page. */
  photo?: { src: string; author: string; license: string; url: string };
};

const hafs: Localized = { ar: "رواية حفص عن عاصم", en: "Ḥafṣ ʿan ʿĀṣim", fr: "Ḥafṣ ʿan ʿĀṣim" };
const mp3quran = (path: string) => ({ name: { ar: "موقع MP3 Quran", en: "MP3 Quran" }, url: `https://mp3quran.net/${path}` });
const commons = (id: string, file: string, author: string, license: string) => ({
  src: `/reciters/${id}.jpg`,
  author,
  license,
  url: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replaceAll(" ", "_"))}`,
});

export const reciters: Reciter[] = [
  {
    id: "badr-al-turki",
    name: { ar: "بدر التركي", en: "Badr al-Turkī", fr: "Badr al-Turkī" },
    hue: 190,
    riwayah: hafs,
    item: "quran-badr-al-turki-hafs",
    // prettier-ignore
    seconds: [
      40, 7463, 4189, 4178, 3302, 3525, 3889, 1432, 3025, 2060, 2282, 2089, 937, 999, 792, 2020, 1810, 1699, 1099,
      1546, 1474, 1427, 1331, 1533, 996, 1449, 1345, 1630, 1092, 915, 564, 390, 1578, 905, 806, 861, 1103, 847, 1479,
      1512, 889, 976, 988, 397, 523, 725, 633, 634, 421, 480, 396, 382, 426, 395, 533, 468, 646, 503, 491, 411, 265,
      186, 202, 256, 325, 288, 338, 344, 317, 251, 250, 301, 216, 307, 205, 287, 236, 216, 220, 181, 130, 101, 205,
      115, 123, 70, 75, 104, 162, 88, 64, 91, 62, 38, 52, 93, 39, 107, 47, 68, 52, 46, 18, 45, 33, 29, 41, 16, 30,
      29, 30, 17, 26, 35,
    ],
    source: mp3quran("ar/bader"),
    photo: commons("badr-al-turki", "Photo of badr al-turki in 2023.jpg", "Abo.ibrahim0", "CC0"),
  },
  {
    id: "yasser-al-dosari",
    name: { ar: "ياسر الدوسري", en: "Yāsir al-Dawsarī", fr: "Yāsir al-Dawsarī" },
    hue: 35,
    riwayah: hafs,
    item: "quran-yasser-al-dosari-hafs",
    // prettier-ignore
    seconds: [
      48, 7247, 4374, 4422, 3420, 3623, 4260, 1302, 3122, 2179, 2362, 2132, 968, 1085, 817, 2100, 1802, 1744, 1138,
      1455, 1418, 1465, 1256, 1562, 1043, 1545, 1396, 1603, 1176, 957, 617, 495, 1527, 1047, 988, 916, 1024, 849,
      1385, 1438, 956, 973, 986, 427, 616, 755, 668, 656, 322, 483, 410, 361, 387, 403, 530, 533, 723, 542, 563, 433,
      254, 197, 211, 294, 350, 307, 383, 341, 414, 296, 265, 301, 224, 290, 199, 344, 240, 255, 221, 183, 124, 127,
      195, 119, 127, 71, 77, 106, 170, 88, 60, 88, 47, 27, 37, 69, 48, 122, 57, 48, 49, 42, 17, 41, 24, 20, 27, 13,
      36, 20, 24, 11, 21, 36,
    ],
    source: mp3quran("ar/yasser"),
    photo: commons("yasser-al-dosari", "Yasser Al-Dosari (cropped).jpg", "MAL MALDIVE", "CC BY-SA 4.0"),
  },
  {
    id: "saad-al-ghamdi",
    name: { ar: "سعد الغامدي", en: "Saʿd al-Ghāmidī", fr: "Saʿd al-Ghāmidī" },
    hue: 145,
    riwayah: hafs,
    item: "quran-saad-al-ghamdi-hafs",
    // prettier-ignore
    seconds: [
      48, 7056, 3937, 4389, 3019, 3336, 3856, 1356, 2935, 2122, 2159, 1937, 899, 1075, 838, 2052, 1742, 1758, 1058,
      1363, 1513, 1496, 1320, 1590, 1000, 1421, 1419, 1485, 1200, 890, 569, 430, 1537, 1019, 864, 791, 1070, 883,
      1415, 1337, 923, 928, 1003, 414, 542, 718, 593, 623, 391, 439, 417, 365, 432, 398, 513, 505, 677, 530, 504, 420,
      252, 192, 201, 272, 322, 293, 386, 359, 332, 281, 264, 306, 236, 301, 182, 287, 244, 241, 221, 187, 125, 103,
      228, 128, 139, 77, 82, 114, 173, 97, 72, 93, 54, 33, 49, 83, 38, 112, 49, 57, 51, 45, 22, 45, 33, 32, 41, 19,
      40, 28, 32, 18, 29, 36,
    ],
    source: mp3quran("ar/s_gmd"),
    photo: commons("saad-al-ghamdi", "Saad al Ghamdi.jpg", "الشيخ هيثم الدخين", "CC BY-SA 4.0"),
  },
  {
    id: "mishary-alafasy",
    name: { ar: "مشاري راشد العفاسي", en: "Mishārī Rāshid al-ʿAfāsī", fr: "Mishārī Rāshid al-ʿAfāsī" },
    hue: 330,
    riwayah: hafs,
    item: "quran-mishary-alafasy-hafs",
    // prettier-ignore
    seconds: [
      52, 7540, 4650, 4786, 3767, 4335, 4973, 1823, 3625, 2690, 2771, 2525, 1217, 1227, 955, 2529, 2114, 1996, 1283,
      1628, 1570, 1772, 1485, 1841, 1102, 1833, 1572, 1904, 1271, 1171, 715, 524, 1743, 1143, 1057, 1060, 1450, 1070,
      1630, 1568, 1160, 1170, 1228, 577, 649, 957, 738, 722, 501, 560, 545, 485, 461, 483, 679, 717, 809, 613, 627,
      451, 293, 214, 258, 325, 361, 358, 455, 456, 406, 318, 281, 335, 244, 324, 212, 315, 285, 292, 256, 220, 158,
      137, 310, 160, 198, 100, 108, 134, 213, 120, 84, 112, 65, 43, 65, 95, 45, 126, 60, 70, 63, 63, 27, 58, 49, 43,
      58, 25, 54, 35, 42, 22, 33, 50,
    ],
    source: mp3quran("ar/afs"),
    photo: commons("mishary-alafasy", "Мишари Рашид.jpg", "quranic.ru", "Copyrighted free use"),
  },
  {
    id: "muhammad-siddiq-al-minshawi",
    name: { ar: "محمد صديق المنشاوي", en: "Muḥammad Ṣiddīq al-Minshāwī", fr: "Muḥammad Ṣiddīq al-Minshāwī" },
    hue: 285,
    riwayah: hafs,
    item: "quran-muhammad-siddiq-al-minshawi-hafs",
    // prettier-ignore
    seconds: [
      52, 8217, 5207, 5170, 4036, 4002, 4370, 1783, 3249, 2604, 2877, 2701, 1154, 1118, 857, 2230, 1920, 2102, 1265,
      1627, 1720, 1658, 1414, 1752, 1082, 1617, 1468, 1775, 1244, 1033, 634, 448, 1657, 1079, 1000, 953, 1254, 999,
      1506, 1438, 971, 1013, 1024, 431, 582, 722, 645, 723, 469, 446, 438, 376, 417, 453, 532, 627, 854, 595, 571,
      470, 266, 209, 228, 286, 375, 367, 417, 428, 394, 330, 332, 377, 272, 374, 235, 399, 316, 316, 297, 236, 165,
      129, 284, 178, 179, 105, 116, 151, 228, 131, 99, 128, 70, 44, 56, 112, 49, 154, 62, 66, 63, 50, 27, 56, 38, 34,
      42, 21, 46, 33, 36, 19, 30, 38,
    ],
    source: mp3quran("ar/minsh"),
    photo: commons("muhammad-siddiq-al-minshawi", "Elminshwey.jpg", "Unknown author", "Public domain"),
  },
];

export function getReciter(id: string) {
  return reciters.find((r) => r.id === id);
}

export function surahAudioUrl(reciter: Reciter, n: number) {
  return `https://archive.org/download/${reciter.item}/${String(n).padStart(3, "0")}.mp3`;
}
