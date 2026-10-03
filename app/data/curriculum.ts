// The study programme "برنامج (علمي، عملي) مقترح لطلب العلم" by Abu Umar al-Utaybi
// (https://saaid.org/Minute/mm12.htm), transcribed as data.
//
// Shape: day → subject(s) → groups (levels 1–4, or named categories on Tuesday)
// → entries → books. An entry with several books means "read one of these"
// (the source's «أو»).

export type Localized = { ar: string; en: string; fr?: string };

export type Book = {
  id: string;
  title: Localized;
  author: Localized;
  /** Edition, attached commentary, or reading advice from the source. */
  note?: Localized;
};

export type Entry = { id: string; options: Book[] };

export type Group = {
  id: string;
  level?: 1 | 2 | 3 | 4;
  label?: Localized;
  entries: Entry[];
};

export type Subject = {
  id: string;
  name: Localized;
  hue: number;
  groups: Group[];
  /** Advice printed under the subject in the source. */
  tip?: Localized;
  /** «للاستزادة والاستفادة» — further reading, kept as the source's text. */
  further?: string[];
};

export type DayId = "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";

export type Day = {
  id: DayId;
  name: Localized;
  /** Two subjects alternate week by week (Mon, Wed, Fri). */
  subjects: string[];
};

const L = (ar: string, en: string, fr?: string): Localized => ({ ar, en, fr });

function book(
  id: string,
  title: [string, string],
  author: [string, string],
  note?: [string, string],
): Book {
  return {
    id,
    title: L(...title),
    author: L(...author),
    note: note && L(...note),
  };
}

let entrySeq = 0;
const entry = (...options: Book[]): Entry => ({
  id: `e${++entrySeq}`,
  options,
});

const level = (
  subjectId: string,
  n: 1 | 2 | 3 | 4,
  entries: Entry[],
): Group => ({ id: `${subjectId}-l${n}`, level: n, entries });

// Authors that recur across subjects.
const A = {
  ibnAbdilwahhab: ["محمد بن عبد الوهاب", "Muhammad ibn ʿAbd al-Wahhāb"],
  uthaymin: ["محمد بن صالح ابن عثيمين", "Muḥammad ibn al-ʿUthaymīn"],
  fawzan: ["صالح الفوزان", "Ṣāliḥ al-Fawzān"],
  saadi: ["عبد الرحمن السعدي", "ʿAbd al-Raḥmān al-Saʿdī"],
  ibnTaymiyyah: ["أحمد ابن تيمية", "Ibn Taymiyyah"],
  ibnQayyim: ["ابن القيم", "Ibn al-Qayyim"],
  albani: ["محمد ناصر الدين الألباني", "al-Albānī"],
  halabi: ["علي الحلبي", "ʿAlī al-Ḥalabī"],
  ibnHajar: ["ابن حجر العسقلاني", "Ibn Ḥajar al-ʿAsqalānī"],
  nawawi: ["يحيى بن شرف النووي", "al-Nawawī"],
  ibnQudamah: ["ابن قدامة", "Ibn Qudāmah"],
  bassam: ["عبد الله البسام", "ʿAbdullāh al-Bassām"],
  shinqiti: ["محمد الأمين الشنقيطي", "Muḥammad al-Amīn al-Shinqīṭī"],
  ibnHisham: ["ابن هشام الأنصاري", "Ibn Hishām al-Anṣārī"],
  ibnKathir: ["ابن كثير", "Ibn Kathīr"],
  ahmadFarid: ["أحمد فريد", "Aḥmad Farīd"],
  ibnJawzi: ["ابن الجوزي", "Ibn al-Jawzī"],
  ibnQutaybah: ["ابن قتيبة", "Ibn Qutaybah"],
  zaynu: ["محمد جميل زينو", "Muḥammad Jamīl Zaynū"],
  omariAkram: ["أكرم ضياء العمري", "Akram al-ʿUmarī"],
} satisfies Record<string, [string, string]>;

// ─── Saturday: Tawḥīd ───────────────────────────────────────────────────────

