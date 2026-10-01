const floors = [
  { number: "T", id: "benvenuti", label: "Benvenuti" },
  { number: "1", id: "chi-siamo", label: "Chi siamo" },
  { number: "2", id: "servizi", label: "Servizi" },
  { number: "3", id: "prodotti", label: "Prodotti" },
  { number: "4", id: "accessibilita", label: "Accessibilità" },
  { number: "5", id: "progetti", label: "Progetti" },
  { number: "6", id: "referenze", label: "Referenze" },
  { number: "A", id: "contatti", label: "Contatti" },
] as const;

const buttonClass =
  "group inline-flex min-h-12 items-center justify-center gap-4 border border-primary bg-primary px-6 py-3.5 text-[13px] font-semibold text-primary-foreground transition-all hover:bg-[#e8bb78] hover:shadow-[0_0_24px_#d9a95d25] active:scale-[0.98]";

const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );

const pathname = document.body.dataset.pathname ?? "/";
const home = pathname === "/";
const floorDialog = document.querySelector<HTMLDialogElement>(
  'dialog[aria-labelledby="floor-menu-title"]',
);
const floorPanel = document.querySelector<HTMLElement>(
  'aside[aria-label="Pulsantiera dei piani"]',
);
const floorButtons = Array.from(
  floorPanel?.querySelectorAll<HTMLButtonElement>(
    'nav[aria-label="Scegli un piano"] button',
  ) ?? [],
);
const mobileFloorButtons = Array.from(
  floorDialog?.querySelectorAll<HTMLButtonElement>(".grid button") ?? [],
);
let audioEnabled = false;
let audioContext: AudioContext | null = null;

function ding(): void {
  if (!audioEnabled) return;
  try {
    audioContext ??= new AudioContext();
    void audioContext.resume();
    [880, 660].forEach((frequency, index) => {
      const oscillator = audioContext?.createOscillator();
      const gain = audioContext?.createGain();
      if (!oscillator || !gain || !audioContext) return;
      const start = audioContext.currentTime + index * 0.16;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.045, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.5);
    });
  } catch {
    audioEnabled = false;
  }
}

const doorOverlay = Array.from(document.querySelectorAll<HTMLElement>("body > div")).find(
  (element) => element.textContent?.includes("Salta animazione"),
);
const doorPanels = Array.from(
  doorOverlay?.querySelectorAll<HTMLElement>(":scope > div") ?? [],
).slice(0, 2);
let doorTimer = 0;

if (doorOverlay && doorPanels.length === 2) {
  doorOverlay.classList.add("elevator-door-overlay");
  doorPanels[0]?.classList.add("elevator-door-panel", "elevator-door-left");
  doorPanels[1]?.classList.add("elevator-door-panel", "elevator-door-right");

  const seam = document.createElement("div");
  seam.className = "elevator-door-seam";
  seam.setAttribute("aria-hidden", "true");

  const indicator = document.createElement("div");
  indicator.className = "elevator-door-indicator";
  indicator.setAttribute("aria-hidden", "true");
  indicator.innerHTML =
    '<span class="elevator-door-indicator-light"></span><span>PIANO T · ARRIVO</span>';

  doorOverlay.append(seam, indicator);
}

function dismissDoors(): void {
  window.clearTimeout(doorTimer);
  doorOverlay?.remove();
}

function openDoors(): void {
  if (!doorOverlay || doorPanels.length !== 2) return;
  window.clearTimeout(doorTimer);
  document.body.append(doorOverlay);
  doorOverlay.classList.remove("is-opening");
  doorPanels[0]?.classList.remove("-translate-x-full");
  doorPanels[1]?.classList.remove("translate-x-full");
  void doorOverlay.offsetWidth;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      doorOverlay.classList.add("is-opening");
      doorTimer = window.setTimeout(
        dismissDoors,
        matchMedia("(prefers-reduced-motion: reduce)").matches ? 160 : 1450,
      );
    }),
  );
}

