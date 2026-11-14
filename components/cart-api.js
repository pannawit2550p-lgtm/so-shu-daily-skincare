(function(){
  "use strict";

  function newId(){
    if(window.crypto&&crypto.randomUUID)return crypto.randomUUID();
    if(window.crypto&&crypto.getRandomValues){
      var bytes=new Uint8Array(16);crypto.getRandomValues(bytes);
      bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
      var hex=Array.prototype.map.call(bytes,function(value){return value.toString(16).padStart(2,"0")}).join("");
      return hex.slice(0,8)+"-"+hex.slice(8,12)+"-"+hex.slice(12,16)+"-"+hex.slice(16,20)+"-"+hex.slice(20);
    }
    throw new Error("A secure browser ID generator is required for the shopping bag.");
  }
  function cartId(){
    var storageKey="so-shu-cart-id";
    try{
      var stored=localStorage.getItem(storageKey);
      if(stored&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(stored))return stored;
      stored=newId();localStorage.setItem(storageKey,stored);return stored;
    }catch(error){return newId()}
  }
  async function request(url,options){
    var response=await fetch(url,Object.assign({headers:{Accept:"application/json"}},options||{}));
    var payload;
    try{payload=await response.json()}catch(error){payload={}}
    if(!response.ok){
      var detail=payload.error||{};
      var requestError=new Error(detail.message||"The shopping bag could not be updated.");
      requestError.code=detail.code||"REQUEST_FAILED";requestError.status=response.status;throw requestError;
    }
    return payload;
  }
  function json(method,body){return {method:method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}}

  window.SoShuCartApi={
    createCartId:cartId,
    async getCart(id){return (await request("/api/cart/"+encodeURIComponent(id))).cart},
    async addItem(id,item){return (await request("/api/cart/"+encodeURIComponent(id)+"/items",json("POST",item))).cart},
    async addItems(id,items){return (await request("/api/cart/"+encodeURIComponent(id)+"/items/batch",json("POST",{items:items}))).cart},
    async updateItem(id,lineId,quantity){return (await request("/api/cart/"+encodeURIComponent(id)+"/items/"+encodeURIComponent(lineId),json("PATCH",{quantity:quantity}))).cart},
    async removeItem(id,lineId){return (await request("/api/cart/"+encodeURIComponent(id)+"/items/"+encodeURIComponent(lineId),{method:"DELETE",headers:{Accept:"application/json"}})).cart},
    async placeOrder(id,customer,idempotencyKey){return (await request("/api/orders",{
      method:"POST",
      headers:{Accept:"application/json","Content-Type":"application/json","Idempotency-Key":idempotencyKey},
      body:JSON.stringify({cartId:id,customer:customer})
    })).order}
  };
})();