const aqeedah: Subject = {
  id: "aqeedah",
  name: L("التوحيد", "Tawḥīd (Creed)", "Tawḥīd (croyance)"),
  hue: 163,
  tip: L(
    "إذا أشكل عليك شيء في الأصول الثلاثة والأصول الستة فارجع إلى «شرح ثلاثة الأصول» لابن عثيمين و«شرح الأصول الستة» لعبيد الجابري.",
    "If anything in the Three or Six Principles is unclear, refer to Ibn al-ʿUthaymīn's commentary on the Three Principles and ʿUbayd al-Jābirī's on the Six Principles.",
  ),
  groups: [
    level("aqeedah", 1, [
      entry(book("usul-thalatha", ["الأصول الثلاثة", "al-Uṣūl al-Thalāthah"], A.ibnAbdilwahhab)),
      entry(book("qawaid-arbaa", ["القواعد الأربع", "al-Qawāʿid al-Arbaʿ"], A.ibnAbdilwahhab)),
      entry(book("usul-sittah", ["الأصول الستة", "al-Uṣūl al-Sittah"], A.ibnAbdilwahhab)),
      entry(
        book("arkan-iman-iaw", ["أركان الإيمان", "Arkān al-Īmān"], A.ibnAbdilwahhab),
        book("arkan-iman-uthaymin", ["أركان الإيمان", "Arkān al-Īmān"], A.uthaymin),
        book("arkan-iman-zaynu", ["أركان الإيمان", "Arkān al-Īmān"], A.zaynu),
      ),
    ]),
    level("aqeedah", 2, [
      entry(
        book("kitab-tawhid", ["كتاب التوحيد", "Kitāb al-Tawḥīd"], A.ibnAbdilwahhab, [
          "مع حاشيته «القول السديد» للسعدي",
          "With al-Saʿdī's notes «al-Qawl al-Sadīd»",
        ]),
      ),
      entry(
        book("kashf-shubuhat", ["كشف الشبهات", "Kashf al-Shubuhāt"], A.ibnAbdilwahhab, [
          "مع شرح ابن عثيمين",
          "With Ibn al-ʿUthaymīn's commentary",
        ]),
      ),
      entry(
        book(
          "200-sual",
          ["200 سؤال وجواب في العقيدة", "200 Questions & Answers on Creed"],
          ["حافظ الحكمي", "Ḥāfiẓ al-Ḥakamī"],
        ),
      ),
      entry(
        book("wasitiyyah", ["العقيدة الواسطية", "al-ʿAqīdah al-Wāsiṭiyyah"], A.ibnTaymiyyah, [
          "مع شرح الشيخ صالح الفوزان",
          "With Ṣāliḥ al-Fawzān's commentary",
        ]),
      ),
      entry(
        book("qawl-mufid", ["القول المفيد شرح كتاب التوحيد", "al-Qawl al-Mufīd"], A.uthaymin),
        book(
          "fath-majid",
          ["فتح المجيد", "Fatḥ al-Majīd"],
          ["عبد الرحمن بن حسن آل الشيخ", "ʿAbd al-Raḥmān ibn Ḥasan Āl al-Shaykh"],
          ["تحقيق د. الوليد آل فريان", "ed. al-Walīd Āl Furayyān"],
        ),
        book(
          "jadid-sharh-tawhid",
          ["الجديد شرح كتاب التوحيد", "al-Jadīd Sharḥ Kitāb al-Tawḥīd"],
          ["عبد الله القرعاوي", "ʿAbdullāh al-Qarʿāwī"],
        ),
      ),
      entry(
        book("sharh-wasitiyyah-uthaymin", ["شرح العقيدة الواسطية", "Sharḥ al-Wāsiṭiyyah"], A.uthaymin),
        book(
          "sharh-wasitiyyah-harras",
          ["شرح العقيدة الواسطية", "Sharḥ al-Wāsiṭiyyah"],
          ["محمد خليل هراس", "Muḥammad Khalīl Harrās"],
        ),
        book(
          "tanbihat-saniyyah",
          ["التنبيهات السنية", "al-Tanbīhāt al-Saniyyah"],
          ["عبد العزيز بن رشيد", "ʿAbd al-ʿAzīz ibn Rashīd"],
          [
            "وهو مهم، ثم «الكواشف الجلية» لعبد العزيز السلمان",
            "Important; then «al-Kawāshif al-Jaliyyah» by ʿAbd al-ʿAzīz al-Salmān",
          ],
        ),
      ),
      entry(
        book(
          "mukhtasar-itisam",
          ["مختصر كتاب الاعتصام للشاطبي", "Mukhtaṣar al-Iʿtiṣām"],
          ["علوي السقاف", "ʿAlawī al-Saqqāf"],
        ),
      ),
    ]),
    level("aqeedah", 3, [
      entry(
        book(
          "tahawiyyah",
          ["العقيدة الطحاوية", "al-ʿAqīdah al-Ṭaḥāwiyyah"],
          ["أبو جعفر الطحاوي", "Abū Jaʿfar al-Ṭaḥāwī"],
          ["مع شرح الشيخ الألباني", "With al-Albānī's commentary"],
        ),
      ),
      entry(
        book(
          "sharh-tahawiyyah",
          ["شرح العقيدة الطحاوية", "Sharḥ al-Ṭaḥāwiyyah"],
          ["ابن أبي العز الحنفي", "Ibn Abī al-ʿIzz al-Ḥanafī"],
          ["تحقيق التركي والأرناؤوط", "ed. al-Turkī & al-Arnaʾūṭ"],
        ),
      ),
      entry(
        book("kitab-iman", ["كتاب الإيمان", "Kitāb al-Īmān"], A.ibnTaymiyyah, [
          "تحقيق الشيخ الألباني",
          "ed. al-Albānī",
        ]),
      ),
      entry(
        book("tawassul-albani", ["التوسل أنواعه وأحكامه", "al-Tawassul: Its Types and Rulings"], A.albani),
        book(
          "tawassul-rifai",
          ["التوصل إلى حقيقة التوسل", "al-Tawaṣṣul ilā Ḥaqīqat al-Tawassul"],
          ["محمد نسيب الرفاعي", "Muḥammad Nasīb al-Rifāʿī"],
        ),
      ),
      entry(
        book(
          "qaidah-jalilah",
          ["قاعدة جليلة في التوسل والوسيلة", "Qāʿidah Jalīlah fī al-Tawassul"],
          A.ibnTaymiyyah,
          ["تحقيق الشيخ ربيع المدخلي", "ed. Rabīʿ al-Madkhalī"],
        ),
      ),
      entry(book("usul-bida", ["علم أصول البدع", "ʿIlm Uṣūl al-Bidaʿ"], A.halabi)),
    ]),
    level("aqeedah", 4, [
      entry(
        book(
          "taysir-aziz-hamid",
          ["تيسير العزيز الحميد", "Taysīr al-ʿAzīz al-Ḥamīd"],
          ["سليمان بن عبد الله آل الشيخ", "Sulaymān ibn ʿAbdullāh Āl al-Shaykh"],
        ),
      ),
      entry(
        book("tadmuriyyah", ["التدمرية", "al-Tadmuriyyah"], A.ibnTaymiyyah, [
          "مع شرحها «التحفة المهدية» لفالح بن مهدي",
          "With Fāliḥ ibn Mahdī's commentary «al-Tuḥfah al-Mahdiyyah»",
        ]),
      ),
      entry(
        book("hamawiyyah", ["الفتوى الحموية الكبرى", "al-Fatwā al-Ḥamawiyyah al-Kubrā"], A.ibnTaymiyyah),
      ),
      entry(book("mukhtasar-sawaiq", ["مختصر الصواعق المرسلة", "Mukhtaṣar al-Ṣawāʿiq"], A.ibnQayyim)),
      entry(
        book("itisam", ["كتاب الاعتصام", "Kitāb al-Iʿtiṣām"], ["أبو إسحاق الشاطبي", "Abū Isḥāq al-Shāṭibī"]),
      ),
    ]),
  ],
  further: [
    "مطالعة الأجزاء الأولى من «مجموع الفتاوى» لشيخ الإسلام ابن تيمية.",
    "كتب ابن القيم: «شفاء العليل»، «اجتماع الجيوش الإسلامية»، «الداء والدواء»، «بدائع الفوائد»، «الفوائد».",
    "كتب السنة لأئمة السلف: «السنة» للإمام أحمد، «السنة» للخلال، «شرح السنة» للبربهاري، «شرح أصول اعتقاد أهل السنة» للالكائي، «الإبانة الكبرى» لابن بطة، «خلق أفعال العباد» للبخاري، «العلو» للذهبي.",
    "كتب شيخ الإسلام المطولة: «درء تعارض العقل والنقل»، «منهاج السنة النبوية»، «نقض المنطق»، «الاستقامة».",
    "«الدرر السنية»، «فتاوى اللجنة الدائمة — قسم العقيدة»، «مجموع فتاوى ابن باز»، «القواعد المثلى» لابن عثيمين، «معارج القبول» لحافظ الحكمي.",
  ],
};

// ─── Sunday: Tafsīr ─────────────────────────────────────────────────────────

