#!/usr/bin/env node
/**
 * Label every book chapter with route-building keywords.
 *
 * The labels are deliberately derived from the chapter's own data:
 *   - grammar entries and grammar section headings
 *   - reading text and vocabulary glosses
 *   - exercise / commentary / reader metadata
 *
 * Output: src/data/chapter-keywords.generated.js
 *
 * Run with: node scripts/build-chapter-keywords.mjs
 */
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const ORIGINAL_BOOK_IDS = [
  'caesar-de-bello-gallico-vii',
  'vergil-aeneis-i-et-iv',
  'ovidii-ars-amatoria',
  'petronius-cena-trimalchionis',
  'sallustius-cicero-catilina',
  'plautus-amphitryo',
  'catullus-carmina',
  'cicero-epistulae-ad-familiares',
  'caesar-de-bello-gallico',
  'caesar-de-bello-civili',
  'caesar-bellum-alexandrinum',
  'caesar-bellum-africum',
  'caesar-bellum-hispaniense',
  'ovidius-metamorphoses',
  'ovidius-amores',
  'ovidius-heroides',
  'ovidius-ars-amatoria',
  'ovidius-tristia',
  'ovidius-ex-ponto',
  'ovidius-fasti',
  'ovidius-remedia-amoris',
  'ovidius-ibis',
  'vergil-aeneis',
  'vergil-eclogae',
  'vergil-georgica',
  'horatius-sermones',
  'horatius-carmina',
  'horatius-epistulae',
  'horatius-ars-poetica',
  'horatius-carmen-saeculare',
  'horatius-epodi',
]

const MODULES = [
  'familia-romana',
  'roma-aeterna',
  'exercitia-latina',
  'colloquia-personarum',
  'fabulae-syrae',
  'sermones-romani',
  'epitome-historiae-sacrae',
  'exercitia-latina-ii',
  'caesar-de-bello-gallico-vii',
  'vergil-aeneis-i-et-iv',
  'ovidii-ars-amatoria',
  'petronius-cena-trimalchionis',
  'sallustius-cicero-catilina',
  'plautus-amphitryo',
  'catullus-carmina',
  'cicero-epistulae-ad-familiares',
  'caesar-de-bello-gallico',
  'caesar-de-bello-civili',
  'caesar-bellum-alexandrinum',
  'caesar-bellum-africum',
  'caesar-bellum-hispaniense',
  'ovidius-metamorphoses',
  'ovidius-amores',
  'ovidius-heroides',
  'ovidius-ars-amatoria',
  'ovidius-tristia',
  'ovidius-ex-ponto',
  'ovidius-fasti',
  'ovidius-remedia-amoris',
  'ovidius-ibis',
  'vergil-aeneis',
  'vergil-eclogae',
  'vergil-georgica',
  'horatius-sermones',
  'horatius-carmina',
  'horatius-epistulae',
  'horatius-ars-poetica',
  'horatius-carmen-saeculare',
  'horatius-epodi',
  'companion-roma-aeterna',
  'companion',
  'learn-latin',
  'latin-via-ovid',
]

const books = []
for (const moduleName of MODULES) {
  const mod = await import(join(ROOT, 'src/data', moduleName, 'index.js'))
  books.push({ book: mod.book, chapters: mod.chapters })
}

/* ------------------------------------------------------------------ */
/* Normalisation                                                       */
/* ------------------------------------------------------------------ */

function norm(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ø/gi, 'o')
    .replace(/æ/gi, 'ae')
    .replace(/œ/gi, 'oe')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

const words = (value) => norm(value).replace(/[^a-z0-9' -]+/g, ' ')

// A light Latin stemmer: enough to make amo/amare/amor/amoris/amore share a
// key, without pretending to be a full morphological analyser.
const LATIN_SUFFIXES = [
  'issem', 'isses', 'isset', 'erunt', 'istis', 'ibus', 'orum', 'arum', 'erum',
  'ium', 'iis', 'isse', 'imus', 'em', 'am', 'um', 'os', 'as', 'es', 'is',
  'ae', 'i', 'o', 'a', 'e', 'u', 's', 'm', 't',
]

function latinStem(word) {
  if (!word || word.length <= 3) return word
  for (const suffix of LATIN_SUFFIXES) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 3) {
      return word.slice(0, -suffix.length)
    }
  }
  return word
}

function looksLatin(text) {
  if (/[āēīōūȳ]/i.test(text)) return true
  const haystack = norm(text)
  const markers = haystack.match(/\b(est|sunt|esse|et|in|ad|cum|per|ex|de|non|qui|quae|quod|sed|iam|tum|hic|haec|hoc)\b/g) || []
  return markers.length >= 2
}

function eachString(value, visit) {
  if (value == null) return
  if (typeof value === 'string') return visit(value)
  if (Array.isArray(value)) {
    for (const item of value) eachString(item, visit)
    return
  }
  if (typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (['id', 'slug', 'type', 'kind', 'status', 'complete', 'reference'].includes(key)) continue
      eachString(item, visit)
    }
  }
}

/* ------------------------------------------------------------------ */
/* Keyword rules                                                       */
/* ------------------------------------------------------------------ */