doorOverlay
  ?.querySelector<HTMLButtonElement>("button")
  ?.addEventListener("click", dismissDoors);
openDoors();

function travel(index: number): void {
  floorDialog?.close();
  ding();
  openDoors();
  window.setTimeout(() => {
    if (home) {
      document
        .getElementById(floors[index].id)
        ?.scrollIntoView({ behavior: "instant" });
    } else {
      window.location.href = `/#${floors[index].id}`;
    }
  }, 110);
}

floorButtons.forEach((button, index) =>
  button.addEventListener("click", () => travel(index)),
);
mobileFloorButtons.forEach((button, index) =>
  button.addEventListener("click", () => travel(index)),
);
document
  .querySelector<HTMLButtonElement>(
    'button[aria-label="Apri la pulsantiera di navigazione"]',
  )
  ?.addEventListener("click", () => floorDialog?.showModal());
floorDialog
  ?.querySelector<HTMLButtonElement>('button[aria-label="Chiudi menu"]')
  ?.addEventListener("click", () => floorDialog.close());
floorDialog?.addEventListener("click", (event) => {
  if (event.target === floorDialog) floorDialog.close();
});

const audioButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>('[aria-label*="audio"], dialog button[aria-pressed]'),
);
function updateAudioButtons(): void {
  audioButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(audioEnabled));
    if (button.hasAttribute("aria-label"))
      button.setAttribute(
        "aria-label",
        audioEnabled ? "Disattiva audio" : "Attiva audio",
      );
    if (button.textContent?.includes("Audio"))
      button.lastChild &&
        (button.lastChild.textContent = `Audio ${audioEnabled ? "on" : "off"}`);
  });
}
audioButtons.forEach((button) =>
  button.addEventListener("click", () => {
    audioEnabled = !audioEnabled;
    updateAudioButtons();
  }),
);

let previousScroll = window.scrollY;
let scrollFrame = 0;
function activeFloor(): number {
  if (!home) {
    if (pathname === "/contatti") return 7;
    if (pathname.includes("prodotti")) return 3;
    if (pathname.includes("servizi")) return 2;
    return pathname === "/chi-siamo" ? 1 : pathname === "/progetti" ? 5 : 0;
  }
  let active = 0;
  floors.forEach((floor, index) => {
    if (
      (document.getElementById(floor.id)?.getBoundingClientRect().top ??
        Infinity) <
      window.innerHeight * 0.4
    )
      active = index;
  });
  return active;
}
function updateFloorPanel(): void {
  const active = activeFloor();
  [...floorButtons, ...mobileFloorButtons].forEach((button, index) => {
    button.setAttribute("aria-current", index === active ? "location" : "false");
    button.classList.toggle("border-primary", index === active);
    button.classList.toggle("bg-primary/10", index === active);
    button.classList.toggle("text-primary", index === active);
  });
  const display = floorPanel?.querySelector<HTMLElement>(".text-primary span");
  if (display) display.textContent = floors[active].number;
  const progress =
    window.scrollY /
    Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const track = floorPanel?.querySelector<HTMLElement>('div[aria-hidden="true"]');
  const indicator = track?.firstElementChild;
  if (indicator instanceof HTMLElement) indicator.style.top = `${progress * 85}%`;
  previousScroll = window.scrollY;
}
function onScroll(): void {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    updateFloorPanel();
    scrollFrame = 0;
  });
}
window.addEventListener("scroll", onScroll, { passive: true });
updateFloorPanel();

const heroImage = document.querySelector<HTMLImageElement>("#benvenuti img");
if (heroImage && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  window.addEventListener(
    "scroll",
    () => {
      if (window.scrollY < 1000)
        heroImage.style.transform = `translateY(${window.scrollY * 0.12}px) scale(1.04)`;
    },
    { passive: true },
  );
}

