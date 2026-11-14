(function(){
  "use strict";
  var components=window.SoShuComponents=window.SoShuComponents||{};
  var i18n=function(){return window.SoShuI18n};
  function localizedName(item){var language=i18n();return language?language.name(item):item.name}
  function escapeHtml(value){
    return String(value).replace(/[&<>"']/g,function(char){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]});
  }
  components.ProductLine={
    create:function(item,state,index,money){
      var line=document.createElement("li");
      line.className="line"+(item.image?" has-image":"")+(state.added?" is-added":"")+(state.pending?" is-pending":"");
      line.dataset.p=index+1;
      line.dataset.productId=item.id;
      var selectedVariant=item.variants&&item.variants.find(function(variant){return variant.label===state.size&&variant.active!==false});
      if(selectedVariant)line.dataset.variantId=selectedVariant.id;
      var name=localizedName(item),t=function(key){return i18n()?i18n().t(key):key};
      line.innerHTML=
        '<span class="line__thumb">'+(item.image?'<img src="'+escapeHtml(item.image)+'" alt="" loading="lazy" decoding="async">':'')+'</span>'+
        '<span class="line__name">'+escapeHtml(name)+'</span>'+
        '<span class="line__price">'+money(item.price,item.currency)+'</span>'+
        '<span class="line__kind cap">'+escapeHtml(item.kind==="Skincare"?t("skincare"):item.kind)+'</span>'+
        '<button class="line__add" type="button" aria-expanded="false" aria-label="'+(state.added?t("inBag"):t("addToBag"))+": "+escapeHtml(name)+'"></button>'+
        '<div class="pick">'+components.SizePicker.render(item.sizes,state.size)+'<button class="pick__ok" type="button">'+escapeHtml(t("addToBag"))+'</button></div>';
      if(state.pending)Array.prototype.forEach.call(line.querySelectorAll("button"),function(button){button.disabled=true});
      return line;
    }
  };
})();
