(function(){
  "use strict";
  customElements.define("so-shu-focus-view",class extends HTMLElement{
    connectedCallback(){
      if(this.dataset.mounted)return;this.dataset.mounted="true";
      this.innerHTML='<div class="focus" id="focus" aria-hidden="true">'+
        '<div class="focus__stage" id="focusStage"></div>'+
        '<div class="focus__top"><p class="focus__cap"><span id="focusNum">01.</span><i id="focusName">Somewhere Else</i></p>'+ 
        '<button class="focus__close" id="focusClose" type="button" aria-label="Close product" data-i18n-aria-label="closeProduct"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"></path></svg></button></div>'+ 
        '<aside class="focus__details" id="focusDetails" aria-label="Product details" hidden></aside>'+ 
        '</div>';
    }
  });
})();
