import{d as u,r as l,c as i,a as s,b as f,w as m,e as p,v as _,n as h,t as g,f as y,u as b,o as d}from"./app-BUFjgWNe.js";import{_ as w}from"./_plugin-vue_export-helper-DlAUqK2U.js";const S={class:"login-container"},k={class:"login-box"},x={class:"input-group"},E={key:0,class:"error-message"},I=["disabled"],V=u({__name:"Login",setup(B){const n=b(),e=l(""),a=l(!1),t=l(""),c=async()=>{if(a.value=!1,t.value="",e.value.length<6){a.value=!0,t.value="Secret key must be at least 6 characters";return}try{if(e.value!=="121604181112")throw console.log("Entered:",e.value),console.log("Expected:","121604181112"),new Error("Invalid secret key");await new Promise(r=>setTimeout(r,1e3)),localStorage.setItem("isAuthenticated","true"),n.push("/")}catch{a.value=!0,t.value="Invalid secret key"}};return(r,o)=>(d(),i("div",S,[s("div",k,[o[1]||(o[1]=f('<div class="melody-header" data-v-03fae418><div class="melody-ears" data-v-03fae418><div class="ear left" data-v-03fae418></div><div class="ear right" data-v-03fae418></div></div><div class="melody-face" data-v-03fae418><div class="eyes" data-v-03fae418></div><div class="nose" data-v-03fae418></div></div></div><h1 data-v-03fae418>Welcome!</h1>',2)),s("form",{onSubmit:m(c,["prevent"]),class:"login-form"},[s("div",x,[p(s("input",{type:"password","onUpdate:modelValue":o[0]||(o[0]=v=>e.value=v),placeholder:"Enter Secret Key",class:h({error:a.value})},null,2),[[_,e.value]]),a.value?(d(),i("span",E,g(t.value),1)):y("v-if",!0)]),s("button",{type:"submit",disabled:!e.value}," Login ",8,I)],32)])]))}}),M=w(V,[["__scopeId","data-v-03fae418"]]);export{M as default};