const tafsir: Subject = {
  id: "tafsir",
  name: L("التفسير وأصوله", "Tafsīr & its Principles", "Tafsīr et ses fondements"),
  hue: 200,
  groups: [
    level("tafsir", 1, [
      entry(
        book(
          "tafsir-muyassar",
          ["التفسير الميسر", "al-Tafsīr al-Muyassar"],
          ["مجمع الملك فهد", "King Fahd Complex"],
        ),
      ),
      entry(book("tafsir-saadi", ["تيسير الكريم الرحمن", "Taysīr al-Karīm al-Raḥmān"], A.saadi)),
    ]),
    level("tafsir", 2, [
      entry(
        book(
          "taysir-ali-qadir",
          ["تيسير العلي القدير لاختصار تفسير ابن كثير", "Taysīr al-ʿAliyy al-Qadīr"],
          ["محمد نسيب الرفاعي", "Muḥammad Nasīb al-Rifāʿī"],
        ),
      ),
      entry(book("kayfa-nafham", ["كيف نفهم القرآن", "How Do We Understand the Qurʾān"], A.zaynu)),
      entry(
        book(
          "zubdat-itqan",
          ["زبدة الإتقان في علوم القرآن", "Zubdat al-Itqān"],
          ["محمد عمر بازمول", "Muḥammad ʿUmar Bāzmūl"],
        ),
      ),
    ]),
    level("tafsir", 3, [
      entry(
        book("tafsir-baghawi", ["تفسير البغوي", "Tafsīr al-Baghawī"], ["البغوي", "al-Baghawī"], [
          "طبعة دار طيبة",
          "Dār Ṭaybah edition",
        ]),
        book(
          "mukhtasar-tabari",
          ["مختصر تفسير الطبري", "Mukhtaṣar Tafsīr al-Ṭabarī"],
          ["بشار عواد", "Bashshār ʿAwwād"],
        ),
      ),
      entry(
        book("muqaddimah-usul-tafsir", ["مقدمة في أصول التفسير", "Muqaddimah fī Uṣūl al-Tafsīr"], A.ibnTaymiyyah, [
          "مع شرح ابن عثيمين",
          "With Ibn al-ʿUthaymīn's commentary",
        ]),
      ),
      entry(book("qawaid-hisan", ["القواعد الحسان في تفسير القرآن", "al-Qawāʿid al-Ḥisān"], A.saadi)),
      entry(
        book("mabahith-qattan", ["مباحث في علوم القرآن", "Mabāḥith fī ʿUlūm al-Qurʾān"], ["مناع القطان", "Mannāʿ al-Qaṭṭān"]),
        book("itqan", ["الإتقان في علوم القرآن", "al-Itqān fī ʿUlūm al-Qurʾān"], ["السيوطي", "al-Suyūṭī"]),
        book("manahil-irfan", ["مناهل العرفان", "Manāhil al-ʿIrfān"], ["الزرقاني", "al-Zurqānī"]),
      ),
    ]),
    level("tafsir", 4, [
      entry(book("ahkam-quran-qurtubi", ["الجامع لأحكام القرآن", "al-Jāmiʿ li-Aḥkām al-Qurʾān"], ["القرطبي", "al-Qurṭubī"])),
      entry(
        book(
          "qawaid-tafsir-sabt",
          ["قواعد التفسير جمعًا ودراسة", "Qawāʿid al-Tafsīr"],
          ["خالد بن عثمان السبت", "Khālid al-Sabt"],
        ),
      ),
      entry(book("adwa-bayan", ["أضواء البيان", "Aḍwāʾ al-Bayān"], A.shinqiti)),
      entry(book("burhan-zarkashi", ["البرهان في علوم القرآن", "al-Burhān fī ʿUlūm al-Qurʾān"], ["الزركشي", "al-Zarkashī"])),
    ]),
  ],
  further: [
    "«تفسير ابن كثير»، «أحكام القرآن» لابن العربي، «أحكام القرآن» للجصاص، «فتح القدير» للشوكاني، «المحرر الوجيز» لابن عطية، «جامع البيان» للطبري، «بدائع التفسير» لابن القيم، «زاد المسير» لابن الجوزي، «الدر المنثور» للسيوطي.",
    "«التحرير والتنوير» لابن عاشور، «التفسير والمفسرون» للذهبي، «دفع إيهام الاضطراب» للشنقيطي.",
    "«الإيضاح لناسخ القرآن ومنسوخه» لمكي بن أبي طالب، «نواسخ القرآن» لابن الجوزي.",
  ],
};

// ─── Monday: Fiqh / Uṣūl al-Fiqh (alternating) ──────────────────────────────

const fiqh: Subject = {
  id: "fiqh",
  name: L("الفقه", "Fiqh (Jurisprudence)", "Fiqh (jurisprudence)"),
  hue: 85,
  groups: [
    level("fiqh", 1, [
      entry(
        book(
          "wajiz-fiqh",
          ["الوجيز في فقه السنة والكتاب العزيز", "al-Wajīz fī Fiqh al-Sunnah"],
          ["عبد العظيم بدوي", "ʿAbd al-ʿAẓīm Badawī"],
        ),
        book("manhaj-salikin", ["منهج السالكين", "Manhaj al-Sālikīn"], A.saadi),
      ),
      entry(book("mulakhkhas-fiqhi", ["الملخص الفقهي", "al-Mulakhkhaṣ al-Fiqhī"], A.fawzan)),
    ]),
    level("fiqh", 2, [
      entry(book("lubab", ["اللباب في فقه السنة والكتاب", "al-Lubāb"], ["صبحي حلاق", "Ṣubḥī Ḥallāq"])),
      entry(book("taysir-allam", ["تيسير العلام شرح عمدة الأحكام", "Taysīr al-ʿAllām"], A.bassam)),
      entry(
        book(
          "rawdah-nadiyyah",
          ["الروضة الندية شرح الدرر البهية", "al-Rawḍah al-Nadiyyah"],
          ["صديق حسن خان", "Ṣiddīq Ḥasan Khān"],
          ["مع تعليقات الشيخ الألباني", "With al-Albānī's notes"],
        ),
        book("salsabil", ["السلسبيل", "al-Salsabīl"], ["البليهي", "al-Bulayhī"]),
      ),
      entry(book("ijma", ["الإجماع", "al-Ijmāʿ"], ["ابن المنذر", "Ibn al-Mundhir"])),
    ]),
    level("fiqh", 3, [
      entry(
        book("tawdih-ahkam", ["توضيح الأحكام شرح بلوغ المرام", "Tawḍīḥ al-Aḥkām"], A.bassam),
        book("subul-salam", ["سبل السلام", "Subul al-Salām"], ["الصنعاني", "al-Ṣanʿānī"]),
      ),
      entry(
        book("fiqh-sunnah", ["فقه السنة", "Fiqh al-Sunnah"], ["سيد سابق", "Sayyid Sābiq"], [
          "مع «تمام المنة» للشيخ الألباني",
          "With al-Albānī's «Tamām al-Minnah»",
        ]),
      ),
      entry(
        book(
          "sharh-mukhtasar-khiraqi",
          ["شرح مختصر الخرقي", "Sharḥ Mukhtaṣar al-Khiraqī"],
          ["ابن البنا الحنبلي", "Ibn al-Bannāʾ al-Ḥanbalī"],
        ),
      ),
    ]),
    level("fiqh", 4, [
      entry(book("nayl-awtar", ["نيل الأوطار شرح منتقى الأخبار", "Nayl al-Awṭār"], ["الشوكاني", "al-Shawkānī"])),
      entry(
        book(
          "rawd-murbi",
          ["الروض المربع شرح زاد المستقنع", "al-Rawḍ al-Murbiʿ"],
          ["منصور البهوتي", "Manṣūr al-Buhūtī"],
          ["مع حاشية ابن قاسم", "With Ibn Qāsim's ḥāshiyah"],
        ),
      ),
    ]),
  ],
  further: [
    "الحنبلي: «المغني» لابن قدامة، «الإنصاف» للمرداوي، «المبدع» لابن مفلح.",
    "الشافعي: «الأم» للشافعي، «المجموع» للنووي، «روضة الطالبين» للنووي.",
    "المالكي: «المدونة» لسحنون، «التمهيد» و«الاستذكار» لابن عبد البر، «بداية المجتهد» لابن رشد.",
    "الحنفي: «شرح معاني الآثار» للطحاوي، «بدائع الصنائع» للكاساني، «فتح القدير» لابن الهمام.",
    "«المحلى» لابن حزم، «السنن الكبرى» للبيهقي، «فتح الباري» لابن حجر، ومجلدات الفقه من «مجموع الفتاوى».",
  ],
};

