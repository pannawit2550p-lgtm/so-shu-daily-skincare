/*
 * JSON-backed catalog adapter.
 *
 * The UI depends on this small interface rather than on the storage format:
 * loadLooks(), listProducts(), getProduct(id), and checkAvailability().
 * Replace the JSON fetch functions with API calls when a backend is ready.
 */
(function(){
  "use strict";

  var schemaVersion=1;
  var dataRoot=new URL("./data/",document.currentScript?document.currentScript.src:document.baseURI);
  var catalogPromise=null;

  function readJson(file){
    return fetch(new URL(file,dataRoot),{headers:{Accept:"application/json"}}).then(function(response){
      if(!response.ok)throw new Error("Catalog request failed ("+response.status+"): "+file);
      return response.json();
    });
  }
  function requireRecord(condition,message){if(!condition)throw new Error("Invalid So-Shu catalog: "+message)}
  function normalizeProduct(record){
    requireRecord(record&&typeof record.id==="string"&&record.id,"product is missing an id");
    requireRecord(record.price&&Number.isFinite(record.price.amount),"product "+record.id+" has an invalid price");
    requireRecord(typeof record.price.currency==="string","product "+record.id+" is missing a currency");
    requireRecord(Array.isArray(record.variants)&&record.variants.length,"product "+record.id+" has no variants");
    var variantIds={};
    record.variants.forEach(function(variant){
      requireRecord(variant&&typeof variant.id==="string"&&variant.id,"product "+record.id+" has a variant without an id");
      requireRecord(!variantIds[variant.id],"duplicate variant id "+variant.id);
      variantIds[variant.id]=true;
    });
    return {
      id:record.id,
      slug:record.slug||record.id.toLowerCase(),
      name:record.name||record.id,
      nameTh:record.nameTh||record.name||record.id,
      description:record.description||"",
      kind:record.category||"Product",
      price:record.price.amount,
      currency:record.price.currency,
      image:record.images&&record.images.primary||null,
      ritualImage:record.images&&record.images.ritual||null,
      presentation:record.presentation&&typeof record.presentation==="object"?record.presentation:{model:"image"},
      productDetails:record.productDetails&&typeof record.productDetails==="object"?record.productDetails:{},
      nameTh:record.nameTh||record.name||record.id,
      formulaHighlights:Array.isArray(record.formulaHighlights)?record.formulaHighlights.filter(function(item){return item&&typeof item.name==="string"}).map(function(item,index){
        return {id:typeof item.id==="string"&&item.id?item.id:"highlight-"+(index+1),name:item.name,image:typeof item.image==="string"?item.image:null};
      }):[],
      ingredients:Array.isArray(record.ingredients)?record.ingredients.filter(function(ingredient){return ingredient&&typeof ingredient.name==="string"}).map(function(ingredient,index){
        return {id:typeof ingredient.id==="string"&&ingredient.id?ingredient.id:"ingredient-"+(index+1),name:ingredient.name,nameTh:ingredient.nameTh||ingredient.name,image:typeof ingredient.image==="string"?ingredient.image:null,description:ingredient.description&&typeof ingredient.description==="object"?ingredient.description:null};
      }):[],
      variants:record.variants,
      sizes:record.variants.filter(function(variant){return variant.active!==false}).map(function(variant){return variant.label}),
      active:record.active!==false
    };
  }
  function loadCatalog(){
    if(!catalogPromise){
      catalogPromise=Promise.all([readJson("products.json"),readJson("looks.json")]).then(function(payloads){
        var productFile=payloads[0],lookFile=payloads[1];
        requireRecord(productFile.schemaVersion===schemaVersion,"unsupported products schema version");
        requireRecord(lookFile.schemaVersion===schemaVersion,"unsupported looks schema version");
        requireRecord(Array.isArray(productFile.products),"products must be an array");
        requireRecord(Array.isArray(lookFile.looks),"looks must be an array");

        var products=productFile.products.map(normalizeProduct),productsById=Object.create(null),lookIds=Object.create(null);
        products.forEach(function(product){
          requireRecord(!productsById[product.id],"duplicate product id "+product.id);
          productsById[product.id]=product;
        });
        var looks=lookFile.looks.map(function(record){
          requireRecord(record&&typeof record.id==="string"&&record.id,"look is missing an id");
          requireRecord(!lookIds[record.id],"duplicate look id "+record.id);
          lookIds[record.id]=true;
          requireRecord(Array.isArray(record.productIds),"look "+record.id+" must reference product IDs");
          var items=record.productIds.map(function(productId){
            requireRecord(productsById[productId],"look "+record.id+" references missing product "+productId);
            return productsById[productId];
          }).filter(function(product){return product.active!==false});
          return {
            id:record.id,
            slug:record.slug||record.id.toLowerCase(),
            name:record.name||record.id,
            nameTh:record.nameTh||record.name||record.id,
            foot:Number(record.foot)||0,
            productIds:record.productIds.slice(),
            items:items
          };
        });
        return {products:products,productsById:productsById,looks:looks};
      }).catch(function(error){
        catalogPromise=null;
        throw error;
      });
    }
    return catalogPromise;
  }

  window.SoShuCatalog={
    loadLooks:function(){return loadCatalog().then(function(catalog){return catalog.looks})},
    listProducts:function(){return loadCatalog().then(function(catalog){return catalog.products.filter(function(product){return product.active!==false})})},
    getProduct:function(productId){return loadCatalog().then(function(catalog){return catalog.productsById[productId]||null})},
    checkAvailability:function(productId,variantId){
      // No stock source is connected. null means "not tracked" and keeps demo add-to-bag working.
      // Future API adapter: resolve { available, quantity } for this product and variant ID.
      return loadCatalog().then(function(catalog){
        var product=catalog.productsById[productId];
        if(!product)throw new Error("Unknown product ID: "+productId);
        if(!product.variants.some(function(variant){return variant.id===variantId}))throw new Error("Unknown variant ID "+variantId+" for product "+productId);
        return null;
      });
    }
  };
})();
