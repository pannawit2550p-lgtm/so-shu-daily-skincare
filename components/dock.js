(function(){
  "use strict";
  customElements.define("so-shu-dock",class extends HTMLElement{
    connectedCallback(){
      if(this.dataset.mounted)return;this.dataset.mounted="true";
      this.innerHTML='<div class="dock"><div class="dock__now" id="now">'+
        '<div class="dock__count"><span class="cap"><span id="nowIdx">01</span> / <span id="nowTotal">09</span></span>'+
        '<button class="auto" id="auto" type="button" aria-label="Autoplay" data-i18n-aria-label="autoplay" aria-pressed="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="pause" d="M6.5 4.5h3.5v15H6.5zM14 4.5h3.5v15H14z"></path><path class="play" d="M7 4.5v15l12.5-7.5z"></path></svg></button></div>'+ 
        '<div class="dock__name" id="nowName">Somewhere Else</div></div>'+
        '<button class="dock__shop" id="shop" type="button" aria-label="Shop this product" data-i18n-aria-label="shopProduct"><span class="cap" data-i18n="shopProduct">Shop this product</span><span class="dock__dot"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M4 12h16"></path></svg></span></button></div>';
    }
  });
})();
