(function(){
    "use strict";
    var MODEL_IMAGE="assets/bottle.png";
    var catalogService=window.SoShuCatalog;
    var cartApi=window.SoShuCartApi;
    var ui=window.SoShuComponents;
    var i18n=window.SoShuI18n;
    var t=function(key){return i18n?i18n.t(key):key};
    var localizedName=function(item){return i18n?i18n.name(item):item&&item.name||""};
    var localizedValue=function(value){return i18n?i18n.value(value):value&&typeof value==="object"?(value.en||value.th||""):value||""};
    var cartId=cartApi.createCartId(),bagSummary=null,cartMode="cart",checkoutKey=null,lastOrder=null;
    var $=function(s,r){return (r||document).querySelector(s)};
    var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
    var mod=function(n,m){return ((n%m)+m)%m};
    var pad=function(n){return String(n).padStart(2,"0")};
    var money=function(v,currency){var amount=(Math.round(v*100)/100).toFixed(v%1?2:0);return currency==="THB"?"฿"+amount:"$"+amount};
    var variantIdFor=function(item,label){var variant=(item.variants||[]).find(function(candidate){return candidate.label===label&&candidate.active!==false});return variant?variant.id:null};
    var wrapAngle=function(a){return mod(a+Math.PI,Math.PI*2)-Math.PI};
    var shortest=function(target,from){return mod(target-from+4.5,9)-4.5};
    function findProduct(id){for(var li=0;li<looks.length;li++){var found=looks[li].items.find(function(item){return item.id===id});if(found)return found}return null}
    var deck=$("#deck"),stage=$("#stage"),crowd=$("#crowd"),labels=$("#labels"),loopRing=$("#loopRing"),focus=$("#focus"),focusStage=$("#focusStage"),slip=$("#slip"),lines=$("#lines"),follow=$("#follow"),cartDialog=$("#cartDialog"),checkoutForm=$("#checkoutForm");
    var bodies=[],labelEls=[],looks=[],ringProducts=[],cart=[];
    var active=-1,pos=matchMedia("(prefers-reduced-motion: reduce)").matches?0:-1.15,goal=0,vel=0,frame=0,last=0,dirty=true,visible=true,grid=false,focusOpen=false,focusClosing=false,focusContext=null,drag=null,dragEnd=0,dragPx=120,modelH=560,mobile=innerWidth<810,W=0,H=0,autoplay=!matchMedia("(prefers-reduced-motion: reduce)").matches,autoTimer=0,slipHover=false,wheelSum=0,wheelLock=false,followRaf=0,followTarget={x:0,y:0},followNow={x:0,y:0},followShown=false,reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
    var STEP=Math.PI*2/9,STIFF=95,DAMP=2*Math.sqrt(95);
    function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":"&#39;"}[c]})}
    function ringProductFor(index){return ringProducts.length?ringProducts[index%ringProducts.length]:{name:"So-Shu Rosa Damascena Culture Extract whitening lotion bottle",image:MODEL_IMAGE}}
    function imageMarkup(product,i,focusMode){
      var alt=product.name||"So-Shu skincare product",src=product.image||MODEL_IMAGE;
      return '<span class="model__shadow" aria-hidden="true"></span><img class="model__pic" src="'+esc(src)+'" sizes="(max-width: 809px) 240px, 360px" alt="'+esc(alt)+'" draggable="false" decoding="async"'+(i===0&&!focusMode?' fetchpriority="high"':'')+'>';
    }
    function build(){
      looks.forEach(function(look,i){
        var product=ringProductFor(i),body=ui.LookModel.create(look,i,function(_,focusMode){return imageMarkup(product,i,focusMode)},pad,localizedName(product)||localizedName(look));
        if(product.id)body.dataset.productId=product.id;
        crowd.appendChild(body);bodies.push(body);
        var label=document.createElement("span");label.className="deck__label cap";label.style.setProperty("--i",i);label.style.setProperty("--delay",(.9+i*.05)+"s");label.textContent=pad(i+1)+"  "+(localizedName(product)||localizedName(look));labels.appendChild(label);labelEls.push(label);
      });
      measure();
      setActive(0,true);
      setAutoplay(autoplay);
      kick();
      scheduleAuto();
    }
    function measure(){
      W=stage.clientWidth;H=stage.clientHeight;mobile=innerWidth<810;
      var bottomPad=mobile?168:120,topPad=136;
      modelH=Math.max(200,Math.round((H-bottomPad-18-topPad)/1.12));
      stage.style.setProperty("--model-h",modelH+"px");stage.style.setProperty("--model-w",(modelH*4/7)+"px");
      dragPx=Math.max(mobile?90:120,W*.3);
      if(grid)layoutGrid();dirty=true;kick();
    }
    function place(body,x,y,s,op,blur,z){
      var w=modelH*4/7*s;
      if(x+w/2 < -4 || x-w/2 > W+4)op=0;
      body.style.transform="translate3d("+x.toFixed(1)+"px,"+(y-H).toFixed(1)+"px,0) translateX(-50%) scale("+s.toFixed(4)+")";
      var os=op.toFixed(3);if(body.dataset.opacity!==os){body.style.opacity=os;body.dataset.opacity=os}
      body.style.visibility=op<.01?"hidden":"visible";body.style.pointerEvents=op<.5?"none":"auto";
      body.style.filter=blur>.05?"blur("+blur.toFixed(1)+"px)":"none";body.style.zIndex=String(z);
    }
    function layoutRing(){
      if(!W||!H)return;
      var topPad=136,bottomPad=mobile?168:120,cx=W*.5,cy=topPad+(H-topPad-bottomPad)*.5+6;
      var radius=Math.min(W*.44,(H-topPad-bottomPad)*.47*1.2,H*.46),rx=radius,ry=radius;
      var frontH=H*(mobile ? .19 : .255),front=frontH/modelH;
      stage.style.setProperty("--loop-y",cy+"px");stage.style.setProperty("--ring-y",cy+"px");
      loopRing.style.width=(2*rx)+"px";loopRing.style.height=(2*ry)+"px";
      bodies.forEach(function(body,i){
        var a=wrapAngle((i-pos)*STEP),depth=(1+Math.cos(a))/2,dist=Math.abs(a)/STEP,near=Math.max(0,Math.min(1,1-dist));
        var s=front*(.5+.5*depth)*(1+.5*near),imageCenterOffset=modelH*s*.12,x=cx+rx*Math.sin(a),y=cy+ry*Math.cos(a)+imageCenterOffset;
        var blur=Math.max(0,(1-depth)*2.2-.3),z=Math.round(depth*1000)+10;
        place(body,x,y,s,1,blur,z);
      });
      dirty=false;
    }
    function layoutGrid(){
      if(!W||!H)return;
      var top=mobile?72:80,bottom=mobile?104:96,rowH=(H-bottom-top)/3,colW=W/3;
      bodies.forEach(function(body,i){
        var row=Math.floor(i/3),x=colW*(i%3+.5),y=top+rowH*(row+1)-32;
        var s=Math.min(rowH-40,colW*7/4*.92)/modelH;
        place(body,x,y,s,1,0,10+row);
        var lab=labelEls[i];lab.style.transform="translate3d("+x.toFixed(1)+"px,"+(y+12).toFixed(1)+"px,0) translateX(-50%)";
      });
      dirty=false;
    }
    function kick(){if(!frame&&visible){frame=requestAnimationFrame(tick)}}
    function tick(t){
      frame=0;var dt=last?Math.min(.034,(t-last)/1000):1/60;last=t;
      var moving=false;
      if(!reduced&&Math.abs(pos-goal)>5e-4||Math.abs(vel)>5e-4){
        if(reduced){pos=goal;vel=0}
        else{var h=dt/3;for(var j=0;j<3;j++){var acc=-STIFF*(pos-goal)-DAMP*vel;vel+=acc*h;pos+=vel*h}if(Math.abs(pos-goal)<=5e-4&&Math.abs(vel)<=5e-4){pos=goal;vel=0}else moving=true}
      }
      if(dirty||moving||drag){if(grid)layoutGrid();else layoutRing()}
      deck.classList.toggle("is-moving",moving||!!drag);
      if(moving||drag){frame=requestAnimationFrame(tick)}else last=0;
    }
    function setActive(i,quiet){
      i=mod(i,9);if(i===active)return;
      active=i;
      bodies.forEach(function(b,n){var h=$(".model__hit",b);h.tabIndex=n===active?0:-1});
      labelEls.forEach(function(l,n){l.classList.toggle("is-on",n===i)});
      var product=ringProductFor(i),productName=localizedName(product)||localizedName(looks[i]);
      $("#nowIdx").textContent=pad(i+1);$("#nowName").textContent=productName;
      if(!quiet){
        $("#live").textContent=t("liveProduct")+" "+(i+1)+": "+productName;
        if(!reduced){deck.classList.remove("is-glint");void deck.offsetWidth;deck.classList.add("is-glint");$(".dock__now").classList.remove("is-swap");void $(".dock__now").offsetWidth;$(".dock__now").classList.add("is-swap")}
        if(focusOpen)closeFocus();
      }
      renderSlip();scheduleAuto();
    }
    function goTo(g){goal=g;setActive(mod(g,9));kick()}
    function next(){goTo(Math.round(goal)+1)}
    function prev(){goTo(Math.round(goal)-1)}
    function jumpTo(i){goTo(Math.round(goal)+shortest(i,active))}
    function setAutoplay(on){autoplay=!!on;deck.classList.toggle("is-playing",autoplay);$("#auto").setAttribute("aria-pressed",String(autoplay));scheduleAuto()}
    function stopAuto(){if(autoplay)setAutoplay(false);else{clearTimeout(autoTimer);autoTimer=0}}
    function scheduleAuto(){
      clearTimeout(autoTimer);autoTimer=0;
      if(!autoplay)return;
      autoTimer=setTimeout(function(){
        if(visible&&!drag&&!document.hidden&&!slipHover&&!focusOpen&&!focusClosing&&!grid)next();
        scheduleAuto();
      },5000);
    }
    function renderSlip(){
      var look=looks[active],productMode=!!(focusContext&&focusContext.mode==="product"&&(focusOpen||document.body.classList.contains("is-product-focus")));lines.innerHTML="";
      slip.classList.toggle("is-product-focus",!!productMode);
      if(productMode){
        var product=focusContext.product,productIndex=look.items.findIndex(function(item){return item.id===product.id}),state=productIndex>=0&&cart[active]&&cart[active][productIndex];
        $("#slipLook").textContent=t("selectedProduct");
        if(productIndex>=0&&state)lines.appendChild(ui.ProductLine.create(product,state,productIndex,money));
        var productCurrency=product.currency||"THB",productPrice=Number(product.price)||0,priceText=money(productPrice,productCurrency);
        $("#priceSummary").innerHTML=ui.PriceCard.render({price:priceText,simple:true});
        $(".t-add",slip).textContent=t("addProduct");$(".t-done",slip).textContent=t("productInBag");
        $("#msg").textContent=productIndex<0?t("notLinked"):"";
        slip.classList.toggle("is-complete",!!(state&&state.added));
        return;
      }
      $("#slipLook").textContent=t("look")+" "+pad(active+1)+" — "+localizedName(look);
      look.items.forEach(function(it,p){
        lines.appendChild(ui.ProductLine.create(it,cart[active][p],p,money));
      });
      var sub=look.items.reduce(function(s,it){return s+it.price},0),currency=look.items[0]&&look.items[0].currency;
      $("#priceSummary").innerHTML=ui.PriceCard.render({subtotal:money(sub,currency),discount:"−"+money(sub*.1,currency),total:money(sub*.9,currency)});
      $(".t-add",slip).textContent=t("addWholeFit");$(".t-done",slip).textContent=t("wholeFitInBag");
      $("#msg").textContent="";
      slip.classList.toggle("is-complete",cart[active].every(function(x){return x.added}));
    }
    function productDetailsMarkup(product){
      var detail=product.productDetails||{};
      var ingredients=Array.isArray(product.ingredients)?product.ingredients:[];
      var ingredientMarkup=ingredients.length?'<div class="focus__ingredient-list">'+ingredients.map(function(item){
        var name=localizedName(item),benefit=localizedValue(item.description);
        var label='<strong>'+esc(name)+'</strong>'+(benefit?'<small>'+esc(benefit)+'</small>':'');
        return '<div class="focus__ingredient">'+(item.image?'<img src="'+esc(item.image)+'" alt="" loading="lazy">':'')+'<span>'+label+'</span></div>';
      }).join('')+'</div>':'<p class="focus__detail-copy">'+esc(t("ingredientsPending"))+'</p>';
      var summary=localizedValue(detail.summary),size=localizedValue(detail.size)||t("awaitingDetails"),usage=localizedValue(detail.usage)||t("awaitingDetails");
      return '<p class="focus__details-eyebrow">'+esc(t("productDetails"))+'</p>'+ 
        (summary?'<section class="focus__detail-section"><h3>'+esc(t("description"))+'</h3><p class="focus__detail-copy">'+esc(summary)+'</p></section>':'')+
        '<section class="focus__detail-section focus__detail-size"><h3>'+esc(t("size"))+'</h3><p class="focus__detail-copy">'+esc(size)+'</p></section>'+ 
        '<section class="focus__detail-section focus__detail-ingredients"><h3>'+esc(t("ingredients"))+'</h3>'+ingredientMarkup+'</section>'+ 
        '<section class="focus__detail-section"><h3>'+esc(t("howToUse"))+'</h3><p class="focus__detail-copy">'+esc(usage)+'</p></section>';
    }
    function openPick(p,on){
      var line=$('.line[data-p="'+(p+1)+'"]',lines);if(!line)return;
      line.classList.toggle("is-picking",on);$(".line__add",line).setAttribute("aria-expanded",String(on));
    }
    function formatMinor(amount,currency){
      var value=amount/100;
      if(currency==="THB")return "฿"+(amount%100?value.toFixed(2):String(value));
      return new Intl.NumberFormat(undefined,{style:"currency",currency:currency,maximumFractionDigits:2}).format(value);
    }
    function setCartMode(mode){
      cartMode=mode;
      $("#cartSearch").hidden=mode!=="cart"||!bagSummary||!bagSummary.items.length;
      $("#cartItems").hidden=mode!=="cart";
      $("#cartTotals").hidden=mode!=="cart";
      $("#cartCheckout").hidden=mode!=="cart";
      checkoutForm.hidden=mode!=="checkout";
      $("#cartConfirmation").hidden=mode!=="confirmation";
    }
    function renderBag(summary){
      $("#cartTitleCount").textContent="("+summary.itemCount+")";
      $("#bagButton").setAttribute("aria-label",t("openBag")+", "+summary.itemCount);
      $$("[data-tally]").forEach(function(t){t.textContent=String(summary.itemCount)});
      var itemList=$("#cartItems");itemList.replaceChildren();
      $("#cartSearch").hidden=!summary.items.length;
      if(!summary.items.length){
        var empty=document.createElement("p");empty.className="cart__empty";empty.textContent=t("emptyBag");itemList.appendChild(empty);
      }
      summary.items.forEach(function(item){
        var row=document.createElement("article");row.className="cart-item";row.dataset.lineId=item.lineId;
        var productRecord=findProduct(item.productId),displayName=productRecord?localizedName(productRecord):item.name;
        row.dataset.search=[item.name,displayName,item.productId,item.variantLabel].join(" ").toLocaleLowerCase();
        var image=document.createElement("span");image.className="cart-item__image";
        if(item.image){var img=document.createElement("img");img.src=item.image;img.alt=displayName;img.loading="lazy";img.decoding="async";image.appendChild(img)}
        var details=document.createElement("div");details.className="cart-item__details";
        var name=document.createElement("h3");name.textContent=displayName;details.appendChild(name);
        var variant=document.createElement("p");variant.textContent=(item.variantLabel==="One size"?t("oneSize"):item.variantLabel)+(item.available?"":" · "+t("unavailable"));details.appendChild(variant);
        var unit=document.createElement("strong");unit.textContent=formatMinor(item.unitPriceMinor,item.currency)+" "+t("each");details.appendChild(unit);
        var actions=document.createElement("div");actions.className="cart-item__actions";
        var qty=document.createElement("span");qty.className="cart-item__qty";
        var decrease=document.createElement("button");decrease.type="button";decrease.dataset.cartAction="decrease";decrease.dataset.lineId=item.lineId;decrease.setAttribute("aria-label",t("decrease")+" "+displayName+" "+t("quantity"));decrease.textContent="−";decrease.disabled=item.quantity<=1;
        var count=document.createElement("span");count.textContent=String(item.quantity);count.setAttribute("aria-live","polite");
        var increase=document.createElement("button");increase.type="button";increase.dataset.cartAction="increase";increase.dataset.lineId=item.lineId;increase.setAttribute("aria-label",t("increase")+" "+displayName+" "+t("quantity"));increase.textContent="+";increase.disabled=item.quantity>=99;
        qty.append(decrease,count,increase);
        var remove=document.createElement("button");remove.type="button";remove.className="cart-item__remove";remove.dataset.cartAction="remove";remove.dataset.lineId=item.lineId;remove.setAttribute("aria-label",t("removeFromBag")+": "+displayName);remove.textContent=t("remove");
        actions.append(qty,remove);
        row.append(image,details,actions);itemList.appendChild(row);
      });
      var currency=summary.currency||"THB";
      $("#cartSubtotal").textContent=formatMinor(summary.subtotalMinor,currency);
      $("#cartDiscount").textContent="−"+formatMinor(summary.discountMinor,currency);
      $("#cartTotal").textContent=formatMinor(summary.totalMinor,currency);
      $("#checkoutTotal").textContent=formatMinor(summary.totalMinor,currency);
      $("#cartDiscountRow").hidden=summary.discountMinor<=0;
      $("#cartCheckout").disabled=!summary.items.length||summary.items.some(function(item){return !item.available});
      $("#cartStatus").textContent=summary.items.some(function(item){return !item.available})?t("removeUnavailable"):"";
      if(!summary.items.length)$("#cartSearchInput").value="";
      filterBagItems();
    }
    function filterBagItems(){
      var query=$("#cartSearchInput").value.trim().toLocaleLowerCase(),rows=$$(".cart-item",$("#cartItems")),matches=0;
      rows.forEach(function(row){var matched=!query||row.dataset.search.indexOf(query)>=0;row.hidden=!matched;if(matched)matches++});
      $("#cartSearchEmpty").hidden=!query||matches>0||!bagSummary||!bagSummary.items.length;
    }
    function syncCartState(){
      if(!bagSummary||!cart.length)return;
      cart.forEach(function(states,lookIndex){
        states.forEach(function(state,index){
          var item=looks[lookIndex].items[index],variantId=variantIdFor(item,state.size);
          state.added=!!variantId&&bagSummary.items.some(function(entry){return entry.productId===item.id&&entry.variantId===variantId});
        });
      });
    }
    function applyCartSummary(summary,animate){
      var previous=bagSummary?bagSummary.itemCount:0;
      bagSummary=summary;renderBag(summary);syncCartState();
      if(animate&&summary.itemCount>previous){$$("[data-tally]").forEach(function(t){t.classList.remove("bump");void t.offsetWidth;t.classList.add("bump")})}
      if(looks.length&&active>=0)renderSlip();
    }
    async function openBag(){
      try{
        applyCartSummary(await cartApi.getCart(cartId),false);
        $("#cartSearchInput").value="";filterBagItems();
        setCartMode("cart");cartDialog.showModal();requestAnimationFrame(function(){cartDialog.classList.add("is-open")});
        $("#cartClose").focus({preventScroll:true});
      }catch(error){ui.Toast.show(error.message||t("openBagFailed"))}
    }
    function setBagBusy(on){
      $$("[data-cart-action]",cartDialog).forEach(function(button){button.disabled=on||button.dataset.cartAction==="decrease"&&Number(button.nextElementSibling&&button.nextElementSibling.textContent)<=1});
      $("#cartCheckout").disabled=on||!bagSummary||!bagSummary.itemCount||bagSummary.items.some(function(item){return !item.available});
    }
    async function updateBagItem(action,lineId){
      if(!bagSummary||!lineId)return;
      var item=bagSummary.items.find(function(entry){return entry.lineId===lineId});if(!item)return;
      setBagBusy(true);$("#cartStatus").textContent=t("updateBag");
      try{
        var summary=action==="remove"?await cartApi.removeItem(cartId,lineId):await cartApi.updateItem(cartId,lineId,item.quantity+(action==="increase"?1:-1));
        applyCartSummary(summary,false);
      }catch(error){$("#cartStatus").textContent=error.message||t("couldNotUpdate")}
      finally{setBagBusy(false)}
    }
    function renderOrderConfirmation(order){
      lastOrder=order;
      var panel=$("#cartConfirmation");panel.replaceChildren();
      var title=document.createElement("h3");title.textContent=t("orderReceived");
      var number=document.createElement("p");number.textContent=t("orderLabel")+" "+order.orderNumber;
      var amount=document.createElement("p");amount.textContent=t("totalLabel")+": "+formatMinor(order.totalMinor,order.currency);
      var status=document.createElement("p");status.textContent=t("orderSaved");
      var close=document.createElement("button");close.type="button";close.className="cart__checkout";close.id="confirmationDone";close.textContent=t("continueShopping");
      panel.append(title,number,amount,status,close);setCartMode("confirmation");
    }
    function clearCheckoutErrors(){
      $$(".checkout__error",checkoutForm).forEach(function(error){error.textContent=""});
      $$("[aria-invalid='true']",checkoutForm).forEach(function(field){field.removeAttribute("aria-invalid")});
    }
    function setCheckoutError(fieldName,message,field){
      var target=$("[data-error-for='"+fieldName+"']",checkoutForm);if(target)target.textContent=message;
      if(field)field.setAttribute("aria-invalid","true");
    }
    function populateAddressFields(){
      var source=window.SoShuAddressData;if(!source)return;
      var province=checkoutForm.elements.province,district=checkoutForm.elements.district,manual=checkoutForm.elements.districtManual,provinceSearch=checkoutForm.elements.provinceSearch,districtSearch=checkoutForm.elements.districtSearch,provinceOptions=$("#provinceOptions"),districtOptions=$("#districtOptions");
      source.provinces.forEach(function(entry){var selectOption=document.createElement("option");selectOption.value=entry.th;selectOption.textContent=entry.th+" / "+entry.en;province.appendChild(selectOption)});
      function refreshProvinceOptions(){
        provinceOptions.replaceChildren();
        source.provinces.forEach(function(entry){var option=document.createElement("option");option.value=i18n&&i18n.language==="th"?entry.th:entry.en;provinceOptions.appendChild(option)});
        if(province.value){var selected=source.provinces.find(function(entry){return entry.th===province.value});if(selected)provinceSearch.value=i18n&&i18n.language==="th"?selected.th:selected.en}
      }
      function fillDistrictOptions(items){districtOptions.replaceChildren();items.forEach(function(name){var option=document.createElement("option");option.value=name;districtOptions.appendChild(option)})}
      function updateDistricts(){
        var selected=province.value,items=source.districts[selected]||[];district.replaceChildren();manual.value="";
        if(items.length){
          var blank=document.createElement("option");blank.value="";blank.textContent=t("selectDistrict");district.appendChild(blank);
          items.forEach(function(name){var option=document.createElement("option");option.value=name;option.textContent=name;district.appendChild(option)});
          fillDistrictOptions(items);districtSearch.disabled=false;districtSearch.hidden=false;districtSearch.placeholder=t("searchDistrict");districtSearch.value="";manual.hidden=true;manual.value="";district.value="";
        }else if(selected){
          var entry=document.createElement("option");entry.value="__manual__";entry.textContent=t("enterDistrict");district.appendChild(entry);district.value="__manual__";fillDistrictOptions([]);districtSearch.value="";districtSearch.disabled=true;districtSearch.hidden=true;manual.hidden=false;
        }else{
          var placeholder=document.createElement("option");placeholder.value="";placeholder.textContent=t("selectProvinceFirst");district.appendChild(placeholder);fillDistrictOptions([]);districtSearch.value="";districtSearch.disabled=true;districtSearch.hidden=false;districtSearch.placeholder=t("selectProvinceFirst");manual.hidden=true;manual.value="";
        }
        clearCheckoutErrors();
      }
      provinceSearch.addEventListener("input",function(){
        var typed=provinceSearch.value.trim(),normalized=typed.toLocaleLowerCase(),match=source.provinces.find(function(entry){return entry.th.toLocaleLowerCase()===normalized||entry.en.toLocaleLowerCase()===normalized});
        province.value=match?match.th:"";updateDistricts();provinceSearch.value=match?(i18n&&i18n.language==="th"?match.th:match.en):typed;
      });
      districtSearch.addEventListener("input",function(){
        var typed=districtSearch.value.trim().toLocaleLowerCase(),items=source.districts[province.value]||[],match=items.find(function(name){return name.toLocaleLowerCase()===typed});
        district.value=match||"";clearCheckoutErrors();
      });
      province.addEventListener("change",function(){var entry=source.provinces.find(function(item){return item.th===province.value});provinceSearch.value=entry?(i18n&&i18n.language==="th"?entry.th:entry.en):"";updateDistricts()});district.addEventListener("change",function(){clearCheckoutErrors()});
      document.addEventListener("soshu:language-change",function(){refreshProvinceOptions();updateDistricts()});
      refreshProvinceOptions();
      updateDistricts();
    }
    function validateCheckoutFields(){
      clearCheckoutErrors();
      var name=checkoutForm.elements.name,email=checkoutForm.elements.email,phone=checkoutForm.elements.phone,address=checkoutForm.elements.address,province=checkoutForm.elements.province,provinceSearch=checkoutForm.elements.provinceSearch,district=checkoutForm.elements.district,districtSearch=checkoutForm.elements.districtSearch,manual=checkoutForm.elements.districtManual,postal=checkoutForm.elements.postalCode,consent=checkoutForm.elements.consent,firstInvalid=null;
      function fail(fieldName,message,field){setCheckoutError(fieldName,message,field);if(!firstInvalid)firstInvalid=field}
      if(name.value.trim().length<2)fail("name",t("enterName"),name);
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))fail("email",t("validEmail"),email);
      if(!/^\d{9,10}$/.test(phone.value.trim()))fail("phone",t("validPhone"),phone);
      if(address.value.trim().length<8)fail("address",t("completeAddress"),address);
      if(!province.value)fail("province",t("chooseProvince"),provinceSearch);
      var districtValue=district.value==="__manual__"?manual.value.trim():district.value;
      if(!districtValue)fail("district",t("chooseDistrict"),district.value==="__manual__"?manual:districtSearch);
      if(!/^\d{5}$/.test(postal.value.trim()))fail("postalCode",t("validPostal"),postal);
      if(!consent.checked)fail("consent",t("consentRequired"),consent);
      if(firstInvalid){firstInvalid.focus();return false}
      return true;
    }
    async function submitCheckout(event){
      event.preventDefault();
      if(!validateCheckoutFields())return;
      var fields=new FormData(checkoutForm),submitButton=$("#placeOrder");submitButton.disabled=true;$("#cartStatus").textContent=t("saveOrder");
      checkoutKey=checkoutKey||crypto.randomUUID();
      var customer={name:fields.get("name").trim(),email:fields.get("email").trim(),phone:fields.get("phone").trim(),address:fields.get("address").trim(),district:fields.get("district")==="__manual__"?fields.get("districtManual").trim():fields.get("district"),province:fields.get("province"),postalCode:fields.get("postalCode").trim(),consent:fields.get("consent")==="on"};
      try{
        var order=await cartApi.placeOrder(cartId,customer,checkoutKey);checkoutKey=null;
        applyCartSummary({id:cartId,items:[],itemCount:0,lineCount:0,currency:order.currency,subtotalMinor:0,discountMinor:0,totalMinor:0,inventoryTracked:false},false);
        checkoutForm.reset();checkoutForm.elements.province.dispatchEvent(new Event("change"));clearCheckoutErrors();renderOrderConfirmation(order);ui.Toast.show(t("requestSaved"));
      }catch(error){$("#cartStatus").textContent=error.message||t("couldNotOrder")}
      finally{submitButton.disabled=false}
    }
    async function addToBag(indices){
      var lookIndex=active,look=looks[lookIndex],candidates=indices.filter(function(p){var state=cart[lookIndex][p];return !state.added&&!state.pending});
      if(!candidates.length)return;
      candidates.forEach(function(p){
        cart[lookIndex][p].pending=true;
        var line=$('.line[data-p="'+(p+1)+'"]',lines);if(line){line.classList.add("is-pending");$$("button",line).forEach(function(button){button.disabled=true})}
      });
      try{
        var items=candidates.map(function(p){var item=look.items[p];return {productId:item.id,variantId:variantIdFor(item,cart[lookIndex][p].size),quantity:1}});
        var summary=await cartApi.addItems(cartId,items);
        candidates.forEach(function(p){cart[lookIndex][p].pending=false});
        applyCartSummary(summary,true);
        ui.Toast.show(candidates.length>1?t("productsAdded"):t("productAdded"));
      }catch(error){
        candidates.forEach(function(p){cart[lookIndex][p].pending=false});
        if(active===lookIndex){renderSlip();$("#msg").textContent=error.message||t("couldNotAdd")}
      }
    }
    function setHot(p,scroll){
      $$(".line.is-hot").forEach(function(el){el.classList.remove("is-hot")});
      if(!p)return;
      var line=$('.line[data-p="'+p+'"]',lines);
      if(line){line.classList.add("is-hot");if(scroll)line.scrollIntoView({block:"nearest",behavior:reduced?"auto":"smooth"})}
    }
    function createFocusModel(i,product){
      var rect=focusStage.getBoundingClientRect(),isJar=product&&product.presentation&&product.presentation.model==="cream-jar",ratio=isJar?1.72:4/7,h=Math.min(rect.height,rect.width/ratio);
      var jarScale=isJar?(mobile ? 0.72 : 0.58):1;
      h=Math.max(isJar&&mobile?128:160,h*jarScale);
      var wrap=document.createElement("div");wrap.className="focus__model";wrap.style.setProperty("--focus-h",h+"px");wrap.style.setProperty("--focus-w",(h*ratio)+"px");
      wrap.innerHTML='<div class="model__fig">'+imageMarkup(product||ringProductFor(i),i,true)+'</div>';
      focusStage.appendChild(wrap);return wrap;
    }
    function openFocus(options){
      if(focusOpen||focusClosing)return;
      focus.classList.remove("is-closing");slip.classList.remove("is-closing");
      options=options||{};var productMode=options.mode==="product",i=productMode?Number(options.index)||0:mod(Math.round(goal),9);
      stopAuto();if(!productMode)setHot(0,false);
      var product=options.product||ringProductFor(i);
      if(productMode){
        var scrollbarGap=Math.max(0,window.innerWidth-document.documentElement.clientWidth),bodyPadding=document.body.style.paddingRight;
        if(scrollbarGap)document.body.style.paddingRight=(parseFloat(getComputedStyle(document.body).paddingRight)||0)+scrollbarGap+"px";
        focusContext={mode:"product",product:product,index:i,origin:options.origin||null,bodyPadding:bodyPadding,scrollbarGap:scrollbarGap};
        document.body.appendChild(focus);document.body.appendChild(slip);document.documentElement.classList.add("is-product-focus");document.body.classList.add("is-product-focus");deck.classList.add("is-product-focus");
      }else{focusContext={mode:"look",product:product,index:i,origin:null}}
      var source=productMode?options.origin:$(".model__fig",bodies[i]);
      if(!source)source=$(".model__fig",bodies[mod(Math.round(goal),9)]);
      var src=source.getBoundingClientRect();
      $("#focusNum").textContent=pad(i+1)+".";$("#focusName").textContent=localizedName(product)||localizedName(looks[i]);
      var detailPanel=$("#focusDetails");detailPanel.innerHTML=productDetailsMarkup(product);detailPanel.hidden=!product;
      var model=createFocusModel(i,product),dst=model.getBoundingClientRect();
      focusOpen=true;deck.classList.add("is-focus");focus.setAttribute("aria-hidden","false");slip.setAttribute("aria-hidden","false");
      renderSlip();
      if(!reduced){
        model.style.transition="none";
        model.style.transform="translate3d("+(src.left-dst.left)+"px,"+(src.bottom-dst.bottom)+"px,0) scale("+src.height/dst.height+")";
        void model.offsetWidth;model.style.transition="";model.style.transform="";
      }
      $("#focusClose").focus({preventScroll:true});
    }
    function closeFocus(){
      if(!focusOpen)return;
      focusClosing=true;
      var context=focusContext,productReturn=context&&context.mode==="product",model=$(".focus__model",focusStage),i=mod(Math.round(goal),9),targetElement=productReturn&&context.origin&&context.origin.isConnected?context.origin:$(".model__fig",bodies[i]),target=targetElement.getBoundingClientRect(),returnDuration=productReturn&&!reduced?1350:1180,originVisibility=null;
      if(productReturn&&context.origin&&context.origin.isConnected){originVisibility=context.origin.style.visibility;context.origin.style.visibility="hidden";context.originVisibility=originVisibility;focus.classList.add("is-product-returning")}
      focus.classList.add("is-closing");slip.classList.add("is-closing");
      var activeEl=document.activeElement;if(activeEl&&(focus.contains(activeEl)||slip.contains(activeEl)))stage.focus({preventScroll:true});
      if(model&&!reduced){
        var currentTransform=getComputedStyle(model).transform;
        model.style.transition="none";model.style.transform=currentTransform==="none"?"none":currentTransform;void model.offsetWidth;
        model.getBoundingClientRect();model.style.transform="none";void model.offsetWidth;var base=model.getBoundingClientRect();
        model.style.transform=currentTransform==="none"?"none":currentTransform;void model.offsetWidth;
        model.style.transition="transform "+returnDuration+"ms cubic-bezier(.22,1,.36,1)";
        model.style.transform="translate3d("+(target.left-base.left)+"px,"+(target.bottom-base.bottom)+"px,0) scale("+(target.width/base.width)+","+(target.height/base.height)+")";
      }
      focusOpen=false;deck.classList.add("is-returning");deck.classList.remove("is-focus");focus.setAttribute("aria-hidden","true");slip.setAttribute("aria-hidden","true");setHot(0,false);
      if(context&&context.mode==="product"){
        setTimeout(function(){
          if(focusOpen)return;
          if(model&&model.parentNode)model.remove();
          document.documentElement.classList.remove("is-product-focus");document.body.classList.remove("is-product-focus");deck.classList.remove("is-product-focus");
          if(context.origin&&context.origin.isConnected)context.origin.style.visibility=context.originVisibility||"";
          document.body.style.paddingRight=context.bodyPadding||"";
          document.querySelector("so-shu-focus-view").appendChild(focus);document.querySelector("so-shu-product-slip").appendChild(slip);
          focus.classList.remove("is-closing","is-product-returning");slip.classList.remove("is-closing");slip.classList.remove("is-product-focus");deck.classList.remove("is-returning");focusContext=null;renderSlip();
          if(context.origin&&context.origin.isConnected)context.origin.closest("button")&&context.origin.closest("button").focus({preventScroll:true});
          focusClosing=false;
        },reduced?0:returnDuration+70);
      }else{
        setTimeout(function(){if(!focusOpen&&model&&model.parentNode)model.remove();focus.classList.remove("is-closing");slip.classList.remove("is-closing");deck.classList.remove("is-returning");focusContext=null;focusClosing=false},reduced?0:1250);
      }
      scheduleAuto();
    }
    function setGrid(on){
      if(grid===on||focusOpen||focusClosing)return;stopAuto();
      bodies.forEach(function(body,i){var a=wrapAngle((i-pos)*STEP),d=Math.round(Math.abs(a)/Math.PI*4);body.style.setProperty("--d",d*(on ? .32 : .24)+"s")});
      deck.classList.add("is-anim");deck.classList.toggle("is-leaving-grid",!on);grid=on;deck.classList.toggle("is-grid",on);
      $$(".deck__vbtn").forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.v===(on?"grid":"ring")))});
      stage.setAttribute("aria-roledescription",on?"grid of products":"carousel of products");
      if(on)layoutGrid();else{bodies.forEach(function(b){b.style.opacity="1";b.style.filter="none"});dirty=true;layoutRing()}
      setTimeout(function(){deck.classList.remove("is-anim","is-leaving-grid")},reduced?0:1700);
    }
    function pointerMoveFollow(e){
      if(!follow||!deck.classList.contains("has-follow")||e.pointerType!=="mouse")return;
      var rect=stage.getBoundingClientRect();followTarget={x:e.clientX-rect.left,y:e.clientY-rect.top};
      if(!followShown){followNow={x:followTarget.x,y:followTarget.y};followShown=true;follow.classList.add("is-on")}
      var hit=e.target.closest&&e.target.closest(".model__hit"),isFront=false,isLink=false;
      if(hit){var hitIndex=Number(hit.dataset.i);if(grid)isFront=true;else{isFront=shortest(hitIndex,mod(Math.round(goal),9))===0;isLink=!isFront}}
      follow.classList.toggle("is-view",isFront&&!drag&&!focusOpen&&!focusClosing);follow.classList.toggle("is-link",isLink&&!drag&&!focusOpen&&!focusClosing);follow.classList.toggle("is-dragging",!!drag);follow.classList.toggle("is-pin",focusOpen&&!!e.target.closest(".focus__close"));
      if(!followRaf)followRaf=requestAnimationFrame(function step(){
        var f=reduced?1:.18;followNow.x+=(followTarget.x-followNow.x)*f;followNow.y+=(followTarget.y-followNow.y)*f;
        follow.style.transform="translate3d("+followNow.x.toFixed(1)+"px,"+followNow.y.toFixed(1)+"px,0)";
        if(Math.hypot(followTarget.x-followNow.x,followTarget.y-followNow.y)>.4)followRaf=requestAnimationFrame(step);else followRaf=0;
      });
    }
    function pointerDown(e){
      if(focusOpen||focusClosing||grid||(e.pointerType==="mouse"&&e.button!==0))return;
      drag={id:e.pointerId,x:e.clientX,y:e.clientY,startGoal:goal,dx:0,dragging:false,trail:[{x:e.clientX,t:performance.now()}]};
    }
    function pointerMove(e){
      pointerMoveFollow(e);if(!drag||e.pointerId!==drag.id)return;
      if(e.pointerType==="mouse"&&!(e.buttons&1)){release(e);return}
      var dx=e.clientX-drag.x,dy=e.clientY-drag.y;
      if(!drag.dragging){
        if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){drag=null;return}
        if(Math.abs(dx)>8&&Math.abs(dx)>1.2*Math.abs(dy)){drag.dragging=true;deck.classList.add("is-dragging");try{stage.setPointerCapture(e.pointerId)}catch(_){}stopAuto()}
        else return;
      }
      drag.dx=dx;var now=performance.now();drag.trail.push({x:e.clientX,t:now});if(drag.trail.length>6)drag.trail.shift();
      goal=drag.startGoal-dx/dragPx;setActive(mod(Math.round(goal),9));kick();
    }
    function release(e){
      if(!drag||e.pointerId!==drag.id)return;
      var d=drag;drag=null;deck.classList.remove("is-dragging");
      if(d.dragging){
        var first=d.trail[0],lastSample=d.trail[d.trail.length-1],v=(lastSample.x-first.x)/Math.max(1,lastSample.t-first.t),base=Math.round(d.startGoal),target;
        if(mobile){target=Math.abs(d.dx)>30||Math.abs(v)>.3?base+(d.dx<0?1:-1):base}
        else{target=Math.round(goal-v*160/dragPx);if(target===base&&Math.abs(v)>.3)target=base+(v<0?1:-1);target=Math.max(base-2,Math.min(base+2,target))}
        goTo(target);dragEnd=performance.now();
      }
      kick();scheduleAuto();
    }
    function clickHit(e){
      if(focusClosing)return;
      if(performance.now()-dragEnd<60)return;
      var hit=e.target.closest(".model__hit");if(!hit)return;
      var i=Number(hit.dataset.i);
      if(grid){goal=i;pos=i;vel=0;setActive(i);layoutGrid();openFocus({mode:"product",product:ringProductFor(i),index:i})}
      else{var d=shortest(i,mod(Math.round(goal),9));if(d===0)openFocus({mode:"product",product:ringProductFor(i),index:i});else{stopAuto();goTo(Math.round(goal)+d)}}
    }
    function handleWheel(e){
      if(focusOpen||focusClosing||grid||Math.abs(e.deltaX)<=Math.abs(e.deltaY))return;
      e.preventDefault();if(wheelLock)return;wheelSum+=e.deltaX;
      if(Math.abs(wheelSum)>45){stopAuto();if(wheelSum>0)next();else prev();wheelSum=0;wheelLock=true;setTimeout(function(){wheelLock=false},520)}
    }
    function keydown(e){
      if(focusClosing){if(e.key==="Escape")e.preventDefault();return}
      if(e.key==="Escape"){if(focusOpen){e.preventDefault();closeFocus()}return}
      if(document.activeElement!==stage&&!stage.contains(document.activeElement))return;
      if(e.key==="ArrowRight"){e.preventDefault();stopAuto();next()}
      else if(e.key==="ArrowLeft"){e.preventDefault();stopAuto();prev()}
      else if(grid&&e.key==="ArrowDown"){e.preventDefault();stopAuto();jumpTo(active+3)}
      else if(grid&&e.key==="ArrowUp"){e.preventDefault();stopAuto();jumpTo(active-3)}
      else if(e.key==="Enter"&&!focusOpen){e.preventDefault();if(grid){goal=active;pos=active;vel=0}openFocus({mode:"product",product:ringProductFor(active),index:active})}
    }
    stage.addEventListener("pointerdown",pointerDown);
    stage.addEventListener("pointermove",pointerMove);
    stage.addEventListener("pointerup",release);stage.addEventListener("pointercancel",release);
    stage.addEventListener("pointerleave",function(){if(follow){follow.classList.remove("is-on","is-view","is-link");followShown=false}});
    stage.addEventListener("click",clickHit);
    stage.addEventListener("wheel",handleWheel,{passive:false});
    stage.addEventListener("keydown",keydown);
    document.addEventListener("keydown",function(e){if(focusClosing){e.preventDefault();stage.focus({preventScroll:true});return}if(e.key==="Escape"&&focusOpen){e.preventDefault();closeFocus()}});
    $("#auto").addEventListener("click",function(){setAutoplay(!autoplay)});
    $("#shop").addEventListener("click",function(){openFocus({mode:"product",product:ringProductFor(active),index:active})});
    $("#bagButton").addEventListener("click",openBag);
    document.addEventListener("soshu:language-change",function(){
      if(!looks.length)return;
      looks.forEach(function(look,index){
        var product=ringProductFor(index),name=localizedName(product)||localizedName(look),hit=$(".model__hit",bodies[index]),image=$(".model__pic",bodies[index]);
        labelEls[index].textContent=pad(index+1)+"  "+name;
        if(hit)hit.setAttribute("aria-label",t("liveProduct")+" "+pad(index+1)+": "+name);
        if(image)image.alt=name;
      });
      $("#nowName").textContent=localizedName(ringProductFor(active))||localizedName(looks[active]);
      var errorKeys={name:"enterName",email:"validEmail",phone:"validPhone",address:"completeAddress",province:"chooseProvince",district:"chooseDistrict",postalCode:"validPostal",consent:"consentRequired"};
      $$(".checkout__error").forEach(function(error){var key=errorKeys[error.dataset.errorFor];if(error.textContent&&key)error.textContent=t(key)});
      if(cartMode==="confirmation"&&lastOrder)renderOrderConfirmation(lastOrder);
      if(focusOpen&&focusContext){
        $("#focusName").textContent=localizedName(focusContext.product)||localizedName(looks[active]);
        $("#focusDetails").innerHTML=productDetailsMarkup(focusContext.product);$("#focusDetails").hidden=!focusContext.product;
      }
      renderSlip();if(bagSummary)renderBag(bagSummary);
    });
    $("#cartSearchInput").addEventListener("input",filterBagItems);
    $("#cartClose").addEventListener("click",function(){cartDialog.close()});
    $("#cartCheckout").addEventListener("click",function(){checkoutKey=null;setCartMode("checkout");$("#cartStatus").textContent="";checkoutForm.querySelector('[name="name"]').focus()});
    $("#checkoutBack").addEventListener("click",function(){setCartMode("cart");$("#cartStatus").textContent="";$("#cartCheckout").focus()});
    checkoutForm.addEventListener("submit",submitCheckout);
    populateAddressFields();
    checkoutForm.addEventListener("input",function(event){
      var name=event.target.name==="districtManual"?"district":event.target.name;if(!name)return;
      var error=$("[data-error-for='"+name+"']",checkoutForm);if(error)error.textContent="";event.target.removeAttribute("aria-invalid");
    });
    checkoutForm.addEventListener("change",function(event){
      var name=event.target.name==="districtManual"?"district":event.target.name;if(!name)return;
      var error=$("[data-error-for='"+name+"']",checkoutForm);if(error)error.textContent="";event.target.removeAttribute("aria-invalid");
    });
    $("#privacyPolicyLink").addEventListener("click",function(){$("#privacyPolicy").open=true});
    cartDialog.addEventListener("close",function(){cartDialog.classList.remove("is-open");$("#bagButton").focus({preventScroll:true})});
    cartDialog.addEventListener("click",function(e){
      if(e.target===cartDialog){cartDialog.close();return}
      if(e.target.closest("#confirmationDone")){cartDialog.close();return}
      var action=e.target.closest("[data-cart-action]");if(action){updateBagItem(action.dataset.cartAction,action.dataset.lineId)}
    });
    $$(".deck__vbtn").forEach(function(b){b.addEventListener("click",function(){setGrid(b.dataset.v==="grid")})});
    $("#focusClose").addEventListener("click",closeFocus);
    focusStage.addEventListener("click",function(e){if(!e.target.closest(".model__fig"))closeFocus()});
    document.addEventListener("soshu:open-product",function(event){
      var detail=event.detail||{};if(detail.product&&detail.origin)openFocus({mode:"product",product:detail.product,origin:detail.origin,index:detail.index});
    });
    lines.addEventListener("pointerover",function(e){var line=e.target.closest(".line");if(line&&e.pointerType==="mouse")setHot(Number(line.dataset.p),false)});
    lines.addEventListener("pointerleave",function(){setHot(0,false)});
    lines.addEventListener("click",function(e){
      var line=e.target.closest(".line");if(!line)return;stopAuto();
      var p=Number(line.dataset.p)-1,state=cart[active][p];
      if(e.target.closest(".line__add")){
        if(state.added)return;
        if(looks[active].items[p].sizes.length===1)addToBag([p]);
        else openPick(p,!line.classList.contains("is-picking"));
      }else if(e.target.closest(".size")){
        var size=e.target.closest(".size");state.size=size.dataset.s;state.touched=true;
        line.dataset.variantId=variantIdFor(looks[active].items[p],state.size)||"";
        $$(".size",line).forEach(function(s){s.setAttribute("aria-pressed",String(s===size))});
      }else if(e.target.closest(".pick__ok")){state.touched=true;addToBag([p])}
    });
    $("#cta").addEventListener("click",function(){
      if(focusContext&&focusContext.mode==="product"){
        var productIndex=looks[active].items.findIndex(function(item){return item.id===focusContext.product.id});
        if(productIndex>=0&&cart[active][productIndex]&&cart[active][productIndex].added)openBag();
        else if(productIndex>=0)addToBag([productIndex]);else $("#msg").textContent=t("notLinked");
        return;
      }
      var states=cart[active],missing=states.map(function(s,p){return !s.added&&!s.touched?p:-1}).filter(function(p){return p>=0});
      if(states.every(function(s){return s.added}))return;
      stopAuto();
      var confirmed=states.map(function(s,p){return !s.added&&s.touched?p:-1}).filter(function(p){return p>=0});
      if(confirmed.length)addToBag(confirmed);
      if(missing.length){
        var open=mobile?missing.slice(0,1):missing;
        open.forEach(function(p){openPick(p,true)});
        $("#msg").textContent=t("chooseSize")+": "+missing.map(function(p){return localizedName(looks[active].items[p])}).join(", ");
      }
    });
    slip.addEventListener("pointerenter",function(e){if(e.pointerType==="mouse"){slipHover=true;scheduleAuto()}});
    slip.addEventListener("pointerleave",function(e){if(e.pointerType==="mouse"){slipHover=false;scheduleAuto()}});
    window.addEventListener("resize",measure);
    if("ResizeObserver" in window)new ResizeObserver(measure).observe(stage);
    if("IntersectionObserver" in window)new IntersectionObserver(function(entries){visible=entries[entries.length-1].isIntersecting;if(visible){kick();scheduleAuto()}else{clearTimeout(autoTimer);autoTimer=0}}).observe(stage);
    document.addEventListener("visibilitychange",function(){if(!document.hidden){kick();scheduleAuto()}else{clearTimeout(autoTimer);autoTimer=0}});
    if(matchMedia("(hover: hover) and (pointer: fine)").matches){deck.classList.add("has-follow")}else if(follow)follow.remove();
    catalogService.loadLooks().then(function(loadedLooks){
      looks=loadedLooks;
      ringProducts=[];
      looks.forEach(function(look){look.items.forEach(function(item){if(item.image&&!ringProducts.some(function(product){return product.id===item.id}))ringProducts.push(item)})});
      cart=looks.map(function(look){return look.items.map(function(item){return {added:false,pending:false,size:item.sizes.length>1?item.sizes[1]:item.sizes[0],touched:item.sizes.length===1}})});
      return cartApi.getCart(cartId).catch(function(error){
        console.error("Unable to load the So-Shu shopping bag.",error);
        $("#cartStatus").textContent=t("bagUnavailable");
        return {id:cartId,items:[],itemCount:0,lineCount:0,currency:"THB",subtotalMinor:0,discountMinor:0,totalMinor:0,inventoryTracked:false};
      });
    }).then(function(summary){
      bagSummary=summary;syncCartState();renderBag(summary);build();
    }).catch(function(error){
      console.error("Unable to load the So Shu catalog.",error);
      $("#live").textContent=t("lookbookFailed");
    });
  })();
