(function(){
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- dev gate (TEMPORÁRIO, remover antes de publicar) ---------- */
  var DEV_GATE_KEY = "pt-dev-unlocked";
  var DEV_GATE_PASSWORD = "cartucho";
  var devGate = document.getElementById("devGate");
  var devGateForm = document.getElementById("devGateForm");
  var devGateInput = document.getElementById("devGateInput");
  var devGateError = document.getElementById("devGateError");

  function unlockDevGate(){
    devGate.hidden = true;
    document.body.style.overflow = "";
  }

  try {
    if (localStorage.getItem(DEV_GATE_KEY) === "1") unlockDevGate();
    else document.body.style.overflow = "hidden";
  } catch(e){}

  devGateForm.addEventListener("submit", function(e){
    e.preventDefault();
    if (devGateInput.value.trim() === DEV_GATE_PASSWORD) {
      try { localStorage.setItem(DEV_GATE_KEY, "1"); } catch(e){}
      devGateError.hidden = true;
      unlockDevGate();
    } else {
      devGateError.hidden = false;
      devGateInput.value = "";
      devGateInput.focus();
    }
  });

  /* ---------- i18n ---------- */
  var LANG_KEY = "pt-lang-pref";
  var lang = "pt";
  try { lang = localStorage.getItem(LANG_KEY) || "pt"; } catch(e){}

  function applyLang(){
    document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
    document.querySelectorAll(".i18n").forEach(function(el){
      var val = el.dataset[lang];
      if (val !== undefined) el.textContent = val;
    });
    document.querySelectorAll(".i18n-html").forEach(function(el){
      var val = el.dataset[lang];
      if (val !== undefined) el.innerHTML = val;
    });
    document.querySelectorAll(".lang-toggle button").forEach(function(btn){
      btn.setAttribute("aria-pressed", btn.dataset.lang === lang ? "true" : "false");
    });
    if (currentGame) renderGame(currentGame);
    if (currentSeries) renderSeries(currentSeries);
  }

  document.querySelectorAll(".lang-toggle button").forEach(function(btn){
    btn.addEventListener("click", function(){
      lang = btn.dataset.lang;
      try { localStorage.setItem(LANG_KEY, lang); } catch(e){}
      applyLang();
    });
  });

  /* ---------- mobile nav ---------- */
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");
  navToggle.addEventListener("click", function(){
    var open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  navLinks.querySelectorAll("a").forEach(function(a){
    a.addEventListener("click", function(e){
      navLinks.classList.remove("open");
      var href = a.getAttribute("href");
      if ((currentGame || currentSeries) && href && href.charAt(0) === "#") {
        e.preventDefault();
        goHomeToAnchor(href);
      }
    });
  });

  /* ---------- liga/desliga o console (cor + animação do hero da Home) ---------- */
  var heroMedia = document.getElementById("heroMedia");
  var bootBtn = document.getElementById("bootBtn");
  var bootBtnLabel = bootBtn.querySelector(".i18n");
  var consolePowered = false;
  var bootClickCount = 0;
  var kaeporaRevealed = false;
  var BOOT_LABEL_OFF = { pt: "Ligar o console", en: "Power on" };
  var BOOT_LABEL_ON = { pt: "Desligar o console", en: "Power off" };

  function setBootLabel(){
    var pair = consolePowered ? BOOT_LABEL_ON : BOOT_LABEL_OFF;
    bootBtnLabel.dataset.pt = pair.pt;
    bootBtnLabel.dataset.en = pair.en;
    bootBtnLabel.textContent = pair[lang];
  }

  bootBtn.addEventListener("click", function(){
    consolePowered = !consolePowered;
    heroMedia.classList.toggle("is-powered", consolePowered);
    setBootLabel();
    if (consolePowered) startHeroCarousel(); else stopHeroCarousel();
    if (!reduceMotion) {
      var home = document.getElementById("view-home");
      home.classList.remove("booting");
      void home.offsetWidth;
      home.classList.add("booting");
    }
    bootClickCount++;
    if (bootClickCount === 6 && !kaeporaRevealed) {
      kaeporaRevealed = true;
      revealKaepora();
    }
  });

  /* ---------- easter egg: 6º clique no boot revela um 4º cartucho secreto ---------- */
  function revealKaepora(){
    var cartGrid = document.querySelector(".cart-grid");
    if (!cartGrid) return;
    cartGrid.insertAdjacentHTML("beforeend",
      '<button class="cart cart-pop-in" type="button" id="kaeporaCart">' +
        '<div class="cart-art cart-art--mystery">' +
          '<span class="cart-notch">2027</span>' +
          CONSOLE_GLYPH_SVG +
        '</div>' +
        '<div class="cart-body">' +
          '<h3>Projeto Kaepora</h3>' +
        '</div>' +
        '<div class="cart-connector" aria-hidden="true"></div>' +
      '</button>'
    );
    var kaeporaCart = document.getElementById("kaeporaCart");
    kaeporaCart.addEventListener("click", function(){
      showToast(lang === "pt" ? "Projeto Kaepora: em breve..." : "Project Kaepora: coming soon...");
    });
    kaeporaCart.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    showToast(lang === "pt" ? "Um jogo novo?!" : "A new game?!");
  }

  /* ---------- reveal on scroll ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: .15 });
    document.querySelectorAll(".reveal").forEach(function(el){ io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function(el){ el.classList.add("in"); });
  }

  /* ---------- cartridge tilt ---------- */
  if (!reduceMotion) {
    document.querySelectorAll(".cart").forEach(function(card){
      card.addEventListener("mousemove", function(e){
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5;
        var y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = "perspective(700px) rotateY(" + (x*9) + "deg) rotateX(" + (y*-9) + "deg) translateY(-3px)";
      });
      card.addEventListener("mouseleave", function(){ card.style.transform = ""; });
    });
  }

  /* ---------- game data ---------- */
  var GAMES = {
    ninjin: {
      color: "var(--ninjin)",
      year: "2018",
      tag: { pt: "AÇÃO · AVENTURA", en: "ACTION · ADVENTURE" },
      screenshot: null,
      trailer: "xY1WyZC89_c",
      logo: "assets/images/logo-ninjin.png",
      title: "Ninjin: Clash of Carrots",
      tagline: { pt: "Ação e humor numa fazenda de cenouras que virou campo de batalha.", en: "Action and humor in a carrot farm turned battlefield." },
      synopsis: [
        { pt: "Ninjin e Boo são dois coelhos que embarcam numa jornada pra recuperar as cenouras roubadas de sua fazenda, enfrentando bandidos, chefões esquisitos e puzzles pelo caminho.", en: "Ninjin and Boo are two rabbits on a journey to reclaim their farm's stolen carrots, battling bandits, oddball bosses, and puzzles along the way." },
        { pt: "O universo do jogo ganhou vida própria: virou uma série animada de 22 episódios, exibida no Cartoon Network e disponível na HBO Max, feita em parceria com Roger Keesse.", en: "The game's world grew beyond the screen into a 22-episode animated series that aired on Cartoon Network and streams on HBO Max, made in partnership with Roger Keesse." }
      ],
      features: [
        { pt: "Combate ágil com machadinhos, arco e magia de cenoura.", en: "Fast combat with hatchets, bow, and carrot magic." },
        { pt: "Dungeons cheias de puzzles e chefes ridiculamente carismáticos.", en: "Dungeons packed with puzzles and absurdly charismatic bosses." },
        { pt: "Mesmo universo da série animada, mesma piada em formatos diferentes.", en: "Same universe as the animated series, same jokes in different formats." }
      ],
      platforms: [
        { key: "steam", label: "Steam / PC", url: "https://store.steampowered.com/app/809870/Ninjin_Clash_of_Carrots/" },
        { key: "switch", label: "Nintendo Switch", url: "https://www.nintendo.com/us/store/products/ninjin-clash-of-carrots-switch/" },
        { key: "playstation", label: "PlayStation 4", url: "https://store.playstation.com/en-us/product/UP4735-CUSA12847_00-NINJINBASEGAME01" },
        { key: "xbox", label: "Xbox One", url: "https://www.xbox.com/en-US/games/store/ninjin-clash-of-carrots/bpn65mshs43g" }
      ],
      reviews: [
        { author: "Gamal Medhat", quote: "Ninjin: Clash of Carrots is definitely one of the best indie games ever made." },
        { author: "Allan Smith", quote: "I can't even remember the last game that gave me such... honest fun." },
        { author: "Specs The Wolf", quote: "I find this game to be very enjoyable. The gameplay is unique and intuitive." }
      ]
    },
    dodgeball: {
      color: "var(--dodge)",
      year: "2020",
      tag: { pt: "RPG DE AÇÃO", en: "ACTION RPG" },
      screenshot: null,
      trailer: "P9h1g-nvTnY",
      logo: "assets/images/dodgeball-logo.png",
      background: "assets/images/background_dodgeball-1-web.jpg",
      character: "assets/images/Otto_char.png",
      title: "Dodgeball Academia",
      tagline: { pt: "Num mundo onde dodgeball é vida, um garoto sonha em virar lenda.", en: "In a world where dodgeball is life, one kid dreams of becoming a legend." },
      synopsis: [
        { pt: "Otto só quer jogar dodgeball na academia mais concorrida do mundo. O que começa como um sonho de infância vira uma aventura cheia de combate frenético e reviravoltas.", en: "Otto just wants to play dodgeball at the most competitive academy around. What starts as a childhood dream turns into an adventure full of frantic combat and twists." },
        { pt: "Feito em parceria com o artista Ivan Freire e publicado pela Humble Games, com um elenco cartunesco liderado por Otto e o inseparável Bexigo.", en: "Made with artist Ivan Freire and published by Humble Games, with a cartoon cast led by Otto and his inseparable sidekick Bexigo." }
      ],
      features: [
        { pt: "Times, arenas e golpes especiais dignos de anime esportivo.", en: "Teams, arenas, and special moves worthy of a sports anime." },
        { pt: "Elenco cartunesco liderado por Otto e o inseparável Bexigo.", en: "A cartoon cast led by Otto and his inseparable sidekick Bexigo." },
        { pt: "Feito com Ivan Freire, publicado pela Humble Games.", en: "Made with Ivan Freire, published by Humble Games." }
      ],
      platforms: [
        { key: "steam", label: "Steam / PC", url: "https://store.steampowered.com/app/1422420/Dodgeball_Academia/" },
        { key: "switch", label: "Nintendo Switch", url: "https://www.nintendo.com/us/store/products/dodgeball-academia-switch/" },
        { key: "playstation", label: "PlayStation 4/5", url: "https://store.playstation.com/en-us/product/UP3864-CUSA27737_00-DODGEBALLACA000A/" },
        { key: "xbox", label: "Xbox One / Series", url: "https://www.xbox.com/en-US/games/store/dodgeball-academia/9nbhqsq3621m" }
      ],
      reviews: [
        { author: "Tiwill", quote: "A straight-up fun time. Pure joy." },
        { author: "Chriziel", quote: "Charming and beautiful game with an easy to follow humor filled story." },
        { author: "IcewaterCreek", quote: "Dodgeball Academia is a light game fun for the whole family." }
      ]
    },
    pipistrello: {
      color: "var(--pipi)",
      year: "2025",
      tag: { pt: "YOYOVANIA", en: "YOYOVANIA" },
      screenshot: null,
      trailer: "iBRiczTqy_8",
      logo: "assets/images/logo_pipistrello_white.png",
      background: "assets/images/background_pipis-1-web.jpg",
      character: "assets/images/Pippit_char-web.png",
      title: "Pipistrello and the Cursed Yoyo",
      tagline: { pt: "Um morcego, um ioiô amaldiçoado, e um console que nunca existiu.", en: "A bat, a cursed yoyo, and a console that never existed." },
      synopsis: [
        { pt: "Pippit é um morcego decidido a resgatar sua tia sequestrada e recuperar o prestígio da família, armado apenas com seu fiel ioiô.", en: "Pippit is a bat determined to rescue his kidnapped aunt and restore his family's name, armed with nothing but his trusty yoyo." },
        { pt: "Nesta aventura top-down inspirada nos clássicos de Game Boy Advance, cada truque de ioiô vira arma, ferramenta e chave de puzzle, tudo isso rodando, na ficção, no lendário Pocket Trap Game System. Chegou ao Nintendo Switch 2 em agosto de 2026.", en: "In this top-down adventure inspired by Game Boy Advance classics, every yoyo trick doubles as a weapon, a tool, and a puzzle key, all of it running, in-fiction, on the legendary Pocket Trap Game System. It landed on Nintendo Switch 2 in August 2026." }
      ],
      features: [
        { pt: "Um ioiô, mil truques: arma, gancho, chave de puzzle.", en: "One yoyo, a thousand tricks: weapon, grappling hook, puzzle key." },
        { pt: "Visual inspirado em Game Boy Advance, rodando (na lenda) no Pocket Trap Game System.", en: "GBA-inspired visuals, running (in legend) on the Pocket Trap Game System." },
        { pt: "Chegou ao Switch 2 em agosto de 2026, de graça pra quem já tem o jogo.", en: "Landed on Switch 2 in August 2026, free for existing owners." }
      ],
      platforms: [
        { key: "steam", label: "Steam / PC", url: "https://store.steampowered.com/app/2870350/Pipistrello_and_the_Cursed_Yoyo/" },
        { key: "switch", label: "Nintendo Switch / Switch 2", url: "https://www.nintendo.com/us/store/products/pipistrello-and-the-cursed-yoyo-switch/" },
        { key: "playstation", label: "PlayStation 4/5", url: "https://store.playstation.com/en-us/concept/10011382/" },
        { key: "xbox", label: "Xbox One / Series", url: "https://www.xbox.com/en-US/games/store/pipistrello-and-the-cursed-yoyo/9N9LK61WS2CH" }
      ],
      reviews: [
        { author: "umbrellaphant", quote: "The best Nintendo game Nintendo never made." },
        { author: "Tanwolly", quote: "This is without question the most underrated game I have ever played in my life." },
        { author: "Stere", quote: "This game is up there with the best Zelda-likes, no doubt about it." }
      ]
    }
  };

  /* ---------- home hero carousel ---------- */
  var HERO_SLIDES = Object.keys(GAMES).map(function(id){ return GAMES[id]; })
    .filter(function(g){ return g.background && g.character; });
  var heroMediaBg = document.getElementById("heroMediaBg");
  var heroMediaChar = document.getElementById("heroMediaChar");
  var heroSlideIndex = 0;

  function applyHeroSlide(i){
    var slide = HERO_SLIDES[i];
    if (!slide) return;
    heroMediaBg.style.backgroundImage = "url('" + slide.background + "')";
    heroMediaChar.src = slide.character;
  }

  var heroCarouselTimer = null;
  function startHeroCarousel(){
    if (heroCarouselTimer || HERO_SLIDES.length <= 1 || reduceMotion) return;
    heroCarouselTimer = window.setInterval(function(){
      heroMediaBg.style.opacity = 0;
      heroMediaChar.style.opacity = 0;
      window.setTimeout(function(){
        heroSlideIndex = (heroSlideIndex + 1) % HERO_SLIDES.length;
        applyHeroSlide(heroSlideIndex);
        heroMediaBg.style.opacity = 1;
        heroMediaChar.style.opacity = 1;
      }, 500);
    }, 7000);
  }
  function stopHeroCarousel(){
    if (heroCarouselTimer) { window.clearInterval(heroCarouselTimer); heroCarouselTimer = null; }
  }

  if (HERO_SLIDES.length) applyHeroSlide(0);

  /* Ícones reais do Font Awesome (CDN carregado no <head> do index.html). O
     Font Awesome Free não publica um ícone oficial de Nintendo/Switch, então
     usamos fa-gamepad como equivalente neutro só nesse caso. */
  var PLATFORM_ICONS = {
    steam: '<i class="fa-brands fa-steam" aria-hidden="true"></i>',
    switch: '<i class="fa-solid fa-gamepad" aria-hidden="true"></i>',
    playstation: '<i class="fa-brands fa-playstation" aria-hidden="true"></i>',
    xbox: '<i class="fa-brands fa-xbox" aria-hidden="true"></i>'
  };
  var EXT_ICON = '<i class="fa-solid fa-arrow-up-right-from-square pb-go" aria-hidden="true"></i>';

  /* Glifos de gênero: um ícone de linha por jogo (mesmo estilo dos SVGs
     autorais já usados no console-icon/banner-icon/cart-cta), pra reforçar
     visualmente o gênero de cada cartucho, não só em texto. */
  var GENRE_ICONS = {
    ninjin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 11c2-2 4-4 6-6 1.8 1.8 1.8 4.2 0 6l-4 4"/><path d="M13 11L4 20"/></svg>',
    dodgeball: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 4c-2.8 3-2.8 13 0 16M4 12c3-2.8 13-2.8 16 0"/></svg>',
    pipistrello: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="7" r="4"/><circle cx="12" cy="17" r="4"/><path d="M12 11v2"/></svg>'
  };

  /* Mesmo glifo do console usado no boot-glyph da Home (index.html), aqui
     reaproveitado dentro da moldura de tela de cada página de jogo. */
  var CONSOLE_GLYPH_SVG =
    '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="8" y="6" width="48" height="52" rx="10"/>' +
      '<rect x="17" y="15" width="30" height="18" rx="2"/>' +
      '<circle cx="22" cy="44" r="3"/>' +
      '<circle cx="42" cy="44" r="3"/>' +
      '<circle cx="32" cy="39" r="3"/>' +
      '<circle cx="32" cy="49" r="3"/>' +
    '</svg>';

  var currentGame = null;
  var currentSeries = null;
  var viewHome = document.getElementById("view-home");
  var viewGame = document.getElementById("view-game");
  var viewSeries = document.getElementById("view-series");
  var gameContent = document.getElementById("gameContent");
  var seriesContent = document.getElementById("seriesContent");
  var routeAnnouncer = document.getElementById("routeAnnouncer");

  function announceRoute(msg){
    routeAnnouncer.textContent = "";
    window.setTimeout(function(){ routeAnnouncer.textContent = msg; }, 50);
  }

  function focusHeading(view){
    var h = view.querySelector("h1");
    if (h) h.focus({ preventScroll: true });
  }

  function showView(view){
    [viewHome, viewGame, viewSeries].forEach(function(v){ v.classList.toggle("active", v === view); });
  }

  function renderGame(id){
    var g = GAMES[id];
    if (!g) return;
    var storeUrl = g.platforms[0].url;
    var hasScene = !!(g.background && g.character);
    var screenInner = g.screenshot
      ? '<img src="' + g.screenshot + '" alt="' + g.title + '">'
      : '<div class="game-console-placeholder">' +
          CONSOLE_GLYPH_SVG +
          '<span>' + (lang === "pt" ? "Aguardando cartucho" : "Awaiting cartridge") + '</span>' +
        '</div>';
    var gameHeroCopy =
      '<div class="game-hero-copy">' +
        '<div class="game-hero-meta">' +
          '<span class="game-badge">CART. ' + g.year + '</span>' +
          '<span class="game-genre">' + (GENRE_ICONS[id] || '') + '<span>' + g.tag[lang] + '</span></span>' +
        '</div>' +
        '<h1 tabindex="-1"><img class="game-logo" src="' + g.logo + '" alt="' + g.title + '"></h1>' +
        '<p class="game-tagline">' + g.tagline[lang] + '</p>' +
        '<a class="btn btn-primary game-hero-cta" href="#plataformas">' +
          '<span>' + (lang === "pt" ? "Ver onde comprar" : "See where to buy") + '</span>' +
        '</a>' +
      '</div>';
    var gameHeroMarkup = hasScene ?
      '<div class="game-hero game-hero--scene" style="--gc1:' + g.color + '">' +
        '<div class="scene-media" aria-hidden="true">' +
          '<div class="scene-media-bg" style="background-image:url(\'' + g.background + '\')"></div>' +
          '<img class="scene-media-char" src="' + g.character + '" alt="">' +
        '</div>' +
        '<div class="wrap game-hero-inner">' + gameHeroCopy + '</div>' +
      '</div>'
    :
      '<div class="game-hero" style="--gc1:' + g.color + '">' +
        '<div class="game-hero-inner">' +
          gameHeroCopy +
          '<div class="game-console">' +
            '<div class="game-console-screen">' + screenInner + '</div>' +
            '<div class="game-console-dots"><span></span><span></span><span></span><span></span></div>' +
          '</div>' +
        '</div>' +
      '</div>';
    gameContent.innerHTML =
      gameHeroMarkup +
      (g.trailer ?
        '<div class="game-trailer" style="--gc1:' + g.color + '">' +
          '<span class="eyebrow">TRAILER</span>' +
          '<div class="game-trailer-frame">' +
            '<iframe src="https://www.youtube-nocookie.com/embed/' + g.trailer + '" title="' + g.title + (lang === "pt" ? ", trailer" : ", trailer") + '" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>' +
          '</div>' +
        '</div>'
      : '') +
      '<div class="game-body">' +
        '<div class="game-synopsis">' +
          g.synopsis.map(function(p){ return '<p>' + p[lang] + '</p>'; }).join('') +
          '<ul class="feature-list">' +
            g.features.map(function(f){ return '<li>' + f[lang] + '</li>'; }).join('') +
          '</ul>' +
          '<div class="reviews-block">' +
            '<div class="reviews-head">' +
              '<h2>' + (lang === "pt" ? "O QUE JOGADORES DIZEM NA STEAM" : "WHAT PLAYERS SAY ON STEAM") + '</h2>' +
              '<a href="' + storeUrl + '#app_reviews_hash" target="_blank" rel="noopener noreferrer">' + (lang === "pt" ? "ver mais" : "see more") + '</a>' +
            '</div>' +
            '<div class="review-grid">' +
              g.reviews.map(function(rv){
                return '<blockquote class="review-card">' +
                  '<p>' + rv.quote + '</p>' +
                  '<footer class="review-author"><i class="fa-brands fa-steam" aria-hidden="true"></i><span>' + rv.author + '</span><span class="review-via">' + (lang === "pt" ? "via Steam (EN)" : "via Steam") + '</span></footer>' +
                '</blockquote>';
              }).join('') +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="game-side">' +
          '<div class="info-card info-card--primary" id="plataformas">' +
            '<h2>' + (lang === "pt" ? "PLATAFORMAS" : "PLATFORMS") + '</h2>' +
            '<div class="platform-badges">' + g.platforms.map(function(p){
              return '<a class="platform-badge" href="' + p.url + '" target="_blank" rel="noopener noreferrer">' +
                (PLATFORM_ICONS[p.key] || '') +
                '<span class="pb-name">' + p.label + '</span>' +
                EXT_ICON +
              '</a>';
            }).join('') + '</div>' +
          '</div>' +
          '<div class="info-card store-note">' +
            '<h2>' + (lang === "pt" ? "CAPTURAS DE TELA" : "SCREENSHOTS") + '</h2>' +
            '<p>' + (lang === "pt" ? "Quer ver o jogo rodando antes? As capturas de tela oficiais estão na loja." : "Want to see it running first? Official screenshots are on the store page.") + '</p>' +
            '<a class="btn btn-ghost btn-sm" href="' + storeUrl + '" target="_blank" rel="noopener noreferrer">' +
              '<span>' + (lang === "pt" ? "Ver capturas na loja" : "See screenshots on the store") + '</span>' +
              EXT_ICON +
            '</a>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  /* ---------- transmedia (série animada) ---------- */
  var SERIES = {
    ninjin: {
      color: "var(--ninjin)",
      background: "assets/images/ninjin_cartoon.jpg",
      logo: "assets/images/logo-ninjin-cartoon.png",
      title: "Ninjin Animated Series",
      meta: [
        { pt: "Criada por Pocket Trap e Roger Keesse", en: "Created by Pocket Trap and Roger Keesse" },
        { pt: "10×1', 7×3', 12×7' (série em andamento)", en: "10×1', 7×3', 12×7' (ongoing series)" },
        { pt: "Co-produção Birdo, Cartoon Network e Pocket Trap", en: "Co-production Birdo, Cartoon Network and Pocket Trap" }
      ],
      synopsis: [
        { pt: "NINJIN é uma série de ação e comédia com jeitão de anime, co-produzida pelo estúdio de jogos Pocket Trap, a Birdo Studio e a Cartoon Network Brasil, se passando no mesmo universo do jogo Ninjin: Clash of Carrots. A série tem 22 episódios divididos em 3 formatos: dez episódios de 1 minuto, sete de 3 minutos e uma série contínua de episódios de 7 minutos.", en: "NINJIN is a character-driven, anime inspired, action comedy animated series co-produced by the game studio Pocket Trap, Birdo Studio and Cartoon Network Brasil, taking place in the same universe as the video game Ninjin: Clash of Carrots. The series features 22 episodes, divided in 3 different formats: ten 1-minute-long episodes, seven 3-minute-long episodes and an ongoing series of 7-minute-long episodes." },
        { pt: "A história acompanha NINJIN, um coelhinho que só pensa numa coisa: virar um ninja mestre digno de dar pancada, como seus ancestrais foram antigamente. Ao lado dos amigos AKAI, a raposa afobada, e FLINK, o sapo preguiçoso, eles treinam com um COELHO ANCIÃO SENSEI (o maior doido da região) e enfrentam as situações mais absurdas e fora de controle.", en: "The story is focused on NINJIN, a rabbit cub who only cares about one thing: becoming an ass-kicking ninja master, just like his ancestors used to be in the days of yore. Alongside his pals, the frantic fox AKAI and the lazy frog FLINK, they will not only train under an ELDER RABBIT SENSEI, the real screwball around those parts, but will also face the most absurd, insane and out of control situations." }
      ],
      availability: { pt: "Assista à série do Ninjin no Cartoon Network e na HBO Max!", en: "You can watch the Ninjin series on Cartoon Network and HBO Max!" },
      availabilityNote: { pt: "Disponível só na América Latina, por enquanto.", en: "Available only in Latin America at the moment." },
      trailer: "0eqU8MaedXE",
      closing: {
        background: "assets/images/Ninjin_HQ-1.jpg",
        text: { pt: "Quer conhecer o jogo que deu origem a essa bagunça toda?", en: "Want to check out the game that started all this mess?" },
        ctaHref: "#jogo/ninjin",
        cta: { pt: "Ver o jogo", en: "See the game" }
      }
    }
  };

  function renderSeries(id){
    var s = SERIES[id];
    if (!s) return;
    seriesContent.innerHTML =
      '<div class="game-hero game-hero--scene transmedia-hero" style="--gc1:' + s.color + '">' +
        '<div class="scene-media" aria-hidden="true">' +
          '<div class="scene-media-bg" style="background-image:url(\'' + s.background + '\')"></div>' +
        '</div>' +
        '<div class="wrap game-hero-inner">' +
          '<div class="game-hero-copy">' +
            '<h1 tabindex="-1"><img class="game-logo" src="' + s.logo + '" alt="' + s.title + '"></h1>' +
            '<ul class="series-meta">' +
              s.meta.map(function(m){ return '<li>' + m[lang] + '</li>'; }).join('') +
            '</ul>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="wrap series-synopsis">' +
        s.synopsis.map(function(p){ return '<p>' + p[lang] + '</p>'; }).join('') +
        '<p class="series-availability">' + s.availability[lang] + '</p>' +
        '<p class="series-availability-note">' + s.availabilityNote[lang] + '</p>' +
      '</div>' +
      (s.trailer ?
        '<div class="game-trailer" style="--gc1:' + s.color + '">' +
          '<span class="eyebrow">TRAILER</span>' +
          '<div class="game-trailer-frame">' +
            '<iframe src="https://www.youtube-nocookie.com/embed/' + s.trailer + '" title="' + s.title + '" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>' +
          '</div>' +
        '</div>'
      : '') +
      (s.closing ?
        '<div class="transmedia-closing">' +
          '<div class="scene-media" aria-hidden="true"><div class="scene-media-bg" style="background-image:url(\'' + s.closing.background + '\')"></div></div>' +
          '<div class="wrap transmedia-closing-inner">' +
            '<p>' + s.closing.text[lang] + '</p>' +
            '<a class="btn btn-primary btn-sm" href="' + s.closing.ctaHref + '"><span>' + s.closing.cta[lang] + '</span></a>' +
          '</div>' +
        '</div>'
      : '');
  }

  function openGame(id, opts){
    opts = opts || {};
    currentSeries = null;
    currentGame = id;
    renderGame(id);
    showView(viewGame);
    if (!reduceMotion) {
      viewGame.classList.remove("booting");
      void viewGame.offsetWidth;
      viewGame.classList.add("booting");
    }
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    focusHeading(viewGame);
    announceRoute((lang === "pt" ? "Agora vendo: " : "Now viewing: ") + GAMES[id].title);
    if (!opts.fromHash && location.hash !== "#jogo/" + id) {
      location.hash = "jogo/" + id;
    }
  }

  function closeGame(opts){
    opts = opts || {};
    currentGame = null;
    showView(viewHome);
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    focusHeading(viewHome);
    announceRoute(lang === "pt" ? "Voltou para a página inicial" : "Back to the home page");
    if (!opts.fromHash && location.hash) {
      history.pushState("", document.title, location.pathname + location.search);
    }
  }

  function openSeries(id, opts){
    opts = opts || {};
    currentGame = null;
    currentSeries = id;
    renderSeries(id);
    showView(viewSeries);
    if (!reduceMotion) {
      viewSeries.classList.remove("booting");
      void viewSeries.offsetWidth;
      viewSeries.classList.add("booting");
    }
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    focusHeading(viewSeries);
    announceRoute((lang === "pt" ? "Agora vendo: " : "Now viewing: ") + SERIES[id].title);
    if (!opts.fromHash && location.hash !== "#serie/" + id) {
      location.hash = "serie/" + id;
    }
  }

  function closeSeries(opts){
    opts = opts || {};
    currentSeries = null;
    showView(viewHome);
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    focusHeading(viewHome);
    announceRoute(lang === "pt" ? "Voltou para a página inicial" : "Back to the home page");
    if (!opts.fromHash && location.hash) {
      history.pushState("", document.title, location.pathname + location.search);
    }
  }

  function goHome(){
    if (currentGame) closeGame();
    if (currentSeries) closeSeries();
  }

  /* volta pra Home e rola até uma âncora de seção (ex.: clicar em "Sobre" no
     menu enquanto está numa página de jogo/série, onde a âncora não existe
     visível no DOM da view atual) */
  function goHomeToAnchor(hash){
    currentGame = null;
    currentSeries = null;
    showView(viewHome);
    void viewHome.offsetHeight; /* força o layout a recalcular antes de rolar */
    focusHeading(viewHome);
    announceRoute(lang === "pt" ? "Voltou para a página inicial" : "Back to the home page");
    history.pushState("", document.title, location.pathname + location.search + hash);
    var target = document.querySelector(hash);
    if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  /* ---------- hash routing: back/refresh/deep-link to a game or series page ---------- */
  function syncFromHash(){
    var gm = /^#jogo\/([a-z]+)/.exec(location.hash);
    var sm = /^#serie\/([a-z]+)/.exec(location.hash);
    if (gm && GAMES[gm[1]]) {
      if (currentGame !== gm[1]) openGame(gm[1], { fromHash: true });
    } else if (sm && SERIES[sm[1]]) {
      if (currentSeries !== sm[1]) openSeries(sm[1], { fromHash: true });
    } else if (!location.hash && (currentGame || currentSeries)) {
      /* only close on an EMPTY hash: a same-page anchor like #plataformas
         (e.g. the "Ver onde comprar" button) must not be treated as "leave the game page" */
      if (currentGame) closeGame({ fromHash: true });
      if (currentSeries) closeSeries({ fromHash: true });
    } else if ((gm && !GAMES[gm[1]]) || (sm && !SERIES[sm[1]])) {
      /* well-formed #jogo/ or #serie/ hash but unknown id: drop the dead hash and
         land on Home instead of leaving a frozen page with no feedback */
      history.replaceState("", document.title, location.pathname + location.search);
      if (currentGame) closeGame({ fromHash: true });
      if (currentSeries) closeSeries({ fromHash: true });
    }
  }
  window.addEventListener("hashchange", syncFromHash);

  document.querySelectorAll(".cart").forEach(function(card){
    card.addEventListener("click", function(){ openGame(card.dataset.game); });
  });
  document.getElementById("backBtn").addEventListener("click", function(){ closeGame(); });
  document.getElementById("backBtnSeries").addEventListener("click", function(){ closeSeries(); });
  document.getElementById("logoHome").addEventListener("click", goHome);

  /* ---------- easter egg: konami code ---------- */
  var seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  var pos = 0;
  var toast = document.getElementById("toast");
  var toastTimer = null;

  function showToast(msg){
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toast.classList.remove("show"); }, 3200);
  }

  window.addEventListener("keydown", function(e){
    var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === seq[pos]) {
      pos++;
      if (pos === seq.length) {
        pos = 0;
        showToast(lang === "pt" ? "★ VIDAS EXTRAS DESBLOQUEADAS (0)" : "★ EXTRA LIVES UNLOCKED (0)");
      }
    } else {
      pos = (key === seq[0]) ? 1 : 0;
    }
  });

  applyLang();
  syncFromHash();
})();
