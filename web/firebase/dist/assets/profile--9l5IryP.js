const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./preload-helper-DNg48SyG.js","./firebase-D4IcALkh.js","./firebase-Baxkqz5J.css"])))=>i.map(i=>d[i]);
import{u as A,a as f,d as u,s as M,c as C,q as x,f as L,h as I,o as S,k as q,g as U,b as H}from"./firebase-D4IcALkh.js";import{_ as g}from"./preload-helper-DNg48SyG.js";import{i as z,a as N,o as P,b as R,s as h}from"./navbar-6rDgd_GQ.js";const k={pending:{label:"Ожидает",cls:"badge-warning"},processing:{label:"В обработке",cls:"badge-info"},shipped:{label:"Отправлен",cls:"badge-info"},delivered:{label:"Доставлен",cls:"badge-success"},cancelled:{label:"Отменён",cls:"badge-error"}};function b(e){return e.toLocaleString("ru-RU")+" ₸"}function D(e){var a;return((a=e==null?void 0:e.toDate)==null?void 0:a.call(e).toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"}))||""}function O(e){return"★".repeat(Math.round(e))+"☆".repeat(5-Math.round(e))}let v=null;function F(e,a){var s,c;(s=document.getElementById("profile-loader"))==null||s.remove(),document.getElementById("profile-auth-guard").style.display="none",document.getElementById("profile-content").style.display="block";const l=e.displayName||(a==null?void 0:a.displayName)||"Пользователь",n=l[0].toUpperCase();document.getElementById("profile-avatar").textContent=n,document.getElementById("profile-name-display").textContent=l,document.getElementById("profile-email-display").textContent=e.email,document.getElementById("profile-name-input").value=l,document.getElementById("profile-phone-input").value=(a==null?void 0:a.phone)||"",document.getElementById("profile-email-input").value=e.email,V(e.uid),j(e.uid),document.querySelectorAll(".profile-nav-item").forEach(t=>{t.addEventListener("click",()=>{var o;document.querySelectorAll(".profile-nav-item").forEach(i=>i.classList.remove("active")),t.classList.add("active");const d=t.dataset.tab;document.querySelectorAll(".tab-panel").forEach(i=>i.classList.remove("active")),(o=document.getElementById(`tab-${d}`))==null||o.classList.add("active")})}),(c=document.getElementById("profile-form"))==null||c.addEventListener("submit",async t=>{t.preventDefault();const d=t.submitter;d.disabled=!0;try{const{updateProfile:o}=await g(async()=>{const{updateProfile:p}=await import("./preload-helper-DNg48SyG.js").then(m=>m.a);return{updateProfile:p}},__vite__mapDeps([0,1,2]),import.meta.url),{auth:i}=await g(async()=>{const{auth:p}=await import("./firebase-D4IcALkh.js").then(m=>m.cq);return{auth:p}},__vite__mapDeps([1,2]),import.meta.url),r=document.getElementById("profile-name-input").value.trim(),y=document.getElementById("profile-phone-input").value.trim();await o(i.currentUser,{displayName:r}),await A(f(u,"users",e.uid),{displayName:r,phone:y,updatedAt:M()}),document.getElementById("profile-name-display").textContent=r,document.getElementById("profile-avatar").textContent=r[0].toUpperCase(),h("Профиль сохранён","success")}catch{h("Ошибка сохранения","error")}finally{d.disabled=!1}})}function V(e){const a=C(u,"orders"),l=x(a,I("userId","==",e),L("createdAt","desc"));v&&v(),v=S(l,n=>{const s=document.getElementById("orders-list");if(s.innerHTML="",n.empty){s.innerHTML=`
        <div class="empty-state">
          <span class="empty-state-icon">📦</span>
          <h3>Заказов нет</h3>
          <p>Оформите первый заказ в каталоге.</p>
          <a href="./index.html" class="btn btn-primary mt-16">В каталог</a>
        </div>`;return}n.forEach(c=>{var i;const t=c.data(),d=k[t.status]||{label:t.status,cls:"badge-info"},o=document.createElement("div");o.className="order-item animate-fade-up",o.innerHTML=`
        <div class="order-header">
          <div>
            <div class="order-id"># ${c.id.slice(0,8).toUpperCase()}</div>
            <div style="font-size:0.8rem;color:var(--text-muted);">${D(t.createdAt)}</div>
          </div>
          <span class="badge ${d.cls}">${d.label}</span>
          <span style="font-weight:700;">${b(t.total)}</span>
        </div>
        <div class="order-products">
          ${(t.items||[]).slice(0,3).map(r=>`
            <div class="order-product-row">
              <img class="order-product-img" src="${r.imageUrl||"https://placehold.co/44x44/1a1a1a/555?text=📦"}" alt="${r.name}" />
              <span style="flex:1;">${r.name}</span>
              <span style="color:var(--text-muted);">${r.qty} шт.</span>
              <span>${b(r.price*r.qty)}</span>
            </div>`).join("")}
          ${((i=t.items)==null?void 0:i.length)>3?`<p style="font-size:0.8rem;color:var(--text-muted);">и ещё ${t.items.length-3} позиции...</p>`:""}
        </div>
        <div class="order-footer">
          <span style="color:var(--text-muted);">📍 ${t.address||"Адрес не указан"}</span>
          <span>${t.phone||""}</span>
        </div>`,s.appendChild(o)})},n=>{console.error("Orders load error:",n);const s=document.getElementById("orders-list");s.innerHTML=`<div class="empty-state">
      <span class="empty-state-icon">⚠️</span>
      <h3>Ошибка загрузки</h3>
      <p style="font-size:0.875rem;color:var(--text-secondary);max-width:300px;margin:10px auto;">
        ${n.message}
      </p>
      <p style="font-size:0.75rem;color:var(--text-muted);">
        Откройте консоль (F12) и нажмите на ссылку от Firebase, чтобы создать индекс.
      </p>
    </div>`})}async function j(e){const a=document.getElementById("my-reviews-list");a.innerHTML='<div class="loader"><div class="spinner"></div></div>';const l=x(q(u,"reviews"),I("userId","==",e),L("createdAt","desc"));try{const n=await U(l);if(a.innerHTML="",n.empty){a.innerHTML='<div class="empty-state"><span class="empty-state-icon">⭐</span><h3>Нет отзывов</h3><p>Вы ещё не оставляли отзывов.</p></div>';return}n.forEach(s=>{var o,i,r;const c=s.data(),t=document.createElement("div");t.className="review-manage-item animate-fade-up";const d=s.ref.parent.parent.id;t.innerHTML=`
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span class="stars" style="font-size:0.85rem;">${O(c.rating)}</span>
            <span style="font-size:0.75rem;color:var(--text-muted);">${((i=(o=c.createdAt)==null?void 0:o.toDate)==null?void 0:i.call(o).toLocaleDateString("ru-RU"))||""}</span>
          </div>
          <a href="./product.html?id=${d}" style="font-size:0.8rem;color:var(--accent);text-decoration:underline;">Перейти к товару</a>
          <p style="font-size:0.875rem;color:var(--text-secondary);margin-top:6px;line-height:1.6;">${c.text}</p>
        </div>
        <button class="btn btn-danger btn-sm" data-rid="${s.id}" data-pid="${d}">🗑</button>`,(r=t.querySelector("button"))==null||r.addEventListener("click",async y=>{if(!confirm("Удалить отзыв?"))return;const{increment:p,updateDoc:m,doc:G}=await g(async()=>{const{increment:B,updateDoc:$,doc:_}=await import("./preload-helper-DNg48SyG.js").then(T=>T.i);return{increment:B,updateDoc:$,doc:_}},__vite__mapDeps([0,1,2]),import.meta.url),w=y.currentTarget.dataset.rid,E=y.currentTarget.dataset.pid;await H(f(u,"products",E,"reviews",w)),await m(f(u,"products",E),{reviewCount:p(-1)}),t.remove(),h("Отзыв удалён","info")}),a.appendChild(t)})}catch(n){console.error(n),a.innerHTML='<p style="color:var(--text-muted);padding:24px;">Не удалось загрузить отзывы.</p>'}}document.addEventListener("DOMContentLoaded",()=>{z(),N();const e=document.getElementById("page-loader");P((a,l)=>{var n;if(e&&e.classList.add("hidden"),!a){document.getElementById("profile-auth-guard").style.display="block",document.getElementById("profile-content").style.display="none",(n=document.getElementById("profile-login-btn"))==null||n.addEventListener("click",()=>R("login"));return}F(a,l)})});
