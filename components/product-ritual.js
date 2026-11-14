(function(){
  "use strict";

  customElements.define("so-shu-product-ritual",class extends HTMLElement{
    connectedCallback(){
      if(this.dataset.mounted)return;
      this.dataset.mounted="true";
      this.innerHTML='<section class="ritual-section" aria-labelledby="ritual-title">'+
        '<div class="ritual__stage">'+
        '<div class="ritual__copy"><p class="ritual__eyebrow cap">SO-SHU · DAILY RITUAL</p><h2 class="ritual__title" id="ritual-title"></h2><p class="ritual__hint cap" data-i18n="exploreProducts">Explore products · Choose your formula</p></div>'+ 
          '<div class="ritual__carousel" aria-label="So-Shu products" data-i18n-aria-label="productsAria"></div>'+ 
          '<div class="ritual__formula"><ul class="ritual__ingredients" aria-label="Product formula details" data-i18n-aria-label="formulaAria"></ul></div>'+ 
          '<nav class="ritual__product-controls" aria-label="Change skincare product" data-i18n-aria-label="changeProduct">'+
            '<button class="ritual__side-arrow ritual__side-arrow--prev" type="button" aria-label="Previous product" data-i18n-aria-label="previousProduct"><span aria-hidden="true">←</span></button>'+ 
            '<button class="ritual__side-arrow ritual__side-arrow--next" type="button" aria-label="Next product" data-i18n-aria-label="nextProduct"><span aria-hidden="true">→</span></button>'+ 
          '</nav>'+ 
        '</div></section>';

      var section=this.querySelector(".ritual-section"),stage=this.querySelector(".ritual__stage"),copy=this.querySelector(".ritual__copy"),eyebrow=this.querySelector(".ritual__eyebrow"),title=this.querySelector(".ritual__title"),carousel=this.querySelector(".ritual__carousel"),ingredientList=this.querySelector(".ritual__ingredients"),prevButton=this.querySelector(".ritual__side-arrow--prev"),nextButton=this.querySelector(".ritual__side-arrow--next");
      var products=[],productNodes=[],ingredientItems=[],activeProductIndex=-1,pendingProductIndex=-1,pendingEntryOrigin=null,formulaAnimationStartedAt=0,phaseStartedAt=0,pendingFormulaItems=[],formulaExitOpacities=[],formulaExitProgress=1,transitionPhase="idle",isTransitioning=false,swapDirection=1,swapPlans=[],raf=0,productSwapDuration=1450;
      var reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      function clamp(value){return Math.max(0,Math.min(1,value))}
      function between(from,to,progress){return from+(to-from)*progress}
      function smooth(value){value=clamp(value);return value*value*(3-2*value)}
      function productImage(product){return product.ritualImage||product.image||""}
      function productName(product){return window.SoShuI18n?window.SoShuI18n.name(product):product.name||product.id}
      function clampBetween(value,min,max){return Math.max(min,Math.min(max,value))}
      function targetCenter(){
        var width=stage.clientWidth,mobile=width<=700;
        return {x:width*.5,y:stage.clientHeight*(mobile ? (width<=380 ? .48 : .44) : .55)};
      }
      function previewMetrics(product){
        var width=stage.clientWidth,height=stage.clientHeight,mobile=width<=700,medium=width<=1000;
        var boxWidth=mobile?clampBetween(width*.16,width<=380?52:58,width<=380?60:68):medium?clampBetween(width*.15,100,170):clampBetween(width*.14,110,220);
        var boxHeight=mobile?clampBetween(height*.09,54,70):medium?Math.min(height*.19,160):Math.min(height*.23,190);
        var x=mobile?clampBetween(width*.13,width<=380?40:50,width<=380?50:58):clampBetween(width*.08,medium?68:76,medium?110:156);
        return {x:x,y:mobile?height*(width<=380?.61:.64):height*.55,width:boxWidth,height:boxHeight};
      }
      function getNode(index){return productNodes[(index+productNodes.length)%productNodes.length]}
      function scaleAtPreview(node,product){
        var box=previewMetrics(product),width=node.element.offsetWidth||1,height=node.element.offsetHeight||1;
        return clampBetween(Math.min(box.width/width,box.height/height),.12,.55);
      }
      function readEntryOrigin(node,mirror,product){
        var rect=node&&node.element.getBoundingClientRect(),stageRect=stage.getBoundingClientRect(),metrics=previewMetrics(product);
        var x=rect&&rect.width?rect.left+rect.width*.5-stageRect.left:metrics.x;
        if(mirror)x=stage.clientWidth-x;
        var y=rect&&rect.height?rect.top+rect.height*.5-stageRect.top:metrics.y;
        return {x:x,y:y,scale:node?scaleAtPreview(node,product):.22};
      }
      function placeNode(node,x,y,scale,opacity,z){
        var element=node.element,baseX=element.offsetLeft+element.offsetWidth*.5,baseY=element.offsetTop+element.offsetHeight*.5;
        element.style.transform="translate3d("+(x-baseX).toFixed(1)+"px,"+(y-baseY).toFixed(1)+"px,0) scale("+scale.toFixed(3)+")";
        element.style.opacity=String(clamp(opacity));element.style.zIndex=String(z);
        element.style.visibility=opacity<=.01?"hidden":"visible";
      }
      function setControlsLocked(locked){
        prevButton.disabled=locked||products.length<2;nextButton.disabled=locked||products.length<2;
        productNodes.forEach(function(node){node.element.disabled=true;node.element.tabIndex=-1;node.element.setAttribute("aria-hidden","true")});
        if(!locked&&activeProductIndex>=0&&products.length>1){
          var activeNode=getNode(activeProductIndex),activeProduct=products[activeProductIndex];
          activeNode.element.disabled=false;activeNode.element.tabIndex=0;activeNode.element.setAttribute("aria-hidden","false");
          activeNode.element.setAttribute("aria-label",(window.SoShuI18n?window.SoShuI18n.t("view"):"View")+": "+productName(activeProduct));
          var nextNode=getNode(activeProductIndex+1),nextProduct=products[(activeProductIndex+1)%products.length];
          nextNode.element.disabled=false;nextNode.element.tabIndex=0;nextNode.element.setAttribute("aria-hidden","false");
          nextNode.element.setAttribute("aria-label",(window.SoShuI18n?window.SoShuI18n.t("nextProduct"):"Preview next product")+": "+productName(nextProduct));
        }
      }
      function setProductHeading(index){
        var product=products[index];if(!product)return;
        title.textContent=productName(product);title.classList.toggle("ritual__title--long",String(productName(product)).length>36);
        eyebrow.textContent="SO-SHU · DAILY RITUAL · "+String(index+1).padStart(2,"0");
        section.dataset.productId=product.id;section.dataset.productIndex=String(index+1);
      }
      function setStableProductPositions(){
        if(activeProductIndex<0||!productNodes.length)return;
        var center=targetCenter(),nextIndex=(activeProductIndex+1)%products.length,preview=previewMetrics(products[nextIndex]);
        productNodes.forEach(function(node,index){
          var product=products[index],element=node.element;
          if(index===activeProductIndex){placeNode(node,center.x,center.y,1,1,5);element.classList.add("is-active");element.classList.remove("is-preview")}
          else if(index===nextIndex){placeNode(node,preview.x,preview.y,scaleAtPreview(node,product),1,4);element.classList.add("is-preview");element.classList.remove("is-active")}
          else{placeNode(node,stage.clientWidth+element.offsetWidth,center.y,.18,0,1);element.classList.remove("is-active","is-preview")}
        });
        setControlsLocked(false);
      }
      function setFormulaItems(items){
        ingredientList.replaceChildren();
        ingredientItems=(Array.isArray(items)?items:[]).map(function(entry,index){
          var item=document.createElement("li"),name=document.createElement("strong");
          item.className="ritual__ingredient";item.dataset.index=String(index);item.setAttribute("aria-hidden","true");
          if(entry.image){var image=document.createElement("img");image.className="ritual__ingredient-image";image.alt="";image.loading="lazy";image.decoding="async";image.src=entry.image;item.append(image)}
          else{var placeholder=document.createElement("span");placeholder.className="ritual__ingredient-image ritual__ingredient-image--placeholder";placeholder.setAttribute("aria-hidden","true");item.append(placeholder)}
          name.className="ritual__ingredient-name";name.textContent=window.SoShuI18n?window.SoShuI18n.name(entry):entry.name;item.append(name);ingredientList.append(item);return item;
        });
      }
      function prepareProduct(product,index){
        activeProductIndex=index;formulaAnimationStartedAt=0;
        var details=product.ingredients&&product.ingredients.length?product.ingredients:product.formulaHighlights;
        pendingFormulaItems=Array.isArray(details)?details.slice():[];
        setProductHeading(index);setFormulaItems([]);
        var center=targetCenter(),node=getNode(index);transitionPhase="product-enter";phaseStartedAt=performance.now();isTransitioning=true;
        setControlsLocked(true);section.dataset.phase="product-entry";
        placeNode(node,center.x,center.y,.2,1,6);
        requestRender();
      }
      function finishProductEntry(now){
        transitionPhase="formula-enter";formulaAnimationStartedAt=now;
        setFormulaItems(pendingFormulaItems);pendingFormulaItems=[];
        setStableProductPositions();isTransitioning=false;section.dataset.phase="formula-flight";setControlsLocked(false);
        if(reduced)requestRender();
      }
      function buildProductNodes(){
        carousel.replaceChildren();productNodes=products.map(function(product,index){
          var element=document.createElement("button"),image=document.createElement("img");
          element.type="button";element.className="ritual__product-visual";element.dataset.productIndex=String(index);element.disabled=true;element.tabIndex=-1;element.setAttribute("aria-hidden","true");
          if(product.presentation&&product.presentation.model==="cream-jar")element.classList.add("ritual__product-visual--jar");
          image.className="ritual__product-image";image.src=productImage(product);image.alt="";image.decoding="async";image.draggable=false;element.append(image);carousel.append(element);
          var node={element:element,image:image,index:index};
          element.addEventListener("click",function(){
            if(isTransitioning)return;
            if(index===activeProductIndex){
              section.dispatchEvent(new CustomEvent("soshu:open-product",{bubbles:true,detail:{product:product,origin:image,index:index}}));
              return;
            }
            selectProduct((activeProductIndex+1)%products.length,1, node);
          });
          return node;
        });
      }
      function beginProductSwap(now){
        var center=targetCenter(),left=previewMetrics(products[(activeProductIndex+1)%products.length]),fromIndex=activeProductIndex,toIndex=pendingProductIndex;
        var outgoing=getNode(fromIndex),incoming=getNode(toIndex),outgoingScale=scaleAtPreview(outgoing,products[fromIndex]),incomingOrigin=pendingEntryOrigin;
        if(swapDirection>0){
          var refillIndex=(toIndex+1)%products.length,refill=getNode(refillIndex);
          swapPlans=[
            {node:outgoing,from:{x:center.x,y:center.y,scale:1,opacity:1},to:{x:stage.clientWidth+outgoing.element.offsetWidth*.55,y:center.y,scale:outgoingScale,opacity:1},z:4},
            {node:incoming,from:{x:incomingOrigin.x,y:incomingOrigin.y,scale:incomingOrigin.scale,opacity:1},to:{x:center.x,y:center.y,scale:1,opacity:1},z:5}
          ];
          if(products.length>2&&refillIndex!==fromIndex&&refillIndex!==toIndex){
            var refillScale=scaleAtPreview(refill,products[refillIndex]);
            swapPlans.push({node:refill,from:{x:left.x,y:left.y,scale:.08,opacity:1},to:{x:left.x,y:left.y,scale:refillScale,opacity:1},z:7,delay:.34,end:.72});
          }
        }else{
          var oldPreview=getNode((fromIndex+1)%products.length),incomingMetrics=previewMetrics(products[toIndex]);
          swapPlans=[
            {node:outgoing,from:{x:center.x,y:center.y,scale:1,opacity:1},to:{x:left.x,y:left.y,scale:outgoingScale,opacity:1},z:5},
            {node:incoming,from:{x:stage.clientWidth-incomingMetrics.x,y:center.y,scale:incomingOrigin.scale,opacity:1},to:{x:center.x,y:center.y,scale:1,opacity:1},z:6}
          ];
          if(products.length>2&&oldPreview!==outgoing&&oldPreview!==incoming){
            swapPlans.push({node:oldPreview,from:{x:left.x,y:left.y,scale:scaleAtPreview(oldPreview,products[(fromIndex+1)%products.length]),opacity:1},to:{x:-oldPreview.element.offsetWidth*.55,y:left.y,scale:.14,opacity:0},z:3});
          }
        }
        swapPlans.forEach(function(plan){placeNode(plan.node,plan.from.x,plan.from.y,plan.from.scale,plan.from.opacity,plan.z)});
        activeProductIndex=toIndex;setProductHeading(toIndex);setControlsLocked(true);
        transitionPhase="product-swap";phaseStartedAt=now;isTransitioning=true;section.dataset.phase="product-swap";
      }
      function selectProduct(index,direction,source){
        if(!products.length||isTransitioning)return;
        index=(index+products.length)%products.length;if(index===activeProductIndex)return;
        direction=direction||(index>activeProductIndex?1:-1);swapDirection=direction>0?1:-1;pendingProductIndex=index;
        var previewNode=getNode((activeProductIndex+1)%products.length),originSource=source||previewNode;
        pendingEntryOrigin=readEntryOrigin(originSource,swapDirection<0,products[index]);
        pendingEntryOrigin.scale=scaleAtPreview(getNode(index),products[index]);
        var details=products[index].ingredients&&products[index].ingredients.length?products[index].ingredients:products[index].formulaHighlights;
        pendingFormulaItems=Array.isArray(details)?details.slice():[];
        formulaExitProgress=formulaAnimationStartedAt?clamp((performance.now()-formulaAnimationStartedAt)/1350):1;
        formulaExitOpacities=ingredientItems.map(function(item){var opacity=parseFloat(getComputedStyle(item).opacity);return Number.isFinite(opacity)?opacity:0});
        if(reduced){
          activeProductIndex=index;setProductHeading(index);finishProductEntry(performance.now());return;
        }
        transitionPhase=ingredientItems.length?"ingredients-exit":"product-swap";isTransitioning=true;setControlsLocked(true);section.dataset.phase=transitionPhase;
        if(!ingredientItems.length)beginProductSwap(performance.now());
        requestRender();
      }
      function updateIngredientPositions(now){
        var width=stage.clientWidth,height=stage.clientHeight,mobile=width<=700,columns=width<=360?2:3;
        var itemWidth=mobile?Math.min((width-28-(columns-1)*8)/columns,136):width<=1000?Math.min(width*.3,280):Math.min(width*.26,340);
        var targetTop=height*(width<=360?.68:.73),targetBottom=height*.95,rowCount=Math.max(1,Math.ceil(ingredientItems.length/columns)),rowGap=(targetBottom-targetTop)/rowCount,startOffsetX=mobile?width*.04:Math.min(110,width*.07),topY=height*.2,bottomY=height*.8;
        var formulaProgress=transitionPhase==="ingredients-exit"?formulaExitProgress:formulaAnimationStartedAt?(reduced?1:clamp((now-formulaAnimationStartedAt)/1350)):0;
        ingredientItems.forEach(function(item,index){
          var start=.05+index*.14,fly=reduced?1:smooth((formulaProgress-start)/.28),startY=height*.5,targetY,targetX;
          if(mobile){
            var row=Math.floor(index/columns),rowStart=row*columns,itemsInRow=Math.min(columns,ingredientItems.length-rowStart),column=index-rowStart,rowWidth=itemsInRow*itemWidth+(itemsInRow-1)*8;
            targetX=(width-rowWidth)*.5+itemWidth*.5+column*(itemWidth+8)-width*.5;
            targetY=targetTop+rowGap*(row+.5);
          }else{
            var desktopGap=(bottomY-topY)/Math.max(1,ingredientItems.length);
            targetX=Math.min(width*.31,560);targetY=topY+desktopGap*(index+.5);
          }
          var x=startOffsetX+(targetX-startOffsetX)*fly,yOffset=(startY-height*.5)+(targetY-startY)*fly+Math.sin(fly*Math.PI)*(index%2?-8:8),scale=mobile ? .96+.04*fly : .88+.12*fly,opacity=fly;
          if(transitionPhase==="ingredients-exit"){
            var exitProgress=smooth((now-phaseStartedAt-index*38)/250);opacity=(formulaExitOpacities[index]||0)*(1-exitProgress);
          }
          item.style.width=itemWidth.toFixed(1)+"px";item.style.opacity=String(opacity);
          item.style.transform="translate3d("+x.toFixed(1)+"px,"+yOffset.toFixed(1)+"px,0) translate(-50%,-50%) scale("+scale.toFixed(3)+")";
          item.setAttribute("aria-hidden",opacity>.02?"false":"true");
        });
      }
      function requestRender(){if(!raf)raf=requestAnimationFrame(render)}
      document.addEventListener("soshu:language-change",function(){
        if(activeProductIndex<0)return;
        setProductHeading(activeProductIndex);
        ingredientItems.forEach(function(item,index){var entry=(pendingFormulaItems[index]||((products[activeProductIndex].ingredients||products[activeProductIndex].formulaHighlights||[])[index]));var name=item.querySelector(".ritual__ingredient-name");if(name&&entry)name.textContent=window.SoShuI18n?window.SoShuI18n.name(entry):entry.name});
        if(window.SoShuI18n)window.SoShuI18n.apply(this);
      }.bind(this));
      function render(){
        raf=0;if(!products.length)return;
        var now=performance.now(),center=targetCenter(),phaseProgress=1;
        if(transitionPhase==="ingredients-exit")phaseProgress=reduced?1:clamp((now-phaseStartedAt)/420);
        else if(transitionPhase==="product-enter")phaseProgress=reduced?1:clamp((now-phaseStartedAt)/1150);
        else if(transitionPhase==="product-swap")phaseProgress=reduced?1:clamp((now-phaseStartedAt)/productSwapDuration);
        updateIngredientPositions(now);

        if(transitionPhase==="product-enter"){
          var enterProgress=smooth(phaseProgress),enterNode=getNode(activeProductIndex);
          placeNode(enterNode,center.x,center.y,between(.2,1,enterProgress),1,6);
          if(phaseProgress>=1){placeNode(enterNode,center.x,center.y,1,1,5);finishProductEntry(now)}
        }else if(transitionPhase==="ingredients-exit"&&phaseProgress>=1){
          setFormulaItems([]);beginProductSwap(now);
        }else if(transitionPhase==="product-swap"){
          var swapProgress=smooth(phaseProgress);
          swapPlans.forEach(function(plan){
            var from=plan.from,to=plan.to;
            if(plan.delay&&phaseProgress<plan.delay){placeNode(plan.node,from.x,from.y,from.scale,0,plan.z);return}
            var localProgress=plan.delay?smooth((phaseProgress-plan.delay)/(plan.end-plan.delay)):swapProgress;
            placeNode(plan.node,between(from.x,to.x,localProgress),between(from.y,to.y,localProgress),between(from.scale,to.scale,localProgress),between(from.opacity,to.opacity,localProgress),plan.z);
          });
          if(phaseProgress>=1){
            swapPlans=[];setStableProductPositions();finishProductEntry(now);
          }
        }else if(transitionPhase==="formula-enter"){
          if(reduced||clamp((now-formulaAnimationStartedAt)/1350)>=1){transitionPhase="idle";section.dataset.phase="product-hold"}
        }else if(transitionPhase==="idle")section.dataset.phase="product-hold";

        var moving=transitionPhase==="ingredients-exit"||transitionPhase==="product-enter"||transitionPhase==="product-swap"||transitionPhase==="formula-enter";
        if(!reduced&&moving)raf=requestAnimationFrame(render);
      }

      prevButton.addEventListener("click",function(){selectProduct(activeProductIndex-1,-1)});
      nextButton.addEventListener("click",function(){selectProduct(activeProductIndex+1,1)});
      if(window.SoShuCatalog){
        window.SoShuCatalog.listProducts().then(function(items){
          products=items.filter(function(product){return product.active!==false});if(!products.length)return;
          buildProductNodes();
          products.forEach(function(product){var preload=new Image();preload.src=productImage(product)});
          prepareProduct(products[0],0);
        }).catch(function(error){console.error("Unable to load the ritual products.",error)});
      }
      window.addEventListener("resize",function(){
        if(!productNodes.length)return;
        if(transitionPhase==="idle"||transitionPhase==="formula-enter"){
          setStableProductPositions();updateIngredientPositions(performance.now());
        }
        else requestRender();
      },{passive:true});
      render();
    }
  });
})();