// [id, label, pattern applied to normalised text]
const GRAMMAR_RULES = [
  ['alphabet', 'Alphabet and pronunciation', /\b(alphabet|pronunciation|pronounce|consonants?|vowels?)\b/],
  ['parts-of-speech', 'Parts of speech', /\bparts? of speech\b|\beight parts\b/],
  ['inflection', 'Inflection', /\binflect/],
  ['principal-parts', 'Principal parts', /\bprincipal parts\b/],
  ['verb-stems', 'Verb stems', /\bstems? of the verb\b|\bverb stems?\b/],
  ['noun', 'Nouns', /\bnouns?\b/],
  ['verb', 'Verbs', /\bverbs?\b/],
  ['adjective', 'Adjectives', /\badjectives?\b/],
  ['adverb', 'Adverbs', /\badverbs?\b/],
  ['pronoun', 'Pronouns', /\bpronouns?\b/],
  ['preposition', 'Prepositions', /\bprepositions?\b/],
  ['conjunction', 'Conjunctions', /\bconjunctions?\b/],
  ['interjection', 'Interjections', /\binterjections?\b/],
  ['gender', 'Grammatical gender', /\b(gender|masculine|feminine|neuter)\b/],
  ['number', 'Singular and plural', /\b(singular|plural|number and case)\b/],
  ['case', 'The case system', /\bcases?\b/],
  ['nominative', 'Nominative case', /\bnominative\b/],
  ['genitive', 'Genitive case', /\bgenitive\b/],
  ['dative', 'Dative case', /\bdative\b/],
  ['accusative', 'Accusative case', /\baccusative\b/],
  ['ablative', 'Ablative case', /\bablative\b/],
  ['vocative', 'Vocative case', /\bvocative\b/],
  ['locative', 'Locative case', /\blocative\b/],
  ['declension', 'Declensions', /\bdeclensions?\b/],
  ['first-declension', 'First declension', /\bfirst declension\b/],
  ['second-declension', 'Second declension', /\bsecond declension\b/],
  ['third-declension', 'Third declension', /\bthird declension\b|\bthird-declension\b/],
  ['fourth-declension', 'Fourth declension', /\bfourth declension\b/],
  ['fifth-declension', 'Fifth declension', /\bfifth declension\b/],
  ['i-stems', 'Third-declension i-stems', /\bi-stems?\b/],
  ['conjugation', 'Conjugations', /\bconjugations?\b/],
  ['first-conjugation', 'First conjugation', /\bfirst conjugation\b/],
  ['second-conjugation', 'Second conjugation', /\bsecond conjugation\b/],
  ['third-conjugation', 'Third conjugation', /\bthird conjugation\b/],
  ['fourth-conjugation', 'Fourth conjugation', /\bfourth conjugation\b/],
  ['agreement', 'Agreement', /\bagreement\b|\bagree\b/],
  ['word-order', 'Word order', /\bword order\b|\border of words\b/],
  ['questions', 'Questions', /\bquestions?\b|\binterrogat/],
  ['negation', 'Negation', /\bnegat|\bnegative\b|\bnegatives\b/],
  ['commands', 'Commands and the imperative', /\bimperative\b|\bcommands?\b/],
  ['present-tense', 'Present tense', /\bpresent\b/],
  ['imperfect-tense', 'Imperfect tense', /\bimperfect\b/],
  ['future-tense', 'Future tense', /\bfuture\b/],
  ['perfect-tense', 'Perfect tense', /\bperfect\b/],
  ['pluperfect-tense', 'Pluperfect tense', /\bpluperfect\b|\bpast perfect\b/],
  ['future-perfect', 'Future perfect', /\bfuture perfect\b/],
  ['active-voice', 'Active voice', /\bactive\b/],
  ['passive-voice', 'Passive voice', /\bpassive\b/],
  ['deponent-verbs', 'Deponent verbs', /\bdeponent\b/],
  ['indicative', 'Indicative mood', /\bindicative\b/],
  ['subjunctive', 'Subjunctive mood', /\bsubjunctive\b/],
  ['infinitive', 'Infinitive', /\binfinitives?\b/],
  ['participles', 'Participles', /\bparticiples?\b/],
  ['gerund', 'Gerund', /\bgerund\b(?!ive)/],
  ['gerundive', 'Gerundive', /\bgerundive\b/],
  ['supine', 'Supine', /\bsupine\b/],
  ['relative-clauses', 'Relative clauses', /\brelative (pronoun|clause)/],
  ['purpose-clauses', 'Purpose clauses', /\bpurpose\b/],
  ['result-clauses', 'Result clauses', /\bresult clause|\bconsecutive\b/],
  ['indirect-statement', 'Indirect statement', /\bindirect statement\b|\baccusative (with|and) (the )?infinitive\b|\boratio obliqua\b/],
  ['indirect-question', 'Indirect questions', /\bindirect questions?\b|\bthe indirect question\b/],
  ['indirect-command', 'Indirect commands', /\bindirect command|\bordering and warning\b/],
  ['conditionals', 'Conditional sentences', /\bconditionals?\b|\bconditions? with\b|\bcontrary-to-fact\b/],
  ['cum-clauses', 'Cum clauses', /\bcum clause|\bcum as\b|\binverted cum\b/],
  ['ablative-absolute', 'Ablative absolute', /\bablative absolute\b/],
  ['periphrastic', 'Periphrastic conjugation', /\bperiphrastic\b/],
  ['comparison', 'Comparison of adjectives and adverbs', /\bcomparison\b|\bcomparative\b|\bsuperlative\b|\blongior\b|\bissimus\b/],
  ['numerals', 'Numbers and numerals', /\bcardinal\b|\bordinal\b|\broman numerals\b|\bnumeral\b|\bthree and thousands\b|\btwo and a thousand\b/],
  ['time', 'Time and dates', /\bdates?\b|\btemporal\b|\bexpression of time\b|\bcases? of time\b/],
  ['place', 'Place and location', /\bplace\b|\blocative\b/],
  ['reflexive-pronouns', 'Reflexive pronouns', /\breflexive\b/],
  ['demonstratives', 'Demonstrative pronouns', /\bdemonstratives?\b|\bthis and who\b|\bthis; these\b|\bthis: hic\b|\bthe same\b|\bthose\b|\bhic, haec\b|\bsuus and eius\b/],
  ['personal-pronouns', 'Personal pronouns', /\bpersonal pronouns?\b/],
  ['possession', 'Possession', /\bpossession\b|\bpossessive\b/],
  ['sequence-of-tenses', 'Sequence of tenses', /\bsequence of tenses\b/],
  ['irregular-verbs', 'Irregular verbs', /\birregular verbs?\b|\bsum and possum\b|\bthe verb (sum|posse|eo|ferre|fio)\b|\b(volo|nolo|malo)\b/],
  ['compound-verbs', 'Compound verbs and prefixes', /\bcompound verbs?\b|\bprefixes?\b/],
  ['word-formation', 'Word formation', /\bformed from\b|\babstract nouns\b|\binchoative\b/],
  ['prosody', 'Syllables and quantity', /\bsyllab|\bquantity\b|\belision\b|\bjoined syllables\b|\blong and short\b/],
  ['meter', 'Metre and scansion', /\bmetre\b|\bmeter\b|\bhexameter\b|\bpentameter\b|\bsapphic\b|\badonic\b|\bfeet of verse\b|\bscansion\b/],
  ['reading-poetry', 'Reading Latin poetry', /\breading latin poetry\b/],
]

