import { describe, expect, it } from 'vitest'
import { detectRegex, findTerms, ibanValid, luhn } from './regex'
import { mergeSpans } from './spans'

const found = (text: string) => mergeSpans(detectRegex(text)).map(s => [s.category, s.text])

describe('checksums', () => {
  it('luhn', () => {
    expect(luhn('732829320')).toBe(true)
    expect(luhn('732829321')).toBe(false)
  })
  it('iban mod-97', () => {
    expect(ibanValid('FR76 3000 6000 0112 3456 7890 189')).toBe(true)
    expect(ibanValid('FR76 3000 6000 0112 3456 7890 188')).toBe(false)
  })
})

describe('detectRegex', () => {
  it('emails, without trailing punctuation', () => {
    expect(found('Écrire à jean.dupont+rh@acme-corp.fr.')).toEqual([['EMAIL', 'jean.dupont+rh@acme-corp.fr']])
  })

  it('french and international phones', () => {
    expect(found('Tél : 06 12 34 56 78, fixe 01.23.45.67.89, siège +33 1 42 68 53 00, UK +44 20 7946 0958'))
      .toEqual([
        ['TELEPHONE', '06 12 34 56 78'],
        ['TELEPHONE', '01.23.45.67.89'],
        ['TELEPHONE', '+33 1 42 68 53 00'],
        ['TELEPHONE', '+44 20 7946 0958'],
      ])
  })

  it('IBAN (valid only), FR and DE', () => {
    expect(found('IBAN FR76 3000 6000 0112 3456 7890 189 ou DE89370400440532013000'))
      .toEqual([['IBAN', 'FR76 3000 6000 0112 3456 7890 189'], ['IBAN', 'DE89370400440532013000']])
    // Bad checksum but exact French length: masked anyway (a mistyped IBAN is still personal data).
    expect(found('Ref FR76 3000 6000 0112 3456 7890 188')).toEqual([['IBAN', 'FR76 3000 6000 0112 3456 7890 188']])
  })

  it('SIRET wins over the SIREN it contains', () => {
    expect(found('SIRET 732 829 320 00074')).toEqual([['SIRET', '732 829 320 00074']])
    expect(found('SIREN : 732829320')).toEqual([['SIREN', '732829320']])
    expect(found('Dossier 123456789')).toEqual([]) // fails Luhn
  })

  it('amounts', () => {
    expect(found('Prix 12 500,00 € HT, acompte 3000 EUR, option $1,200 et 45 000 euros'))
      .toEqual([
        ['MONTANT', '12 500,00 €'],
        ['MONTANT', '3000 EUR'],
        ['MONTANT', '$1,200'],
        ['MONTANT', '45 000 euros'],
      ])
  })

  it('a reference number before an amount is not part of it', () => {
    expect(found("Selon l'article 3 500 € sont dus, art. 12 1 200 EUR, n° 7 45 000 euros"))
      .toEqual([['MONTANT', '500 €'], ['MONTANT', '1 200 EUR'], ['MONTANT', '45 000 euros']])
  })

  it('urls and IPs', () => {
    expect(found('Voir https://intranet.acme.fr/rh?id=4 (serveur 192.168.1.42), pas 999.1.1.1.'))
      .toEqual([['URL', 'https://intranet.acme.fr/rh?id=4'], ['IP', '192.168.1.42']])
  })

  it('returns exact indices', () => {
    const text = 'Contact: a@b.io'
    const [s] = detectRegex(text)
    expect(text.slice(s.start, s.end)).toBe('a@b.io')
  })
})

describe('findTerms', () => {
  it('whole-word, case-insensitive, regex-safe', () => {
    const spans = findTerms('Projet Apollo et apollo-2, pas Apollonius. C++ aussi.', ['apollo', 'C++', ' '])
    expect(spans.map(s => s.text)).toEqual(['Apollo', 'apollo', 'C++'])
  })
})

