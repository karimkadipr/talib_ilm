import type { Grading } from "./adhkar";
import type { Localized } from "./curriculum";

// Where each morning and evening dhikr comes from and how the scholars graded it, shown behind the
// source button on its card. Rulings are as recorded in the dorar.net hadith encyclopedia and the
// books it cites (checked October 2026). Each entry of adhkar-texts.json names its grading by key.

const L = (ar: string, en: string): Localized => ({ ar, en });

const S = {
  albani: L("الألباني", "al-Albānī"),
  ibnBaz: L("ابن باز", "Ibn Bāz"),
  ibnHajar: L("ابن حجر", "Ibn Ḥajar"),
  nawawi: L("النووي", "al-Nawawī"),
  arnaut: L("شعيب الأرناؤوط", "Shuʿayb al-Arnaʾūṭ"),
  mundhiri: L("المنذري", "al-Mundhirī"),
  haythami: L("الهيثمي", "al-Haythamī"),
  tirmidhi: L("الترمذي", "al-Tirmidhī"),
  ibnQayyim: L("ابن القيم", "Ibn al-Qayyim"),
  iraqi: L("العراقي", "al-ʿIrāqī"),
  shakir: L("أحمد شاكر", "Aḥmad Shākir"),
  dimyati: L("الدمياطي", "al-Dimyāṭī"),
  uthaymin: L("ابن عثيمين", "Ibn ʿUthaymīn"),
  hakim: L("الحاكم", "al-Ḥākim"),
  ibnJawzi: L("ابن الجوزي", "Ibn al-Jawzī"),
  bukhari: L("البخاري", "al-Bukhārī"),
  muslim: L("مسلم", "Muslim"),
  bukhariMuslim: L("البخاري ومسلم", "al-Bukhārī & Muslim"),
  musnadEditors: L("محققو المسند", "Musnad editors"),
};

const r = (who: Localized, ar: string, en: string) => ({ who, ruling: L(ar, en) });