document
  .querySelectorAll<HTMLElement>('[aria-label="24/7"], [aria-label="360°"], [aria-label="01"]')
  .forEach((metric) => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = metric.getAttribute("aria-label") ?? "";
    const value = Number.parseInt(target, 10);
    const suffix = target.replace(String(value).padStart(2, "0"), "");
    const output = metric.querySelector<HTMLElement>('[aria-hidden="true"]');
    if (!output) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / 850, 1);
          const count = Math.round(value * (1 - Math.pow(1 - progress, 3)));
          output.textContent = `${target === "01" ? String(count).padStart(2, "0") : count}${suffix}`;
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    observer.observe(metric);
  });

const products = [
  {
    name: "Ascensori",
    tag: "CONDOMINI · EDIFICI PUBBLICI",
    image: "/images/elevator-interior.jpg",
    text: "Tecnologia e design, allo stesso livello. Soluzioni elettriche e oleodinamiche progettate intorno al tuo edificio.",
    features: ["Progettazione su misura", "Finiture personalizzabili", "Comfort di viaggio"],
  },
  {
    name: "Elevatori panoramici",
    tag: "ARCHITETTURA · HOTEL",
    image: "/images/elevator-hero.jpg",
    text: "Un nuovo punto di vista sul movimento. Vetro, luce e strutture metalliche che dialogano con l’architettura.",
    features: ["Cabine vetrate", "Integrazione architettonica", "Torri metalliche"],
  },
  {
    name: "Montacarichi",
    tag: "AZIENDE · RISTORAZIONE",
    image: "/images/atrium.jpg",
    text: "Il lavoro si muove meglio. Elevatori di servizio e portavivande per ristoranti, supermercati e attività commerciali.",
    features: ["Soluzioni per merci", "Dimensionamento dedicato", "Affidabilità operativa"],
  },
  {
    name: "Montascale",
    tag: "CASA · ACCESSIBILITÀ",
    image: "/images/architecture.jpg",
    text: "Ogni spazio, di nuovo accessibile. Soluzioni per superare le scale e rendere più semplici i movimenti di ogni giorno.",
    features: ["Studio del percorso", "Per ambienti esistenti", "Accessibilità quotidiana"],
  },
] as const;

const productSection = document.getElementById("prodotti");
const productTabs = Array.from(
  productSection?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
);
const productPanel =
  productSection?.querySelector<HTMLElement>("#product-panel") ?? null;
function selectProduct(index: number, focus = false): void {
  const product = products[index];
  if (!product || !productPanel) return;
  productTabs.forEach((button, buttonIndex) => {
    const selected = buttonIndex === index;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
    button.classList.toggle("text-primary", selected);
    button.classList.toggle("text-white/55", !selected);
  });
  productSection?.querySelector<HTMLElement>(".max-w-\\[330px\\]")?.replaceChildren(document.createTextNode(product.text));
  const image = productPanel.querySelector<HTMLImageElement>("img");
  if (image) {
    image.src = product.image;
    image.alt = `Immagine architettonica illustrativa per ${product.name.toLowerCase()}`;
  }
  const labels = productPanel.querySelectorAll<HTMLElement>(":scope > span, h3");
  if (labels[0]) labels[0].textContent = product.tag;
  if (labels[1]) labels[1].textContent = product.name;
  const features = productPanel.querySelector<HTMLElement>(".flex.flex-wrap");
  if (features)
    features.innerHTML = product.features
      .map(
        (feature) =>
          `<span class="border border-white/30 bg-black/20 px-3 py-2 text-[10px] backdrop-blur-sm">${feature}</span>`,
      )
      .join("");
  productPanel.setAttribute("aria-labelledby", `product-tab-${index}`);
  if (focus) productTabs[index]?.focus();
}
productTabs.forEach((button, index) => {
  button.addEventListener("click", () => selectProduct(index));
  button.addEventListener("keydown", (event) => {
    if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(event.key))
      return;
    event.preventDefault();
    const next =
      (index +
        (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1) +
        productTabs.length) %
      productTabs.length;
    selectProduct(next, true);
  });
});

