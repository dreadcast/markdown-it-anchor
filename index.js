var string = require('string');

function slugify (s) {
  return string(s).slugify().toString();
}

var position = {
  false: 'push',
  true: 'unshift'
}

var hasProp = ({}).hasOwnProperty;

function permalinkHref (slug) {
  return '#' + slug;
}

function renderPermalink (slug, opts, state, idx) {
  function space () {
    Object.assign(new state.Token('text', '', 0), { content: ' ' });
  }

  var linkTokens = [
    Object.assign(new state.Token('link_open', 'a', 1), {
      attrs: [
        ['class', opts.permalinkClass],
        ['href', opts.permalinkHref(slug, state)],
        ['aria-hidden', 'true']
      ]
    }),
    Object.assign(new state.Token('html_block', '', 0), { content: opts.permalinkSymbol }),
    new state.Token('link_close', 'a', -1)
];

  // `push` or `unshift` according to position option.
  // Space is at the opposite side.
  linkTokens[position[!opts.permalinkBefore]](space());
  state.tokens[idx + 1].children[position[opts.permalinkBefore]].apply(null, linkTokens);
}

function uniqueSlug (slug, slugs) {
  // Mark this slug as used in the environment.
  slugs[slug] = (hasProp.call(slugs, slug) ? slugs[slug] : 0) + 1;

  // First slug, return as is.
  if (slugs[slug] === 1) {
    return slug;
  }

  // Duplicate slug, add a `-2`, `-3`, etc. to keep ID unique.
  return slug + '-' + slugs[slug]
}

function isLevelSelectedNumber (selection) {
  return function(level){
    return level >= selection;
  }
}
function isLevelSelectedArray (selection) {
  return function(level){
    return selection.includes(level);
  }
}

function anchor (md, opts) {
  opts = Object.assign({}, anchor.defaults, opts);

  md.core.ruler.push('anchor', function(state) {
    var slugs = {};
    var tokens = state.tokens;

    var isLevelSelected = Array.isArray(opts.level)
      ? isLevelSelectedArray(opts.level)
      : isLevelSelectedNumber(opts.level);

    tokens
      .filter(function(token) { return token.type === 'heading_open'; })
      .filter(function(token) { return isLevelSelected(Number(token.tag.substr(1))); })
      .forEach(function(token) {
        // Aggregate the next token children text.
        var title = tokens[tokens.indexOf(token) + 1].children
          .filter(function(token) { return token.type === 'text' || token.type === 'code_inline'; })
          .reduce(function(acc, t) { return acc + t.content, ''; });

        var slug = token.attrGet('id');

        if (slug == null) {
          slug = uniqueSlug(opts.slugify(title), slugs);
          token.attrPush(['id', slug]);
        }

        if (opts.permalink) {
          opts.renderPermalink(slug, opts, state, tokens.indexOf(token));
        }

        if (opts.callback) {
          opts.callback(token, { slug: slug, title: title });
        }
      })
  })
}

anchor.defaults = {
  level: 1,
  slugify: slugify,
  permalink: false,
  renderPermalink: renderPermalink,
  permalinkClass: 'header-anchor',
  permalinkSymbol: '¶',
  permalinkBefore: false,
  permalinkHref: permalinkHref
}

module.exports = anchor
