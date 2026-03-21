(function (global) {
  'use strict';

  function parsePx(val) {
    if (val == null || val === '') return null;
    if (typeof val === 'number') return val;
    var str = String(val).trim();
    var m = str.match(/^(-?[\d.]+)(px|em|rem)?$/);
    if (m) return parseFloat(m[1]);
    var parts = str.split(/\s+/);
    if (parts.length > 1 && parts[0] !== str) {
      return parsePx(parts[0]);
    }
    return null;
  }

  function swiftFontWeight(fw) {
    if (!fw || fw === 'normal') return '.regular';
    var s = String(fw).toLowerCase();
    if (s === 'bold') return '.bold';
    var n = parseInt(fw, 10);
    if (isNaN(n)) return '.regular';
    if (n <= 100) return '.ultraLight';
    if (n <= 200) return '.thin';
    if (n <= 300) return '.light';
    if (n <= 400) return '.regular';
    if (n <= 500) return '.medium';
    if (n <= 600) return '.semibold';
    if (n <= 700) return '.bold';
    if (n <= 800) return '.heavy';
    return '.black';
  }

  function parseColor(val) {
    if (!val || val === 'transparent' || val === 'rgba(0, 0, 0, 0)') return null;
    var m = String(val).match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
    if (m) {
      var r = parseInt(m[1], 10) / 255;
      var g = parseInt(m[2], 10) / 255;
      var b = parseInt(m[3], 10) / 255;
      var a = m[4] != null ? parseFloat(m[4]) : 1;
      return { r: r, g: g, b: b, a: a, swift: "Color(red: " + r + ", green: " + g + ", blue: " + b + ", opacity: " + a + ")", uikit: "UIColor(red: " + r + ", green: " + g + ", blue: " + b + ", alpha: " + a + ")" };
    }
    m = String(val).match(/^#([0-9a-fA-F]{3,8})$/);
    if (m) {
      var hex = m[1];
      if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      var r = parseInt(hex.slice(0, 2), 16) / 255, g = parseInt(hex.slice(2, 4), 16) / 255, b = parseInt(hex.slice(4, 6), 16) / 255;
      var a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
      if (r === 1 && g === 1 && b === 1) { r = 0; g = 0; b = 0; }
      return { r: r, g: g, b: b, a: a, swift: "Color(red: " + r + ", green: " + g + ", blue: " + b + ", opacity: " + a + ")", uikit: "UIColor(red: " + r + ", green: " + g + ", blue: " + b + ", alpha: " + a + ")" };
    }
    return null;
  }

  var DISPLAY_CSS_PROPERTIES = [
      'align-items', 'justify-content',
      'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
      'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
      'background-color', 'color', 'font-size', 'font-weight', 'font-family',
      'border-radius', 'border-width', 'border-color',
      'text-align', 'line-height', 'background-image', 'opacity', 'box-shadow', 'overflow',
      'letter-spacing', 'transform', 'filter', 'z-index',
      'top', 'right', 'bottom', 'left', 'aspect-ratio',
      'outline-width', 'outline-color', 'outline-offset',
      'visibility', 'object-fit', 'object-position', 'pointer-events', 'mix-blend-mode',
      'text-decoration', 'text-decoration-color', 'text-overflow', 'white-space',
      'font-style', 'border-style', 'text-indent',
      'text-shadow', 'background-size',
      'transition', 'transition-duration', 'transition-property', 'transition-timing-function',
      'animation', 'animation-duration', 'animation-timing-function'
    ];

  function getComputedStyleMap(el) {
    var s = el.ownerDocument.defaultView.getComputedStyle(el);
    var out = {};
    for (var i = 0; i < DISPLAY_CSS_PROPERTIES.length; i++) {
      var dashed = DISPLAY_CSS_PROPERTIES[i];
      var camel = dashed.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
      out[camel] = s.getPropertyValue(dashed);
    }
    out.display = s.display;
    out.flexDirection = s.flexDirection;
    out.gap = s.gap;
    out.boxSizing = s.boxSizing;
    return out;
  }

  function cssValueWouldConvert(prop, val, getVal) {
    if (val == null || String(val).trim() === '') return false;
    var v = String(val).trim();
    var vLower = v.toLowerCase();
    if (prop === 'padding-top' || prop === 'padding-right' || prop === 'padding-bottom' || prop === 'padding-left' ||
        prop === 'margin-top' || prop === 'margin-bottom' || prop === 'margin-left' || prop === 'margin-right') {
      if (v === '0' || /^0(px|em|rem|pt|%)?$/i.test(v)) return false;
      return true;
    }
    if (prop === 'width' || prop === 'height') {
      if (vLower === 'auto' || v === '0' || /^0(px|em|rem|%)?$/i.test(v)) return false;
      return true;
    }
    if (prop === 'min-width' || prop === 'max-width' || prop === 'min-height' || prop === 'max-height') {
      if (v === '0' || vLower === 'none' || /^0(px|em|rem)?$/i.test(v)) return false;
      return true;
    }
    if (prop === 'background-color' || prop === 'color') {
      if (vLower === 'transparent' || vLower === 'rgba(0, 0, 0, 0)') return false;
      return true;
    }
    if (prop === 'font-size') {
      if (v === '0' || /^0(px|em|rem)?$/i.test(v)) return false;
      return true;
    }
    if (prop === 'border-radius' || prop === 'border-width' || prop === 'outline-width') {
      if (v === '0' || /^0(px|em|rem)?$/i.test(v)) return false;
      return true;
    }
    if (prop === 'border-color' || prop === 'outline-color') {
      var bw = prop === 'border-color' ? (getVal && getVal('border-width')) : (getVal && getVal('outline-width'));
      if (bw != null && (String(bw).trim() === '0' || /^0(px|em)?$/i.test(String(bw).trim()))) return false;
      if (vLower === 'transparent' || vLower === 'rgba(0, 0, 0, 0)') return false;
      return true;
    }
    if (prop === 'text-align') {
      if (vLower === 'start' || vLower === 'left' || vLower === 'inherit') return false;
      return true;
    }
    if (prop === 'line-height') {
      if (vLower === 'normal' || v === '0' || /^0(px|em)?$/i.test(v)) return false;
      return true;
    }
    if (prop === 'background-image') {
      if (vLower === 'none') return false;
      return true;
    }
    if (prop === 'opacity') {
      var n = parseFloat(v);
      if (isNaN(n) || n >= 1) return false;
      return true;
    }
    if (prop === 'box-shadow' || prop === 'text-shadow') {
      if (vLower === 'none') return false;
      return true;
    }
    if (prop === 'overflow') {
      if (vLower === 'visible') return false;
      return true;
    }
    if (prop === 'letter-spacing' || prop === 'text-indent') {
      if (v === '0' || /^0(px|em|rem)?$/i.test(v)) return false;
      return true;
    }
    if (prop === 'transform' || prop === 'filter') {
      if (vLower === 'none') return false;
      return true;
    }
    if (prop === 'z-index') {
      if (vLower === 'auto') return false;
      return true;
    }
    if (prop === 'top' || prop === 'right' || prop === 'bottom' || prop === 'left') {
      if (vLower === 'auto' || v === '0' || /^0(px|em)?$/i.test(v)) return false;
      return true;
    }
    if (prop === 'visibility') {
      if (vLower === 'visible') return false;
      return true;
    }
    if (prop === 'pointer-events') {
      if (vLower === 'auto') return false;
      return true;
    }
    if (prop === 'mix-blend-mode') {
      if (vLower === 'normal') return false;
      return true;
    }
    if (prop === 'text-decoration') {
      if (vLower === 'none') return false;
      return true;
    }
    if (prop === 'font-style') {
      if (vLower === 'normal') return false;
      return true;
    }
    if (prop === 'border-style') {
      if (vLower === 'none') return false;
      return true;
    }
    if (prop === 'align-items' || prop === 'justify-content') return true;
    if (prop === 'font-weight' || prop === 'font-family') return true;
    if (prop === 'aspect-ratio' && vLower !== 'auto') return true;
    if (prop === 'outline-offset') { if (v === '0' || /^0(px)?$/i.test(v)) return false; return true; }
    if (prop === 'object-fit' && vLower !== 'fill' && vLower !== 'none') return true;
    if (prop === 'object-position') return true;
    if (prop === 'text-decoration-color' || prop === 'text-overflow' || prop === 'white-space') return true;
    if (prop === 'background-size') return true;
    if (prop.indexOf('transition') >= 0 || prop.indexOf('animation') >= 0) return true;
    return true;
  }

  function parseBackgroundImageUrl(val) {
    if (!val || val === 'none') return null;
    var m = String(val).match(/url\s*\(\s*["']?([^"')]+)["']?\s*\)/);
    return m ? m[1].trim() : null;
  }

  function inferIconSfSymbol(ctx) {
    if (!ctx || typeof ctx !== 'string') return null;
    var c = ctx.toLowerCase();
    if (/mic|voice|microphone/.test(c)) return 'mic.fill';
    if (/search|magnify/.test(c)) return 'magnifyingglass';
    if (/close|dismiss|xmark|×/.test(c)) return 'xmark';
    if (/menu|nav|hamburger/.test(c)) return 'line.3.horizontal';
    if (/heart|like|favorite/.test(c)) return 'heart.fill';
    if (/play/.test(c)) return 'play.fill';
    if (/pause/.test(c)) return 'pause.fill';
    if (/share/.test(c)) return 'square.and.arrow.up';
    if (/edit|pencil/.test(c)) return 'pencil';
    if (/delete|trash|remove/.test(c)) return 'trash';
    if (/add|plus|\+/.test(c)) return 'plus';
    if (/minus|remove|−/.test(c)) return 'minus';
    if (/check|done|✓/.test(c)) return 'checkmark';
    if (/star|rating/.test(c)) return 'star.fill';
    if (/bookmark/.test(c)) return 'bookmark.fill';
    if (/home/.test(c)) return 'house.fill';
    if (/settings|gear|cog|config/.test(c)) return 'gearshape';
    if (/user|profile|account|avatar/.test(c)) return 'person.fill';
    if (/cart|basket/.test(c)) return 'cart.fill';
    if (/bag/.test(c)) return 'bag.fill';
    if (/bell|notification/.test(c)) return 'bell.fill';
    if (/filter/.test(c)) return 'line.3.horizontal.decrease.circle';
    if (/sort/.test(c)) return 'arrow.up.arrow.down';
    if (/refresh|reload|retry/.test(c)) return 'arrow.clockwise';
    if (/download/.test(c)) return 'arrow.down.circle';
    if (/upload/.test(c)) return 'arrow.up.circle';
    if (/mail|email/.test(c)) return 'envelope.fill';
    if (/phone|call/.test(c)) return 'phone.fill';
    if (/location|map|address/.test(c)) return 'mappin.circle.fill';
    if (/calendar|date/.test(c)) return 'calendar';
    if (/time|clock/.test(c)) return 'clock.fill';
    if (/lock/.test(c)) return 'lock.fill';
    if (/unlock/.test(c)) return 'lock.open.fill';
    if (/eye|visibility/.test(c)) return 'eye.fill';
    if (/hide/.test(c)) return 'eye.slash.fill';
    if (/info/.test(c)) return 'info.circle.fill';
    if (/warning/.test(c)) return 'exclamationmark.triangle.fill';
    if (/error/.test(c)) return 'xmark.circle.fill';
    if (/more|dots|ellipsis/.test(c)) return 'ellipsis';
    if (/chevron\.left|back|previous/.test(c)) return 'chevron.left';
    if (/chevron\.right|next|forward/.test(c)) return 'chevron.right';
    if (/chevron\.down|dropdown|select/.test(c)) return 'chevron.down';
    if (/chevron\.up/.test(c)) return 'chevron.up';
    if (/loading|spinner/.test(c)) return 'arrow.triangle.2.circlepath';
    if (/link/.test(c) && !/unlink/.test(c)) return 'link';
    return null;
  }

  function resolveUrlWithBase(url, baseUrl) {
    if (!url || typeof url !== 'string') return url;
    if (/^https?:\/\//i.test(url) || /^\/\//.test(url) || /^data:/.test(url)) return url;
    if (url.charAt(0) === '/' && url.charAt(1) !== '/') return (baseUrl || '') + url;
    return url;
  }

  function resolveUrlWithBase(url, baseUrl) {
    if (!url || typeof url !== 'string') return url;
    if (/^https?:\/\//i.test(url) || /^\/\//.test(url) || /^data:/.test(url)) return url;
    if (url.charAt(0) === '/' && url.charAt(1) !== '/') return (baseUrl || '') + url;
    return url;
  }

  function extractNode(el, depth, maxDepth) {
    if (depth > (maxDepth || 6)) return null;
    var baseUrl = (el.ownerDocument && el.ownerDocument.defaultView && el.ownerDocument.defaultView.location) ? el.ownerDocument.defaultView.location.origin : '';
    var tag = (el.tagName || '').toLowerCase();
    var styleMap = getComputedStyleMap(el);
    var text = (el.textContent || '').trim();
    var hasElementChildren = false;
    var childNodes = [];
    if (el.children && el.children.length) {
      for (var i = 0; i < el.children.length; i++) {
        var c = extractNode(el.children[i], depth + 1, maxDepth);
        if (c) { childNodes.push(c); hasElementChildren = true; }
      }
    }
    var textContent = (!hasElementChildren && text) ? text.slice(0, 200) : '';
    var out = { tagName: tag, styles: styleMap, textContent: textContent, children: childNodes };
    if (el.getAttribute) {
      if (tag === 'img') {
        var src = el.getAttribute('src') || el.getAttribute('data-src') || el.getAttribute('data-lazy-src') || el.getAttribute('data-original') || '';
        if (!src) {
          var srcsetStr = el.getAttribute('data-srcset') || el.getAttribute('srcset') || '';
          if (srcsetStr) src = srcsetStr.split(',')[0].trim().split(/\s+/)[0];
        }
        if (src) out.imageSrc = resolveUrlWithBase(src, baseUrl);
      }
      if (tag === 'iframe') {
        var iframeSrc = el.getAttribute('src') || '';
        if (iframeSrc) out.iframeSrc = resolveUrlWithBase(iframeSrc, baseUrl);
      }
      if (tag === 'a') {
        var href = el.getAttribute('href') || '';
        if (href) out.linkHref = resolveUrlWithBase(href, baseUrl);
      }
    }
    var bgImg = styleMap.backgroundImage && parseBackgroundImageUrl(styleMap.backgroundImage);
    if (bgImg) out.backgroundImageUrl = resolveUrlWithBase(bgImg, baseUrl);
    if (!out.imageSrc && !out.backgroundImageUrl && childNodes.length > 0) {
      var firstImg = getFirstImageSrcFromChildren(childNodes);
      if (firstImg) out.imageSrc = firstImg;
    }
    if (!out.imageSrc && !out.backgroundImageUrl && el.querySelector) {
      var anyImg = el.querySelector('img');
      if (!anyImg && el.parentElement) anyImg = el.parentElement.querySelector('img');
      if (!anyImg && el.parentElement && el.parentElement.parentElement) anyImg = el.parentElement.parentElement.querySelector('img');
      if (!anyImg && el.closest) { var a = el.closest('a'); if (a) anyImg = a.querySelector('img'); }
      if (anyImg) {
        var liveSrc = anyImg.src || (anyImg.getAttribute && (anyImg.getAttribute('src') || anyImg.getAttribute('data-src') || anyImg.getAttribute('data-srcset') || anyImg.getAttribute('srcset')));
        if (liveSrc && typeof liveSrc === 'string') {
          liveSrc = liveSrc.split(',')[0].trim().split(/\s+/)[0];
          if (liveSrc) out.imageSrc = resolveUrlWithBase(liveSrc, baseUrl);
        }
      }
    }
    if (!out.imageSrc && !out.backgroundImageUrl) {
      var svgEl = (tag === 'svg') ? el : (el.closest && el.closest('svg'));
      if (!svgEl && el.querySelector) svgEl = el.querySelector('svg');
      if (!svgEl && el.parentElement) svgEl = el.parentElement.querySelector ? el.parentElement.querySelector('svg') : null;
      if (!svgEl && el.parentElement && el.parentElement.parentElement) svgEl = el.parentElement.parentElement.querySelector ? el.parentElement.parentElement.querySelector('svg') : null;
      if (svgEl && svgEl.outerHTML) {
        try {
          var svgStr = svgEl.outerHTML;
          var b64 = btoa(unescape(encodeURIComponent(svgStr)));
          if (b64.length < 30000) out.svgDataUrl = 'data:image/svg+xml;base64,' + b64;
        } catch (err) {}
      }
    }
    if (!out.imageSrc && !out.backgroundImageUrl && !out.svgDataUrl && el.getAttribute) {
      var cls = (el.className && typeof el.className === 'string' ? el.className : '') + ' ';
      var aria = (el.getAttribute('aria-label') || el.getAttribute('title') || '') + ' ';
      var role = (el.getAttribute('role') || '') + ' ';
      if (el.parentElement && el.parentElement.getAttribute) {
        aria += (el.parentElement.getAttribute('aria-label') || el.parentElement.getAttribute('title') || '') + ' ';
        cls += (el.parentElement.className && typeof el.parentElement.className === 'string' ? el.parentElement.className : '') + ' ';
      }
      var ctx = cls + aria + role;
      if (/suggestion|rail|richrsrail/.test(ctx) && (/img|icon|sprite|sug/.test(cls) || (!out.textContent && el.children && el.children.length === 0))) out.iconSfSymbol = 'magnifyingglass';
      else { var sym = inferIconSfSymbol(ctx); if (sym) out.iconSfSymbol = sym; }
    }
    return out;
  }

  function getFirstImageSrcFromChildren(children) {
    for (var i = 0; i < children.length; i++) {
      var c = children[i];
      if (c.imageSrc) return c.imageSrc;
      if (c.backgroundImageUrl) return c.backgroundImageUrl;
      if (c.children && c.children.length) {
        var found = getFirstImageSrcFromChildren(c.children);
        if (found) return found;
      }
    }
    return null;
  }

  function toSwiftUI(node, indent) {
    indent = indent || 0;
    var pad = function (n) { var s = ''; for (var i = 0; i < n; i++) s += '    '; return s; };
    var s = node.styles || {};
    var pt = parsePx(s.paddingTop) || 0, pr = parsePx(s.paddingRight) || 0, pb = parsePx(s.paddingBottom) || 0, pl = parsePx(s.paddingLeft) || 0;
    var mt = parsePx(s.marginTop) || 0, mr = parsePx(s.marginRight) || 0, mb = parsePx(s.marginBottom) || 0, ml = parsePx(s.marginLeft) || 0;
    var bg = parseColor(s.backgroundColor);
    var fg = parseColor(s.color);
    var hasImageBackground = !!node.backgroundImageUrl;
    if (fg && !bg && !hasImageBackground && fg.r === 1 && fg.g === 1 && fg.b === 1) {
      var fa = fg.a != null ? fg.a : 1;
      fg = { r: 0, g: 0, b: 0, a: fa, swift: "Color(red: 0, green: 0, blue: 0, opacity: " + fa + ")", uikit: "UIColor(red: 0, green: 0, blue: 0, alpha: " + fa + ")" };
    }
    var fs = parsePx(s.fontSize);
    var fw = s.fontWeight;
    var radius = parsePx(s.borderRadius) || 0;
    if (radius === 0 && !bg && node.children && node.children.length > 0) {
      for (var ci = 0; ci < node.children.length; ci++) {
        var cs = node.children[ci].styles || {};
        var cr = parsePx(cs.borderRadius) || 0;
        var cbg = parseColor(cs.backgroundColor);
        if (cr > 0 || cbg) { radius = cr; if (cbg) bg = cbg; break; }
      }
    }
    var w = parsePx(s.width);
    var h = parsePx(s.height);
    var minW = parsePx(s.minWidth);
    var maxW = parsePx(s.maxWidth);
    var minH = parsePx(s.minHeight);
    var maxH = parsePx(s.maxHeight);
    var gap = parsePx(s.gap) || 0;
    var textAlign = s.textAlign || 'left';
    var isRow = (s.flexDirection || s.display) === 'row' || s.flexDirection === 'row-reverse';
    var isCol = (s.flexDirection || s.display) === 'column' || s.flexDirection === 'column-reverse' || s.display === 'block' || s.display === 'flex' || s.display === 'grid';
    if (s.display === 'inline' || s.display === 'inline-block') isRow = true;

    var body = '';
    if (node.imageSrc) {
      var src = (node.imageSrc + '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      if (/^https?:\/\//i.test(node.imageSrc) || /^\/\//.test(node.imageSrc)) {
        var imgUrl = /^\/\//.test(node.imageSrc) ? 'https:' + node.imageSrc : node.imageSrc;
        var imgSrcEsc = imgUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        body = 'AsyncImage(url: URL(string: "' + imgSrcEsc + '"))';
      } else {
        body = 'Image("' + src + '")';
      }
    } else if (node.children.length) {
      var stack = isRow ? 'HStack' : 'VStack';
      var alignment = isRow ? (s.alignItems === 'center' ? '.center' : s.alignItems === 'flex-end' ? '.bottom' : '.top') : (s.alignItems === 'center' ? '.center' : s.alignItems === 'flex-end' ? '.trailing' : '.leading');
      body = stack + '(alignment: ' + alignment + ', spacing: ' + gap + ') {\n';
      node.children.forEach(function (ch) {
        body += pad(indent + 1) + toSwiftUI(ch, indent + 1) + '\n';
      });
      body += pad(indent) + '}';
    } else if (node.backgroundImageUrl) {
      var bgUrl = node.backgroundImageUrl + '';
      var urlForSwift = /^\/\//.test(bgUrl) ? 'https:' + bgUrl : bgUrl;
      var bgSrc = urlForSwift.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      if (/^https?:\/\//i.test(bgUrl) || /^\/\//.test(bgUrl)) {
        body = 'AsyncImage(url: URL(string: "' + bgSrc + '"))';
      } else {
        body = 'Image("' + bgSrc + '")';
      }
    } else if (node.svgDataUrl) {
      var dataUrl = (node.svgDataUrl + '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      body = 'AsyncImage(url: URL(string: "' + dataUrl + '"))';
    } else if (node.iframeSrc) {
      var iframeUrl = (node.iframeSrc + '').trim();
      var iframeUrlFull = /^https?:\/\//i.test(iframeUrl) ? iframeUrl : (/^\/\//.test(iframeUrl) ? 'https:' + iframeUrl : 'https://' + iframeUrl.replace(/^\//, ''));
      var iframeEsc = iframeUrlFull.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      body = 'Link(destination: URL(string: "' + iframeEsc + '")) { Text("Open original page / image link") }';
    } else if (node.linkHref && !node.textContent && node.children.length === 0) {
      var linkUrl = (node.linkHref + '').trim();
      var linkUrlFull = /^https?:\/\//i.test(linkUrl) ? linkUrl : (/^\/\//.test(linkUrl) ? 'https:' + linkUrl : 'https://' + linkUrl.replace(/^\//, ''));
      var linkEsc = linkUrlFull.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      body = 'Link(destination: URL(string: "' + linkEsc + '")) { Text("Link") }';
    } else if (node.textContent) {
      var txt = node.textContent.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
      body = 'Text("' + txt + '")';
    } else if (node.iconSfSymbol) {
      body = 'Image(systemName: "' + node.iconSfSymbol.replace(/"/g, '\\"') + '")';
    } else {
      body = 'Rectangle().fill(Color.gray.opacity(0.25))';
    }

    var mods = [];
    if (fg && body.indexOf('Text') === 0) mods.push('.foregroundColor(' + fg.swift + ')');
    if (fs != null && body.indexOf('Text') === 0) mods.push('.font(.system(size: ' + Math.round(fs) + ', weight: ' + swiftFontWeight(fw) + '))');
    if (body.indexOf('Text') === 0) {
      var alignSwift = textAlign === 'center' ? '.center' : textAlign === 'right' ? '.trailing' : '.leading';
      mods.push('.multilineTextAlignment(' + alignSwift + ')');
    }
    if (pt !== 0 || pr !== 0 || pb !== 0 || pl !== 0) {
      if (pt === pb && pl === pr && pt === pl) mods.push('.padding(' + pt + ')');
      else mods.push('.padding(EdgeInsets(top: ' + pt + ', leading: ' + pl + ', bottom: ' + pb + ', trailing: ' + pr + '))');
    }
    if (bg) mods.push('.background(' + bg.swift + ')');
    if (radius > 0) mods.push('.clipShape(RoundedRectangle(cornerRadius: ' + radius + '))');
    var op = parseOpacity(s.opacity);
    if (op != null) mods.push('.opacity(' + op + ')');
    var shadow = parseBoxShadow(s.boxShadow);
    if (shadow) mods.push('.shadow(color: ' + shadow.color.swift + ', radius: ' + shadow.radius + ', x: ' + shadow.x + ', y: ' + shadow.y + ')');
    if ((s.overflow || '').toLowerCase() === 'hidden') mods.push('.clipped()');
    mods = mods.map(function (m) { return m.charAt(0) === '.' ? m : '.' + m; });
    var hasFixedSize = w != null || h != null;
    var needFlexFrame = minW != null || maxW != null || minH != null || maxH != null ||
      (node.children.length && isCol && s.display !== 'inline' && s.display !== 'inline-block' && maxW == null);
    var isTextOnly = body.indexOf('Text') === 0;
    if (hasFixedSize && !isTextOnly) {
      var fixedParts = [];
      if (h != null) {
        fixedParts.push('width: .infinity');
        fixedParts.push('height: ' + Math.round(h));
      } else if (w != null) {
        fixedParts.push('width: ' + Math.round(w));
        fixedParts.push('height: .infinity');
      }
      if (fixedParts.length) mods.push('.frame(' + fixedParts.join(', ') + ')');
    }
    if (needFlexFrame) {
      var flexParts = [];
      if (minW != null && minW > 0) flexParts.push('minWidth: ' + Math.round(minW));
      if (maxW != null) flexParts.push('maxWidth: ' + Math.round(maxW));
      if (node.children.length && isCol && s.display !== 'inline' && s.display !== 'inline-block' && maxW == null) flexParts.push('width: .infinity');
      if (minH != null && minH > 0) flexParts.push('minHeight: ' + Math.round(minH));
      if (maxH != null) flexParts.push('maxHeight: ' + Math.round(maxH));
      if (flexParts.length) mods.push('.frame(' + flexParts.join(', ') + ')');
    }
    if (mt !== 0 || mr !== 0 || mb !== 0 || ml !== 0) mods.push('.padding(EdgeInsets(top: ' + mt + ', leading: ' + ml + ', bottom: ' + mb + ', trailing: ' + mr + '))');

    var out = body;
    mods.forEach(function (m) { out += '\n' + pad(indent) + m; });
    return out;
  }

  function uikitFontWeight(fw) {
    var n = fw ? parseInt(fw, 10) : 400;
    if (n <= 300) return '.light';
    if (n <= 400) return '.regular';
    if (n <= 500) return '.medium';
    if (n <= 600) return '.semibold';
    if (n <= 700) return '.bold';
    return '.heavy';
  }

  function toUIKit(node, indent, idGen) {
    indent = indent || 0;
    idGen = idGen || { next: 1 };
    var viewId = idGen.next++;
    var varName = 'view' + viewId;
    var pad = function (n) { var s = ''; for (var i = 0; i < n; i++) s += '    '; return s; };
    var s = node.styles || {};
    var pt = parsePx(s.paddingTop) || 0, pr = parsePx(s.paddingRight) || 0, pb = parsePx(s.paddingBottom) || 0, pl = parsePx(s.paddingLeft) || 0;
    var bg = parseColor(s.backgroundColor);
    var fg = parseColor(s.color);
    if (fg && !bg && fg.r === 1 && fg.g === 1 && fg.b === 1) {
      var fa2 = fg.a != null ? fg.a : 1;
      fg = { r: 0, g: 0, b: 0, a: fa2, swift: "Color(red: 0, green: 0, blue: 0, opacity: " + fa2 + ")", uikit: "UIColor(red: 0, green: 0, blue: 0, alpha: " + fa2 + ")" };
    }
    var fs = parsePx(s.fontSize);
    var fw = s.fontWeight;
    var radius = parsePx(s.borderRadius) || 0;
    var w = parsePx(s.width);
    var h = parsePx(s.height);
    var textAlign = s.textAlign || 'left';

    var lines = [];
    if (node.children.length) {
      lines.push('let ' + varName + ' = UIStackView()');
      lines.push(varName + '.axis = .' + ((s.flexDirection || s.display) === 'row' ? 'horizontal' : 'vertical'));
      var alignMap = { center: '.center', 'flex-end': '.trailing', 'flex-start': '.leading' };
      lines.push(varName + '.alignment = ' + (alignMap[s.alignItems] || '.center'));
      lines.push(varName + '.distribution = .fill');
      var gap = parsePx(s.gap) || 0;
      if (gap > 0) lines.push(varName + '.spacing = ' + gap);
      node.children.forEach(function (ch) {
        var childViewId = idGen.next;
        var sub = toUIKit(ch, indent + 1, idGen);
        lines.push(sub);
        lines.push(varName + '.addArrangedSubview(view' + childViewId + ')');
      });
    } else if (node.textContent) {
      lines.push('let ' + varName + ' = UILabel()');
      lines.push(varName + '.text = "' + node.textContent.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"');
      lines.push(varName + '.numberOfLines = 0');
      if (fg) lines.push(varName + '.textColor = ' + fg.uikit);
      if (fs != null) lines.push(varName + '.font = .systemFont(ofSize: ' + Math.round(fs) + ', weight: ' + uikitFontWeight(fw) + ')');
      lines.push(varName + '.textAlignment = .' + (textAlign === 'center' ? 'center' : textAlign === 'right' ? 'right' : 'left'));
    } else if (node.iframeSrc || (node.linkHref && node.children.length === 0)) {
      var urlToShow = (node.iframeSrc || node.linkHref || '').trim();
      var urlFull = /^https?:\/\//i.test(urlToShow) ? urlToShow : (/^\/\//.test(urlToShow) ? 'https:' + urlToShow : 'https://' + urlToShow.replace(/^\//, ''));
      lines.push('let ' + varName + ' = UILabel()');
      lines.push(varName + '.text = "Open: ' + urlFull.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"');
      lines.push(varName + '.numberOfLines = 0');
    } else if (node.iconSfSymbol) {
      lines.push('let ' + varName + ' = UIImageView(image: UIImage(systemName: "' + node.iconSfSymbol.replace(/"/g, '\\"') + '"))');
    } else {
      lines.push('let ' + varName + ' = UIView()');
      lines.push(varName + '.backgroundColor = UIColor.gray.withAlphaComponent(0.25)');
    }
    if (bg) lines.push(varName + '.backgroundColor = ' + bg.uikit);
    if (radius > 0) { lines.push(varName + '.layer.cornerRadius = ' + radius); lines.push(varName + '.layer.masksToBounds = true'); }
    if (pt !== 0 || pr !== 0 || pb !== 0 || pl !== 0) lines.push(varName + '.layoutMargins = UIEdgeInsets(top: ' + pt + ', left: ' + pl + ', bottom: ' + pb + ', right: ' + pr + ')');
    if (w != null) lines.push(varName + '.widthAnchor.constraint(equalToConstant: ' + Math.round(w) + ').isActive = true');
    if (h != null) lines.push(varName + '.heightAnchor.constraint(equalToConstant: ' + Math.round(h) + ').isActive = true');
    return lines.join('\n' + pad(indent));
  }

  function buildSwiftUI(node) {
    var inner = toSwiftUI(node, 0);
    return (inner.indexOf('\n') >= 0 ? '    ' + inner.replace(/\n/g, '\n    ') : '    ' + inner);
  }

  function toSwiftUIStructureOnly(node, indent) {
    indent = indent || 0;
    var pad = function (n) { var s = ''; for (var i = 0; i < n; i++) s += '    '; return s; };
    var s = node.styles || {};
    var isRow = (s.flexDirection || s.display) === 'row' || s.flexDirection === 'row-reverse' || s.display === 'inline' || s.display === 'inline-block';
    var gap = 8;

    var body = '';
    if (node.imageSrc) {
      var src = (node.imageSrc + '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      if (/^https?:\/\//i.test(node.imageSrc) || /^\/\//.test(node.imageSrc)) body = 'AsyncImage(url: URL(string: "' + (node.imageSrc.indexOf('//') === 0 ? 'https:' + node.imageSrc : node.imageSrc).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"))';
      else body = 'Image("' + src + '")';
    } else if (node.children.length) {
      var stack = isRow ? 'HStack' : 'VStack';
      body = stack + '(alignment: .leading, spacing: ' + gap + ') {\n';
      node.children.forEach(function (ch) {
        body += pad(indent + 1) + toSwiftUIStructureOnly(ch, indent + 1) + '\n';
      });
      body += pad(indent) + '}';
    } else if (node.backgroundImageUrl) {
      var bgUrl = (node.backgroundImageUrl + '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      body = /^https?:\/\//i.test(node.backgroundImageUrl) || /^\/\//.test(node.backgroundImageUrl) ? 'AsyncImage(url: URL(string: "' + (/^\/\//.test(node.backgroundImageUrl) ? 'https:' + node.backgroundImageUrl : node.backgroundImageUrl).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"))' : 'Image("' + bgUrl + '")';
    } else if (node.textContent) {
      var txt = node.textContent.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
      body = 'Text("' + txt + '")';
    } else if (node.iconSfSymbol) {
      body = 'Image(systemName: "' + (node.iconSfSymbol + '').replace(/"/g, '\\"') + '")';
    } else if (node.linkHref && !node.textContent) {
      body = 'Link(destination: URL(string: "' + (node.linkHref + '').trim().replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '")) { Text("Link") }';
    } else if (node.tagName === 'input') {
      var ph = (node.placeholder || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      if ((node.inputType || 'text') === 'password') {
        body = 'SecureField("' + ph + '", text: $inputText)';
      } else {
        body = 'TextField("' + ph + '", text: $inputText)';
      }
    } else if (node.tagName === 'textarea') {
      var taPh = (node.placeholder || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      body = 'TextEditor(text: $inputText)\n    .frame(minHeight: 60)';
    } else if (node.tagName === 'button') {
      var btnLabel = (node.textContent || 'Button').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
      body = 'Button("' + btnLabel + '") { }';
    } else if (node.tagName === 'select' && node.selectOptions && node.selectOptions.length) {
      body = 'Picker("Select", selection: $selectedOption) {\n';
      node.selectOptions.forEach(function (opt) {
        var lab = (opt.text || opt.value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        body += pad(indent + 1) + 'Text("' + lab + '").tag("' + (opt.value || opt.text || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '")\n';
      });
      body += pad(indent) + '}';
    } else if (node.tagName === 'video' || node.tagName === 'audio') {
      if (node.mediaSrc) {
        var ms = (node.mediaSrc + '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        body = 'Link(destination: URL(string: "' + ms + '")) { Text("Play media") }';
      } else body = 'Text("Audio/Video").foregroundColor(.secondary)';
    } else if (node.tagName && node.tagName.match(/^h[1-6]$/)) {
      var headTxt = (node.textContent || 'Title').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
      var titleStyle = { h1: '.largeTitle', h2: '.title', h3: '.title2', h4: '.title3', h5: '.headline', h6: '.subheadline' }[node.tagName] || '.body';
      body = 'Text("' + headTxt + '")\n    .font(.' + titleStyle + ')';
    } else if (node.svgDataUrl) {
      var dataUrl = (node.svgDataUrl + '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      body = 'AsyncImage(url: URL(string: "' + dataUrl + '"))';
    } else {
      body = 'Rectangle().fill(Color.gray.opacity(0.25))';
    }
    return body;
  }

  function toSwiftUIStyleOnly(node) {
    var s = node.styles || {};
    var pt = parsePx(s.paddingTop) || 0, pr = parsePx(s.paddingRight) || 0, pb = parsePx(s.paddingBottom) || 0, pl = parsePx(s.paddingLeft) || 0;
    var bg = parseColor(s.backgroundColor);
    var fg = parseColor(s.color);
    if (fg && !bg && fg.r === 1 && fg.g === 1 && fg.b === 1) {
      var fa3 = fg.a != null ? fg.a : 1;
      fg = { r: 0, g: 0, b: 0, a: fa3, swift: "Color(red: 0, green: 0, blue: 0, opacity: " + fa3 + ")", uikit: "UIColor(red: 0, green: 0, blue: 0, alpha: " + fa3 + ")" };
    }
    var fs = parsePx(s.fontSize);
    var fw = s.fontWeight;
    var radius = parsePx(s.borderRadius) || 0;
    var w = parsePx(s.width);
    var h = parsePx(s.height);
    var textAlign = s.textAlign || 'left';

    var body = '';
    if (node.textContent) {
      var txt = (node.textContent + '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
      body = 'Text("' + txt + '")';
    } else if (node.imageSrc) {
      body = /^https?:\/\//i.test(node.imageSrc) || /^\/\//.test(node.imageSrc) ? 'AsyncImage(url: URL(string: "' + (node.imageSrc + '').replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"))' : 'Image("' + (node.imageSrc + '').replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '")';
    } else if (node.iconSfSymbol) {
      body = 'Image(systemName: "' + (node.iconSfSymbol + '').replace(/"/g, '\\"') + '")';
    } else {
      body = 'Rectangle().fill(Color.gray.opacity(0.25))';
    }
    var mods = [];
    if (fg && body.indexOf('Text') === 0) mods.push('.foregroundColor(' + fg.swift + ')');
    if (fs != null && body.indexOf('Text') === 0) mods.push('.font(.system(size: ' + Math.round(fs) + ', weight: ' + swiftFontWeight(fw) + '))');
    if (body.indexOf('Text') === 0) mods.push('.multilineTextAlignment(' + (textAlign === 'center' ? '.center' : textAlign === 'right' ? '.trailing' : '.leading') + ')');
    if (pt !== 0 || pr !== 0 || pb !== 0 || pl !== 0) {
      if (pt === pb && pl === pr && pt === pl) mods.push('.padding(' + pt + ')');
      else mods.push('.padding(EdgeInsets(top: ' + pt + ', leading: ' + pl + ', bottom: ' + pb + ', trailing: ' + pr + '))');
    }
    if (bg) mods.push('.background(' + bg.swift + ')');
    if (radius > 0) mods.push('.clipShape(RoundedRectangle(cornerRadius: ' + radius + '))');
    var op = parseOpacity(s.opacity);
    if (op != null) mods.push('.opacity(' + op + ')');
    var shadow = parseBoxShadow(s.boxShadow);
    if (shadow) mods.push('.shadow(color: ' + shadow.color.swift + ', radius: ' + shadow.radius + ', x: ' + shadow.x + ', y: ' + shadow.y + ')');
    if ((s.overflow || '').toLowerCase() === 'hidden') mods.push('.clipped()');
    mods = mods.map(function (m) { return m.charAt(0) === '.' ? m : '.' + m; });
    if (w != null || h != null) {
      var parts = [];
      if (w != null) parts.push('width: ' + Math.round(w));
      if (h != null) parts.push('height: ' + Math.round(h));
      mods.push('.frame(' + parts.join(', ') + ')');
    }
    var out = body;
    mods.forEach(function (m) { out += '\n    ' + m; });
    return out;
  }

  function buildSwiftUIFromHTML(node) {
    var inner = toSwiftUIStructureOnly(node, 0);
    return (inner.indexOf('\n') >= 0 ? '    ' + inner.replace(/\n/g, '\n    ') : '    ' + inner);
  }

  function buildSwiftUIFromCSS(node) {
    return toSwiftUIStyleOnly(node);
  }

  function htmlStringToSwiftUI(htmlString) {
    if (typeof htmlString !== 'string' || !htmlString.trim()) return '';
    try {
      var doc = new DOMParser().parseFromString(htmlString.trim(), 'text/html');
      var root = doc.body ? doc.body.firstElementChild : null;
      if (!root) return '';
      var node = extractNodeStructureOnly(root, 0, 6);
      if (!node) return '';
      return buildSwiftUIFromHTML(node);
    } catch (e) {
      return '';
    }
  }

  function extractNodeStructureOnly(el, depth, maxDepth) {
    if (depth > (maxDepth || 6)) return null;
    var baseUrl = (el.ownerDocument && el.ownerDocument.defaultView && el.ownerDocument.defaultView.location) ? el.ownerDocument.defaultView.location.origin : '';
    var tag = (el.tagName || '').toLowerCase();
    var text = (el.textContent || '').trim();
    var childNodes = [];
    if (el.children && el.children.length) {
      for (var i = 0; i < el.children.length; i++) {
        var c = extractNodeStructureOnly(el.children[i], depth + 1, maxDepth);
        if (c) childNodes.push(c);
      }
    }
    var hasElementChildren = childNodes.length > 0;
    var textContent = (!hasElementChildren && text) ? text.slice(0, 200) : '';
    var out = { tagName: tag, styles: {}, textContent: textContent, children: childNodes };
    if (el.getAttribute) {
      if (tag === 'img') {
        var src = el.getAttribute('src') || el.getAttribute('data-src') || el.getAttribute('srcset');
        if (src && typeof src === 'string') src = src.split(',')[0].trim().split(/\s+/)[0];
        if (src) out.imageSrc = resolveUrlWithBase(src, baseUrl);
      }
      if (tag === 'a') {
        var href = el.getAttribute('href') || '';
        if (href) out.linkHref = resolveUrlWithBase(href, baseUrl);
      }
      if (tag === 'input') {
        out.inputType = (el.getAttribute('type') || 'text').toLowerCase();
        out.placeholder = el.getAttribute('placeholder') || '';
      }
      if (tag === 'textarea') {
        out.placeholder = el.getAttribute('placeholder') || '';
      }
      if (tag !== 'img' && tag !== 'a') {
        var styleAttr = el.getAttribute('style');
        if (styleAttr && /background-image:\s*url\s*\(/i.test(styleAttr)) {
          var um = String(styleAttr).match(/url\s*\(\s*["']?([^"')]+)["']?\s*\)/);
          if (um) out.backgroundImageUrl = resolveUrlWithBase(um[1].trim(), baseUrl);
        }
      }
    }
    if (tag === 'svg' && el.outerHTML) {
      try {
        var svgStr = el.outerHTML;
        if (svgStr.length < 30000) {
          var b64 = btoa(unescape(encodeURIComponent(svgStr)));
          out.svgDataUrl = 'data:image/svg+xml;base64,' + b64;
        }
      } catch (err) {}
    }
    if (!out.imageSrc && !out.backgroundImageUrl && !out.svgDataUrl && el.getAttribute) {
      var ctx = (el.className && typeof el.className === 'string' ? el.className : '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '') + ' ' + (el.getAttribute('role') || '');
      var sym = inferIconSfSymbol(ctx);
      if (sym) out.iconSfSymbol = sym;
    }
    if (tag === 'button' && !out.textContent && el.textContent) out.textContent = (el.textContent || '').trim().slice(0, 200);
    if ((tag === 'video' || tag === 'audio') && el.getAttribute) {
      var vSrc = el.getAttribute('src') || '';
      if (vSrc) out.mediaSrc = resolveUrlWithBase(vSrc, baseUrl);
    }
    if (tag === 'select' && el.children) {
      var opts = [];
      for (var oi = 0; oi < el.children.length; oi++) {
        var opt = el.children[oi];
        if ((opt.tagName || '').toLowerCase() === 'option') opts.push({ value: opt.getAttribute && opt.getAttribute('value'), text: (opt.textContent || '').trim() });
      }
      if (opts.length) out.selectOptions = opts;
    }
    return out;
  }

  function parseCSSBlockToStyleObject(cssString) {
    var styles = {};
    if (typeof cssString !== 'string') return styles;
    var lines = cssString.split(/\n/);
    for (var i = 0; i < lines.length; i++) {
      var m = lines[i].match(/^\s*([a-zA-Z][a-zA-Z0-9-]*):\s*([^;]+);\s*$/);
      if (m) {
        var key = m[1].replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
        styles[key] = m[2].trim();
      }
    }
    return styles;
  }

  function parseOpacity(val) {
    if (val == null || val === '') return null;
    var n = parseFloat(String(val).trim());
    if (isNaN(n) || n >= 1) return null;
    return n;
  }

  function parseBoxShadow(val) {
    if (!val || val === 'none') return null;
    var m = String(val).match(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}/);
    var color = m ? parseColor(m[0]) : null;
    var num = String(val).match(/(-?[\d.]+)px/g);
    var x = 0, y = 0, radius = 4;
    if (num && num.length >= 1) x = parseFloat(num[0]) || 0;
    if (num && num.length >= 2) y = parseFloat(num[1]) || 0;
    if (num && num.length >= 3) radius = Math.max(0, parseFloat(num[2]) || 4);
    return { color: color || { swift: 'Color.gray.opacity(0.35)' }, radius: radius, x: x, y: y };
  }

  function parseTextShadow(val) {
    if (!val || val === 'none') return null;
    var m = String(val).match(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}/);
    var color = m ? parseColor(m[0]) : null;
    var num = String(val).match(/(-?[\d.]+)px/g);
    var x = 0, y = 0, radius = 0;
    if (num && num.length >= 1) x = parseFloat(num[0]) || 0;
    if (num && num.length >= 2) y = parseFloat(num[1]) || 0;
    if (num && num.length >= 3) radius = Math.max(0, parseFloat(num[2]) || 0);
    return { color: color || { swift: 'Color.black.opacity(0.3)' }, radius: radius, x: x, y: y };
  }

  function parseTransform(val) {
    if (!val || val === 'none') return null;
    var out = { translateX: 0, translateY: 0, scaleX: 1, scaleY: 1, rotateDeg: 0 };
    var translate = val.match(/translate(?:X|Y|3d)?\s*\(\s*(-?[\d.]+)(?:px)?\s*(?:,\s*(-?[\d.]+)(?:px)?)?/);
    if (translate) {
      out.translateX = parseFloat(translate[1]) || 0;
      out.translateY = translate[2] != null ? parseFloat(translate[2]) : 0;
    }
    var scale = val.match(/scale(?:X|Y|3d)?\s*\(\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+))?\)/);
    if (scale) {
      out.scaleX = parseFloat(scale[1]) || 1;
      out.scaleY = scale[2] != null ? parseFloat(scale[2]) : out.scaleX;
    }
    var rotate = val.match(/rotate(?:Z|3d)?\s*\(\s*(-?[\d.]+)(?:deg)?\s*\)/);
    if (rotate) out.rotateDeg = parseFloat(rotate[1]) || 0;
    return out;
  }

  function parseFilter(val) {
    if (!val || val === 'none') return null;
    var out = { blur: 0, brightness: 1, contrast: 1, saturation: 1, grayscale: 0 };
    var blur = val.match(/blur\s*\(\s*([\d.]+)px\s*\)/);
    if (blur) out.blur = parseFloat(blur[1]) || 0;
    var bright = val.match(/brightness\s*\(\s*([\d.]+)\s*\)/);
    if (bright) out.brightness = parseFloat(bright[1]);
    var cont = val.match(/contrast\s*\(\s*([\d.]+)\s*\)/);
    if (cont) out.contrast = parseFloat(cont[1]);
    var sat = val.match(/saturate\s*\(\s*([\d.]+)\s*\)/);
    if (sat) out.saturation = parseFloat(sat[1]);
    var gray = val.match(/grayscale\s*\(\s*([\d.]+)\s*\)/);
    if (gray) out.grayscale = parseFloat(gray[1]);
    return out;
  }

  function parseTransitionDuration(val) {
    if (!val) return null;
    var m = String(val).match(/^([\d.]+)(s|ms)$/);
    if (!m) return null;
    var n = parseFloat(m[1]);
    return m[2] === 'ms' ? n / 1000 : n;
  }

  var TIMING_KEYWORDS = ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'step-start', 'step-end'];
  function isDurationToken(t) {
    return /^[\d.]+(s|ms)$/.test(t);
  }
  function isTimingToken(t) {
    return TIMING_KEYWORDS.indexOf(t) >= 0 || /^cubic-bezier\(/.test(t) || /^steps\(/.test(t);
  }
  function isPropertyName(t) {
    if (!t || t === 'none') return false;
    if (isDurationToken(t)) return false;
    if (isTimingToken(t)) return false;
    if (/^[\d.]+$/.test(t)) return false;
    return true;
  }

  function getTransitionedProperties(s) {
    var list = [];
    var prop = (s.transitionProperty || '').trim().toLowerCase();
    if (prop && prop !== 'none') {
      list = prop.split(/\s*,\s*/).map(function (p) { return p.trim(); }).filter(Boolean);
    }
    if (list.length === 0) {
      var trans = (s.transition || '').trim();
      if (trans) {
        var parts = trans.split(/\s+/);
        for (var i = 0; i < parts.length; i++) {
          var t = parts[i];
          if (isPropertyName(t)) {
            list = [t];
            break;
          }
        }
      }
    }
    return list;
  }

  function getFirstTransitionedProperty(transitionedProps) {
    if (!transitionedProps || transitionedProps.length === 0) return null;
    return transitionedProps[0];
  }

  function shouldAnimateWidthWithIsOn(prop) {
    return prop === 'width' || prop === 'margin-right' || prop === 'marginright';
  }
  function shouldAnimateOpacityWithIsOn(prop) {
    return prop === 'opacity';
  }
  function shouldAnimateTransformWithIsOn(prop) {
    return prop === 'transform';
  }

  var MIN_ANIMATION_DURATION = 0.3;
  function hasAnimationDuration(s) {
    var d = parseTransitionDuration(s.transitionDuration) || parseTransitionDuration(s.animationDuration) || parseTransitionDuration(s.animation);
    if (d != null && d >= MIN_ANIMATION_DURATION) return true;
    var trans = (s.transition || '').trim();
    if (trans) {
      var parts = trans.split(/\s+/);
      for (var i = 0; i < parts.length; i++) {
        var t = parseTransitionDuration(parts[i]);
        if (t != null && t >= MIN_ANIMATION_DURATION) return true;
      }
    }
    return false;
  }

  var TARGET_WIDTH_PT = 393;

  function camelToDashed(camel) {
    return String(camel).replace(/([A-Z])/g, '-$1').toLowerCase();
  }
  function swiftUIModifiersFromStyles(styles, scale, opts) {
    var s = styles || {};
    if (scale == null || scale <= 0 || scale > 10) scale = 1;
    var buildPairs = opts && opts.buildPairs;
    var isImage = opts && opts.isImage;
    var viewportHeight = opts && opts.viewportHeight;
    var pairs = [];
    function addPair(cssKeys, swiftStr) {
      if (!buildPairs) return;
      var parts = [];
      for (var i = 0; i < cssKeys.length; i++) {
        var k = cssKeys[i];
        var val = s[k];
        if (val != null && val !== '') parts.push(camelToDashed(k) + ': ' + val);
      }
      if (parts.length) pairs.push({ css: parts.join('; '), swift: swiftStr });
    }
    function addPairRaw(cssStr, swiftStr) {
      if (buildPairs && cssStr) pairs.push({ css: cssStr, swift: swiftStr });
    }
    function scalePx(val, minVal) {
      var n = parsePx(val);
      if (n == null) return null;
      var v = Math.round(n * scale);
      return minVal != null ? Math.max(minVal, v) : Math.max(0, v);
    }
    function scaleFontSize(val) {
      var n = parsePx(val);
      if (n == null) return null;
      var v = n * scale;
      return Math.max(1, Math.round(v * 10) / 10);
    }
    var transitionedProps = getTransitionedProperties(s);
    var hasAnim = hasAnimationDuration(s);
    var firstProp = getFirstTransitionedProperty(transitionedProps);
    var animWidth = hasAnim && firstProp && shouldAnimateWidthWithIsOn(firstProp);
    var animOpacity = hasAnim && firstProp && shouldAnimateOpacityWithIsOn(firstProp);
    var animTransform = hasAnim && firstProp && shouldAnimateTransformWithIsOn(firstProp);
    var pt = scalePx(s.paddingTop) || 0, pr = scalePx(s.paddingRight) || 0, pb = scalePx(s.paddingBottom) || 0, pl = scalePx(s.paddingLeft) || 0;
    var mt = scalePx(s.marginTop) || 0, mr = scalePx(s.marginRight) || 0, mb = scalePx(s.marginBottom) || 0, ml = scalePx(s.marginLeft) || 0;
    var bg = parseColor(s.backgroundColor);
    var fg = parseColor(s.color);
    var fs = scaleFontSize(s.fontSize);
    var fw = s.fontWeight;
    var radius = scalePx(s.borderRadius) || 0;
    var borderW = scalePx(s.borderWidth) || 0;
    var borderC = parseColor(s.borderColor);
    var w = scalePx(s.width);
    var h = scalePx(s.height);
    var minW = scalePx(s.minWidth);
    var maxW = scalePx(s.maxWidth);
    var minH = scalePx(s.minHeight);
    var maxH = scalePx(s.maxHeight);
    var lineH = scalePx(s.lineHeight);
    var textAlign = (s.textAlign || 'left').toLowerCase();
    var op = parseOpacity(s.opacity);
    var shadow = parseBoxShadow(s.boxShadow);
    var overflow = (s.overflow || '').toLowerCase();
    var fontFamily = (s.fontFamily || '').trim().replace(/^["']|["']$/g, '');
    if (fontFamily) {
      var first = fontFamily.split(/,\s*/)[0].trim().replace(/^["']|["']$/g, '');
      if (first) fontFamily = first;
    }
    var letterSp = scalePx(s.letterSpacing);
    var transform = parseTransform(s.transform);
    if (transform && scale !== 1) {
      if (transform.translateX !== 0 || transform.translateY !== 0) {
        transform.translateX = Math.round(transform.translateX * scale);
        transform.translateY = Math.round(transform.translateY * scale);
      }
    }
    var filter = parseFilter(s.filter);
    if (filter && scale !== 1 && filter.blur > 0) filter.blur = Math.round(filter.blur * scale);
    var zi = s.zIndex != null && s.zIndex !== 'auto' ? parseInt(s.zIndex, 10) : null;
    var topPx = scalePx(s.top);
    var rightPx = scalePx(s.right);
    var bottomPx = scalePx(s.bottom);
    var leftPx = scalePx(s.left);
    var aspectRatioVal = s.aspectRatio;
    var outlineW = scalePx(s.outlineWidth);
    var outlineC = parseColor(s.outlineColor);
    var outlineOff = scalePx(s.outlineOffset);
    var visibility = (s.visibility || 'visible').toLowerCase();
    var objectFit = (s.objectFit || '').toLowerCase();
    var pointerEvents = (s.pointerEvents || 'auto').toLowerCase();
    var mixBlend = (s.mixBlendMode || 'normal').toLowerCase();
    var justifyContent = (s.justifyContent || '').toLowerCase();
    var alignItems = (s.alignItems || '').toLowerCase();
    var textDeco = (s.textDecoration || 'none').toLowerCase();
    var textDecoColor = parseColor(s.textDecorationColor);
    var textOverflow = (s.textOverflow || 'clip').toLowerCase();
    var whiteSpace = (s.whiteSpace || 'normal').toLowerCase();
    var fontStyle = (s.fontStyle || 'normal').toLowerCase();
    var borderStyle = (s.borderStyle || 'none').toLowerCase();
    var textIndentPx = scalePx(s.textIndent);
    var textShadow = parseTextShadow(s.textShadow);
    if (textShadow && scale !== 1) {
      textShadow.x = Math.round(textShadow.x * scale);
      textShadow.y = Math.round(textShadow.y * scale);
      textShadow.radius = Math.round(textShadow.radius * scale);
    }
    if (shadow && scale !== 1) {
      shadow.x = Math.round(shadow.x * scale);
      shadow.y = Math.round(shadow.y * scale);
      shadow.radius = Math.round(shadow.radius * scale);
    }
    var objectPosition = (s.objectPosition || '').toLowerCase().trim();
    var backgroundSize = (s.backgroundSize || '').toLowerCase().trim();
    var bgImageUrl = parseBackgroundImageUrl(s.backgroundImage);

    var lines = [];
    if (zi != null && !isNaN(zi)) { lines.push('.zIndex(' + zi + ')'); addPair(['zIndex'], '.zIndex(' + zi + ')'); }
    if (topPx != null || rightPx != null || bottomPx != null || leftPx != null) {
      var ox = (leftPx != null ? leftPx : (rightPx != null ? -rightPx : 0));
      var oy = (topPx != null ? topPx : (bottomPx != null ? -bottomPx : 0));
      if (ox !== 0 || oy !== 0) { lines.push('.offset(x: ' + Math.round(ox) + ', y: ' + Math.round(oy) + ')'); addPair(['top', 'right', 'bottom', 'left'], '.offset(x: ' + Math.round(ox) + ', y: ' + Math.round(oy) + ')'); }
    }
    if (aspectRatioVal && aspectRatioVal !== 'auto') {
      var ar = aspectRatioVal.match(/^([\d.]+)\s*\/\s*([\d.]+)$/);
      if (ar) { lines.push('.aspectRatio(' + parseFloat(ar[1]) + ' / ' + parseFloat(ar[2]) + ', contentMode: .fit)'); addPair(['aspectRatio'], '.aspectRatio(' + parseFloat(ar[1]) + ' / ' + parseFloat(ar[2]) + ', contentMode: .fit)'); }
      else if (/^[\d.]+$/.test(aspectRatioVal)) { lines.push('.aspectRatio(' + parseFloat(aspectRatioVal) + ', contentMode: .fit)'); addPair(['aspectRatio'], '.aspectRatio(' + parseFloat(aspectRatioVal) + ', contentMode: .fit)'); }
    }
    if (op != null) {
      if (animOpacity) { lines.push('.opacity(isOn ? ' + (op * 0.5).toFixed(2) + ' : ' + op + ')'); addPair(['opacity'], '.opacity(isOn ? ' + (op * 0.5).toFixed(2) + ' : ' + op + ')'); }
      else { lines.push('.opacity(' + op + ')'); addPair(['opacity'], '.opacity(' + op + ')'); }
    }
    if (visibility === 'hidden') { lines.push('.hidden'); addPair(['visibility'], '.hidden'); }
    if (!isImage) {
      if (fg) {
        var fgSwift = fg.swift;
        if (fg.r === 1 && fg.g === 1 && fg.b === 1 && !bg && !bgImageUrl) fgSwift = 'Color(red: 0, green: 0, blue: 0, opacity: ' + (fg.a != null ? fg.a : 1) + ')';
        lines.push('.foregroundColor(' + fgSwift + ')'); addPair(['color'], '.foregroundColor(' + fgSwift + ')');
      }
      if (fs != null) {
        var fsStr = typeof fs === 'number' && fs % 1 !== 0 ? fs.toFixed(1) : String(Math.round(fs));
        var sysLine = '.font(.system(size: ' + fsStr + ', weight: ' + swiftFontWeight(fw) + '))';
        lines.push(sysLine); addPair(['fontSize', 'fontWeight'], sysLine);
      } else if (fw != null && fw !== '') { lines.push('.fontWeight(' + swiftFontWeight(fw) + ')'); addPair(['fontWeight'], '.fontWeight(' + swiftFontWeight(fw) + ')'); }
      if (fontStyle === 'italic' || fontStyle === 'oblique') { lines.push('.italic()'); addPair(['fontStyle'], '.italic()'); }
      if (lineH != null && lineH > 0) { lines.push('.lineSpacing(' + Math.round(lineH) + ')'); addPair(['lineHeight'], '.lineSpacing(' + Math.round(lineH) + ')'); }
      if (letterSp != null) { lines.push('.tracking(' + letterSp + ')'); addPair(['letterSpacing'], '.tracking(' + letterSp + ')'); }
      if (textAlign === 'center' || textAlign === 'right') { var alignLine = '.multilineTextAlignment(' + (textAlign === 'center' ? '.center' : '.trailing') + ')'; lines.push(alignLine); addPair(['textAlign'], alignLine); }
      if (textIndentPx != null && textIndentPx > 0) { lines.push('.padding(.leading, ' + Math.round(textIndentPx) + ')'); addPair(['textIndent'], '.padding(.leading, ' + Math.round(textIndentPx) + ')'); }
      if (textDeco !== 'none') {
        if (/underline/.test(textDeco)) { var ul = textDecoColor ? '.underline(color: ' + textDecoColor.swift + ')' : '.underline()'; lines.push(ul); addPair(['textDecoration', 'textDecorationColor'], ul); }
        if (/line-through/.test(textDeco)) { var st = textDecoColor ? '.strikethrough(color: ' + textDecoColor.swift + ')' : '.strikethrough()'; lines.push(st); addPair(['textDecoration', 'textDecorationColor'], st); }
      }
      lines.push('.lineLimit(nil)'); addPairRaw('line-limit: nil', '.lineLimit(nil)');
    }
    var looksLikeText = !!(fg || fs != null || lineH != null || textAlign === 'center' || textAlign === 'right');
    if (pt !== 0 || pr !== 0 || pb !== 0 || pl !== 0) {
      if (pt === pb && pl === pr && pt === pl) { lines.push('.padding(' + pt + ')'); addPair(['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'], '.padding(' + pt + ')'); }
      else { var padLine = '.padding(EdgeInsets(top: ' + pt + ', leading: ' + pl + ', bottom: ' + pb + ', trailing: ' + pr + '))'; lines.push(padLine); addPair(['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'], padLine); }
    }
    if (animWidth && w != null) {
      var shortW = Math.max(60, Math.round(w * 0.35));
      var fullW = Math.min(Math.round(w), 400);
      var hVal = h != null ? Math.max(Math.round(h), 28) : 70;
      var frameAnim = looksLikeText ? '.frame(width: isOn ? ' + shortW + ' : ' + fullW + ', alignment: .center)' : '.frame(width: isOn ? ' + shortW + ' : ' + fullW + ', height: ' + hVal + ', alignment: .center)';
      lines.push(frameAnim); addPair(['width', 'height'], frameAnim);
      if (bg) { lines.push('.background(' + bg.swift + ')'); addPair(['backgroundColor'], '.background(' + bg.swift + ')'); }
    }
    if (bg && !(animWidth && w != null)) { lines.push('.background(' + bg.swift + ')'); addPair(['backgroundColor'], '.background(' + bg.swift + ')'); }
    if (bgImageUrl) {
      var urlEsc = bgImageUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      var bgImgView = 'AsyncImage(url: URL(string: "' + urlEsc + '"))';
      if (backgroundSize === 'cover') bgImgView += '.scaledToFill().clipped()';
      else if (backgroundSize === 'contain') bgImgView += '.scaledToFit()';
      var bgImgLine = '.background(' + bgImgView + ')';
      lines.push(bgImgLine); addPair(['backgroundImage', 'backgroundSize'], bgImgLine);
    }
    if (radius > 0) { var radLine = '.clipShape(RoundedRectangle(cornerRadius: ' + radius + '))'; lines.push(radLine); addPair(['borderRadius'], radLine); }
    if (overflow === 'hidden' || overflow === 'auto' || overflow === 'scroll') { lines.push('.clipped()'); addPair(['overflow'], '.clipped()'); }
    if (shadow) { var shLine = '.shadow(color: ' + shadow.color.swift + ', radius: ' + shadow.radius + ', x: ' + shadow.x + ', y: ' + shadow.y + ')'; lines.push(shLine); addPair(['boxShadow'], shLine); }
    if (textShadow) { var tsLine = '.shadow(color: ' + textShadow.color.swift + ', radius: ' + textShadow.radius + ', x: ' + textShadow.x + ', y: ' + textShadow.y + ')'; lines.push(tsLine); addPair(['textShadow'], tsLine); }
    if (borderW > 0 && borderC && borderStyle !== 'none') {
      var borderLine = radius > 0 ? '.overlay(RoundedRectangle(cornerRadius: ' + radius + ').stroke(' + borderC.swift + ', lineWidth: ' + borderW + '))' : '.overlay(Rectangle().stroke(' + borderC.swift + ', lineWidth: ' + borderW + '))';
      lines.push(borderLine); addPair(['borderWidth', 'borderColor', 'borderRadius'], borderLine);
    }
    if (outlineW > 0 && outlineC) {
      var or = radius > 0 ? radius : 0;
      var outLine = '.overlay(RoundedRectangle(cornerRadius: ' + or + ').stroke(' + outlineC.swift + ', lineWidth: ' + outlineW + ').padding(' + (outlineOff || 0) + '))';
      lines.push(outLine); addPair(['outlineWidth', 'outlineColor', 'outlineOffset'], outLine);
    }
    if (bgImageUrl) {
      if (objectFit === 'cover') { lines.push('.scaledToFill().clipped()'); addPair(['objectFit'], '.scaledToFill().clipped()'); }
      else if (objectFit === 'contain') { lines.push('.scaledToFit()'); addPair(['objectFit'], '.scaledToFit()'); }
      else if (objectFit === 'fill') { lines.push('.scaledToFill()'); addPair(['objectFit'], '.scaledToFill()'); }
      if (objectPosition && objectPosition !== 'initial' && objectPosition !== 'unset' && objectPosition !== 'inherit' && !isImage) {
        var ap = objectPosition.split(/\s+/);
        var alignSwift = '.center';
        if (ap.length === 1) {
          if (ap[0] === 'left') alignSwift = '.leading';
          else if (ap[0] === 'right') alignSwift = '.trailing';
          else if (ap[0] === 'top') alignSwift = '.top';
          else if (ap[0] === 'bottom') alignSwift = '.bottom';
          else if (ap[0] === 'center') alignSwift = '.center';
        } else if (ap.length >= 2) {
          var v = ap[0], h = ap[1];
          if (v === 'top' && h === 'left') alignSwift = '.topLeading';
          else if (v === 'top' && h === 'right') alignSwift = '.topTrailing';
          else if (v === 'bottom' && h === 'left') alignSwift = '.bottomLeading';
          else if (v === 'bottom' && h === 'right') alignSwift = '.bottomTrailing';
          else if (v === 'top') alignSwift = '.top';
          else if (v === 'bottom') alignSwift = '.bottom';
          else if (h === 'left') alignSwift = '.leading';
          else if (h === 'right') alignSwift = '.trailing';
        }
        var objPosLine = '.frame(width: .infinity, height: .infinity, alignment: ' + alignSwift + ')';
        lines.push(objPosLine); addPair(['objectPosition'], objPosLine);
      }
    }
    if (animWidth && w != null) {
      lines.push('.frame(width: .infinity, alignment: .leading)'); addPair(['width'], '.frame(width: .infinity, alignment: .leading)');
    } else if (w != null || h != null || minW != null || maxW != null || minH != null || maxH != null) {
      var hasSize = w != null || h != null;
      var hasMinMax = (minW != null && minW > 0) || (maxW != null) || (minH != null && minH > 0) || (maxH != null);
      var looksLikeText = !isImage && (fg || fs != null || lineH != null || textAlign === 'center' || textAlign === 'right');
      var skipHeight = looksLikeText && h != null && h < 120;
      var minWidthForText = 44;
      var skipNarrowWidth = (looksLikeText && w != null && w < minWidthForText) || (bg && looksLikeText && w != null);
      if (hasSize) {
        var sizeParts = [];
        var outH = null;
        var outW = null;
        if (viewportHeight != null && viewportHeight > 0 && w != null && h != null) {
          var rawW = parsePx(s.width);
          var rawH = parsePx(s.height);
          if (rawW != null && rawH != null && rawH > 0) {
            var imageScale = TARGET_HEIGHT_PT / viewportHeight;
            outW = Math.round(rawW * imageScale);
            outH = Math.round(rawH * imageScale);
          }
        }
        if (outH == null && outW == null) {
          outW = (w != null && !skipNarrowWidth) ? Math.round(w) : null;
          outH = (h != null && !skipHeight) ? h : null;
          if (outH == null && outW != null) outH = Math.round(outW * 0.4);
        }
        if (outH != null || outW != null) {
          if (outH != null) {
            sizeParts.push('width: .infinity');
            sizeParts.push('height: ' + outH);
          } else {
            sizeParts.push('width: ' + outW);
            sizeParts.push('height: .infinity');
          }
        }
        if (sizeParts.length > 0) {
          var frameSizeLine = '.frame(' + sizeParts.join(', ') + ')'; lines.push(frameSizeLine); addPair(['width', 'height'], frameSizeLine);
        }
      }
      if (hasMinMax) {
        var minMaxParts = [];
        if (minW != null) minMaxParts.push('minWidth: ' + Math.round(minW));
        if (maxW != null) minMaxParts.push('maxWidth: ' + Math.round(maxW));
        if (minH != null) minMaxParts.push('minHeight: ' + Math.round(minH));
        if (maxH != null) minMaxParts.push('maxHeight: ' + Math.round(maxH));
        if (minMaxParts.length > 0) { var frameMMLine = '.frame(' + minMaxParts.join(', ') + ')'; lines.push(frameMMLine); addPair(['minWidth', 'maxWidth', 'minHeight', 'maxHeight'], frameMMLine); }
      }
    }
    if ((justifyContent || alignItems) && !isImage) {
      if (justifyContent === 'center') { lines.push('.frame(width: .infinity)'); addPair(['justifyContent'], '.frame(width: .infinity)'); }
      if (justifyContent === 'flex-end' || justifyContent === 'end') { lines.push('.frame(width: .infinity, alignment: .trailing)'); addPair(['justifyContent'], '.frame(width: .infinity, alignment: .trailing)'); }
      if (alignItems === 'center') { lines.push('.frame(height: .infinity, alignment: .center)'); addPair(['alignItems'], '.frame(height: .infinity, alignment: .center)'); }
      if (alignItems === 'flex-end' || alignItems === 'end') { lines.push('.frame(alignment: .bottom)'); addPair(['alignItems'], '.frame(alignment: .bottom)'); }
    }
    if (transform && (transform.translateX !== 0 || transform.translateY !== 0 || transform.scaleX !== 1 || transform.scaleY !== 1 || transform.rotateDeg !== 0)) {
      if (transform.translateX !== 0 || transform.translateY !== 0) {
        var offLine = animTransform ? '.offset(x: isOn ? 0 : ' + transform.translateX + ', y: isOn ? 0 : ' + transform.translateY + ')' : '.offset(x: ' + transform.translateX + ', y: ' + transform.translateY + ')';
        lines.push(offLine); addPair(['transform'], offLine);
      }
      if (transform.scaleX !== 1 || transform.scaleY !== 1) {
        var scaleLine = animTransform ? '.scaleEffect(x: isOn ? 1 : ' + transform.scaleX + ', y: isOn ? 1 : ' + transform.scaleY + ')' : '.scaleEffect(x: ' + transform.scaleX + ', y: ' + transform.scaleY + ')';
        lines.push(scaleLine); addPair(['transform'], scaleLine);
      }
      if (transform.rotateDeg !== 0) {
        var rotLine = animTransform ? '.rotationEffect(.degrees(isOn ? 0 : ' + transform.rotateDeg + '))' : '.rotationEffect(.degrees(' + transform.rotateDeg + '))';
        lines.push(rotLine); addPair(['transform'], rotLine);
      }
    }
    if (filter && (filter.blur > 0 || filter.brightness !== 1 || filter.contrast !== 1 || filter.saturation !== 1 || filter.grayscale > 0)) {
      if (filter.blur > 0) { lines.push('.blur(radius: ' + filter.blur + ')'); addPair(['filter'], '.blur(radius: ' + filter.blur + ')'); }
      if (filter.brightness !== 1) { lines.push('.brightness(' + (filter.brightness - 1) + ')'); addPair(['filter'], '.brightness(' + (filter.brightness - 1) + ')'); }
      if (filter.contrast !== 1) { lines.push('.contrast(' + filter.contrast + ')'); addPair(['filter'], '.contrast(' + filter.contrast + ')'); }
      if (filter.saturation !== 1) { lines.push('.saturation(' + filter.saturation + ')'); addPair(['filter'], '.saturation(' + filter.saturation + ')'); }
      if (filter.grayscale > 0) { lines.push('.grayscale(' + filter.grayscale + ')'); addPair(['filter'], '.grayscale(' + filter.grayscale + ')'); }
    }
    if (mixBlend !== 'normal') {
      var blendMap = { multiply: 'multiply', screen: 'screen', overlay: 'overlay', darken: 'darken', lighten: 'lighten', colorDodge: 'colorDodge', colorBurn: 'colorBurn', softLight: 'softLight', hardLight: 'hardLight', difference: 'difference', exclusion: 'exclusion', hue: 'hue', saturation: 'saturation', color: 'color', luminosity: 'luminosity' };
      var blend = blendMap[mixBlend] || 'normal';
      if (blend !== 'normal') { lines.push('.blendMode(BlendMode.' + blend + ')'); addPair(['mixBlendMode'], '.blendMode(BlendMode.' + blend + ')'); }
    }
    if (pointerEvents === 'none') { lines.push('.allowsHitTesting(false)'); addPair(['pointerEvents'], '.allowsHitTesting(false)'); }
    var full = lines.join('\n');
    if (buildPairs) return { full: full, pairs: pairs };
    return full;
  }

  function swiftUIAnimationFromStyles(styles) {
    var s = styles || {};
    var dur = parseTransitionDuration(s.transitionDuration) || parseTransitionDuration(s.animationDuration) || parseTransitionDuration(s.animation);
    if (dur == null) {
      var trans = (s.transition || '').trim();
      if (trans) {
        var parts = trans.split(/\s+/);
        for (var i = 0; i < parts.length; i++) {
          var d = parseTransitionDuration(parts[i]);
          if (d != null) { dur = d; break; }
        }
      }
    }
    if (dur == null || dur < MIN_ANIMATION_DURATION) return '';
    var timing = (s.transitionTimingFunction || s.animationTimingFunction || 'ease').toLowerCase();
    var anim = '.easeInOut';
    if (/ease-in(?:-out)?\s|ease-in$/.test(timing) || timing === 'ease-in') anim = '.easeIn';
    else if (/ease-out\s|ease-out$/.test(timing) || timing === 'ease-out') anim = '.easeOut';
    else if (/linear/.test(timing)) anim = '.linear';
    return '.animation(Animation' + anim + '(duration: ' + dur + '), value: isOn)';
  }

  function cssStringToSwiftUIAnimation(cssString) {
    if (typeof cssString !== 'string' || !cssString.trim()) return '';
    try {
      var styleObj = parseCSSBlockToStyleObject(cssString);
      return swiftUIAnimationFromStyles(styleObj) || '';
    } catch (e) {
      return '';
    }
  }

  function computeScaleFromViewport(viewportWidth) {
    if (viewportWidth == null || viewportWidth <= 0) return 1;
    return Math.max(0.25, Math.min(1, TARGET_WIDTH_PT / viewportWidth));
  }

  function cssStringToSwiftUI(cssString, options) {
    if (typeof cssString !== 'string' || !cssString.trim()) return '';
    try {
      var styleObj = parseCSSBlockToStyleObject(cssString);
      var scale = 1;
      if (options && options.viewportWidth != null) scale = computeScaleFromViewport(options.viewportWidth) * 2;
      var opts = { viewportHeight: options && options.viewportHeight, isImage: options && options.isImage };
      var inner = swiftUIModifiersFromStyles(styleObj, scale, opts);
      return (typeof inner === 'object' && inner && inner.full != null) ? inner.full : (inner || '');
    } catch (e) {
      return '';
    }
  }

  function cssStringToSwiftUIPairs(cssString, options) {
    if (typeof cssString !== 'string' || !cssString.trim()) return { full: '', pairs: [] };
    try {
      var styleObj = parseCSSBlockToStyleObject(cssString);
      var scale = 1;
      if (options && options.viewportWidth != null) scale = computeScaleFromViewport(options.viewportWidth) * 2;
      var opts = { buildPairs: true, viewportHeight: options && options.viewportHeight, isImage: options && options.isImage };
      var result = swiftUIModifiersFromStyles(styleObj, scale, opts);
      if (result && result.pairs) return { full: result.full, pairs: result.pairs };
      return { full: typeof result === 'string' ? result : '', pairs: [] };
    } catch (e) {
      return { full: '', pairs: [] };
    }
  }

  function buildSwiftUIWithMode(node, mode) {
    if (mode === 'html') return buildSwiftUIFromHTML(node);
    if (mode === 'css') return buildSwiftUIFromCSS(node);
    return buildSwiftUI(node);
  }

  function buildUIKit(node) {
    var inner = toUIKit(node, 1, { next: 1 });
    return '    ' + inner.replace(/\n/g, '\n    ') + '\n    return view1';
  }

  function buildHTMLAndCSS(el) {
    if (!el || el.nodeType !== 1) return { html: '', css: '' };
    var html = el.outerHTML || '';
    if (html.length > 80000) html = html.slice(0, 80000) + '\n\n... (truncated, total ' + el.outerHTML.length + ' chars)';
    var stylePart = '';
    var inline = el.getAttribute && el.getAttribute('style');
    if (inline && String(inline).trim()) {
      stylePart = 'element.style {\n  ' + String(inline).trim().replace(/\s*;\s*/g, ';\n  ') + '\n}\n\n';
    } else {
      stylePart = 'element.style { }\n\n';
    }
    var s = el.ownerDocument.defaultView.getComputedStyle(el);
    function getVal(p) { return s.getPropertyValue(p); }
    var lines = [];
    for (var i = 0; i < DISPLAY_CSS_PROPERTIES.length; i++) {
      var name = DISPLAY_CSS_PROPERTIES[i];
      var val = s.getPropertyValue(name);
      if (cssValueWouldConvert(name, val, getVal)) lines.push('  ' + name + ': ' + val + ';');
    }
    var css = stylePart + (lines.length ? lines.join('\n') : '');
    return { html: html, css: css };
  }

  function buildSwiftUIModifiersOnly(el) {
    if (!el || el.nodeType !== 1) return '';
    var node = extractNode(el, 0, 1);
    var s = getComputedStyleMap(el);
    var pt = parsePx(s.paddingTop) || 0, pr = parsePx(s.paddingRight) || 0, pb = parsePx(s.paddingBottom) || 0, pl = parsePx(s.paddingLeft) || 0;
    var mt = parsePx(s.marginTop) || 0, mr = parsePx(s.marginRight) || 0, mb = parsePx(s.marginBottom) || 0, ml = parsePx(s.marginLeft) || 0;
    var fg = parseColor(s.color);
    var bg = parseColor(s.backgroundColor);
    if (fg && !bg && fg.r === 1 && fg.g === 1 && fg.b === 1) {
      var fa4 = fg.a != null ? fg.a : 1;
      fg = { r: 0, g: 0, b: 0, a: fa4, swift: "Color(red: 0, green: 0, blue: 0, opacity: " + fa4 + ")", uikit: "UIColor(red: 0, green: 0, blue: 0, alpha: " + fa4 + ")" };
    }
    var fs = parsePx(s.fontSize);
    var fw = s.fontWeight;
    var radius = parsePx(s.borderRadius) || 0;
    var w = parsePx(s.width);
    var h = parsePx(s.height);
    var textAlign = (s.textAlign || 'left').toLowerCase();
    var lines = [];
    if (fg) lines.push('.foregroundColor(' + fg.swift + ')');
    if (fs != null) lines.push('.font(.system(size: ' + Math.round(fs) + ', weight: ' + swiftFontWeight(fw) + '))');
    if (textAlign === 'center' || textAlign === 'right') lines.push('.multilineTextAlignment(' + (textAlign === 'center' ? '.center' : '.trailing') + ')');
    if (pt !== 0 || pr !== 0 || pb !== 0 || pl !== 0) {
      if (pt === pb && pl === pr && pt === pl) lines.push('.padding(' + pt + ')');
      else lines.push('.padding(EdgeInsets(top: ' + pt + ', leading: ' + pl + ', bottom: ' + pb + ', trailing: ' + pr + '))');
    }
    if (bg) lines.push('.background(' + bg.swift + ')');
    if (radius > 0) lines.push('.clipShape(RoundedRectangle(cornerRadius: ' + radius + '))');
    if (w != null || h != null) {
      var parts = [];
      if (h != null) {
        parts.push('width: .infinity');
        parts.push('height: ' + Math.round(h));
      } else {
        parts.push('width: ' + Math.round(w));
        parts.push('height: .infinity');
      }
      lines.push('.frame(' + parts.join(', ') + ')');
    }
    var head = '';
    if (node && node.iconSfSymbol) {
      head = 'Image(systemName: "' + (node.iconSfSymbol + '').replace(/"/g, '\\"') + '")';
    } else if (node && (node.imageSrc || node.backgroundImageUrl)) {
      var url = node.imageSrc || node.backgroundImageUrl;
      var isHttp = /^https?:\/\//i.test(url) || /^\/\//.test(url);
      var urlStr = (url + '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      if (isHttp) head = 'AsyncImage(url: URL(string: "' + (/^\/\//.test(url) ? 'https:' + url : url).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"))';
      else head = 'Image("' + urlStr + '")';
    } else if (node && node.textContent && (node.textContent + '').trim().length > 0 && !node.iconSfSymbol && !node.imageSrc && !node.backgroundImageUrl) {
      var txt = (node.textContent + '').trim().replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').slice(0, 200);
      head = 'Text("' + txt + '")';
    }
    if (lines.length === 0 && !head) return '';
    if (head) return head + '\n' + lines.join('\n');
    return lines.join('\n');
  }

  global.CSSToSwiftUI = {
    extractNode: extractNode,
    toSwiftUI: toSwiftUI,
    toUIKit: toUIKit,
    buildSwiftUI: buildSwiftUI,
    buildSwiftUIFromHTML: buildSwiftUIFromHTML,
    buildSwiftUIFromCSS: buildSwiftUIFromCSS,
    buildSwiftUIWithMode: buildSwiftUIWithMode,
    buildUIKit: buildUIKit,
    buildHTMLAndCSS: buildHTMLAndCSS,
    buildSwiftUIModifiersOnly: buildSwiftUIModifiersOnly,
    htmlStringToSwiftUI: htmlStringToSwiftUI,
    cssStringToSwiftUI: cssStringToSwiftUI,
    cssStringToSwiftUIPairs: cssStringToSwiftUIPairs,
    cssStringToSwiftUIAnimation: cssStringToSwiftUIAnimation,
    parsePx: parsePx,
    parseColor: parseColor
  };
})(typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : this);
