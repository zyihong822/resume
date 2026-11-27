'use client';

import { useEffect, useRef, useState } from 'react';

type Section = { key: string; title: string; subtitle: string; items: string[] };
type Choice = { site: boolean; wechat: boolean; popup: boolean; sms: boolean };
type Recipient = { id: string; nickname: string; account?: string };
type Config = { items: Record<string, Choice>; recipients: Recipient[]; scheme: string };
const key = 'diaoma-message-channels-store-123456-account-demo-v1';
const popupKey = 'diaoma-reminder-settings-v1';
function WechatIcon({ size = 17 }: { size?: number }) {
  return <svg className="wechat-brand-icon" width={size} height={size} viewBox="0 0 1024 1024" aria-hidden="true"><path fill="currentColor" d="M683.058 364.695c11 0 22 1.016 32.943 1.976C686.564 230.064 538.896 128 370.681 128c-188.104 0.66-342.237 127.793-342.237 289.226 0 93.068 51.379 169.827 136.725 229.256L130.72 748.43l119.796-59.368c42.918 8.395 77.37 16.79 119.742 16.79 11 0 21.46-0.48 31.914-1.442a259.168 259.168 0 0 1-10.455-71.358c0.485-148.002 128.744-268.297 291.403-268.297l-0.06-0.06z m-184.113-91.992c25.99 0 42.913 16.79 42.913 42.575 0 25.188-16.923 42.579-42.913 42.579-25.45 0-51.38-16.85-51.38-42.58 0-25.784 25.93-42.574 51.38-42.574z m-239.544 85.154c-25.384 0-51.374-16.85-51.374-42.58 0-25.784 25.99-42.574 51.374-42.574 25.45 0 42.918 16.79 42.918 42.575 0 25.188-16.924 42.579-42.918 42.579z m736.155 271.655c0-135.647-136.725-246.527-290.983-246.527-162.655 0-290.918 110.88-290.918 246.527 0 136.128 128.263 246.587 290.918 246.587 33.972 0 68.423-8.395 102.818-16.85l93.809 50.973-25.93-84.677c68.907-51.93 120.286-119.815 120.286-196.033z m-385.275-42.58c-16.923 0-34.452-16.79-34.452-34.179 0-16.79 17.529-34.18 34.452-34.18 25.99 0 42.918 16.85 42.918 34.18 0 17.39-16.928 34.18-42.918 34.18z m188.165 0c-16.984 0-33.972-16.79-33.972-34.179 0-16.79 16.927-34.18 33.972-34.18 25.93 0 42.913 16.85 42.913 34.18 0 17.39-16.983 34.18-42.913 34.18z" /></svg>;
}
function ChannelIcon({ channel }: { channel: keyof Choice }) {
  if (channel === 'wechat') return <WechatIcon />;
  if (channel === 'sms') return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.6-3.2A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8.5 11.5h.01M12.5 11.5h.01M16.5 11.5h.01" /></svg>;
  if (channel === 'site') return <svg className="message-center-brand-icon" width="17" height="17" viewBox="0 0 1024 1024" aria-hidden="true"><path d="M93.7 348.9c-15.4 0-28 12.5-28 27.9v267.7c0 15.4 12.5 28 28 28s28-12.5 28-28V376.8c-0.1-15.4-12.6-27.9-28-27.9zM657.5 111.1c-8.2-5.1-18.5-5.5-27.2-1.2l-439 219.9c-9.5 4.7-15.4 14.4-15.4 25v311.7c0 10.6 6 20.3 15.4 25l439 219.9c4 2 8.2 3 12.5 3 5.1 0 10.2-1.4 14.7-4.2 8.2-5.1 13.3-14.1 13.3-23.8V134.9c-0.1-9.7-5.1-18.7-13.3-23.8z m-42.7 730.1l-47.2-23.6V444.2c0-10.3-8.3-18.6-18.6-18.6s-18.6 8.3-18.6 18.6v354.6L231.7 649.3V372.1l298.6-149.6v117.4c0 10.3 8.3 18.6 18.6 18.6s18.6-8.3 18.6-18.6V203.8l47.2-23.6v661zM748.8 223.9c-9.8-3.2-20.3 2.1-23.5 11.9-3.2 9.8 2.1 20.3 11.9 23.5C845.9 295.1 919 396.1 919 510.7s-73.1 215.6-181.9 251.4c-9.8 3.2-15.1 13.8-11.9 23.5 2.6 7.8 9.9 12.8 17.7 12.8 1.9 0 3.9-0.3 5.8-1 124.1-40.8 207.5-156.1 207.5-286.8 0.1-130.6-83.3-245.9-207.4-286.7z" fill="currentColor"/><path d="M734.3 684.3c-9.1 4.8-12.6 16.1-7.8 25.2 3.3 6.3 9.8 9.9 16.5 9.9 2.9 0 5.9-0.7 8.7-2.2 76.9-40.6 124.7-119.8 124.7-206.6s-47.8-166-124.7-206.6c-9.1-4.8-20.4-1.3-25.2 7.8-4.8 9.1-1.3 20.4 7.8 25.2 64.7 34.2 104.8 100.7 104.8 173.6 0 73-40.2 139.5-104.8 173.7z" fill="currentColor"/></svg>;
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="1.5" /><path d="M8 20h8m-4-3v3" /></svg>;
}
function RecipientAvatar() {
  return <img src="/resume/wechat-recipient-panda.png" alt="微信接收人示例头像" />;
}
function PlatformCategoryIcon() {
  return <svg className="order-category-icon" viewBox="0 0 1024 1024" width="20" height="20" aria-hidden="true"><path fill="#505766" d="M832 403.499a21.333 21.333 0 0 0 21.333-21.334V276.736a106.24 106.24 0 0 0-106.197-106.07H276.864a106.24 106.24 0 0 0-106.197 106.07v342.528a106.24 106.24 0 0 0 106.197 106.07h470.272a106.24 106.24 0 0 0 106.197-106.07V512a21.333 21.333 0 0 0-42.666 0v107.264a63.573 63.573 0 0 1-63.531 63.403H276.864a63.573 63.573 0 0 1-63.53-63.403V276.736a63.573 63.573 0 0 1 63.53-63.403h470.272a63.573 63.573 0 0 1 63.53 63.403v105.43A21.333 21.333 0 0 0 832 403.498m-39.125 407.168h-560a21.333 21.333 0 0 0 0 42.666h560a21.333 21.333 0 0 0 0-42.666" /></svg>;
}
function ActivityCategoryIcon() {
  return <svg className="order-category-icon" viewBox="0 0 1024 1024" width="20" height="20" aria-hidden="true"><path fill="#505766" d="M914.17 1.23h-805.9C48.7 1.23 0.35 49.64 0.35 109.04v831.09c0 29.99 16.27 57.68 42.62 72.33 26.23 14.53 58.42 13.85 83.96-2.06l382.74-237.7 386.28 238.16c13.29 8.24 28.41 12.35 43.53 12.35 13.86 0 27.84-3.43 40.33-10.41 26.23-14.65 42.5-42.23 42.5-72.21V109.04c-0.23-59.4-48.69-107.81-108.14-107.81zM740.13 365.79L659 455.48l12.73 120.08c1.33 12.57-4.17 24.89-14.43 32.32s-23.72 8.83-35.3 3.69l-110.66-49.16-110.66 49.16a35.568 35.568 0 0 1-35.3-3.69 35.293 35.293 0 0 1-14.43-32.32l12.73-120.08-81.13-89.69a35.237 35.237 0 0 1-7.39-34.61c3.92-12.02 13.99-21.05 26.39-23.66l118.53-25.03 60.53-104.61c6.34-10.95 18.05-17.7 30.74-17.7 12.69 0 24.4 6.75 30.74 17.7l60.53 104.61 118.53 25.03c12.41 2.61 22.48 11.64 26.4 23.66a35.366 35.366 0 0 1-7.42 34.61z" /></svg>;
}
function StoreCategoryIcon() {
  return <svg className="order-category-icon" viewBox="0 0 1024 1024" width="20" height="20" aria-hidden="true"><path fill="#5D5D5D" d="M829.220317 124.424824l-7.074116-10.656711L211.680609 113.768113l-7.141654 9.141194C48.983109 321.498248 70.507332 442.416202 97.154225 496.860185c26.740014 54.537104 80.878029 89.831958 137.977491 89.831958l5.146207 0c72.043826-2.867304 119.953999-38.642089 145.190777-64.548108 22.793122 25.90602 65.699328 60.541865 132.855844 60.541865 70.02382 0 113.703645-37.70167 135.579885-63.877843 30.546713 24.907273 90.183975 65.721841 152.687518 65.721841 40.980343 0 76.085886-16.799618 104.681154-49.907667C1017.364371 411.082566 836.949348 136.066979 829.220317 124.424824zM874.641809 503.603773c-19.22383 22.49841-41.49916 33.236985-68.14503 33.236985-60.246129 0-122.821303-54.56064-136.7792-67.51979L669.717579 305.754682c0.023536-0.458441 0.258896-0.799202 0.258896-1.245364 0-13.252839-10.714016-23.967878-23.920806-23.967878-13.227256 0-23.919782 10.715039-23.919782 23.967878l-0.258896 0 0 177.851641c-13.063527 17.811668-46.172599 52.634778-103.552447 52.634778-64.784492 0-98.525967-44.292785-107.666138-58.367339l0-172.120103c0-13.252839-10.715039-23.967878-23.898293-23.967878-13.228279 0-23.943318 10.715039-23.943318 23.967878l0 171.250292c-11.725042 15.249309-52.070936 60.389392-124.465756 63.37233l-3.219321 0 0-0.047072c-31.933293 0-73.688279-19.585057-95.000678-63.232137-21.358447-43.540655-36.843116-141.948943 94.953605-314.397526l561.097208 0C845.996398 240.173035 940.480306 427.225221 874.641809 503.603773zM831.288418 613.83227c-13.277398 0-24.086581 10.761088-24.13263 24.037463l0 0.045025c0 0.048095 0 0.048095 0 0.095167 0 0 0 0.023536 0 0.059352l0 173.505659c0 26.693965-21.641903 48.312332-48.263214 48.312332L552.089555 859.887268c-0.022513 0-0.022513 0-0.046049 0L264.081049 859.887268c-26.623357 0-48.26526-21.618367-48.26526-48.312332l0-173.634596c-0.023536-13.323447-10.80816-24.108071-24.109094-24.108071-13.299911 0-24.084535 10.784624-24.131607 24.108071l0 178.452321c0 50.730405 41.026392 91.804892 91.664699 91.804892l504.492002 0c50.637284 0 91.662653-41.074487 91.662653-91.804892L855.394443 637.869732C855.325881 624.592334 844.562746 613.83227 831.288418 613.83227z" /></svg>;
}
function OrderCategoryIcon() {
  return <svg className="order-category-icon" viewBox="0 0 1024 1024" width="20" height="20" aria-hidden="true"><path fill="#505766" d="M768 115.2c70.016 0 126.848 56.96 126.848 126.912v495.616l0.128 0.768v90.304c0 31.104-17.024 58.944-44.288 72.64a77.44 77.44 0 0 1-81.536-7.36l-93.44-69.888a16.448 16.448 0 0 0-21.76 1.664l-87.04 86.144a78.208 78.208 0 0 1-107.264 2.56l-96.512-86.784a16.512 16.512 0 0 0-21.312-0.832l-82.88 64.192a77.376 77.376 0 0 1-81.984 8.448 80.384 80.384 0 0 1-44.928-72.96V242.176c0-69.952 56.96-126.848 126.912-126.848H768z m0 61.44H258.944c-36.096 0-65.408 29.44-65.408 65.472v584.64a19.2 19.2 0 0 0 10.496 17.728c3.456 1.728 10.24 3.648 17.28-1.92l82.944-64.192a78.08 78.08 0 0 1 100.032 3.776l96.512 86.784c6.592 5.888 16.64 5.632 22.912-0.576l87.04-86.144a77.568 77.568 0 0 1 101.76-7.168l93.44 69.76a15.808 15.808 0 0 0 17.216 1.664 19.136 19.136 0 0 0 10.368-17.664v-89.408l-0.128-0.896V242.112c0-36.096-29.376-65.408-65.408-65.408z m96.256 531.2a30.72 30.72 0 0 0-30.72 30.72v0.832l0.128 1.92c1.792 7.68 14.08-22.784 27.2-27.52l3.264-0.64c15.36 0 30.72 42.304 30.72 25.344v-0.768l-0.384-4.736a30.784 30.784 0 0 0-24.704-24.704zM383.872 323.2a30.72 30.72 0 0 1 43.456-0.768l87.36 84.48 84.672-84.16a30.72 30.72 0 0 1 43.328 43.648l-62.72 62.272h64.192a30.72 30.72 0 0 1 0 61.44H544.192v46.08h99.968a30.656 30.656 0 1 1 0 61.376H544.192v58.944a30.72 30.72 0 0 1-61.44 0v-58.944H382.848a30.72 30.72 0 0 1 0-61.44h99.904v-46.08H382.848a30.72 30.72 0 0 1 0-61.44h65.92L384.64 366.592a30.72 30.72 0 0 1-0.768-43.392z" /><path fill="#505766" d="M768 102.4c77.056 0 139.648 62.72 139.648 139.712l-0.128 493.76 0.256 2.624v90.304c0 35.904-19.712 68.224-51.328 84.096a90.24 90.24 0 0 1-94.912-8.576l-93.44-69.824c-1.664-1.28-3.52-1.088-5.12 0.448L576 921.152a91.008 91.008 0 0 1-124.8 2.944L354.56 837.312c-1.536-1.344-3.456-1.408-4.992-0.256l-82.88 64.192a90.176 90.176 0 0 1-95.424 9.856 93.184 93.184 0 0 1-52.096-84.48V242.176c0-77.056 62.72-139.648 139.712-139.648H768z m0 25.6H258.944c-62.912 0-114.112 51.2-114.112 114.112v584.576c0 26.496 14.464 49.984 37.76 61.44 22.4 10.944 48.64 8.32 68.48-7.104l82.944-64.256a29.312 29.312 0 0 1 37.76 1.536l96.448 86.784a65.408 65.408 0 0 0 89.664-2.112l87.104-86.272a29.248 29.248 0 0 1 38.4-2.752l93.44 69.824c19.968 14.912 46.016 17.28 68.096 6.208 22.976-11.52 37.248-34.88 37.248-61.184l0.064-79.04-0.64-0.704a276.736 276.736 0 0 1-8.768-12.288l-0.96-1.472c-4.48-6.208-8-9.344-5.376-9.6l-1.28 0.128a33.28 33.28 0 0 0-8.768 9.472l-8.448 12.16-1.792 2.048 0.128 79.36a31.04 31.04 0 0 1-13.44 26.688l-4.032 2.368a28.096 28.096 0 0 1-30.592-2.816l-93.44-69.824a64.768 64.768 0 0 0-85.12 6.016l-87.04 86.144a29.568 29.568 0 0 1-40.448 1.024l-96.512-86.848a65.28 65.28 0 0 0-83.648-3.072l-82.88 64.192a28.096 28.096 0 0 1-30.848 3.2 31.04 31.04 0 0 1-17.6-29.184V242.112c0-43.136 35.072-78.208 78.208-78.208H768c43.136 0 78.208 35.072 78.208 78.208v456.768l5.504-2.048a43.2 43.2 0 0 1 6.144-1.344l6.4-0.512 1.152 0.064 6.656 0.64a43.008 43.008 0 0 1 6.464 1.728l3.52 1.536V242.112c0-59.712-46.144-108.928-104.704-113.664L768 128z m0 61.44H258.944a52.736 52.736 0 0 0-52.608 52.672v584.64c0 3.52 1.408 5.312 3.328 6.272 1.408 0.64 2.304 0.64 3.84-0.576l82.88-64.192a90.88 90.88 0 0 1 116.48 4.352l96.448 86.784c1.6 1.408 3.904 1.28 5.376-0.128l87.04-86.144a90.368 90.368 0 0 1 118.4-8.32l93.44 69.76c1.536 1.152 2.496 1.152 3.84 0.512 1.92-0.96 3.328-2.752 3.328-6.208v-88.704l-0.128-1.664V242.112A52.736 52.736 0 0 0 768 189.504zM374.72 314.24a43.52 43.52 0 0 1 61.44-0.96L514.56 388.928 590.336 313.6a43.584 43.584 0 0 1 56.192-4.352l5.376 4.608a43.52 43.52 0 0 1-0.192 61.568l-40.768 40.32 33.216 0.064a43.52 43.52 0 0 1 43.008 37.12l0.512 6.4a43.52 43.52 0 0 1-43.52 43.52H556.992v20.48h87.168a43.52 43.52 0 0 1 43.008 36.992l0.512 6.4a43.52 43.52 0 0 1-43.52 43.52H556.992v46.208a43.52 43.52 0 0 1-37.12 43.072l-6.4 0.448a43.52 43.52 0 0 1-43.52-43.52v-46.144H382.848a43.52 43.52 0 0 1-43.072-37.12l-0.448-6.4a43.52 43.52 0 0 1 43.52-43.52h87.104v-20.48H382.848a43.52 43.52 0 0 1-43.072-37.12l-0.448-6.4a43.52 43.52 0 0 1 43.52-43.52h34.24l-41.408-40a43.52 43.52 0 0 1-5.504-56.064l4.48-5.504z m43.712 17.408a17.92 17.92 0 0 0-24.96 25.728l64.192 62.016 22.784 22.016H382.848a17.92 17.92 0 0 0 0 35.84h112.704v71.68H382.848a17.92 17.92 0 0 0 0 35.84h112.704v71.744a17.92 17.92 0 0 0 35.84 0V584.768h112.768a17.856 17.856 0 1 0 0-35.712H531.392v-71.68h112.768a17.92 17.92 0 0 0 0-35.84H548.928l22.016-21.888 62.72-62.336a17.92 17.92 0 0 0-25.28-25.472L523.712 416l-8.96 8.896-8.96-8.768-87.36-84.416z" /></svg>;
}
const popupRules: Record<string, { id: string; title: string; order: string; product: string; content: string; action: string; tone: string }> = {
  '新订单-待接单处理': { id: 'accept', title: '新订单-待接单处理', order: 'O26082610358412', product: '大疆 Pocket 3 云台相机套装', content: '新订单，等待接单', action: '去接单', tone: 'blue' },
  '订单即将超时发货提醒': { id: 'shipSoon', title: '订单即将超时发货提醒', order: 'O26082415300638', product: '索尼 PS5 游戏机 双手柄套装', content: '距发货超时还剩 2小时30分', action: '去发货', tone: 'orange' },
  '订单超时发货提醒': { id: 'shipOverdue', title: '订单超时发货提醒', order: 'O26082415300638', product: '索尼 PS5 游戏机 双手柄套装', content: '发货已超时 3小时18分', action: '去发货', tone: 'orange' },
  '订单超时完结提醒': { id: 'completeOverdue', title: '订单超时完结提醒', order: 'O26082316585914', product: 'Apple Watch Series 10', content: '完结已超时 11小时16分', action: '去完结', tone: 'red' },
};

