'use client';

import { notificationExamples } from './notification-catalog';

import { useEffect, useMemo, useState } from 'react';
import MessageChannelSettings from './message-channel-settings';
import { todoTitles, getTodoExample } from './todo-catalog';

/** 数量封顶展示：超过 99 条仅展示 99+ */
const fmtCount = (n: number) => (n > 99 ? '99+' : String(n));

type Category = '订单' | '店铺' | '活动通知' | '平台公告';
type PageView = 'message' | 'todo' | 'settings';
type MessageTab = '全部消息' | Category;
type TodoPanelCategory = '订单' | '店铺';
type TodoStatusTab = 'all' | 'pending' | 'closed' | 'completed';
type TodoNav = '全部' | TodoPanelCategory;
type TodoCreatedFilter = '7d' | '30d' | 'all';
type TodoTypeFilter = '全部' | string;
type MessageTypeFilter = '全部' | string;
type SettingsTab = 'message' | 'strong';
type NotificationGroupKey = 'orderNotice' | 'storeNotice' | 'activityNotice' | 'platformNotice';
type TodoGroupKey = 'waitAccept' | 'orderProcess' | 'storeManage';

type MessageItem = {
  id: string;
  category: Category;
  title: string;
  content: string;
  time: string;
  unread: boolean;
  age: number;
  route?: string;
  params?: string;
  actionLabel?: string;
  detailType: 'action' | 'announcement';
};

type TodoItem = {
  id: string;
  category: TodoPanelCategory;
  filterType: string;
  title: string;
  content: string;
  time: string;
  createdAt?: number;
  age: number;
  state: 'pending' | 'closed' | 'completed';
  count?: number;
  route: string;
  params: string;
  actionLabel: string;
  completeWhen: string;
};

type ActionSource = { kind: 'message'; id: string } | { kind: 'todo'; id: string } | null;
type BulkActionState =
  | { kind: 'message'; category: MessageTab }
  | { kind: 'todo'; category: TodoPanelCategory }
  | null;

type SettingSectionKey = NotificationGroupKey | TodoGroupKey;

type SettingSection<K extends SettingSectionKey = SettingSectionKey> = {
  key: K;
  icon: string;
  title: string;
  subtitle: string;
  items: string[];
};

const messageCategories: Category[] = ['订单', '店铺', '活动通知', '平台公告'];
const messageTabs: MessageTab[] = ['全部消息', ...messageCategories];
const todoPanelCategories: TodoPanelCategory[] = ['订单', '店铺'];
const closeReasons = ['无需处理，已线下解决', '关注优先级较低', '其他原因'];
const dayMs = 24 * 60 * 60 * 1000;
const orderMessageTypeOptions = [
  '用户催发货通知',
  '售后订单处理通知',
  '订单取消通知', '预授权解约商家通知', '用户投诉平台介入处理结果', '用户投诉转平台处理结果',
];
const storeMessageTypeOptions = [
  '放假公告审核结果',
  'Banner审核结果',
  '违规罚单申诉结果',
];

const allMessageTypes = [...orderMessageTypeOptions, ...storeMessageTypeOptions, '活动通知', '平台公告'];

function getMessageTypeOptionsForTab(tab: MessageTab): MessageTypeFilter[] {
  switch (tab) {
    case '订单':
      return ['全部', ...orderMessageTypeOptions];
    case '店铺':
      return ['全部', ...storeMessageTypeOptions];
    case '活动通知':
      return ['全部', '活动通知'];
    case '平台公告':
      return ['全部', '平台公告'];
    default:
      return ['全部', ...orderMessageTypeOptions, ...storeMessageTypeOptions, '活动通知', '平台公告'];
  }
}

const todoTypeOptions: Record<TodoPanelCategory, string[]> = todoTitles;
const todoTypeEntries = todoPanelCategories.flatMap((category) =>
  todoTypeOptions[category].map((filterType) => ({ category, filterType })),
);

const messageSeedCount = 32;
const todoSeedCount = 26;

const notificationSections: SettingSection<NotificationGroupKey>[] = [
  {
    key: 'orderNotice',
    icon: '◫',
    title: '订单通知',
    subtitle: '订单全流程及售后相关提醒',
    items: ['用户催发货通知', '售后订单处理通知', '订单取消通知', '预授权解约商家通知', '用户投诉平台介入处理结果', '用户投诉转平台处理结果'],
  },
  {
    key: 'storeNotice',
    icon: '▣',
    title: '店铺通知',
    subtitle: '店铺审核、投诉、违规及经营风险提醒',
    items: ['放假公告审核结果', 'Banner审核结果', '违规罚单申诉结果'],
  },
  {
    key: 'activityNotice',
    icon: '◇',
    title: '活动通知',
    subtitle: '平台活动报名及结果相关提醒',
    items: ['活动通知'],
  },
  {
    key: 'platformNotice',
    icon: '◉',
    title: '平台通知',
    subtitle: '平台规则、违规及重要经营通知',
    items: ['平台公告'],
  },
];

const todoSections: SettingSection<TodoGroupKey>[] = [
  {
    key: 'orderProcess',
    icon: '▤',
    title: '订单处理',
    subtitle: '订单履约过程中需要商家处理的事项',
    items: todoTitles.订单,
  },
  {
    key: 'storeManage',
    icon: '⚙',
    title: '店铺管理',
    subtitle: '店铺运营及审核过程中需要处理的事项',
    items: todoTitles.店铺,
  },
];

const defaultNotificationState = Object.fromEntries(
  notificationSections.flatMap((section) => section.items.map((item) => [item, true])),
) as Record<string, boolean>;

const defaultTodoReminderState = Object.fromEntries(
  todoSections.flatMap((section) => section.items.map((item) => [item, true])),
) as Record<string, boolean>;

