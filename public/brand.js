const pelufiSocial={
 handle:'@pelufiworld',
 profiles:[
  ['Instagram','https://www.instagram.com/pelufiworld/','<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>'],
  ['Facebook','https://www.facebook.com/pelufiworld/','<path fill="currentColor" stroke="none" d="M14 22v-9h3l.5-3.5H14V7.3c0-1.1.3-1.8 1.9-1.8H18V2.3c-.7-.1-1.8-.3-3-.3-3.1 0-5 1.9-5 5.1v2.4H7V13h3v9z"/>'],
  ['TikTok','https://www.tiktok.com/@pelufiworld','<path d="M14 3v12a5 5 0 1 1-5-5m5-7c.8 4 3 6 7 6" stroke-width="3.6"/>']
 ],
 facebookShare:'https://www.facebook.com/sharer/sharer.php?u='
};
const launchCopy={
 en:['Follow their little mishaps.','Found your PELUFI?','Your result is unusually balanced.','Export format','Feed','Story','Save your result and share it on Instagram or TikTok. Tag @pelufiworld.','Share a link on Facebook','Privacy','Legal notice'],
 it:['Segui i loro pasticci.','Hai trovato il tuo PELUFI?','Il tuo risultato è particolarmente equilibrato.','Formato immagine','Feed','Storia','Salva il risultato e condividilo su Instagram o TikTok. Tagga @pelufiworld.','Condividi il link su Facebook','Privacy','Note legali'],
 es:['Sigue sus líos.','¿Has encontrado a tu PELUFI?','Tu resultado está especialmente equilibrado.','Formato de imagen','Publicación','Historia','Guarda tu resultado y compártelo en Instagram o TikTok. Etiqueta a @pelufiworld.','Compartir el enlace en Facebook','Privacidad','Aviso legal']
};
function followBlock(lang,place){
 const text=launchCopy[lang],box=document.createElement(place==='footer'?'div':'section');
 box.className='follow follow-'+place;
 const links=socialLinks();
 box.innerHTML=(place==='result'?'<p>'+text[1]+'</p>':'')+(place!=='footer'?'<h2>'+text[0]+'</h2>':'')+'<strong>'+pelufiSocial.handle+'</strong><div class="network-links">'+links+'</div>';
 return box;
}
function siteFooter(lang){
 document.querySelector('footer').innerHTML='<a href="/?lang='+lang+'" class="foot-brand"><img src="/assets/pelufi-master.webp" alt="PELUFI — Goofy creatures. Serious trouble."></a><div class="policies"><span>© PELUFI</span><a id="privacy" href="/privacy/?lang='+lang+'">'+launchCopy[lang][8]+'</a><a id="legal" href="/legal/?lang='+lang+'">'+launchCopy[lang][9]+'</a></div>';
}

function socialLinks(){ return pelufiSocial.profiles.map(([name,url,icon])=>'<a href="'+url+'" aria-label="'+name+'" target="_blank" rel="noopener noreferrer"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">'+icon+'</svg><span>'+name+'</span></a>').join('');
}
function socialStrip(lang){
 let strip=document.querySelector('.social-strip');
 if(!strip){strip=document.createElement('aside');strip.className='social-strip';document.querySelector('header').before(strip)}
 const prompt={en:'Follow us on',it:'Seguici su',es:'Síguenos en'}[lang];
 strip.setAttribute('aria-label',prompt+' · '+pelufiSocial.handle);
 strip.innerHTML='<span class="strip-prompt">'+prompt+' · </span><strong>'+pelufiSocial.handle+'</strong><div class="network-links">'+socialLinks()+'</div>';
}
