import{d as u,r as i,c as l,a as s,b as m,w as _,e as p,v as f,n as b,t as h,f as y,u as g,o as d}from"./app-2srEbQTa.js";import{_ as w}from"./_plugin-vue_export-helper-DlAUqK2U.js";var E={};const S={class:"login-container"},k={class:"login-box"},x={class:"input-group"},I={key:0,class:"error-message"},V=["disabled"],C=u({__name:"Login",setup(T){const n=g(),e=i(""),a=i(!1),t=i(""),c=async()=>{if(a.value=!1,t.value="",e.value.length<6){a.value=!0,t.value="Secret key must be at least 6 characters";return}try{if(e.value!==E.VITE_SECRET_KEY)throw new Error("Invalid secret key");await new Promise(r=>setTimeout(r,1e3)),localStorage.setItem("isAuthenticated","true"),n.push("/")}catch{a.value=!0,t.value="Invalid secret key"}};return(r,o)=>(d(),l("div",S,[s("div",k,[o[1]||(o[1]=m('<div class="melody-header" data-v-78679b42><div class="melody-ears" data-v-78679b42><div class="ear left" data-v-78679b42></div><div class="ear right" data-v-78679b42></div></div><div class="melody-face" data-v-78679b42><div class="eyes" data-v-78679b42></div><div class="nose" data-v-78679b42></div></div></div><h1 data-v-78679b42>Welcome!</h1>',2)),s("form",{onSubmit:_(c,["prevent"]),class:"login-form"},[s("div",x,[p(s("input",{type:"password","onUpdate:modelValue":o[0]||(o[0]=v=>e.value=v),placeholder:"Enter Secret Key",class:b({error:a.value})},null,2),[[f,e.value]]),a.value?(d(),l("span",I,h(t.value),1)):y("v-if",!0)]),s("button",{type:"submit",disabled:!e.value}," Login ",8,V)],32)])]))}}),L=w(C,[["__scopeId","data-v-78679b42"]]);export{L as default};
