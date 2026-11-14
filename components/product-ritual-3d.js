import * as THREE from "../assets/three.module.js";

const BOTTLE_HEIGHT=5.48;
const JAR_HEIGHT=2.72;
const CAMERA_DISTANCE=10;
const CAMERA_FOV=34;

function smooth(value){value=Math.max(0,Math.min(1,value));return value*value*(3-2*value)}

function createStudioEnvironment(){
  const canvas=document.createElement("canvas");
  canvas.width=1024;canvas.height=512;
  const context=canvas.getContext("2d");
  const gradient=context.createLinearGradient(0,0,canvas.width,0);
  gradient.addColorStop(0,"#342632");gradient.addColorStop(.12,"#f1e8ee");gradient.addColorStop(.2,"#ffffff");
  gradient.addColorStop(.29,"#524052");gradient.addColorStop(.45,"#dacbd7");gradient.addColorStop(.54,"#ffffff");
  gradient.addColorStop(.66,"#433342");gradient.addColorStop(.78,"#f8edf3");gradient.addColorStop(.9,"#ffffff");gradient.addColorStop(1,"#342632");
  context.fillStyle=gradient;context.fillRect(0,0,canvas.width,canvas.height);
  context.save();context.filter="blur(24px)";context.fillStyle="rgba(255,255,255,.88)";
  context.fillRect(165,70,62,360);context.fillRect(476,45,42,400);context.fillRect(766,92,74,320);context.restore();
  const texture=new THREE.CanvasTexture(canvas);
  texture.mapping=THREE.EquirectangularReflectionMapping;texture.colorSpace=THREE.SRGBColorSpace;
  return texture;
}

