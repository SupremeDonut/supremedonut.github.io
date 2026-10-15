const contentRoot = new URL("content/", document.baseURI);

function escapeHTML(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
}

function parseEntry(source, kind) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match)
    throw new Error("Markdown entry is missing its YAML metadata block.");

  const metadata = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([a-z]+):\s*(.*)$/);
    if (!field) throw new Error(`Invalid metadata line: ${line}`);
    metadata[field[1]] = field[2].trim();
  }

  const requiredFields =
    kind === "projects"
      ? ["slug", "title", "summary"]
      : ["slug", "title", "date"];
  for (const field of requiredFields) {
    if (!metadata[field]) throw new Error(`Markdown entry has no ${field}.`);
  }
  return { metadata, body: source.slice(match[0].length) };
}

function renderMarkdown(body, fileURL) {
  const template = document.createElement("template");
  template.innerHTML = marked.parse(body);
  for (const element of template.content.querySelectorAll(
    "script, object, embed",
  )) {
    element.remove();
  }
  for (const frame of [...template.content.querySelectorAll("iframe")]) {
    let url;
    try {
      url = new URL(frame.getAttribute("src"), fileURL);
    } catch {
      frame.remove();
      continue;
    }
    const youtubeHosts = [
      "youtube.com",
      "www.youtube.com",
      "youtube-nocookie.com",
      "www.youtube-nocookie.com",
    ];
    if (
      url.protocol !== "https:" ||
      url.port ||
      url.username ||
      url.password ||
      !youtubeHosts.includes(url.hostname) ||
      !/^\/embed\/[A-Za-z0-9_-]{11}\/?$/.test(url.pathname)
    ) {
      frame.remove();
      continue;
    }
    const safeFrame = document.createElement("iframe");
    safeFrame.src = url.href;
    safeFrame.title = frame.getAttribute("title")?.trim() || "YouTube video";
    safeFrame.loading = "lazy";
    safeFrame.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    safeFrame.referrerPolicy = "strict-origin-when-cross-origin";
    safeFrame.allowFullscreen = true;
    safeFrame.className = "youtube-embed";
    frame.replaceWith(safeFrame);
  }
  for (const element of template.content.querySelectorAll("*")) {
    for (const attribute of [...element.attributes]) {
      if (attribute.name.toLowerCase().startsWith("on")) {
        element.removeAttribute(attribute.name);
      }
    }
    for (const attribute of ["src", "href", "poster"]) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      try {
        const url = new URL(value, fileURL);
        if (!["http:", "https:", "mailto:", "tel:"].includes(url.protocol)) {
          element.removeAttribute(attribute);
        } else {
          element.setAttribute(attribute, url.href);
        }
      } catch {
        element.removeAttribute(attribute);
      }
    }
  }
  return template.innerHTML;
}

async function loadEntries(kind) {
  const manifestResponse = await fetch(new URL(`${kind}.json`, contentRoot));
  if (!manifestResponse.ok) throw new Error(`Could not load ${kind} content.`);
  const files = await manifestResponse.json();
  return Promise.all(
    files.map(async (file) => {
      const fileURL = new URL(file, contentRoot);
      const response = await fetch(fileURL);
      if (!response.ok) throw new Error(`Could not load ${file}.`);
      return { ...parseEntry(await response.text(), kind), fileURL };

    }),
  );
}

function makeEntry(entry, index, isProject) {
  const { metadata: item, body, fileURL } = entry;
  const accent = (index + (isProject ? 0 : 3)) % 6;
  const summary = isProject
    ? `<p class="summary">${escapeHTML(item.summary)}</p>`
    : "";
  return `<article class="entry" id="${escapeHTML(item.slug)}" style="--accent:var(--c${accent});--tint:var(--t${accent})">
    <div class="entry-content">
      ${!isProject && item.label ? `<div class="entry-label">${escapeHTML(item.label)}</div>` : ""}
      <h2>${escapeHTML(item.title)}</h2>
      ${summary}
      <div class="markdown-body">${renderMarkdown(body, fileURL)}</div>
    </div>
  </article>`;
}

function makePreview(entry, index, isProject) {
  const { metadata: item } = entry;
  const accent = (index + (isProject ? 0 : 3)) % 6;
  const target = `${isProject ? "projects" : "experience"}.html#${encodeURIComponent(item.slug)}`;
  const trailing = isProject
    ? ""
    : `<span class="date">${escapeHTML(item.date)}</span>`;
  const secondary = isProject ? item.summary : item.label;
  return `<a class="overview-row" style="--accent:var(--c${accent});--tint:var(--t${accent})" href="${target}">
    <span class="index">0${index + 1}</span>
    <div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(secondary)}</p></div>
    ${trailing}
    <span class="arrow">↗</span>
  </a>`;
}

function showLoadError(target, error) {
  target.innerHTML = `<p class="content-error">Content could not be loaded: ${escapeHTML(error.message)}</p>`;
}