describe('contract identifiers and addresses', () => {
  it('SIREN/SIRET announced by their label are kept even if the checksum fails (fictitious or mistyped)', () => {
    expect(found('immatriculée au RCS de Lyon sous le numéro SIREN 842 117 396 (SIRET du siège : 842 117 396 00027)'))
      .toEqual([['SIREN', '842 117 396'], ['SIRET', '842 117 396 00027']])
    expect(found('RCS Nanterre 531 904 873')).toEqual([['SIREN', '531 904 873']])
    // No label, bad checksum: not a SIREN, but still masked as a business figure.
    expect(found('Dossier 842 117 396, page 2')).toEqual([['CHIFFRE', '842 117 396']])
  })

  it('IBAN announced by its label is kept even if the checksum fails; BIC after its label', () => {
    expect(found('IBAN : FR76 3000 4008 2700 0102 3456 789 – BIC : NVLSFRPPXXX.'))
      .toEqual([['IBAN', 'FR76 3000 4008 2700 0102 3456 789'], ['BIC', 'NVLSFRPPXXX']])
    expect(found('code BIC/SWIFT BNPAFRPP, OBLIGATIONS DES PARTIES')).toEqual([['BIC', 'BNPAFRPP']])
  })

  it('postal addresses: number, street, postcode and city', () => {
    expect(found('dont le siège social est situé 18 rue de la Barre, 69002 Lyon, représentée par'))
      .toEqual([['ADRESSE', '18 rue de la Barre, 69002 Lyon']])
    expect(found('42 avenue Jean Jaurès, 92110 Clichy (direction@x.example)'))
      .toEqual([['ADRESSE', '42 avenue Jean Jaurès, 92110 Clichy'], ['EMAIL', 'direction@x.example']])
    expect(found("domicilié 5 bis boulevard de l'Hôpital 75013 Paris Cedex 13. Fin"))
      .toEqual([['ADRESSE', "5 bis boulevard de l'Hôpital 75013 Paris Cedex 13"]])
    expect(found('Livraison au 3, place Bellecour à Lyon')).toEqual([['ADRESSE', '3, place Bellecour']])
    expect(found('Siège : 13008 Marseille.')).toEqual([['ADRESSE', '13008 Marseille']])
    expect(found('Article 12 rue des contrats')).toEqual([]) // no capitalised street name
  })

  it('company names carrying a legal form, before or after it', () => {
    expect(found('NOVALIS DIGITAL SOLUTIONS SAS, société par actions simplifiée'))
      .toEqual([['ENTREPRISE', 'NOVALIS DIGITAL SOLUTIONS SAS']])
    expect(found('ET\n\nGROUPE BELLECOUR LOGISTIQUE SARL, société'))
      .toEqual([['ENTREPRISE', 'GROUPE BELLECOUR LOGISTIQUE SARL']])
    expect(found('Entre la société Nexora Conseil SAS et la SARL Dupont & Fils.'))
      .toEqual([['ENTREPRISE', 'Nexora Conseil SAS'], ['ENTREPRISE', 'SARL Dupont & Fils']])
    expect(found('Pour le Prestataire\n\nACME SA')).toEqual([['ENTREPRISE', 'ACME SA']])
    expect(found('une SAS au capital de 10 €')).toEqual([['MONTANT', '10 €']])
  })
})

describe('more contract shapes (eval findings)', () => {
  it('social security number (NIR): valid key, or announced by its label', () => {
    expect(found('NIR 2 88 02 14 038 123 90.')).toEqual([['NIR', '2 88 02 14 038 123 90']])
    expect(found('numéro de sécurité sociale : 1 94 07 30 189 042 78')).toEqual([['NIR', '1 94 07 30 189 042 78']])
    // Wrong key, no label: not a NIR; only its 3-digit groups look like a figure.
    expect(found('Lot 1 94 07 30 189 042 78')).toEqual([['CHIFFRE', '30 189 042']])
  })

  it('birth dates after "né(e) le"', () => {
    expect(found('Madame Léa Garnier, née le 14 février 1988 à Grenoble, et M. X, né le 1er mars 1990 ; né le 03/07/1994'))
      .toEqual([['NAISSANCE', '14 février 1988'], ['NAISSANCE', '1er mars 1990'], ['NAISSANCE', '03/07/1994']])
  })

  it('company names: connectors after the legal form, English forms, never across a column gap', () => {
    expect(found('La SCI Les Tilleuls du Rhône, société civile')).toEqual([['ENTREPRISE', 'SCI Les Tilleuls du Rhône']])
    expect(found('For ORBITAL WAVE TECHNOLOGIES LTD                Pour Kestrel Analytique SASU'))
      .toEqual([['ENTREPRISE', 'ORBITAL WAVE TECHNOLOGIES LTD'], ['ENTREPRISE', 'Kestrel Analytique SASU']])
  })

  it('addresses with CS/BP and a Cedex number', () => {
    expect(found('Parc de la Chantrerie, 2 rue Alfred Kastler, CS 20722, 44307 Nantes Cedex 3, représentée'))
      .toEqual([['ADRESSE', 'Parc de la Chantrerie'], ['ADRESSE', '2 rue Alfred Kastler, CS 20722, 44307 Nantes Cedex 3']])
    expect(found('Envoi : BP 120, 69300 Caluire')).toEqual([['ADRESSE', '69300 Caluire']])
  })
})

