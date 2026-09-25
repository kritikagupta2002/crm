"""Builds src/hrms/hrms.css, the HRMS module's stylesheet, from the module's own CSS files.

Every rule is scoped to .hrms (the wrapper around the HRMS and Finance pages), so the module's styles never reach
the CRM's pages; dark mode is dropped (the app has one light design); keyframes are prefixed hr- so they can't
replace the CRM's. The copy of the CRM theme inside utilities.css is left out: the CRM's real classes (.card,
.btn, .pill) apply inside the module too.

Run from the repo root after changing any CSS under src/hrms:
    python scripts/build-hrms-css.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HRMS = ROOT / 'src' / 'hrms'
CRM_CSS = ROOT / 'src' / 'index.css'
OUT = HRMS / 'hrms.css'
MODULES = ['dashboard', 'leave', 'attendance', 'employees', 'payroll', 'finance', 'expenses', 'reports', 'settings', 'documents', 'shifts']
INPUTS = [HRMS / 'index.css', HRMS / 'styles' / 'utilities.css'] + [HRMS / 'modules' / m / 'styles' / f'{m}.css' for m in MODULES]

SCOPE = '.hrms'
PREFIX = 'hr-'


def skip_string(css, i):
    q, j, n = css[i], i + 1, len(css)
    while j < n and css[j] != q:
        j += 2 if css[j] == '\\' else 1
    return j + 1


def strip_comments(css):
    out, i, n = [], 0, len(css)
    while i < n:
        c = css[i]
        if c in '"\'':
            j = skip_string(css, i)
            out.append(css[i:j])
            i = j
        elif css.startswith('/*', i):
            j = css.find('*/', i + 2)
            i = n if j < 0 else j + 2
        else:
            out.append(c)
            i += 1
    return ''.join(out)


def read_until(css, i, stops):
    """Index of the first stop character at depth 0 (parentheses, brackets and strings respected)."""
    depth, n = 0, len(css)
    while i < n:
        c = css[i]
        if c in '"\'':
            i = skip_string(css, i)
            continue
        if c == '\\':
            i += 2
            continue
        if c in '([':
            depth += 1
        elif c in ')]':
            depth -= 1
        elif depth == 0 and c in stops:
            return i
        i += 1
    return n


def matching_brace(css, i):
    depth, n = 0, len(css)
    while i < n:
        c = css[i]
        if c in '"\'':
            i = skip_string(css, i)
            continue
        if c == '\\':
            i += 2
            continue
        if c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return n


def blocks(css):
    """Top-level (prelude, body) pairs; body is None for statements ending in ';'."""
    i, n = 0, len(css)
    while i < n:
        while i < n and css[i].isspace():
            i += 1
        if i >= n:
            return
        j = read_until(css, i, '{;')
        if j >= n:
            return
        prelude = css[i:j].strip()
        if css[j] == ';':
            yield prelude, None
            i = j + 1
            continue
        k = matching_brace(css, j)
        yield prelude, css[j + 1:k]
        i = k + 1


def split_selectors(sel):
    parts, i, start = [], 0, 0
    while True:
        j = read_until(sel, i, ',')
        parts.append(sel[start:j].strip())
        if j >= len(sel):
            return [p for p in parts if p]
        i = start = j + 1


DARK = re.compile(r'\.dark(?![\w\\-])')
PAGE_ROOT = re.compile(r'^(:root|html|body)(?![\w-])(\s+(html|body)(?![\w-]))?')


def scope_selector(sel):
    if DARK.search(sel):
        return None
    m = PAGE_ROOT.match(sel)
    if m:
        return SCOPE + sel[m.end():]
    # Element resets (Tailwind preflight) must not outrank the CRM's own classes (.btn, .card) used inside the
    # module, so they are scoped without adding specificity. Class-based utilities keep the .hrms weight.
    if '.' not in sel:
        return f':where({SCOPE}) {sel}'
    return f'{SCOPE} {sel}'


def rename_animations(body, names):
    def fix(m):
        value = m.group(2)
        for name in names:
            value = re.sub(r'(?<![\w-])' + re.escape(name) + r'(?![\w-])', PREFIX + name, value)
        return m.group(1) + ':' + value
    return re.sub(r'((?:-webkit-)?animation(?:-name)?)\s*:([^;}]*)', fix, body)


WRAPPER_PROPS = re.compile(r'(?<![\w-])(overflow(-[xy])?|max-width|min-height|height|width|margin|background(-color)?|scroll-behavior)\s*:[^;}]*;?')


def crm_classes():
    """Class names the CRM's own stylesheets define; the module must not restyle them."""
    found = set()
    for p in (ROOT / 'src').rglob('*.css'):
        if HRMS in p.parents:
            continue
        found |= set(re.findall(r'\.([a-zA-Z][\w-]*)', strip_comments(p.read_text(encoding='utf-8'))))
    return found


