// Editorial note on the text and its sources. This is not part of the ancient
// book; it records how the digital edition was assembled.

export const extras = [
  {
    id: 'de-textu',
    slug: 'de-textu',
    title: 'Note on the Text',
    latinTitle: 'DE TEXTV',
    sections: [
      {
        id: 'sec-1',
        latin: 'DE TEXTV',
        english: 'Note on the text',
        kind: 'reference',
        blocks: [
          {
            t: 'p',
            text:
              'The Latin text follows the electronic edition of Catullus at The Latin Library ' +
              '(thelatinlibrary.com/catullus.shtml). It has been checked against the Oxford Classical ' +
              'Texts edition of R. A. B. Mynors (Oxford University Press, 1958).',
          },
          {
            t: 'p',
            text:
              'The source does not mark vowel quantity, so the running text is printed without macra. ' +
              'Obvious electronic-text slips have been corrected where the Oxford text settles the reading; ' +
              'the surviving fragments are printed after Carmen CXVI.',
          },
          {
            t: 'table',
            rows: [
              ['Source', 'Details'],
              ['Text', 'The Latin Library, Catullus (thelatinlibrary.com/catullus.shtml)'],
              ['Edition', 'R. A. B. Mynors (ed.), Catulli Carmina, Oxford Classical Texts, 1958'],
              ['ISBN', '9780198146049'],
            ],
          },
        ],
      },
    ],
  },
]

export default extras
