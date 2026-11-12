'use client';

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';

export type NavLink = {
  id: string;
  label: string;
  href: string;
};

export type NavLabels = {
  main: string;
  menu: string;
  menuClose: string;
};

/** 从本地化 href 中取锚点 id：/#about → about；根路径 → 空串 */
function hashOf(href: string): string {
  return href.split('#')[1] ?? '';
}

/**
 * 玻璃质感固定导航栏：数据来自 lib/nav.ts 注册表（经 SiteNav 解析文案与 href）。
 *
 * - 点击：目标存在时交给原生锚点（CSS smooth + hash 同步）；目标不存在时拦截（PRD 验收 4）。
 * - 激活态：滚动位置计算，同一时刻只有一个导航项激活；直接写 DOM dataset / aria-current。
 * - 移动端：折叠菜单（aria-expanded / Esc / 遮罩点击关闭 + 焦点管理）。
 */
export default function NavBar({ items, labels }: { items: NavLink[]; labels: NavLabels }) {
  const rootRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>(
      'a[data-nav-item]',
    );
    if (!anchor) return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    const targetId = url.hash.replace(/^#/, '');
    if (!targetId) return;
    if (!document.getElementById(targetId)) {
      event.preventDefault();
    }
  };

  const closeMenu = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.querySelector<HTMLElement>('a')?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, closeMenu]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const update = () => {
      const doc = document.documentElement;
      const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
      // 页面过短（内容不足一屏或滚到底仍够不到 section 顶部）时，滚到底即视为最后一个模块
      const atBottom = maxScroll > 0 && window.scrollY > 0 && window.scrollY >= maxScroll - 2;

      let activeId = items[0]?.id ?? '';
      if (atBottom && items.length > 0) {
        activeId = items[items.length - 1].id;
      } else {
        // 以视口中上部（40%）作为判定线：滚动越过 section 顶部即视为当前模块
        const line = window.scrollY + window.innerHeight * 0.4;
        for (const item of items) {
          const targetId = hashOf(item.href);
          if (!targetId) continue;
          const section = document.getElementById(targetId);
          if (!section) continue;
          const top = section.getBoundingClientRect().top + window.scrollY;
          if (top <= line) activeId = item.id;
        }
      }

      if (root.dataset.navActive !== activeId) root.dataset.navActive = activeId;
      for (const link of root.querySelectorAll<HTMLAnchorElement>('a[data-nav-id]')) {
        const on = link.dataset.navId === activeId;
        const value = on ? 'true' : 'false';
        if (link.dataset.active !== value) link.dataset.active = value;
        if (on) {
          if (link.getAttribute('aria-current') !== 'true') {
            link.setAttribute('aria-current', 'true');
          }
        } else if (link.hasAttribute('aria-current')) {
          link.removeAttribute('aria-current');
        }
      }
    };

    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [items, open]);

  return (
    <>
      <header
        ref={rootRef}
        data-site-nav
        className="site-nav fixed inset-x-0 top-0 z-40"
        onClick={handleClick}
      >
        {/* 桌面端：全部导航项横排 */}
        <nav
          aria-label={labels.main}
          className="mx-auto hidden min-h-12 max-w-5xl items-center gap-6 px-6 py-3 text-sm md:flex"
        >
          {items.map((item) => (
            <a
              key={item.id}
              href={item.href}
              data-nav-item
              data-nav-id={item.id}
              className="site-nav-link font-medium tracking-wide"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* 移动端：常驻 navigation 地标（收起时至少保留菜单入口），展开后包含全部导航项 */}
        <nav aria-label={labels.main} className="md:hidden">
          <div className="flex min-h-12 items-center justify-between px-6 py-3">
            <span
              aria-hidden="true"
              className="flex items-center gap-2 text-xs font-semibold tracking-[0.25em] opacity-70"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
              PDU
            </span>
            <button
              ref={toggleRef}
              type="button"
              data-nav-toggle
              aria-label={open ? labels.menuClose : labels.menu}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => (open ? closeMenu() : setOpen(true))}
              className="site-nav-link -mr-2 inline-flex h-9 w-9 items-center justify-center rounded-full"
            >
              <span aria-hidden="true" className="block h-5 w-5">
                {open ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 7h16M4 12h16M4 17h16" />
                  </svg>
                )}
              </span>
            </button>
          </div>

          {open && (
            <div
              id="mobile-nav"
              ref={panelRef}
              className="site-nav-panel border-t border-white/10 px-6 pb-6 pt-4"
            >
              <ul className="flex flex-col gap-4 text-base">
                {items.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.href}
                      data-nav-item
                      data-nav-id={item.id}
                      onClick={closeMenu}
                      className="site-nav-link font-medium tracking-wide"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
      </header>

      {/* 遮罩放在 header 外：header 的 backdrop-filter 会成为 fixed 子元素的包含块 */}
      {open && (
        <div
          data-nav-overlay
          aria-hidden="true"
          onClick={closeMenu}
          className="fixed inset-x-0 bottom-0 top-[60px] z-30 bg-space/70 md:hidden"
        />
      )}
    </>
  );
}
