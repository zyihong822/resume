'use client';

import { useEffect, useRef, useState } from 'react';

const rules = [
  { id: 'accept', title: '新订单-待接单处理', stage: '新订单', tone: 'blue', trigger: '订单支付成功并进入待接单状态时提醒。', stop: '订单已接单、已取消或支付撤销后停止提醒。', content: '新订单，等待接单', action: '去接单', status: '待接单', product: '大疆 Pocket 3 云台相机套装' },
  { id: 'shipSoon', title: '订单即将超时发货提醒', stage: '临近发货期限', tone: 'orange', trigger: '下单后 48 小时为发货期限；距发货期限剩余 12 小时且仍需发货时提醒。', stop: '订单已发货、已取消、无需发货或被平台关闭后停止提醒。', content: '订单 O202611170021 即将超时发货，请及时安排发货。', action: '去处理', status: '待发货', product: '索尼 PS5 游戏机 双手柄套装' },
  { id: 'shipOverdue', title: '订单超时发货提醒', stage: '已超时', tone: 'red', trigger: '达到或超过发货截止时间，订单仍未发货时提醒；快租默认48小时，闪租按商品发货时效。', stop: '订单已发货、已取消、无需发货或被平台关闭后停止提醒。', content: '订单 O202611170021 已超时发货，请尽快安排发货。', action: '去处理', status: '超时发货', product: '索尼 PS5 游戏机 双手柄套装' },
  { id: 'completeOverdue', title: '订单超时完结提醒', stage: '已超时', tone: 'red', trigger: '用户填写归还物流单号后满 7 天，订单仍未完结时提醒。', stop: '订单已完结、归还撤销或售后关闭后停止提醒。', content: '订单 O202611170021 已超时完结，请及时处理。', action: '去处理', status: '完结中', product: 'Apple Watch Series 10' },
] as const;
type Rule = typeof rules[number];
const storageKey = 'diaoma-reminder-settings-v1';
const defaults = Object.fromEntries(rules.map(rule => [rule.id, true]));

export default function ReminderSettings() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(defaults);
  const [ready, setReady] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [preview, setPreview] = useState<Rule | null>(null);
  const [target, setTarget] = useState<Rule | null>(null);
  const previewButton = useRef<HTMLButtonElement | null>(null);
  const closeButton = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setEnabled(Object.fromEntries(rules.map(rule => [rule.id, typeof saved?.[rule.id] === 'boolean' ? saved[rule.id] : true])));
    } catch { setFeedback('暂无法读取本机配置，已使用默认设置。'); }
    setReady(true);
  }, []);
  useEffect(() => { if (preview || target) closeButton.current?.focus(); }, [preview, target]);
  function save(next: Record<string, boolean>) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setEnabled(next);
      if (preview && !next[preview.id]) setPreview(null);
      setFeedback('已保存到当前浏览器');
    } catch { setFeedback('保存失败，请检查浏览器存储设置后重试。'); }
  }
  function dismiss() {
    setPreview(null);
    setTarget(null);
    previewButton.current?.focus();
  }
  const allEnabled = rules.every(rule => enabled[rule.id]);
  return <section className="reminder-settings">
    <div className="reminder-settings-head">
      <div><h2>站内强提醒</h2><p>仅控制以下 5 类订单事件的右下角实时弹窗；微信等通知渠道请在「消息配置」中设置，互不影响。</p></div>
      <button className="ghost-button mini" disabled={!ready} onClick={() => save(Object.fromEntries(rules.map(rule => [rule.id, !allEnabled])))}>{allEnabled ? '全部关闭' : '全部开启'}</button>
    </div>
    <div className="reminder-rule-list">
      {rules.map(rule => <article className={`reminder-rule ${enabled[rule.id] ? '' : 'is-off'}`} key={rule.id}>
        <header><div><span className={`reminder-stage ${rule.tone}`}>{rule.stage}</span><h3>{rule.title}</h3></div>
          <button role="switch" aria-checked={enabled[rule.id]} aria-label={rule.title} className={`switch ${enabled[rule.id] ? 'on' : ''}`} disabled={!ready} onClick={() => save({ ...enabled, [rule.id]: !enabled[rule.id] })}><i /></button>
        </header>
        <p className="reminder-trigger">{rule.trigger}</p>
        <p className="reminder-stop">{rule.stop}</p>
        <footer><span>{enabled[rule.id] ? '右下角弹窗提醒' : '已关闭此类弹窗提醒'}</span><button className="ghost-button mini" disabled={!ready || !enabled[rule.id]} onClick={event => { previewButton.current = event.currentTarget; setTarget(null); setPreview(rule); }}>预览提醒</button></footer>
      </article>)}
    </div>
    <div className="reminder-explanation"><strong>提醒规则</strong><p>同时最多展示 1 条。关闭或“稍后处理”仅关闭本次弹窗，同一触发批次不重复展示；不改变订单和待办状态。进入新的提醒阶段后可再次提醒。</p><p>仅向有订单处理权限且在授权店铺范围内的账号提醒；“去接单 / 去处理”应定位订单号及对应状态。</p></div>
    <p className="reminder-save-status" role="status">{feedback}</p>
    {preview && <aside className="fulfillment-popup" role="dialog" aria-label={`${preview.title}预览`} onKeyDown={event => { if (event.key === 'Escape') dismiss(); }}>
      <header><strong>{preview.title}</strong><button ref={closeButton} aria-label="关闭提醒预览" onClick={dismiss}>×</button></header>
      <div className="fulfillment-popup-body"><span className="reminder-preview-label">示例预览</span><strong>O202611170021</strong><p>{preview.product}</p><p className={preview.tone === 'red' ? 'reminder-overdue' : ''}>{preview.content}</p></div>
      <footer><button className="ghost-button mini" onClick={dismiss}>稍后处理</button><button className="primary-button" onClick={() => { setTarget(preview); setPreview(null); }}>{preview.action}</button></footer>
    </aside>}
    {target && <aside className="fulfillment-popup" role="dialog" aria-label="订单定位预览" onKeyDown={event => { if (event.key === 'Escape') dismiss(); }}>
      <header><strong>订单列表 · 定位预览</strong><button ref={closeButton} aria-label="关闭订单定位预览" onClick={dismiss}>×</button></header>
      <div className="fulfillment-popup-body"><p>订单号：O202611170021</p><p>订单状态：{target.status}</p><p>正式接入后，将跳转订单列表并应用以上筛选。</p></div>
      <footer><button className="ghost-button mini" onClick={dismiss}>我知道了</button></footer>
    </aside>}
  </section>;
}
