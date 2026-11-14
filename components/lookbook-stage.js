(function(){
  "use strict";
  customElements.define("so-shu-lookbook-stage",class extends HTMLElement{
    connectedCallback(){
      if(this.dataset.mounted)return;this.dataset.mounted="true";
      this.innerHTML='<div class="deck__intro"><h1 id="deck-title"><span data-i18n="heroLine1">Stay in</span> <span data-i18n="heroLine2">your glow.</span></h1><p><span data-i18n="heroIntro1">So-Shu daily skincare.</span> <span data-i18n="heroIntro2">Explore the products and choose your routine.</span></p></div>'+
        '<div class="deck__stage" id="stage" tabindex="0" role="region" aria-roledescription="carousel" data-i18n-aria-label="lookbookLabel" aria-label="So-Shu products — arrow keys turn the ring, Enter opens a product">'+
        '<span class="loop__ring" id="loopRing" aria-hidden="true"></span>'+
        '<div class="loop" aria-hidden="true"><p class="loop__t" data-i18n-html="ringTitle">Stay in<br>your glow</p><p class="loop__s" data-i18n="ringSubtitle">SO-SHU · DAILY SKINCARE</p></div>'+ 
        '<div class="deck__crowd" id="crowd"></div><div class="deck__labels" id="labels"></div>'+
        '<span class="deck__glint" aria-hidden="true"></span>'+
        '<span class="follow" id="follow" aria-hidden="true"><span class="follow__in"><b class="f-drag" data-i18n="drag">Drag</b><b class="f-view" data-i18n="view">View</b></span></span>'+ 
        '<span class="deck__live" id="live" aria-live="polite"></span>'+
      '</div>';
    }
  });
})();
