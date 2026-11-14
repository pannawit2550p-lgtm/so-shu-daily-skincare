(function(){
  "use strict";
  customElements.define("so-shu-product-slip",class extends HTMLElement{
    connectedCallback(){
      if(this.dataset.mounted)return;this.dataset.mounted="true";
      this.innerHTML='<aside class="slip" id="slip" aria-label="SO-SHU order summary" aria-hidden="true">'+
        '<div class="slip__head"><p class="slip__logo">SO-SHU<i>®</i></p><span class="cap" id="slipLook">Look 01 — Somewhere Else</span></div>'+ 
        '<ul class="slip__lines" id="lines" role="list"></ul>'+
        '<div class="slip__bundle"><p class="slip__msg" id="msg" role="status" aria-live="polite"></p><div id="priceSummary"></div>'+
        '<button class="slip__cta" id="cta" type="button"><span class="t-add">Add whole fit to bag</span><span class="t-done">Whole fit in your bag</span><svg viewBox="0 0 26 14" aria-hidden="true"><path d="M1 7h24M19 1l6 6-6 6"></path></svg></button></div>'+ 
        '<div class="slip__foot" aria-hidden="true"><span class="slip__code"></span><span class="cap">SO-SHU · DAILY SKINCARE</span></div>'+ 
      '</aside>';
    }
  });
})();