export const gradings: Record<string, Grading> = {
  kursi: {
    verdict: "sahih",
    takhrij: "رواه النسائي في الكبرى (10731) وابن حبان (417)، وصححه الألباني في صحيح الترغيب (662)",
    reason: L(
      "حديث أُبي بن كعب: من قالها حين يصبح أُجير من الجن حتى يمسي، ومن قالها حين يمسي أُجير منهم حتى يصبح. وذكر الألباني في موضع آخر أن لفظ الصباح والمساء زيادة شاذة، وقراءتها عند النوم ثابتة في البخاري (2311) على كل حال.",
      "Ubayy ibn Kaʿb's hadith: whoever recites it in the morning is protected from the jinn until evening, and in the evening until morning. Al-Albānī elsewhere called the morning/evening wording an irregular addition (shādhdh); reciting it at bedtime is in al-Bukhārī (2311) either way.",
    ),
    rulings: [
      r(S.albani, "صحيح (صحيح الترغيب 662)", "Ṣaḥīḥ (Ṣaḥīḥ al-Targhīb 662)"),
      r(S.mundhiri, "إسناده جيد", "Isnād jayyid"),
      r(S.haythami, "رجاله ثقات", "Its narrators are trustworthy"),
    ],
  },
  quls: {
    verdict: "sahih",
    takhrij: "رواه أبو داود (5082) والترمذي (3575)، وحسنه الألباني وابن باز",
    reason: L(
      "حديث عبد الله بن خبيب، وفيه: «قل هو الله أحد والمعوذتين حين تمسي وحين تصبح ثلاث مرات تكفيك من كل شيء».",
      "ʿAbd Allāh ibn Khubayb's hadith names the evening and the morning and the count of three, and says they suffice you against everything.",
    ),
    rulings: [
      r(S.tirmidhi, "حسن صحيح غريب", "Ḥasan ṣaḥīḥ gharīb"),
      r(S.albani, "حسن (صحيح أبي داود 5082)", "Ḥasan (Ṣaḥīḥ Abī Dāwūd 5082)"),
      r(S.ibnBaz, "إسناده حسن (مجموع الفتاوى 26/26)", "Isnād ḥasan (Majmūʿ 26/26)"),
      r(S.nawawi, "إسناده صحيح", "Isnād ṣaḥīḥ"),
      r(S.ibnHajar, "حسن", "Ḥasan"),
    ],
  },
  baqarah: {
    verdict: "sahih",
    takhrij: "متفق عليه: البخاري (5009) ومسلم (807)",
    reason: L(
      "حديث أبي مسعود البدري: «من قرأ بالآيتين من آخر سورة البقرة في ليلة كفتاه». فهي من أذكار الليل، والليل يبدأ من المغرب، فذكرها مع أذكار المساء مناسب.",
      "Abū Masʿūd al-Badrī's hadith: whoever recites them in a night, they suffice him. It belongs to the night, which starts at maghrib, so placing it with the evening adhkār fits.",
    ),
    rulings: [r(S.bukhariMuslim, "في الصحيحين", "In both Ṣaḥīḥs")],
  },
  "asbahna-mulk": {
    verdict: "sahih",
    takhrij: "رواه مسلم (2723)",
    reason: L(
      "حديث ابن مسعود في صحيح مسلم، وفيه لفظ المساء ثم: «وإذا أصبح قال ذلك أيضا: أصبحنا وأصبح الملك لله».",
      "Ibn Masʿūd's hadith in Ṣaḥīḥ Muslim gives the evening wording and then the morning one.",
    ),
    rulings: [
      r(S.muslim, "في صحيح مسلم", "In Ṣaḥīḥ Muslim"),
      r(S.albani, "صحيح (أبو داود 5071، الترمذي 3390)", "Ṣaḥīḥ (Abū Dāwūd 5071, al-Tirmidhī 3390)"),
    ],
  },
  sayyid: {
    verdict: "sahih",
    takhrij: "رواه البخاري (6306)",
    reason: L(
      "حديث شداد بن أوس: «من قالها من النهار موقنا بها فمات من يومه قبل أن يمسي فهو من أهل الجنة»، وكذلك في الليل.",
      "Shaddād ibn Aws's hadith: whoever says it by day with certainty and dies before evening is of the people of Paradise, and the same by night.",
    ),
    rulings: [
      r(S.bukhari, "في صحيح البخاري", "In Ṣaḥīḥ al-Bukhārī"),
      r(S.albani, "صحيح، باللفظ المذكور هنا (أبو داود 5070)", "Ṣaḥīḥ, in the wording shown here (Abū Dāwūd 5070)"),
    ],
  },
  raditu: {
    verdict: "disputed",
    takhrij: "ضعفه الألباني في ضعيف أبي داود (5072) والضعيفة (5020)، وحسنه ابن باز وابن حجر",
    reason: L(
      "الروايات التي فيها «كان حقا على الله أن يرضيه» ضعفها الألباني، وحسنها ابن باز وابن حجر. وصحح الألباني لفظا آخر من حديث المنيذر يقال في الصباح، وفضله: «فأنا الزعيم لآخذن بيده حتى أدخله الجنة» (الصحيحة 2686).",
      "Al-Albānī graded the narrations promising «it is a right on Allah to please him» weak; Ibn Bāz and Ibn Ḥajar graded it ḥasan. Al-Albānī did authenticate a different wording: al-Munaydhir's hadith, said in the morning, «I guarantee to take his hand until I enter him into Paradise» (al-Ṣaḥīḥah 2686).",
    ),
    rulings: [
      r(S.albani, "ضعيف (ضعيف أبي داود 5072، الضعيفة 5020)", "Weak (Ḍaʿīf Abī Dāwūd 5072; al-Ḍaʿīfah 5020)"),
      r(S.ibnBaz, "إسناده حسن (مجموع الفتاوى 26/28)", "Isnād ḥasan (Majmūʿ 26/28)"),
      r(S.ibnHajar, "حسن (نتائج الأفكار 2/371)", "Ḥasan (Natāʾij al-Afkār 2/371)"),
      r(S.arnaut, "صحيح لغيره", "Ṣaḥīḥ li-ghayrih"),
    ],
  },
  ushhiduk: {
    verdict: "disputed",
    takhrij: "ضعفه الألباني في ضعيف أبي داود (5069)، وحسنه ابن باز والأرناؤوط، وجوّده النووي",
    reason: L(
      "حديث أنس: من قالها مرة أعتق الله ربعه من النار، ومن قالها أربعا أعتقه الله من النار. وأشار المنذري إلى راوٍ في حديثه اضطراب، ولذلك ضعفه الألباني.",
      "Anas's hadith: each saying frees a quarter of him from the Fire, four times frees him. Al-Mundhirī noted a narrator whose reports are inconsistent, which is why al-Albānī weakened it.",
    ),
    rulings: [
      r(S.albani, "ضعيف (ضعيف أبي داود 5069، الضعيفة 1041)", "Weak (Ḍaʿīf Abī Dāwūd 5069; al-Ḍaʿīfah 1041)"),
      r(S.ibnBaz, "حسن ولا بأس به (نور على الدرب)", "Ḥasan, no harm in it (Nūr ʿalā al-Darb)"),
      r(S.nawawi, "إسناده جيد", "Isnād jayyid"),
      r(S.ibnHajar, "حسن غريب (نتائج الأفكار 2/375)", "Ḥasan gharīb (Natāʾij 2/375)"),
      r(S.arnaut, "حسن", "Ḥasan"),
    ],
    notes: [
      L(
        "عبارة «وحدك لا شريك لك» ليست في هذا الحديث (أبو داود 5069)، وإنما في رواية أخرى (5078).",
        "«وحدك لا شريك لك» isn't in this hadith (Abū Dāwūd 5069); it comes from another narration (5078).",
      ),
    ],
  },
  "ma-asbaha": {
    verdict: "disputed",
    takhrij: "ضعفه الألباني في ضعيف أبي داود (5073)، وحسنه ابن باز وابن حجر، وجوّده النووي",
    reason: L(
      "حديث عبد الله بن غنام: من قالها حين يصبح فقد أدى شكر يومه، ومن قالها حين يمسي فقد أدى شكر ليلته. والخلاف فيه بسبب راوٍ عدّه الألباني والأرناؤوط مجهولا.",
      "ʿAbd Allāh ibn Ghannām's hadith: saying it fulfils the thanks of that day or night. The dispute is over one narrator, whom al-Albānī and al-Arnaʾūṭ consider unknown.",
    ),
    rulings: [
      r(S.albani, "ضعيف (ضعيف أبي داود 5073، الكلم الطيب 26)", "Weak (Ḍaʿīf Abī Dāwūd 5073; al-Kalim al-Ṭayyib 26)"),
      r(S.arnaut, "إسناده ضعيف: عبد الله بن عنبسة مجهول", "Weak: ʿAbd Allāh ibn ʿAnbasah is unknown"),
      r(S.ibnBaz, "إسناده حسن (مجموع الفتاوى 26/30)", "Isnād ḥasan (Majmūʿ 26/30)"),
      r(S.ibnHajar, "حسن (نتائج الأفكار 2/380)", "Ḥasan (Natāʾij 2/380)"),
      r(S.nawawi, "إسناده جيد", "Isnād jayyid"),
    ],
  },
  hasbiyallah: {
    verdict: "disputed",
    takhrij: "موقوف على أبي الدرداء، جوّد إسناده ابن باز، وحكم الألباني على المرفوع بالنكارة (الضعيفة 5286)",
    reason: L(
      "ثبت -على قول من صححه- من قول الصحابي أبي الدرداء، لا من قول النبي ﷺ. وألفاظه من القرآن (التوبة 129).",
      "Established, at best, as a saying of the Companion Abū al-Dardāʾ, not of the Prophet ﷺ. The words themselves are from the Qurʾān (al-Tawbah 129).",
    ),
    rulings: [
      r(S.albani, "المرفوع منكر (الضعيفة 5286)، والموقوف ضعيف (ضعيف الترغيب 382)", "The Prophetic wording is munkar (al-Ḍaʿīfah 5286); weak as Abū al-Dardāʾ's saying too (Ḍaʿīf al-Targhīb 382)"),
      r(S.ibnBaz, "موقوف بإسناد جيد (مجموع الفتاوى 26/65)", "Abū al-Dardāʾ's saying with a good chain (Majmūʿ 26/65)"),
      r(S.arnaut, "إسناد الموقوف صحيح، وزيادة «صادقا كان بها أو كاذبا» منكرة", "Chain to Abū al-Dardāʾ ṣaḥīḥ; «صادقا كان بها أو كاذبا» is munkar"),
    ],
    notes: [
      L(
        "قوله في الفضل «من أمر الدنيا والآخرة» من اللفظ المرفوع الذي حكم عليه الألباني بالنكارة.",
        "The virtue's «من أمر الدنيا والآخرة» comes from the Prophetic wording al-Albānī called munkar.",
      ),
    ],
  },
  bismillah: {
    verdict: "sahih",
    takhrij: "رواه أبو داود (5088) والترمذي (3388) وابن ماجه (3869)، وصححه الألباني وابن باز",
    reason: L(
      "حديث عثمان بن عفان، وفيه ذكر الصباح والمساء والعدد ثلاثا.",
      "ʿUthmān's hadith names the morning and evening and the count of three.",
    ),
    rulings: [
      r(S.albani, "صحيح (صحيح أبي داود 5088)", "Ṣaḥīḥ (Ṣaḥīḥ Abī Dāwūd 5088)"),
      r(S.ibnBaz, "صحيح", "Ṣaḥīḥ"),
      r(S.arnaut, "حسن", "Ḥasan"),
    ],
    notes: [
      L(
        "لفظ الفضل في الحديث: «لم يضره شيء»، وعند أبي داود: «لم تصبه فجأة بلاء».",
        "The hadith's wording of the virtue is «لم يضره شيء» (nothing harms him); Abū Dāwūd has «لم تصبه فجأة بلاء».",
      ),
    ],
  },
  bika: {
    verdict: "sahih",
    takhrij: "رواه الترمذي (3391) وأبو داود (5068)، وصححه الألباني",
    reason: L(
      "حديث أبي هريرة. ورجّح ابن القيم أن المحفوظ «وإليك النشور» في الصباح و«وإليك المصير» في المساء، وهو المذكور هنا.",
      "Abū Hurayrah's hadith. Ibn al-Qayyim judged «النشور» in the morning and «المصير» in the evening the best-preserved wording, which is what's shown here.",
    ),
    rulings: [
      r(S.albani, "صحيح (صحيح الترمذي 3391)", "Ṣaḥīḥ (Ṣaḥīḥ al-Tirmidhī 3391)"),
      r(S.ibnBaz, "إسناده صحيح (مجموع الفتاوى 26/27)", "Isnād ṣaḥīḥ (Majmūʿ 26/27)"),
      r(S.nawawi, "إسناده صحيح", "Isnād ṣaḥīḥ"),
    ],
  },
  fitrah: {
    verdict: "sahih",
    takhrij: "رواه أحمد (15360)، وصححه الألباني في الصحيحة (2989) وابن باز",
    reason: L(
      "حديث عبد الرحمن بن أبزى، وذِكر المساء في رواية أبي بن كعب. ولفظ «وعلى دين نبينا محمد» ثابت في رواية أحمد.",
      "ʿAbd al-Raḥmān ibn Abzā's hadith; the evening is in Ubayy ibn Kaʿb's narration. The wording «وعلى دين نبينا محمد» is in Aḥmad's text.",
    ),
    rulings: [
      r(S.albani, "صحيح (الصحيحة 2989، صحيح الجامع 4674)", "Ṣaḥīḥ (al-Ṣaḥīḥah 2989; Ṣaḥīḥ al-Jāmiʿ 4674)"),
      r(S.ibnBaz, "صحيح (مجموع الفتاوى 26/33)", "Ṣaḥīḥ (Majmūʿ 26/33)"),
      r(S.arnaut, "إسناده صحيح على شرط الشيخين", "Ṣaḥīḥ on the conditions of al-Bukhārī and Muslim"),
      r(S.ibnHajar, "حسن", "Ḥasan"),
    ],
  },
  adada: {
    verdict: "sahih",
    takhrij: "رواه مسلم (2726)",
    reason: L(
      "حديث جويرية: قالها النبي ﷺ ثلاث مرات بعد صلاة الفجر.",
      "Juwayriyah's hadith: the Prophet ﷺ said these words three times after Fajr.",
    ),
    rulings: [r(S.muslim, "في صحيح مسلم", "In Ṣaḥīḥ Muslim")],
    notes: [
      L(
        "الحديث يقيده بالصباح، ولم يرد ذكره في المساء.",
        "The hadith ties it to the morning; no narration places it in the evening.",
      ),
    ],
  },
  afini: {
    verdict: "sahih",
    takhrij: "رواه أبو داود (5090)، وحسنه الألباني وابن حجر",
    reason: L(
      "«اللهم عافني في بدني…» و«اللهم إني أعوذ بك من الكفر والفقر…» حديث واحد عن أبي بكرة، وفي آخره: «تعيدها ثلاثا حين تصبح وثلاثا حين تمسي». وفي إسناده جعفر بن ميمون وفيه لين.",
      "«اللهم عافني في بدني…» and «اللهم إني أعوذ بك من الكفر والفقر…» are one hadith of Abū Bakrah, ending «repeat them three times in the morning and three in the evening». One narrator, Jaʿfar ibn Maymūn, is considered soft.",
    ),
    rulings: [
      r(S.albani, "إسناده حسن (صحيح أبي داود 5090، صحيح الأدب المفرد 542)، وضعفه في ضعيف الجامع (1210)", "Isnād ḥasan (Ṣaḥīḥ Abī Dāwūd 5090; Ṣaḥīḥ al-Adab al-Mufrad 542), though he weakened it in Ḍaʿīf al-Jāmiʿ 1210"),
      r(S.ibnHajar, "حسن", "Ḥasan"),
      r(S.ibnBaz, "حسن", "Ḥasan"),
    ],
  },
  afw: {
    verdict: "sahih",
    takhrij: "رواه أبو داود (5074) وابن ماجه (3871)، وصححه الألباني",
    reason: L(
      "حديث ابن عمر: لم يكن رسول الله ﷺ يدع هؤلاء الدعوات حين يمسي وحين يصبح.",
      "Ibn ʿUmar: the Prophet ﷺ never left these words in the evening and the morning.",
    ),
    rulings: [
      r(S.albani, "صحيح (صحيح الترغيب 659)", "Ṣaḥīḥ (Ṣaḥīḥ al-Targhīb 659)"),
      r(S.nawawi, "صحيح", "Ṣaḥīḥ"),
      r(S.arnaut, "إسناده صحيح", "Isnād ṣaḥīḥ"),
      r(S.shakir, "صحيح", "Ṣaḥīḥ"),
    ],
  },
  "ya-hayy": {
    verdict: "sahih",
    takhrij: "رواه النسائي في الكبرى (10405) والحاكم (2000)، وحسنه الألباني في صحيح الجامع (5820)",
    reason: L(
      "أوصى به النبي ﷺ فاطمة: «أن تقولي إذا أصبحت وإذا أمسيت».",
      "The Prophet ﷺ told Fāṭimah to say it in the morning and the evening.",
    ),
    rulings: [
      r(S.albani, "حسن (صحيح الجامع 5820)", "Ḥasan (Ṣaḥīḥ al-Jāmiʿ 5820)"),
      r(S.hakim, "صحيح", "Ṣaḥīḥ"),
      r(S.mundhiri, "إسناده صحيح", "Isnād ṣaḥīḥ"),
    ],
    notes: [L("لم يرد في الحديث عدد، فيكفي أن يقال مرة واحدة.", "The hadith gives no count; saying it once is enough.")],
  },
  fathahu: {
    verdict: "disputed",
    takhrij: "ضعفه الألباني في ضعيف أبي داود (5084) والضعيفة (5606)، وحسنه ابن القيم والأرناؤوط",
    reason: L(
      "حديث أبي مالك الأشعري. استقر قول الألباني على تضعيفه، وحسنه ابن القيم والأرناؤوط.",
      "Abū Mālik al-Ashʿarī's hadith. Al-Albānī's final ruling is weak; Ibn al-Qayyim and the Arnaʾūṭs graded it ḥasan.",
    ),
    rulings: [
      r(S.albani, "حسنه أولا (صحيح الجامع 352) ثم ضعفه (الضعيفة 5606)", "Ḥasan at first (Ṣaḥīḥ al-Jāmiʿ 352), then weak (al-Ḍaʿīfah 5606)"),
      r(S.ibnQayyim, "حسن (زاد المعاد 2/337)", "Ḥasan (Zād al-Maʿād 2/337)"),
      r(S.iraqi, "إسناده جيد", "Isnād jayyid"),
      r(S.arnaut, "حسن", "Ḥasan"),
    ],
  },
  "alim-ghayb": {
    verdict: "sahih",
    takhrij: "رواه أبو داود (5067) والترمذي (3392، 3529)، وصححه الألباني",
    reason: L(
      "علّمه النبي ﷺ أبا بكر: «قله إذا أصبحت وإذا أمسيت وإذا أخذت مضجعك». وزيادة «وأن أقترف على نفسي سوءا…» ثابتة في رواية أخرى (الترمذي 3529).",
      "The Prophet ﷺ taught it to Abū Bakr for the morning, the evening and bedtime. The ending «وأن أقترف على نفسي سوءا…» is in another authentic narration (al-Tirmidhī 3529).",
    ),
    rulings: [
      r(S.tirmidhi, "حسن صحيح", "Ḥasan ṣaḥīḥ"),
      r(S.albani, "صحيح", "Ṣaḥīḥ"),
      r(S.ibnQayyim, "صحيح", "Ṣaḥīḥ"),
    ],
  },
  kalimat: {
    verdict: "sahih",
    takhrij: "رواه مسلم (2709) والترمذي (3604)، وصححه الألباني في صحيح الترغيب (652)",
    reason: L(
      "ثابت في المساء ثلاثا: «من قال حين يمسي ثلاث مرات… لم تضره حُمة تلك الليلة».",
      "Authentic for the evening, three times: no sting harms him that night.",
    ),
    rulings: [
      r(S.muslim, "في صحيح مسلم (في المساء)", "In Ṣaḥīḥ Muslim (evening)"),
      r(S.albani, "صحيح (صحيح الترغيب 652)", "Ṣaḥīḥ (Ṣaḥīḥ al-Targhīb 652)"),
      r(S.ibnBaz, "إسناده حسن (مجموع الفتاوى 26/32)", "Isnād ḥasan (Majmūʿ 26/32)"),
      r(S.ibnHajar, "رواية الصباح «لها أصل» فقط (نتائج الأفكار 2/360)", "The morning narration only «has a basis» (Natāʾij 2/360)"),
    ],
    notes: [
      L(
        "الأحاديث تذكر المساء، وروايته في الصباح ضعيفة السند.",
        "The hadiths name the evening; the morning narration has only weak support.",
      ),
    ],
  },
  salah: {
    verdict: "daif",
    takhrij: "ضعفه الألباني في الضعيفة (5788) بعد أن حسّنه، وقال ابن باز: لا أعرف له صحة",
    reason: L(
      "العدد عشرا والفضل «أدركته شفاعتي» لم يردا إلا في هذا الحديث، وفي إسناده انقطاع (خالد بن معدان لم يسمع من أبي الدرداء) وراوٍ مجهول. أما الصلاة على النبي ﷺ صباحا ومساء وفي كل وقت فمشروعة وفضلها عظيم.",
      "The ×10 and the promise «my intercession will reach him» come only from this hadith, whose chain is broken (Khālid ibn Maʿdān never met Abū al-Dardāʾ) and has an unknown narrator. Sending ṣalāh on the Prophet ﷺ is itself greatly rewarded at any time; it's the fixed count and this virtue that aren't established.",
    ),
    rulings: [
      r(S.albani, "حسنه أولا (صحيح الجامع 5357) ثم ضعفه (الضعيفة 5788)", "Ḥasan at first (Ṣaḥīḥ al-Jāmiʿ 5357), then weak (al-Ḍaʿīfah 5788)"),
      r(S.ibnBaz, "لا أعرف له صحة", "«I don't know it to be authentic»"),
      r(S.iraqi, "ضعيف", "Weak"),
    ],
  },
  shirk: {
    verdict: "sahih",
    takhrij: "رواه أحمد (19606)، وحسنه لغيره الألباني في صحيح الترغيب (36)",
    reason: L(
      "دعاء ثابت من حديث أبي موسى، لكن لم يرد في شيء من رواياته تقييده بالصباح والمساء.",
      "An authentic duʿāʾ from Abū Mūsā's hadith, but no narration ties it to the morning or evening.",
    ),
    rulings: [
      r(S.albani, "حسن لغيره (صحيح الترغيب 36)، ولفظ قريب صحيح (صحيح الأدب المفرد 551)", "Ḥasan li-ghayrih (Ṣaḥīḥ al-Targhīb 36); a related wording ṣaḥīḥ (Ṣaḥīḥ al-Adab al-Mufrad 551)"),
      r(S.musnadEditors, "إسناده وحده ضعيف (أبو علي الكاهلي مجهول)", "Weak chain alone (Abū ʿAlī al-Kāhilī is unknown)"),
    ],
    notes: [
      L(
        "ليس من أذكار الصباح والمساء، والتكرار ثلاثا في رواية أضعف.",
        "Not a morning or evening dhikr, and saying it three times rests on a weaker narration.",
      ),
    ],
  },
  hamm: {
    verdict: "sahih",
    takhrij: "أصله في البخاري (6363)، وتقييده بالصباح والمساء رواه أبو داود (1555) وضعفه الألباني",
    reason: L(
      "كان النبي ﷺ يكثر من هذا الدعاء (البخاري). وإنما ورد تقييده بالصباح والمساء في رواية أبي سعيد في قصة أبي أمامة، وضعفها الألباني والأرناؤوط.",
      "The Prophet ﷺ often made this duʿāʾ (al-Bukhārī). Only Abū Saʿīd's narration about Abū Umāmah ties it to morning and evening, and al-Albānī and al-Arnaʾūṭ weaken it.",
    ),
    rulings: [
      r(S.bukhari, "الدعاء نفسه في صحيح البخاري", "The duʿāʾ itself is in Ṣaḥīḥ al-Bukhārī"),
      r(S.albani, "رواية الصباح والمساء ضعيفة (ضعيف أبي داود 1555)", "The morning/evening narration is weak (Ḍaʿīf Abī Dāwūd 1555)"),
      r(S.arnaut, "إسناده ضعيف", "Weak chain"),
      r(S.mundhiri, "قبله", "Accepted it"),
    ],
    notes: [
      L(
        "تقييده بالصباح والمساء ضعيف، ولم يرد فيه عدد.",
        "Its link to the morning and evening is weak, and no narration gives a count.",
      ),
    ],
  },
  "astaghfir-azim": {
    verdict: "sahih",
    takhrij: "رواه أبو داود (1517) والترمذي (3577) وصححه الألباني، وليس مقيدا بالصباح والمساء",
    reason: L(
      "ثابت، وثبت تكراره ثلاثا: «غُفر له وإن كان فرّ من الزحف». أما الروايات التي تقيده ببعد الفجر أو عند النوم فضعيفة.",
      "Authentic, including saying it three times: he is forgiven even if he fled the battlefield. The narrations that set it after Fajr or at bedtime are weak.",
    ),
    rulings: [
      r(S.albani, "صحيح (صحيح أبي داود 1517)، والتكرار ثلاثا صحيح (الصحيحة 2727)", "Ṣaḥīḥ (Ṣaḥīḥ Abī Dāwūd 1517); ×3 ṣaḥīḥ (al-Ṣaḥīḥah 2727)"),
      r(S.mundhiri, "إسناده جيد متصل", "Isnād jayyid muttaṣil"),
      r(S.ibnBaz, "رواية الثلاث عند النوم ضعيفة ومتنها منكر", "The bedtime ×3 version is weak and its text munkar"),
    ],
    notes: [L("ذكر ثابت عام، غير مقيد بالصباح والمساء.", "An authentic general dhikr, not tied to the morning or evening.")],
  },
  "ya-rabb": {
    verdict: "disputed",
    takhrij: "رواه ابن ماجه (3801) وضعفه الألباني",
    reason: L(
      "حديث ابن عمر، مختلف فيه والأقرب ضعفه، وليس فيه تقييد بالصباح والمساء ولا عدد.",
      "Ibn ʿUmar's hadith; disputed, leaning weak. Either way it has no morning or evening link and no count.",
    ),
    rulings: [
      r(S.albani, "ضعيف (ضعيف ابن ماجه، ضعيف الترغيب 961)", "Weak (Ḍaʿīf Ibn Mājah; Ḍaʿīf al-Targhīb 961)"),
      r(S.shakir, "إسناده جيد", "Isnād jayyid"),
      r(S.dimyati, "حسن", "Ḥasan"),
    ],
    notes: [L("ليس من أذكار الصباح والمساء، ولم يرد فيه عدد.", "Not a morning or evening dhikr, and no narration gives a count.")],
  },
  "ilm-nafi": {
    verdict: "disputed",
    takhrij: "رواه ابن ماجه (925) وصححه الألباني، وضعفه ابن باز",
    reason: L(
      "حديث أم سلمة: كان النبي ﷺ يقوله بعد السلام من صلاة الفجر. صححه الألباني وحسنه ابن حجر، وضعفه ابن باز وابن عثيمين لجهالة راويه.",
      "Umm Salamah: the Prophet ﷺ said it after the salām of Fajr. Al-Albānī and Ibn Ḥajar accept it; Ibn Bāz and Ibn ʿUthaymīn point to an unknown narrator.",
    ),
    rulings: [
      r(S.albani, "صحيح (صحيح ابن ماجه 762)", "Ṣaḥīḥ (Ṣaḥīḥ Ibn Mājah 762)"),
      r(S.ibnHajar, "حسن بشاهده", "Ḥasan through a supporting narration"),
      r(S.ibnBaz, "ضعيف (مجموع الشروح الفقهية 6/509)", "Weak (Majmūʿ al-Shurūḥ al-Fiqhiyyah 6/509)"),
      r(S.uthaymin, "مولى أم سلمة مجهول (مجموع الفتاوى 13/277)", "The client of Umm Salamah who narrates it is unknown (Majmūʿ 13/277)"),
    ],
  },
  tawakkaltu: {
    verdict: "daif",
    takhrij: "رواه ابن السني (57) والطبراني في الدعاء (343)، وضعفه جدا الألباني في الضعيفة (6420)",
    reason: L(
      "قصة احتراق ما حول بيت أبي الدرداء دون بيته. في إسناده الأغلب بن تميم، وهو منكر الحديث.",
      "The story of Abū al-Dardāʾ's house not burning. Its chain has al-Aghlab ibn Tamīm, whose reports are rejected.",
    ),
    rulings: [
      r(S.albani, "ضعيف جدا (الضعيفة 6420)", "Very weak (al-Ḍaʿīfah 6420)"),
      r(S.arnaut, "الأغلب بن تميم منكر الحديث", "Its narrator al-Aghlab ibn Tamīm is munkar al-ḥadīth"),
      r(S.ibnJawzi, "لا يثبت", "«Not established»"),
      r(S.iraqi, "ضعيف", "Weak"),
    ],
    notes: [L("قوله «ذكر طيب» ليس من الحديث.", "«ذكر طيب» isn't from any hadith.")],
  },
  tahlil: {
    verdict: "sahih",
    takhrij: "متفق عليه: البخاري (3293) ومسلم (2691)، وفيه: في يوم مائة مرة",
    reason: L(
      "في الحديث: «من قال… في يوم مائة مرة… وكانت له حرزا من الشيطان يومه ذلك حتى يمسي»، فالأفضل قولها أول النهار. وثبت قولها مرة وعشرا في الصباح في روايات أخرى.",
      "The hadith says a hundred times in a day, a protection from Shayṭān that day until evening, so it is best said early in the day. Saying it once or ten times in the morning is in other authentic narrations.",
    ),
    rulings: [r(S.bukhariMuslim, "في الصحيحين (أبو هريرة)", "In both Ṣaḥīḥs (Abū Hurayrah)")],
  },
  tasbih: {
    verdict: "sahih",
    takhrij: "رواه مسلم (2692)، و«حطت خطاياه» عند البخاري (6405)",
    reason: L(
      "عند مسلم: «من قال حين يصبح وحين يمسي: سبحان الله وبحمده مائة مرة، لم يأت أحد يوم القيامة بأفضل مما جاء به…»، وعند البخاري: «من قال في يوم مائة مرة حطت خطاياه وإن كانت مثل زبد البحر».",
      "Muslim has the morning and evening ×100 with «no one brings anything better on the Day of Resurrection»; al-Bukhārī has ×100 in a day, sins forgiven even if like the foam of the sea.",
    ),
    rulings: [
      r(S.muslim, "الصباح والمساء مائة مرة", "Morning and evening ×100"),
      r(S.bukhari, "في يوم مائة مرة", "×100 in a day"),
    ],
  },
  istighfar: {
    verdict: "sahih",
    takhrij: "رواه ابن ماجه (3815) وصححه الألباني، وأصله في مسلم (2702)؛ وفي الصباح رواه النسائي في الكبرى (10275) وصححه الألباني في الصحيحة (1600)",
    reason: L(
      "كان النبي ﷺ يستغفر الله ويتوب إليه في اليوم مائة مرة. وفي حديث أبي موسى: «ما أصبحت غداة قط إلا استغفرت الله فيها مائة مرة».",
      "The Prophet ﷺ sought forgiveness a hundred times a day. Abū Mūsā's narration «I never entered a morning without seeking Allah's forgiveness a hundred times» places it in the morning.",
    ),
    rulings: [
      r(S.albani, "حسن صحيح (صحيح ابن ماجه 3091)، ورواية الصباح صحيحة (الصحيحة 1600)", "Ḥasan ṣaḥīḥ (Ṣaḥīḥ Ibn Mājah 3091); the morning narration ṣaḥīḥ (al-Ṣaḥīḥah 1600)"),
      r(S.muslim, "مائة مرة في اليوم", "A hundred times a day"),
    ],
    notes: [
      L(
        "الفضل المذكور هنا («مائة حسنة… حرزا من الشيطان») هو فضل «لا إله إلا الله وحده لا شريك له…» مائة مرة، لا فضل الاستغفار.",
        "The virtue shown here («مائة حسنة… حرزا من الشيطان») belongs to «لا إله إلا الله وحده لا شريك له…» a hundred times, not to istighfār.",
      ),
    ],
  },
};