const usulFiqh: Subject = {
  id: "usul-fiqh",
  name: L("أصول الفقه وقواعده", "Uṣūl al-Fiqh & Legal Maxims", "Uṣūl al-fiqh et maximes"),
  hue: 55,
  groups: [
    level("usul-fiqh", 1, [
      entry(book("wadih-usul", ["الواضح في أصول الفقه", "al-Wāḍiḥ fī Uṣūl al-Fiqh"], ["عمر الأشقر", "ʿUmar al-Ashqar"])),
      entry(
        book(
          "taysir-usul-judai",
          ["تيسير أصول الفقه", "Taysīr Uṣūl al-Fiqh"],
          ["عبد الله بن يوسف الجديع", "ʿAbdullāh al-Judayʿ"],
        ),
      ),
    ]),
    level("usul-fiqh", 2, [
      entry(book("sharh-waraqat-fawzan", ["شرح الورقات", "Sharḥ al-Waraqāt"], A.fawzan)),
      entry(
        book("usul-min-ilm-usul", ["الأصول من علم الأصول", "al-Uṣūl min ʿIlm al-Uṣūl"], A.uthaymin, [
          "وهو في الواقع شرح مختصر للورقات",
          "Effectively a short commentary on al-Waraqāt",
        ]),
      ),
      entry(book("qawaid-usul-jamiah", ["القواعد والأصول الجامعة", "al-Qawāʿid wa-l-Uṣūl al-Jāmiʿah"], A.saadi)),
    ]),
    level("usul-fiqh", 3, [
      entry(book("mudhakkirah", ["مذكرة في أصول الفقه", "Mudhakkirah fī Uṣūl al-Fiqh"], A.shinqiti)),
      entry(book("qawati-adillah", ["قواطع الأدلة", "Qawāṭiʿ al-Adillah"], ["السمعاني", "al-Samʿānī"])),
      entry(book("wajiz-qawaid", ["الوجيز في القواعد الفقهية", "al-Wajīz fī al-Qawāʿid al-Fiqhiyyah"], ["البورنو", "al-Būrnū"])),
    ]),
    level("usul-fiqh", 4, [
      entry(
        book("rawdat-nazir", ["روضة الناظر", "Rawḍat al-Nāẓir"], A.ibnQudamah, [
          "تحقيق د. عبد الكريم النملة",
          "ed. ʿAbd al-Karīm al-Namlah",
        ]),
      ),
      entry(book("nathr-wurud", ["نثر الورود شرح مراقي السعود", "Nathr al-Wurūd"], A.shinqiti)),
      entry(book("sharh-kawkab", ["شرح الكوكب المنير", "Sharḥ al-Kawkab al-Munīr"], ["ابن النجار", "Ibn al-Najjār"])),
      entry(book("qawaid-ibn-rajab", ["القواعد", "al-Qawāʿid"], ["ابن رجب", "Ibn Rajab"])),
    ]),
  ],
  further: [
    "«إعلام الموقعين» لابن القيم، «الإحكام» لابن حزم، «المسودة» لآل تيمية، «إرشاد الفحول» للشوكاني.",
    "«الإحكام» للآمدي، «المحصول» للرازي، «المستصفى» للغزالي.",
    "«موسوعة القواعد الفقهية» للبورنو، «القواعد الفقهية» لمصطفى الزرقا، و«القواعد الفقهية» لصالح السدلان.",
  ],
};

// ─── Tuesday: open programme ────────────────────────────────────────────────

