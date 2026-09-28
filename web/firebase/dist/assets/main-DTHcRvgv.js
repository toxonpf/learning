import{g as T,q as v,l as b,f as E,c as L,d as x,o as k,h as y,i as I}from"./firebase-D4IcALkh.js";import{i as C,a as M,s as i,c as f}from"./navbar-6rDgd_GQ.js";import{a as S}from"./cart-w4DGmxVJ.js";import"./preload-helper-DNg48SyG.js";const $=12;let l=null,u=!1,g="",w="createdAt_desc",d="",p=null;const r=()=>document.getElementById("catalog-grid"),m=()=>document.getElementById("load-more-btn"),h=()=>document.getElementById("catalog-loader"),q=()=>document.getElementById("page-loader");function U(e=null){const t=L(x,"products"),a=[];d?a.push(y("nameTokens","array-contains",d)):g&&a.push(y("category","==",g));const[s,n]=w.split("_");return a.push(E(s,n)),a.push(b($)),e&&a.push(I(e)),v(t,...a)}function A(e=0){const t=Math.round(e);return"★".repeat(t)+"☆".repeat(5-t)}function P(e){return{electronics:"Электроника",clothing:"Одежда",home:"Дом и сад",sports:"Спорт",books:"Книги"}[e]||e}function H(e){return e.toLocaleString("ru-RU")+" ₸"}function B(e){var s;const t=e.data(),a=document.createElement("div");return a.className="product-card animate-fade-up",a.dataset.id=e.id,a.innerHTML=`
    <div class="product-card-img">
      <img src="${t.imageUrl||"https://placehold.co/400x300/1a1a1a/555?text=Нет+фото"}" alt="${t.name}" loading="lazy" />
      ${t.stock===0?'<span class="product-card-badge" style="background:var(--text-muted)">Нет в наличии</span>':""}
    </div>
    <div class="product-card-body">
      <span class="product-card-category">${P(t.category)}</span>
      <div class="product-card-name">${t.name}</div>
      <div class="product-card-stars">
        <span class="stars">${A(t.rating)}</span>
        <span class="stars-count">${t.reviewCount||0} отзывов</span>
      </div>
    </div>
    <div class="product-card-footer">
      <div>
        <span class="product-price">${H(t.price)}</span>
      </div>
      <button class="btn-add-cart" data-id="${e.id}" title="В корзину" ${t.stock===0?'disabled style="opacity:0.4;cursor:not-allowed"':""}>+</button>
    </div>`,a.addEventListener("click",n=>{n.target.closest(".btn-add-cart")||(window.location.href=`./product.html?id=${e.id}`)}),(s=a.querySelector(".btn-add-cart"))==null||s.addEventListener("click",async n=>{if(n.stopPropagation(),!f){i("Войдите, чтобы добавить в корзину","warning");return}const o=n.currentTarget;o.disabled=!0;try{await S(f.uid,{id:e.id,name:t.name,price:t.price,imageUrl:t.imageUrl}),i(`${t.name} добавлен в корзину`,"success"),o.textContent="✓",setTimeout(()=>{o.textContent="+",o.disabled=!1},1500)}catch{i("Ошибка при добавлении","error"),o.disabled=!1}}),a}async function c(e=!1){if(!u){u=!0,e&&(r().innerHTML="",l=null,m().style.display="none"),h().style.display="flex",m().style.display="none";try{const t=U(e?null:l),a=await T(t);a.empty&&e?r().innerHTML=`
        <div class="empty-state" style="grid-column:1/-1">
          <span class="empty-state-icon">🔍</span>
          <h3>Ничего не найдено</h3>
          <p>Попробуйте изменить фильтры или поисковый запрос.</p>
        </div>`:(a.forEach(s=>r().appendChild(B(s))),l=a.docs[a.docs.length-1],m().style.display=a.size===$?"inline-flex":"none")}catch(t){if(console.error(t),i("Ошибка загрузки товаров","error"),e){const a=t.message&&t.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/),s=a?a[0]:null;r().innerHTML=`
        <div class="empty-state" style="grid-column:1/-1">
          <span class="empty-state-icon">⚠️</span>
          <h3>Требуется индекс Firestore</h3>
          <p style="font-size:0.875rem;color:var(--text-secondary);max-width:480px;margin:10px auto;line-height:1.5;">
            Для фильтрации по этой категории требуется составной индекс. Нажмите кнопку ниже, чтобы создать его в консоли Firebase:
          </p>
          ${s?`<a href="${s}" target="_blank" class="btn btn-primary mt-12" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;">🔗 Создать индекс в 1 клик</a>`:""}
        </div>`}}finally{u=!1,h().style.display="none"}}}function _(){p&&p();const e=v(L(x,"products"),E("createdAt","desc"),b(1));p=k(e,t=>{if(!t.metadata.hasPendingWrites&&!t.empty){const a=t.docs[0];if(!document.querySelector(`[data-id="${a.id}"]`)){const n=B(a);n.style.border="1px solid var(--border-accent)",r().insertBefore(n,r().firstChild),setTimeout(()=>{n.parentNode&&(n.style.border="")},3e3)}}})}document.addEventListener("DOMContentLoaded",()=>{C(),M(e=>{d=e,c(!0)}),document.getElementById("filters-bar").addEventListener("click",e=>{const t=e.target.closest(".filter-chip");if(!t)return;document.querySelectorAll(".filter-chip").forEach(s=>s.classList.remove("active")),t.classList.add("active"),g=t.dataset.category,d="";const a=document.getElementById("nav-search-input");a&&(a.value=""),c(!0)}),document.getElementById("sort-select").addEventListener("change",e=>{w=e.target.value,c(!0)}),document.getElementById("load-more-btn").addEventListener("click",()=>c(!1)),c(!0),_(),setTimeout(()=>{const e=q();e&&e.classList.add("hidden")},400)});
