const legalOwner = {
  name: 'Lorenzo Pelosi',
  brand: 'PELUFI',
  publicAddress: '',
  city: 'Málaga',
  country: 'España',
  taxId: '',
  email: 'hello@pelufi.com'
};

const infoCopy = {
  en: {
    privacy: [
      'Privacy', 'What stays in your browser',
      'Your language preference is saved in this browser. Your answers and progress are saved in this tab so you can refresh the page and continue. You can remove them by clearing site data.',
      'Your result and sharing',
      'Your browser calculates your match and creates your result image. A shared link contains the character and language. Opening a social link or sharing a file takes you to the platform you choose.',
      'Anonymous quiz research',
      'Participation is optional. The research box starts unchecked. You can play the whole quiz, get the same result and share it whichever option you choose. We ask for neither your name nor your email.',
      'What is shared',
      'Only if you opt in and finish the quiz do we collect a record with the date, quiz language, ten answers, character and trait scores, result character and type of result. We use no research cookie or persistent visitor ID to link attempts.',
      'How the answers are used',
      'We study answers in aggregate to improve the quiz, understand character affinities, develop characters and stories, plan content and future projects or products, and conduct marketing research. We do not use the answers to identify or contact anyone, create individual advertising profiles or target ads.'
    ],
    legal: [
      'Legal notice', 'About PELUFI',
      'PELUFI is a fictional character universe. The quiz is a game for entertainment. Its character affinities are based on the answers you choose.',
      'Intellectual and industrial property',
      'The original PELUFI characters, illustrations and texts are protected by intellectual property rights. The brand, logos and other distinctive signs are subject to applicable industrial property rights. For permission to reuse this material, contact the site owner.',
      'External platforms',
      'The social links lead to independent platforms. Their own terms apply when you use their services.',
      'Limitations of the quiz',
      'Your result is a playful interpretation of your choices. It is not a professional assessment. The site owner does not control the availability or content of external platforms. This notice does not limit rights or liability that cannot be excluded by law.'
    ],
    owner: 'Site owner', name: 'Owner', brand: 'Brand', location: 'Location', address: 'Address', taxId: 'Tax ID', contact: 'Contact',
    home: 'Meet the five PELUFI and their companions, then discover your match.',
    quiz: 'Take the ten-question PELUFI personality quiz and discover your character.'
  },
  it: {
    privacy: [
      'Privacy', 'Cosa resta nel browser',
      'La preferenza di lingua viene salvata nel browser. Le risposte e i progressi vengono salvati in questa scheda, così puoi ricaricare la pagina e continuare. Puoi rimuoverli cancellando i dati del sito.',
      'Risultato e condivisione',
      'Il browser calcola il risultato e crea la tua immagine. Il link condiviso contiene il personaggio e la lingua. I link social e la condivisione di file aprono la piattaforma che scegli.',
      'Ricerca anonima sul quiz',
      'La partecipazione è facoltativa. La casella per la ricerca è deselezionata all’inizio. Puoi fare tutto il quiz, ottenere lo stesso risultato e condividerlo anche se decidi di non partecipare. Non chiediamo il tuo nome né la tua email.',
      'Cosa viene condiviso',
      'Solo se scegli di partecipare e completi il quiz raccogliamo una scheda con la data, la lingua del quiz, le dieci risposte, i punteggi dei personaggi e delle sfere, il personaggio ottenuto e il tipo di risultato. Non usiamo cookie di ricerca o identificativi persistenti per collegare più partite.',
      'Come utilizziamo le risposte',
      'Analizziamo le risposte in forma aggregata per migliorare il quiz, capire le affinità con i personaggi, sviluppare personaggi e storie, pianificare contenuti e futuri progetti o prodotti e condurre ricerche di marketing. Non usiamo le risposte per identificare o contattare le persone, creare profili pubblicitari individuali o indirizzare annunci.'
    ],
    legal: [
      'Note legali', 'Il mondo PELUFI',
      'PELUFI è un universo di personaggi di fantasia. Il quiz è un gioco di intrattenimento. Le affinità con i personaggi dipendono dalle risposte che scegli.',
      'Proprietà intellettuale e industriale',
      'I personaggi originali PELUFI, le illustrazioni e i testi sono tutelati dai diritti di proprietà intellettuale. Al marchio, ai loghi e agli altri segni distintivi si applicano i diritti di proprietà industriale previsti dalla legge. Per riutilizzare questi materiali puoi richiedere l’autorizzazione al titolare del sito.',
      'Piattaforme esterne',
      'I collegamenti social portano a piattaforme indipendenti. Quando usi i loro servizi si applicano le rispettive condizioni.',
      'Limiti del quiz',
      'Il risultato interpreta le tue scelte per gioco e non costituisce una valutazione professionale. I contenuti e la disponibilità delle piattaforme esterne non dipendono dal titolare del sito. Restano fermi i diritti e le responsabilità che la legge non consente di escludere.'
    ],
    owner: 'Titolare del sito', name: 'Titolare', brand: 'Marchio', location: 'Località', address: 'Indirizzo', taxId: 'Identificativo fiscale', contact: 'Contatti',
    home: 'Conosci i cinque PELUFI e i loro amici, poi scopri a quale assomigli.',
    quiz: 'Scopri il tuo personaggio PELUFI rispondendo a dieci domande.'
  },
  es: {
    privacy: [
      'Privacidad', 'Qué se guarda en tu navegador',
      'Tu preferencia de idioma se guarda en este navegador. Tus respuestas y tu progreso se guardan en esta pestaña para que puedas recargar la página y continuar. Puedes eliminarlos borrando los datos del sitio.',
      'Tu resultado y cómo compartirlo',
      'Tu navegador calcula el resultado y crea tu imagen. El enlace compartido contiene el personaje y el idioma. Al abrir un enlace social o compartir un archivo, accedes a la plataforma que eliges.',
      'Investigación anónima del quiz',
      'La participación es opcional. La casilla de investigación está desmarcada al principio. Puedes completar el quiz, obtener el mismo resultado y compartirlo aunque decidas no participar. No te pedimos ni tu nombre ni tu correo electrónico.',
      'Qué se comparte',
      'Solo si decides participar y terminas el quiz recogemos un registro con la fecha, el idioma del quiz, tus diez respuestas, las puntuaciones de los personajes y los rasgos, el personaje obtenido y el tipo de resultado. No usamos cookies de investigación ni identificadores persistentes para vincular distintas partidas.',
      'Cómo utilizamos las respuestas',
      'Analizamos las respuestas de forma agregada para mejorar el quiz, entender la afinidad con los personajes, desarrollar personajes e historias, planificar contenidos y futuros proyectos o productos y realizar estudios de marketing. No usamos las respuestas para identificar o contactar con personas, crear perfiles publicitarios individuales ni dirigir anuncios.'
    ],
    legal: [
      'Aviso legal', 'El mundo PELUFI',
      'PELUFI es un universo de personajes de ficción. El quiz es un juego de entretenimiento. La afinidad con cada personaje depende de las respuestas que eliges.',
      'Propiedad intelectual e industrial',
      'Los personajes originales de PELUFI, las ilustraciones y los textos están protegidos por derechos de propiedad intelectual. La marca, los logotipos y otros signos distintivos están sujetos a los derechos de propiedad industrial aplicables. Para reutilizar estos materiales puedes solicitar autorización al titular del sitio.',
      'Plataformas externas',
      'Los enlaces sociales llevan a plataformas independientes. Al usar sus servicios se aplican sus propias condiciones.',
      'Límites del quiz',
      'El resultado es una interpretación lúdica de tus elecciones y no constituye una evaluación profesional. El titular del sitio no controla el contenido ni la disponibilidad de las plataformas externas. Este aviso no limita los derechos ni la responsabilidad que la ley no permite excluir.'
    ],
    owner: 'Titular del sitio', name: 'Titular', brand: 'Marca', location: 'Localidad', address: 'Domicilio', taxId: 'NIF', contact: 'Contacto',
    home: 'Conoce a los cinco PELUFI y sus amigos y descubre a quién te pareces.',
    quiz: 'Descubre tu personaje PELUFI con un quiz de diez preguntas.'
  }
};

