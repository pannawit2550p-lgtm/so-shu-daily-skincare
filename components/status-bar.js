(function(){
  "use strict";
  customElements.define("so-shu-status-bar",class extends HTMLElement{
    connectedCallback(){
      if(this.dataset.mounted)return;this.dataset.mounted="true";
      this.innerHTML='<header class="bar">'+
        '<a class="bar__brand" href="#deck" aria-label="SO-SHU · Daily skincare"><img src="assets/so-shu-logo.png" alt="SO-SHU"></a>'+ 
        '<div class="bar__actions" role="group" aria-label="Language and bag controls">'+
          '<div class="language-switch" role="group" aria-label="Choose language" data-i18n-aria-label="toggleLanguage"><button type="button" data-lang-choice="th" aria-pressed="false">TH</button><button type="button" data-lang-choice="en" aria-pressed="true" class="is-active">EN</button></div>'+
          '<button class="bagbtn pill" id="bagButton" type="button" aria-label="Open shopping bag, 0 items" aria-haspopup="dialog" aria-controls="cartDialog"><span data-i18n="bag">Bag</span> (<span class="tally" data-tally>0</span>)</button>'+
        '</div>'+
      '</header>';
    }
  });
})();
