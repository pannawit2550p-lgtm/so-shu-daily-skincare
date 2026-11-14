/* ตะกร้าจำลองสำหรับ GitHub Pages: ข้อมูลอยู่ในหน่วยความจำของแท็บเท่านั้น */
(function(){
  "use strict";
  var lines=[];
  function makeId(){
    if(window.crypto&&crypto.randomUUID)return crypto.randomUUID();
    return "line-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);
  }
  async function productFor(productId,variantId){
    var product=await window.SoShuCatalog.getProduct(productId);
    if(!product||product.active===false)throw new Error("This product is unavailable.");
    var variant=(product.variants||[]).find(function(entry){return entry.id===variantId&&entry.active!==false;});
    if(!variant)throw new Error("This product option is unavailable.");
    return {product:product,variant:variant};
  }
  async function makeSummary(id){
    var items=await Promise.all(lines.map(async function(line){
      var record=await productFor(line.productId,line.variantId);
      return {
        lineId:line.lineId,
        productId:line.productId,
        variantId:line.variantId,
        name:record.product.name,
        variantLabel:record.variant.label,
        sku:record.variant.sku||line.productId,
        image:record.product.image,
        unitPriceMinor:Math.round(record.product.price*100),
        currency:record.product.currency||"THB",
        quantity:line.quantity,
        available:true
      };
    }));
    var subtotalMinor=items.reduce(function(total,item){return total+item.unitPriceMinor*item.quantity;},0);
    var selected=Object.create(null);
    items.forEach(function(item){selected[item.productId]=(selected[item.productId]||0)+item.quantity;});
    var hasWholeRoutine=["SHU-0804","SHU-0805","SHU-0806"].every(function(productId){return selected[productId]>0;});
    var discountMinor=0;
    if(hasWholeRoutine){
      var routineCount=Math.min(selected["SHU-0804"],selected["SHU-0805"],selected["SHU-0806"]);
      var oneRoutine=items.filter(function(item){return ["SHU-0804","SHU-0805","SHU-0806"].includes(item.productId);})
        .reduce(function(total,item){return total+item.unitPriceMinor;},0);
      discountMinor=Math.round(oneRoutine*0.1)*routineCount;
    }
    return {
      id:id,
      items:items,
      itemCount:items.reduce(function(total,item){return total+item.quantity;},0),
      lineCount:items.length,
      currency:items[0]&&items[0].currency||"THB",
      subtotalMinor:subtotalMinor,
      discountMinor:discountMinor,
      totalMinor:Math.max(0,subtotalMinor-discountMinor),
      inventoryTracked:false
    };
  }
  async function addItems(id,additions){
    for(var i=0;i<additions.length;i++){
      var item=additions[i],quantity=Number(item.quantity);
      if(!Number.isInteger(quantity)||quantity<1||quantity>99)throw new Error("Quantity must be between 1 and 99.");
      await productFor(item.productId,item.variantId);
      var existing=lines.find(function(line){return line.productId===item.productId&&line.variantId===item.variantId;});
      if(existing){
        existing.quantity=Math.min(99,existing.quantity+quantity);
      }else{
        lines.push({lineId:makeId(),productId:item.productId,variantId:item.variantId,quantity:quantity});
      }
    }
    return makeSummary(id);
  }
  window.SoShuCartApi={
    demo:true,
    createCartId:makeId,
    getCart:makeSummary,
    async addItem(id,item){return addItems(id,[item]);},
    addItems:addItems,
    async updateItem(id,lineId,quantity){
      var line=lines.find(function(entry){return entry.lineId===lineId;});
      if(!line)throw new Error("This bag item could not be found.");
      if(!Number.isInteger(quantity)||quantity<1||quantity>99)throw new Error("Quantity must be between 1 and 99.");
      line.quantity=quantity;
      return makeSummary(id);
    },
    async removeItem(id,lineId){
      lines=lines.filter(function(entry){return entry.lineId!==lineId;});
      return makeSummary(id);
    },
    async placeOrder(){throw new Error("Checkout is disabled on this public portfolio demo.");}
  };
})();