const openProgramme: Subject = {
  id: "open",
  name: L("برنامج متنوع ومفتوح", "Open Reading", "Lecture libre"),
  hue: 330,
  groups: [
    {
      id: "open-raqaiq",
      label: L("كتب الرقائق", "Heart-softeners (Raqāʾiq)", "Raqāʾiq"),
      entries: [
        entry(book("sahih-targhib", ["صحيح الترغيب والترهيب", "Ṣaḥīḥ al-Targhīb wa-l-Tarhīb"], A.albani)),
        entry(book("mukhtasar-minhaj", ["مختصر منهاج القاصدين", "Mukhtaṣar Minhāj al-Qāṣidīn"], A.ibnQudamah)),
        entry(book("riyad-salihin", ["رياض الصالحين", "Riyāḍ al-Ṣāliḥīn"], A.nawawi)),
        entry(book("yawm-akhir", ["اليوم الآخر", "The Last Day"], ["عمر الأشقر", "ʿUmar al-Ashqar"])),
        entry(book("bahr-raiq", ["البحر الرائق في الزهد والرقائق", "al-Baḥr al-Rāʾiq"], A.ahmadFarid)),
        entry(book("tazkiyat-nufus", ["تزكية النفوس", "Tazkiyat al-Nufūs"], A.ahmadFarid)),
        entry(book("kitab-aqibah", ["كتاب العاقبة", "Kitāb al-ʿĀqibah"], ["عبد الحق الإشبيلي", "ʿAbd al-Ḥaqq al-Ishbīlī"])),
        entry(book("mawarid-aman", ["موارد الأمان المنتقى من إغاثة اللهفان", "Mawārid al-Amān"], A.halabi)),
        entry(book("riqqah-buka", ["الرقة والبكاء", "al-Riqqah wa-l-Bukāʾ"], A.ibnQudamah)),
        entry(book("muntaqa-talbis", ["المنتقى النفيس من تلبيس إبليس", "al-Muntaqā al-Nafīs"], A.halabi)),
        entry(book("hadi-arwah", ["حادي الأرواح إلى بلاد الأفراح", "Ḥādī al-Arwāḥ"], A.ibnQayyim)),
      ],
    },
    {
      id: "open-fawaid",
      label: L("كتب الفوائد واللطائف", "Benefits & Insights", "Bienfaits et finesses"),
      entries: [
        entry(book("fawaid", ["الفوائد", "al-Fawāʾid"], A.ibnQayyim)),
        entry(book("badai-fawaid", ["بدائع الفوائد", "Badāʾiʿ al-Fawāʾid"], A.ibnQayyim)),
        entry(book("sayd-khatir", ["صيد الخاطر", "Ṣayd al-Khāṭir"], A.ibnJawzi)),
        entry(book("mudhish", ["المدهش", "al-Mudhish"], A.ibnJawzi)),
        entry(book("maarif", ["المعارف", "al-Maʿārif"], A.ibnQutaybah)),
        entry(book("uyun-akhbar", ["عيون الأخبار", "ʿUyūn al-Akhbār"], A.ibnQutaybah)),
        entry(book("muntaqa-uns", ["المنتقى من أنس المجالس", "al-Muntaqā min Uns al-Majālis"], ["ابن عبد البر", "Ibn ʿAbd al-Barr"])),
        entry(book("miftah-dar-saadah", ["مفتاح دار السعادة", "Miftāḥ Dār al-Saʿādah"], A.ibnQayyim)),
      ],
    },
    {
      id: "open-adab",
      label: L("كتب الآداب", "Manners (Ādāb)", "Bienséances (Ādāb)"),
      entries: [
        entry(book("adab-shariyyah", ["الآداب الشرعية", "al-Ādāb al-Sharʿiyyah"], ["ابن مفلح", "Ibn Mufliḥ"])),
        entry(book("ghidha-albab", ["غذاء الألباب شرح منظومة الآداب", "Ghidhāʾ al-Albāb"], ["السفاريني", "al-Saffārīnī"])),
        entry(book("adab-dunya-din", ["أدب الدنيا والدين", "Adab al-Dunyā wa-l-Dīn"], ["الماوردي", "al-Māwardī"])),
        entry(
          book(
            "mukhtasar-jami-bayan",
            ["مختصر جامع بيان العلم وفضله", "Mukhtaṣar Jāmiʿ Bayān al-ʿIlm"],
            ["أبو الأشبال الزهيري", "Abū al-Ashbāl al-Zuhayrī"],
          ),
        ),
        entry(book("adab-talab", ["أدب الطلب", "Adab al-Ṭalab"], ["الشوكاني", "al-Shawkānī"])),
        entry(book("uluw-himmah", ["علو الهمة", "ʿUluww al-Himmah"], ["محمد بن إبراهيم الحمد", "Muḥammad al-Ḥamad"])),
        entry(book("salah-ummah", ["صلاح الأمة في علو الهمة", "Ṣalāḥ al-Ummah"], ["سيد العفاني", "Sayyid al-ʿAffānī"])),
      ],
    },
  ],
};

// ─── Wednesday: Ḥadīth / Muṣṭalaḥ (alternating) ─────────────────────────────

const hadith: Subject = {
  id: "hadith",
  name: L("الحديث", "Ḥadīth", "Ḥadīth"),
  hue: 30,
  tip: L(
    "القراءة في كتب الحديث المسندة تكون للسند والمتن دون شروحها، وإنما يرجع للشرح عند وقوع الإشكال، حتى يتعود الطالب على منهج الأئمة المتقدمين.",
    "Read the ḥadīth collections for chain and text without their long commentaries; consult a commentary only when something is unclear. It trains you in the method of the early imams.",
  ),
  groups: [
    level("hadith", 1, [
      entry(book("arbain-nawawi", ["الأربعون النووية", "al-Arbaʿūn al-Nawawiyyah"], A.nawawi)),
      entry(book("umdat-ahkam", ["عمدة الأحكام", "ʿUmdat al-Aḥkām"], ["عبد الغني المقدسي", "ʿAbd al-Ghanī al-Maqdisī"])),
    ]),
    level("hadith", 2, [
      entry(
        book("bulugh-maram", ["بلوغ المرام", "Bulūgh al-Marām"], A.ibnHajar),
        book("muharrar", ["المحرر في الحديث", "al-Muḥarrar fī al-Ḥadīth"], ["ابن عبد الهادي", "Ibn ʿAbd al-Hādī"]),
      ),
      entry(
        book("mukhtasar-bukhari-zabidi", ["مختصر صحيح البخاري", "Mukhtaṣar Ṣaḥīḥ al-Bukhārī"], ["الزبيدي", "al-Zabīdī"]),
        book("mukhtasar-bukhari-albani", ["مختصر صحيح البخاري", "Mukhtaṣar Ṣaḥīḥ al-Bukhārī"], A.albani),
      ),
      entry(
        book("mukhtasar-muslim", ["مختصر صحيح مسلم", "Mukhtaṣar Ṣaḥīḥ Muslim"], ["المنذري", "al-Mundhirī"], [
          "تحقيق الشيخ الألباني",
          "ed. al-Albānī",
        ]),
      ),
    ]),
    level("hadith", 3, [
      entry(
        book("sahih-bukhari", ["صحيح البخاري", "Ṣaḥīḥ al-Bukhārī"], ["الإمام البخاري", "al-Bukhārī"], [
          "مع الاستفادة من «فتح الباري»",
          "Using «Fatḥ al-Bārī» as a reference",
        ]),
      ),
      entry(
        book("sahih-muslim", ["صحيح مسلم", "Ṣaḥīḥ Muslim"], ["الإمام مسلم", "Muslim"], [
          "مع الاستفادة من شرح النووي",
          "Using al-Nawawī's commentary as a reference",
        ]),
      ),
    ]),
    level("hadith", 4, [
      entry(
        book("sunan-abi-dawud", ["سنن أبي داود", "Sunan Abī Dāwūd"], ["أبو داود", "Abū Dāwūd"], [
          "مع «عون المعبود» ومراجعة «صحيح سنن أبي داود»",
          "With «ʿAwn al-Maʿbūd» and al-Albānī's grading",
        ]),
      ),
      entry(
        book("sunan-tirmidhi", ["سنن الترمذي", "Sunan al-Tirmidhī"], ["الترمذي", "al-Tirmidhī"], [
          "مع «تحفة الأحوذي»",
          "With «Tuḥfat al-Aḥwadhī»",
        ]),
      ),
      entry(
        book("sunan-nasai", ["سنن النسائي", "Sunan al-Nasāʾī"], ["النسائي", "al-Nasāʾī"], [
          "مع شرح السيوطي وحاشية السندي",
          "With al-Suyūṭī's commentary and al-Sindī's notes",
        ]),
      ),
      entry(
        book("sunan-ibn-majah", ["سنن ابن ماجه", "Sunan Ibn Mājah"], ["ابن ماجه", "Ibn Mājah"], [
          "مع حاشية السندي",
          "With al-Sindī's notes",
        ]),
      ),
    ]),
  ],
  further: [
    "«صحيح ابن خزيمة»، «صحيح ابن حبان»، «المستدرك» للحاكم، «السلسلة الصحيحة» و«صحيح الجامع» للألباني.",
    "«الموطأ» للإمام مالك، «مصنف ابن أبي شيبة»، «مصنف عبد الرزاق»، «المنتقى» لابن الجارود.",
    "«مسند الإمام أحمد»، «مسند البزار»، معاجم الطبراني الثلاثة.",
    "«جامع الأصول» لابن الأثير، «مجمع الزوائد» للهيثمي.",
  ],
};