function sizeTimelineNav(nav, timeline) {
  const links = [...nav.children];
  const sections = [...timeline.children];
  const desktop = matchMedia("(min-width: 761px)").matches;

  if (!desktop) {
    nav.style.removeProperty("height");
    links.forEach((link) => link.style.removeProperty("flex-grow"));
    timeline.style.setProperty(
      "--timeline-scroll-margin",
      `${nav.getBoundingClientRect().height + 16}px`,
    );
    return;
  }

  nav.style.height = `${Math.min(
    Math.round(window.innerHeight * 0.72),
    window.innerHeight - 48,
  )}px`;
  links.forEach((link, index) => {
    const section = sections[index];
    const gap = Number.parseFloat(getComputedStyle(section).marginBottom) || 0;
    link.style.flexGrow = String(section.getBoundingClientRect().height + gap);
  });
  timeline.style.setProperty("--timeline-scroll-margin", "35px");
}

function updateTimelineProgress(nav, timeline) {
  const sections = [...timeline.children];
  const links = [...nav.children];
  if (!sections.length) return;

  const activationPoint = Math.min(window.innerHeight * 0.35, 260);
  const bounds = timeline.getBoundingClientRect();
  const progress = Math.max(
    0,
    Math.min(1, (activationPoint - bounds.top) / Math.max(bounds.height, 1)),
  );
  nav.style.setProperty("--timeline-progress", progress);

  let activeIndex = 0;
  if (
    window.scrollY + window.innerHeight >=
    document.documentElement.scrollHeight - 1
  ) {
    activeIndex = sections.length - 1;
  } else {
    sections.forEach((section, index) => {
      if (section.getBoundingClientRect().top <= activationPoint) {
        activeIndex = index;
      }
    });
  }

  links.forEach((link, index) => {
    const active = index === activeIndex;
    const star = link.querySelector(".timeline-nav-star");
    link.classList.toggle("is-active", active);
    if (active) {
      link.setAttribute("aria-current", "location");
      star.textContent = "★";
    } else {
      link.removeAttribute("aria-current");
      star.textContent = "☆";
    }
  });
}

async function renderSection(kind, isProject) {
  const prefix = isProject ? "project" : "experience";
  const timeline = document.getElementById(`${prefix}-timeline`);
  const nav = document.getElementById(`${prefix}-nav`);
  const previews = document.getElementById(`${prefix}-previews`);
  if (!timeline && !previews) return;

  try {
    const entries = await loadEntries(kind);
    if (timeline) {
      timeline.innerHTML = entries
        .map((entry, index) => makeEntry(entry, index, isProject))
        .join("");
      nav.innerHTML = entries
        .map(({ metadata: item }, index) => {
          const accent = (index + (isProject ? 0 : 3)) % 6;
          const date = isProject
            ? ""
            : `<span class="timeline-nav-date">${escapeHTML(item.date)}</span>`;
          return `<a href="#${encodeURIComponent(item.slug)}" style="--accent:var(--c${accent});--tint:var(--t${accent})">
            <span class="timeline-nav-star" aria-hidden="true">☆</span>
            ${date}
            <span class="timeline-nav-title">${escapeHTML(item.title)}</span>
          </a>`;
        })
        .join("");
      const update = () => {
        sizeTimelineNav(nav, timeline);
        updateTimelineProgress(nav, timeline);
      };
      update();
      const observer = new ResizeObserver(update);
      timeline
        .querySelectorAll(".entry-content")
        .forEach((card) => observer.observe(card));
      window.addEventListener("resize", update, { passive: true });
      let framePending = false;
      window.addEventListener(
        "scroll",
        () => {
          if (framePending) return;
          framePending = true;
          requestAnimationFrame(() => {
            framePending = false;
            updateTimelineProgress(nav, timeline);
          });
        },
        { passive: true },
      );
      if (location.hash) {
        let targetId;
        try {
          targetId = decodeURIComponent(location.hash.slice(1));
        } catch {
          targetId = "";
        }
        const target = document.getElementById(targetId);
        if (target?.parentElement === timeline) {
          await Promise.all(
            [...timeline.querySelectorAll("img")].map((image) =>
              image.decode().catch(() => {}),
            ),
          );
          requestAnimationFrame(() =>
            target.scrollIntoView({ block: "start" }),
          );
        }
      }
    }
    if (previews) {
      previews.innerHTML = entries
        .map((entry, index) => makePreview(entry, index, isProject))
        .join("");
    }
  } catch (error) {
    showLoadError(timeline || previews, error);
  }
}

if (typeof marked === "undefined") {
  document
    .querySelectorAll(
      "#project-timeline, #experience-timeline, #project-previews, #experience-previews",
    )
    .forEach((target) => {
      showLoadError(target, new Error("Markdown renderer failed to load."));
    });
} else {
  renderSection("projects", true);
  renderSection("experience", false);
}