// [id, label, cues (normalised strings matched on word boundaries)]
const THEMES = [
  ['family', 'Family and household', ['father', 'mother', 'son', 'daughter', 'brother', 'sister', 'family', 'household', 'wife', 'husband', 'child', 'children', 'pater', 'mater', 'filius', 'filia', 'frater', 'soror', 'familia', 'uxor', 'maritus', 'coniunx']],
  ['school', 'School and education', ['school', 'teacher', 'pupil', 'student', 'classroom', 'dictation', 'schola', 'magister', 'discipulus', 'docere', 'discere']],
  ['money-commerce', 'Money, trade and business', ['money', 'buy', 'sell', 'price', 'market', 'merchant', 'debt', 'bank', 'loan', 'interest', 'business', 'account', 'rich', 'poor', 'pecunia', 'emere', 'vendere', 'pretium', 'forum', 'mercator', 'debitum', 'argentarius', 'fenus', 'negotium', 'dives', 'pauper']],
  ['law-politics', 'Law, courts and politics', ['law', 'court', 'judge', 'advocate', 'lawsuit', 'crime', 'accuse', 'senate', 'senator', 'consul', 'magistrate', 'citizen', 'vote', 'quaestor', 'republic', 'lex', 'ius', 'iudex', 'advocatus', 'causa', 'crimen', 'accusare', 'senatus', 'consul', 'magistratus', 'civis', 'suffragium', 'quaestor', 'res publica']],
  ['war-army', 'War and the army', ['war', 'army', 'soldier', 'camp', 'battle', 'enemy', 'fight', 'weapon', 'sword', 'siege', 'commander', 'legion', 'cavalry', 'fleet', 'victory', 'defeat', 'bellum', 'exercitus', 'miles', 'castra', 'proelium', 'hostis', 'pugnare', 'arma', 'gladius', 'oppugnare', 'dux', 'legio', 'equites', 'classis', 'victoria', 'vincere']],
  ['sea-travel', 'Sea and ships', ['sea', 'ship', 'sail', 'voyage', 'harbour', 'harbor', 'storm', 'wave', 'shore', 'boat', 'sailor', 'mare', 'navis', 'navigare', 'portus', 'tempestas', 'unda', 'litus', 'navicula', 'nauta']],
  ['city-architecture', 'City and architecture', ['city', 'town', 'street', 'forum', 'temple', 'house', 'building', 'wall', 'gate', 'bath', 'theatre', 'theater', 'basilica', 'palace', 'monument', 'urbs', 'oppidum', 'via', 'forum', 'templum', 'domus', 'aedificium', 'murus', 'porta', 'balneum', 'theatrum', 'basilica', 'palatium', 'monumentum']],
  ['countryside', 'Countryside and farming', ['farm', 'field', 'crop', 'wheat', 'grain', 'wine', 'olive', 'garden', 'shepherd', 'flock', 'harvest', 'estate', 'fundus', 'ager', 'seges', 'frumentum', 'vinum', 'olea', 'hortus', 'pastor', 'grex', 'messis', 'rus', 'villa']],
  ['religion', 'Gods and religion', ['god', 'goddess', 'temple', 'sacrifice', 'priest', 'altar', 'prayer', 'divine', 'fate', 'oracle', 'religion', 'sacred', 'holy', 'deus', 'dea', 'templum', 'sacrificium', 'sacerdos', 'ara', 'precari', 'fatum', 'oraculum', 'religio', 'sacer', 'sanctus']],
  ['myth', 'Myth and legend', ['hercules', 'theseus', 'perseus', 'ulysses', 'aeneas', 'jason', 'minotaur', 'hydra', 'labyrinth', 'troy', 'trojan', 'myth', 'legend', 'hero', 'monster', 'hercules', 'theseus', 'perseus', 'ulixes', 'aeneas', 'iason', 'minotaurus', 'hydra', 'labyrinthus', 'troia', 'troianus', 'heros', 'monstrum']],
  ['love', 'Love and desire', ['love', 'desire', 'wedding', 'kiss', 'beauty', 'venus', 'cupid', 'lover', 'beloved', 'amor', 'amare', 'cupido', 'nubere', 'coniugium', 'osculum', 'venus', 'amator', 'amata']],
  ['dining', 'Food and dining', ['dinner', 'food', 'wine', 'bread', 'fish', 'cook', 'feast', 'dish', 'hunger', 'thirst', 'table', 'banquet', 'cena', 'cibus', 'vinum', 'panis', 'piscis', 'coquus', 'epulum', 'ferculum', 'fames', 'sitis', 'convivium']],
  ['body-health', 'Health and medicine', ['health', 'sick', 'illness', 'doctor', 'medicine', 'wound', 'pain', 'valetudo', 'aeger', 'morbus', 'medicus', 'medicina', 'vulnus', 'dolor']],
  ['death', 'Death and burial', ['death', 'kill', 'funeral', 'tomb', 'grave', 'ghost', 'underworld', 'murder', 'mors', 'mori', 'necare', 'funus', 'sepulcrum', 'tumulus', 'umbra', 'inferi', 'occidere']],
  ['friendship', 'Friendship and patronage', ['friend', 'friendship', 'patron', 'client', 'greet', 'gift', 'favour', 'favor', 'guest', 'hospitality', 'amicus', 'amicitia', 'patronus', 'cliens', 'salutare', 'donum', 'beneficium', 'hospes', 'hospitium']],
  ['emotions', 'Emotions and character', ['fear', 'anger', 'joy', 'grief', 'hope', 'brave', 'wise', 'foolish', 'happy', 'sad', 'courage', 'timor', 'ira', 'gaudium', 'dolor', 'spes', 'fortis', 'sapiens', 'stultus', 'felix', 'tristis', 'virtus']],
  ['time', 'Time and the calendar', ['day', 'night', 'month', 'year', 'hour', 'calendar', 'festival', 'season', 'morning', 'evening', 'dies', 'nox', 'mensis', 'annus', 'hora', 'kalendae', 'festus', 'tempus', 'mane', 'vesper']],
  ['animals-nature', 'Animals and nature', ['animal', 'horse', 'dog', 'bird', 'fish', 'wolf', 'lion', 'forest', 'mountain', 'equus', 'canis', 'avis', 'piscis', 'lupus', 'leo', 'arbor', 'silva', 'mons']],
  ['slavery-freedom', 'Slavery and freedom', ['slave', 'freedman', 'freedom', 'servus', 'serva', 'libertus', 'libertas', 'dominus', 'domina']],
  ['roman-history', 'Roman history', ['history', 'king', 'republic', 'emperor', 'senate', 'historia', 'rex', 'res publica', 'imperator', 'senatus']],
  ['rhetoric', 'Rhetoric and style', ['rhetoric', 'speech', 'praise', 'blame', 'style', 'metaphor', 'simile', 'ornament', 'persuade', 'rhetorica', 'oratio', 'laus', 'vituperium', 'stilus', 'metaphora', 'similitudo', 'persuadere']],
  ['philosophy', 'Philosophy and wisdom', ['philosophy', 'philosopher', 'virtue', 'wisdom', 'happiness', 'soul', 'truth', 'philosophia', 'philosophus', 'virtus', 'sapientia', 'felicitas', 'animus', 'veritas']],
  ['geography', 'Geography and peoples', ['geography', 'land', 'country', 'continent', 'nation', 'gaul', 'germany', 'britain', 'egypt', 'asia', 'africa', 'europe', 'map', 'terra', 'regio', 'continens', 'gens', 'gallia', 'germania', 'britannia', 'aegyptus', 'asia', 'africa', 'europa', 'charta', 'insula', 'oceanus', 'fluvius', 'flumen']],
  ['inscriptions', 'Inscriptions and graffiti', ['inscription', 'graffito', 'epitaph', 'stone', 'monument', 'tomb', 'inscriptio', 'titulus', 'sepulcralis', 'monumentum', 'sepulcrum']],
  ['theatre', 'Theatre and performance', ['theatre', 'theater', 'play', 'comedy', 'actor', 'stage', 'audience', 'scene', 'theatrum', 'comoedia', 'histrio', 'scaena']],
  ['poetry-music', 'Poetry and song', ['poem', 'poet', 'song', 'verse', 'lyre', 'poetry', 'epic', 'elegy', 'poeta', 'carmen', 'versus', 'lyra', 'poema', 'epicus', 'elegia']],
  ['bible', 'Bible and biblical history', ['bible', 'lord', 'israel', 'jerusalem', 'moses', 'abraham', 'david', 'jesus', 'christ', 'prophet', 'genesis', 'exodus', 'israel', 'hierosolyma', 'moyses', 'abraham', 'david', 'iesus', 'christus', 'propheta']],
  ['christianity', 'Christianity and the martyrs', ['christian', 'church', 'martyr', 'apostle', 'gospel', 'faith', 'baptism', 'christianus', 'ecclesia', 'martyr', 'apostolus', 'evangelium', 'fides', 'baptisma']],
]