const mustalah: Subject = {
  id: "mustalah",
  name: L("مصطلح الحديث", "Muṣṭalaḥ al-Ḥadīth", "Terminologie du ḥadīth"),
  hue: 15,
  groups: [
    level("mustalah", 1, [
      entry(
        book(
          "asilah-mustalah",
          ["أسئلة وأجوبة في مصطلح الحديث", "Q&A on Ḥadīth Terminology"],
          ["مصطفى العدوي", "Muṣṭafā al-ʿAdawī"],
        ),
      ),
      entry(
        book("zubdah-mustalah", ["الزبدة في مصطلح الحديث", "al-Zubdah fī Muṣṭalaḥ al-Ḥadīth"], ["—", "—"]),
        book("mustalah-uthaymin", ["مصطلح الحديث", "Muṣṭalaḥ al-Ḥadīth"], A.uthaymin),
      ),
    ]),
    level("mustalah", 2, [
      entry(book("taysir-mustalah", ["تيسير مصطلح الحديث", "Taysīr Muṣṭalaḥ al-Ḥadīth"], ["محمود الطحان", "Maḥmūd al-Ṭaḥḥān"])),
      entry(
        book(
          "bayquniyyah",
          ["التحفة السنية شرح المنظومة البيقونية", "al-Tuḥfah al-Saniyyah (al-Bayqūniyyah)"],
          ["حسن المشاط", "Ḥasan al-Mashshāṭ"],
        ),
        book("tawdih-abhar", ["التوضيح الأبهر", "al-Tawḍīḥ al-Abhar"], ["السخاوي", "al-Sakhāwī"]),
      ),
    ]),
    level("mustalah", 3, [
      entry(
        book("nuzhat-nazar", ["نزهة النظر شرح نخبة الفكر", "Nuzhat al-Naẓar"], A.ibnHajar, [
          "مع النكت عليها لعلي الحلبي",
          "With ʿAlī al-Ḥalabī's notes",
        ]),
      ),
      entry(
        book("baith-hathith", ["الباعث الحثيث", "al-Bāʿith al-Ḥathīth"], A.ibnKathir, [
          "تحقيق علي الحلبي",
          "ed. ʿAlī al-Ḥalabī",
        ]),
        book("muqni", ["المقنع في علوم الحديث", "al-Muqniʿ fī ʿUlūm al-Ḥadīth"], ["ابن الملقن", "Ibn al-Mulaqqin"]),
      ),
    ]),
    level("mustalah", 4, [
      entry(book("tadrib-rawi", ["تدريب الراوي", "Tadrīb al-Rāwī"], ["السيوطي", "al-Suyūṭī"])),
      entry(book("nukat-ibn-salah", ["النكت على كتاب ابن الصلاح", "al-Nukat ʿalā Ibn al-Ṣalāḥ"], A.ibnHajar)),
      entry(book("fath-mughith", ["فتح المغيث", "Fatḥ al-Mughīth"], ["السخاوي", "al-Sakhāwī"])),
    ]),
  ],
  further: [
    "«المحدث الفاصل» للرامهرمزي، «معرفة علوم الحديث» للحاكم، «علوم الحديث» لابن الصلاح، «شرح علل الترمذي» لابن رجب، «الجامع لأخلاق الراوي» للخطيب.",
    "كتب الرجال: «الجرح والتعديل»، «التاريخ الكبير»، «تهذيب الكمال» وفروعه، «ميزان الاعتدال»، «سير أعلام النبلاء».",
    "كتب التخريج: «نصب الراية»، «التلخيص الحبير»، «إرواء الغليل»، «البدر المنير».",
  ],
};

// ─── Thursday: Sīrah & History ──────────────────────────────────────────────

const sirah: Subject = {
  id: "sirah",
  name: L("السيرة والتاريخ", "Sīrah & History", "Sīrah et histoire"),
  hue: 285,
  groups: [
    level("sirah", 1, [
      entry(
        book(
          "rawdat-anwar",
          ["روضة الأنوار في سيرة النبي المختار", "Rawḍat al-Anwār"],
          ["صفي الرحمن المباركفوري", "al-Mubārakfūrī"],
        ),
      ),
      entry(
        book(
          "maghazi-bukhari",
          ["كتاب المغازي من صحيح البخاري", "Kitāb al-Maghāzī (Ṣaḥīḥ al-Bukhārī)"],
          ["الإمام البخاري", "al-Bukhārī"],
          ["مع مطالعة شرحه من «فتح الباري»", "With its commentary in «Fatḥ al-Bārī»"],
        ),
      ),
    ]),
    level("sirah", 2, [
      entry(
        book("sirah-sahihah-omari", ["السيرة النبوية الصحيحة", "al-Sīrah al-Nabawiyyah al-Ṣaḥīḥah"], A.omariAkram),
        book("sahih-sirah-ali", ["صحيح السيرة النبوية", "Ṣaḥīḥ al-Sīrah al-Nabawiyyah"], ["إبراهيم العلي", "Ibrāhīm al-ʿAlī"]),
      ),
      entry(book("asr-khilafah", ["عصر الخلافة الراشدة", "ʿAṣr al-Khilāfah al-Rāshidah"], A.omariAkram)),
      entry(
        book(
          "futuhat",
          ["الفتوحات الإسلامية عبر العصور", "Islamic Conquests Through the Ages"],
          ["عبد العزيز العمري", "ʿAbd al-ʿAzīz al-ʿUmarī"],
        ),
      ),
    ]),
    level("sirah", 3, [
      entry(
        book(
          "sirah-masadir",
          ["السيرة النبوية في ضوء المصادر الأصلية", "The Sīrah in Light of the Original Sources"],
          ["مهدي رزق الله", "Mahdī Rizq Allāh"],
        ),
      ),
      entry(
        book("shamail", ["الشمائل المحمدية", "al-Shamāʾil al-Muḥammadiyyah"], ["الترمذي", "al-Tirmidhī"], [
          "مع مختصره للشيخ الألباني",
          "With al-Albānī's abridgement",
        ]),
        book("anwar-shamail", ["الأنوار في شمائل النبي المختار", "al-Anwār fī Shamāʾil al-Nabī"], ["البغوي", "al-Baghawī"]),
      ),
      entry(book("wajiz-tarikh", ["الوجيز في تاريخ المسلمين", "al-Wajīz fī Tārīkh al-Muslimīn"], ["—", "—"])),
      entry(
        book(
          "nuzhat-fudala",
          ["نزهة الفضلاء تهذيب سير أعلام النبلاء", "Nuzhat al-Fuḍalāʾ"],
          ["محمد حسن عقيل موسى", "Muḥammad Ḥasan ʿAqīl Mūsā"],
        ),
      ),
    ]),
    level("sirah", 4, [
      entry(book("tarikh-islam-dhahabi", ["تاريخ الإسلام", "Tārīkh al-Islām"], ["الذهبي", "al-Dhahabī"])),
      entry(book("bidayah-nihayah", ["البداية والنهاية", "al-Bidāyah wa-l-Nihāyah"], A.ibnKathir)),
      entry(
        book("huquq-nabi", ["حقوق النبي ﷺ", "The Rights of the Prophet ﷺ"], ["محمد خليفة التميمي", "Muḥammad Khalīfah al-Tamīmī"]),
      ),
      entry(book("tarikh-islam-shakir", ["التاريخ الإسلامي", "al-Tārīkh al-Islāmī"], ["محمود شاكر", "Maḥmūd Shākir"])),
    ]),
  ],
  further: [
    "السيرة: «سيرة ابن هشام»، «الروض الأنف» للسهيلي، «زاد المعاد» لابن القيم.",
    "التاريخ: «تاريخ الطبري»، «تاريخ الخلفاء» للسيوطي، «المنتظم» لابن الجوزي، «شذرات الذهب» لابن العماد.",
    "التراجم: «الإصابة» لابن حجر، «أسد الغابة» لابن الأثير، «الاستيعاب» لابن عبد البر، «سير أعلام النبلاء» للذهبي، «الأعلام» للزركلي.",
  ],
};