function createShadowTexture(){
  const canvas=document.createElement("canvas");canvas.width=256;canvas.height=128;
  const context=canvas.getContext("2d"),gradient=context.createRadialGradient(128,64,4,128,64,122);
  gradient.addColorStop(0,"rgba(56,29,49,.34)");gradient.addColorStop(.45,"rgba(56,29,49,.18)");gradient.addColorStop(1,"rgba(56,29,49,0)");
  context.fillStyle=gradient;context.fillRect(0,0,256,128);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

function loadImage(source){
  return new Promise(function(resolve,reject){
    const image=new Image();
    image.onload=function(){resolve(image)};
    image.onerror=function(){reject(new Error("Unable to load the product label artwork."))};
    image.src=source;
    if(image.complete&&image.naturalWidth)resolve(image);
  });
}

function createLabelTexture(image,crop){
  const area=crop||{x:.25,y:.313,width:.5,height:.624};
  const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=1920;
  const context=canvas.getContext("2d"),sx=Math.round(image.naturalWidth*area.x),sy=Math.round(image.naturalHeight*area.y);
  const sw=Math.round(image.naturalWidth*area.width),sh=Math.round(image.naturalHeight*area.height);
  context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(image,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;texture.needsUpdate=true;
  return texture;
}

export async function mountRitualBottle(options){
  const canvas=options.canvas,stage=options.stage;
  const labelImage=await loadImage(options.labelImage);
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas:canvas,alpha:true,antialias:true,powerPreference:"low-power",premultipliedAlpha:false})}
  catch(error){console.warn("WebGL is unavailable; using the product image fallback.",error);return null}

  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  const scene=new THREE.Scene();scene.environment=createStudioEnvironment();
  const camera=new THREE.PerspectiveCamera(CAMERA_FOV,1,.1,60);camera.position.set(0,0,CAMERA_DISTANCE);camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0xfff6fa,0x675363,1.65));
  const keyLight=new THREE.DirectionalLight(0xffffff,3.1);keyLight.position.set(-4.5,6,6);scene.add(keyLight);
  const fillLight=new THREE.DirectionalLight(0xffd7e8,1.4);fillLight.position.set(4,2.2,4);scene.add(fillLight);
  const rimLight=new THREE.DirectionalLight(0xffffff,2.2);rimLight.position.set(-1,4,-4);scene.add(rimLight);

  const root=new THREE.Group();scene.add(root);
  const bottleGroup=new THREE.Group(),jarGroup=new THREE.Group();root.add(bottleGroup,jarGroup);
  const whitePlastic=new THREE.MeshPhysicalMaterial({color:0xfffcfe,roughness:.22,metalness:.02,clearcoat:.55,clearcoatRoughness:.18,envMapIntensity:1.15});
  const pumpPlastic=new THREE.MeshPhysicalMaterial({color:0xf7f4f7,roughness:.27,metalness:.01,clearcoat:.48,clearcoatRoughness:.2,envMapIntensity:1.05});
  const chrome=new THREE.MeshPhysicalMaterial({color:0xe9e9ed,roughness:.16,metalness:.94,clearcoat:.42,clearcoatRoughness:.12,envMapIntensity:1.65});
  const bottleWrapMaterial=new THREE.MeshPhysicalMaterial({color:0xc91368,roughness:.45,metalness:0,clearcoat:.2,clearcoatRoughness:.3,envMapIntensity:.35});
  const bottleLabelMaterial=new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.43,metalness:0,clearcoat:.12,clearcoatRoughness:.38,transparent:true,alphaTest:.01,side:THREE.FrontSide,envMapIntensity:.35});
  const jarPlastic=new THREE.MeshPhysicalMaterial({color:0xf2cbd9,roughness:.28,metalness:.01,clearcoat:.45,clearcoatRoughness:.2,envMapIntensity:.8});
  const jarWrapMaterial=new THREE.MeshPhysicalMaterial({color:0xdea1b9,roughness:.4,metalness:0,clearcoat:.18,clearcoatRoughness:.32});
  const jarLabelMaterial=new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.42,metalness:0,clearcoat:.12,clearcoatRoughness:.36,transparent:true,alphaTest:.01,side:THREE.FrontSide,envMapIntensity:.35});

  const bodyProfile=[new THREE.Vector2(0,-2.16),new THREE.Vector2(.43,-2.16),new THREE.Vector2(.64,-2.12),new THREE.Vector2(.735,-2.03),new THREE.Vector2(.765,-1.9),new THREE.Vector2(.765,.46),new THREE.Vector2(.75,.76),new THREE.Vector2(.67,1.02),new THREE.Vector2(.5,1.2),new THREE.Vector2(.38,1.29),new THREE.Vector2(.35,1.42),new THREE.Vector2(.35,1.57),new THREE.Vector2(0,1.57)];
  const body=new THREE.Mesh(new THREE.LatheGeometry(bodyProfile,128),whitePlastic);body.castShadow=true;body.receiveShadow=true;bottleGroup.add(body);
  const bottleWrap=new THREE.Mesh(new THREE.CylinderGeometry(.766,.766,2.68,128,1,true,0,Math.PI*2),bottleWrapMaterial);bottleWrap.position.y=-.27;bottleWrap.renderOrder=1;bottleGroup.add(bottleWrap);
  const bottleLabel=new THREE.Mesh(new THREE.CylinderGeometry(.771,.771,2.68,128,1,true,-1.08,2.16),bottleLabelMaterial);bottleLabel.position.y=-.27;bottleLabel.renderOrder=2;bottleGroup.add(bottleLabel);

  const chromeSleeve=new THREE.Mesh(new THREE.CylinderGeometry(.376,.39,.49,96,1,false),chrome);chromeSleeve.position.y=1.83;chromeSleeve.castShadow=true;bottleGroup.add(chromeSleeve);
  const chromeLip=new THREE.Mesh(new THREE.TorusGeometry(.378,.024,14,96),chrome);chromeLip.rotation.x=Math.PI/2;chromeLip.position.y=2.075;bottleGroup.add(chromeLip);
  const chromeBaseLip=new THREE.Mesh(new THREE.TorusGeometry(.384,.018,12,96),chrome);chromeBaseLip.rotation.x=Math.PI/2;chromeBaseLip.position.y=1.59;bottleGroup.add(chromeBaseLip);
  function addBottleCylinder(radiusTop,radiusBottom,height,material,x,y,z){
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radiusTop,radiusBottom,height,64,1,false),material);
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;bottleGroup.add(mesh);
  }
  addBottleCylinder(.325,.34,.2,pumpPlastic,.12,2.18,0);addBottleCylinder(.12,.145,.7,pumpPlastic,.12,2.62,0);addBottleCylinder(.16,.14,.12,pumpPlastic,.12,2.99,0);
  const leverShape=new THREE.Shape();leverShape.moveTo(-.72,.015);leverShape.quadraticCurveTo(-.77,.08,-.68,.13);leverShape.lineTo(.34,.16);leverShape.quadraticCurveTo(.46,.16,.47,.065);leverShape.lineTo(.45,-.035);leverShape.quadraticCurveTo(.43,-.1,.32,-.105);leverShape.lineTo(-.65,-.09);leverShape.quadraticCurveTo(-.73,-.09,-.72,.015);
  const lever=new THREE.Mesh(new THREE.ExtrudeGeometry(leverShape,{depth:.18,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.025,bevelThickness:.025,curveSegments:12}),pumpPlastic);lever.position.set(0,3.1,-.09);lever.castShadow=true;bottleGroup.add(lever);

  const jarBodyProfile=[new THREE.Vector2(0,-1.15),new THREE.Vector2(1.24,-1.15),new THREE.Vector2(1.42,-1.1),new THREE.Vector2(1.49,-.97),new THREE.Vector2(1.5,.43),new THREE.Vector2(1.47,.62),new THREE.Vector2(1.38,.7),new THREE.Vector2(0,.7)];
  const jarBody=new THREE.Mesh(new THREE.LatheGeometry(jarBodyProfile,128),jarPlastic);jarBody.castShadow=true;jarBody.receiveShadow=true;jarGroup.add(jarBody);
  const jarLidProfile=[new THREE.Vector2(0,.62),new THREE.Vector2(1.38,.62),new THREE.Vector2(1.48,.67),new THREE.Vector2(1.52,.75),new THREE.Vector2(1.52,1.31),new THREE.Vector2(1.48,1.4),new THREE.Vector2(0,1.4)];
  const jarLid=new THREE.Mesh(new THREE.LatheGeometry(jarLidProfile,128),jarPlastic);jarLid.castShadow=true;jarGroup.add(jarLid);
  const jarWrap=new THREE.Mesh(new THREE.CylinderGeometry(1.501,1.501,1.62,128,1,true,0,Math.PI*2),jarWrapMaterial);jarWrap.position.y=-.23;jarWrap.renderOrder=1;jarGroup.add(jarWrap);
  const jarLabel=new THREE.Mesh(new THREE.CylinderGeometry(1.506,1.506,1.62,128,1,true,-1.28,2.56),jarLabelMaterial);jarLabel.position.y=-.23;jarLabel.renderOrder=2;jarGroup.add(jarLabel);

  function shadowPlane(width,height,x,y,material){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);mesh.position.set(x,y,-.22);root.add(mesh);return mesh}
  const shadowTexture=createShadowTexture(),shadowMaterial=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,opacity:.9,toneMapped:false});
  shadowPlane(2.05,.44,0,-2.22,shadowMaterial);shadowPlane(3.5,.62,0,-1.2,shadowMaterial);

  bottleLabelMaterial.map=createLabelTexture(labelImage,options.labelCrop);jarLabelMaterial.map=createLabelTexture(labelImage,options.labelCrop);
  bottleLabelMaterial.needsUpdate=true;jarLabelMaterial.needsUpdate=true;
  let width=0,height=0,lastProgress=-1,lastAppearance=-1,lastScale=-1,disposed=false,activeType=options.type||"pump-bottle",dragRotation=0,pointerId=null,lastPointerX=0,productRevision=0;
  bottleGroup.visible=activeType!=="cream-jar";jarGroup.visible=activeType==="cream-jar";

  function render(){if(!disposed)renderer.render(scene,camera)}
  function resize(){
    if(disposed)return;
    const rect=stage.getBoundingClientRect(),nextWidth=Math.max(1,Math.round(rect.width)),nextHeight=Math.max(1,Math.round(rect.height));
    if(nextWidth===width&&nextHeight===height)return;
    width=nextWidth;height=nextHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();lastScale=-1;render();
  }
  function setProgress(progress,appearance){
    if(disposed)return;
    resize();if(progress===lastProgress&&appearance===lastAppearance)return;
    lastProgress=progress;lastAppearance=appearance;
    const compact=width<=700,tablet=width<=1000,modelHeight=activeType==="cream-jar"?JAR_HEIGHT:BOTTLE_HEIGHT;
    const desiredPixels=activeType==="cream-jar"?(compact?Math.min(height*.31,230):tablet?Math.min(height*.4,340):Math.min(height*.44,410)):(compact?Math.min(height*.5,360):tablet?Math.min(height*.62,500):Math.min(height*.7,650));
    const viewHeight=2*CAMERA_DISTANCE*Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV/2));
    const scale=desiredPixels/(modelHeight/viewHeight*height);
    if(Math.abs(scale-lastScale)>.001){root.scale.setScalar(scale);lastScale=scale}
    const reveal=smooth(progress/.3);root.position.y=(activeType==="cream-jar"?-.12:-.505)-(1-appearance)*1.35;
    root.rotation.y=-.22*(1-reveal)+.12*reveal+dragRotation;root.rotation.x=.025*(1-appearance);root.rotation.z=0;render();
  }
  async function setProduct(product){
    const revision=++productRevision,image=await loadImage(product.labelImage),texture=createLabelTexture(image,product.labelCrop);
    const type=product.type==="cream-jar"?"cream-jar":"pump-bottle",material=type==="cream-jar"?jarLabelMaterial:bottleLabelMaterial;
    if(disposed||revision!==productRevision){texture.dispose();return false}
    const currentProgress=lastProgress<0?0:lastProgress,currentAppearance=lastAppearance<0?0:lastAppearance;
    const oldTexture=material.map;material.map=texture;material.needsUpdate=true;if(oldTexture)oldTexture.dispose();
    activeType=type;bottleGroup.visible=type!=="cream-jar";jarGroup.visible=type==="cream-jar";dragRotation=0;lastProgress=-1;lastAppearance=-1;lastScale=-1;
    setProgress(currentProgress,currentAppearance);return true;
  }
  function onPointerDown(event){
    if(event.button!==0||event.pointerType==="touch"||pointerId!==null)return;
    if(!isPointerOverModel(event))return;
    pointerId=event.pointerId;lastPointerX=event.clientX;canvas.classList.add("is-dragging");
    try{canvas.setPointerCapture(pointerId)}catch{}
  }
  function isPointerOverModel(event){
    const bounds=stage.getBoundingClientRect(),x=event.clientX-bounds.left-width*.5,y=event.clientY-bounds.top-height*.5;
    const modelHeight=activeType==="cream-jar"?Math.min(height*.44,410):Math.min(height*.7,650),modelWidth=activeType==="cream-jar"?modelHeight*1.72:modelHeight*.48;
    return Math.abs(x)<=modelWidth*.5+48&&Math.abs(y)<=modelHeight*.5+40;
  }
  function onPointerMove(event){
    if(pointerId!==event.pointerId){canvas.classList.toggle("is-over-model",isPointerOverModel(event));return}
    dragRotation+=(event.clientX-lastPointerX)*.009;lastPointerX=event.clientX;render();
  }
  function finishPointer(event){if(pointerId===null||event.pointerId!==pointerId)return;try{canvas.releasePointerCapture(pointerId)}catch{}pointerId=null;canvas.classList.remove("is-dragging")}
  canvas.addEventListener("pointerdown",onPointerDown);canvas.addEventListener("pointermove",onPointerMove);canvas.addEventListener("pointerup",finishPointer);canvas.addEventListener("pointercancel",finishPointer);canvas.addEventListener("lostpointercapture",finishPointer);
  resize();setProgress(0,0);

  return {
    setProgress:setProgress,
    setProduct:setProduct,
    resize:resize,
    dispose:function(){
      if(disposed)return;disposed=true;
      canvas.removeEventListener("pointerdown",onPointerDown);canvas.removeEventListener("pointermove",onPointerMove);canvas.removeEventListener("pointerup",finishPointer);canvas.removeEventListener("pointercancel",finishPointer);canvas.removeEventListener("lostpointercapture",finishPointer);
      root.traverse(function(object){if(object.geometry)object.geometry.dispose();if(object.material){const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(function(material){if(material.map)material.map.dispose();material.dispose()})}});
      scene.environment?.dispose();renderer.dispose();
    }
  };
}
