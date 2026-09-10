const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./preload-helper-tKe0viCo.js","./navbar-BMNCdbui.js","./navbar-CA-44msS.css"])))=>i.map(i=>d[i]);
import{i as A,a as M,o as C,e as S,u as q,h as f,d as u,b as U,s as g,c as H,q as L,m as I,n as x,f as N,v as P,g as R,j as z}from"./navbar-BMNCdbui.js";import{_ as h}from"./preload-helper-tKe0viCo.js";const D={pending:{label:"Ожидает",cls:"badge-warning"},processing:{label:"В обработке",cls:"badge-info"},shipped:{label:"Отправлен",cls:"badge-info"},delivered:{label:"Доставлен",cls:"badge-success"},cancelled:{label:"Отменён",cls:"badge-error"}};function b(e){return e.toLocaleString("ru-RU")+" ₽"}function k(e){var a;return((a=e==null?void 0:e.toDate)==null?void 0:a.call(e).toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"}))||""}function O(e){return"★".repeat(Math.round(e))+"☆".repeat(5-Math.round(e))}let v=null;function V(e,a){var i,c;(i=document.getElementById("profile-loader"))==null||i.remove(),document.getElementById("profile-auth-guard").style.display="none",document.getElementById("profile-content").style.display="block";const l=e.displayName||(a==null?void 0:a.displayName)||"Пользователь",r=l[0].toUpperCase();document.getElementById("profile-avatar").textContent=r,document.getElementById("profile-name-display").textContent=l,document.getElementById("profile-email-display").textContent=e.email,document.getElementById("profile-name-input").value=l,document.getElementById("profile-phone-input").value=(a==null?void 0:a.phone)||"",document.getElementById("profile-email-input").value=e.email,j(e.uid),F(e.uid),document.querySelectorAll(".profile-nav-item").forEach(t=>{t.addEventListener("click",()=>{var n;document.querySelectorAll(".profile-nav-item").forEach(d=>d.classList.remove("active")),t.classList.add("active");const s=t.dataset.tab;document.querySelectorAll(".tab-panel").forEach(d=>d.classList.remove("active")),(n=document.getElementById(`tab-${s}`))==null||n.classList.add("active")})}),(c=document.getElementById("profile-form"))==null||c.addEventListener("submit",async t=>{t.preventDefault();const s=t.submitter;s.disabled=!0;try{const{updateProfile:n}=await h(async()=>{const{updateProfile:p}=await import("./preload-helper-tKe0viCo.js").then(m=>m.a);return{updateProfile:p}},__vite__mapDeps([0,1,2]),import.meta.url),{auth:d}=await h(async()=>{const{auth:p}=await import("./navbar-BMNCdbui.js").then(m=>m.cv);return{auth:p}},__vite__mapDeps([1,2]),import.meta.url),o=document.getElementById("profile-name-input").value.trim(),y=document.getElementById("profile-phone-input").value.trim();await n(d.currentUser,{displayName:o}),await q(f(u,"users",e.uid),{displayName:o,phone:y,updatedAt:U()}),document.getElementById("profile-name-display").textContent=o,document.getElementById("profile-avatar").textContent=o[0].toUpperCase(),g("Профиль сохранён","success")}catch{g("Ошибка сохранения","error")}finally{s.disabled=!1}})}function j(e){const a=H(u,"orders"),l=L(a,x("userId","==",e),I("createdAt","desc"));v&&v(),v=N(l,r=>{const i=document.getElementById("orders-list");if(i.innerHTML="",r.empty){i.innerHTML=`
        <div class="empty-state">
          <span class="empty-state-icon">📦</span>
          <h3>Заказов нет</h3>
          <p>Оформите первый заказ в каталоге.</p>
          <a href="./index.html" class="btn btn-primary mt-16">В каталог</a>
        </div>`;return}r.forEach(c=>{var d;const t=c.data(),s=D[t.status]||{label:t.status,cls:"badge-info"},n=document.createElement("div");n.className="order-item animate-fade-up",n.innerHTML=`
        <div class="order-header">
          <div>
            <div class="order-id"># ${c.id.slice(0,8).toUpperCase()}</div>
            <div style="font-size:0.8rem;color:var(--text-muted);">${k(t.createdAt)}</div>
          </div>
          <span class="badge ${s.cls}">${s.label}</span>
          <span style="font-weight:700;">${b(t.total)}</span>
        </div>
        <div class="order-products">
          ${(t.items||[]).slice(0,3).map(o=>`
            <div class="order-product-row">
              <img class="order-product-img" src="${o.imageUrl||"https://placehold.co/44x44/1a1a1a/555?text=📦"}" alt="${o.name}" />
              <span style="flex:1;">${o.name}</span>
              <span style="color:var(--text-muted);">${o.qty} шт.</span>
              <span>${b(o.price*o.qty)}</span>
            </div>`).join("")}
          ${((d=t.items)==null?void 0:d.length)>3?`<p style="font-size:0.8rem;color:var(--text-muted);">и ещё ${t.items.length-3} позиции...</p>`:""}
        </div>
        <div class="order-footer">
          <span style="color:var(--text-muted);">📍 ${t.address||"Адрес не указан"}</span>
          <span>${t.phone||""}</span>
        </div>`,i.appendChild(n)})})}async function F(e){const a=document.getElementById("my-reviews-list");a.innerHTML='<div class="loader"><div class="spinner"></div></div>';const l=L(P(u,"reviews"),x("userId","==",e),I("createdAt","desc"));try{const r=await R(l);if(a.innerHTML="",r.empty){a.innerHTML='<div class="empty-state"><span class="empty-state-icon">⭐</span><h3>Нет отзывов</h3><p>Вы ещё не оставляли отзывов.</p></div>';return}r.forEach(i=>{var n,d,o;const c=i.data(),t=document.createElement("div");t.className="review-manage-item animate-fade-up";const s=i.ref.parent.parent.id;t.innerHTML=`
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span class="stars" style="font-size:0.85rem;">${O(c.rating)}</span>
            <span style="font-size:0.75rem;color:var(--text-muted);">${((d=(n=c.createdAt)==null?void 0:n.toDate)==null?void 0:d.call(n).toLocaleDateString("ru-RU"))||""}</span>
          </div>
          <a href="./product.html?id=${s}" style="font-size:0.8rem;color:var(--accent);text-decoration:underline;">Перейти к товару</a>
          <p style="font-size:0.875rem;color:var(--text-secondary);margin-top:6px;line-height:1.6;">${c.text}</p>
        </div>
        <button class="btn btn-danger btn-sm" data-rid="${i.id}" data-pid="${s}">🗑</button>`,(o=t.querySelector("button"))==null||o.addEventListener("click",async y=>{if(!confirm("Удалить отзыв?"))return;const{increment:p,updateDoc:m,doc:G}=await h(async()=>{const{increment:B,updateDoc:$,doc:_}=await import("./preload-helper-tKe0viCo.js").then(T=>T.i);return{increment:B,updateDoc:$,doc:_}},__vite__mapDeps([0,1,2]),import.meta.url),w=y.currentTarget.dataset.rid,E=y.currentTarget.dataset.pid;await z(f(u,"products",E,"reviews",w)),await m(f(u,"products",E),{reviewCount:p(-1)}),t.remove(),g("Отзыв удалён","info")}),a.appendChild(t)})}catch(r){console.error(r),a.innerHTML='<p style="color:var(--text-muted);padding:24px;">Не удалось загрузить отзывы.</p>'}}document.addEventListener("DOMContentLoaded",()=>{A(),M();const e=document.getElementById("page-loader");C((a,l)=>{var r;if(e&&e.classList.add("hidden"),!a){document.getElementById("profile-auth-guard").style.display="block",document.getElementById("profile-content").style.display="none",(r=document.getElementById("profile-login-btn"))==null||r.addEventListener("click",()=>S("login"));return}V(a,l)})});