// ─── Friday: Tajwīd / Naḥw (alternating) ────────────────────────────────────

const tajweed: Subject = {
  id: "tajweed",
  name: L("التجويد", "Tajwīd", "Tajwīd"),
  hue: 235,
  groups: [
    level("tajweed", 1, [
      entry(
        book("khulasah-tajwid", ["الخلاصة من أحكام التجويد", "al-Khulāṣah min Aḥkām al-Tajwīd"], ["خميس العمري", "Khamīs al-ʿUmarī"]),
      ),
      entry(
        book("tajwid-muyassar", ["التجويد الميسر", "al-Tajwīd al-Muyassar"], ["عبد العزيز القاري", "ʿAbd al-ʿAzīz al-Qāriʾ"]),
        book("burhan-tajwid", ["البرهان في تجويد القرآن", "al-Burhān fī Tajwīd al-Qurʾān"], ["القمحاوي", "al-Qamḥāwī"]),
      ),
      entry(book("tibyan-adab", ["التبيان في آداب حملة القرآن", "al-Tibyān fī Ādāb Ḥamalat al-Qurʾān"], A.nawawi)),
    ]),
    level("tajweed", 2, [
      entry(
        book("ghayat-murid", ["غاية المريد في علم التجويد", "Ghāyat al-Murīd"], ["عطية قابل نصر", "ʿAṭiyyah Naṣr"]),
        book("mulakhkhas-mufid", ["الملخص المفيد في علم التجويد", "al-Mulakhkhaṣ al-Mufīd"], ["محمد أحمد معبد", "Muḥammad Maʿbad"]),
      ),
      entry(
        book("ahkam-tajwid-fadail", ["أحكام التجويد وفضائل القرآن", "Aḥkām al-Tajwīd"], ["محمد عبد العليم", "Muḥammad ʿAbd al-ʿAlīm"]),
      ),
      entry(
        book("tamhid-jazari", ["التمهيد في علم التجويد", "al-Tamhīd fī ʿIlm al-Tajwīd"], ["ابن الجزري", "Ibn al-Jazarī"]),
        book("fath-aqfal", ["فتح الأقفال شرح تحفة الأطفال", "Fatḥ al-Aqfāl (Tuḥfat al-Aṭfāl)"], ["سليمان الجمزوري", "Sulaymān al-Jamzūrī"]),
      ),
    ]),
    level("tajweed", 3, [
      entry(book("haqq-tilawah", ["حق التلاوة", "Ḥaqq al-Tilāwah"], ["حسني شيخ عثمان", "Ḥusnī Shaykh ʿUthmān"])),
      entry(
        book("ahkam-qiraah-husari", ["أحكام قراءة القرآن", "Aḥkām Qirāʾat al-Qurʾān"], ["محمود خليل الحصري", "Maḥmūd Khalīl al-Ḥuṣarī"]),
        book("umdat-bayan", ["عمدة البيان في تجويد القرآن", "ʿUmdat al-Bayān"], ["صابر حسن أبو سليمان", "Ṣābir Abū Sulaymān"]),
      ),
    ]),
    level("tajweed", 4, [
      entry(book("tabyin-daryan", ["التبيين في أحكام تلاوة الكتاب المبين", "al-Tabyīn"], ["عبد اللطيف دريان", "ʿAbd al-Laṭīf Daryān"])),
      entry(
        book("hidayat-qari", ["هداية القاري إلى تجويد كلام الباري", "Hidāyat al-Qārī"], ["عبد الفتاح المرصفي", "ʿAbd al-Fattāḥ al-Marṣafī"], [
          "وهو من أجمع الكتب وأبدعها",
          "Among the most comprehensive books in the field",
        ]),
      ),
    ]),
  ],
  further: [
    "«التمهيد في معرفة التجويد» للحسن العطار، «المنح الفكرية على متن الجزرية» لملا علي القاري، «النبع الريان في تجويد كلام الرحمن».",
  ],
};