describe('contract eval, round 2', () => {
  it('IBAN after "compte"/"RIB", or with its country length, even with a bad checksum', () => {
    expect(found('sur le compte bancaire FR76 1027 8089 1200 0204 5310 147 dont il a fourni le RIB'))
      .toEqual([['IBAN', 'FR76 1027 8089 1200 0204 5310 147']])
    expect(found('prélevé : FR76 1470 7000 0131 0219 4567 841.')).toEqual([['IBAN', 'FR76 1470 7000 0131 0219 4567 841']])
    expect(found('Code FR76 1470 7000')).toEqual([]) // too short for a French IBAN
  })

  it('SIREN after "registre du commerce et des sociétés de <ville> sous le numéro"', () => {
    expect(found('immatriculée au registre du commerce et des sociétés de Montpellier sous le numéro 523 789 104, code APE'))
      .toEqual([['SIREN', '523 789 104']])
  })

  it('references announced by n°, numéro, réf., company number', () => {
    expect(found('contrat n° 77-4521-B auprès de la MAIF ; Réf. NDS-GBL-2026-117 ; company number 09876543, article n° 12'))
      .toEqual([['REFERENCE', '77-4521-B'], ['REFERENCE', 'NDS-GBL-2026-117'], ['REFERENCE', '09876543']])
  })

  it('UK postcodes and business parks are addresses', () => {
    expect(found('221 Baker Street, London NW1 6XE, United Kingdom')).toEqual([['ADRESSE', 'NW1 6XE']])
    expect(found("DATAVET, Parc d'activités de la Chantrerie, 2 rue Alfred Kastler"))
      .toEqual([['ADRESSE', "Parc d'activités de la Chantrerie"], ['ADRESSE', '2 rue Alfred Kastler']])
    expect(found('ZI des Grands Prés')).toEqual([['ADRESSE', 'ZI des Grands Prés']])
  })
})

describe('blind eval findings (regex)', () => {
  it('named residences and cadastral parcels', () => {
    expect(found('demeurant Résidence Les Hortensias, bâtiment C')).toEqual([['ADRESSE', 'Résidence Les Hortensias']])
    expect(found('figurant au cadastre section AB numéro 412 pour une contenance')).toEqual([['REFERENCE', 'section AB numéro 412']])
  })
})

describe('user contracts (Bail_commercial, Contrat_distribution_exclusive)', () => {
  it('a reference made of spaced groups after n°', () => {
    expect(found('carte professionnelle n° CPI 3301 2019 000 041 207), représenté'))
      .toEqual([['REFERENCE', 'CPI 3301 2019 000 041 207']])
    expect(found('le lot n° 2, la cave (lot n° 7) ; n° 1234 LE BAILLEUR')).toEqual([['REFERENCE', '1234']])
  })

  it('a phone number does not swallow the closing parenthesis around it', () => {
    expect(found('(k.benali@x.example, +33 6 21 45 87 30).')).toEqual([['EMAIL', 'k.benali@x.example'], ['TELEPHONE', '+33 6 21 45 87 30']])
    expect(found('UK +44 (20) 7946 0958')).toEqual([['TELEPHONE', '+44 (20) 7946 0958']])
  })
})

describe('internal documents (Doc1–Doc5)', () => {
  it('references containing a slash', () => {
    expect(found('Réf. : LUM/GAR-2026-044 À l’attention')).toEqual([['REFERENCE', 'LUM/GAR-2026-044']])
  })

  it('project codenames, in any case, with or without quotes', () => {
    expect(found('Projet « COLIBRI » – Acquisition ; CONFIDENTIEL – PROJET COLIBRI ; Projet Colibri – Société cible'))
      .toEqual([['PROJET', 'COLIBRI'], ['PROJET', 'COLIBRI'], ['PROJET', 'Colibri']])
    expect(found('le présent projet de loi, (le « Projet »)')).toEqual([])
  })
})

describe('business figures without a currency (CHIFFRE)', () => {
  it('percentages, multiples, quantities of people or surface', () => {
    expect(found('38 suppressions de postes sur 219 salariés (17 %), marge de 7,7 % et +26 % en 2025, multiple de 14,8x, 86 m²'))
      .toEqual([['CHIFFRE', '38'], ['CHIFFRE', '219'], ['CHIFFRE', '17 %'], ['CHIFFRE', '7,7 %'], ['CHIFFRE', '+26 %'],
        ['CHIFFRE', '14,8x'], ['CHIFFRE', '86']])
  })

  it('numbers with thousands separators, and numbers alone in a table cell', () => {
    expect(found("Chiffre d'affaires 14 200 17 900 20 400")).toEqual([['CHIFFRE', '14 200'], ['CHIFFRE', '17 900'], ['CHIFFRE', '20 400']])
    expect(found('Production\n118\n22\nTotal\n219')).toEqual([['CHIFFRE', '118'], ['CHIFFRE', '22'], ['CHIFFRE', '219']])
  })

  it('leaves article numbers, dates, durations, votes and amounts to their own rules', () => {
    expect(found('Article 12, le 30 juin 2027, douze (12) mois, 5 voix pour, page 2, en 2025, article 3 500 € dus')).toEqual([['MONTANT', '500 €']])
    expect(found('Prix 12 500,00 € HT')).toEqual([['MONTANT', '12 500,00 €']])
  })
})
