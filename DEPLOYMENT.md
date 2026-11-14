# Avvio della candidata PELUFI
Sul server servono Node.js 24.22 o successivo compatibile con node:sqlite e un volume privato scrivibile. Da questa cartella eseguire:

    node server.mjs

Il server serve la cartella public e riceve il POST di ricerca sullo stesso dominio, su /api/quiz-research. La porta predefinita è 3000 su 127.0.0.1. Per una verifica automatica con un database temporaneo eseguire:

    node --test server.test.mjs

## Distribuzione
- Configurare HTTPS per pelufi.com e inoltrare sia le pagine sia l’endpoint a questo processo. Conservare l’header Host originario nel reverse proxy. HOST e PORT sono configurabili dall’ambiente.
- Impostare RESEARCH_DB su un percorso assoluto privato e persistente, fuori da public, con accesso limitato all’account del processo. Predefinito: private/research.sqlite. Un hosting esclusivamente statico può servire il quiz, ma non può raccogliere la ricerca senza questo endpoint o un servizio equivalente.
- Impostare il riavvio automatico del processo. Il server applicativo non registra richieste, IP, user agent o contenuto inviato. Configurare separatamente proxy/CDN e backup: escludere il corpo delle richieste dai log e limitare la retention delle copie private. Non pubblicare il database.
- Le righe contengono giorno UTC, lingua, risultato scelto, cinque punteggi, dieci punteggi delle sfere, dieci lettere A/B/C/D e categoria del risultato. Il server ricalcola i punteggi con la matrice del sito e verifica che il personaggio sia tra i primi. Nessun identificatore del visitatore. La ricerca non include la provenienza della campagna.
- RESEARCH_RETENTION_MONTHS accetta un numero intero positivo, predefinito 24. I record arrivati alla scadenza vengono eliminati all’avvio e poi ogni 24 ore mentre il processo è attivo; SQLite usa secure_delete. Un sistema di backup esterno richiede una policy coerente.
- L’endpoint rifiuta campi estranei e richieste prive del consenso esplicito. Il browser effettua un tentativo per quiz completato con consenso. Una richiesta fallita non viene ripetuta in automatico. Il dataset non identifica o collega tentativi di una stessa persona.
- Per verificare l’installazione senza mescolare verifiche e ricerca usare un database temporaneo. Confermare che una prova con consenso inserisca una riga e una prova senza consenso nessuna. Le analisi interne dovrebbero utilizzare aggregazioni, senza pubblicare righe individuali.
