export const mathJaxConfig = {
  loader: {
    load: ['input/tex', 'output/chtml'],
    timeout: 10000,
  },
  startup: {
    typeset: false,
  },
  tex: {
    inlineMath: [['\\(', '\\)']],
    displayMath: [['\\[', '\\]']],
    processEscapes: true,
  },
};

export const mmlOptions = {
  messageStyle: "none",
  extensions: ["tex2jax.js"],
  jax: ["input/TeX", "output/HTML-CSS"],
  tex2jax: {
    inlineMath: [["$", "$"], ["\\(", "\\)"]],
    displayMath: [["$$", "$$"], ["\\[", "\\]"]],
    processEscapes: true,
  },
  TeX: {
    extensions: ["AMSmath.js", "AMSsymbols.js", "noErrors.js", "noUndefined.js"],
  },
};
