(function(){
  "use strict";
  customElements.define("so-shu-story-section",class extends HTMLElement{
    connectedCallback(){
      if(this.dataset.mounted)return;
      this.dataset.mounted="true";
      this.innerHTML='<section class="story-section" aria-labelledby="story-title">'+
        '<div class="story__main"><div class="story__intro"><p class="story__eyebrow cap" data-i18n="dailyRitual">The daily ritual</p><h2 id="story-title" data-i18n-html="storyIntro">From your routine<br>to <i>your glow</i></h2></div>'+ 
        '<div class="story__lines" aria-label="Whitening care, keep the glow, daily nourishment" data-i18n-aria-label="storyAria">'+
          '<p class="story__line story__line--one"><span data-i18n="storyOne">Whitening</span> <i data-i18n="storyCare">Care</i></p>'+ 
          '<p class="story__line story__line--two"><span data-i18n="storyKeep">Keep</span> <i data-i18n="storyGlow">the glow</i></p>'+ 
          '<p class="story__line story__line--three"><span data-i18n="storyDaily">Daily</span> <i data-i18n="storyNourishment">Nourishment</i></p>'+ 
        '</div></div></section>';

      var section=this.querySelector(".story-section");
      section.classList.add("has-reveal");
      if(!("IntersectionObserver" in window)){
        section.classList.add("is-visible");
        return;
      }
      var observer=new IntersectionObserver(function(entries){
        if(entries.some(function(entry){return entry.isIntersecting})){
          section.classList.add("is-visible");
          observer.disconnect();
        }
      },{threshold:.18});
      observer.observe(section);
    }
  });
})();
