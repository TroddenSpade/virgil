// Editorial note on the text and its source. This is not part of the
// ancient work; it records how the digital edition was assembled.

export const extras = [
  {
    "id": "de-textu",
    "slug": "de-textu",
    "title": "Note on the Text",
    "latinTitle": "DE TEXTV",
    "sections": [
      {
        "id": "sec-1",
        "latin": "DE TEXTV",
        "english": "Note on the text",
        "kind": "reference",
        "blocks": [
          {
            "t": "p",
            "text": "The Latin text follows the electronic edition at The Latin Library (https://www.thelatinlibrary.com/ovid/ovid.amor1.shtml)."
          },
          {
            "t": "p",
            "text": "The source does not mark vowel quantity. Macra in the running text are supplied editorially with the Alatius Latin Macronizer (https://alatius.com/macronizer/) and can be hidden with the Diacritics menu. The words, punctuation, and verse divisions are those of the source; the marks are editorial only."
          },
          {
            "t": "p",
            "text": "Source presentation markup has been normalized without changing the words: paired ++ signs are printed as parentheses, unpaired ++ markers are omitted, and words enclosed in ~...~ are shown in italics."
          },
          {
            "t": "table",
            "head": [
              "Source",
              "Details"
            ],
            "rows": [
              [
                "Text",
                "The Latin Library (https://www.thelatinlibrary.com/ovid/ovid.amor1.shtml)"
              ],
              [
                "Edition",
                "Digital edition after the Latin Library"
              ],
              [
                "Publisher",
                "The Latin Library"
              ],
              [
                "Year",
                "2026"
              ],
              [
                "Diacritics",
                "Editorial macra supplied with the Alatius Latin Macronizer"
              ]
            ]
          }
        ]
      }
    ]
  }
]

export default extras