export default function Home() {
  const [view, setView] = useState<PageView>('message');
  const [panel, setPanel] = useState<'message' | 'todo' | null>(null);
  const [messagePanelCategory, setMessagePanelCategory] = useState<Category>('订单');
  const [messagePanelUnreadOnly, setMessagePanelUnreadOnly] = useState(false);
  const [todoPanelCategory, setTodoPanelCategory] = useState<TodoPanelCategory>('订单');
  const [messageTab, setMessageTab] = useState<MessageTab>('全部消息');
  const [messageTypeFilter, setMessageTypeFilter] = useState<MessageTypeFilter>('全部');
  const [messageUnreadOnly, setMessageUnreadOnly] = useState(false);
  const [todoStatus, setTodoStatus] = useState<TodoStatusTab>('pending');
  const [todoNav, setTodoNav] = useState<TodoNav>('全部');
  const [todoTypeFilter, setTodoTypeFilter] = useState<TodoTypeFilter>('全部');
  const [todoCreatedFilter, setTodoCreatedFilter] = useState<TodoCreatedFilter>('7d');
  const [messagePage, setMessagePage] = useState(1);
  const [todoPage, setTodoPage] = useState(1);
  const [messagePageSize, setMessagePageSize] = useState(10);
  const [todoPageSize, setTodoPageSize] = useState(10);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('message');
  const [openNoticeSections, setOpenNoticeSections] = useState<Record<NotificationGroupKey, boolean>>({
    orderNotice: true,
    storeNotice: true,
    activityNotice: true,
    platformNotice: true,
  });
  const [openTodoSections, setOpenTodoSections] = useState<Record<TodoGroupKey, boolean>>({
    waitAccept: true,
    orderProcess: true,
    storeManage: true,
  });
  const [notificationSettings, setNotificationSettings] = useState(defaultNotificationState);
  const [todoReminderSettings, setTodoReminderSettings] = useState(defaultTodoReminderState);
  const [strongReminder, setStrongReminder] = useState(true);
  const [strongReminderMinutes, setStrongReminderMinutes] = useState('3');
  const [actionSource, setActionSource] = useState<ActionSource>(null);
  const [bulkAction, setBulkAction] = useState<BulkActionState>(null);
  const [announcementId, setAnnouncementId] = useState<string | null>(null);
  const [closeTarget, setCloseTarget] = useState<string | null>(null);
  const [closeReason, setCloseReason] = useState(closeReasons[0]);
  const [toast, setToast] = useState('');
  const [now, setNow] = useState(() => Date.now());

  const messages = useMemo(() => buildMessageDataset(messageSeedCount), []);
  const todos = useMemo(() => buildTodoDataset(todoSeedCount), []);

  const [messageState, setMessageState] = useState(messages);
  const [todoStateList, setTodoStateList] = useState(todos);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const messageTopCount = messageState.filter((item) => item.unread).length;
  const todoTopCount = todoStateList
    .filter((item) => item.state === 'pending')
    .reduce((sum, item) => sum + (item.count || 1), 0);

  const filteredMessages = useMemo(() => {
    return messageState.filter((item) => {
      const tabMatch = messageTab === '全部消息' || item.category === messageTab;
      const unreadMatch = !messageUnreadOnly || item.unread;
      return tabMatch && unreadMatch;
    });
  }, [messageState, messageTab, messageUnreadOnly]);

  const messagePageCount = Math.max(1, Math.ceil(filteredMessages.length / messagePageSize));
  const safeMessagePage = Math.min(messagePage, messagePageCount);
  const pagedMessages = filteredMessages.slice((safeMessagePage - 1) * messagePageSize, safeMessagePage * messagePageSize);

  const filteredTodos = useMemo(() => {
    return todoStateList.filter((item) => {
      const navMatch = todoNav === '全部' || item.category === todoNav;
      const typeMatch = todoTypeFilter === '全部' || item.filterType === todoTypeFilter;
      const statusMatch =
        todoStatus === 'all' ? true : todoStatus === 'pending' ? item.state === 'pending' : item.state === todoStatus;
      const createdMatch =
        todoCreatedFilter === '7d' ? item.age <= 7 : todoCreatedFilter === '30d' ? item.age <= 30 : true;

      return navMatch && typeMatch && statusMatch && createdMatch;
    });
  }, [todoStateList, todoNav, todoTypeFilter, todoStatus, todoCreatedFilter]);

  const todoPageCount = Math.max(1, Math.ceil(filteredTodos.length / todoPageSize));
  const safeTodoPage = Math.min(todoPage, todoPageCount);
  const pagedTodos = filteredTodos.slice((safeTodoPage - 1) * todoPageSize, safeTodoPage * todoPageSize);

  const currentAnnouncement = messageState.find((item) => item.id === announcementId) || null;
  const currentActionMessage = actionSource?.kind === 'message' ? messageState.find((item) => item.id === actionSource.id) || null : null;
  const currentActionTodo = actionSource?.kind === 'todo' ? todoStateList.find((item) => item.id === actionSource.id) || null : null;
  const currentCloseTodo = closeTarget ? todoStateList.find((item) => item.id === closeTarget) || null : null;

  function showToast(text: string) {
    setToast(text);
    window.setTimeout(() => setToast(''), 2200);
  }

  function markMessageRead(id: string) {
    setMessageState((list) => list.map((item) => (item.id === id ? { ...item, unread: false } : item)));
  }

  function openMessageAction(id: string) {
    markMessageRead(id);
    setActionSource({ kind: 'message', id });
  }

  function openAnnouncement(id: string) {
    markMessageRead(id);
    setAnnouncementId(id);
  }

  function markAllReadByCategory(category: MessageTab) {
    setMessageState((list) =>
      list.map((item) => {
        const match = category === '全部消息' || item.category === category;
        return match ? { ...item, unread: false } : item;
      }),
    );
    showToast(`${category === '全部消息' ? '全部通知' : `${category}通知`}已标记为已读`);
  }

  function closeAllTodosByCategory(category: TodoPanelCategory) {
    setTodoStateList((list) =>
      list.map((item) => {
        const match = item.category === category && item.state === 'pending' && item.age <= 7;
        return match ? { ...item, state: 'closed' } : item;
      }),
    );
    showToast(`${category}下的待办已全部关闭`);
  }

  function closeTodoConfirm() {
    if (!closeTarget) return;
    setTodoStateList((list) => list.map((item) => (item.id === closeTarget ? { ...item, state: 'closed' } : item)));
    setCloseTarget(null);
    showToast(`待办已关闭：${closeReason}`);
  }

  function completeTodo(id: string) {
    setTodoStateList((list) => list.map((item) => (item.id === id ? { ...item, state: 'completed' } : item)));
    setActionSource(null);
    showToast('业务状态已更新，待办已自动完结');
  }

  function switchMessageTab(next: MessageTab) {
    setMessageTab(next);
    setMessageTypeFilter('全部');
    setMessagePage(1);
  }

  function switchUnreadOnly(next: boolean) {
    setMessageUnreadOnly(next);
    setMessagePage(1);
  }

  function switchMessageType(next: MessageTypeFilter) {
    setMessageTypeFilter(next);
    setMessagePage(1);
  }

  function switchMessagePageSize(next: number) {
    setMessagePageSize(next);
    setMessagePage(1);
  }

  function switchTodoStatus(next: TodoStatusTab) {
    setTodoStatus(next);
    setTodoPage(1);
  }

  function switchTodoNav(next: TodoNav) {
    setTodoNav(next);
    setTodoTypeFilter('全部');
    setTodoPage(1);
  }

  function switchTodoType(next: TodoTypeFilter) {
    setTodoTypeFilter(next);
    setTodoPage(1);
  }

  function switchTodoPageSize(next: number) {
    setTodoPageSize(next);
    setTodoPage(1);
  }

  function switchTodoCreatedFilter(next: TodoCreatedFilter) {
    setTodoCreatedFilter(next);
    setTodoPage(1);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <i></i>
            <b>马</b>
          </span>
          <strong>雕马商家管理系统</strong>
        </div>
        <nav className="top-nav" aria-label="主导航">
          <button className="active">店铺</button>
          <button>商城</button>
          <button>CRM 客户关系管理</button>
          <button>商学院</button>
          <button>工单</button>
          <button>自营店铺</button>
        </nav>
        <div className="top-actions">
          <span className="env">测试环境</span>
          <button className="assistant-icon" title="智能助手">
            AI
          </button>
          <button
            className={`nav-trigger message-trigger ${panel === 'message' ? 'selected' : ''}`}
            onClick={() => {
              setPanel(panel === 'message' ? null : 'message');
              setMessagePanelCategory('订单');
              setMessagePanelUnreadOnly(false);
            }}
            aria-label="打开消息通知"
          >
            <span className="bell-icon" aria-hidden="true"></span>
            {messageTopCount > 0 && <span className="badge badge-orange">{fmtCount(messageTopCount)}</span>}
          </button>
          <button
            className={`nav-trigger todo-trigger ${panel === 'todo' ? 'selected' : ''}`}
            onClick={() => {
              setPanel(panel === 'todo' ? null : 'todo');
              setTodoPanelCategory('订单');
            }}
            aria-label="打开待办"
          >
            <span className="todo-entry-text">待办</span>
            {todoTopCount > 0 && <span className="badge badge-red">{fmtCount(todoTopCount)}</span>}
          </button>
          <span className="user">13527884130　⌄</span>
        </div>
      </header>

      <aside className="sidebar">
        <div className="side-section">
          <span>◔</span> 数据 <small>⌃</small>
        </div>
        <div className="side-item static">概况</div>
        <div className="side-section">
          <span>▤</span> 账单管理 <small>⌄</small>
        </div>
        <div className="side-section">
          <span>▣</span> 店铺营销 <small>⌄</small>
        </div>
        <div className="side-section">
          <span>⚙</span> 店铺管理 <small>⌄</small>
        </div>
        <div className="side-section">
          <span>▢</span> 消息中心 <small>⌃</small>
        </div>
        <button className={`side-item ${view === 'message' ? 'active' : ''}`} onClick={() => setView('message')}>
          消息通知
        </button>
        <button className={`side-item ${view === 'todo' ? 'active' : ''}`} onClick={() => setView('todo')}>
          待办中心
        </button>
        <button className={`side-item ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>
          系统订阅配置
        </button>
        <button className="side-item">活动报名</button>
      </aside>

      <section className="workspace">
        <div className="breadcrumb">
          <span className="hamburger">☰</span>　消息中心　/　<em>{view === 'message' ? '消息通知' : view === 'todo' ? '待办中心' : '系统订阅配置'}</em>
        </div>

        {view === 'message' && (
          <MessageCenter
            messages={messageState}
            tab={messageTab}
            typeFilter={messageTypeFilter}
            unreadOnly={messageUnreadOnly}
            filtered={pagedMessages}
            page={safeMessagePage}
            pageCount={messagePageCount}
            total={filteredMessages.length}
            pageSize={messagePageSize}
            onTab={switchMessageTab}
            onTypeFilter={switchMessageType}
            onUnreadOnly={switchUnreadOnly}
            onPage={setMessagePage}
            onPageSize={switchMessagePageSize}
            onRead={markMessageRead}
            onReadAll={() => setBulkAction({ kind: 'message', category: messageTab })}
            onAction={openMessageAction}
            onAnnouncement={openAnnouncement}
          />
        )}

        {view === 'todo' && (
          <TodoCenter
            todos={todoStateList}
            filtered={pagedTodos}
            nav={todoNav}
            typeFilter={todoTypeFilter}
            status={todoStatus}
            createdFilter={todoCreatedFilter}
            page={safeTodoPage}
            pageCount={todoPageCount}
            total={filteredTodos.length}
            pageSize={todoPageSize}
            stats={{
              recent: todoStateList.filter((item) => item.state === 'pending' && item.age <= 7).length,
              long: todoStateList.filter((item) => item.state === 'pending' && item.age > 7).length,
              closed: todoStateList.filter((item) => item.state === 'closed').length,
              completed: todoStateList.filter((item) => item.state === 'completed').length,
            }}
            now={now}
            onNav={switchTodoNav}
            onTypeFilter={switchTodoType}
            onStatus={switchTodoStatus}
            onCreatedFilter={switchTodoCreatedFilter}
            onPage={setTodoPage}
            onPageSize={switchTodoPageSize}
            onAction={(id) => setActionSource({ kind: 'todo', id })}
            onClose={setCloseTarget}
          />
        )}

        {view === 'settings' && (
          <SettingsPage
            settingsTab={settingsTab}
            onSettingsTab={setSettingsTab}
            notificationSettings={notificationSettings}
            todoReminderSettings={todoReminderSettings}
            openNoticeSections={openNoticeSections}
            openTodoSections={openTodoSections}
            strongReminder={strongReminder}
            strongReminderMinutes={strongReminderMinutes}
            onToggleNoticeSection={(key) => setOpenNoticeSections((state) => ({ ...state, [key]: !state[key] }))}
            onToggleTodoSection={(key) => setOpenTodoSections((state) => ({ ...state, [key]: !state[key] }))}
            onToggleNotification={(item) => {
              setNotificationSettings((state) => ({
                ...state,
                [item]: !state[item],
              }));
              showToast('通知提醒已自动保存');
            }}
            onToggleTodoReminder={(item) => {
              setTodoReminderSettings((state) => ({
                ...state,
                [item]: !state[item],
              }));
              showToast('待办提醒已自动保存');
            }}
            onBatchNotification={(items, next) => {
              setNotificationSettings((state) => ({
                ...state,
                ...Object.fromEntries(items.map((item) => [item, next])),
              }));
              showToast(next ? '通知提醒已全部开启' : '通知提醒已全部关闭');
            }}
            onBatchTodo={(items, next) => {
              setTodoReminderSettings((state) => ({
                ...state,
                ...Object.fromEntries(items.map((item) => [item, next])),
              }));
              showToast(next ? '待办提醒已全部开启' : '待办提醒已全部关闭');
            }}
            onStrongReminder={(next) => {
              setStrongReminder(next);
              showToast(next ? '强提醒已开启' : '强提醒已关闭');
            }}
            onStrongReminderMinutes={(next) => {
              setStrongReminderMinutes(next);
              showToast(`强提醒时间已更新为 ${next || '0'} 分钟`);
            }}
          />
        )}
      </section>

      {panel === 'message' && (
        <MessageQuickPanel
          onSubscribe={() => { setView('settings'); setPanel(null); }}
          category={messagePanelCategory}
          unreadOnly={messagePanelUnreadOnly}
          messages={messageState}
          onCategory={setMessagePanelCategory}
          onUnreadOnly={setMessagePanelUnreadOnly}
          onClose={() => setPanel(null)}
          onAll={() => {
            setView('message');
            setPanel(null);
          }}
          onRead={markMessageRead}
          onReadAll={() => setBulkAction({ kind: 'message', category: messagePanelCategory })}
          onAction={openMessageAction}
          onAnnouncement={openAnnouncement}
        />
      )}

      {panel === 'todo' && (
        <TodoQuickPanel
          onSubscribe={() => { setView('settings'); setPanel(null); }}
          category={todoPanelCategory}
          todos={todoStateList}
          now={now}
          onCategory={setTodoPanelCategory}
          onClose={() => setPanel(null)}
          onAll={() => {
            setView('todo');
            setPanel(null);
          }}
          onAction={(id) => {
            setView('todo');
            setPanel(null);
            setActionSource({ kind: 'todo', id });
          }}
          onCloseOne={setCloseTarget}
        />
      )}

      {actionSource && (currentActionMessage || currentActionTodo) && (
        <BusinessDrawer
          kind={actionSource.kind}
          message={currentActionMessage}
          todo={currentActionTodo}
          onClose={() => setActionSource(null)}
          onComplete={() => currentActionTodo && completeTodo(currentActionTodo.id)}
        />
      )}

      {currentAnnouncement && <AnnouncementModal item={currentAnnouncement} onClose={() => setAnnouncementId(null)} />}
      {bulkAction && (
        <BulkConfirmModal
          title={bulkAction.kind === 'message' ? '确认标记已读' : '确认关闭全部待办'}
          description={
            bulkAction.kind === 'message'
              ? `确认将【${bulkAction.category}】下的所有通知全部标记为已读？`
              : `确认关闭【${bulkAction.category}】下的全部待办？`
          }
          cancelText={bulkAction.kind === 'message' ? '暂不标记' : '暂不关闭'}
          confirmText={bulkAction.kind === 'message' ? '全部标记已读' : '关闭全部待办'}
          onCancel={() => setBulkAction(null)}
          onConfirm={() => {
            if (bulkAction.kind === 'message') {
              markAllReadByCategory(bulkAction.category);
            } else {
              closeAllTodosByCategory(bulkAction.category);
            }
            setBulkAction(null);
          }}
        />
      )}
      {currentCloseTodo && (
        <CloseTodoModal
          item={currentCloseTodo}
          reason={closeReason}
          onReason={setCloseReason}
          onCancel={() => setCloseTarget(null)}
          onConfirm={closeTodoConfirm}
        />
      )}
      {toast && (
        <div className="toast">
          <span>✓</span>
          {toast}
        </div>
      )}
    </main>
  );
}

function MessageCenter(props: {
  messages: MessageItem[];
  tab: MessageTab;
  typeFilter: MessageTypeFilter;
  unreadOnly: boolean;
  filtered: MessageItem[];
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onTab: (tab: MessageTab) => void;
  onTypeFilter: (value: MessageTypeFilter) => void;
  onUnreadOnly: (next: boolean) => void;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
  onRead: (id: string) => void;
  onReadAll: () => void;
  onAction: (id: string) => void;
  onAnnouncement: (id: string) => void;
}) {
  const getMessageTabCount = (tab: MessageTab) =>
    props.messages.filter((item) => {
      const tabMatch = tab === '全部消息' || item.category === tab;
      return tabMatch && item.unread;
    }).length;

  return (
    <div className="content-card">
      <div className="page-head compact">
        <div>
          <h1>消息通知</h1>
        </div>
      </div>

      <div className="message-center-layout">
        <nav className="message-nav-vertical">
          {messageTabs.map((tab) => {
            const count = getMessageTabCount(tab);
            return (
              <button
                key={tab}
                className={`message-nav-vertical-item ${props.tab === tab ? 'active' : ''}`}
                onClick={() => props.onTab(tab)}
              >
                <span>{tab}</span>
                {count > 0 && <b>{fmtCount(count)}</b>}
              </button>
            );
          })}
        </nav>

        <div className="message-center-main">
          <div className="message-toolbar">
            <div className="message-toolbar-actions">
              <label className="checkbox-line">
                <input type="checkbox" checked={props.unreadOnly} onChange={(event) => props.onUnreadOnly(event.target.checked)} />
                只看未读
              </label>
              <button className="ghost-button" onClick={props.onReadAll}>
                一键已读
              </button>
            </div>
          </div>

          <section className="message-list">
            {props.filtered.map((item) => (
              <article className={`message-row ${item.unread ? 'unread' : ''}`} key={item.id}>
                <div className="message-main">
                  <div className="row-title">
                    <i className={`row-dot ${item.unread ? '' : 'hidden'}`}></i>
                    <strong>{item.title}</strong>
                  </div>
                  <p>{item.content}</p>
                  <div className="inline-actions">
                    {item.detailType === 'announcement' ? (
                      <button className="message-secondary-button" onClick={() => props.onAnnouncement(item.id)}>
                        查看详情
                      </button>
                    ) : (
                      <button className="message-secondary-button" onClick={() => item.title === '用户催发货通知' ? props.onAction(item.id) : props.onRead(item.id)}>
                        查看详情
                      </button>
                    )}
                  </div>
                </div>
                <time>{item.time}</time>
              </article>
            ))}
            {!props.filtered.length && <Empty text="当前筛选下暂无消息" />}
          </section>

          <Pagination total={props.total} page={props.page} pageCount={props.pageCount} pageSize={props.pageSize} onPage={props.onPage} onPageSize={props.onPageSize} />
        </div>
      </div>
    </div>
  );
}

function TodoCenter(props: {
  todos: TodoItem[];
  filtered: TodoItem[];
  nav: TodoNav;
  typeFilter: TodoTypeFilter;
  status: TodoStatusTab;
  createdFilter: TodoCreatedFilter;
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  stats: { recent: number; long: number; closed: number; completed: number };
  now: number;
  onNav: (tab: TodoNav) => void;
  onTypeFilter: (value: TodoTypeFilter) => void;
  onStatus: (tab: TodoStatusTab) => void;
  onCreatedFilter: (value: TodoCreatedFilter) => void;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
  onAction: (id: string) => void;
  onClose: (id: string) => void;
}) {
  const statCards = [
    { key: 'recent', label: '近7天待办', value: props.stats.recent, tone: 'red', glyph: '⌛' },
    { key: 'long', label: '长期未处理', value: props.stats.long, tone: 'orange', glyph: '⏰' },
    { key: 'closed', label: '已关闭', value: props.stats.closed, tone: 'gray', glyph: '⊘' },
    { key: 'completed', label: '已完结', value: props.stats.completed, tone: 'green', glyph: '✓' },
  ] as const;
  const navTabs: TodoNav[] = ['全部', '订单', '店铺'];
  const typeOptions = [
    { label: '全部', value: '全部' },
    ...(props.nav === '全部'
      ? todoTypeEntries.map((entry) => ({ label: entry.filterType, value: entry.filterType }))
      : todoTypeOptions[props.nav].map((filterType) => ({ label: filterType, value: filterType }))),
  ];
  const typeValues = typeOptions.map((option) => option.value);
  const statusTabs: { key: TodoStatusTab; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待处理' },
    { key: 'closed', label: '已关闭' },
    { key: 'completed', label: '已完结' },
  ];
  const createdTabs: { key: TodoCreatedFilter; label: string }[] = [
    { key: '7d', label: '近7天内' },
    { key: '30d', label: '近30天内' },
    { key: 'all', label: '全部' },
  ];
  const getTodoTabCount = (tab: TodoNav) =>
    props.todos.filter((item) => item.state === 'pending' && item.age <= 7 && (tab === '全部' || item.category === tab)).length;

  return (
    <div className="content-card">
      <div className="page-head compact">
        <div>
          <h1>待办中心</h1>
        </div>
      </div>

      <div className="todo-stat-grid">
        {statCards.map((card) => (
          <article className={`todo-stat-card ${card.tone}`} key={card.key}>
            <span className="todo-stat-icon" aria-hidden>
              <em>{card.glyph}</em>
            </span>
            <div className="todo-stat-meta">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
          </article>
        ))}
      </div>

      <div className="todo-center-layout">
        <nav className="todo-nav-vertical">
          {navTabs.map((tab) => {
            const count = getTodoTabCount(tab);
            return (
              <button
                key={tab}
                className={`todo-nav-vertical-item ${props.nav === tab ? 'active' : ''}`}
                onClick={() => props.onNav(tab)}
              >
                <span>{tab}</span>
                {count > 0 && <b>{fmtCount(count)}</b>}
              </button>
            );
          })}
        </nav>

        <div className="todo-center-main">
          <div className="todo-filter-bar">
            <div className="todo-filter-group wide">
              <label className="filter-select inline-select">
                <span>所有待办：</span>
                <select value={typeValues.includes(props.typeFilter) ? props.typeFilter : '全部'} onChange={(event) => props.onTypeFilter(event.target.value)}>
                  {typeOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="todo-filter-group">
              <span>状态：</span>
              {statusTabs.map((tab) => (
                <button key={tab.key} className={props.status === tab.key ? 'active' : ''} onClick={() => props.onStatus(tab.key)}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="todo-filter-group">
              <span>待办创建时间：</span>
              {createdTabs.map((tab) => (
                <button key={tab.key} className={props.createdFilter === tab.key ? 'active' : ''} onClick={() => props.onCreatedFilter(tab.key)}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <section className="todo-list">
            {props.filtered.map((item) => {
              const urgent = item.filterType === '账单逾期处理' || item.filterType === '逾期未归还';
              return (
              <article className={`todo-card ${item.state !== 'pending' ? 'muted' : ''} ${urgent ? 'urgent' : ''}`} key={item.id}>
                <div className="todo-card-content">
                  <strong>{item.title}</strong>
                  <p>{item.content}</p>
                  <div className="todo-card-meta">
                    <TodoCountdown item={item} now={props.now} compact />
                  </div>
                </div>
                <div className="todo-card-actions">
                  <time className="todo-card-time">{item.time}</time>
                  <div className="todo-card-buttons">
                    {item.state === 'pending' ? (
                      <>
                        <button className="primary-button" onClick={() => props.onAction(item.id)}>
                          {item.actionLabel}
                        </button>
                        <button className="ghost-button" onClick={() => props.onClose(item.id)}>
                          关闭待办
                        </button>
                      </>
                    ) : (
                      <span className={`todo-finish ${item.state}`}>{item.state === 'closed' ? '已关闭' : '已完结'}</span>
                    )}
                  </div>
                </div>
              </article>
              );
            })}
            {!props.filtered.length && <Empty text="当前筛选下暂无待办" />}
          </section>

          <Pagination total={props.total} page={props.page} pageCount={props.pageCount} pageSize={props.pageSize} onPage={props.onPage} onPageSize={props.onPageSize} />
        </div>
      </div>
    </div>
  );
}

function SettingsPage(props: {
  settingsTab: SettingsTab;
  onSettingsTab: (tab: SettingsTab) => void;
  notificationSettings: Record<string, boolean>;
  todoReminderSettings: Record<string, boolean>;
  openNoticeSections: Record<NotificationGroupKey, boolean>;
  openTodoSections: Record<TodoGroupKey, boolean>;
  strongReminder: boolean;
  strongReminderMinutes: string;
  onToggleNoticeSection: (key: NotificationGroupKey) => void;
  onToggleTodoSection: (key: TodoGroupKey) => void;
  onToggleNotification: (item: string) => void;
  onToggleTodoReminder: (item: string) => void;
  onBatchNotification: (items: string[], next: boolean) => void;
  onBatchTodo: (items: string[], next: boolean) => void;
  onStrongReminder: (next: boolean) => void;
  onStrongReminderMinutes: (next: string) => void;
}) {
  const notificationItems = notificationSections.flatMap((section) => section.items);
  const todoReminderItems = todoSections.flatMap((section) => section.items);
  const allNotificationsEnabled = notificationItems.every((item) => props.notificationSettings[item]);
  const allTodoRemindersEnabled = todoReminderItems.every((item) => props.todoReminderSettings[item]);

  return (
    <div className="content-card">
      {
        notificationSections.length > 0 || todoSections.length > 0 ? (
          <MessageChannelSettings notices={notificationSections} todos={todoSections} />
        ) : (
          <Empty text="暂无订阅配置项" />
        )
      }
    </div>
  );
}

function SettingAccordion(props: {
  title: string;
  subtitle: string;
  icon: string;
  open: boolean;
  items: string[];
  values: Record<string, boolean>;
  onToggleItem: (item: string) => void;
}) {
  return (
    <article className={`accordion-card ${props.open ? 'open' : ''}`}>
      <div className="accordion-head">
        <div className="accordion-open">
          <div className="accordion-title">
            <span>{props.icon}</span>
            <div>
              <strong>{props.title}</strong>
              <p>{props.subtitle}</p>
            </div>
          </div>
        </div>
      </div>
      {props.open && (
        <div className="accordion-body">
          <div className="switch-list">
            {props.items.map((item) => (
              <div className="switch-row" key={item}>
                <span>{item}</span>
                <button className={`switch ${props.values[item] ? 'on' : ''}`} onClick={() => props.onToggleItem(item)}>
                  <i></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function MessageQuickPanel(props: {
  onSubscribe: () => void;
  category: Category;
  unreadOnly: boolean;
  messages: MessageItem[];
  onCategory: (category: Category) => void;
  onUnreadOnly: (next: boolean) => void;
  onClose: () => void;
  onAll: () => void;
  onRead: (id: string) => void;
  onReadAll: () => void;
  onAction: (id: string) => void;
  onAnnouncement: (id: string) => void;
}) {
  const recentMessages = props.messages.filter((item) => item.age <= 7);
  const visible = recentMessages.filter((item) => item.category === props.category && (!props.unreadOnly || item.unread));

  return (
    <section className="quick-panel message-panel">
      <div className="panel-head">
        <div>
          <strong>通知</strong>
          <span>仅展示近 7 天</span>
        </div>
        <div className="panel-head-actions"><button className="panel-subscribe" onClick={props.onSubscribe}>通知订阅</button><button aria-label="关闭面板" onClick={props.onClose}>×</button></div>
      </div>

      <div className="panel-tabs">
        {messageCategories.map((category) => {
          const count = props.messages.filter((item) => item.category === category && item.unread).length;
          return (
            <button key={category} className={props.category === category ? 'active' : ''} onClick={() => props.onCategory(category)}>
              {category}
              {count > 0 && <b>{fmtCount(count)}</b>}
            </button>
          );
        })}
      </div>

      <div className="panel-toolbar">
        <label className="checkbox-line">
          <input type="checkbox" checked={props.unreadOnly} onChange={(event) => props.onUnreadOnly(event.target.checked)} />
          只看未读
        </label>
        <button className="ghost-button mini" onClick={props.onReadAll}>
          一键已读
        </button>
      </div>

      <div className="quick-list">
        {visible.map((item) => (
          <article className="notice-card" key={item.id}>
            <div className="notice-main">
              <div className={`notice-title-line ${item.unread ? 'message-title-line unread-title-line' : 'message-title-line'}`}>
                {item.unread && <span className="notice-dot"></span>}
                <strong>{item.title}</strong>
                <time>{item.time}</time>
              </div>
              <p>{item.content}</p>
              <div className="notice-actions under">
                <button
                  className="process"
                  onClick={() => (item.detailType === 'announcement' ? props.onAnnouncement(item.id) : item.title === '用户催发货通知' ? props.onAction(item.id) : props.onRead(item.id))}
                >
                  查看详情
                </button>
              </div>
            </div>
          </article>
        ))}
        {!visible.length && <Empty text="当前筛选下暂无消息" />}
      </div>

      <div className="panel-footer">
        <button className="view-all" onClick={props.onAll}>
          查看全部
        </button>
      </div>
    </section>
  );
}

function TodoQuickPanel(props: {
  onSubscribe: () => void;
  category: TodoPanelCategory;
  todos: TodoItem[];
  now: number;
  onCategory: (category: TodoPanelCategory) => void;
  onClose: () => void;
  onAll: () => void;
  onAction: (id: string) => void;
  onCloseOne: (id: string) => void;
}) {
  const visible = props.todos.filter((item) => item.category === props.category && item.age <= 7 && item.state === 'pending');
  const getCategoryCount = (category: TodoPanelCategory) =>
    props.todos.filter((item) => item.category === category && item.age <= 7 && item.state === 'pending').length;

  return (
    <section className="quick-panel todo-panel">
      <div className="panel-head">
        <div>
          <strong>待办</strong>
          <span>仅展示近 7 天</span>
        </div>
        <div className="panel-head-actions"><button className="panel-subscribe" onClick={props.onSubscribe}>待办订阅</button><button aria-label="关闭面板" onClick={props.onClose}>×</button></div>
      </div>

      <div className="panel-tabs todo-tabs">
        {todoPanelCategories.map((category) => {
          const count = getCategoryCount(category);

          return (
            <button key={category} className={props.category === category ? 'active' : ''} onClick={() => props.onCategory(category)}>
              {category}
              {count > 0 && <b>{fmtCount(count)}</b>}
            </button>
          );
        })}
      </div>

      <div className="quick-list">
        {visible.map((item) => (
          <article className="notice-card todo-card-panel" key={item.id}>
            <div className="notice-main">
              <div className="notice-title-line">
                <strong>{item.title}</strong>
                <time>{item.time}</time>
              </div>
              <p>{item.content}</p>
              <div className="todo-panel-action-line">
                <TodoPanelCountdown item={item} now={props.now} />
                <div className="notice-actions under">
                  <button className="process danger" onClick={() => props.onAction(item.id)} disabled={item.state !== 'pending'}>
                    {item.actionLabel}
                  </button>
                  <button className="minor-action" onClick={() => props.onCloseOne(item.id)} disabled={item.state !== 'pending'}>
                    关闭待办
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
        {!visible.length && <Empty text="当前分类下暂无待办" />}
      </div>

      <div className="panel-footer">
        <button className="view-all" onClick={props.onAll}>
          查看全部
        </button>
      </div>
    </section>
  );
}

function BusinessDrawer(props: {
  kind: 'message' | 'todo';
  message: MessageItem | null;
  todo: TodoItem | null;
  onClose: () => void;
  onComplete: () => void;
}) {
  const source = props.kind === 'message' ? props.message : props.todo;
  if (!source) return null;

  return (
    <>
      <div className="overlay" onClick={props.onClose}></div>
      <aside className="drawer business-drawer">
        <div className="drawer-head">
          <div>
            <span className="prototype-tag">业务页面模拟</span>
            <h2>{'route' in source ? source.route : '业务详情'}</h2>
            <p>已携带定位参数进入目标页面，用于验证消息跳转与待办状态监听。</p>
          </div>
          <button onClick={props.onClose}>×</button>
        </div>
        <div className="route-box">
          <span>页面路径</span>
          <b>{'route' in source ? source.route : '无跳转页面'}</b>
          <span>筛选参数</span>
          <code>{'params' in source ? source.params : '—'}</code>
        </div>
        <section className="business-card">
          <header>
            <div>
              <small>业务编号</small>
              <strong>{source.id}</strong>
            </div>
            <span>{props.kind === 'message' ? '消息触发' : '待办处理中'}</span>
          </header>
          <h3>{source.title}</h3>
          <p>{source.content}</p>
          <div className="timeline">
            <i className="done"></i>
            <b>业务事件已触发</b>
            <span></span>
            <i className="active"></i>
            <b>当前处理节点</b>
            <span></span>
            <i></i>
            <b>业务流程完结</b>
          </div>
        </section>
        <div className="business-tip">这是交互原型页面，不会写入真实业务数据，但可用于确认页面跳转与待办完结路径。</div>
        <footer>
          <button className="ghost-button" onClick={props.onClose}>
            返回
          </button>
          {props.kind === 'todo' && (
            <button className="primary-button" onClick={props.onComplete}>
              模拟完成业务
            </button>
          )}
        </footer>
      </aside>
    </>
  );
}

function AnnouncementModal(props: { item: MessageItem; onClose: () => void }) {
  return (
    <>
      <div className="overlay modal-overlay" onClick={props.onClose}></div>
      <section className="modal announcement-modal">
        <header>
          <div>
            <h2>{props.item.title}</h2>
            <p>
              {props.item.category} · {props.item.time}
            </p>
          </div>
          <button onClick={props.onClose}>×</button>
        </header>
        <div className="announcement-body">
          <p>{props.item.content}</p>
          <p>这里用于承接运营后台富文本发布内容的预览弹窗。正式开发时可替换为富文本详情或公告正文渲染区域。</p>
        </div>
        <footer>
          <button className="primary-button" onClick={props.onClose}>
            我知道了
          </button>
        </footer>
      </section>
    </>
  );
}

function CloseTodoModal(props: {
  item: TodoItem;
  reason: string;
  onReason: (reason: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <div className="overlay modal-overlay" onClick={props.onCancel}></div>
      <section className="modal">
        <header>
          <h2>关闭待办</h2>
          <button onClick={props.onCancel}>×</button>
        </header>
        <div className="warning-box">
          <b>关闭后，该待办将移入“已关闭”</b>
          <p>不会改变关联业务状态；操作原因会被保留，用于后续评估该事件是否只保留为消息通知。</p>
        </div>
        <label className="field-label">
          待办事项
          <input value={props.item.title} disabled />
        </label>
        <fieldset>
          <legend>
            关闭原因 <em>*</em>
          </legend>
          {closeReasons.map((reason) => (
            <label key={reason}>
              <input type="radio" checked={props.reason === reason} onChange={() => props.onReason(reason)} />
              {reason}
            </label>
          ))}
        </fieldset>
        <footer>
          <button className="ghost-button" onClick={props.onCancel}>
            取消
          </button>
          <button className="danger-button" onClick={props.onConfirm}>
            确认关闭
          </button>
        </footer>
      </section>
    </>
  );
}

function BulkConfirmModal(props: {
  title: string;
  description: string;
  cancelText: string;
  confirmText: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <div className="overlay modal-overlay" onClick={props.onCancel}></div>
      <section className="modal bulk-modal">
        <header>
          <h2>{props.title}</h2>
          <button onClick={props.onCancel}>×</button>
        </header>
        <div className="bulk-body">
          <p>{props.description}</p>
        </div>
        <footer>
          <button className="ghost-button" onClick={props.onCancel}>
            {props.cancelText}
          </button>
          <button className="primary-button" onClick={props.onConfirm}>
            {props.confirmText}
          </button>
        </footer>
      </section>
    </>
  );
}

function Pagination(props: {
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  const [jumpValue, setJumpValue] = useState(String(props.page));
  const [syncedPage, setSyncedPage] = useState(props.page);
  const pages = getVisiblePages(props.page, props.pageCount);

  // 页码由外部变化时同步输入框，避免在 effect 里 setState 造成级联渲染。
  if (props.page !== syncedPage) {
    setSyncedPage(props.page);
    setJumpValue(String(props.page));
  }

  return (
    <div className="pagination-bar">
      <div className="pagination-total">共 {props.total} 条</div>
      <label className="page-size-select">
        <select value={props.pageSize} onChange={(event) => props.onPageSize(Number(event.target.value))}>
          <option value={10}>10条/页</option>
          <option value={20}>20条/页</option>
          <option value={50}>50条/页</option>
        </select>
      </label>
      <button className="pager-arrow" disabled={props.page <= 1} onClick={() => props.onPage(props.page - 1)} aria-label="上一页">
        ‹
      </button>
      <div className="page-numbers">
        {pages.map((page) => (
          <button key={page} className={props.page === page ? 'active' : ''} onClick={() => props.onPage(page)}>
            {page}
          </button>
        ))}
      </div>
      <button className="pager-arrow" disabled={props.page >= props.pageCount} onClick={() => props.onPage(props.page + 1)} aria-label="下一页">
        ›
      </button>
      <div className="page-jump">
        <span>前往</span>
        <input
          value={jumpValue}
          onChange={(event) => setJumpValue(event.target.value.replace(/[^\d]/g, ''))}
          onBlur={() => {
            const next = Number(jumpValue);
            if (!next) {
              setJumpValue(String(props.page));
              return;
            }
            const safePage = Math.min(Math.max(next, 1), props.pageCount);
            props.onPage(safePage);
            setJumpValue(String(safePage));
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              const next = Number(jumpValue);
              const safePage = Math.min(Math.max(next || props.page, 1), props.pageCount);
              props.onPage(safePage);
              setJumpValue(String(safePage));
            }
          }}
        />
        <span>页</span>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <span>□</span>
      <p>{text}</p>
    </div>
  );
}

function TodoCountdown({ item, now, compact = false }: { item: TodoItem; now: number; compact?: boolean }) {
  if (item.state !== 'pending') return null;

  const time = formatTodoCountdown(item, now);

  if (compact) {
    return (
      <span className="todo-countdown-compact">
        {time ? <>剩余 <b className="todo-countdown-time">{time}</b> 未处理</> : <>长期未处理</>}
      </span>
    );
  }

  return (
    <div className="todo-countdown-line">
      {time ? (
        <>
          <span>剩余</span>
          <em>{time}</em>
          <span>未处理，系统将自动更改待办到长期未处理状态</span>
        </>
      ) : (
        <em>长期未处理</em>
      )}
    </div>
  );
}

// 快捷弹窗空间有限，保留简短内联格式，避免长文案撑破 flex 布局。
function TodoPanelCountdown({ item, now }: { item: TodoItem; now: number }) {
  if (item.state !== 'pending') return null;

  const time = formatTodoCountdown(item, now);

  return <span className="todo-countdown">{time ? `剩余 ${time}` : '长期未处理'}</span>;
}

function formatTodoCountdown(item: TodoItem, now: number) {
  const createdAt = item.createdAt || now - item.age * dayMs;
  const remaining = createdAt + 7 * dayMs - now;

  if (remaining <= 0) return '';

  const totalMinutes = Math.max(1, Math.ceil(remaining / (60 * 1000)));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}天${hours}小时`;
  if (hours > 0) return `${hours}小时${minutes}分钟`;
  return `${minutes}分钟`;
}

function getMessageFilterType(item: MessageItem) {
  if (item.category === '活动通知') return '活动通知';
  if (item.category === '平台公告') return '平台公告';
  if (item.title === '订单接单提醒') return '订单接单提醒';
  if (item.title === '商家订单确认归还通知') return '商家订单确认归还';
  if (item.title === '用户投诉待处理') return '用户投诉';
  if (item.title === '数字签名开通提醒') return '待开通数字签名';
  return item.title;
}

function getVisiblePages(page: number, pageCount: number) {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const start = Math.max(1, Math.min(page - 3, pageCount - 6));
  return Array.from({ length: 7 }, (_, index) => start + index);
}

function buildMessageDataset(targetCount: number): MessageItem[] {
  return Array.from({ length: targetCount }, (_, index) => {
    const example = notificationExamples[index % notificationExamples.length];
    return { ...example, id: `NOTICE-${index + 1}`, unread: index % 4 !== 3,
      time: index % 5 === 0 ? '今天 15:12' : `${index % 5}天前 11:26`, age: index % 5,
      detailType: example.category === '活动通知' || example.category === '平台公告' ? 'announcement' : 'action' };
  });
}

function buildTodoDataset(targetCount: number): TodoItem[] {
  const entries = [...todoTypeEntries, { category: '订单' as const, filterType: '用户归还商品待确认' }];
  return Array.from({ length: targetCount }, (_, index) => {
    const entry = entries[index % entries.length];
    const state = index < entries.length ? 'pending' : index % 5 === 0 ? 'completed' : index % 5 === 1 ? 'closed' : 'pending';
    const age = index < entries.length ? index % 5 : 8 + index % 7;
    return {
      ...getTodoExample(entry.filterType, index, index % entries.length === entries.length - 1),
      id: `TODO-${index + 1}`, category: entry.category, filterType: entry.filterType,
      title: entry.filterType, time: age === 0 ? '今天 14:18' : `${age}天前 14:18`,
      createdAt: Date.now() - age * dayMs - 37 * 60 * 1000,
      age, state,
    };
  });
}