const nahw: Subject = {
  id: "nahw",
  name: L("النحو والصرف", "Naḥw & Ṣarf (Arabic Grammar)", "Naḥw et ṣarf (grammaire)"),
  hue: 135,
  groups: [
    level("nahw", 1, [
      entry(
        book("ajurrumiyyah", ["الآجرومية", "al-Ājurrūmiyyah"], ["ابن آجروم", "Ibn Ājurrūm"], [
          "مع شرحها «التحفة السنية» لمحمد محيي الدين عبد الحميد",
          "With Muḥyī al-Dīn ʿAbd al-Ḥamīd's commentary «al-Tuḥfah al-Saniyyah»",
        ]),
      ),
      entry(book("mulhat-irab", ["ملحة الإعراب", "Mulḥat al-Iʿrāb"], ["الحريري", "al-Ḥarīrī"], ["مع شرحها له", "With the author's own commentary"])),
    ]),
    level("nahw", 2, [
      entry(
        book("mujaz-nahw", ["الموجز في النحو", "al-Mūjaz fī al-Naḥw"], ["ابن السراج", "Ibn al-Sarrāj"]),
        book("nahw-wafi", ["النحو الوافي", "al-Naḥw al-Wāfī"], ["عباس حسن", "ʿAbbās Ḥasan"]),
      ),
      entry(
        book("qatr-nada", ["قطر الندى وبل الصدى", "Qaṭr al-Nadā"], A.ibnHisham, ["مع شرحه له", "With the author's own commentary"]),
        book("mukhtasar-nahw", ["مختصر النحو", "Mukhtaṣar al-Naḥw"], ["عبد الهادي الفضلي", "ʿAbd al-Hādī al-Faḍlī"]),
        book("nahw-wadih", ["النحو الواضح", "al-Naḥw al-Wāḍiḥ"], ["علي الجارم ومصطفى أمين", "ʿAlī al-Jārim & Muṣṭafā Amīn"]),
      ),
    ]),
    level("nahw", 3, [
      entry(
        book("shudhur-dhahab", ["شذور الذهب", "Shudhūr al-Dhahab"], A.ibnHisham, ["مع شرحه له", "With the author's own commentary"]),
        book("tadhkirah-qawaid", ["التذكرة في قواعد اللغة العربية", "al-Tadhkirah"], ["محمد خليل باشا", "Muḥammad Khalīl Bāshā"]),
      ),
      entry(
        book("alfiyyah", ["ألفية ابن مالك", "Alfiyyat Ibn Mālik"], ["ابن مالك", "Ibn Mālik"], [
          "مع شرح ابن عقيل",
          "With Ibn ʿAqīl's commentary",
        ]),
      ),
    ]),
    level("nahw", 4, [
      entry(book("jami-durus", ["جامع الدروس العربية", "Jāmiʿ al-Durūs al-ʿArabiyyah"], ["مصطفى الغلاييني", "Muṣṭafā al-Ghalāyīnī"])),
      entry(
        book("awdah-masalik", ["أوضح المسالك", "Awḍaḥ al-Masālik"], A.ibnHisham, [
          "مع شرحه «ضياء السالك» للنجار",
          "With al-Najjār's commentary «Ḍiyāʾ al-Sālik»",
        ]),
      ),
      entry(
        book("sharh-ashmuni", ["شرح الأشموني على الألفية", "Sharḥ al-Ashmūnī"], ["علي الأشموني", "ʿAlī al-Ashmūnī"], [
          "مع حاشية الصبان",
          "With al-Ṣabbān's ḥāshiyah",
        ]),
      ),
    ]),
  ],
  further: [
    "النحو: «الكتاب» لسيبويه، «التصريح على التوضيح» لخالد الأزهري، «شرح ابن يعيش على المفصل»، «مغني اللبيب» لابن هشام.",
    "الصرف: «تصريف الأسماء» للطنطاوي، «المغني في تصريف الأفعال» لعضيمة، «الممتع في التصريف» لابن عصفور.",
    "البلاغة: «البلاغة الواضحة»، «علوم البلاغة» للمراغي. اللغة: «مقاييس اللغة» لابن فارس، «لسان العرب»، «القاموس المحيط».",
  ],
};

// ─── Assembly ───────────────────────────────────────────────────────────────

export const subjects: Subject[] = [
  aqeedah,
  tafsir,
  fiqh,
  usulFiqh,
  openProgramme,
  hadith,
  mustalah,
  sirah,
  tajweed,
  nahw,
];

/** Week starts on Saturday, as in the source. */
export const days: Day[] = [
  { id: "sat", name: L("السبت", "Saturday", "Samedi"), subjects: ["aqeedah"] },
  { id: "sun", name: L("الأحد", "Sunday", "Dimanche"), subjects: ["tafsir"] },
  { id: "mon", name: L("الإثنين", "Monday", "Lundi"), subjects: ["fiqh", "usul-fiqh"] },
  { id: "tue", name: L("الثلاثاء", "Tuesday", "Mardi"), subjects: ["open"] },
  { id: "wed", name: L("الأربعاء", "Wednesday", "Mercredi"), subjects: ["hadith", "mustalah"] },
  { id: "thu", name: L("الخميس", "Thursday", "Jeudi"), subjects: ["sirah"] },
  { id: "fri", name: L("الجمعة", "Friday", "Vendredi"), subjects: ["tajweed", "nahw"] },
];

/** The author's suggested order for which science to focus on first. */
export const suggestedOrder: string[] = [
  "aqeedah",
  "fiqh",
  "hadith",
  "tafsir",
  "sirah",
  "nahw",
];

export const dailyProgramme = [
  {
    id: "juz",
    title: L("قراءة جزء من القرآن", "Recite one juzʾ of the Qurʾān", "Réciter un juzʾ du Coran"),
    detail: L(
      "دفعة واحدة أو على فترات خلال اليوم",
      "In one sitting or spread through the day",
      "En une fois ou réparti dans la journée",
    ),
  },
  {
    id: "hifz",
    title: L("حفظ خمسة أسطر على الأقل", "Memorise at least five lines", "Mémoriser au moins cinq lignes"),
    detail: L(
      "ويجب أن يشتمل السطر الأخير على رأس آية",
      "The last line should end on the end of a verse",
      "La dernière ligne doit finir sur une fin de verset",
    ),
  },
  {
    id: "lulu",
    title: L(
      "خمس صفحات من «اللؤلؤ والمرجان»",
      "Five pages of «al-Luʾluʾ wa-l-Marjān»",
      "Cinq pages de «al-Luʾluʾ wa-l-Marjān»",
    ),
    detail: L(
      "فيما اتفق عليه الشيخان — محمد فؤاد عبد الباقي",
      "Ḥadīth agreed upon by al-Bukhārī and Muslim — M. Fuʾād ʿAbd al-Bāqī",
      "Ḥadīth rapportés par al-Bukhārī et Muslim — M. Fuʾād ʿAbd al-Bāqī",
    ),
  },
] as const;

// ─── Lookups ────────────────────────────────────────────────────────────────

export type BookLocation = {
  book: Book;
  subject: Subject;
  group: Group;
  entry: Entry;
  day: Day;
};

const bookIndex = new Map<string, BookLocation>();
for (const subject of subjects) {
  const day = days.find((d) => d.subjects.includes(subject.id))!;
  for (const group of subject.groups) {
    for (const e of group.entries) {
      for (const b of e.options) {
        if (bookIndex.has(b.id)) throw new Error(`Duplicate book id: ${b.id}`);
        bookIndex.set(b.id, { book: b, subject, group, entry: e, day });
      }
    }
  }
}

export function getSubject(id: string) {
  return subjects.find((s) => s.id === id);
}

export function getBook(id: string) {
  return bookIndex.get(id);
}

export function getDayOfSubject(subjectId: string) {
  return days.find((d) => d.subjects.includes(subjectId))!;
}

export function countBooks(subject: Subject) {
  // An entry with alternatives counts once — the student reads one of them.
  return subject.groups.reduce((n, g) => n + g.entries.length, 0);
}
