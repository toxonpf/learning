import { button, el, icon, notify, openDialog } from './dom.js';

let stopWaiting;

export function openGoogleCalendarLink() {
  return el('a', { class: 'button', href: 'https://calendar.google.com/calendar/',
    target: '_blank', rel: 'noopener noreferrer' }, icon('external'), 'Открыть в Google');
}

export function googleCalendarButton({ api, user }, showCalendar) {
  return button('Google Календарь', async (event) => {
    const trigger = event.currentTarget;
    trigger.disabled = true;
    try {
      const state = await api('/google-calendar');
      if (!state.enabled) {
        openDialog({ title: 'Google Календарь', description: 'Для подключения администратору сервера нужно настроить Google OAuth.',
          fields: el('a', { href: '/google-calendar-guide.html', target: '_blank', rel: 'noopener' }, 'Гайд по подключению') });
        return;
      }
      async function connect() {
        const popup = window.open('about:blank', '_blank', 'popup,width=520,height=680');
        if (!popup) throw new Error('Разрешите всплывающие окна для платформы и повторите подключение.');
        try {
          const { url } = await api('/google-calendar/connect', 'POST', { popup: true });
          const flow = new URL(url).searchParams.get('state');
          stopWaiting?.();
          const channel = new BroadcastChannel('pm4-google-calendar');
          const done = () => { clearTimeout(expiry); channel.close(); stopWaiting = null; };
          const expiry = setTimeout(done, 600_000);
          stopWaiting = done;
          channel.onmessage = ({ data }) => {
            if (data?.flow !== flow) return;
            done();
            notify(data.result === 'connected' ? 'Google Календарь подключён. Расписание отправляется автоматически.'
              : 'Подключение Google не завершено. Его можно повторить.');
          };
          popup.opener = null;
          popup.location.replace(url);
        } catch (error) {
          popup.close();
          throw error;
        }
      }
      const reconnectError = el('p', { class: 'form-error', role: 'alert' });
      openDialog({
        title: 'Google Календарь',
        description: state.connected
          ? state.lastSynced ? `Последняя синхронизация: ${new Date(state.lastSynced).toLocaleString('ru-KZ')}` : 'Подключение активно. Расписание готовится к отправке.'
          : user.role === 'admin' ? 'В Google появится отдельный календарь с опубликованным расписанием всех групп.'
            : 'В Google появится отдельный календарь с вашими опубликованными занятиями.',
        fields: [
          state.embedUrl && el('div', { class: 'row-actions' },
            button('Показать здесь', () => {
              document.getElementById('dialog').close();
              showCalendar(state.embedUrl);
            }, { glyph: 'calendar' }), openGoogleCalendarLink()),
          state.failed && el('div', {},
            el('p', { class: 'form-error' }, 'Последняя синхронизация завершилась ошибкой.'),
            button('Подключить заново', () => connect().catch((error) => { reconnectError.textContent = error.message; })), reconnectError),
        ],
        submitLabel: state.connected ? 'Синхронизировать сейчас' : 'Подключить Google',
        onSubmit: async () => {
          if (state.connected) {
            const result = await api('/google-calendar/sync', 'POST');
            notify(`Синхронизировано занятий: ${result.count}`);
          } else await connect();
        },
        onDelete: state.connected && (() => api('/google-calendar', 'DELETE').then(() => notify('Google Календарь отключён'))),
        deleteLabel: 'Отключить',
        deleteCode: 'GOOGLE',
      });
    } catch (error) {
      openDialog({ title: 'Google Календарь', description: error.message });
    } finally {
      trigger.disabled = false;
    }
  }, { glyph: 'calendar' });
}
