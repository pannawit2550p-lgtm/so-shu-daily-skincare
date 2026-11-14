/* ส่วนคำถามที่พบบ่อยและช่องทางติดต่อ */
(function(){
  "use strict";

  // แก้ข้อมูลช่องทางติดต่อจริงได้จากตัวแปรชุดนี้
  var CONTACT_CHANNELS={
    line:{url:"",label:""},
    facebook:{url:"",label:""},
    email:{address:""}
  };
  function esc(value){return String(value||"").replace(/[&<>"']/g,function(char){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]})}
  function safeWebUrl(value){if(!value)return "";try{var url=new URL(value);return url.protocol==="https:"?url.href:""}catch(error){return ""}}

  customElements.define("so-shu-site-footer",class extends HTMLElement{
    connectedCallback(){
      if(this.dataset.mounted)return;
      this.dataset.mounted="true";
      this.innerHTML='<section class="site-info__section site-info__faq" id="faq" aria-labelledby="siteFaqTitle">'+
        '<div class="site-info__heading"><p class="site-info__eyebrow" data-i18n="faqEyebrow">SO-SHU · SUPPORT</p><h2 class="site-info__title site-info__title--serif" id="siteFaqTitle" data-i18n="faqTitle">Frequently asked questions</h2><p class="site-info__intro" data-i18n="faqIntro">Helpful notes before you place an order.</p></div>'+
        '<div class="site-info__faq-list">'+
          '<details class="site-info__faq-item"><summary><span data-i18n="faqSunscreenQ">Should I use sunscreen with the products?</span><span class="site-info__plus" aria-hidden="true"></span></summary><p data-i18n="faqSunscreenA">For daytime use, follow the product label and apply sunscreen as directed.</p></details>'+
          '<details class="site-info__faq-item"><summary><span data-i18n="faqShippingQ">How long does delivery take?</span><span class="site-info__plus" aria-hidden="true"></span></summary><p data-i18n="faqShippingA">After you send an order request, our team will confirm stock, delivery fees, and the estimated delivery time before confirming your order.</p></details>'+
          '<details class="site-info__faq-item"><summary><span data-i18n="faqReturnsQ">How do returns work?</span><span class="site-info__plus" aria-hidden="true"></span></summary><p data-i18n="faqReturnsA">Please contact our team with your order number and details about the item. We will review the request and confirm the available next steps with you.</p></details>'+
          '<details class="site-info__faq-item"><summary><span data-i18n="faqPaymentQ">How can I pay?</span><span class="site-info__plus" aria-hidden="true"></span></summary><p data-i18n="faqPaymentA">There is no online payment in this step. Our team will confirm stock and provide the payment method and amount before you pay.</p></details>'+
          '<details class="site-info__faq-item"><summary><span data-i18n="faqStorageQ">How should I store the products?</span><span class="site-info__plus" aria-hidden="true"></span></summary><p data-i18n="faqStorageA">Keep products in a cool, dry place away from direct sunlight, close the cap after use, and follow the directions on the product label.</p></details>'+
        '</div></section>'+
        '<section class="site-info__section site-info__contact" id="contact" aria-labelledby="siteContactTitle">'+
          '<div class="site-info__heading"><p class="site-info__eyebrow" data-i18n="contactEyebrow">SO-SHU · HERE TO HELP</p><h2 class="site-info__title site-info__title--serif" id="siteContactTitle" data-i18n="contactTitle">Contact our team</h2><p class="site-info__intro" data-i18n="contactIntro">Choose a channel and we’ll be happy to help.</p></div>'+
          '<div class="site-info__contact-grid" id="siteContactGrid"></div>'+
        '</section>';

      this.renderContacts();
      if(window.SoShuI18n)window.SoShuI18n.apply(this);
    }
    renderContacts(){
      var grid=this.querySelector("#siteContactGrid");
      var cards=[
        {key:"line",icon:"L",title:"contactLine",value:CONTACT_CHANNELS.line.label,url:safeWebUrl(CONTACT_CHANNELS.line.url),pending:"contactPending"},
        {key:"facebook",icon:"f",title:"contactFacebook",value:CONTACT_CHANNELS.facebook.label,url:safeWebUrl(CONTACT_CHANNELS.facebook.url),pending:"contactPending"},
        {key:"email",icon:"@",title:"contactEmail",value:CONTACT_CHANNELS.email.address,url:CONTACT_CHANNELS.email.address?"mailto:"+CONTACT_CHANNELS.email.address:"",pending:"contactPending"}
      ];
      grid.innerHTML=cards.map(function(card){
        var tag=card.url?"a":"div",attrs=card.url?' href="'+esc(card.url)+'"'+(card.url.indexOf("https:")===0?' target="_blank" rel="noopener noreferrer"':''):' aria-disabled="true"';
        return '<'+tag+' class="site-info__contact-card site-info__contact-card--'+card.key+'"'+attrs+'><span class="site-info__contact-icon" aria-hidden="true">'+esc(card.icon)+'</span><span class="site-info__contact-copy"><span class="site-info__contact-label" data-i18n="'+card.title+'"></span><strong>'+(card.value?esc(card.value):'<span data-i18n="'+card.pending+'">Details coming soon</span>')+'</strong></span><span class="site-info__contact-arrow" aria-hidden="true">↗</span></'+tag+'>';
      }).join("");
      if(window.SoShuI18n)window.SoShuI18n.apply(grid);
    }
  });
})();
