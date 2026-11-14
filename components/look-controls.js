(function(){
  "use strict";
  customElements.define("so-shu-look-controls",class extends HTMLElement{
    connectedCallback(){
      if(this.dataset.mounted)return;this.dataset.mounted="true";
      this.innerHTML='<div class="deck__view" role="group" aria-label="View"><button class="deck__vbtn" type="button" data-v="ring" aria-pressed="true" data-i18n="ring">Ring</button><button class="deck__vbtn" type="button" data-v="grid" aria-pressed="false" data-i18n="grid">Grid</button></div>';
    }
  });
})();
