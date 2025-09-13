"use client";

function unwrap(el: Element) {
  const p = el.parentNode;
  while (el.firstChild) p?.insertBefore(el.firstChild, el);
  p?.removeChild(el);
}

export function serializeCleanHtml(html: string) {

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  doc.querySelectorAll('[data-slate-spacer]').forEach(el => el.remove());


  // 2) Xoá attr data-slate-* và data-block-id
  doc.querySelectorAll<HTMLElement>('*').forEach((el) => {
    [...el.attributes].forEach((a) => {
      if (
        a.name.startsWith('data-slate-') ||
        a.name === 'data-block-id'
      ) {
        el.removeAttribute(a.name);
      }
    });
  });


  // A) Unwrap các wrapper div thuần quanh block khác (ul/ol/table/pre/figure)
doc.querySelectorAll('div').forEach((el) => {
  const onlyChild = el.childElementCount === 1 ? el.firstElementChild as HTMLElement : null;
  if (!onlyChild) return;
  if (/^(UL|OL|TABLE|PRE|FIGURE)$/.test(onlyChild.tagName)) {
    // bỏ lớp vỏ: <div><ul>…</ul></div> -> <ul>…</ul>
    const parent = el.parentNode;
    parent?.insertBefore(onlyChild, el);
    parent?.removeChild(el);
  }
});

// B) Trong blockquote, <div>… -> <p>…
doc.querySelectorAll('blockquote > div').forEach((el) => {
  const p = doc.createElement('p');
  while (el.firstChild) p.appendChild(el.firstChild);
  el.replaceWith(p);
});

// C) Đổi div “đoạn văn” sang <p>
// - chỉ đổi nếu KHÔNG có block-level con
// - block-level phổ biến:
const BLOCK_TAGS = new Set([
  'ADDRESS','ARTICLE','ASIDE','BLOCKQUOTE','DETAILS','DIALOG','DIV','DL','DT','DD',
  'FIELDSET','FIGCAPTION','FIGURE','FOOTER','FORM','H1','H2','H3','H4','H5','H6',
  'HEADER','HR','LI','MAIN','NAV','OL','P','PRE','SECTION','TABLE','UL'
]);

doc.querySelectorAll('div').forEach((el) => {
  // bỏ qua container “đậm đặc UI” (có nhiều class util) nếu bạn muốn:
  // if ((el.className || '').match(/\b(group|relative|overflow|rounded|px-|py-)\b/)) return;

  // có bất kỳ block con nào? => không đổi
  const hasBlockChild = Array.from(el.children).some((c) => BLOCK_TAGS.has(c.tagName));
  if (hasBlockChild) return;

  // nếu chủ yếu là text/inline => đổi sang <p>
  const p = doc.createElement('p');
  // giữ lại inline class "an toàn" nếu bạn cần (hoặc bỏ hết class):
  if (el.getAttribute('class')) el.removeAttribute('class');

  while (el.firstChild) p.appendChild(el.firstChild);
  el.replaceWith(p);
});

  // 3) Bỏ class bắt đầu bằng slate-
  doc.querySelectorAll<HTMLElement>('[class]').forEach((el) => {
    const kept = (el.getAttribute('class') || '')
      .split(/\s+/)
      .filter((c) => c && !/^slate-/.test(c));
    if (kept.length) el.setAttribute('class', kept.join(' '));
    else el.removeAttribute('class');
  });

  // 4) Fix code block: gộp text lại
  doc.querySelectorAll('pre > code').forEach((code) => {
    const hasElementChild = [...code.childNodes].some((n) => n.nodeType === 1);
    if (!hasElementChild) return;
    const lines: string[] = [];
    [...code.childNodes].forEach((n) => lines.push((n.textContent || '').replace(/\r/g, '')));
    code.textContent = lines.join('\n');
  });

  // 5) Unwrap span rỗng (giữ lại a/strong/em/u/s/code/kbd)
  const KEEP = new Set(['A', 'STRONG', 'EM', 'U', 'S', 'CODE', 'KBD']);
  for (let pass = 0; pass < 3; pass++) {
    doc.querySelectorAll('span').forEach((sp) => {
      if (KEEP.has(sp.tagName)) return;
      if (sp.attributes.length === 0) unwrap(sp);
    });
  }

  // 6) Link target=_blank thêm rel
  doc.querySelectorAll('a[target="_blank"]').forEach((a) => {
    const rel = (a.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
    if (!rel.includes('noopener')) rel.push('noopener');
    if (!rel.includes('noreferrer')) rel.push('noreferrer');
    a.setAttribute('rel', rel.join(' '));
  });
  

  doc.querySelectorAll('p').forEach(p => {
    if (p.textContent.trim() === '' || p.textContent === '\uFEFF') {
      const br = doc.createElement('br');
      p.replaceWith(br);
    }
  });

  // 7) Xoá style inline (tuỳ chọn)
  //   doc.querySelectorAll<HTMLElement>('[style]').forEach((el) => el.removeAttribute('style'));

  // 8) Unwrap wrapper .slate-editor
  doc.querySelectorAll('.slate-editor').forEach((el) => unwrap(el));

  (() => {
    // duyệt tất cả <ul> (theo thứ tự tài liệu)
    const uls = Array.from(doc.querySelectorAll('ul'));
  
    for (let i = 0; i < uls.length; i++) {
      const base = uls[i];
      // tiếp tục gộp khi thẻ kế tiếp vẫn là <ul>
      let next = base.nextElementSibling;
  
      while (next && next.tagName === 'UL') {
        const nextUl = next as HTMLUListElement;
  
        // Chuyển từng <li> của nextUl sang base (đúng thứ tự)
        Array.from(nextUl.children).forEach((child) => {
          if (child.tagName === 'LI') base.appendChild(child);
        });
  
        // Xóa <ul> thừa
        const toRemove = nextUl;
        next = nextUl.nextElementSibling;
        toRemove.remove();
      }
    }
  })();
  
  return doc.body.innerHTML;
}