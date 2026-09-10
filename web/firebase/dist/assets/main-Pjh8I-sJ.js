import{i as I,a as T,g as k,s as d,q as v,l as b,m as E,c as L,d as $,f as C,n as f,p as S,r as g}from"./navbar-BMNCdbui.js";import{a as q}from"./cart-BzhmzE-J.js";import"./preload-helper-tKe0viCo.js";const B=12;let l=null,u=!1,y="",w="createdAt_desc",i="",p=null;const o=()=>document.getElementById("catalog-grid"),m=()=>document.getElementById("load-more-btn"),h=()=>document.getElementById("catalog-loader"),M=()=>document.getElementById("page-loader");function A(e=null){const t=L($,"products"),a=[];i?a.push(f("nameTokens","array-contains",i)):y&&a.push(f("category","==",y));const[r,s]=w.split("_");return a.push(E(r,s)),a.push(b(B)),e&&a.push(S(e)),v(t,...a)}function U(e=0){const t=Math.round(e);return"★".repeat(t)+"☆".repeat(5-t)}function P(e){return{electronics:"Электроника",clothing:"Одежда",home:"Дом и сад",sports:"Спорт",books:"Книги"}[e]||e}function D(e){return e.toLocaleString("ru-RU")+" ₽"}function x(e){var r;const t=e.data(),a=document.createElement("div");return a.className="product-card animate-fade-up",a.dataset.id=e.id,a.innerHTML=`
    <div class="product-card-img">
      <img src="${t.imageUrl||"https://placehold.co/400x300/1a1a1a/555?text=Нет+фото"}" alt="${t.name}" loading="lazy" />
      ${t.stock===0?'<span class="product-card-badge" style="background:var(--text-muted)">Нет в наличии</span>':""}
    </div>
    <div class="product-card-body">
      <span class="product-card-category">${P(t.category)}</span>
      <div class="product-card-name">${t.name}</div>
      <div class="product-card-stars">
        <span class="stars">${U(t.rating)}</span>
        <span class="stars-count">${t.reviewCount||0} отзывов</span>
      </div>
    </div>
    <div class="product-card-footer">
      <div>
        <span class="product-price">${D(t.price)}</span>
      </div>
      <button class="btn-add-cart" data-id="${e.id}" title="В корзину" ${t.stock===0?'disabled style="opacity:0.4;cursor:not-allowed"':""}>+</button>
    </div>`,a.addEventListener("click",s=>{s.target.closest(".btn-add-cart")||(window.location.href=`./product.html?id=${e.id}`)}),(r=a.querySelector(".btn-add-cart"))==null||r.addEventListener("click",async s=>{if(s.stopPropagation(),!g){d("Войдите, чтобы добавить в корзину","warning");return}const n=s.currentTarget;n.disabled=!0;try{await q(g.uid,{id:e.id,name:t.name,price:t.price,imageUrl:t.imageUrl}),d(`${t.name} добавлен в корзину`,"success"),n.textContent="✓",setTimeout(()=>{n.textContent="+",n.disabled=!1},1500)}catch{d("Ошибка при добавлении","error"),n.disabled=!1}}),a}async function c(e=!1){if(!u){u=!0,e&&(o().innerHTML="",l=null,m().style.display="none"),h().style.display="flex",m().style.display="none";try{const t=A(e?null:l),a=await k(t);a.empty&&e?o().innerHTML=`
        <div class="empty-state" style="grid-column:1/-1">
          <span class="empty-state-icon">🔍</span>
          <h3>Ничего не найдено</h3>
          <p>Попробуйте изменить фильтры или поисковый запрос.</p>
        </div>`:(a.forEach(r=>o().appendChild(x(r))),l=a.docs[a.docs.length-1],m().style.display=a.size===B?"inline-flex":"none")}catch(t){console.error(t),d("Ошибка загрузки товаров","error")}finally{u=!1,h().style.display="none"}}}function H(){p&&p();const e=v(L($,"products"),E("createdAt","desc"),b(1));p=C(e,t=>{if(!t.metadata.hasPendingWrites&&!t.empty){const a=t.docs[0];if(!document.querySelector(`[data-id="${a.id}"]`)){const s=x(a);s.style.border="1px solid var(--border-accent)",o().insertBefore(s,o().firstChild),setTimeout(()=>{s.parentNode&&(s.style.border="")},3e3)}}})}document.addEventListener("DOMContentLoaded",()=>{I(),T(e=>{i=e,c(!0)}),document.getElementById("filters-bar").addEventListener("click",e=>{const t=e.target.closest(".filter-chip");if(!t)return;document.querySelectorAll(".filter-chip").forEach(r=>r.classList.remove("active")),t.classList.add("active"),y=t.dataset.category,i="";const a=document.getElementById("nav-search-input");a&&(a.value=""),c(!0)}),document.getElementById("sort-select").addEventListener("change",e=>{w=e.target.value,c(!0)}),document.getElementById("load-more-btn").addEventListener("click",()=>c(!1)),c(!0),H(),setTimeout(()=>{const e=M();e&&e.classList.add("hidden")},400)});
