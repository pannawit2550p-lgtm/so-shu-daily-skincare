(function(){
  "use strict";
  var components=window.SoShuComponents=window.SoShuComponents||{};
  var t=function(key){return window.SoShuI18n?window.SoShuI18n.t(key):key};
  function escapeHtml(value){
    return String(value).replace(/[&<>"']/g,function(char){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]});
  }
  components.PriceCard={
    render:function(totals){
      if(totals.simple){
        return '<dl class="sum sum--single"><div class="sum__row sum__total"><dt>'+escapeHtml(t("price"))+'</dt><dd>'+escapeHtml(totals.price)+'</dd></div></dl>';
      }
      return '<dl class="sum">'+
        '<div class="sum__row"><dt class="cap">'+escapeHtml(t("subtotal"))+'</dt><dd class="cap">'+escapeHtml(totals.subtotal)+'</dd></div>'+
        (totals.showDiscount===false?'':'<div class="sum__row"><dt class="cap">'+escapeHtml(t("wholeFitDiscount"))+'</dt><dd class="cap">'+escapeHtml(totals.discount)+'</dd></div>')+
        '<div class="sum__row sum__total"><dt>'+escapeHtml(t("total"))+'</dt><dd>'+escapeHtml(totals.total)+'</dd></div>'+ 
      '</dl>';
    }
  };
})();
