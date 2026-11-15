'use client';

import { useEffect, useState } from 'react';

type Props = {
  email: string;
  labels: {
    copy: string;
    copied: string;
    copyFailed: string;
    copyUnavailable: string;
  };
};

type Status = 'idle' | 'copied' | 'failed' | 'unavailable';

/** 选中邮箱文本，供手动复制 / execCommand 回退使用（只在用户手势内触发） */
function selectEmailText(): boolean {
  const node = document.getElementById('contact-email');
  if (!node) return false;
  const range = document.createRange();
  range.selectNodeContents(node);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  return true;
}

/**
 * US-018d：Copy Email。
 * 只在 hydration 后渲染按钮——无 JS 时不出现「点了没反应」的无效按钮，
 * 邮箱本身始终是静态 HTML 中可选中的真实文本（PRD 验收 5）。
 * clipboard 不可用 / 抛错时回退 execCommand，再失败就只保留手动选中路径。
 */
export default function CopyEmailButton({ email, labels }: Props) {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => setMounted(true), []);

  const fallbackCopy = (): Status => {
    try {
      const selected = selectEmailText();
      const copied =
        selected &&
        typeof document.execCommand === 'function' &&
        document.execCommand('copy');
      return copied ? 'copied' : 'unavailable';
    } catch {
      selectEmailText();
      return 'failed';
    }
  };

  const handleClick = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        setStatus(fallbackCopy());
        return;
      }
      await navigator.clipboard.writeText(email);
      setStatus('copied');
    } catch {
      setStatus(fallbackCopy());
    }
  };

  if (!mounted) {
    return <span className="contact-copy-placeholder" aria-hidden="true" />;
  }

  const message =
    status === 'copied'
      ? labels.copied
      : status === 'failed'
        ? labels.copyFailed
        : status === 'unavailable'
          ? labels.copyUnavailable
          : '';

  return (
    <span className="contact-copy-wrap">
      <button
        type="button"
        data-contact-copy
        aria-label={labels.copy}
        onClick={handleClick}
        className="contact-action"
      >
        {labels.copy}
      </button>
      <span role="status" aria-live="polite" data-contact-copy-status className="contact-copy-status">
        {message}
      </span>
    </span>
  );
}
