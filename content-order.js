// The path order across all content files. Levels not listed keep their place at the end.
(() => {
  const ORDER = ["what-ai-is", "ai-pilled", "training", "prompting", "how-software-works", "web-from-zero",
    "toolbox", "data-sql", "git-hands-on", "agents", "build-with-claude-code", "cloud-deeper",
    "choosing-models", "multimodal", "compliance", "ai-data-security", "ai-risks", "ai-governance",
    "moat", "ai-landscape", "software-business", "future-engineering", "the-loop", "your-30-days"];
  const rank = id => { const i = ORDER.indexOf(id); return i < 0 ? 999 : i; };
  window.COURSE.sort((a, b) => rank(a.id) - rank(b.id));
})();