const projectData = [
  {
    title: "Nuova prospettiva, stesso edificio.",
    category: "Condominio",
    image: "/images/elevator-hero.jpg",
    description:
      "Inserire un nuovo ascensore in un edificio esistente: struttura vetrata e studio degli spazi per collegare i piani senza sacrificare la luce.",
  },
  {
    title: "La casa torna senza limiti.",
    category: "Privato",
    image: "/images/architecture.jpg",
    description:
      "Superare i dislivelli in casa con una soluzione progettata a partire dal percorso, dagli ingombri e dalle esigenze di chi la abita.",
  },
  {
    title: "Il movimento incontra il design.",
    category: "Azienda",
    image: "/images/elevator-interior.jpg",
    description:
      "Ripensare cabina, comandi e finiture per un impianto che esprime l’identità dell’edificio e migliora il comfort quotidiano.",
  },
] as const;
const projectsSection = document.getElementById("progetti");
const projectCards = Array.from(
  projectsSection?.querySelectorAll<HTMLButtonElement>(".grid.gap-7 > button") ??
    [],
);
const filterButtons = Array.from(
  projectsSection?.querySelectorAll<HTMLButtonElement>(
    '[aria-label="Filtra i progetti"] button',
  ) ?? [],
);
const projectDialog =
  projectsSection?.querySelector<HTMLDialogElement>(
    'dialog[aria-labelledby="project-dialog-title"]',
  ) ?? null;
filterButtons.forEach((button) =>
  button.addEventListener("click", () => {
    const filter = button.textContent?.trim() ?? "Tutti";
    filterButtons.forEach((item) => {
      const selected = item === button;
      item.setAttribute("aria-pressed", String(selected));
      item.classList.toggle("border-primary", selected);
      item.classList.toggle("bg-primary/10", selected);
      item.classList.toggle("text-primary", selected);
      item.classList.toggle("border-white/20", !selected);
      item.classList.toggle("text-white/60", !selected);
    });
    projectCards.forEach((card, index) => {
      card.hidden =
        filter !== "Tutti" && projectData[index]?.category !== filter;
    });
  }),
);
projectCards.forEach((card, index) =>
  card.addEventListener("click", () => {
    const project = projectData[index];
    if (!project || !projectDialog) return;
    projectDialog.querySelector("[data-project-content]")?.remove();
    const content = document.createElement("div");
    content.dataset.projectContent = "";
    content.innerHTML = `
      <span class="font-mono text-[9px] text-primary">SCENARIO ILLUSTRATIVO · ${project.category.toUpperCase()}</span>
      <h2 id="project-dialog-title" class="mb-6 mt-3 pr-7 font-display text-3xl">${project.title}</h2>
      <div class="relative h-82.5 overflow-hidden">
        <img src="${project.image}" alt="Simulazione visiva del progetto, aspetto precedente" class="absolute inset-0 h-full w-full object-cover brightness-50 grayscale">
        <img src="${project.image}" alt="Simulazione visiva del progetto, aspetto aggiornato" data-after class="absolute inset-0 h-full w-full object-cover" style="clip-path:inset(0 0 50% 0)">
        <div data-divider class="absolute inset-x-0 h-px bg-primary" style="top:50%"><span class="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 border border-primary bg-background px-3 py-1 text-primary">↕</span></div>
        <span class="absolute left-3 top-3 bg-background/80 px-2 py-1 font-mono text-[9px]">DOPO · CONCEPT</span>
        <span class="absolute bottom-3 left-3 bg-background/80 px-2 py-1 font-mono text-[9px]">PRIMA · SIMULAZIONE</span>
      </div>
      <label class="mt-5 block text-xs text-white/70" for="comparison">Confronto verticale del concept</label>
      <input id="comparison" type="range" min="5" max="95" value="50" class="mt-3 w-full accent-primary">
      <p class="mt-5 text-sm leading-7 text-muted-foreground">${project.description}</p>
      <p class="mt-3 text-[10px] text-white/55">Questo confronto è una simulazione visiva, non documenta un lavoro eseguito.</p>
      <a href="/contatti" class="${buttonClass} mt-7">Realizziamo il tuo progetto ↗</a>`;
    projectDialog.append(content);
    content
      .querySelector<HTMLInputElement>("#comparison")
      ?.addEventListener("input", (event) => {
        const value = (event.currentTarget as HTMLInputElement).value;
        const after = content.querySelector<HTMLElement>("[data-after]");
        const divider = content.querySelector<HTMLElement>("[data-divider]");
        if (after) after.style.clipPath = `inset(0 0 ${100 - Number(value)}% 0)`;
        if (divider) divider.style.top = `${value}%`;
      });
    projectDialog.showModal();
  }),
);
projectDialog
  ?.querySelector<HTMLButtonElement>('button[aria-label="Chiudi progetto"]')
  ?.addEventListener("click", () => projectDialog.close());

const finishButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>(
    "button[aria-pressed]",
  ),
).filter((button) =>
  ["Acciaio satinato", "Grafite", "Bronzo"].includes(
    button.textContent?.trim() ?? "",
  ),
);
finishButtons.forEach((button) =>
  button.addEventListener("click", () => {
    const finish = button.textContent?.trim();
    finishButtons.forEach((item) =>
      item.setAttribute("aria-pressed", String(item === button)),
    );
    const image = button
      .closest("section")
      ?.querySelector<HTMLImageElement>(".relative.min-h-\\[460px\\] img");
    image?.classList.toggle("brightness-75", finish === "Grafite");
    image?.classList.toggle("saturate-50", finish === "Grafite");
    image?.classList.toggle("sepia-40", finish === "Bronzo");
  }),
);

const detailTabs = Array.from(
  document.querySelectorAll<HTMLButtonElement>(
    '[role="tab"][aria-controls="detail-panel"]',
  ),
);
const detailContent = [
  [
    "L’architettura incontra<br>il movimento.",
    "Ogni edificio è unico. Valutiamo spazi, percorsi, illuminazione e destinazione d’uso. Il risultato è un impianto che diventa parte dell’edificio, dentro o fuori, senza rinunciare alla funzionalità.",
  ],
  [
    "La soluzione giusta.<br>Non una qualsiasi.",
    "Trazione elettrica o tecnologia oleodinamica: la scelta nasce dalle esigenze del progetto. Dimensioni, portata, fermate e struttura vengono definiti con i nostri tecnici, nel rispetto dei requisiti applicabili.",
  ],
  [
    "Il comfort si sente.<br>La cura si vede.",
    "Finiture, pulsantiere e illuminazione contribuiscono a un’esperienza semplice e piacevole. Valutiamo accessibilità, facilità d’uso e qualità del viaggio per creare un impianto adatto a chi lo utilizza.",
  ],
] as const;
function selectDetail(index: number, focus = false): void {
  const panel = document.getElementById("detail-panel");
  detailTabs.forEach((button, buttonIndex) => {
    const selected = buttonIndex === index;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
    button.classList.toggle("border-[#3a443a]", selected);
    button.classList.toggle("border-transparent", !selected);
    button.classList.toggle("text-[#59634f]", !selected);
  });
  const heading = panel?.querySelector("h2");
  const paragraph = panel?.querySelector("p");
  if (heading) heading.innerHTML = detailContent[index]?.[0] ?? "";
  if (paragraph) paragraph.textContent = detailContent[index]?.[1] ?? "";
  panel?.setAttribute("aria-labelledby", `detail-${index}`);
  if (focus) detailTabs[index]?.focus();
}
detailTabs.forEach((button, index) => {
  button.addEventListener("click", () => selectDetail(index));
  button.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? detailTabs.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + detailTabs.length) %
            detailTabs.length;
    selectDetail(next, true);
  });
});

