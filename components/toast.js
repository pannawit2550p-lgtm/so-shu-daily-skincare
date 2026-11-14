(function(){
  "use strict";
  customElements.define("so-shu-toast",class extends HTMLElement{});
  var components=window.SoShuComponents=window.SoShuComponents||{},timer=0;
  components.Toast={
    show:function(message){
      var toast=document.querySelector("#toast");
      toast.textContent=message;toast.classList.add("is-on");
      clearTimeout(timer);timer=setTimeout(function(){toast.classList.remove("is-on")},2500);
    }
  };
})();
