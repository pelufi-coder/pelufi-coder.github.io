# PELUFI.COM — Rapporto QA finale
Ambito: candidata locale V4.1.1 con le modifiche di lancio. Nessuna verifica sul dominio pubblico.

## Percorsi e funzioni
| Area | Risultato |
|---|---|
| HOME / HEADER / TOP SOCIAL STRIP / LANGUAGE SELECTOR | PASS |
| HERO / HOME INTRO / MEET THE PELUFI / VAMJOLIE WORDMARK | PASS |
| PELUFI + FRIENDS / BRUCETTO + DORINA CANON / DOLMI + NENO CANON | PASS |
| OBSOLETE HONEY TEXT | ZERO FOUND |
| QUIZ / QUIZ PELUFI WORDMARK | PASS |
| CLEAR WINNER / NEAR TIE / 2-WAY TIE / MULTI-TIE | PASS |
| PELUFI AFFINITY RADAR / 10-TRAIT RADAR / RADAR NODE SIZE | PASS |
| INSTAGRAM SHARE / TIKTOK SHARE / FACEBOOK SHARE | PASS (interfacce di condivisione simulate, nessun post inviato) |
| SAVE IMAGE / COPY LINK | PASS |
| SOCIAL FOLLOW / FOOTER / PRIVACY / MOBILE | PASS |
| ACCESSIBILITY | PASS per etichetta, tastiera, modale, chiusura, ritorno del focus e link Privacy |
| PERFORMANCE | PASS per peso delle modifiche e assenza di nuove librerie client. Nessuna misura di latenza su hosting pubblico. |
| ASSET AUDIT | PASS; tutti gli asset corrispondono byte per byte alla V4.1.1 |

## Ricerca e responsive
Chrome su 320, 375, 390, 430, 768, 1280 e 1440 px, con prove EN/IT/ES. Nessuno sforamento orizzontale rilevato nelle schermate controllate. Verificati i dieci passaggi, cambio lingua, ripresa, risultato, sigle e nodi dei radar, esportazioni 1080×1350 e 1080×1920 e nuovo tentativo con consenso deselezionato.
- Due percorsi senza consenso: zero invii. Un percorso con revoca: zero invii.
- Tre percorsi con consenso: una riga per completamento; il ricaricamento del risultato non duplica le righe.
- Errore 503 simulato: risultato, radar e condivisione disponibili, nessuna riga registrata.
- Test separato HTTP con SQLite temporaneo: verificati quattro tipi di risultato, rigetto dei campi extra e del consenso falso, ricalcolo punteggi, scadenza a 24 mesi e accesso al quiz con database indisponibile.
- Nessun collegamento tra tentativi; il dataset non comprende la provenienza della campagna (campo facoltativo). Il server deve rimanere in esecuzione per la pulizia periodica. Ripete la pulizia all’avvio.

## Stato legale e privacy
| Voce | Stato |
|---|---|
| OWNER NAME | Lorenzo Pelosi |
| BRAND | PELUFI |
| CITY / COUNTRY | Málaga, España |
| PUBLIC EMAIL | hello@pelufi.com |
| ADMIN EMAIL PUBLICLY EXPOSED | NO |
| PUBLIC PHONE | NO |
| PUBLIC FULL ADDRESS | OWNER ACTION REQUIRED |
| NIF/NIE | OWNER ACTION REQUIRED |
| LEGAL OWNER DETAILS | OWNER ACTION REQUIRED |
| QUIZ RESEARCH | ENABLED |
| QUIZ RESEARCH PARTICIPATION | OPTIONAL |
| DEFAULT RESEARCH CONSENT | UNCHECKED |
| QUIZ WORKS WITHOUT RESEARCH | YES |
| ANONYMOUS RESEARCH SUBMISSION WITHOUT OPT-IN | ZERO |
| PERSONALLY IDENTIFYING QUIZ DATA | NONE INTENTIONALLY COLLECTED |
| PERSISTENT QUIZ USER ID | NONE |
| QUIZ RESEARCH COOKIE | NONE |
| INDIVIDUAL ADVERTISING PROFILING | DISABLED |
| META PIXEL | DISABLED |
| TIKTOK PIXEL | DISABLED |
| GOOGLE ANALYTICS | DISABLED |
| PRIVACY POLICY UPDATED | YES |

**LEGAL OWNER DETAILS — OWNER ACTION REQUIRED**. Confermare indirizzo pubblico completo e identificativo fiscale. I due campi sono vuoti nella configurazione e omessi dalle pagine pubbliche.