const faqAnswers = [
  "La fattibilità dipende dagli spazi, dalle caratteristiche strutturali e dai vincoli dell’edificio. Il sopralluogo ci permette di valutare il progetto e proporti una soluzione concreta.",
  "La cabina viene dimensionata in fase di progettazione in base alla destinazione d’uso, allo spazio disponibile e ai requisiti di accessibilità applicabili.",
  "Predisponiamo un programma dedicato all’impianto. Per gli ascensori in manutenzione è disponibile il servizio di pronto intervento 24 ore su 24, 7 giorni su 7.",
] as const;
const faqButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>('button[aria-controls^="faq-"]'),
);
faqButtons.forEach((button, index) =>
  button.addEventListener("click", () => {
    const shouldOpen = button.getAttribute("aria-expanded") !== "true";
    faqButtons.forEach((item) => {
      item.setAttribute("aria-expanded", "false");
      item.querySelector("svg")?.classList.remove("rotate-45");
      const itemPanel = document.getElementById(
        item.getAttribute("aria-controls") ?? "",
      );
      if (itemPanel) itemPanel.hidden = true;
    });
    if (!shouldOpen) return;
    const id = button.getAttribute("aria-controls") ?? "";
    let panel = document.getElementById(id);
    if (!panel) {
      panel = document.createElement("p");
      panel.id = id;
      panel.className =
        "pb-6 text-[13px] leading-7 text-muted-foreground";
      panel.textContent = faqAnswers[index] ?? "";
      button.after(panel);
    }
    panel.hidden = false;
    button.setAttribute("aria-expanded", "true");
    button.querySelector("svg")?.classList.add("rotate-45");
  }),
);

