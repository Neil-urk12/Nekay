import{d as j,j as D,s as J,r as c,q as V,i as M,c as o,a as e,m as S,n as C,F as k,x as g,p as y,f,v as p,y as T,t as v,g as U,o as l}from"./app-W5jICeaV.js";import{_ as $}from"./_plugin-vue_export-helper-DlAUqK2U.js";const B="/assets/melody2-C01HWavO.gif",I={class:"journal-container"},L={class:"content-card"},A={class:"folders-section"},K={class:"folder-list"},W=["onClick"],q={class:"add-folder"},z={class:"journal-section"},H={key:0,class:"new-entry-form"},O={class:"entries-list"},R={key:0},G={class:"entry-header"},P={class:"entry-date"},Q={class:"entry-content"},X=["onClick"],Y=j({__name:"Journal",setup(Z){const a=D(),{journalEntries:_,folders:E,loading:w}=J(a),r=c(""),i=c(""),d=c(""),s=c(null),u=c(!1),b=()=>{r.value.trim()&&i.value.trim()&&(a.addJournalEntry(r.value,i.value,s.value),r.value="",i.value="",u.value=!1)},h=()=>{d.value.trim()&&(a.addFolder(d.value,"journal"),d.value="")},F=V(()=>s.value?_.value.filter(m=>m.folderId===s.value):_.value),N=m=>new Date(m).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});return M(()=>{a.fetchJournalEntries(),a.fetchFolders()}),(m,n)=>(l(),o("div",I,[e("div",L,[n[6]||(n[6]=e("h1",{class:"page-title"},[e("img",{src:B,alt:"My Melody"}),S(" My Journal ")],-1)),e("div",A,[n[5]||(n[5]=e("h2",null,"Categories",-1)),e("div",K,[e("button",{class:C(["folder-item",{active:!s.value}]),onClick:n[0]||(n[0]=t=>s.value=null)}," All Entries ",2),(l(!0),o(k,null,g(y(E).filter(t=>t.type==="journal"),t=>(l(),o("button",{key:t.id,class:C(["folder-item",{active:s.value===t.id}]),onClick:x=>s.value=t.id},v(t.name),11,W))),128))]),e("div",q,[f(e("input",{"onUpdate:modelValue":n[1]||(n[1]=t=>d.value=t),placeholder:"New category name",onKeyup:T(h,["enter"])},null,544),[[p,d.value]]),e("button",{onClick:h},"Add Category")])]),e("div",z,[e("button",{class:"new-entry-button",onClick:n[2]||(n[2]=t=>u.value=!u.value)},v(u.value?"Cancel":"New Entry"),1),u.value?(l(),o("div",H,[f(e("input",{"onUpdate:modelValue":n[3]||(n[3]=t=>r.value=t),placeholder:"Entry title",class:"entry-title-input"},null,512),[[p,r.value]]),f(e("textarea",{"onUpdate:modelValue":n[4]||(n[4]=t=>i.value=t),placeholder:"Write your thoughts...",class:"entry-content-input"},null,512),[[p,i.value]]),e("button",{onClick:b,class:"save-button"},"Save Entry")])):U("v-if",!0),e("div",O,[y(w)?(l(),o("div",R,"Loading...")):(l(!0),o(k,{key:1},g(F.value,t=>(l(),o("div",{key:t.id,class:"entry-item"},[e("div",G,[e("h3",null,v(t.title),1),e("span",P,v(N(t.date)),1)]),e("p",Q,v(t.content),1),e("button",{class:"delete-button",onClick:x=>y(a).deleteJournalEntry(t.id)}," Delete ",8,X)]))),128))])])])]))}}),ne=$(Y,[["__scopeId","data-v-66ef4bb6"]]);export{ne as default};
