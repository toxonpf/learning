import{t as M,v as H,x as P,y as U,e as $,a as h,d as y,z,A as c,n as S,s as j,B as O,c as R,o as _}from"./firebase-D4IcALkh.js";let i=null;function D(){return i||(i=document.getElementById("toast-container"),i||(i=document.createElement("div"),i.id="toast-container",document.body.appendChild(i))),i}const g={success:"✓",error:"✕",info:"ℹ",warning:"⚠"};function b(t,e="info",n=3500){const a=D(),s=document.createElement("div");s.className=`toast toast-${e}`,s.innerHTML=`
    <span class="toast-icon">${g[e]||g.info}</span>
    <span class="toast-msg">${t}</span>
  `,a.appendChild(s),requestAnimationFrame(()=>{requestAnimationFrame(()=>s.classList.add("show"))});const l=()=>{s.classList.remove("show"),s.classList.add("hide"),s.addEventListener("transitionend",()=>s.remove(),{once:!0})};s.addEventListener("click",l),setTimeout(l,n)}let E=null,p=null;const w=[];function I(t){w.push(t)}M(c,async t=>{if(E=t,t){const e=await S(h(y,"users",t.uid));p=e.exists()?e.data():null}else p=null;w.forEach(e=>e(t,p))});async function B(t,e,n){const a=await P(c,t,e);return await U(a.user,{displayName:n}),await $(h(y,"users",a.user.uid),{uid:a.user.uid,displayName:n,email:t,phone:"",role:"user",createdAt:j()}),a.user}async function L(t,e){return(await H(c,t,e)).user}async function x(){await O(c)}async function k(t){await z(c,t)}let r=null;function A(){if(document.getElementById("auth-modal-overlay"))return;document.body.insertAdjacentHTML("beforeend",`
  <div id="auth-modal-overlay" class="modal-overlay">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <button class="modal-close" id="auth-modal-close" aria-label="Close">✕</button>

      <!-- Login tab -->
      <div id="auth-view-login">
        <h2 class="modal-title" id="auth-modal-title">Войти</h2>
        <p class="modal-subtitle">Введите данные для входа в аккаунт</p>
        <form id="login-form" novalidate>
          <div class="form-group mb-16">
            <label class="form-label" for="login-email">Email</label>
            <input class="form-input" type="email" id="login-email" placeholder="you@example.com" autocomplete="email" required />
          </div>
          <div class="form-group mb-24">
            <label class="form-label" for="login-password">Пароль</label>
            <input class="form-input" type="password" id="login-password" placeholder="••••••••" autocomplete="current-password" required />
          </div>
          <p id="login-error" class="form-error mb-16" style="display:none"></p>
          <button type="submit" class="btn btn-primary btn-full btn-lg">Войти</button>
        </form>
        <div class="divider"></div>
        <div style="display:flex;justify-content:space-between;font-size:0.85rem;">
          <button class="btn-ghost" id="show-register">Регистрация</button>
          <button class="btn-ghost" id="show-reset">Забыли пароль?</button>
        </div>
      </div>

      <!-- Register tab -->
      <div id="auth-view-register" style="display:none">
        <h2 class="modal-title">Регистрация</h2>
        <p class="modal-subtitle">Создайте новый аккаунт</p>
        <form id="register-form" novalidate>
          <div class="form-group mb-16">
            <label class="form-label" for="reg-name">Имя</label>
            <input class="form-input" type="text" id="reg-name" placeholder="Иван Иванов" required />
          </div>
          <div class="form-group mb-16">
            <label class="form-label" for="reg-email">Email</label>
            <input class="form-input" type="email" id="reg-email" placeholder="you@example.com" autocomplete="email" required />
          </div>
          <div class="form-group mb-24">
            <label class="form-label" for="reg-password">Пароль</label>
            <input class="form-input" type="password" id="reg-password" placeholder="Минимум 6 символов" autocomplete="new-password" required />
          </div>
          <p id="reg-error" class="form-error mb-16" style="display:none"></p>
          <button type="submit" class="btn btn-primary btn-full btn-lg">Создать аккаунт</button>
        </form>
        <div class="divider"></div>
        <div style="text-align:center;font-size:0.85rem;">
          Уже есть аккаунт? <button class="btn-ghost" id="show-login">Войти</button>
        </div>
      </div>

      <!-- Reset tab -->
      <div id="auth-view-reset" style="display:none">
        <h2 class="modal-title">Сброс пароля</h2>
        <p class="modal-subtitle">Отправим ссылку на ваш email</p>
        <form id="reset-form" novalidate>
          <div class="form-group mb-24">
            <label class="form-label" for="reset-email">Email</label>
            <input class="form-input" type="email" id="reset-email" placeholder="you@example.com" required />
          </div>
          <p id="reset-error" class="form-error mb-16" style="display:none"></p>
          <button type="submit" class="btn btn-primary btn-full btn-lg">Отправить письмо</button>
        </form>
        <div class="divider"></div>
        <div style="text-align:center;font-size:0.85rem;">
          <button class="btn-ghost" id="show-login-from-reset">← Вернуться к входу</button>
        </div>
      </div>
    </div>
  </div>`),r=document.getElementById("auth-modal-overlay"),document.getElementById("auth-modal-close").addEventListener("click",o),r.addEventListener("click",e=>{e.target===r&&o()}),document.addEventListener("keydown",e=>{e.key==="Escape"&&o()}),document.getElementById("show-register").addEventListener("click",()=>d("register")),document.getElementById("show-login").addEventListener("click",()=>d("login")),document.getElementById("show-reset").addEventListener("click",()=>d("reset")),document.getElementById("show-login-from-reset").addEventListener("click",()=>d("login")),document.getElementById("login-form").addEventListener("submit",async e=>{e.preventDefault();const n=e.submitter,a=document.getElementById("login-error");a.style.display="none",n.disabled=!0,n.textContent="Входим...";try{await L(document.getElementById("login-email").value.trim(),document.getElementById("login-password").value),b("Добро пожаловать!","success"),o()}catch(s){a.textContent=f(s.code),a.style.display="block"}finally{n.disabled=!1,n.textContent="Войти"}}),document.getElementById("register-form").addEventListener("submit",async e=>{e.preventDefault();const n=e.submitter,a=document.getElementById("reg-error");a.style.display="none",n.disabled=!0,n.textContent="Создаём...";try{await B(document.getElementById("reg-email").value.trim(),document.getElementById("reg-password").value,document.getElementById("reg-name").value.trim()),b("Аккаунт создан!","success"),o()}catch(s){a.textContent=f(s.code),a.style.display="block"}finally{n.disabled=!1,n.textContent="Создать аккаунт"}}),document.getElementById("reset-form").addEventListener("submit",async e=>{e.preventDefault();const n=e.submitter,a=document.getElementById("reset-error");a.style.display="none",n.disabled=!0;try{await k(document.getElementById("reset-email").value.trim()),b("Письмо отправлено! Проверьте email.","success"),o()}catch(s){a.textContent=f(s.code),a.style.display="block"}finally{n.disabled=!1}})}function d(t){["login","register","reset"].forEach(e=>{document.getElementById(`auth-view-${e}`).style.display=e===t?"block":"none"})}function C(t="login"){r||A(),d(t),r.classList.add("active")}function o(){r&&r.classList.remove("active")}function f(t){return{"auth/invalid-email":"Некорректный email.","auth/user-not-found":"Пользователь не найден.","auth/wrong-password":"Неверный пароль.","auth/email-already-in-use":"Email уже занят.","auth/weak-password":"Пароль слишком простой (минимум 6 символов).","auth/invalid-credential":"Неверный email или пароль.","auth/too-many-requests":"Слишком много попыток. Попробуйте позже.","auth/network-request-failed":"Нет подключения к сети."}[t]||"Произошла ошибка. Попробуйте снова."}const W=Object.freeze(Object.defineProperty({__proto__:null,closeAuthModal:o,get currentUser(){return E},get currentUserData(){return p},initAuthModal:A,login:L,logout:x,onAuthChange:I,openAuthModal:C,register:B,resetPassword:k},Symbol.toStringTag,{value:"Module"}));let u=null;function V(t=null){const e=`
  <nav class="navbar" id="main-navbar">
    <div class="container navbar-inner">
      <a href="./index.html" class="navbar-logo">
        SHOP<span>.</span>
      </a>
      <div class="navbar-nav">
        <a href="./index.html" class="navbar-nav-link">Каталог</a>
        <a href="./profile.html" class="navbar-nav-link">Профиль</a>
      </div>
      ${t!==null?`
      <div class="navbar-search">
        <input type="text" id="nav-search-input" placeholder="Поиск товаров..." autocomplete="off" />
        <span class="navbar-search-icon">🔍</span>
      </div>`:""}
      <div class="navbar-actions" id="navbar-actions">
        <a href="./cart.html" class="btn-icon" id="navbar-cart-btn" title="Корзина">
          🛒
          <span class="cart-badge" id="cart-count" style="display:none">0</span>
        </a>
        <div id="navbar-user-area"></div>
      </div>
    </div>
  </nav>`;if(document.body.insertAdjacentHTML("afterbegin",e),t){const n=document.getElementById("nav-search-input");let a;n.addEventListener("input",()=>{clearTimeout(a),a=setTimeout(()=>t(n.value.trim().toLowerCase()),350)})}I(F)}function F(t,e){var a,s;const n=document.getElementById("navbar-user-area");if(n)if(u&&(u(),u=null),t){const l=(e==null?void 0:e.role)==="admin";n.innerHTML=`
      <div style="display:flex;align-items:center;gap:8px;">
        ${l?'<a href="./admin.html" class="btn btn-secondary btn-sm">Админ</a>':""}
        <a href="./profile.html" class="btn-icon" title="Профиль">👤</a>
        <button class="btn-icon" id="logout-btn" title="Выйти">🚪</button>
      </div>`,(a=document.getElementById("logout-btn"))==null||a.addEventListener("click",async()=>{await x(),b("Вы вышли из аккаунта","info"),window.location.href="./index.html"});const T=R(y,"cartItems",t.uid,"items");u=_(T,q=>{const v=q.size,m=document.getElementById("cart-count");m&&(v>0?(m.textContent=v>99?"99+":v,m.style.display="flex"):m.style.display="none")})}else{n.innerHTML=`
      <button class="btn btn-primary btn-sm" id="navbar-login-btn">Войти</button>`,(s=document.getElementById("navbar-login-btn"))==null||s.addEventListener("click",()=>C("login"));const l=document.getElementById("cart-count");l&&(l.style.display="none")}}export{V as a,C as b,E as c,W as d,A as i,I as o,b as s};