const formHeading = Array.from(document.querySelectorAll("h3")).find(
  (heading) => heading.textContent?.trim() === "Da quale edificio partiamo?",
);
const quoteForm = formHeading?.parentElement ?? null;
if (quoteForm) {
  const state = {
    step: 0,
    building: "",
    intervention:
      new URLSearchParams(window.location.search).get("intervento") ?? "",
    name: "",
    email: "",
    phone: "",
    message: "",
  };
  const buildings = [
    "Condominio",
    "Casa privata",
    "Azienda / Hotel",
    "Edificio pubblico",
  ];
  const interventions = Array.from(
    new Set([
      "Nuova installazione",
      "Manutenzione",
      "Ammodernamento",
      "Accessibilità",
      "Agevolazioni",
      "Altro / Consulenza",
      ...(state.intervention ? [state.intervention] : []),
    ]),
  );
  const steps = ["Edificio", "Intervento", "Contatto"];
  const renderProgress = () => `
    <div class="mb-8 flex items-center">${steps
      .map(
        (label, index) => `
        <div class="flex flex-1 items-center">
          <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] ${index <= state.step ? "border-primary text-primary" : "border-white/25 text-white/55"}">${index < state.step ? "✓" : index + 1}</span>
          <span class="ml-2 hidden text-[10px] min-[380px]:inline ${index <= state.step ? "text-white" : "text-white/55"}">${label}</span>
          ${index < 2 ? '<span class="mx-3 h-px flex-1 bg-white/15"></span>' : ""}
        </div>`,
      )
      .join("")}</div>`;
  const render = (): void => {
    const titles = [
      "Da quale edificio partiamo?",
      "Come possiamo aiutarti?",
      "Facciamo conoscenza.",
    ];
    const descriptions = [
      "Scegli lo spazio in cui vuoi fare la differenza.",
      "Seleziona l’intervento che hai in mente.",
      "Lasciaci i tuoi dati. Il progetto comincia da qui.",
    ];
    let content = "";
    if (state.step === 0)
      content = `
        <div class="grid grid-cols-2 gap-3">${buildings
          .map(
            (item, index) =>
              `<button type="button" data-building="${escapeHtml(item)}" aria-pressed="${state.building === item}" class="flex min-h-26.5 flex-col items-start justify-between border p-4 text-left text-xs transition-colors ${state.building === item ? "border-primary bg-primary/5 text-primary" : "border-white/15 text-white/75 hover:border-white/40"}"><span class="font-mono text-[9px]">0${index + 1}</span>${item}</button>`,
          )
          .join("")}</div>
        <button type="button" data-next class="${buttonClass} mt-6 w-full disabled:cursor-not-allowed disabled:opacity-35" ${state.building ? "" : "disabled"}>Sali al prossimo piano →</button>`;
    if (state.step === 1)
      content = `
        <div class="space-y-2">${interventions
          .map(
            (item) =>
              `<button type="button" data-intervention="${escapeHtml(item)}" aria-pressed="${state.intervention === item}" class="flex w-full items-center justify-between border px-4 py-3 text-left text-xs transition-colors ${state.intervention === item ? "border-primary bg-primary/5 text-primary" : "border-white/15 text-white/70 hover:border-white/40"}">${item}<span class="h-4 w-4 rounded-full border ${state.intervention === item ? "border-primary bg-primary" : "border-white/30"}"></span></button>`,
          )
          .join("")}</div>
        <div class="mt-6 flex items-center gap-4"><button type="button" data-back class="p-3 text-white/60" aria-label="Torna alla scelta dell’edificio">←</button><button type="button" data-next class="${buttonClass} flex-1 disabled:cursor-not-allowed disabled:opacity-35" ${state.intervention ? "" : "disabled"}>Un ultimo piano →</button></div>`;
    if (state.step === 2)
      content = `
        <form class="space-y-4">
          <label class="block text-[11px] text-white/75">Nome e cognome *<input required name="name" autocomplete="name" value="${escapeHtml(state.name)}" placeholder="Come ti chiami?" class="mt-2 w-full border border-white/40 bg-background/40 px-4 py-3 text-sm text-white placeholder:text-white/55 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"></label>
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block text-[11px] text-white/75">Email *<input required type="email" name="email" autocomplete="email" value="${escapeHtml(state.email)}" placeholder="nome@email.it" class="mt-2 w-full border border-white/40 bg-background/40 px-4 py-3 text-sm text-white placeholder:text-white/55 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"></label>
            <label class="block text-[11px] text-white/75">Telefono<input type="tel" name="phone" autocomplete="tel" value="${escapeHtml(state.phone)}" placeholder="Il tuo numero" class="mt-2 w-full border border-white/40 bg-background/40 px-4 py-3 text-sm text-white placeholder:text-white/55 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"></label>
          </div>
          <label class="block text-[11px] text-white/75">Raccontaci il tuo progetto<textarea name="message" rows="3" placeholder="Zona, edificio, esigenze…" class="mt-2 w-full resize-y border border-white/40 bg-background/40 px-4 py-3 text-sm text-white placeholder:text-white/55 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">${escapeHtml(state.message)}</textarea></label>
          <label class="flex items-start gap-3 text-[10px] leading-5 text-muted-foreground"><input required name="consent" type="checkbox" class="mt-1 accent-primary"><span>Ho letto l’<a href="/privacy" class="underline underline-offset-2">informativa privacy</a> e autorizzo il trattamento dei dati per rispondere alla richiesta. *</span></label>
          <div class="flex items-center gap-4"><button type="button" data-back class="p-3 text-white/60" aria-label="Torna alla scelta dell’intervento">←</button><button type="submit" class="${buttonClass} flex-1">Prepara la richiesta ↗</button></div>
          <p class="text-[9px] leading-5 text-white/55">Invio tramite il tuo programma email. Nessun dato viene salvato sul sito.</p>
        </form>`;
    quoteForm.innerHTML = `${renderProgress()}<h3 tabindex="-1" class="font-display text-[25px] leading-tight outline-none">${titles[state.step]}</h3><p class="mb-6 mt-2 text-[11px] leading-6 text-muted-foreground">${descriptions[state.step]}</p>${content}<div class="mt-6 flex items-center gap-2 border-t border-border pt-5 text-[10px] text-white/55">◇ Preventivo gratuito. Nessun impegno.</div>`;
    quoteForm.querySelectorAll<HTMLButtonElement>("[data-building]").forEach(
      (button) =>
        button.addEventListener("click", () => {
          state.building = button.dataset.building ?? "";
          render();
        }),
    );
    quoteForm
      .querySelectorAll<HTMLButtonElement>("[data-intervention]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          state.intervention = button.dataset.intervention ?? "";
          render();
        }),
      );
    quoteForm
      .querySelector<HTMLButtonElement>("[data-next]")
      ?.addEventListener("click", () => {
        state.step += 1;
        render();
        quoteForm.querySelector<HTMLElement>("h3")?.focus();
      });
    quoteForm
      .querySelector<HTMLButtonElement>("[data-back]")
      ?.addEventListener("click", () => {
        state.step -= 1;
        render();
        quoteForm.querySelector<HTMLElement>("h3")?.focus();
      });
    quoteForm
      .querySelector<HTMLFormElement>("form")
      ?.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget as HTMLFormElement);
        state.name = String(data.get("name") ?? "");
        state.email = String(data.get("email") ?? "");
        state.phone = String(data.get("phone") ?? "");
        state.message = String(data.get("message") ?? "");
        const body = `Buongiorno CRIAM,\n\nVorrei informazioni per un progetto.\nEdificio: ${state.building}\nIntervento: ${state.intervention}\nNome: ${state.name}\nEmail: ${state.email}\nTelefono: ${state.phone}\n\n${state.message}\n\nAutorizzo il contatto per rispondere alla mia richiesta.`;
        const href = `mailto:info@criamascensori.com?subject=${encodeURIComponent(`Richiesta di preventivo – ${state.intervention}`)}&body=${encodeURIComponent(body)}`;
        quoteForm.innerHTML = `<div aria-live="polite" class="py-5"><div class="text-4xl text-primary">✓</div><h3 class="mt-5 font-display text-3xl">Il prossimo piano è il tuo.</h3><p class="mt-5 text-[13px] leading-7 text-muted-foreground">La tua richiesta è pronta, ma non è ancora inviata. Apri il programma di posta per inviarla a <strong class="font-normal text-white">info@criamascensori.com</strong>.</p><dl class="mt-6 grid grid-cols-2 gap-3 border-y border-border py-5 text-xs"><dt class="text-muted-foreground">Edificio</dt><dd>${escapeHtml(state.building)}</dd><dt class="text-muted-foreground">Intervento</dt><dd>${escapeHtml(state.intervention)}</dd><dt class="text-muted-foreground">Contatto</dt><dd class="break-all">${escapeHtml(state.email)}</dd></dl><a href="${href}" class="${buttonClass} mt-6 w-full">Apri e invia via email ✉</a><button type="button" data-edit class="mt-5 text-xs text-white/65">← Modifica i dati</button><p class="mt-6 text-[10px] text-white/55">In alternativa chiamaci al <a href="tel:+390666150274" class="text-primary">06 66150274</a>.</p></div>`;
        quoteForm
          .querySelector<HTMLButtonElement>("[data-edit]")
          ?.addEventListener("click", render);
      });
  };
  render();
}

if (window.location.hash)
  window.setTimeout(
    () =>
      document
        .getElementById(window.location.hash.slice(1))
        ?.scrollIntoView(),
    80,
  );

window.addEventListener("pagehide", () => void audioContext?.close(), {
  once: true,
});
