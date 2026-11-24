import { button, confirmAction, el, notify, openDialog } from './dom.js';

export function googleCalendarButton({ api, user }) {
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
        const { url } = await api('/google-calendar/connect', 'POST');
        window.location.assign(url);
      }
      const reconnectError = el('p', { class: 'form-error', role: 'alert' });
      openDialog({
        title: 'Google Календарь',
        description: state.connected
          ? state.lastSynced ? `Последняя синхронизация: ${new Date(state.lastSynced).toLocaleString('ru-KZ')}` : 'Подключение активно. Расписание готовится к отправке.'
          : user.role === 'admin' ? 'В Google появится отдельный календарь с опубликованным расписанием всех групп.'
            : 'В Google появится отдельный календарь с вашими опубликованными занятиями.',
        fields: state.failed && el('div', {},
          el('p', { class: 'form-error' }, 'Последняя синхронизация завершилась ошибкой.'),
          button('Подключить заново', () => connect().catch((error) => { reconnectError.textContent = error.message; })), reconnectError),
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
  });
}