const timingHints: Record<string, string> = {
  '售后订单处理通知': '赔付或代扣申请审核、平台介入处理及扣款成功后，通知对应处理结果。',
  '订单即将超时发货提醒': '距离发货截止时间不超过12小时且订单仍未发货时提醒。',
  '订单超时发货提醒': '达到发货截止时间仍未发货时提醒；快租默认48小时，闪租按商品发货时效计算。',
  '订单超时完结提醒': '用户提交归还物流单号后满7天，订单仍未完结时提醒。',
  '逾期未归还': '超过约定归还时间1天，且仍有商品未归还时提醒。',
};

export default function MessageChannelSettings({ notices, todos }: { notices: Section[]; todos: Section[] }) {
  const groups = [...notices, ...todos];
  const rows = groups.flatMap(group => group.items.map(item => ({ id: `${group.key}:${item}`, item })));
  const defaults = (): Record<string, Choice> => Object.fromEntries(rows.map(({ id, item }) => [id, { site: true, wechat: false, popup: !!popupRules[item], sms: false }]));
  const [config, setConfig] = useState<Config>({ items: defaults(), recipients: [], scheme: 'recommended' });
  const [ready, setReady] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [modal, setModal] = useState<'channels' | 'recipients' | 'bind' | 'remove' | null>(null);
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<Recipient | null>(null);
  const [preview, setPreview] = useState('');
  const [pendingChoice, setPendingChoice] = useState<{ kind: 'item'; id: string } | { kind: 'scheme'; scheme: string } | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      const popupSaved = JSON.parse(localStorage.getItem(popupKey) || '{}');
      if (saved) {
        const legacyItemIds: Record<string, string[]> = {
          'orderNotice:售后订单处理通知': ['orderNotice:商家代扣平台介入处理通知'],
          'storeNotice:放假公告审核结果': ['storeNotice:商家公告审核结果'],
          'storeNotice:Banner审核结果': ['storeNotice:商家Banner审核结果'],
          'storeNotice:违规罚单申诉结果': ['storeNotice:商家违规罚单申诉结果'],
          'activityNotice:活动通知': ['activityNotice:活动报名结果通知'],
          'platformNotice:平台公告': ['platformNotice:店铺违规'],
          'orderProcess:逾期未归还': ['orderProcess:逾期未归还订单', 'orderProcess:超出归还时间订单处理'],
          'orderProcess:用户归还商品待确认': ['orderProcess:归还商品确认'],
          'orderProcess:用户发票待上传': ['orderProcess:发票待上传', 'orderProcess:上传发票'],
          'orderProcess:用户投诉待处理': ['storeManage:用户投诉待处理'],
          'orderProcess:平台拒绝处理用户投诉': ['storeManage:平台转入投诉待处理'],
          'orderProcess:订单即将超时发货提醒': ['orderProcess:【闪租】订单即将超时发货', 'orderProcess:订单即将超时发货'],
          'orderProcess:订单超时发货提醒': ['orderProcess:【闪租】订单已超时发货', 'orderProcess:订单已超时发货'],
          'orderProcess:订单超时完结提醒': ['orderProcess:订单已超时完结'],
          'storeManage:待开通数字签名': ['storeManage:开通数字签名通知', 'storeManage:开通数字签名'],
          'storeManage:店铺信息审核不通过待修改': ['storeManage:店铺信息审核不通过待变更', 'storeManage:店铺审核待处理'],
          'storeManage:店铺违规待处理': ['storeManage:店铺违规通知', 'storeManage:处理违规罚单'],
          'orderProcess:新订单-待接单处理': ['orderProcess:订单接单处理', 'waitAccept:订单接单处理'],
          'orderProcess:逾期未归还订单': ['orderProcess:超出归还时间订单处理'],
          'orderProcess:发票待上传': ['orderProcess:上传发票'],
          'orderProcess:【闪租】订单即将超时发货': ['orderProcess:订单即将超时发货'],
          'orderProcess:【闪租】订单已超时发货': ['orderProcess:订单已超时发货'],
        };
        Object.entries(legacyItemIds).forEach(([target, sources]) => {
          if (!saved.items?.[target]) {
            const source = sources.find(sourceId => saved.items?.[sourceId]);
            if (source) saved.items[target] = saved.items[source];
          }
        });
        const recipients = Array.isArray(saved.recipients) ? saved.recipients.filter((r: Recipient) => typeof r.id === 'string' && typeof r.nickname === 'string') : saved.binding?.nickname ? [{ id: 'legacy', nickname: saved.binding.nickname }] : [];
        const changedElsewhere = rows.some(({ id, item }) => popupRules[item] && typeof saved.items?.[id]?.popup === 'boolean' && typeof popupSaved[popupRules[item].id] === 'boolean' && saved.items[id].popup !== popupSaved[popupRules[item].id]);
        setConfig({ recipients, scheme: changedElsewhere ? 'custom' : saved.scheme || 'custom', items: Object.fromEntries(rows.map(({ id, item }) => [id, { site: typeof saved.items?.[id]?.site === 'boolean' ? saved.items[id].site : true, wechat: recipients.length > 0 && id.startsWith('orderProcess:') && item !== '用户发票待上传' && saved.items?.[id]?.wechat === true, popup: popupRules[item] ? (typeof popupSaved[popupRules[item].id] === 'boolean' ? popupSaved[popupRules[item].id] : saved.items?.[id]?.popup !== false) : false, sms: saved.items?.[id]?.sms === true }])) });
      } else {
        setConfig(current => ({ ...current, items: Object.fromEntries(rows.map(({ id, item }) => [id, { ...current.items[id], popup: popupRules[item] ? popupSaved[popupRules[item].id] !== false : false, sms: false }])) }));
      }
    } catch { setFeedback('无法读取配置，请检查浏览器存储设置。'); }
    setReady(true);
  }, []);
  useEffect(() => { if (modal && !dialog.current?.open) dialog.current?.showModal(); }, [modal]);
  function save(next: Config) {
    try {
      const popup = JSON.parse(localStorage.getItem(popupKey) || '{}');
      rows.forEach(({ id, item }) => { if (popupRules[item]) popup[popupRules[item].id] = next.items[id].popup; });
      localStorage.setItem(popupKey, JSON.stringify(popup));
      localStorage.setItem(key, JSON.stringify(next));
      setConfig(next); setFeedback('设置已保存'); return true;
    } catch { setFeedback('保存失败，请检查浏览器存储设置后重试。'); return false; }
  }
  function toggle(id: string, channel: keyof Choice) {
    if (channel === 'wechat' && !config.recipients.length) { setPendingChoice({ kind: 'item', id }); setStep(1); setModal('bind'); return; }
    save({ ...config, scheme: 'custom', items: { ...config.items, [id]: { ...config.items[id], [channel]: !config.items[id][channel] } } });
  }
  function close() { dialog.current?.close(); setModal(null); setPendingChoice(null); }
  function startBind() { setStep(1); setModal('bind'); }
  function bind() {
    const recipient = { id: `${Date.now()}`, nickname: `微信接收人 ${config.recipients.length + 1}`, account: '待获取' };
    const recipients = [...config.recipients, recipient];
    let next = { ...config, recipients };
    if (pendingChoice?.kind === 'item') next = { ...next, scheme: 'custom', items: { ...next.items, [pendingChoice.id]: { ...next.items[pendingChoice.id], wechat: true } } };
    if (pendingChoice?.kind === 'scheme') {
      const scheme = pendingChoice.scheme;
      next = { ...next, scheme, items: Object.fromEntries(rows.map(({ id, item }) => [id, { site: true, wechat: id.startsWith('orderProcess:') && item !== '用户发票待上传' && (scheme === 'all' || (scheme === 'recommended' && !!popupRules[item])), popup: scheme !== 'box' && !!popupRules[item], sms: false }])) };
    }
    if (save(next)) { setFeedback('微信接收人已关联'); setPendingChoice(null); setModal('recipients'); }
  }
  function block(sections: Section[], kind: string, title: string) {
    return <section className={`scheme-block scheme-block-${kind}`}><div className="scheme-block-heading"><div><h2>{title}</h2><p>{kind === 'message' ? '查看平台与店铺相关的消息通知' : '跟进需要处理的订单与店铺事项'}</p></div></div>{sections.map(group => {
      const isOpen = open[group.key] !== false;
      return <section className="scheme-group" key={group.key}><button className="scheme-group-head" aria-expanded={isOpen} onClick={() => setOpen({ ...open, [group.key]: !isOpen })}><span className="scheme-group-title">{(group.key === "orderNotice" || group.key === "orderProcess") && <OrderCategoryIcon />}{(group.key === "storeNotice" || group.key === "storeManage") && <StoreCategoryIcon />}{group.key === "activityNotice" && <ActivityCategoryIcon />}{group.key === "platformNotice" && <PlatformCategoryIcon />}<strong>{group.title}</strong><small>{group.subtitle}</small></span><span className="scheme-group-chevron" aria-hidden="true">{isOpen ? '⌃' : '⌄'}</span></button>
        {isOpen && <div className="scheme-items">{group.items.map(item => {
          const id = `${group.key}:${item}`;
          const row = config.items[id];
          const rule = popupRules[item];
          const channels = ['site', ...(group.key === 'orderProcess' && item !== '用户发票待上传' ? ['wechat'] : []), ...(rule ? ['popup'] : [])] as (keyof Choice)[];
          const channelLabel = (channel: keyof Choice) => channel === 'site' ? '消息中心' : channel === 'wechat' ? '微信公众号' : channel === 'popup' ? 'PC端弹窗' : '短信通知';
          return <div className="scheme-row" key={id}><div className="scheme-row-label"><strong>{item}</strong>{rule && <button className="preview-link" onClick={() => setPreview(item)}>预览弹窗</button>}</div>{timingHints[item] && <p className="timing-hint">{timingHints[item]}</p>}<div className="scheme-channels"><span className="scheme-channels-label">通知渠道</span><div className="scheme-chips">{channels.map(channel => <button key={channel} type="button" disabled={!ready} aria-pressed={!!row?.[channel]} aria-label={`${item} ${channelLabel(channel)}`} className={`scheme-chip ${row?.[channel] ? 'selected' : ''}`} onClick={() => toggle(id, channel)}><span className="channel-check" aria-hidden="true">{row?.[channel] ? "✓" : ""}</span><ChannelIcon channel={channel} />{channelLabel(channel)}</button>)}</div></div></div>;
        })}</div>}
      </section>;
    })}</section>;
  }
  return <div className="channel-config scheme-page">
    <div className="subscription-header"><h1>系统订阅配置</h1><button className="primary-button wechat-entry" onClick={() => setModal('channels')}>通知渠道设置</button></div>
    {ready && !config.recipients.length && <div className="subscription-binding-warning"><span>请先绑定微信接收人，绑定后可选择微信公众号通知渠道。</span><button onClick={() => setModal('recipients')}>去绑定</button></div>}
    {feedback && (feedback.includes('失败') || feedback.includes('无法读取')) && <p className="scheme-feedback" role="alert">{feedback}</p>}
    <div className="settings-columns channel-columns">{block(notices, 'message', '消息通知')}{block(todos, 'todo', '待办中心')}</div>
    <dialog className="wechat-dialog" ref={dialog} aria-labelledby="wechat-dialog-title" onCancel={close} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <header><h2 id="wechat-dialog-title">{modal === 'channels' ? '通知渠道设置' : modal === 'recipients' ? '微信接收人' : modal === 'bind' ? '绑定微信接收人' : '解除微信接收人'}</h2><button className="wechat-close" aria-label="关闭弹窗" onClick={close}>×</button></header>
      {modal === 'channels' && <><div className="wechat-dialog-body"><div className="channel-binding-row"><div className="recipient-avatar" aria-hidden="true"><WechatIcon size={25} /></div><div className="recipient-name"><strong>微信公众号</strong><small>{config.recipients.length ? `已绑定 ${config.recipients.length} 位接收人` : '未绑定接收人，绑定后可通过公众号接收通知'}</small></div><button className="ghost-button mini" onClick={() => setModal('recipients')}>{config.recipients.length ? '管理接收人' : '去绑定'}</button></div><p className="channel-binding-hint">各事项的通知渠道可在系统订阅配置中选择。</p></div><footer><button className="ghost-button" onClick={close}>关闭</button></footer></>}
      {modal === 'recipients' && <><div className="wechat-dialog-body">{config.recipients.length ? <div className="recipient-list">{config.recipients.map(person => <div className="recipient-row" key={person.id}><div className="recipient-avatar recipient-person-avatar"><RecipientAvatar /></div><div className="recipient-name"><strong>微信昵称：{person.nickname}</strong><small>微信账号：{person.account || '待获取'}</small></div><button onClick={() => { setSelected(person); setModal('remove'); }}>解除</button></div>)}</div> : <><div className="wechat-empty"><span><WechatIcon size={25} /></span><div><strong>未绑定 <em>需要绑定</em></strong><p>绑定后，订单事项不用打开后台也能收到</p></div></div><div className="wechat-step-hint">1　关注公众号</div><div className="wechat-step-hint">2　关联微信接收人</div></>}</div><footer><button className="ghost-button" onClick={() => setModal('channels')}>返回</button><button className="primary-button" onClick={() => startBind()}>{config.recipients.length ? '新增接收人' : '去绑定'}</button></footer></>}
      {modal === 'bind' && <><div className="wechat-steps"><span className={step === 1 ? 'active' : 'done'}>{step === 1 ? '1' : '✓'} 关注公众号</span><span className={step === 2 ? 'active' : ''}>2 关联微信接收人</span></div><div className="wechat-dialog-body"><div className="wechat-bind-content"><div className="wechat-qr-placeholder"><strong>二维码</strong><span>待配置</span></div><div className="wechat-bind-copy"><strong>{step === 1 ? '用微信扫码，关注「雕马快租」公众号' : '用微信扫码，设为接收人'}</strong><p>{step === 1 ? '关注公众号后，提醒才能发送到你的微信。' : '扫码后将微信接收人关联至当前店铺。'}</p></div></div></div><footer>{step === 1 ? <><button className="ghost-button" onClick={() => setModal('recipients')}>返回</button><button className="primary-button" onClick={() => setStep(2)}>我已关注，下一步</button></> : <><button className="ghost-button" onClick={() => setStep(1)}>上一步</button><button className="primary-button" onClick={bind}>我已扫码</button></>}</footer></>}
      {modal === 'remove' && <><div className="wechat-dialog-body"><p>确认解除「{selected?.nickname}」与本店铺的关联？</p><p>解除后该微信不再接收通知，其他接收人和通知配置不受影响。</p></div><footer><button className="ghost-button" onClick={() => setModal('recipients')}>暂不解除</button><button className="primary-button" onClick={() => { if (save({ ...config, recipients: config.recipients.filter(r => r.id !== selected?.id) })) setModal('recipients'); }}>确认解除</button></footer></>}
    </dialog>
    {preview && popupRules[preview] && <aside className="fulfillment-popup pc-reminder-preview" role="dialog" aria-label={`${popupRules[preview].title}预览`} onKeyDown={event => { if (event.key === 'Escape') setPreview(''); }}>
      <header><div><span className={`pc-reminder-icon ${popupRules[preview].tone}`} aria-hidden="true">{popupRules[preview].tone === 'blue' ? '✦' : '!'}</span><strong>{popupRules[preview].title}</strong></div><button aria-label="关闭PC端弹窗预览" onClick={() => setPreview('')}>×</button></header>
      <div className="fulfillment-popup-body"><strong>{popupRules[preview].order}</strong><p>{popupRules[preview].product}</p><p>{popupRules[preview].content}</p></div>
      <footer><button className="ghost-button" onClick={() => setPreview('')}>稍后处理</button><button className="pc-reminder-action" onClick={() => { setPreview(''); setFeedback(`前往订单列表：${popupRules[preview].order}`); }}>{popupRules[preview].action}</button></footer>
    </aside>}
  </div>;
}