for (const theme of THEMES) theme[2] = [...new Set(theme[2])]

const THEME_CUE_RE = new Map(
  THEMES.map(([id, , cues]) => [
    id,
    cues.map((cue) => new RegExp(`(?:^|[^a-z])${cue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[^a-z]|$)`)),
  ]),
)

const GRAMMAR_DEF = new Map(GRAMMAR_RULES.map(([id, label], index) => [id, { label, order: index }]))
const THEME_DEF = new Map(THEMES.map(([id, label], index) => [id, { label, order: index }]))

const GROUPS = {
  grammar: 'Grammar',
  theme: 'Theme and vocabulary',
  text: 'Text type and register',
  skill: 'Skill and focus',
  author: 'Author',
  work: 'Work',
  level: 'Level',
}

const TEXT_LABELS = {
  'dialogue': 'Dialogue',
  'fable': 'Fable',
  'letter': 'Letter',
  'history': 'History',
  'speech': 'Speech',
  'poetry': 'Poetry',
  'verse': 'Verse',
  'prose': 'Prose',
  'comedy': 'Comedy',
  'novel': 'Novel',
  'satire': 'Satire',
  'commentary': 'Commentary',
  'coursebook': 'Coursebook',
  'exercise-book': 'Exercise book',
  'anthology': 'Anthology',
  'paraphrase': 'Prose paraphrase',
  'narrative': 'Narrative',
  'gospel': 'Gospel',
  'acts': 'Acts and martyrs',
  'inscription': 'Inscription',
  'adapted-latin': 'Adapted Latin',
  'original-latin': 'Original Latin',
  'english-explanation': 'English explanation',
}

const SKILL_LABELS = {
  reading: 'Reading',
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
  translation: 'Translation',
  composition: 'Composition',
  scansion: 'Scansion',
  commentary: 'Commentary',
  practice: 'Practice',
}

