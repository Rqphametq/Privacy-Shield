export type Category =
  | 'PERSONNE' | 'ENTREPRISE' | 'LIEU'            // NER (Phase 2)
  | 'EMAIL' | 'TELEPHONE' | 'IBAN' | 'SIRET' | 'SIREN'
  | 'MONTANT' | 'URL' | 'IP' | 'BIC' | 'ADRESSE' | 'NIR' | 'NAISSANCE' | 'REFERENCE' | 'PROJET' | 'CHIFFRE' // regex (ENTREPRISE too, when a legal form is present)
  | 'PERSO'                                       // mot ajouté par l'utilisateur

/** Higher priority wins when spans overlap: manual > regex > ner. */
export type Source = 'manual' | 'regex' | 'ner'

export interface Span {
  start: number // inclusive, index in the original text
  end: number   // exclusive
  category: Category
  text: string
  source: Source
}