function renderInfoPage(lang) {
  const main = document.querySelector('main');
  const section = main.dataset.page;
  if (!section) return false;
  const copy = infoCopy[lang];
  const article = document.createElement('article');
  article.className = 'info-page';
  copy[section].forEach((text, index) => {
    const node = document.createElement(index === 0 ? 'h1' : index % 2 ? 'h2' : 'p');
    node.textContent = text;
    article.append(node);
  });
  if (section === 'legal') {
    const heading = document.createElement('h2');
    heading.textContent = copy.owner;
    article.append(heading);
    for (const [label, value] of [
      [copy.name, legalOwner.name], [copy.brand, legalOwner.brand],
      [copy.location, [legalOwner.city, legalOwner.country].filter(Boolean).join(', ')],
      [copy.address, legalOwner.publicAddress], [copy.taxId, legalOwner.taxId]
    ]) {
      if (!value.trim()) continue;
      const row = document.createElement('p');
      const field = document.createElement('strong');
      field.textContent = label + ': ';
      row.append(field, value);
      article.append(row);
    }
  }
  const contact = document.createElement('h2');
  contact.textContent = copy.contact;
  const link = document.createElement('a');
  link.href = 'mailto:' + legalOwner.email;
  link.textContent = legalOwner.email;
  article.append(contact, link);
  main.replaceChildren(article);
  return true;
}
function updatePageMeta(lang){
 const type=document.querySelector('main').dataset.page;
 const route=type?'/'+type+'/':document.querySelector('#quiz-root')?'/quiz/':'/';
 const title=type?infoCopy[lang][type][0]+' · PELUFI':document.title;
 const desc=type?infoCopy[lang][type][2]:infoCopy[lang][route==='/'?'home':'quiz'];
 document.title=title;document.querySelector('meta[name=description]').content=desc;
 for(const [key,value] of Object.entries({title,description:desc,url:'https://pelufi.com'+route+'?lang='+lang}))document.querySelector('meta[property="og:'+key+'"]').content=value;
 document.querySelector('link[rel=canonical]').href='https://pelufi.com'+route+'?lang='+lang;
}

