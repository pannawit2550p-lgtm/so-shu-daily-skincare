(function(){
  "use strict";
  var components=window.SoShuComponents=window.SoShuComponents||{};
  function escapeHtml(value){
    return String(value).replace(/[&<>"']/g,function(char){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]});
  }
  components.LookModel={
    create:function(look,index,imageMarkup,pad,productName){
      var model=document.createElement("div");
      model.className="model";model.style.setProperty("--foot",look.foot);model.dataset.i=index;
      model.innerHTML='<div class="model__fig">'+imageMarkup(index,false)+'</div>'+
        '<button class="model__hit" type="button" tabindex="-1" data-i="'+index+'" aria-label="Product '+pad(index+1)+': '+escapeHtml(productName||look.name)+'"></button>';
      return model;
    }
  };
})();
