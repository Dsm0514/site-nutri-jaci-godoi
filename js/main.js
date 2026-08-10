(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
   * Voltar ao topo (logo e botão flutuante)
   *
   * Não usamos apenas <a href="#topo">: o alvo (#topo) é o próprio
   * header, que é position:sticky. Navegadores calculam o destino
   * de âncoras pela posição VISUAL (getBoundingClientRect) do alvo —
   * e um header sticky já aparece "grudado" no topo mesmo quando a
   * página está rolada bem para baixo, então o navegador entende que
   * "já chegou" e rola só uma fração. Rolar via JS até scrollY 0
   * evita essa armadilha.
   * --------------------------------------------------------- */
  const scrollToTop = (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  document.querySelectorAll('a[href="#topo"]').forEach((link) => {
    link.addEventListener("click", scrollToTop);
  });

  /* ---------------------------------------------------------
   * Menu mobile (hambúrguer)
   * --------------------------------------------------------- */
  const navToggle = document.getElementById("navToggle");
  const primaryNav = document.getElementById("primaryNav");

  const closeNav = () => {
    navToggle.setAttribute("aria-expanded", "false");
    primaryNav.classList.remove("is-open");
  };

  if (navToggle && primaryNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!isOpen));
      primaryNav.classList.toggle("is-open", !isOpen);
    });

    primaryNav.addEventListener("click", (event) => {
      if (event.target.tagName === "A") closeNav();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNav();
    });

    document.addEventListener("click", (event) => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      if (isOpen && !primaryNav.contains(event.target) && !navToggle.contains(event.target)) {
        closeNav();
      }
    });
  }

  /* ---------------------------------------------------------
   * Cabeçalho com sombra ao rolar a página
   * --------------------------------------------------------- */
  const header = document.querySelector(".site-header");
  if (header) {
    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------------------------------------------------------
   * Botão "voltar ao topo": só aparece depois que a pessoa
   * já rolou para além do hero (evita poluir a primeira tela)
   * --------------------------------------------------------- */
  const scrollTopFab = document.getElementById("scrollTopFab");
  if (scrollTopFab) {
    const toggleScrollTopFab = () => {
      scrollTopFab.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.6);
    };
    toggleScrollTopFab();
    window.addEventListener("scroll", toggleScrollTopFab, { passive: true });
  }

  /* ---------------------------------------------------------
   * Abas acessíveis (Como funciona / Serviços e planos)
   * --------------------------------------------------------- */
  const tabGroups = document.querySelectorAll("[data-tabs]");

  tabGroups.forEach((group) => {
    const tabs = Array.from(group.querySelectorAll('[role="tab"]'));

    const activate = (tab, focus) => {
      tabs.forEach((t) => {
        const panel = document.getElementById(t.getAttribute("aria-controls"));
        const isActive = t === tab;
        t.classList.toggle("is-active", isActive);
        t.setAttribute("aria-selected", String(isActive));
        t.setAttribute("tabindex", isActive ? "0" : "-1");
        if (panel) panel.hidden = !isActive;
      });
      if (focus) tab.focus();
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activate(tab, false));

      tab.addEventListener("keydown", (event) => {
        let newIndex = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") newIndex = (index + 1) % tabs.length;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") newIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") newIndex = 0;
        if (event.key === "End") newIndex = tabs.length - 1;
        if (newIndex !== null) {
          event.preventDefault();
          activate(tabs[newIndex], true);
        }
      });
    });
  });

  /* ---------------------------------------------------------
   * Abertura suave dos accordions (Dúvidas frequentes)
   *
   * O <details> nativo abre/fecha instantaneamente — animamos a
   * altura via Web Animations API. A altura fechada é medida no
   * carregamento (todos começam fechados no HTML) e a altura aberta
   * é lida do scrollHeight logo após abrir, então não precisamos
   * somar padding/margens manualmente.
   * --------------------------------------------------------- */
  if (!prefersReducedMotion) {
    const faqItems = document.querySelectorAll(".faq-item");

    faqItems.forEach((item) => {
      const summary = item.querySelector("summary");
      const closedHeight = item.offsetHeight;
      let animation = null;
      let isClosing = false;
      let isExpanding = false;

      const onFinish = (open) => {
        item.open = open;
        animation = null;
        isClosing = false;
        isExpanding = false;
        item.style.height = "";
        item.style.overflow = "";
      };

      const shrink = () => {
        isClosing = true;
        item.style.overflow = "hidden";
        if (animation) animation.cancel();
        animation = item.animate(
          { height: [`${item.offsetHeight}px`, `${closedHeight}px`] },
          { duration: 250, easing: "ease" }
        );
        animation.onfinish = () => onFinish(false);
        animation.oncancel = () => { isClosing = false; };
      };

      const expand = () => {
        isExpanding = true;
        item.style.overflow = "hidden";
        const startHeight = `${item.offsetHeight}px`;
        const endHeight = `${item.scrollHeight}px`;
        if (animation) animation.cancel();
        animation = item.animate(
          { height: [startHeight, endHeight] },
          { duration: 300, easing: "ease" }
        );
        animation.onfinish = () => onFinish(true);
        animation.oncancel = () => { isExpanding = false; };
      };

      const open = () => {
        item.style.height = `${item.offsetHeight}px`;
        item.open = true;
        window.requestAnimationFrame(expand);
      };

      summary.addEventListener("click", (event) => {
        event.preventDefault();
        if (isClosing || !item.open) {
          faqItems.forEach((other) => {
            if (other !== item && other.open) other.querySelector("summary").click();
          });
          open();
        } else if (isExpanding || item.open) {
          shrink();
        }
      });
    });
  }

  /* ---------------------------------------------------------
   * Copiar telefone para a área de transferência
   * --------------------------------------------------------- */
  const copyButtons = document.querySelectorAll(".copy-btn");

  const showCopyFeedback = (btn, feedback) => {
    if (!feedback) return;
    feedback.textContent = "Copiado!";
    feedback.classList.add("is-visible");
    window.clearTimeout(btn._copyTimeout);
    btn._copyTimeout = window.setTimeout(() => {
      feedback.classList.remove("is-visible");
    }, 2000);
  };

  const copyWithFallback = (value) => {
    const tempInput = document.createElement("textarea");
    tempInput.value = value;
    tempInput.style.position = "fixed";
    tempInput.style.opacity = "0";
    document.body.appendChild(tempInput);
    tempInput.select();
    try { document.execCommand("copy"); } catch { /* silencioso */ }
    document.body.removeChild(tempInput);
  };

  copyButtons.forEach((btn) => {
    const value = btn.getAttribute("data-copy-value");
    const feedback = btn.parentElement.querySelector(".copy-feedback");

    btn.addEventListener("click", async () => {
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(value);
          showCopyFeedback(btn, feedback);
        } catch {
          copyWithFallback(value);
          showCopyFeedback(btn, feedback);
        }
        return;
      }

      // Fallback para navegadores sem Clipboard API (ex.: contexto não-HTTPS)
      copyWithFallback(value);
      showCopyFeedback(btn, feedback);
    });
  });

  /* ---------------------------------------------------------
   * Ano atual no rodapé
   * --------------------------------------------------------- */
  const yearEl = document.getElementById("anoAtual");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
   * Revelação suave de seções ao rolar (respeita reduced motion)
   * --------------------------------------------------------- */
  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    const revealTargets = document.querySelectorAll(
      ".benefit-card, .price-card, .steps li, .faq-item, .about-grid, .contact-grid"
    );

    revealTargets.forEach((el) => el.setAttribute("data-reveal", ""));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    revealTargets.forEach((el) => observer.observe(el));
  }
})();