CRM_CLASSES = crm_classes()


def restyles_crm(sel):
    # Whole class names only; Tailwind's escaped ones (.hover\:bg-x) are the module's own.
    classes = re.findall(r'\.([a-zA-Z][\w-]*)(?![\\\w-])', sel)
    return bool(classes) and all(c in CRM_CLASSES for c in classes)


# Base typography that fights the CRM's: its card and stat headings are sans-serif, only page titles are serif.
DROP_RULES = {'h1, h2, h3'}


def transform(css, names):
    out = []
    for prelude, body in blocks(css):
        low = prelude.lower()
        if ' '.join(prelude.split()) in DROP_RULES:
            continue
        if body is None:
            if not low.startswith('@import'):
                out.append(prelude + ';')
            continue
        if low.startswith('@media') and 'prefers-color-scheme' in low and 'dark' in low:
            continue
        if low.startswith(('@media', '@supports', '@container', '@layer')):
            inner = transform(body, names)
            if inner.strip():
                out.append(prelude + '{' + inner + '}')
        elif re.match(r'@(-webkit-)?keyframes', low):
            head, name = prelude.rsplit(None, 1)
            out.append(f'{head} {PREFIX}{name}{{{body}}}')
        elif low.startswith('@'):
            out.append(prelude + '{' + body + '}')
        else:
            # A rule for one of the CRM's classes (.tone-info) is the module's copy of the CRM theme: the CRM's wins.
            sels = list(dict.fromkeys(s for s in (scope_selector(s) for s in split_selectors(prelude) if not restyles_crm(s)) if s))
            if sels and all(s in (SCOPE, SCOPE + ' #root') for s in sels):
                # What was html/body: the wrapper keeps the type settings, not page sizing, scrolling or background.
                sels = [SCOPE]
                body = WRAPPER_PROPS.sub('', body)
                if not body.strip():
                    continue
            if sels:
                out.append(','.join(sels) + '{' + rename_animations(body, names) + '}')
    return '\n'.join(out)


KEEP_FROM_INDEX = re.compile(r'^\.(animate-|custom-|crm-btn-|card-crm|card-premium|enterprise-table-|badge-gold|badge-slate)')


def trim_source(path, css, crm_vars):
    """Only the module's own styles: the Tailwind build (not the copy of the CRM theme before it in utilities.css);
    from index.css the module's own classes and the design tokens the CRM doesn't define."""
    if path.name == 'utilities.css':
        return css[css.index('*, ::before, ::after {'):]
    if path.name == 'index.css':
        out = []
        for prelude, body in blocks(css):
            if body is None:
                continue
            if prelude == ':root':
                own = [(a, b) for a, b in re.findall(r'(--[\w-]+)\s*:([^;]*);', body) if a not in crm_vars]
                if own:
                    out.append(':root{' + ''.join(f'{a}:{b};' for a, b in own) + '}')
            elif KEEP_FROM_INDEX.match(prelude):
                out.append(prelude + '{' + body + '}')
        return '\n'.join(out)
    return css


def main():
    crm_vars = set(re.findall(r'(--[\w-]+)\s*:', CRM_CSS.read_text(encoding='utf-8')))
    sources = [trim_source(p, strip_comments(p.read_text(encoding='utf-8')), crm_vars) for p in INPUTS]
    names = sorted({m.group(2) for s in sources for m in re.finditer(r'@(-webkit-)?keyframes\s+([\w-]+)', s)}, key=len, reverse=True)
    parts = ['/* ' + p.relative_to(HRMS).as_posix() + ' */\n' + transform(s, names) for p, s in zip(INPUTS, sources)]
    header = '/* Built by scripts/build-hrms-css.py from the CSS under src/hrms: scoped to .hrms, no dark mode, keyframes prefixed hr-. Do not edit by hand. */\n'
    OUT.write_text(header + '\n'.join(parts) + '\n', encoding='utf-8', newline='\n')
    print(f'{OUT.relative_to(ROOT)}: {OUT.stat().st_size // 1024} KB, keyframes {names}')


main()