const LEVEL_LABELS = {
  beginner: 'Beginner',
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

/* ------------------------------------------------------------------ */
/* Extractors                                                          */
/* ------------------------------------------------------------------ */

function collect(value, keys) {
  const out = []
  eachString(value, (text) => out.push(text))
  return out.join(' ')
}

function grammarTitles(chapter) {
  const entries = chapter.grammar || []
  if (!entries.length) return { strong: '', weak: '' }
  const strong = []
  const weak = []
  for (const g of entries) {
    strong.push(g.title, g.latinTitle)
    weak.push(g.intro)
    if (g.points) weak.push(...g.points)
    for (const p of g.paradigms || []) {
      strong.push(p.caption)
      if (p.head) strong.push(...p.head)
    }
  }
  return { strong: strong.filter(Boolean).join(' '), weak: weak.filter(Boolean).join(' ') }
}

function sectionHeadings(chapter) {
  const headings = []
  const prose = []
  for (const section of chapter.sections || []) {
    headings.push(section.latin, section.english)
    for (const block of section.blocks || []) {
      if (block.t === 'h') headings.push(block.text)
      else if (block.t === 'outline') headings.push(...(block.items || []).map((item) => item.text))
      else if (block.t === 'li') headings.push(block.text)
      else if (block.t === 'p') prose.push(block.text)
      else if (block.t === 'example' || block.t === 'pre') prose.push(block.text)
    }
  }
  return { headings: headings.filter(Boolean).join(' '), prose: prose.filter(Boolean).join(' ') }
}

// Learn Latin from the Romans stores its grammar, readings and vocabulary
// inside section blocks rather than the structured grammar/readings/vocabulary
// fields, so those blocks need their own extraction pass.
function sectionBlocks(chapter) {
  const headings = []
  const prose = []
  const latin = []
  for (const section of chapter.sections || []) {
    for (const block of section.blocks || []) {
      const t = block.t
      if (t === 'h' || t === 'vhead' || t === 'vlabel') {
        if (block.text) headings.push(block.text)
      } else if (t === 'term') {
        if (block.term) headings.push(block.term)
        if (block.gloss) prose.push(block.gloss)
      } else if (t === 'p' || t === 'note' || t === 'exlabel') {
        if (block.text) prose.push(block.text)
      } else if (t === 'passage') {
        if (block.text) (block.lang === 'en' ? prose : latin).push(block.text)
      } else if (t === 'ex') {
        if (block.title) headings.push(block.title)
        if (block.text) prose.push(block.text)
      } else if (t === 'table') {
        if (block.header) headings.push(...block.header.filter(Boolean))
        for (const row of block.rows || []) {
          for (const cell of row || []) {
            if (cell) {
              prose.push(cell)
              latin.push(cell)
            }
          }
        }
      } else if (t === 'li') {
        if (block.text) latin.push(block.text)
      } else if (block.text) {
        prose.push(block.text)
      }
    }
  }
  return {
    headings: headings.filter(Boolean).join(' '),
    prose: prose.filter(Boolean).join(' '),
    latin: latin.filter(Boolean).join(' '),
  }
}

// Reading-only editions (Caesar, Vergil, the readers) carry no grammar
// metadata, so their grammatical constructions are detected from the Latin
// itself. Only genuinely diagnostic cues are used: ubiquitous words such as
// qui/quae/quod, cum and si appear in every Latin sentence and would tag every
// chapter alike.
const LATIN_GRAMMAR_CUES = [
  ['subjunctive', 3, /\b(?:sit|sint|esset|essent|foret|forent|velit|velint|vellet|vellent|possit|possint|posset|possent|fiat|fiant|fieret|diceret|dicerent|dixisset|dixissent|veniret|venirent|faceret|facerent|haberet|haberent|ageret|agerent|veniat|veniant|mittat|mittant|uti|ne)\b/g],
  ['participles', 4, /\b[a-z]+(?:ntis|ntem|nte|ntes|ntium|ntibus)\b/g],
  ['gerundive', 2, /\b[a-z]+nd(?:us|a|um|i|o|ae|is|orum|arum)\b/g],
  ['passive-voice', 5, /\b[a-z]+(?:atur|antur|itur|untur|etur|entur|batur|bantur|bitur|buntur|retur|rentur)\b/g],
  ['imperfect-tense', 4, /\b[a-z]+(?:bat|bant|batur|bantur)\b/g],
  ['pluperfect-tense', 3, /\b[a-z]+(?:erat|erant|issem|isset|issent|averat|averant)\b/g],
  ['future-tense', 3, /\b[a-z]+(?:bit|bunt|bitur|buntur)\b/g],
  ['perfect-tense', 6, /\b[a-z]+(?:avit|avimus|averunt|evit|evimus|everunt|ivit|ivimus|iverunt|erunt)\b/g],
  ['comparison', 3, /\b[a-z]+(?:ior|ius|ioris|issimus|issima|issimum|issimi|issimae)\b/g],
  ['ablative-absolute', 2, /\b[a-z]+(?:o|a|is|ibus) [a-z]+(?:nte|ntibus|to|ta|tis)\b/g],
  ['indirect-statement', 2, /\b(?:dicit|dixit|dicunt|dixerunt|putat|putant|credit|credunt|arbitratur|arbitrantur|nuntiat|nuntiant|negat|negant|audit|audivit|sperat|sperant)\b[^.]*\b[a-z]+(?:are|ere|ire|isse|urum|uram)\b/g],
]

function readingGrammar(chapter) {
  const text = norm(readingsLatin(chapter))
  if (text.length < 120) return []
  const scores = []
  for (const [id, threshold, re] of LATIN_GRAMMAR_CUES) {
    const hits = (text.match(re) || []).length
    if (hits >= threshold) scores.push([id, hits])
  }
  return scores
    .sort((a, b) => b[1] - a[1] || GRAMMAR_DEF.get(a[0]).order - GRAMMAR_DEF.get(b[0]).order)
    .slice(0, 6)
    .map(([id]) => id)
}

function readingsLatin(chapter) {
  const parts = []
  for (const reading of chapter.readings || []) {
    parts.push(reading.latinTitle, reading.personae)
    parts.push(...(reading.paragraphs || []))
    for (const note of reading.notes || []) parts.push(note.term)
  }
  return parts.filter(Boolean).join(' ')
}

function readingsEnglish(chapter) {
  return (chapter.readings || [])
    .flatMap((reading) => [reading.title, ...(reading.notes || []).map((note) => note.gloss)])
    .filter(Boolean)
    .join(' ')
}

function vocabularyLatin(chapter) {
  return (chapter.vocabulary || []).map((entry) => entry.latin).filter(Boolean).join(' ')
}

function vocabularyEnglish(chapter) {
  return (chapter.vocabulary || [])
    .flatMap((entry) => [entry.english, entry.pos, entry.group])
    .filter(Boolean)
    .join(' ')
}

function titleText(chapter) {
  return [chapter.title, chapter.latinTitle, chapter.tagline].filter(Boolean).join(' ')
}

function metadataText(chapter) {
  return [chapter.overview].concat(chapter.objectives || []).filter(Boolean).join(' ')
}

function grammarTags(chapter) {
  const scores = new Map()
  const add = (text, weight) => {
    if (!text) return
    const haystack = norm(text)
    for (const [id, , pattern] of GRAMMAR_RULES) {
      if (pattern.test(haystack)) scores.set(id, (scores.get(id) || 0) + weight)
    }
  }

  const { strong } = grammarTitles(chapter)
  const sections = sectionHeadings(chapter)
  const blocks = sectionBlocks(chapter)
  add(metadataText(chapter), 3)
  add(strong, 3)
  add(sections.headings, 2)
  add(blocks.headings, 2)

  return [...scores.entries()]
    .filter(([, score]) => score >= 2)
    .sort((a, b) => b[1] - a[1] || GRAMMAR_DEF.get(a[0]).order - GRAMMAR_DEF.get(b[0]).order)
    .slice(0, 10)
    .map(([id]) => id)
}

function themeAnalysis(chapter) {
  const cueWeights = new Map()
  const matched = new Map()

  const add = (id, hits, weight) => {
    if (!hits.length) return
    const map = cueWeights.get(id) || new Map()
    const seen = matched.get(id) || new Set()
    for (const cue of hits) {
      map.set(cue, Math.max(map.get(cue) || 0, weight))
      seen.add(cue)
    }
    cueWeights.set(id, map)
    matched.set(id, seen)
  }

  const addEnglish = (text, weight) => {
    if (!text) return
    const haystack = words(text)
    for (const [id, , cues] of THEMES) {
      const hits = []
      THEME_CUE_RE.get(id).forEach((re, index) => {
        if (re.test(haystack)) hits.push(cues[index])
      })
      add(id, hits, weight)
    }
  }

  const addLatin = (text, weight) => {
    if (!text) return
    const haystack = words(text)
    const tokens = new Set(haystack.split(' ').filter(Boolean).map(latinStem))
    if (!tokens.size) return
    for (const [id, , cues] of THEMES) {
      const hits = []
      for (const cue of cues) {
        if (cue.includes(' ')) {
          if (haystack.includes(cue)) hits.push(cue)
        } else if (tokens.has(latinStem(cue)) || tokens.has(cue)) {
          hits.push(cue)
        }
      }
      add(id, hits, weight)
    }
  }

  addEnglish(vocabularyEnglish(chapter), 2)
  addEnglish(metadataText(chapter), 2)
  addEnglish(titleText(chapter), 6)
  addLatin(vocabularyLatin(chapter), 2)
  addEnglish(readingsEnglish(chapter), 2)
  addLatin(readingsLatin(chapter), 2)
  const blocks = sectionBlocks(chapter)
  addEnglish(blocks.prose, 1)
  addLatin(blocks.latin, 1)
  if (looksLatin(titleText(chapter))) addLatin(titleText(chapter), 6)

  // Score by distinct cues, not by how many fields mention the same cue.
  const scores = new Map()
  for (const [id, map] of cueWeights) {
    scores.set(id, [...map.values()].reduce((sum, value) => sum + value, 0))
  }
  const matchedLists = new Map([...matched].map(([id, set]) => [id, [...set]]))
  return { scores, matched: matchedLists }
}

function titleThemeIds(chapter) {
  const text = titleText(chapter)
  if (!text) return new Set()
  const haystack = words(text)
  const tokens = new Set(haystack.split(' ').filter(Boolean).map(latinStem))
  const latin = looksLatin(text)
  const ids = new Set()
  for (const [id, , cues] of THEMES) {
    for (const cue of cues) {
      const inEnglish = THEME_CUE_RE.get(id)[cues.indexOf(cue)].test(haystack)
      const inLatin = latin && !cue.includes(' ') && (tokens.has(latinStem(cue)) || tokens.has(cue))
      if (inEnglish || inLatin) {
        ids.add(id)
        break
      }
    }
  }
  return ids
}

function themeTags(chapter, inheritedThemeIds = []) {
  const { scores } = themeAnalysis(chapter)
  const titleThemes = titleThemeIds(chapter)
  const ranked = [...scores.entries()]
    .filter(([, score]) => score >= 3)
    .sort((a, b) => b[1] - a[1] || THEME_DEF.get(a[0]).order - THEME_DEF.get(b[0]).order)
    .map(([id]) => id)
  const own = [...new Set([...titleThemes, ...ranked])].slice(0, 6)

  const merged = [...new Set([...own, ...inheritedThemeIds])]
  return merged.slice(0, 8)
}

function detectAuthor(text, fallback) {
  const haystack = norm(text)
  const authors = [
    ['plautus', 'Plautus', /plaut/],
    ['cato', 'Cato', /\bcato\b/],
    ['phaedrus', 'Phaedrus', /phaedr/],
    ['tacitus', 'Tacitus', /tacit/],
    ['luke', 'Luke', /\blucas?\b|\bluke\b/],
    ['horace', 'Horace', /horat/],
    ['aulus-gellius', 'Aulus Gellius', /gellius/],
    ['cicero', 'Cicero', /cicer/],
    ['martial', 'Martial', /martial/],
    ['pliny', 'Pliny', /plin/],
    ['sallust', 'Sallust', /sallust/],
    ['caesar', 'Caesar', /caesar/],
    ['virgil', 'Vergil', /vergili|virgil/],
    ['ovid', 'Ovid', /ovid/],
    ['petronius', 'Petronius', /petron/],
  ]
  for (const [id, label, re] of authors) {
    if (re.test(haystack)) return { id, label }
  }
  return fallback
}

function textTypes(chapter, ctx) {
  const out = new Set()
  const title = norm([chapter.title, chapter.latinTitle, chapter.tagline].join(' '))
  const body = norm(readingsLatin(chapter))
  const bookId = ctx.book.id

  if (chapter.personae || (chapter.readings || []).some((r) => /\b[A-ZĀ-ſ][a-zā-ſ]+:\s*[“"]/.test((r.paragraphs || []).join(' ')))) {
    out.add('dialogue')
  }
  if (/colloquium|dialog/.test(title)) out.add('dialogue')
  if (/fabula|fable/.test(title) || bookId === 'fabulae-syrae') out.add('fable')
  if (/epistula|letter from|salutem dicit/.test(title) || /salutem dicit/.test(body)) out.add('letter')
  if (/evangelium|gospel/.test(title)) out.add('gospel')
  if (bookId === 'sermones-romani' && /acta martyrum|marty/.test(title)) out.add('acts')
  if (/historia|history/.test(title) || bookId === 'caesar-de-bello-gallico-vii') out.add('history')
  if (bookId === 'sallustius-cicero-catilina' && /sallust|catilinae coniuratione/i.test(norm(chapter.tagline))) out.add('history')
  if (/oratio|speech|in catilinam/.test(title)) out.add('speech')
  if (/comoedia|comedy/.test(title) || bookId === 'plautus-amphitryo') out.add('comedy')
  if (bookId === 'petronius-cena-trimalchionis') out.add('novel')
  if (bookId === 'petronius-cena-trimalchionis') out.add('satire')
  if (/titulus|inscriptio|cil\b|graffito/.test(title)) out.add('inscription')
  if (bookId === 'epitome-historiae-sacrae') out.add('paraphrase')
  if (bookId === 'sermones-romani') out.add('anthology')
  if (ctx.book.kind === 'commentary') out.add('commentary')
  if (ctx.book.kind === 'coursebook') out.add('coursebook')
  if (bookId.startsWith('exercitia')) out.add('exercise-book')
  if (bookId === 'familia-romana' || bookId === 'roma-aeterna' || bookId === 'colloquia-personarum' || bookId === 'fabulae-syrae' || bookId === 'sermones-romani' || bookId === 'epitome-historiae-sacrae') out.add('narrative')

  const verse = Boolean(chapter.verseCount) || /versus|carmen|poema|elegia|hexameter/.test(title) || bookId === 'vergil-aeneis-i-et-iv' || bookId === 'ovidii-ars-amatoria' || bookId === 'plautus-amphitryo'
  const hasReadings = (chapter.readings || []).length > 0
  if (verse) {
    out.add('poetry')
    out.add('verse')
  } else if (hasReadings || bookId === 'familia-romana' || bookId === 'roma-aeterna') {
    out.add('prose')
  }

  const hasLatinText = hasReadings || bookId.startsWith('exercitia') || bookId === 'familia-romana' || bookId === 'roma-aeterna' || bookId === 'learn-latin' || bookId === 'latin-via-ovid'
  if (hasLatinText && !['companion', 'companion-roma-aeterna'].includes(bookId)) {
    if (ORIGINAL_BOOK_IDS.includes(bookId)) {
      out.add('original-latin')
    } else {
      out.add('adapted-latin')
    }
  }
  if (['companion', 'companion-roma-aeterna', 'learn-latin', 'latin-via-ovid'].includes(bookId)) {
    out.add('english-explanation')
  }

  return [...out]
}

function skillTags(chapter, ctx) {
  const out = new Set()
  if ((chapter.readings || []).length) out.add('reading')
  if ((chapter.grammar || []).length || (chapter.sections || []).length) out.add('grammar')
  if ((chapter.vocabulary || []).length >= 4) out.add('vocabulary')
  if ((chapter.pensa || []).length) out.add('practice')

  const instructions = (chapter.pensa || []).map((p) => `${p.title || ''} ${p.instruction || ''}`).join(' ')
  if (/translat/i.test(instructions)) out.add('translation')
  if (/translate into latin|into latin|in latinum/i.test(instructions)) out.add('composition')

  if (chapter.verseCount || ctx.book.id === 'vergil-aeneis-i-et-iv' || ctx.book.id === 'ovidii-ars-amatoria' || ctx.book.id === 'catullus-carmina') out.add('scansion')
  if (ctx.book.kind === 'commentary') out.add('commentary')
  return [...out]
}

function levelFor(chapter, ctx) {
  const n = chapter.number
  const id = ctx.book.id
  const core = ctx.coreNumber || n

  if (['familia-romana', 'exercitia-latina', 'colloquia-personarum', 'fabulae-syrae', 'companion'].includes(id)) {
    if (core <= 10) return 'beginner'
    if (core <= 20) return 'elementary'
    if (core <= 28) return 'intermediate'
    return 'intermediate'
  }
  if (['roma-aeterna', 'exercitia-latina-ii', 'companion-roma-aeterna'].includes(id)) {
    return core <= 45 ? 'intermediate' : 'advanced'
  }
  if (id === 'learn-latin') {
    if (n <= 15) return 'beginner'
    if (n <= 35) return 'elementary'
    if (n <= 55) return 'intermediate'
    return 'advanced'
  }
  if (id === 'latin-via-ovid') {
    if (n <= 12) return 'beginner'
    if (n <= 25) return 'elementary'
    return 'intermediate'
  }
  if (ORIGINAL_BOOK_IDS.includes(id)) {
    return 'advanced'
  }
  if (id === 'sermones-romani' || id === 'epitome-historiae-sacrae') return 'intermediate'
  return 'intermediate'
}

function authorKey(value) {
  return norm(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/* ------------------------------------------------------------------ */
/* Build                                                               */
/* ------------------------------------------------------------------ */

const definitions = new Map()
const chapterKeywords = {}
const keywordIndex = {}
const stats = { chapters: 0, min: Infinity, max: 0, total: 0, byGroup: {} }

function addDefinition(id, group, label) {
  if (!definitions.has(id)) definitions.set(id, { group, label })
}

function addKeyword(list, id, group, label) {
  if (!id || list.includes(id)) return
  addDefinition(id, group, label)
  list.push(id)
}

const byId = new Map(books.map((entry) => [entry.book.id, entry]))
const coreBookByChapter = (bookId, number) => {
  if (bookId === 'familia-romana' || bookId === 'exercitia-latina' || bookId === 'colloquia-personarum' || bookId === 'fabulae-syrae' || bookId === 'companion') {
    return byId.get('familia-romana')?.chapters.find((c) => c.number === number)
  }
  if (bookId === 'roma-aeterna' || bookId === 'exercitia-latina-ii' || bookId === 'companion-roma-aeterna') {
    return byId.get('roma-aeterna')?.chapters.find((c) => c.number === number)
  }
  return null
}

const bookEntries = [],
  chapterRefs = []

for (const { book, chapters } of books) {
  for (const chapter of chapters) {
    const ctx = { book, chapter }
    const core = coreBookByChapter(book.id, chapter.number)
    ctx.coreNumber = core ? core.number : chapter.number
    chapterRefs.push({ book, chapter, ctx, core })
  }
}

// First pass: core grammar/themes, so reader and workbook chapters can inherit.
const coreData = new Map()
for (const { book, chapter, ctx } of chapterRefs) {
  if (!['familia-romana', 'roma-aeterna'].includes(book.id)) continue
  coreData.set(`${book.id}:${chapter.number}`, {
    grammar: grammarTags(chapter),
    themes: themeTags(chapter),
  })
}

for (const { book, chapter, ctx, core } of chapterRefs) {
  const id = chapter.slug
  const key = `${book.slug}/${id}`
  const tags = []

  const inherited = core && coreData.get(`${book.id === 'exercitia-latina-ii' || book.id === 'companion-roma-aeterna' ? 'roma-aeterna' : 'familia-romana'}:${core.number}`)

  // Grammar: keep the chapter's own topics first, then borrow a few from the
  // core course chapter. Cap the result so every page stays readable.
  const ownGrammar = grammarTags(chapter)
  const detectedGrammar = ownGrammar.length ? [] : readingGrammar(chapter)
  const inheritedGrammar = (inherited?.grammar || [])
    .filter((tag) => !ownGrammar.includes(tag))
    .slice(0, 4)
  const grammar = [...ownGrammar, ...detectedGrammar, ...inheritedGrammar].slice(0, 10)
  for (const tag of grammar) addKeyword(tags, `grammar:${tag}`, 'grammar', GRAMMAR_DEF.get(tag).label)

  // Themes
  const themes = themeTags(chapter, inherited?.themes || [])
  for (const tag of themes) addKeyword(tags, `theme:${tag}`, 'theme', THEME_DEF.get(tag).label)

  // Text type and register
  for (const tag of textTypes(chapter, ctx)) addKeyword(tags, `text:${tag}`, 'text', TEXT_LABELS[tag])

  // Skills
  for (const tag of skillTags(chapter, ctx)) addKeyword(tags, `skill:${tag}`, 'skill', SKILL_LABELS[tag])

  // Author and work
  const fallbackAuthor = { id: authorKey(book.author), label: book.author }
  const detectContentAuthor = book.id === 'sermones-romani' || book.id === 'sallustius-cicero-catilina'
  const author = detectContentAuthor
    ? detectAuthor([chapter.tagline, chapter.title].join(' '), fallbackAuthor)
    : fallbackAuthor
  if (author?.id) addKeyword(tags, `author:${author.id}`, 'author', author.label)
  addKeyword(tags, `work:${book.slug}`, 'work', book.title)

  // Level
  const level = levelFor(chapter, ctx)
  addKeyword(tags, `level:${level}`, 'level', LEVEL_LABELS[level])

  // Keep insertion order: grammar and theme labels are already ranked by
  // relevance, and the groups stay in a predictable order.

  chapterKeywords[key] = tags
  for (const tag of tags) {
    if (!keywordIndex[tag]) keywordIndex[tag] = []
    keywordIndex[tag].push(key)
  }

  stats.chapters += 1
  stats.total += tags.length
  stats.min = Math.min(stats.min, tags.length)
  stats.max = Math.max(stats.max, tags.length)
  for (const tag of tags) {
    const group = tag.split(':')[0]
    stats.byGroup[group] = (stats.byGroup[group] || 0) + 1
  }
}

if (process.env.DEBUG_KEYWORDS) {
  const key = process.env.DEBUG_KEYWORDS
  const ref = chapterRefs.find((r) => `${r.book.slug}/${r.chapter.slug}` === key)
  if (ref) {
    console.log('\nDEBUG', key)
    console.log('grammar titles:', grammarTitles(ref.chapter))
    const dbgCore = ref.core
    const dbgInherited = dbgCore && coreData.get(`${ref.book.id === 'exercitia-latina-ii' || ref.book.id === 'companion-roma-aeterna' ? 'roma-aeterna' : 'familia-romana'}:${dbgCore.number}`)
    console.log('inherited:', dbgInherited)
    {
      const t=titleText(ref.chapter); const hay=words(t); const toks=new Set(hay.split(' ').filter(Boolean).map(latinStem)); const lat=looksLatin(t);
      for (const [id,,cues] of THEMES) { const hits=[]; for (const cue of cues) { const en=THEME_CUE_RE.get(id)[cues.indexOf(cue)].test(hay); const la=lat && !cue.includes(' ') && (toks.has(latinStem(cue))||toks.has(cue)); if(en||la) hits.push(cue+(la?'(la)':'')) } if(hits.length) console.log(' title theme hit',id,hits.join(', ')) }
    }
    console.log('title themes:', [...titleThemeIds(ref.chapter)])
    console.log('own themes:', themeTags(ref.chapter))
    console.log('theme sources:', {
      title: titleText(ref.chapter),
      meta: metadataText(ref.chapter),
      vocabLatin: vocabularyLatin(ref.chapter).slice(0, 300),
      vocabEnglish: vocabularyEnglish(ref.chapter).slice(0, 300),
      readingsLatin: readingsLatin(ref.chapter).slice(0, 500),
      readingsEnglish: readingsEnglish(ref.chapter).slice(0, 300),
    })
    const analysis = themeAnalysis(ref.chapter)
    for (const [id, score] of [...analysis.scores.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(' theme', id, score, '::', analysis.matched.get(id).join(', '))
    }
  }
}

const sortedDefinitions = Object.fromEntries(
  [...definitions.entries()].sort(([a], [b]) => a.localeCompare(b)),
)
const sortedIndex = Object.fromEntries(
  Object.entries(keywordIndex).sort(([a], [b]) => a.localeCompare(b)),
)

const out = `// Generated by scripts/build-chapter-keywords.mjs — do not edit by hand.
// Every routable chapter page is labelled with canonical keywords:
// grammar:<id>, theme:<id>, text:<id>, skill:<id>, author:<id>,
// work:<id> and level:<id>. Use keywordDefinitions for labels and
// keywordIndex to group pages by keyword.

export const keywordGroups = ${JSON.stringify(GROUPS, null, 2)}

export const keywordDefinitions = ${JSON.stringify(sortedDefinitions)}

export const chapterKeywords = ${JSON.stringify(chapterKeywords)}

export const keywordIndex = ${JSON.stringify(sortedIndex)}

export default chapterKeywords
`

await writeFile(join(ROOT, 'src/data/chapter-keywords.generated.js'), out, 'utf8')

console.log('Wrote src/data/chapter-keywords.generated.js')
console.log(`chapters: ${stats.chapters}`)
console.log(`keywords per chapter: min ${stats.min}, max ${stats.max}, average ${(stats.total / stats.chapters).toFixed(1)}`)
console.log('definitions:', definitions.size)
console.log('indexed keywords:', Object.keys(sortedIndex).length)
console.log('chapters by group participation:', stats.byGroup)
console.log('books:', [...new Set(chapterRefs.map((r) => r.book.id))].length)
