(function(){
  "use strict";
  var components=window.SoShuComponents=window.SoShuComponents||{};
  function escapeHtml(value){
    return String(value).replace(/[&<>"']/g,function(char){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]});
  }
  components.SizePicker={
    render:function(sizes,selected){
      return '<div class="pick__sizes" role="group" aria-label="Size" data-i18n-aria-label="sizeAria">'+sizes.map(function(size){
        return '<button class="size" type="button" data-s="'+escapeHtml(size)+'" aria-pressed="'+String(selected===size)+'">'+escapeHtml(size)+'</button>';
      }).join("")+'</div>';
    }
  };
})();
