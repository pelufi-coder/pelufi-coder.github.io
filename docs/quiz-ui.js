/* PELUFI quiz — the canonical data and scoring are supplied by quiz-data.js. */
(() => {
  'use strict';
  const registry=Object.fromEntries(window.PELUFI_CAST.map(p=>[p.id,p]));
  const characters=Object.keys(registry);
  const accents = { brucetto: '#ffb56e', vamjolie: '#f7a0bd', dolmi: '#98cebf', enrita: '#8cd8d6', bartholoo: '#a5bdff' };
  const text = {
    en: {
      title: 'Which of the PELUFI Are You?', intro: 'Ten questions, a few ridiculous situations, and one very PELUFI result!',
      start: 'Start the quiz', steps: '10 questions', back: 'Back', number: 'Question', choose: 'Choose one answer',
      confirmed: 'Answer selected', result: 'You’re', share: 'Share result', save: 'Save image', copy: 'Copy link', retake: 'Retake quiz',
      meet: 'Meet the other PELUFI', traits: 'Your traits', shared: 'Ready to share', copied: 'Link copied', saved: 'Image downloaded',
      fallback: 'Copy this link to share your result.', noData: 'The quiz is coming soon.', noResult: 'Result unavailable.',
      imageError: 'The image could not be prepared. Try again or copy your result link.', shareError: 'Sharing could not be opened. You can save the image or copy the link.',
      previous: 'Previous question', imageOf: 'Portrait of', group: 'The five PELUFI and their friends', shareTitle: 'My PELUFI match',
    },
    es: {
      title: '¿Cuál de los PELUFI eres?', intro: '¡Diez preguntas, unas cuantas situaciones absurdas y un resultado muy PELUFI!',
      start: 'Empezar el quiz', steps: '10 preguntas', back: 'Atrás', number: 'Pregunta', choose: 'Elige una respuesta',
      confirmed: 'Respuesta seleccionada', result: 'Eres', share: 'Compartir resultado', save: 'Guardar imagen', copy: 'Copiar enlace', retake: 'Repetir el quiz',
      meet: 'Conoce a los demás PELUFI', traits: 'Tus rasgos', shared: 'Listo para compartir', copied: 'Enlace copiado', saved: 'Imagen descargada',
      fallback: 'Copia este enlace para compartir tu resultado.', noData: 'El quiz estará disponible pronto.', noResult: 'Resultado no disponible.',
      imageError: 'No se ha podido preparar la imagen. Inténtalo de nuevo o copia el enlace.', shareError: 'No se ha podido compartir. Puedes guardar la imagen o copiar el enlace.',
      previous: 'Pregunta anterior', imageOf: 'Retrato de', group: 'Los cinco PELUFI con sus amigos', shareTitle: 'Mi resultado PELUFI',
    },
    it: {
      title: 'Quale dei PELUFI sei tu?', intro: 'Dieci piccole scelte. Cinque PELUFI diversissimi. In quale ti riconosci?',
      start: 'Inizia il quiz', steps: '10 domande', back: 'Indietro', number: 'Domanda', choose: 'Scegli una risposta',
      confirmed: 'Risposta selezionata', result: 'Sei', share: 'Condividi il risultato', save: 'Salva immagine', copy: 'Copia link', retake: 'Rifai il quiz',
      meet: 'Scopri gli altri PELUFI', traits: 'I tuoi tratti', shared: 'Pronto da condividere', copied: 'Link copiato', saved: 'Immagine scaricata',
      fallback: 'Copia questo link per condividere il risultato.', noData: 'Il quiz sarà disponibile a breve.', noResult: 'Risultato non disponibile.',
      imageError: 'Impossibile preparare l’immagine. Riprova o copia il link al risultato.', shareError: 'Impossibile aprire la condivisione. Puoi salvare l’immagine o copiare il link.',
      previous: 'Domanda precedente', imageOf: 'Ritratto di', group: 'I cinque PELUFI con i loro amici', shareTitle: 'Il mio risultato PELUFI',
    }
  };
  const extra = {
    en:{pick:'Choose your PELUFI',why:'Your answers put these PELUFI close together. Pick the one you feel closest to.',traits:'Your ten traits',cast:'Your PELUFI scores'},
    es:{pick:'Elige tu PELUFI',why:'Tus respuestas sitúan a estos PELUFI muy cerca. Elige con cuál te identificas más.',traits:'Tus diez rasgos',cast:'Tus puntuaciones PELUFI'},
    it:{pick:'Scegli il tuo PELUFI',why:'Le tue risposte avvicinano questi PELUFI. Scegli quello in cui ti riconosci di più.',traits:'I tuoi dieci tratti',cast:'I tuoi punteggi PELUFI'}
  };
  const sessionKey = 'pelufi.quiz.launch.v1';
  let state = { screen: 'entry', index: 0, answers: [], match: null };
  let lang = 'en', initialized = false, pending = false, timer, imageJob;
  const data = () => window.PELUFI_QUIZ;
  const nameOf = key => registry[key]?.name || key;
  const art = (key, type) => registry[key][type==='logo'?'wordmark':'solo'];
  const t = () => text[lang];
  const root = () => document.getElementById('quiz-root');
  const el = (tag, cls, content) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (content != null) node.textContent = content;
    return node;
  };
  function img(src, alt, cls) {
    const node = el('img', cls); node.src = src; node.alt = alt; return node;
  }
  function btn(title, fn, cls) {
    const node = el('button', cls, title); node.type = 'button'; node.addEventListener('click', fn); return node;
  }
  function meetLink() {
    const node = el('a', 'pq-link', t().meet); node.href = '/?lang=' + lang + '#meet'; return node;
  }
  function ready() {
    const q = data()?.questions?.[lang];
    return data()?.ready === true && typeof data().score === 'function' && q?.length === 10 &&
      q.every(item => typeof item.text === 'string' && item.answers?.length === 4);
  }
  function storeState() {
    try { sessionStorage.setItem(sessionKey, JSON.stringify(state)); } catch {}
  }
  function restore() {
    const match = new URL(location.href).searchParams.get('match');
    if (characters.includes(match)) { state.screen = 'result'; state.match = match; return; }
    try {
      const old = JSON.parse(sessionStorage.getItem(sessionKey));
      if (old?.screen === 'question' && Number.isInteger(old.index) && old.index >= 0 && old.index < 10 &&
        Array.isArray(old.answers) && old.answers.length <= 10 && old.answers.length >= old.index &&
        old.answers.every(a => Number.isInteger(a) && a >= 0 && a < 4)) state = old;
      if (['result','choice','finished'].includes(old?.screen) && (['choice','finished'].includes(old.screen) || characters.includes(old.match)) && old.answers?.length === 10 &&
        old.answers.every(a => Number.isInteger(a) && a >= 0 && a < 4) && ready() && (['choice','finished'].includes(old.screen) || data().tally?.(old.answers)?.leaders.includes(old.match) )) state = old;
      if(old?.screen==='result' && state.screen==='entry' && Array.isArray(old.answers) && old.answers.length===10){const scores=data().tally(old.answers);state={...old,match:scores.leaders.length===1?scores.leaders[0]:null,screen:scores.leaders.length===1?'result':'choice'};}
    } catch {}
  }
  function move(focus=true) {
    storeState(); draw();
    if (focus) root()?.querySelector('[data-pq-heading]')?.focus({preventScroll:true});
    if (focus && root() && root().getBoundingClientRect().top < -70) root().scrollIntoView({block:'start'});
  }
  function heading(label, cls='') {
    const h = el('h1', cls, label); h.tabIndex = -1; h.dataset.pqHeading = ''; return h;
  }
  function begin() {
    const url = new URL(location.href); url.searchParams.delete('match'); history.replaceState(null,'',url);
    state = {screen:'question',index:0,answers:[],match:null,researchConsent:state.researchConsent === true}; move();
  }
  function researchBox() {
    const copy = researchCopy[lang];
    const box = el('div', 'research-box');
    const label = el('label');
    const checkbox = el('input');
    checkbox.type = 'checkbox';
    checkbox.checked = state.researchConsent === true;
    checkbox.onchange = () => { state.researchConsent = checkbox.checked; storeState(); };
    label.append(checkbox, document.createTextNode(copy.checkbox));
    const dialog = el('dialog', 'research-dialog');
    const title = el('h2', '', copy.title);
    title.id = 'research-dialog-title';
    dialog.setAttribute('aria-labelledby', title.id);
    const trigger = btn(copy.trigger, () => dialog.showModal(), 'research-trigger');
    trigger.setAttribute('aria-haspopup', 'dialog');
    const close = btn(copy.close, () => dialog.close(), 'pq-secondary');
    const privacy = el('a', '', copy.privacy);
    privacy.href = '/privacy/?lang=' + lang;
    dialog.append(title, ...copy.paragraphs.map(line => el('p', '', line)), privacy, close);
    dialog.addEventListener('close', () => trigger.focus());
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      if (event.shiftKey && document.activeElement === privacy) { event.preventDefault(); close.focus(); }
      if (!event.shiftKey && document.activeElement === close) { event.preventDefault(); privacy.focus(); }
    });
    box.append(el('strong', '', copy.heading), label, trigger, dialog);
    return box;
  }
  function finishWithMatch(id) {
    state.match = id;
    state.screen = 'result';
    quizAnalytics.submit(state, lang);
    move();
  }
  function entry() {
    const box = el('section','pq-entry');
    const visual = el('div','pq-entry-art');
    visual.append(img('/assets/group-small.webp',t().group,'pq-group'));
    const body = el('div','pq-entry-copy'); const meta = el('p','pq-meta',t().steps);
    const cp=data().screens[lang], more=el('details','pq-rules');
    more.append(el('summary','',{it:'Come funziona',en:'How to play',es:'Cómo funciona'}[lang]));
    cp.intro.slice(1).forEach(line=>more.append(el('p','',line)));
    const title = heading('');
    const [before, after] = t().title.split('PELUFI');
    title.append(before, img('/assets/logo.webp', 'PELUFI', 'quiz-title-wordmark'), after);
    body.append(meta,title,el('p','pq-intro',cp.intro[0]),more,researchBox());
    if (ready()) body.append(btn(t().start,begin,'pq-primary'));
    else body.append(el('p','pq-notice',t().noData),meetLink());
    box.append(body,visual);return box;
  }
  function answer(index, options) {
    if (pending) return;
    pending=true;state.answers[state.index]=index;storeState();
    options.forEach((b,i)=>{ b.setAttribute('aria-pressed',String(i===index)); b.classList.toggle('chosen',i===index); });
    timer=setTimeout(()=>{
      pending=false;
      if(state.index===9){
        state.screen='finished';} else state.index++;
      move();
    },310);
  }
  function question() {
    const q = data().questions[lang][state.index], section=el('section','pq-question');
    const nav = el('div','pq-question-nav'), back=btn('←  '+t().back,()=>{
      if(pending)return;
      if(state.index>0)state.index--;else state.screen='entry';move();
    },'pq-back');
    const count=el('span','pq-count', (state.index+1)+' / 10');
    nav.append(back,count); const meter=el('progress','pq-progress');
    meter.max=10;meter.value=state.index+1;meter.setAttribute('aria-label',t().number+' '+(state.index+1)+' / 10');
    const h=heading(q.title);h.id='pq-question-title';
    const options=el('div','pq-options');options.setAttribute('role','group');options.setAttribute('aria-labelledby',h.id);
    const buttons=q.answers.map((str,i)=>{
      const b=btn('',()=>answer(i,buttons),'pq-answer');
      b.append(el('span','pq-letter','ABCD'[i]),el('span','pq-answer-text',str),el('span','pq-check','✓'));
      b.firstChild.setAttribute('aria-hidden','true');b.lastChild.setAttribute('aria-hidden','true');
      b.classList.toggle('chosen',state.answers[state.index]===i);b.setAttribute('aria-pressed',String(state.answers[state.index]===i));return b;
    });options.append(...buttons);
    section.append(nav,meter,h,el('p','pq-prompt',q.text),el('p','pq-instruction',t().choose),options);return section;
  }
  function finished(){
    const cp=data().screens[lang].end, sec=el('section','pq-question');
    sec.append(btn('← '+t().back,()=>{state.screen='question';state.index=9;move();},'pq-back'),heading(cp[0]),el('p','pq-intro',cp[1]),el('p','',cp[2]),btn(cp[3],()=>{
      const {leaders:eligible}=data().tally(state.answers);state.shortlist=[];state.comparing=false;if(eligible.length>1){state.screen='choice';move();}
      else finishWithMatch(eligible[0]);
    },'pq-primary'),el('p','pq-instruction',{it:'Questo quiz è un gioco di personalità, non un test psicologico scientifico.',en:'This is a fun personality quiz, not a scientifically validated psychological test.',es:'Este quiz es un juego de personalidad, no un test psicológico validado científicamente.'}[lang]));if (state.researchConsent === true) sec.querySelector('.pq-primary').before(researchBox());return sec;
  }
  const resultWords={
   en:['Which one feels more like you?','Choose two names to compare','These characters share first place. Pick the two you would like to meet side by side.','Compare','Why this PELUFI?','You also have a strong affinity with','My PELUFI is','points','Back to the names'],
   it:['In quale ti riconosci di più?','Scegli due nomi da confrontare','Questi personaggi sono arrivati primi a pari merito. Scegli i due che vuoi conoscere meglio.','Confronta','Perché questo PELUFI?','Hai anche una forte affinità con','Il mio PELUFI è','punti','Torna ai nomi'],
   es:['¿Con cuál te identificas más?','Elige dos nombres para comparar','Estos personajes comparten el primer puesto. Elige los dos que te gustaría conocer mejor.','Comparar','¿Por qué este PELUFI?','También tienes una gran afinidad con','Mi PELUFI es','puntos','Volver a los nombres']
  };
  const rw=()=>resultWords[lang];
  const instincts={
   it:['scoprire come funzionano le cose','fare il primo passo','immaginare possibilità insolite','trasformare un gesto in uno spettacolo','prenderti cura degli altri','trovare una soluzione concreta','mettere ordine nei piani','curare i dettagli','cogliere ciò che sfugge agli altri','dare una mano in silenzio'],
   en:['finding out how things work','taking the first step','dreaming up unusual possibilities','turning a moment into a performance','looking after others','finding a practical fix','putting plans in order','getting details just right','spotting what others miss','quietly lending a hand'],
   es:['descubrir cómo funcionan las cosas','dar el primer paso','imaginar posibilidades insólitas','convertir un gesto en un espectáculo','cuidar de los demás','encontrar una solución práctica','poner los planes en orden','afinar cada detalle','descubrir lo que otros pasan por alto','ayudar con discreción']
  };
  function rankedTraits(id,scores){
   return [...data().pairs[id]].sort((a,b)=>scores.traits[b]-scores.traits[a]);
  }
  function traitPhrase(id,scores){
   const [a,b]=rankedTraits(id,scores),labels=data().traitNames[lang];
   const join={it:' e ',en:' and ',es:' y '}[lang];
   return scores.traits[a]===scores.traits[b]?labels[a]+join+labels[b].toLocaleLowerCase(lang):labels[a];
  }
  function evidence(id,scores){
   const [a,b]=rankedTraits(id,scores),codes=['CU','IN','FA','ES','PR','SP','OR','PX','OS','DI'];
   const first=instincts[lang][codes.indexOf(a)],second=instincts[lang][codes.indexOf(b)],n=nameOf(id);
   if(scores.traits[a]===scores.traits[b])return {it:'Ti piace '+first+' e '+second+'. Qui si vede il tuo lato '+n+'.',en:'Your answers give equal weight to '+first+' and '+second+'. That’s where your '+n+' side shines.',es:'Tus respuestas combinan '+first+' y '+second+'. Ahí se ve tu lado '+n+'.'}[lang];
   return {it:'Fra le qualità di '+n+', nelle tue scelte spicca soprattutto la tendenza a '+first+'. È il tratto che più vi accomuna.',en:'Of the qualities you share with '+n+', '+first+' stands out most in your answers. That’s your strongest connection.',es:'Entre las cualidades que compartes con '+n+', en tus respuestas destaca '+first+'. Es lo que más os une.'}[lang];
  }
  function personality(id){
    const codes=['CU','IN','FA','ES','PR','SP','OR','PX','OS','DI'];
    const [a,b]=registry[id].traits.map(k=>instincts[lang][codes.indexOf(k)]);
    return {en:'You enjoy '+a+' and '+b+'.',it:'Ti piace '+a+' e '+b+'.',es:'Te gusta '+a+' y '+b+'.'}[lang];
  }
  function comparison(ids,scores){
   const [a,b]=ids,one=traitPhrase(a,scores),two=traitPhrase(b,scores);
   return {it:'Il tuo lato '+nameOf(a)+' emerge da '+one.toLowerCase()+', mentre quello '+nameOf(b)+' si riconosce da '+two.toLowerCase()+'.',en:'For '+nameOf(a)+', your answers highlight '+one.toLowerCase()+', while your '+nameOf(b)+' side comes through in '+two.toLowerCase()+'.',es:'Tu lado '+nameOf(a)+' destaca por '+one.toLowerCase()+', y tu lado '+nameOf(b)+' por '+two.toLowerCase()+'.'}[lang];
  }
  function chooseMatch(){
   const scores=data().tally(state.answers),leaders=scores.leaders;
   if(leaders.length===1){state.match=leaders[0];state.screen='result';storeState();return result(data().results[lang][state.match]);}
   const sec=el('section','pq-question pq-choice');
   const selected=[...new Set(state.shortlist||[])].filter(id=>leaders.includes(id)).slice(0,2);
   if(leaders.length>2 && (!state.comparing||selected.length!==2)){
    sec.append(heading(launchCopy[lang][2]),el('p','',rw()[1]));
    const list=el('div','pq-shortlist'), next=btn(rw()[3],()=>{state.comparing=true;move();},'pq-primary');
    const sync=()=>{next.disabled=selected.length!==2;list.querySelectorAll('input').forEach(i=>i.disabled=selected.length===2&&!i.checked);state.shortlist=[...selected];storeState()};
    for(const id of leaders){const label=el('label'),input=el('input');input.type='checkbox';input.checked=selected.includes(id);input.onchange=()=>{if(input.checked)selected.push(id);else selected.splice(selected.indexOf(id),1);sync()};label.append(input,img(art(id,'solo'),''),el('strong','',nameOf(id)),el('small','',personality(id)));list.append(label)}
    sync();sec.append(list,next);return sec;
   }
   if(leaders.length>2)sec.append(btn('← '+rw()[8],()=>{state.comparing=false;move()},'pq-back'));
   const candidates=leaders.length===2?leaders:selected;sec.append(heading(comparison(candidates,scores)),el('p','pq-intro',rw()[0]));const options=el('div','pq-choice-list');
   for(const id of leaders.length===2?leaders:selected){const b=btn('',()=>finishWithMatch(id),'pq-choice-button');b.append(img(art(id,'solo'),nameOf(id)),img(art(id,'logo'),nameOf(id),'tie-word'),el('small','',personality(id)));options.append(b)}
   sec.append(options);return sec;
  }
  function radar(title,score,labels){
    const entries=Object.entries(score),traits=entries.length===10;
    const box=el('figure','pq-radar '+(traits?'trait-radar':'cast-radar'));
    const heading=traits?title:{en:'Your PELUFI affinities',it:'Le tue affinità PELUFI',es:'Tus afinidades PELUFI'}[lang];
    box.append(el('figcaption','',heading));
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 400 316');svg.setAttribute('aria-hidden','true');
    function shape(tag,attrs){
      const node=document.createElementNS(ns,tag);
      for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);
      svg.append(node);return node;
    }
    const radius=traits?113:99,ceiling=traits?8:Math.max(1,...Object.values(score));
    function point(i,r){
      const angle=i*2*Math.PI/entries.length-Math.PI/2;
      return [200+r*Math.cos(angle),158+r*Math.sin(angle)];
    }
    function points(list){return list.map(p=>p.join(',')).join(' ')}
    for(const fraction of [.25,.5,.75,1])shape('polygon',{points:points(entries.map((_,i)=>point(i,radius*fraction))),class:'pq-grid'});
    entries.forEach((_,i)=>{const [x,y]=point(i,radius);shape('line',{x1:200,y1:158,x2:x,y2:y,class:'pq-spoke'})});
    const values=entries.map(([,v],i)=>point(i,radius*v/ceiling));
    shape('polygon',{points:points(values),class:'pq-score'});
    values.forEach(([x,y])=>shape('circle',{cx:x,cy:y,r:3,class:'score-node'}));
    const prefix=k=>labels[k].slice(0,2).toLocaleUpperCase(lang);
    function code(k){
      const peers=Object.keys(labels).filter(key=>prefix(key)===prefix(k));
      return prefix(k)+(peers.length>1?['¹','²','³'][peers.indexOf(k)]:'');
    }
    const placements=[[200,31,100],[349,121,98],[290,270,103],[109,270,107],[53,121,102]];
    entries.forEach(([key],i)=>{
      if(traits){const [x,y]=point(i,137);shape('text',{x,y:y+6,'text-anchor':'middle'}).textContent=code(key)}
      else{const [x,y,width]=placements[i];shape('image',{x:x-width/2,y:y-18,width,height:36,href:art(key,'logo'),preserveAspectRatio:'xMidYMid meet'})}
    });
    box.append(svg);
    const list=el('dl','pq-stats');
    entries.forEach(([key,v])=>{
      const row=el('div'),dt=el('dt');
      if(traits)dt.append(el('b','',code(key)),' '+labels[key]);else dt.textContent=nameOf(key);
      row.append(dt,el('dd','',String(v)));list.append(row);
    });
    box.append(list);return box;
  }
  function shareURL(id) { const u=new URL('https://pelufi.com/quiz');u.searchParams.set('match',id);u.searchParams.set('lang',lang);return u.href; }
  function status(s) { const p=root()?.querySelector('.pq-status'); if(p)p.textContent=s; }
  async function copyLink(id) {
    const url=shareURL(id);
    try{
      if(!navigator.clipboard?.writeText)throw Error();
      await navigator.clipboard.writeText(url);status(t().copied);
    }catch{
      const p=root()?.querySelector('.pq-status');if(!p)return;
      p.replaceChildren(el('span','',t().fallback));
      const field=el('input','pq-copy-field');field.value=url;field.readOnly=true;field.setAttribute('aria-label',t().copy);
      p.append(field);field.focus();field.select();
    }
  }
  function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});}
  function fit(ctx,im,x,y,w,h){const s=Math.min(w/im.width,h/im.height);ctx.drawImage(im,x+(w-im.width*s)/2,y+(h-im.height*s)/2,im.width*s,im.height*s);}
  async function makeCard(id,locale,story=false) {
    const [hero,brand,mark]=await Promise.all([loadImage(art(id,'solo')),loadImage('/assets/pelufi-master.webp'),loadImage(art(id,'logo'))]);
    if(document.fonts)await Promise.all([document.fonts.load('800 70px "Baloo 2"'),document.fonts.load('700 32px Nunito')]);
    const c=document.createElement('canvas');c.width=1080;c.height=story?1920:1350;
    const ctx=c.getContext('2d');ctx.fillStyle='#fff6e9';ctx.fillRect(0,0,1080,c.height);if(story)ctx.translate(0,180);
    ctx.fillStyle=accents[id];ctx.beginPath();ctx.ellipse(536,705,435,440,0,0,Math.PI*2);ctx.fill();
    fit(ctx,brand,312,12,456,170);
    ctx.fillStyle='#45223e';ctx.textAlign='center';ctx.font='800 62px "Baloo 2", sans-serif';ctx.fillText({en:'I’m ',es:'Soy ',it:'Sono '}[locale]+nameOf(id)+'.',540,231);
    fit(ctx,mark,170,254,740,160); fit(ctx,hero,117,420,846,story?790:580);if(story)ctx.translate(0,210);ctx.font='700 39px Nunito';ctx.fillText(registry[id].tagline[locale],540,1050,960);ctx.font='800 42px '+String.fromCharCode(34)+'Baloo 2'+String.fromCharCode(34);ctx.fillText(text[locale].title,540,1115,980);
    ctx.fillStyle='#542644';ctx.font='800 52px "Baloo 2", sans-serif';ctx.fillText('pelufi.com/quiz',540,1195);
    ctx.font='700 34px Nunito, sans-serif';ctx.fillText('@pelufiworld',540,1270);
    return new Promise((resolve,reject)=>c.toBlob(blob=>blob?resolve(blob):reject(Error()),'image/png'));
  }
  function result(info){
    const id=state.match, sec=el('section','pq-result'), visual=el('div','pq-result-art');
    visual.style.setProperty('--pq-accent',accents[id]);
    visual.append(img(art(id,'solo'),t().imageOf+' '+nameOf(id),'pq-solo'));
    const body=el('div','pq-result-copy'), h=heading(t().result+' '+nameOf(id));h.className='pq-visually-hidden';
    const tag=typeof info.tagline==='string'?info.tagline:registry[id].tagline[lang];
    body.append(h,el('p','pq-result-label',t().result),img(art(id,'logo'),nameOf(id),'pq-result-logo'));
    const paras=Array.isArray(info.copy)?info.copy:[info.copy];paras.filter(Boolean).forEach(p=>body.append(el('p','pq-personality',p)));
    if(info.stats?.length){const stats=el('ul','pq-traits');stats.setAttribute('aria-label',t().traits);
      info.stats.forEach(s=>stats.append(el('li','',s)));body.append(stats);}
    body.append(el('p','pq-tagline',tag));
    const actions=el('div','pq-actions');
    // Prepare before the platform share sheet needs its transient user activation.
    const locale=lang,cardJobs={},cards={};
    function prepare(kind){
      if(!cardJobs[kind])cardJobs[kind]=makeCard(id,locale,kind==='story').then(blob=>cards[kind]=blob).catch(()=>null);
      return cardJobs[kind];
    }
    prepare('story');
    async function save(kind){
      const blob=await prepare(kind);if(!sec.isConnected)return false;
      if(!blob){status(t().imageError);return false;}
      const url=URL.createObjectURL(blob),link=el('a');link.href=url;link.download='PELUFI-'+id+'-'+locale+'-'+kind+'.png';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);return true;
    }
    const group=el('div','share-links');
    for(const name of ['Instagram','TikTok','Facebook']){
      const icon=pelufiSocial.profiles.find(p=>p[0]===name)[2];
      const button=btn('',async()=>{
       const url=shareURL(id);
       if(name==='Facebook'){
         if(navigator.share){try{await navigator.share({title:t().shareTitle,url});return}catch(e){if(e.name==='AbortError')return;}}
         const link=el('a');link.href=pelufiSocial.facebookShare+encodeURIComponent(url);link.target='_blank';link.rel='noopener noreferrer';document.body.append(link);link.click();link.remove();return;
       }
       if(cards.story&&typeof File==='function'&&navigator.share){
         const file=new File([cards.story],'PELUFI-'+id+'.png',{type:'image/png'});
         if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:t().shareTitle});return}catch(e){if(e.name==='AbortError')return;}}
       }
       if(await save('story')){
         const target=name==='Instagram'?{en:'your Instagram Story',it:'una storia Instagram',es:'tu historia de Instagram'}[locale]:'TikTok';
         status({en:'Image saved. Share it to '+target+' and tag @pelufiworld.',it:'Immagine salvata. Condividila su '+target+' e tagga @pelufiworld.',es:'Imagen guardada. Compártela en '+target+' y etiqueta a @pelufiworld.'}[locale]);
       }
      },'platform-share share-'+name.toLowerCase());
      button.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">'+icon+'</svg>'+name;group.append(button);
    }
    actions.append(group,btn(t().save,async()=>{if(await save('feed'))status(t().saved)},'pq-secondary'),btn(t().copy,()=>copyLink(id),'pq-secondary'));
    const feedback=el('div','pq-status');feedback.setAttribute('role','status');
    const further=el('div','pq-further');further.append(btn(t().retake,()=>{const url=new URL(location.href);url.searchParams.delete('match');history.replaceState(null,'',url);state={screen:'entry',index:0,answers:[],match:null};move()},'pq-back'),meetLink());
    const sharing=el('section','pq-sharing');sharing.append(el('h2','',{en:'Share your result',it:'Condividi il tuo risultato',es:'Comparte tu resultado'}[lang]),actions,feedback,further);sec.append(visual,body);
    if(state.answers.length===10 && data().tally){
      const scores=data().tally(state.answers),charts=el('div','pq-charts');
      const analysis=el('section','pq-analysis');analysis.append(el('h2','',rw()[4]),el('p','',evidence(id,scores)));const close=characters.filter(c=>scores.leaders.length===1&&scores.characters[c]===scores.characters[id]-1);if(close.length)analysis.append(el('p','',rw()[5]+' '+close.map(nameOf).join(', ')+'.'));charts.append(radar(extra[lang].cast,scores.characters,{}),radar(extra[lang].traits,scores.traits,data().traitNames[lang]));sec.append(analysis,charts);
    }
    sec.append(sharing,followBlock(lang,'result'));return sec;
  }
  function draw(){
    const main=root();if(!main)return;
    main.setAttribute('lang',lang);main.classList.add('pq-root');imageJob=null;
    const info=state.match&&data()?.results?.[lang]?.[state.match];
    let content;
    if(state.screen==='result'&&info)content=result(info);
    else if(state.screen==='finished'&&ready())content=finished(); else if(state.screen==='choice'&&ready()&&data().tally)content=chooseMatch();
    else if(state.screen==='question'&&ready())content=question();
    else content=entry();
    main.replaceChildren(content);
  }
  window.renderQuiz=locale=>{
    if(!root())return;lang=text[locale]?locale:'en';
    if(!initialized){restore();initialized=true;}
    if(pending){clearTimeout(timer);pending=false;if(state.index===9)state.screen='finished';else state.index++;storeState();}
    draw();
  };
})();









